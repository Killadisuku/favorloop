import { createServerFn } from "@tanstack/react-start";
import { actorMiddleware as authMiddleware } from "@/lib/server/actor";
import { getSql } from "@/lib/db";
import { CATEGORIES, MAX_REWARD, MIN_REWARD, TIMES } from "@/lib/constants";
import type { PostCard, ProfilePublic } from "@/lib/types";
import {
  blockedSet,
  ensureProfile,
  fail,
  haversineKm,
  loadProfile,
  nid,
  notify,
  num,
  ok,
  reservedCredits,
  rowsIn,
  toPublic,
  type ProfileRow,
} from "./helpers";

type PostRow = {
  id: string;
  user_id: string;
  type: "request" | "offer";
  title: string;
  description: string;
  category: string;
  city: string;
  area: string;
  lat: number | null;
  lng: number | null;
  estimated_time: string;
  credit_reward: number;
  status: string;
  deadline: string | null;
  boosted_until: string | null;
  helper_id: string | null;
  created_at: string;
};

async function hydrate(
  rows: PostRow[],
  viewer: ProfileRow,
): Promise<PostCard[]> {
  if (rows.length === 0) return [];
  const sql = await getSql();
  const userIds = [...new Set(rows.flatMap((r) => [r.user_id, r.helper_id].filter(Boolean) as string[]))];
  const profiles = await rowsIn<ProfileRow>(`select * from profiles where user_id`, userIds);
  const pmap = new Map(profiles.map((p) => [p.user_id, p]));
  const marks = await sql<{ post_id: string }>`
    select post_id from bookmarks where user_id = ${viewer.user_id}
  `;
  const book = new Set(marks.map((m) => m.post_id));
  const offerCounts = await sql<{ post_id: string; n: number | string }>`
    select post_id, count(*)::int as n from offers
    where status = 'pending'
    group by post_id
  `;
  const countMap = new Map(offerCounts.map((o) => [o.post_id, num(o.n)]));
  const myOffers = await sql<{ post_id: string; status: string }>`
    select post_id, status from offers where helper_id = ${viewer.user_id}
  `;
  const mine = new Map(myOffers.map((o) => [o.post_id, o.status]));
  const from = { lat: viewer.lat, lng: viewer.lng };
  return rows.map((r) => {
    const authorRow = pmap.get(r.user_id);
    const helperRow = r.helper_id ? pmap.get(r.helper_id) : undefined;
    const author: ProfilePublic = authorRow
      ? toPublic(authorRow)
      : {
          userId: r.user_id,
          name: "Neighbor",
          username: "neighbor",
          bio: "",
          city: r.city,
          area: r.area,
          photoUrl: null,
          avatarHue: 168,
          skills: [],
          needHelpWith: [],
          interests: [],
          reputation: 70,
          favorsGiven: 0,
          favorsReceived: 0,
          streak: 0,
          level: 1,
          verified: false,
          plus: false,
          plusStatus: "free",
          createdAt: String(r.created_at),
        };
    return {
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      category: r.category,
      city: r.city,
      area: r.area,
      estimatedTime: r.estimated_time,
      creditReward: num(r.credit_reward),
      status: r.status,
      deadline: r.deadline ? String(r.deadline) : null,
      boostedUntil: r.boosted_until ? String(r.boosted_until) : null,
      createdAt: String(r.created_at),
      distanceKm: haversineKm(from, { lat: r.lat, lng: r.lng }),
      bookmarked: book.has(r.id),
      author,
      helper: helperRow ? toPublic(helperRow) : null,
      pendingOfferCount: countMap.get(r.id) ?? 0,
      myOfferStatus: mine.get(r.id) ?? null,
    };
  });
}

export async function loadPostCards(ids: string[], viewer: ProfileRow) {
  if (ids.length === 0) return [] as PostCard[];
  const rows = await rowsIn<PostRow>(`select * from posts where id`, ids);
  return hydrate(rows, viewer);
}

export const createPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    return {
      type: d.type === "offer" ? "offer" : "request",
      title: String(d.title ?? "").trim(),
      description: String(d.description ?? "").trim().slice(0, 2000),
      category: String(d.category ?? "Other"),
      estimatedTime: String(d.estimatedTime ?? "15–30 min"),
      creditReward: Math.round(num(d.creditReward, 2)),
      deadline: typeof d.deadline === "string" && d.deadline ? d.deadline : null,
    };
  })
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    if (!me.onboarding_complete) return fail("Finish onboarding first.");
    if (data.title.length < 4) return fail("Add a short title so neighbors know what you need.");
    if (!CATEGORIES.includes(data.category as (typeof CATEGORIES)[number])) return fail("Pick a valid category.");
    if (!TIMES.includes(data.estimatedTime as (typeof TIMES)[number])) return fail("Pick a time estimate.");
    const reward = Math.min(MAX_REWARD, Math.max(MIN_REWARD, data.creditReward));
    if (data.type === "request") {
      const reserved = await reservedCredits(context.userId);
      const available = num(me.credits) - reserved;
      if (available < reward) {
        return fail(`You need ${reward} available credits. You have ${available} free (${reserved} reserved on open requests).`);
      }
    }
    const sql = await getSql();
    const id = nid("p");
    await sql`
      insert into posts (
        id, user_id, type, title, description, category, city, area, lat, lng,
        estimated_time, credit_reward, status, deadline
      ) values (
        ${id}, ${context.userId}, ${data.type}, ${data.title.slice(0, 140)}, ${data.description},
        ${data.category}, ${me.city}, ${me.area}, ${me.lat}, ${me.lng},
        ${data.estimatedTime}, ${reward}, 'open', ${data.deadline}
      )
    `;
    // Notify neighbors whose skills match this category (cap 12)
    const skillNeedle = `%${data.category.toLowerCase()}%`;
    const neighbors = await sql<{ user_id: string }>`
      select user_id from profiles
      where user_id <> ${context.userId}
        and onboarding_complete = true
        and lower(skills) like ${skillNeedle}
      limit 12
    `;
    const blocked = await blockedSet(context.userId);
    for (const n of neighbors) {
      if (blocked.has(n.user_id)) continue;
      await notify({
        userId: n.user_id,
        type: "new_relevant_request",
        title: "A nearby request matches your skills",
        body: data.title.slice(0, 80),
        href: `/app/favor/${id}`,
      });
    }
    const cards = await loadPostCards([id], me);
    return ok(cards[0]);
  });

export const listDiscover = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    return {
      q: String(d.q ?? "").trim().slice(0, 80),
      category: String(d.category ?? "All"),
      type: d.type === "offer" ? "offer" : d.type === "request" ? "request" : "all",
      sort: String(d.sort ?? "newest"),
      nearby: Boolean(d.nearby),
    };
  })
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    const blocked = await blockedSet(context.userId);
    const sql = await getSql();
    const rows = await sql<PostRow>`
      select * from posts
      where status = 'open'
      order by created_at desc
      limit 120
    `;
    const visible = rows.filter((r) => r.user_id !== context.userId && !blocked.has(r.user_id));
    let cards = await hydrate(visible, me);
    if (data.type !== "all") cards = cards.filter((c) => c.type === data.type);
    if (data.category && data.category !== "All" && data.category !== "Nearby") {
      cards = cards.filter((c) => c.category === data.category);
    }
    if (data.nearby || data.category === "Nearby") {
      cards = cards.filter((c) => c.distanceKm != null && c.distanceKm <= 5);
    }
    if (data.q) {
      const q = data.q.toLowerCase();
      cards = cards.filter((c) =>
        `${c.title} ${c.description} ${c.category} ${c.author.name} ${c.author.skills.join(" ")}`
          .toLowerCase()
          .includes(q),
      );
    }
    const timeRank: Record<string, number> = {
      "5–15 min": 1,
      "15–30 min": 2,
      "30–60 min": 3,
      "1–2 hours": 4,
      Other: 5,
    };
    cards.sort((a, b) => {
      const boost = Number(!!(b.boostedUntil && new Date(b.boostedUntil) > new Date())) -
        Number(!!(a.boostedUntil && new Date(a.boostedUntil) > new Date()));
      if (boost) return boost;
      if (data.sort === "closest") return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      if (data.sort === "reward") return b.creditReward - a.creditReward;
      if (data.sort === "quickest") return (timeRank[a.estimatedTime] ?? 9) - (timeRank[b.estimatedTime] ?? 9);
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return ok(cards);
  });

export const getPost = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ id: String((raw as { id?: string })?.id ?? "") }))
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    if (!data.id) return fail("Missing request.");
    const sql = await getSql();
    const rows = await sql<PostRow>`select * from posts where id = ${data.id} limit 1`;
    const post = rows[0];
    if (!post) return fail("This request is gone.");
    const blocked = await blockedSet(context.userId);
    if (blocked.has(post.user_id) && post.user_id !== context.userId) return fail("This request is not available.");
    const cards = await hydrate([post], me);
    const offers =
      post.user_id === context.userId
        ? await sql<{
            id: string;
            post_id: string;
            message: string;
            status: string;
            created_at: string;
            helper_id: string;
          }>`
            select id, post_id, message, status, created_at, helper_id
            from offers where post_id = ${post.id} order by created_at desc
          `
        : [];
    const helpers = await rowsIn<ProfileRow>(
      `select * from profiles where user_id`,
      offers.map((o) => o.helper_id),
    );
    const hmap = new Map(helpers.map((h) => [h.user_id, h]));
    return ok({
      post: cards[0],
      offers: offers
        .filter((o) => !blocked.has(o.helper_id))
        .map((o) => ({
          id: o.id,
          postId: o.post_id,
          message: o.message,
          status: o.status,
          createdAt: String(o.created_at),
          helper: hmap.get(o.helper_id) ? toPublic(hmap.get(o.helper_id)!) : toPublic(me),
        })),
    });
  });

export const cancelPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ id: String((raw as { id?: string })?.id ?? "") }))
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<PostRow>`select * from posts where id = ${data.id} limit 1`;
    const post = rows[0];
    if (!post) return fail("Request not found.");
    if (post.user_id !== context.userId) return fail("You can only cancel your own request.");
    if (post.status === "completed") return fail("This favor is already completed.");
    if (post.status === "cancelled") return ok(true);
    await sql`update posts set status = 'cancelled' where id = ${post.id} and user_id = ${context.userId}`;
    await sql`update offers set status = 'declined' where post_id = ${post.id} and status = 'pending'`;
    if (post.helper_id) {
      await notify({
        userId: post.helper_id,
        type: "offer_declined",
        title: "Request cancelled",
        body: `${me.name} cancelled “${post.title}”.`,
        href: `/app/favor/${post.id}`,
      });
    }
    return ok(true);
  });

export const toggleBookmark = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ id: String((raw as { id?: string })?.id ?? "") }))
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const existing = await sql<{ post_id: string }>`
      select post_id from bookmarks where user_id = ${context.userId} and post_id = ${data.id} limit 1
    `;
    if (existing[0]) {
      await sql`delete from bookmarks where user_id = ${context.userId} and post_id = ${data.id}`;
      return ok({ bookmarked: false });
    }
    const post = await sql<{ id: string }>`select id from posts where id = ${data.id} limit 1`;
    if (!post[0]) return fail("Request not found.");
    await sql`insert into bookmarks (user_id, post_id) values (${context.userId}, ${data.id})`;
    return ok({ bookmarked: true });
  });

export const boostPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ id: String((raw as { id?: string })?.id ?? "") }))
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    if (!me.plus) return fail("Boost is a Plus feature. Join the waitlist — payments are not processed in this app.");
    const sql = await getSql();
    const updated = await sql<{ id: string }>`
      update posts
      set boosted_until = now() + interval '24 hours'
      where id = ${data.id} and user_id = ${context.userId} and status = 'open'
      returning id
    `;
    if (!updated[0]) return fail("You can only boost your own open request.");
    return ok(true);
  });
