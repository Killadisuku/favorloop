import { createServerFn } from "@tanstack/react-start";
import { actorMiddleware as authMiddleware } from "@/lib/server/actor";
import { getSql } from "@/lib/db";
import { INTEREST_OPTS, NEED_OPTS, PHOTO_MAX_CHARS, SKILL_OPTS } from "@/lib/constants";
import type { ProfileMe, ProfilePublic } from "@/lib/types";
import {
  blockedSet,
  ensureProfile,
  fail,
  loadProfile,
  nid,
  num,
  ok,
  parseList,
  reservedCredits,
  slugify,
  syncChallenges,
  toPublic,
  type ProfileRow,
} from "./helpers";

function toMe(row: ProfileRow, reserved: number): ProfileMe {
  const credits = num(row.credits);
  return {
    ...toPublic(row),
    email: row.email,
    credits,
    reserved,
    available: Math.max(0, credits - reserved),
    onboardingComplete: Boolean(row.onboarding_complete),
    lat: row.lat == null ? null : num(row.lat),
    lng: row.lng == null ? null : num(row.lng),
  };
}

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const row = await ensureProfile(context.userId);
    await syncChallenges(context.userId);
    const fresh = (await loadProfile(context.userId)) ?? row;
    const reserved = await reservedCredits(context.userId);
    return ok(toMe(fresh, reserved));
  });

function cleanTags(input: unknown, allowed: string[]) {
  const list = Array.isArray(input) ? input : parseList(input);
  const allow = new Set(allowed);
  return [...new Set(list.map((s) => String(s)).filter((s) => allow.has(s) || s.length <= 24))].slice(0, 12);
}

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    return {
      name: String(d.name ?? "").trim(),
      username: String(d.username ?? "").trim().toLowerCase(),
      bio: String(d.bio ?? "").trim().slice(0, 400),
      city: String(d.city ?? "").trim().slice(0, 80),
      area: String(d.area ?? "").trim().slice(0, 80),
      photoUrl: typeof d.photoUrl === "string" ? d.photoUrl : null,
      avatarHue: num(d.avatarHue, 168),
      lat: d.lat == null || d.lat === "" ? null : num(d.lat),
      lng: d.lng == null || d.lng === "" ? null : num(d.lng),
      skills: cleanTags(d.skills, SKILL_OPTS),
      needHelpWith: cleanTags(d.needHelpWith, NEED_OPTS),
      interests: cleanTags(d.interests, INTEREST_OPTS),
    };
  })
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    if (data.name.length < 2) return fail("Please add your name.");
    let username = slugify(data.username || data.name);
    if (username.length < 3) return fail("Username needs at least 3 letters.");
    const sql = await getSql();
    const taken = await sql<{ user_id: string }>`
      select user_id from profiles where username = ${username} and user_id <> ${context.userId} limit 1
    `;
    if (taken[0]) return fail("That username is taken. Try another.");
    if (data.photoUrl && data.photoUrl.length > PHOTO_MAX_CHARS) return fail("Photo is too large. Try a smaller image.");
    const hue = Math.max(0, Math.min(360, Math.round(data.avatarHue)));
    await sql`
      update profiles set
        name = ${data.name.slice(0, 60)},
        username = ${username},
        bio = ${data.bio},
        city = ${data.city || "Nearby"},
        area = ${data.area},
        photo_url = ${data.photoUrl},
        avatar_hue = ${hue},
        lat = ${data.lat},
        lng = ${data.lng},
        skills = ${JSON.stringify(data.skills)},
        need_help_with = ${JSON.stringify(data.needHelpWith)},
        interests = ${JSON.stringify(data.interests)},
        onboarding_complete = true,
        updated_at = now()
      where user_id = ${context.userId}
    `;
    const row = await loadProfile(context.userId);
    const reserved = await reservedCredits(context.userId);
    return ok(toMe(row!, reserved));
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    return {
      name: String(d.name ?? "").trim(),
      bio: String(d.bio ?? "").trim().slice(0, 400),
      city: String(d.city ?? "").trim().slice(0, 80),
      area: String(d.area ?? "").trim().slice(0, 80),
      photoUrl: typeof d.photoUrl === "string" ? d.photoUrl : null,
      avatarHue: d.avatarHue == null ? undefined : num(d.avatarHue, 168),
      skills: d.skills == null ? undefined : cleanTags(d.skills, SKILL_OPTS),
      needHelpWith: d.needHelpWith == null ? undefined : cleanTags(d.needHelpWith, NEED_OPTS),
      interests: d.interests == null ? undefined : cleanTags(d.interests, INTEREST_OPTS),
    };
  })
  .handler(async ({ context, data }) => {
    if (data.name.length < 2) return fail("Name is required.");
    if (data.photoUrl && data.photoUrl.length > PHOTO_MAX_CHARS) return fail("Photo is too large.");
    const sql = await getSql();
    const current = await ensureProfile(context.userId);
    await sql`
      update profiles set
        name = ${data.name.slice(0, 60)},
        bio = ${data.bio},
        city = ${data.city || current.city},
        area = ${data.area},
        photo_url = ${data.photoUrl ?? current.photo_url},
        avatar_hue = ${data.avatarHue ?? current.avatar_hue},
        skills = ${JSON.stringify(data.skills ?? parseList(current.skills))},
        need_help_with = ${JSON.stringify(data.needHelpWith ?? parseList(current.need_help_with))},
        interests = ${JSON.stringify(data.interests ?? parseList(current.interests))},
        updated_at = now()
      where user_id = ${context.userId}
    `;
    const row = await loadProfile(context.userId);
    const reserved = await reservedCredits(context.userId);
    return ok(toMe(row!, reserved));
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ userId: String((raw as { userId?: string })?.userId ?? "") }))
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    if (!data.userId) return fail("Missing profile.");
    const blocked = await blockedSet(context.userId);
    if (blocked.has(data.userId) && data.userId !== context.userId) return fail("This profile is not available.");
    const row = await loadProfile(data.userId);
    if (!row) return fail("Profile not found.");
    const sql = await getSql();
    const reviews = await sql<{
      id: string;
      favor_id: string;
      from_user_id: string;
      stars: number;
      tags: string;
      body: string;
      created_at: string;
      from_name: string;
    }>`
      select r.id, r.favor_id, r.from_user_id, r.stars, r.tags, r.body, r.created_at, p.name as from_name
      from reviews r
      join profiles p on p.user_id = r.from_user_id
      where r.to_user_id = ${data.userId}
      order by r.created_at desc
      limit 40
    `;
    const posts = await sql<{ id: string; title: string; category: string; credit_reward: number; status: string; created_at: string }>`
      select id, title, category, credit_reward, status, created_at
      from posts
      where (user_id = ${data.userId} or helper_id = ${data.userId})
        and status = 'completed'
      order by created_at desc
      limit 30
    `;
    return ok({
      profile: toPublic(row),
      isSelf: data.userId === context.userId,
      reviews: reviews.map((r) => ({
        id: r.id,
        favorId: r.favor_id,
        fromUserId: r.from_user_id,
        fromName: r.from_name,
        toUserId: data.userId,
        stars: num(r.stars),
        tags: parseList(r.tags),
        body: r.body,
        createdAt: String(r.created_at),
      })),
      completed: posts.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        creditReward: num(p.credit_reward),
        status: p.status,
        createdAt: String(p.created_at),
      })),
    });
  });

export const listPeople = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    return {
      q: String(d.q ?? "").trim().slice(0, 80),
      city: String(d.city ?? "").trim().slice(0, 80),
    };
  })
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    const blocked = await blockedSet(context.userId);
    const sql = await getSql();
    const q = data.q ? `%${data.q.toLowerCase()}%` : null;
    const rows = await sql<ProfileRow>`
      select * from profiles
      where user_id <> ${context.userId}
        and onboarding_complete = true
      order by favors_given desc, created_at desc
      limit 80
    `;
    const out: ProfilePublic[] = [];
    for (const row of rows) {
      if (blocked.has(row.user_id)) continue;
      if (data.city && row.city.toLowerCase() !== data.city.toLowerCase()) continue;
      if (q) {
        const blob = `${row.name} ${row.username} ${row.bio} ${row.skills} ${row.city}`.toLowerCase();
        if (!blob.includes(data.q.toLowerCase())) continue;
      }
      out.push(toPublic(row));
    }
    return ok(out);
  });

export const joinPlusWaitlist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    await sql`
      insert into plus_waitlist (user_id) values (${context.userId})
      on conflict (user_id) do nothing
    `;
    await sql`
      update profiles set plus_status = 'waitlisted', updated_at = now()
      where user_id = ${context.userId} and plus = false
    `;
    const row = await loadProfile(context.userId);
    const reserved = await reservedCredits(context.userId);
    return ok({
      me: toMe(row!, reserved),
      message: "You're on the Plus waitlist. Payments are not processed here — nothing was charged.",
    });
  });
