import { getSql } from "@/lib/db";
import { LEVELS, STARTER_CREDITS } from "@/lib/constants";
import type { ProfilePublic } from "@/lib/types";

export function nid(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function parseList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
  if (typeof raw !== "string" || !raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function num(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function slugify(input: string) {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  return s || "neighbor";
}

export function levelFromGiven(given: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (given >= l.min) current = l;
  return current.level;
}

export type ProfileRow = {
  user_id: string;
  name: string;
  username: string;
  email: string | null;
  bio: string;
  city: string;
  area: string;
  lat: number | null;
  lng: number | null;
  avatar_hue: number;
  photo_url: string | null;
  skills: string;
  need_help_with: string;
  interests: string;
  credits: number;
  reputation: number | string;
  favors_given: number;
  favors_received: number;
  streak: number;
  streak_at: string | null;
  level: number;
  verified: boolean;
  plus: boolean;
  plus_status: string;
  onboarding_complete: boolean;
  created_at: string;
};

export function toPublic(row: ProfileRow): ProfilePublic {
  return {
    userId: row.user_id,
    name: row.name,
    username: row.username,
    bio: row.bio,
    city: row.city,
    area: row.area,
    photoUrl: row.photo_url,
    avatarHue: num(row.avatar_hue, 168),
    skills: parseList(row.skills),
    needHelpWith: parseList(row.need_help_with),
    interests: parseList(row.interests),
    reputation: num(row.reputation, 70),
    favorsGiven: num(row.favors_given),
    favorsReceived: num(row.favors_received),
    streak: num(row.streak),
    level: num(row.level, 1),
    verified: Boolean(row.verified),
    plus: Boolean(row.plus),
    plusStatus: row.plus_status,
    createdAt: String(row.created_at),
  };
}

export async function loadProfile(userId: string): Promise<ProfileRow | null> {
  const sql = await getSql();
  const rows = await sql<ProfileRow>`select * from profiles where user_id = ${userId} limit 1`;
  return rows[0] ?? null;
}

export async function reservedCredits(userId: string): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ reserved: number | string }>`
    select coalesce(sum(credit_reward), 0) as reserved
    from posts
    where user_id = ${userId}
      and type = 'request'
      and status in ('open', 'accepted', 'pending_confirm')
  `;
  return num(rows[0]?.reserved);
}

export async function blockedSet(userId: string): Promise<Set<string>> {
  const sql = await getSql();
  const rows = await sql<{ other_id: string }>`
    select blocked_id as other_id from blocks where blocker_id = ${userId}
    union
    select blocker_id as other_id from blocks where blocked_id = ${userId}
  `;
  return new Set(rows.map((r) => r.other_id));
}

export async function isBlockedPair(a: string, b: string) {
  const sql = await getSql();
  const rows = await sql<{ n: number | string }>`
    select count(*)::int as n from blocks
    where (blocker_id = ${a} and blocked_id = ${b})
       or (blocker_id = ${b} and blocked_id = ${a})
  `;
  return num(rows[0]?.n) > 0;
}

export async function notify(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string | null;
}) {
  const sql = await getSql();
  await sql`
    insert into notifications (id, user_id, type, title, body, href)
    values (${nid("n")}, ${input.userId}, ${input.type}, ${input.title}, ${input.body}, ${input.href ?? null})
  `;
}

export async function uniqueUsername(base: string) {
  const sql = await getSql();
  const root = slugify(base);
  for (let i = 0; i < 12; i++) {
    const candidate = i === 0 ? root : `${root}${Math.floor(10 + Math.random() * 89)}`;
    const hit = await sql<{ user_id: string }>`select user_id from profiles where username = ${candidate} limit 1`;
    if (!hit[0]) return candidate;
  }
  return `${root}${Date.now().toString(36).slice(-4)}`;
}

type AuthUserRow = { id: string; name: string | null; email: string | null; image: string | null };

export async function ensureProfile(userId: string): Promise<ProfileRow> {
  const existing = await loadProfile(userId);
  if (existing) return existing;
  const sql = await getSql();
  const authRows = await sql<AuthUserRow>`
    select id, name, email, image from "user" where id = ${userId} limit 1
  `;
  const au = authRows[0];
  const name = (au?.name || au?.email?.split("@")[0] || "Neighbor").trim();
  const username = await uniqueUsername(name);
  const hue = Math.floor(Math.random() * 360);
  try {
    await sql`
      insert into profiles (
        user_id, name, username, email, photo_url, avatar_hue, credits
      ) values (
        ${userId}, ${name}, ${username}, ${au?.email ?? null}, ${au?.image ?? null}, ${hue}, ${STARTER_CREDITS}
      )
    `;
    await sql`
      insert into transactions (id, from_user_id, to_user_id, amount, type, label, status)
      values (${nid("t")}, null, ${userId}, ${STARTER_CREDITS}, 'starter', 'Promotional starter credits', 'completed')
      on conflict do nothing
    `;
  } catch {
    const raced = await loadProfile(userId);
    if (raced) return raced;
    throw new Error("Could not create your profile.");
  }
  const created = await loadProfile(userId);
  if (!created) throw new Error("Could not create your profile.");
  return created;
}

export async function rowsIn<T>(sqlText: string, ids: string[]): Promise<T[]> {
  if (ids.length === 0) return [];
  const sql = await getSql();
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
  return sql.query<T>(`${sqlText} in (${placeholders})`, ids);
}

export function haversineKm(
  a: { lat: number | null; lng: number | null },
  b: { lat: number | null; lng: number | null },
): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(x))) * 10) / 10;
}

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export function ok<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

export async function syncChallenges(userId: string) {
  const sql = await getSql();
  const me = await loadProfile(userId);
  if (!me) return;
  const earnedRows = await sql<{ n: number | string }>`
    select coalesce(sum(amount), 0) as n
    from transactions
    where to_user_id = ${userId} and type = 'favor_payout' and status = 'completed'
  `;
  const catRows = await sql<{ n: number | string }>`
    select count(distinct category)::int as n
    from posts
    where helper_id = ${userId} and status = 'completed'
  `;
  const stats: Record<string, number> = {
    helps: num(me.favors_given),
    credits_earned: num(earnedRows[0]?.n),
    categories: num(catRows[0]?.n),
  };
  const catalog = await sql<{ id: string; kind: string; goal: number; reward: number; title: string }>`
    select id, kind, goal, reward, title from challenges
  `;
  for (const c of catalog) {
    const progress = Math.min(c.goal, stats[c.kind] ?? 0);
    const done = progress >= c.goal;
    await sql`
      insert into challenge_progress (user_id, challenge_id, progress, completed, rewarded)
      values (${userId}, ${c.id}, ${progress}, ${done}, false)
      on conflict (user_id, challenge_id) do update set
        progress = excluded.progress,
        completed = excluded.completed
    `;
    if (!done) continue;
    const claimed = await sql<{ user_id: string }>`
      update challenge_progress
      set rewarded = true, completed = true, completed_at = now()
      where user_id = ${userId} and challenge_id = ${c.id} and rewarded = false
      returning user_id
    `;
    if (!claimed[0]) continue;
    const tx = await sql<{ id: string }>`
      insert into transactions (id, from_user_id, to_user_id, amount, type, related_challenge_id, label, status)
      values (${nid("t")}, null, ${userId}, ${c.reward}, 'challenge', ${c.id}, ${"Challenge: " + c.title}, 'completed')
      on conflict do nothing
      returning id
    `;
    if (!tx[0]) continue;
    await sql`
      update profiles
      set credits = credits + ${c.reward}, updated_at = now()
      where user_id = ${userId}
    `;
    await notify({
      userId,
      type: "challenge_completed",
      title: "Challenge complete",
      body: `${c.title} — +${c.reward} credits`,
      href: "/app/challenges",
    });
  }
}
