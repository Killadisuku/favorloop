import { createServerFn } from "@tanstack/react-start";
import { actorMiddleware as authMiddleware } from "@/lib/server/actor";
import { getSql } from "@/lib/db";
import type { ChallengeRow, HomePayload, NotifRow, TxRow } from "@/lib/types";
import {
  blockedSet,
  ensureProfile,
  fail,
  loadProfile,
  nid,
  notify,
  num,
  ok,
  parseList,
  reservedCredits,
  syncChallenges,
  toPublic,
  type ProfileRow,
} from "./helpers";
import { loadPostCards } from "./posts";

export const requestComplete = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ postId: String((raw as { postId?: string })?.postId ?? "") }))
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    const sql = await getSql();
    const updated = await sql<{ id: string; user_id: string; title: string }>`
      update posts
      set status = 'pending_confirm'
      where id = ${data.postId}
        and helper_id = ${context.userId}
        and status = 'accepted'
      returning id, user_id, title
    `;
    if (!updated[0]) return fail("Only the helper can request completion on an accepted favor.");
    await notify({
      userId: updated[0].user_id,
      type: "favor_completed",
      title: "Helper marked this done",
      body: `${me.name} asked you to confirm “${updated[0].title}”.`,
      href: `/app/favor/${updated[0].id}`,
    });
    return ok(true);
  });

export const confirmComplete = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ postId: String((raw as { postId?: string })?.postId ?? "") }))
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    const sql = await getSql();
    const posts = await sql<{
      id: string;
      user_id: string;
      helper_id: string | null;
      credit_reward: number;
      status: string;
      title: string;
    }>`select id, user_id, helper_id, credit_reward, status, title from posts where id = ${data.postId} limit 1`;
    const post = posts[0];
    if (!post) return fail("Request not found.");
    if (post.user_id !== context.userId) return fail("Only the requester can confirm completion and move credits.");
    if (post.status === "completed") return fail("Already completed.");
    if (post.status !== "accepted" && post.status !== "pending_confirm") {
      return fail("Accept a helper before completing this favor.");
    }
    const helperId = post.helper_id;
    if (!helperId) return fail("No helper assigned yet.");
    if (helperId === context.userId) return fail("You cannot pay yourself.");
    const reward = num(post.credit_reward);
    const txId = nid("t");
    const paid = await sql.query<{ id: string }>(
      `with debit as (
         update profiles
         set credits = credits - $1,
             favors_received = favors_received + 1,
             updated_at = now()
         where user_id = $2 and credits >= $1
         returning user_id
       ),
       credit as (
         update profiles
         set credits = credits + $1,
             favors_given = favors_given + 1,
             streak = case
               when streak_at = current_date then streak
               when streak_at = current_date - 1 then streak + 1
               else 1
             end,
             streak_at = current_date,
             level = case
               when favors_given + 1 >= 50 then 5
               when favors_given + 1 >= 25 then 4
               when favors_given + 1 >= 10 then 3
               when favors_given + 1 >= 5 then 2
               else 1
             end,
             updated_at = now()
         where user_id = $3 and exists (select 1 from debit)
         returning user_id
       ),
       done as (
         update posts
         set status = 'completed'
         where id = $4
           and user_id = $2
           and helper_id = $3
           and status in ('accepted', 'pending_confirm')
           and exists (select 1 from credit)
         returning id, title
       )
       insert into transactions (id, from_user_id, to_user_id, amount, type, related_favor_id, label, status)
       select $5, $2, $3, $1, 'favor_payout', $4, $6, 'completed'
       where exists (select 1 from done)
       returning id`,
      [reward, context.userId, helperId, post.id, txId, `Helped with ${post.title}`],
    );
    if (!paid[0]) {
      const again = await sql<{ status: string; credits: number }>`
        select p.status, pr.credits
        from posts p join profiles pr on pr.user_id = p.user_id
        where p.id = ${post.id}
      `;
      if (again[0]?.status === "completed") return fail("Already completed.");
      if (num(again[0]?.credits) < reward) return fail("You do not have enough credits to complete this favor.");
      return fail("Could not complete this favor. Try again.");
    }
    await notify({
      userId: helperId,
      type: "credits_received",
      title: `+${reward} credits`,
      body: `${me.name} confirmed “${post.title}”.`,
      href: "/app/wallet",
    });
    await notify({
      userId: context.userId,
      type: "favor_completed",
      title: "Favor completed",
      body: `${reward} credits moved to your helper.`,
      href: `/app/favor/${post.id}`,
    });
    await syncChallenges(helperId);
    await syncChallenges(context.userId);
    return ok({ transferred: reward });
  });

export const getWallet = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await ensureProfile(context.userId);
    await syncChallenges(context.userId);
    const fresh = (await loadProfile(context.userId)) ?? me;
    const reserved = await reservedCredits(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      from_user_id: string | null;
      to_user_id: string;
      amount: number;
      type: string;
      related_favor_id: string | null;
      label: string;
      status: string;
      created_at: string;
    }>`
      select * from transactions
      where to_user_id = ${context.userId} or from_user_id = ${context.userId}
      order by created_at desc
      limit 80
    `;
    const names = await sql<{ user_id: string; name: string }>`
      select user_id, name from profiles
    `;
    const nmap = new Map(names.map((n) => [n.user_id, n.name]));
    const txs: TxRow[] = rows.map((r) => {
      const incoming = r.to_user_id === context.userId;
      const signed = incoming ? num(r.amount) : -num(r.amount);
      const otherId = incoming ? r.from_user_id : r.to_user_id;
      return {
        id: r.id,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id,
        amount: num(r.amount),
        type: r.type,
        relatedFavorId: r.related_favor_id,
        label: r.label,
        status: r.status,
        createdAt: String(r.created_at),
        signedAmount: signed,
        counterparty: otherId ? (nmap.get(otherId) ?? null) : "Onegai",
      };
    });
    const earned = txs.filter((t) => t.signedAmount > 0 && t.type !== "starter").reduce((s, t) => s + t.signedAmount, 0);
    const spent = txs.filter((t) => t.signedAmount < 0).reduce((s, t) => s + Math.abs(t.signedAmount), 0);
    const pending = await sql<{ id: string; title: string; credit_reward: number; status: string }>`
      select id, title, credit_reward, status
      from posts
      where user_id = ${context.userId}
        and type = 'request'
        and status in ('open', 'accepted', 'pending_confirm')
      order by created_at desc
    `;
    return ok({
      credits: num(fresh.credits),
      reserved,
      available: Math.max(0, num(fresh.credits) - reserved),
      earned,
      spent,
      transactions: txs,
      pending: pending.map((p) => ({
        id: p.id,
        title: p.title,
        amount: num(p.credit_reward),
        status: p.status,
      })),
    });
  });

export const getChallenges = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await ensureProfile(context.userId);
    await syncChallenges(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      title: string;
      description: string;
      reward: number;
      goal: number;
      kind: string;
      progress: number | null;
      completed: boolean | null;
      rewarded: boolean | null;
    }>`
      select c.id, c.title, c.description, c.reward, c.goal, c.kind,
             cp.progress, cp.completed, cp.rewarded
      from challenges c
      left join challenge_progress cp
        on cp.challenge_id = c.id and cp.user_id = ${context.userId}
      order by c.goal asc
    `;
    const challenges: ChallengeRow[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      reward: num(r.reward),
      goal: num(r.goal),
      kind: r.kind,
      progress: num(r.progress),
      completed: Boolean(r.completed),
      rewarded: Boolean(r.rewarded),
    }));
    const blocked = await blockedSet(context.userId);
    const people = await sql<{
      user_id: string;
      name: string;
      username: string;
      area: string;
      city: string;
      photo_url: string | null;
      avatar_hue: number;
      favors_given: number;
      reputation: number | string;
      plus: boolean;
      verified: boolean;
    }>`
      select user_id, name, username, area, city, photo_url, avatar_hue, favors_given, reputation, plus, verified
      from profiles
      where onboarding_complete = true
      order by favors_given desc
      limit 40
    `;
    const board = people
      .filter((p) => !blocked.has(p.user_id))
      .map((p) => ({
        userId: p.user_id,
        name: p.name,
        username: p.username,
        area: p.area,
        city: p.city,
        photoUrl: p.photo_url,
        avatarHue: num(p.avatar_hue, 168),
        favorsGiven: num(p.favors_given),
        reputation: num(p.reputation, 70),
        plus: Boolean(p.plus),
        verified: Boolean(p.verified),
        isSelf: p.user_id === context.userId,
      }));
    const fresh = (await loadProfile(context.userId)) ?? me;
    return ok({
      streak: num(fresh.streak),
      level: num(fresh.level),
      challenges,
      leaderboard: board,
    });
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      type: string;
      title: string;
      body: string;
      href: string | null;
      read: boolean;
      created_at: string;
    }>`
      select id, type, title, body, href, read, created_at
      from notifications
      where user_id = ${context.userId}
      order by created_at desc
      limit 80
    `;
    const unread = rows.filter((r) => !r.read).length;
    const notifications: NotifRow[] = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      href: r.href,
      read: Boolean(r.read),
      createdAt: String(r.created_at),
    }));
    return ok({ notifications, unread });
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    await sql`update notifications set read = true where user_id = ${context.userId} and read = false`;
    return ok(true);
  });

export const getHome = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await ensureProfile(context.userId);
    await syncChallenges(context.userId);
    const fresh = (await loadProfile(context.userId)) ?? me;
    const reserved = await reservedCredits(context.userId);
    const blocked = await blockedSet(context.userId);
    const sql = await getSql();
    const mineRows = await sql<{ id: string }>`
      select id from posts where user_id = ${context.userId} and status in ('open','accepted','pending_confirm')
      order by created_at desc limit 8
    `;
    const helpRows = await sql<{ id: string }>`
      select id from posts where helper_id = ${context.userId} and status in ('accepted','pending_confirm')
      order by created_at desc limit 8
    `;
    const recRows = await sql<{ id: string; user_id: string }>`
      select id, user_id from posts
      where status = 'open' and user_id <> ${context.userId}
      order by created_at desc
      limit 40
    `;
    const recIds = recRows.filter((r) => !blocked.has(r.user_id)).slice(0, 6).map((r) => r.id);
    const peopleRows = await sql<ProfileRow>`
      select * from profiles
      where user_id <> ${context.userId} and onboarding_complete = true
      order by favors_given desc
      limit 24
    `;
    const myNeeds = parseList(fresh.need_help_with);
    const mySkills = new Set(parseList(fresh.skills));
    const people = peopleRows
      .filter((p) => !blocked.has(p.user_id))
      .sort((a, b) => {
        const as = parseList(a.skills);
        const bs = parseList(b.skills);
        const ah = as.some((s) => mySkills.has(s) || myNeeds.includes(s)) ? 1 : 0;
        const bh = bs.some((s) => mySkills.has(s) || myNeeds.includes(s)) ? 1 : 0;
        return bh - ah;
      })
      .slice(0, 6)
      .map(toPublic);
    const notif = await sql<{
      id: string;
      type: string;
      title: string;
      body: string;
      href: string | null;
      read: boolean;
      created_at: string;
    }>`
      select id, type, title, body, href, read, created_at
      from notifications where user_id = ${context.userId}
      order by created_at desc limit 8
    `;
    const challenges = await sql<{
      id: string;
      title: string;
      description: string;
      reward: number;
      goal: number;
      kind: string;
      progress: number | null;
      completed: boolean | null;
      rewarded: boolean | null;
    }>`
      select c.id, c.title, c.description, c.reward, c.goal, c.kind, cp.progress, cp.completed, cp.rewarded
      from challenges c
      left join challenge_progress cp on cp.challenge_id = c.id and cp.user_id = ${context.userId}
      order by c.goal
      limit 5
    `;
    const payload: HomePayload = {
      me: {
        ...toPublic(fresh),
        email: fresh.email,
        credits: num(fresh.credits),
        reserved,
        available: Math.max(0, num(fresh.credits) - reserved),
        onboardingComplete: Boolean(fresh.onboarding_complete),
        lat: fresh.lat == null ? null : num(fresh.lat),
        lng: fresh.lng == null ? null : num(fresh.lng),
        circleIds: [],
      },
      openMine: await loadPostCards(mineRows.map((r) => r.id), fresh),
      helping: await loadPostCards(helpRows.map((r) => r.id), fresh),
      recommended: await loadPostCards(recIds, fresh),
      skillMatches: [],
      people,
      notifications: notif.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        href: n.href,
        read: Boolean(n.read),
        createdAt: String(n.created_at),
      })),
      unread: notif.filter((n) => !n.read).length,
      challenges: challenges.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        reward: num(c.reward),
        goal: num(c.goal),
        kind: c.kind,
        progress: num(c.progress),
        completed: Boolean(c.completed),
        rewarded: Boolean(c.rewarded),
      })),
      impact: {
        favorsCompleted: num(fresh.favors_given) + num(fresh.favors_received),
        peopleHelped: num(fresh.favors_given),
        hoursGiven: Math.round(num(fresh.favors_given) * 0.7 * 10) / 10,
        peopleHelpedYou: num(fresh.favors_received),
      },
      circles: [],
    };
    return ok(payload);
  });
