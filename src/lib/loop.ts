import {
  APP_NAME,
  areaByName,
  AUDIENCE,
  CATEGORIES,
  HELP_TYPES,
  hoursFromEstimate,
  LEGACY_CATEGORY,
  LEGACY_SKILL,
  LEVELS,
  lifecycleLabel,
  MAX_REWARD,
  MIN_REWARD,
  nearestArea,
  PHOTO_MAX_CHARS,
  PRESENCE,
  STARTER_CREDITS,
  TIMES,
  WHEN_OPTS,
} from "@/lib/constants";
import type {
  ChallengeRow,
  CircleRow,
  ConversationRow,
  HomePayload,
  Impact,
  MessageRow,
  NotifRow,
  OfferRow,
  PostCard,
  ProfileMe,
  ProfilePublic,
  ReviewRow,
  TxRow,
} from "@/lib/types";

type DataArg<T> = { data: T } | T;
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

type Person = ProfilePublic & {
  email: string | null;
  credits: number;
  onboardingComplete: boolean;
  lat: number | null;
  lng: number | null;
  circleIds: string[];
  locationSource: string;
};

type Post = {
  id: string;
  userId: string;
  type: "request" | "offer";
  title: string;
  description: string;
  category: string;
  city: string;
  area: string;
  estimatedTime: string;
  creditReward: number;
  helpType: string;
  presence: string;
  whenNeeded: string;
  photoUrl: string | null;
  circleId: string | null;
  audience: string;
  lat: number | null;
  lng: number | null;
  destLat: number | null;
  destLng: number | null;
  destArea: string | null;
  exactShared: boolean;
  meetingNote: string | null;
  status: string;
  deadline: string | null;
  boostedUntil: string | null;
  helperId: string | null;
  createdAt: string;
};

type Circle = { id: string; name: string; kind: string; city: string; memberIds: string[] };

type Offer = {
  id: string;
  postId: string;
  requesterId: string;
  helperId: string;
  message: string;
  status: string;
  createdAt: string;
};

type Convo = { id: string; postId: string | null; memberIds: string[]; archivedBy: string[]; lastRead: Record<string, string> };
type Msg = { id: string; conversationId: string; senderId: string; body: string; createdAt: string };
type Tx = {
  id: string;
  fromUserId: string | null;
  toUserId: string;
  amount: number;
  type: string;
  relatedFavorId: string | null;
  label: string;
  status: string;
  createdAt: string;
};
type Review = ReviewRow;
type Challenge = { id: string; title: string; description: string; reward: number; goal: number; kind: string };

type Prefs = { nearbyNotifs: boolean; circleNotifs: boolean };

type DB = {
  selfId: string;
  people: Person[];
  posts: Post[];
  offers: Offer[];
  convos: Convo[];
  messages: Msg[];
  txs: Tx[];
  notifs: NotifRow[];
  reviews: Review[];
  bookmarks: string[];
  blocks: string[];
  challenges: Challenge[];
  progress: Record<string, { progress: number; completed: boolean; rewarded: boolean }>;
  plusWaitlist: boolean;
  circles: Circle[];
  prefs: Prefs;
};

const KEY = "onegai.loop.v1";
const LEGACY_KEY = "porfavor.loop.v1";

function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}
function fail(error: string): Result<never> {
  return { ok: false, error };
}
function nid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
function now() {
  return new Date().toISOString();
}
function arg<T>(raw: DataArg<T> | undefined, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === "object" && raw !== null && "data" in raw) return (raw as { data: T }).data;
  return raw as T;
}
function levelFrom(given: number): number {
  let n = 1;
  for (const l of LEVELS) if (given >= l.min) n = l.level;
  return n;
}

function enrichPerson(
  p: Omit<Person, "peopleHelped" | "hoursGiven" | "phoneVerified" | "completionRate" | "responseRate" | "circleNames" | "circleIds" | "locationSource"> & {
    circleIds?: string[];
    locationSource?: string;
  },
): Person {
  return {
    ...p,
    peopleHelped: p.favorsGiven,
    hoursGiven: Math.round(p.favorsGiven * 0.7 * 10) / 10,
    phoneVerified: p.verified,
    completionRate: p.reputation,
    responseRate: Math.min(99, p.reputation + 1),
    circleNames: [],
    circleIds: p.circleIds ?? [],
    skills: (p.skills ?? []).map((s) => LEGACY_SKILL[s] ?? s),
    locationSource: p.locationSource ?? "default",
  };
}

const NEIGHBOR_SEED = [
  {
    userId: "nb_maya",
    name: "Maya Chen",
    username: "maya",
    bio: "Fixes Wi-Fi, printers, and “it worked yesterday” energy.",
    city: "Dubai",
    area: "Marina",
    photoUrl: null,
    avatarHue: 168,
    skills: ["Tech setup", "Excel"],
    needHelpWith: ["Home"],
    interests: ["Neighbors", "Skills"],
    reputation: 96,
    favorsGiven: 18,
    favorsReceived: 7,
    streak: 4,
    level: 3,
    verified: true,
    plus: true,
    plusStatus: "plus",
    createdAt: "2026-08-12T10:00:00.000Z",
    email: null,
    credits: 11,
    onboardingComplete: true,
    lat: 25.08,
    lng: 55.14,
  },
  {
    userId: "nb_omar",
    name: "Omar Haddad",
    username: "omar",
    bio: "Ikea, shelves, and the drill you don’t want to buy.",
    city: "Dubai",
    area: "JLT",
    photoUrl: null,
    avatarHue: 28,
    skills: ["Home", "Moving"],
    needHelpWith: ["Tech"],
    interests: ["Family", "Neighbors"],
    reputation: 91,
    favorsGiven: 14,
    favorsReceived: 9,
    streak: 2,
    level: 3,
    verified: true,
    plus: false,
    plusStatus: "free",
    createdAt: "2026-08-18T10:00:00.000Z",
    email: null,
    credits: 8,
    onboardingComplete: true,
    lat: 25.07,
    lng: 55.14,
  },
  {
    userId: "nb_lina",
    name: "Lina Park",
    username: "lina",
    bio: "Errands, queues, and “I’ll grab it on the way.”",
    city: "Dubai",
    area: "Downtown",
    photoUrl: null,
    avatarHue: 200,
    skills: ["Errands", "Shopping"],
    needHelpWith: ["Learning"],
    interests: ["Food", "Fitness"],
    reputation: 88,
    favorsGiven: 11,
    favorsReceived: 6,
    streak: 1,
    level: 2,
    verified: false,
    plus: false,
    plusStatus: "free",
    createdAt: "2026-08-22T10:00:00.000Z",
    email: null,
    credits: 6,
    onboardingComplete: true,
    lat: 25.19,
    lng: 55.27,
  },
  {
    userId: "nb_yusuf",
    name: "Yusuf Rahman",
    username: "yusuf",
    bio: "English practice, Excel formulas, patient teacher.",
    city: "Dubai",
    area: "Al Barsha",
    photoUrl: null,
    avatarHue: 132,
    skills: ["English", "Excel"],
    needHelpWith: ["Transport"],
    interests: ["Languages", "Skills"],
    reputation: 94,
    favorsGiven: 16,
    favorsReceived: 4,
    streak: 6,
    level: 3,
    verified: true,
    plus: false,
    plusStatus: "free",
    createdAt: "2026-08-09T10:00:00.000Z",
    email: null,
    credits: 9,
    onboardingComplete: true,
    lat: 25.11,
    lng: 55.2,
  },
  {
    userId: "nb_sofia",
    name: "Sofia Alves",
    username: "sofia",
    bio: "Quick design, Canva, and making things look finished.",
    city: "Dubai",
    area: "Business Bay",
    photoUrl: null,
    avatarHue: 312,
    skills: ["Design", "Photoshop"],
    needHelpWith: ["Errands"],
    interests: ["Art", "Skills"],
    reputation: 90,
    favorsGiven: 9,
    favorsReceived: 8,
    streak: 0,
    level: 2,
    verified: false,
    plus: true,
    plusStatus: "plus",
    createdAt: "2026-08-28T10:00:00.000Z",
    email: null,
    credits: 7,
    onboardingComplete: true,
    lat: 25.18,
    lng: 55.26,
  },
  {
    userId: "nb_noor",
    name: "Noor Al Farsi",
    username: "noor",
    bio: "Airport runs, heavy bags, and a reliable car.",
    city: "Dubai",
    area: "Deira",
    photoUrl: null,
    avatarHue: 48,
    skills: ["Driving", "Moving"],
    needHelpWith: ["Home"],
    interests: ["Family", "Neighbors"],
    reputation: 93,
    favorsGiven: 13,
    favorsReceived: 5,
    streak: 3,
    level: 3,
    verified: true,
    plus: false,
    plusStatus: "free",
    createdAt: "2026-08-15T10:00:00.000Z",
    email: null,
    credits: 10,
    onboardingComplete: true,
    lat: 25.27,
    lng: 55.33,
  },
];

const NEIGHBORS: Person[] = NEIGHBOR_SEED.map(enrichPerson);

const SEED_POSTS: Array<
  Omit<Post, "createdAt" | "helpType" | "whenNeeded" | "photoUrl" | "circleId" | "presence" | "audience" | "lat" | "lng" | "destLat" | "destLng" | "destArea" | "exactShared" | "meetingNote"> & {
    hoursAgo: number;
  }
> = [
  { id: "p_wifi", userId: "nb_lina", type: "request", title: "Help me set up a mesh Wi-Fi", description: "New apartment, two floors, the office room gets one bar. Need someone who has done this before.", category: "Tech", city: "Dubai", area: "Downtown", estimatedTime: "30–60 min", creditReward: 3, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 2 },
  { id: "p_ikea", userId: "nb_maya", type: "request", title: "Build a Billy bookcase", description: "It’s still in the box. Tools are here, patience is not.", category: "Home", city: "Dubai", area: "Marina", estimatedTime: "1–2 hours", creditReward: 4, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 5 },
  { id: "p_excel", userId: "nb_omar", type: "request", title: "Excel formula for a small shop ledger", description: "Need SUMIFS and a clean monthly sheet. I can share a sample file.", category: "Learning", city: "Dubai", area: "JLT", estimatedTime: "30–60 min", creditReward: 2, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 8 },
  { id: "p_airport", userId: "nb_sofia", type: "request", title: "Lift to DXB tomorrow 6am", description: "One suitcase, Terminal 3. Happy to wait at the lobby.", category: "Transport", city: "Dubai", area: "Business Bay", estimatedTime: "30–60 min", creditReward: 3, status: "open", deadline: null, boostedUntil: new Date(Date.now() + 36e5).toISOString(), helperId: null, hoursAgo: 1 },
  { id: "p_canva", userId: "nb_yusuf", type: "offer", title: "I can make a simple flyer tonight", description: "Canva or Figma. Menus, event posters, Instagram square.", category: "Creative", city: "Dubai", area: "Al Barsha", estimatedTime: "15–30 min", creditReward: 2, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 3 },
  { id: "p_english", userId: "nb_yusuf", type: "offer", title: "English conversation, 20 minutes", description: "Casual practice. No textbooks. Voice note or in person nearby.", category: "Learning", city: "Dubai", area: "Al Barsha", estimatedTime: "15–30 min", creditReward: 1, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 12 },
  { id: "p_move", userId: "nb_noor", type: "offer", title: "I can help move boxes this weekend", description: "Car + two hands. Stairs are fine. Marina / JLT / Downtown.", category: "Home", city: "Dubai", area: "Deira", estimatedTime: "1–2 hours", creditReward: 3, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 9 },
  { id: "p_shop", userId: "nb_lina", type: "offer", title: "Carrefour run this evening", description: "Already going. Add your list if it’s small.", category: "Errands", city: "Dubai", area: "Downtown", estimatedTime: "15–30 min", creditReward: 1, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 4 },
  { id: "p_table", userId: "nb_maya", type: "request", title: "Can someone help me move a small table?", description: "Light oak side table, one flight of stairs. Two people would make it easy.", category: "Moving", city: "Dubai", area: "Marina", estimatedTime: "15–30 min", creditReward: 0, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 1 },
];

function makeSelf(): Person {
  return enrichPerson({
    userId: nid("me"),
    name: "You",
    username: "you",
    bio: "New in the loop. Happy to help with small favors.",
    city: "Dubai",
    area: "Nearby",
    photoUrl: null,
    avatarHue: 168,
    skills: ["Household help", "Shopping", "Moving"],
    needHelpWith: ["Technology", "Home"],
    interests: ["Neighbors"],
    reputation: 70,
    favorsGiven: 0,
    favorsReceived: 0,
    streak: 0,
    level: 1,
    verified: false,
    plus: false,
    plusStatus: "free",
    createdAt: now(),
    email: null,
    credits: STARTER_CREDITS,
    onboardingComplete: true,
    lat: 25.2,
    lng: 55.27,
  });
}

function seed(): DB {
  const self = makeSelf();
  const circles: Circle[] = defaultCircles(self.userId);
  self.circleIds = ["c_marina", "c_friends"];
  const posts: Post[] = SEED_POSTS.map((p) => {
    const loc = locOf(p.area);
    const presence = inferPresence(p);
    const dest = p.id === "p_airport" ? locOf("Airport") : p.id === "p_shop" ? locOf("Marina") : null;
    return {
      helpType: p.category === "Transport" ? "paid" : p.category === "Home" || p.id === "p_table" ? "kindness" : "favor",
      whenNeeded: p.id === "p_airport" ? "Tomorrow" : p.id === "p_table" ? "Today · evening" : "Flexible",
      photoUrl: null,
      circleId: p.userId === "nb_maya" ? "c_marina" : null,
      audience: p.userId === "nb_maya" ? "both" : "nearby",
      presence,
      lat: presence === "online" ? null : loc.lat,
      lng: presence === "online" ? null : loc.lng,
      destLat: dest?.lat ?? null,
      destLng: dest?.lng ?? null,
      destArea: dest && presence === "pickup" ? dest.area : null,
      exactShared: false,
      meetingNote: null,
      ...p,
      category: LEGACY_CATEGORY[p.category] ?? p.category,
      createdAt: new Date(Date.now() - p.hoursAgo * 3600_000).toISOString(),
    };
  });
  const people = [self, ...NEIGHBORS].map((p) => {
    p.circleIds = circles.filter((c) => c.memberIds.includes(p.userId)).map((c) => c.id);
    return p;
  });
  return {
    selfId: self.userId,
    people,
    posts,
    offers: [],
    convos: [],
    messages: [],
    txs: [
      {
        id: nid("t"),
        fromUserId: null,
        toUserId: self.userId,
        amount: STARTER_CREDITS,
        type: "starter",
        relatedFavorId: null,
        label: "Starter community favors",
        status: "completed",
        createdAt: now(),
      },
    ],
    notifs: [
      {
        id: nid("n"),
        type: "welcome",
        title: `Welcome to ${APP_NAME}`,
        body: "Ask for a small hand, or help someone nearby.",
        href: "/app/discover",
        read: false,
        createdAt: now(),
      },
      {
        id: nid("n"),
        type: "match",
        title: "3 requests match your skills",
        body: "Household help and shopping are needed nearby.",
        href: "/app/help",
        read: false,
        createdAt: now(),
      },
    ],
    reviews: [],
    bookmarks: [],
    blocks: [],
    challenges: [
      { id: "ch_first", title: "First favor", description: "Complete 1 favor as a helper.", reward: 1, goal: 1, kind: "given" },
      { id: "ch_three", title: "On a roll", description: "Complete 3 favors.", reward: 2, goal: 3, kind: "given" },
      { id: "ch_five", title: "Neighborhood regular", description: "Give help 5 times.", reward: 3, goal: 5, kind: "given" },
    ],
    progress: {},
    plusWaitlist: false,
    circles,
    prefs: { nearbyNotifs: true, circleNotifs: true },
  };
}

let mem: DB | null = null;

function load(): DB {
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (raw) {
      mem = migrate(JSON.parse(raw) as DB);
      save();
      return mem;
    }
  } catch {
    /* ignore */
  }
  mem = seed();
  save();
  return mem;
}

function defaultCircles(selfId: string): Circle[] {
  return [
    { id: "c_marina", name: "Marina neighbors", kind: "My Neighborhood", city: "Dubai", memberIds: ["nb_maya", selfId] },
    { id: "c_jlt", name: "JLT building", kind: "My Building", city: "Dubai", memberIds: ["nb_omar"] },
    { id: "c_downtown", name: "Downtown community", kind: "Community", city: "Dubai", memberIds: ["nb_lina", "nb_sofia"] },
    { id: "c_friends", name: "Friends & family", kind: "Friends & Family", city: "Dubai", memberIds: [selfId] },
  ];
}

function migrate(db: DB): DB {
  if (!db.circles || db.circles.length === 0) db.circles = defaultCircles(db.selfId);
  db.prefs = {
    nearbyNotifs: db.prefs?.nearbyNotifs ?? true,
    circleNotifs: db.prefs?.circleNotifs ?? true,
  };
  db.people = (db.people ?? []).map((p) => {
    const skills = (p.skills ?? []).map((s) => LEGACY_SKILL[s] ?? s);
    const circleIds = p.circleIds ?? db.circles.filter((c) => c.memberIds.includes(p.userId)).map((c) => c.id);
    return enrichPerson({
      ...p,
      skills: skills.length ? skills : ["Household help"],
      circleIds,
    });
  });
  db.posts = (db.posts ?? []).map((p) => {
    const loc = locOf(p.area || "Nearby");
    const presence = p.presence ?? inferPresence(p);
    return {
      ...p,
      category: LEGACY_CATEGORY[p.category] ?? p.category,
      helpType: p.helpType ?? (p.creditReward === 0 ? "kindness" : "favor"),
      whenNeeded: p.whenNeeded ?? "Flexible",
      photoUrl: p.photoUrl ?? null,
      circleId: p.circleId ?? null,
      presence,
      audience: p.audience ?? (p.circleId ? "circle" : "nearby"),
      lat: p.lat ?? (presence === "online" ? null : loc.lat),
      lng: p.lng ?? (presence === "online" ? null : loc.lng),
      destLat: p.destLat ?? null,
      destLng: p.destLng ?? null,
      destArea: p.destArea ?? null,
      exactShared: Boolean(p.exactShared),
      meetingNote: p.meetingNote ?? null,
    };
  });
  return db;
}

function save() {
  if (!mem) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}

function self(): Person {
  const db = load();
  return db.people.find((p) => p.userId === db.selfId)!;
}
function person(id: string) {
  return load().people.find((p) => p.userId === id) ?? null;
}
function toPublic(p: Person): ProfilePublic {
  const db = load();
  const circleNames = (p.circleIds ?? []).map((id) => db.circles.find((c) => c.id === id)?.name).filter(Boolean) as string[];
  const asHelper = db.posts.filter((x) => x.helperId === p.userId);
  const helperDone = asHelper.filter((x) => x.status === "completed").length;
  const helperClosed = asHelper.filter((x) => x.status === "completed" || x.status === "cancelled").length;
  const hours = db.posts
    .filter((x) => x.status === "completed" && x.helperId === p.userId)
    .reduce((s, x) => s + hoursFromEstimate(x.estimatedTime), p.hoursGiven || 0);
  return {
    userId: p.userId,
    name: p.name,
    username: p.username,
    bio: p.bio,
    city: p.city,
    area: p.area,
    photoUrl: p.photoUrl,
    avatarHue: p.avatarHue,
    skills: p.skills,
    needHelpWith: p.needHelpWith,
    interests: p.interests,
    reputation: p.reputation,
    favorsGiven: p.favorsGiven,
    favorsReceived: p.favorsReceived,
    peopleHelped: p.favorsGiven,
    hoursGiven: Math.round(hours * 10) / 10,
    streak: p.streak,
    level: p.level,
    verified: p.verified,
    phoneVerified: p.phoneVerified,
    plus: p.plus,
    plusStatus: p.plusStatus,
    createdAt: p.createdAt,
    completionRate: helperClosed ? Math.round((helperDone / helperClosed) * 100) : p.completionRate || p.reputation,
    responseRate: p.responseRate || Math.min(99, p.reputation + 1),
    circleNames,
  };
}
function reservedOf(userId: string) {
  return load()
    .posts.filter(
      (p) =>
        p.userId === userId &&
        p.type === "request" &&
        p.helpType !== "kindness" &&
        p.creditReward > 0 &&
        ["open", "accepted", "in_progress", "pending_confirm"].includes(p.status),
    )
    .reduce((s, p) => s + p.creditReward, 0);
}
function toMe(p: Person): ProfileMe {
  const reserved = reservedOf(p.userId);
  return {
    ...toPublic(p),
    email: p.email,
    credits: p.credits,
    reserved,
    available: Math.max(0, p.credits - reserved),
    onboardingComplete: p.onboardingComplete,
    lat: p.lat,
    lng: p.lng,
    circleIds: p.circleIds ?? [],
    locationSource: p.locationSource ?? "default",
  };
}
function notify(userId: string, title: string, body: string, href: string, type = "note") {
  if (userId !== load().selfId) return;
  load().notifs.unshift({ id: nid("n"), type, title, body, href, read: false, createdAt: now() });
}

function inferPresence(p: { category: string; title: string; id?: string }) {
  const t = p.title.toLowerCase();
  if (t.includes("excel") || t.includes("english") || t.includes("flyer") || t.includes("canva")) return t.includes("english") ? "either" : "online";
  if (t.includes("airport") || t.includes("carrefour") || t.includes("lift")) return "pickup";
  return "in_person";
}

function locOf(name: string) {
  const a = areaByName(name);
  return { lat: a.lat, lng: a.lng, city: a.city, area: a.name };
}

function fuzz(lat: number, lng: number, id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const ang = ((h >>> 0) % 360) * (Math.PI / 180);
  const dist = 0.32 + ((h >>> 8) % 28) / 100;
  const dlat = (dist / 111) * Math.cos(ang);
  const dlng = (dist / (111 * Math.cos((lat * Math.PI) / 180) || 1)) * Math.sin(ang);
  return { lat: Math.round((lat + dlat) * 10000) / 10000, lng: Math.round((lng + dlng) * 10000) / 10000 };
}

function haversine(a: { lat: number | null; lng: number | null }, b: { lat: number | null; lng: number | null }) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 10) / 10;
}

function skillHit(skills: string[], category: string) {
  const cat = (LEGACY_CATEGORY[category] ?? category).toLowerCase();
  return skills.some((s) => {
    const n = s.toLowerCase();
    if (n === cat) return true;
    if (cat.includes("techn") && n.includes("techn")) return true;
    if (cat === "home" && (n.includes("household") || n.includes("repair"))) return true;
    if (cat === "moving" && n.includes("mov")) return true;
    if (cat === "transport" && n.includes("driv")) return true;
    if (cat === "shopping" && (n.includes("shop") || n.includes("errand"))) return true;
    if (cat === "learning" && n.includes("teach")) return true;
    if (cat === "pets" && n.includes("pet")) return true;
    return false;
  });
}

function matchScore(post: Post, me: Person, km: number | null) {
  let s = 0;
  const online = post.presence === "online";
  if (online) s += 18;
  else if (km == null) s += 8;
  else if (km < 1) s += 36;
  else if (km < 3) s += 24;
  else if (km < 8) s += 12;
  else s += 3;
  if (skillHit(me.skills, post.category)) s += 34;
  const author = person(post.userId);
  if (author) s += Math.round(author.reputation / 8);
  s += Math.round((me.responseRate || 80) / 20);
  if (post.circleId && me.circleIds.includes(post.circleId)) s += 22;
  const similar = load().posts.filter((x) => x.status === "completed" && x.helperId === me.userId && x.category === post.category).length;
  s += Math.min(12, similar * 4);
  const together = load().posts.some(
    (x) => x.status === "completed" && ((x.userId === me.userId && x.helperId === post.userId) || (x.helperId === me.userId && x.userId === post.userId)),
  );
  if (together) s += 16;
  const busy = load().posts.filter((x) => x.helperId === me.userId && ["accepted", "in_progress"].includes(x.status)).length;
  if (busy === 0) s += 10;
  else if (busy >= 2) s -= 8;
  if (post.boostedUntil && new Date(post.boostedUntil) > new Date()) s += 8;
  if (post.whenNeeded?.startsWith("Today")) s += 8;
  if (post.audience === "circle" && post.circleId && me.circleIds.includes(post.circleId)) s += 8;
  return s;
}

function card(post: Post): PostCard {
  const author = person(post.userId)!;
  const helper = post.helperId ? person(post.helperId) : null;
  const db = load();
  const me = self();
  const pending = db.offers.filter((o) => o.postId === post.id && o.status === "pending").length;
  const mine = db.offers.find((o) => o.postId === post.id && o.helperId === db.selfId);
  const point = { lat: post.lat ?? author.lat, lng: post.lng ?? author.lng };
  const km = post.presence === "online" ? null : haversine(me, point);
  const circle = post.circleId ? db.circles.find((c) => c.id === post.circleId) : null;
  const involved = me.userId === post.userId || me.userId === post.helperId;
  const accepted = ["accepted", "in_progress", "pending_confirm", "completed"].includes(post.status);
  const canSeeExact = involved && (me.userId === post.userId || (accepted && post.exactShared));
  const approx = point.lat != null && point.lng != null ? fuzz(point.lat, point.lng, post.id) : null;
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    description: post.description,
    category: post.category,
    city: post.city,
    area: post.area,
    destArea: post.destArea ?? null,
    estimatedTime: post.estimatedTime,
    creditReward: post.creditReward,
    helpType: post.helpType ?? "favor",
    presence: post.presence ?? "in_person",
    whenNeeded: post.whenNeeded ?? "Flexible",
    photoUrl: post.photoUrl ?? null,
    circleId: post.circleId ?? null,
    circleName: circle?.name ?? null,
    audience: post.audience ?? "nearby",
    status: post.status,
    lifecycle: lifecycleLabel(post.status, pending),
    deadline: post.deadline,
    boostedUntil: post.boostedUntil,
    createdAt: post.createdAt,
    distanceKm: km,
    matchScore: matchScore(post, me, km),
    bookmarked: db.bookmarks.includes(post.id),
    author: toPublic(author),
    helper: helper ? toPublic(helper) : null,
    pendingOfferCount: pending,
    myOfferStatus: mine?.status ?? null,
    approxLat: post.presence === "online" ? null : (approx?.lat ?? null),
    approxLng: post.presence === "online" ? null : (approx?.lng ?? null),
    exactShared: Boolean(post.exactShared),
    canSeeExact,
    meetingNote: canSeeExact ? post.meetingNote : null,
  };
}

function bumpChallenge() {
  const db = load();
  const me = self();
  for (const ch of db.challenges) {
    const cur = db.progress[ch.id] ?? { progress: 0, completed: false, rewarded: false };
    if (ch.kind === "given") cur.progress = me.favorsGiven;
    if (!cur.completed && cur.progress >= ch.goal) {
      cur.completed = true;
      if (!cur.rewarded) {
        me.credits += ch.reward;
        cur.rewarded = true;
        db.txs.unshift({
          id: nid("t"),
          fromUserId: null,
          toUserId: me.userId,
          amount: ch.reward,
          type: "challenge",
          relatedFavorId: null,
          label: ch.title,
          status: "completed",
          createdAt: now(),
        });
        notify(me.userId, "Challenge complete", `${ch.title} — +${ch.reward} credits`, "/app/challenges", "challenge");
      }
    }
    db.progress[ch.id] = cur;
  }
}

export async function getMe() {
  return ok(toMe(self()));
}

export async function completeOnboarding(raw: DataArg<{ name: string; username: string; bio: string; city: string; area: string; photoUrl: string | null; avatarHue: number; lat: number | null; lng: number | null; skills: string[]; needHelpWith: string[]; interests: string[] }>) {
  const data = arg(raw, {} as never);
  const me = self();
  if (!data.name || data.name.trim().length < 2) return fail("Please add your name.");
  me.name = data.name.slice(0, 60);
  me.username = (data.username || "you").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "you";
  me.bio = (data.bio ?? "").slice(0, 400);
  me.city = data.city || "Dubai";
  me.area = data.area || "Nearby";
  me.photoUrl = data.photoUrl;
  me.avatarHue = data.avatarHue ?? 168;
  me.lat = data.lat;
  me.lng = data.lng;
  me.skills = data.skills ?? me.skills;
  me.needHelpWith = data.needHelpWith ?? me.needHelpWith;
  me.interests = data.interests ?? me.interests;
  me.onboardingComplete = true;
  save();
  return ok(true);
}

export async function updateProfile(raw: DataArg<{ name: string; bio: string; city: string; area: string; photoUrl: string | null; avatarHue?: number; skills?: string[]; needHelpWith?: string[]; interests?: string[] }>) {
  const data = arg(raw, {} as never);
  const me = self();
  if (!data.name || data.name.trim().length < 2) return fail("Name is required.");
  if (data.photoUrl && data.photoUrl.length > PHOTO_MAX_CHARS) return fail("Photo is too large.");
  me.name = data.name.slice(0, 60);
  me.bio = data.bio ?? "";
  me.city = data.city || me.city;
  me.area = data.area ?? me.area;
  if (data.area) {
    const loc = locOf(data.area);
    me.lat = loc.lat;
    me.lng = loc.lng;
    me.locationSource = "manual";
  }
  me.photoUrl = data.photoUrl ?? me.photoUrl;
  if (data.avatarHue != null) me.avatarHue = data.avatarHue;
  if (data.skills) me.skills = data.skills;
  if (data.needHelpWith) me.needHelpWith = data.needHelpWith;
  if (data.interests) me.interests = data.interests;
  save();
  return ok(toMe(me));
}

export async function getProfile(raw: DataArg<{ userId: string }>) {
  const { userId } = arg(raw, { userId: "" });
  const p = person(userId);
  if (!p) return fail("Profile not found.");
  if (load().blocks.includes(userId) && userId !== load().selfId) return fail("This profile is not available.");
  return ok({
    profile: toPublic(p),
    isSelf: userId === load().selfId,
    reviews: load().reviews.filter((r) => r.toUserId === userId),
    completed: load()
      .posts.filter((x) => x.status === "completed" && (x.userId === userId || x.helperId === userId))
      .map((x) => ({ id: x.id, title: x.title, category: x.category, creditReward: x.creditReward, status: x.status, createdAt: x.createdAt })),
  });
}

export async function listPeople(raw?: DataArg<{ q?: string; city?: string }>) {
  const data = arg(raw, { q: "", city: "" });
  const q = (data.q ?? "").toLowerCase();
  const city = (data.city ?? "").toLowerCase();
  const db = load();
  const out = db.people
    .filter((p) => p.userId !== db.selfId && !db.blocks.includes(p.userId))
    .filter((p) => !city || p.city.toLowerCase() === city)
    .filter((p) => !q || `${p.name} ${p.username} ${p.bio} ${p.skills.join(" ")} ${p.city}`.toLowerCase().includes(q));
  return ok(out.map(toPublic));
}

export async function joinPlusWaitlist() {
  load().plusWaitlist = true;
  self().plusStatus = "waitlisted";
  save();
  return ok({
    me: toMe(self()),
    message: "You're on the Plus waitlist. Payments are not processed here — nothing was charged.",
  });
}

export async function createPost(
  raw: DataArg<{
    type: "request" | "offer";
    title: string;
    description: string;
    category: string;
    estimatedTime: string;
    creditReward: number;
    deadline: string | null;
    helpType?: string;
    whenNeeded?: string;
    photoUrl?: string | null;
    circleId?: string | null;
    presence?: string;
    audience?: string;
    lat?: number | null;
    lng?: number | null;
    destLat?: number | null;
    destLng?: number | null;
    destArea?: string | null;
  }>,
) {
  const data = arg(raw, {} as never);
  const me = self();
  if (!data.title || data.title.trim().length < 4) return fail("Add a short title so neighbors know what you need.");
  const category = LEGACY_CATEGORY[data.category] ?? data.category;
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) return fail("Pick a valid category.");
  if (!TIMES.includes(data.estimatedTime as (typeof TIMES)[number])) return fail("Pick a time estimate.");
  const helpType = HELP_TYPES.some((h) => h.id === data.helpType) ? data.helpType! : "favor";
  const presence = PRESENCE.some((h) => h.id === data.presence) ? data.presence! : "in_person";
  const whenNeeded = (WHEN_OPTS as readonly string[]).includes(data.whenNeeded ?? "") ? data.whenNeeded! : "Flexible";
  const reward =
    helpType === "kindness" ? 0 : Math.min(MAX_REWARD, Math.max(helpType === "favor" ? 1 : MIN_REWARD, Math.round(data.creditReward || 2)));
  if (data.type === "request" && reward > 0 && toMe(me).available < reward) {
    return fail(`You need ${reward} available favors in exchange. You have ${toMe(me).available} free.`);
  }
  if (data.photoUrl && data.photoUrl.length > PHOTO_MAX_CHARS) return fail("Photo is too large.");
  const audience = AUDIENCE.some((a) => a.id === data.audience) ? data.audience! : "nearby";
  const circleId = data.circleId && me.circleIds.includes(data.circleId) ? data.circleId : audience === "circle" ? (me.circleIds[0] ?? null) : null;
  if (audience === "circle" && !circleId) return fail("Join a Circle before asking only that Circle.");
  const needsPlace = presence === "in_person" || presence === "pickup";
  let lat = presence === "online" ? null : (data.lat ?? me.lat);
  let lng = presence === "online" ? null : (data.lng ?? me.lng);
  let area = data.lat != null ? nearestArea(data.lat, data.lng ?? 0).name : me.area;
  let city = data.lat != null ? nearestArea(data.lat, data.lng ?? 0).city : me.city;
  if (needsPlace && (lat == null || lng == null)) {
    const fallback = locOf(me.area || "Nearby");
    lat = fallback.lat;
    lng = fallback.lng;
    area = fallback.area;
    city = fallback.city;
  }
  if (presence === "pickup" && data.destLat == null && !data.destArea) {
    return fail("Add a pickup or drop-off area.");
  }
  const dest = data.destArea ? locOf(data.destArea) : data.destLat != null && data.destLng != null ? { lat: data.destLat, lng: data.destLng, area: nearestArea(data.destLat, data.destLng).name } : null;
  const post: Post = {
    id: nid("p"),
    userId: me.userId,
    type: data.type,
    title: data.title.slice(0, 140),
    description: data.description ?? "",
    category,
    city,
    area,
    estimatedTime: data.estimatedTime,
    creditReward: reward,
    helpType,
    presence,
    whenNeeded,
    photoUrl: data.photoUrl ?? null,
    circleId,
    audience,
    lat,
    lng,
    destLat: dest?.lat ?? null,
    destLng: dest?.lng ?? null,
    destArea: dest?.area ?? null,
    exactShared: false,
    meetingNote: null,
    status: "open",
    deadline: data.deadline,
    boostedUntil: null,
    helperId: null,
    createdAt: now(),
  };
  const db = load();
  db.posts.unshift(post);
  if (data.type === "request") {
    const helper =
      NEIGHBORS.filter((n) => !(audience === "circle" && circleId) || n.circleIds.includes(circleId!))
        .sort((a, b) => {
          const skill = Number(skillHit(b.skills, category)) - Number(skillHit(a.skills, category));
          if (skill) return skill;
          return (haversine(post, a) ?? 99) - (haversine(post, b) ?? 99);
        })[0] ?? NEIGHBORS[0];
    db.offers.unshift({
      id: nid("o"),
      postId: post.id,
      requesterId: me.userId,
      helperId: helper.userId,
      message: `I can help with this around ${helper.area}.`,
      status: "pending",
      createdAt: now(),
    });
    const km = haversine(me, helper);
    notify(
      me.userId,
      km != null ? `Someone ${km < 1 ? `${Math.round(km * 1000)}m` : `${km} km`} away can help` : "New offer to help",
      `${helper.name} offered on “${post.title}”.`,
      `/app/favor/${post.id}`,
      "new_offer",
    );
  }
  save();
  return ok(card(post));
}

export async function listDiscover(raw?: DataArg<{ q?: string; category?: string; type?: string; sort?: string; nearby?: boolean; circleId?: string; skillsOnly?: boolean }>) {
  const data = arg(raw, { q: "", category: "All", type: "all", sort: "newest", nearby: false, circleId: "", skillsOnly: false });
  const db = load();
  const me = self();
  let cards = db.posts
    .filter((p) => p.status === "open" && p.userId !== db.selfId && !db.blocks.includes(p.userId))
    .filter((p) => p.audience !== "circle" || !p.circleId || me.circleIds.includes(p.circleId))
    .map(card)
    .filter((c) => c.presence === "online" || c.distanceKm == null || c.distanceKm < 28);
  if (data.nearby) cards = cards.filter((c) => c.distanceKm != null && c.distanceKm < 8);
  if (data.type === "offer" || data.type === "request") cards = cards.filter((c) => c.type === data.type);
  if (data.category && data.category !== "All" && data.category !== "Nearby") cards = cards.filter((c) => c.category === data.category);
  if (data.circleId) cards = cards.filter((c) => c.circleId === data.circleId);
  if (data.skillsOnly) cards = cards.filter((c) => skillHit(me.skills, c.category));
  if (data.q) {
    const q = data.q.toLowerCase();
    cards = cards.filter((c) => `${c.title} ${c.description} ${c.category} ${c.author.name} ${c.helpType}`.toLowerCase().includes(q));
  }
  cards.sort((a, b) => {
    if (data.sort === "closest") return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
    if (data.sort === "match") return b.matchScore - a.matchScore;
    if (data.sort === "reward") return b.creditReward - a.creditReward;
    if (data.sort === "quickest") return a.estimatedTime.localeCompare(b.estimatedTime);
    const boost = Number(!!(b.boostedUntil && new Date(b.boostedUntil) > new Date())) - Number(!!(a.boostedUntil && new Date(a.boostedUntil) > new Date()));
    if (boost) return boost;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });
  return ok(cards);
}

export async function getPost(raw: DataArg<{ id: string }>) {
  const { id } = arg(raw, { id: "" });
  const post = load().posts.find((p) => p.id === id);
  if (!post) return fail("This request is gone.");
  const offers: OfferRow[] = load()
    .offers.filter((o) => o.postId === id)
    .map((o) => ({
      id: o.id,
      postId: o.postId,
      message: o.message,
      status: o.status,
      createdAt: o.createdAt,
      helper: toPublic(person(o.helperId)!),
    }));
  return ok({ post: card(post), offers });
}

export async function cancelPost(raw: DataArg<{ id: string }>) {
  const { id } = arg(raw, { id: "" });
  const post = load().posts.find((p) => p.id === id && p.userId === load().selfId);
  if (!post) return fail("You can only cancel your own request.");
  if (!["open", "accepted"].includes(post.status)) return fail("This request can no longer be cancelled.");
  post.status = "cancelled";
  post.helperId = null;
  save();
  return ok(true);
}

export async function toggleBookmark(raw: DataArg<{ id: string }>) {
  const { id } = arg(raw, { id: "" });
  const db = load();
  if (db.bookmarks.includes(id)) db.bookmarks = db.bookmarks.filter((x) => x !== id);
  else db.bookmarks.push(id);
  save();
  return ok({ bookmarked: db.bookmarks.includes(id) });
}

export async function boostPost(raw: DataArg<{ id: string }>) {
  const { id } = arg(raw, { id: "" });
  const me = self();
  const post = load().posts.find((p) => p.id === id && p.userId === me.userId);
  if (!post) return fail("You can only boost your own request.");
  if (toMe(me).available < 1) return fail("Boosting costs 1 available credit.");
  me.credits -= 1;
  post.boostedUntil = new Date(Date.now() + 12 * 3600_000).toISOString();
  load().txs.unshift({
    id: nid("t"),
    fromUserId: me.userId,
    toUserId: me.userId,
    amount: 1,
    type: "boost",
    relatedFavorId: post.id,
    label: "Boost",
    status: "completed",
    createdAt: now(),
  });
  save();
  return ok(true);
}

export async function offerHelp(raw: DataArg<{ postId: string; message: string }>) {
  const data = arg(raw, { postId: "", message: "" });
  const db = load();
  const post = db.posts.find((p) => p.id === data.postId);
  if (!post) return fail("Request not found.");
  if (post.userId === db.selfId) return fail("You cannot offer help on your own request.");
  if (post.status !== "open") return fail("This request is no longer open.");
  if (db.offers.some((o) => o.postId === post.id && o.helperId === db.selfId)) return fail("You already offered to help on this request.");
  const id = nid("o");
  db.offers.unshift({
    id,
    postId: post.id,
    requesterId: post.userId,
    helperId: db.selfId,
    message: data.message,
    status: "pending",
    createdAt: now(),
  });
  save();
  return ok({ id, status: "pending" as const });
}

export async function decideOffer(raw: DataArg<{ offerId: string; action: string }>) {
  const data = arg(raw, { offerId: "", action: "decline" });
  const db = load();
  const offer = db.offers.find((o) => o.id === data.offerId);
  if (!offer) return fail("Offer not found.");
  if (offer.requesterId !== db.selfId) return fail("Only the requester can accept or decline.");
  const post = db.posts.find((p) => p.id === offer.postId);
  if (!post || post.status !== "open") return fail("This request is no longer open.");
  if (data.action !== "accept") {
    offer.status = "declined";
    save();
    return ok({ status: "declined" as const });
  }
  offer.status = "accepted";
  post.status = "accepted";
  post.helperId = offer.helperId;
  db.offers.filter((o) => o.postId === post.id && o.id !== offer.id && o.status === "pending").forEach((o) => (o.status = "declined"));
  const convoId = nid("c");
  db.convos.unshift({
    id: convoId,
    postId: post.id,
    memberIds: [offer.requesterId, offer.helperId],
    archivedBy: [],
    lastRead: {},
  });
  const helper = person(offer.helperId)!;
  db.messages.push({
    id: nid("m"),
    conversationId: convoId,
    senderId: offer.helperId,
    body: `Hi — I can help with this. I’m in ${helper.area}.`,
    createdAt: now(),
  });
  notify(db.selfId, "Chat opened", `You’re looping with ${helper.name}.`, `/app/chat/${convoId}`, "offer_accepted");
  save();
  return ok({ status: "accepted" as const, conversationId: convoId });
}

function convoCard(c: Convo): ConversationRow {
  const db = load();
  const otherId = c.memberIds.find((id) => id !== db.selfId) ?? null;
  const msgs = db.messages.filter((m) => m.conversationId === c.id);
  const last = msgs[msgs.length - 1];
  const lastRead = c.lastRead[db.selfId];
  const unread = msgs.filter((m) => m.senderId !== db.selfId && (!lastRead || m.createdAt > lastRead)).length;
  const post = c.postId ? db.posts.find((p) => p.id === c.postId) : null;
  return {
    id: c.id,
    postId: c.postId,
    postTitle: post?.title ?? null,
    other: otherId ? toPublic(person(otherId)!) : null,
    lastMessage: last?.body ?? null,
    lastAt: last?.createdAt ?? null,
    unread,
  };
}

export async function listInbox() {
  const db = load();
  const rows = db.convos.filter((c) => c.memberIds.includes(db.selfId) && !c.archivedBy.includes(db.selfId)).map(convoCard);
  rows.sort((a, b) => +new Date(b.lastAt ?? 0) - +new Date(a.lastAt ?? 0));
  return ok(rows);
}

export async function getMessages(raw: DataArg<{ id?: string; conversationId?: string }>) {
  const data = arg(raw, { id: "", conversationId: "" });
  const id = data.conversationId || data.id || "";
  const db = load();
  const c = db.convos.find((x) => x.id === id);
  if (!c || !c.memberIds.includes(db.selfId)) return fail("Chat not found.");
  c.lastRead[db.selfId] = now();
  const postRow = c.postId ? db.posts.find((p) => p.id === c.postId) : null;
  const messages: MessageRow[] = db.messages
    .filter((m) => m.conversationId === id)
    .map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt,
      mine: m.senderId === db.selfId,
    }));
  save();
  const otherId = c.memberIds.find((x) => x !== db.selfId) ?? null;
  return ok({
    conversationId: id,
    other: otherId ? toPublic(person(otherId)!) : null,
    post: postRow
      ? {
          id: postRow.id,
          title: postRow.title,
          status: postRow.status,
          helperId: postRow.helperId,
          authorId: postRow.userId,
        }
      : null,
    messages,
  });
}

export async function sendMessage(raw: DataArg<{ id?: string; conversationId?: string; body: string }>) {
  const data = arg(raw, { id: "", conversationId: "", body: "" });
  const body = data.body.trim();
  if (!body) return fail("Write a message.");
  const db = load();
  const cid = data.conversationId || data.id || "";
  const c = db.convos.find((x) => x.id === cid);
  if (!c || !c.memberIds.includes(db.selfId)) return fail("Chat not found.");
  db.messages.push({ id: nid("m"), conversationId: c.id, senderId: db.selfId, body: body.slice(0, 2000), createdAt: now() });
  const other = c.memberIds.find((id) => id !== db.selfId);
  if (other && other.startsWith("nb_")) {
    const replies = ["On my way in 10.", "Got it — see you downstairs.", "Done on my side when you are.", "Happy to help. Confirm when you’re ready."];
    db.messages.push({
      id: nid("m"),
      conversationId: c.id,
      senderId: other,
      body: replies[Math.floor(Math.random() * replies.length)],
      createdAt: new Date(Date.now() + 400).toISOString(),
    });
  }
  save();
  return ok(true);
}

export async function getChatForPost(raw: DataArg<{ postId: string }>) {
  const { postId } = arg(raw, { postId: "" });
  const db = load();
  const c = db.convos.find((x) => x.postId === postId && x.memberIds.includes(db.selfId));
  if (!c) return fail("No chat yet.");
  return ok({ id: c.id, conversationId: c.id });
}

export async function startDirectChat(raw: DataArg<{ userId: string }>) {
  const { userId } = arg(raw, { userId: "" });
  const db = load();
  if (!person(userId)) return fail("Profile not found.");
  let c = db.convos.find((x) => !x.postId && x.memberIds.includes(db.selfId) && x.memberIds.includes(userId));
  if (!c) {
    c = { id: nid("c"), postId: null, memberIds: [db.selfId, userId], archivedBy: [], lastRead: {} };
    db.convos.unshift(c);
    save();
  }
  return ok({ id: c.id, conversationId: c.id });
}

export async function archiveConversation(raw: DataArg<{ id?: string; conversationId?: string }>) {
  const data = arg(raw, { id: "", conversationId: "" });
  const id = data.conversationId || data.id || "";
  const c = load().convos.find((x) => x.id === id);
  if (c && !c.archivedBy.includes(load().selfId)) c.archivedBy.push(load().selfId);
  save();
  return ok(true);
}

export async function startFavor(raw: DataArg<{ postId: string }>) {
  const { postId } = arg(raw, { postId: "" });
  const db = load();
  const post = db.posts.find((p) => p.id === postId);
  if (!post) return fail("Request not found.");
  if (post.status !== "accepted") return fail("This favor is not ready to start.");
  if (post.userId !== db.selfId && post.helperId !== db.selfId) return fail("Only people on this favor can start it.");
  post.status = "in_progress";
  notify(db.selfId, "Favor in progress", `“${post.title}” is underway. Approximate location stays private until you meet.`, `/app/favor/${post.id}`, "in_progress");
  save();
  return ok(true);
}

export async function requestComplete(raw: DataArg<{ postId: string }>) {
  const { postId } = arg(raw, { postId: "" });
  const db = load();
  const post = db.posts.find((p) => p.id === postId);
  if (!post || post.helperId !== db.selfId || !["accepted", "in_progress"].includes(post.status)) {
    return fail("Only the helper can request completion on an accepted favor.");
  }
  post.status = "pending_confirm";
  notify(post.userId, "Your favor was completed", `Confirm “${post.title}” so both of you can leave a review.`, `/app/favor/${post.id}`, "favor_completed");
  save();
  return ok(true);
}

export async function confirmComplete(raw: DataArg<{ postId: string }>) {
  const { postId } = arg(raw, { postId: "" });
  const db = load();
  const post = db.posts.find((p) => p.id === postId);
  if (!post) return fail("Request not found.");
  if (post.userId !== db.selfId) return fail("Only the requester can confirm.");
  if (post.status !== "pending_confirm" && post.status !== "accepted" && post.status !== "in_progress") return fail("Nothing to confirm yet.");
  if (!post.helperId) return fail("No helper on this favor.");
  const requester = person(post.userId)!;
  const helper = person(post.helperId)!;
  if (post.creditReward > 0) {
    if (requester.credits < post.creditReward) return fail("Not enough favors in exchange to complete this.");
    requester.credits -= post.creditReward;
    helper.credits += post.creditReward;
  }
  requester.favorsReceived += 1;
  helper.favorsGiven += 1;
  helper.hoursGiven = Math.round((helper.hoursGiven + hoursFromEstimate(post.estimatedTime)) * 10) / 10;
  helper.peopleHelped = helper.favorsGiven;
  helper.level = levelFrom(helper.favorsGiven);
  post.status = "completed";
  db.txs.unshift({
    id: nid("t"),
    fromUserId: requester.userId,
    toUserId: helper.userId,
    amount: post.creditReward,
    type: "favor_payout",
    relatedFavorId: post.id,
    label: post.title,
    status: "completed",
    createdAt: now(),
  });
  bumpChallenge();
  notify(helper.userId, "You helped someone today", `${requester.name} confirmed “${post.title}”.`, `/app/favor/${post.id}`, "helped");
  save();
  return ok(true);
}

export async function submitReview(raw: DataArg<{ favorId: string; toUserId: string; stars: number; tags: string[]; body: string }>) {
  const data = arg(raw, {} as never);
  const db = load();
  if (db.reviews.some((r) => r.favorId === data.favorId && r.fromUserId === db.selfId)) {
    return fail("You already reviewed this favor.");
  }
  const post = db.posts.find((p) => p.id === data.favorId);
  if (!post || post.status !== "completed") return fail("Reviews are only for completed favors.");
  if (post.userId !== db.selfId && post.helperId !== db.selfId) return fail("Only people on this favor can review it.");
  db.reviews.unshift({
    id: nid("r"),
    favorId: data.favorId,
    fromUserId: db.selfId,
    fromName: self().name,
    toUserId: data.toUserId,
    stars: Math.max(1, Math.min(5, data.stars || 5)),
    tags: data.tags ?? [],
    body: (data.body ?? "").slice(0, 400),
    createdAt: now(),
  });
  const target = person(data.toUserId);
  if (target) {
    const mine = db.reviews.filter((r) => r.toUserId === target.userId);
    const avg = mine.reduce((s, r) => s + r.stars, 0) / mine.length;
    target.reputation = Math.round(70 + avg * 6);
  }
  notify(db.selfId, "Someone you helped just thanked you", "A review from a completed favor was added.", `/app/profile/${data.toUserId}`, "thanks");
  save();
  return ok(true);
}

export async function reportContent(_raw?: DataArg<unknown>) {
  notify(load().selfId, "Report received", "Thanks. We’ll review this.", "/app/safety", "report");
  save();
  return ok(true);
}

export async function blockUser(raw: DataArg<{ userId: string; blocked?: boolean }>) {
  const { userId, blocked } = arg(raw, { userId: "", blocked: true });
  const db = load();
  if (blocked === false) db.blocks = db.blocks.filter((id) => id !== userId);
  else if (userId && !db.blocks.includes(userId)) db.blocks.push(userId);
  save();
  return ok(true);
}

export async function listBlocks() {
  return ok(load().blocks.map((id) => person(id)).filter(Boolean).map((p) => toPublic(p!)));
}

export async function getWallet() {
  const me = toMe(self());
  const db = load();
  const txs: TxRow[] = db.txs
    .filter((t) => t.toUserId === me.userId || t.fromUserId === me.userId)
    .map((t) => {
      const incoming = t.toUserId === me.userId && t.type !== "boost";
      const signed = t.type === "boost" ? -t.amount : incoming ? t.amount : -t.amount;
      const otherId = incoming ? t.fromUserId : t.toUserId === me.userId ? t.fromUserId : t.toUserId;
      return {
        ...t,
        signedAmount: signed,
        counterparty: otherId ? person(otherId)?.name ?? null : APP_NAME,
      };
    });
  const pending = db.posts
    .filter((p) => p.userId === me.userId && p.type === "request" && ["open", "accepted", "in_progress", "pending_confirm"].includes(p.status))
    .map((p) => ({ id: p.id, title: p.title, amount: p.creditReward, status: p.status }));
  return ok({
    credits: me.credits,
    reserved: me.reserved,
    available: me.available,
    earned: txs.filter((t) => t.signedAmount > 0 && t.type !== "starter").reduce((s, t) => s + t.signedAmount, 0),
    spent: txs.filter((t) => t.signedAmount < 0).reduce((s, t) => s + Math.abs(t.signedAmount), 0),
    transactions: txs,
    pending,
  });
}

export async function getChallenges() {
  const db = load();
  bumpChallenge();
  const challenges: ChallengeRow[] = db.challenges.map((c) => {
    const p = db.progress[c.id] ?? { progress: 0, completed: false, rewarded: false };
    return { ...c, progress: p.progress, completed: p.completed, rewarded: p.rewarded };
  });
  const people = db.people
    .filter((p) => p.userId !== db.selfId && !db.blocks.includes(p.userId))
    .sort((a, b) => b.favorsGiven - a.favorsGiven)
    .map((p) => ({
      userId: p.userId,
      name: p.name,
      username: p.username,
      area: p.area,
      city: p.city,
      photoUrl: p.photoUrl,
      avatarHue: p.avatarHue,
      favorsGiven: p.favorsGiven,
      reputation: p.reputation,
      plus: p.plus,
      verified: p.verified,
      isSelf: false,
    }));
  const me = self();
  return ok({
    streak: me.streak,
    level: me.level,
    challenges,
    leaderboard: [
      {
        userId: me.userId,
        name: me.name,
        username: me.username,
        area: me.area,
        city: me.city,
        photoUrl: me.photoUrl,
        avatarHue: me.avatarHue,
        favorsGiven: me.favorsGiven,
        reputation: me.reputation,
        plus: me.plus,
        verified: me.verified,
        isSelf: true,
      },
      ...people,
    ],
  });
}

export async function listNotifications() {
  const n = load().notifs;
  return ok({ notifications: n, unread: n.filter((x) => !x.read).length });
}

export async function markNotificationsRead() {
  load().notifs.forEach((n) => (n.read = true));
  save();
  return ok(true);
}

export async function getHome() {
  const db = load();
  const me = toMe(self());
  const mine = db.posts.filter((p) => p.userId === me.userId && ["open", "accepted", "in_progress", "pending_confirm"].includes(p.status)).map(card);
  const helping = db.posts.filter((p) => p.helperId === me.userId && ["accepted", "in_progress", "pending_confirm"].includes(p.status)).map(card);
  const open = db.posts
    .filter((p) => p.status === "open" && p.userId !== me.userId && p.type === "request" && !db.blocks.includes(p.userId))
    .filter((p) => p.audience !== "circle" || !p.circleId || me.circleIds.includes(p.circleId))
    .map(card)
    .filter((c) => c.presence === "online" || c.distanceKm == null || c.distanceKm < 28)
    .sort((a, b) => b.matchScore - a.matchScore);
  const skillMatches = open.filter((c) => skillHit(self().skills, c.category)).slice(0, 6);
  const people = db.people.filter((p) => p.userId !== me.userId).slice(0, 6).map(toPublic);
  const ch = await getChallenges();
  const impact: Impact = {
    favorsCompleted: self().favorsGiven + self().favorsReceived,
    peopleHelped: self().favorsGiven,
    hoursGiven: toPublic(self()).hoursGiven,
    peopleHelpedYou: self().favorsReceived,
  };
  const payload: HomePayload = {
    me,
    openMine: mine,
    helping,
    recommended: open.slice(0, 8),
    skillMatches,
    people,
    notifications: db.notifs.slice(0, 6),
    unread: db.notifs.filter((n) => !n.read).length,
    challenges: ch.ok ? ch.data.challenges : [],
    impact,
    circles: db.circles.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      city: c.city,
      memberCount: c.memberIds.length,
      joined: c.memberIds.includes(me.userId),
    })),
    needsLocation: me.locationSource === "default",
  };
  return ok(payload);
}

export async function setMyLocation(raw: DataArg<{ lat: number; lng: number; area?: string; city?: string; source: string }>) {
  const data = arg(raw, { lat: 0, lng: 0, source: "manual" });
  const me = self();
  if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return fail("That location is not valid.");
  const area = nearestArea(data.lat, data.lng);
  const prevArea = me.area;
  me.lat = data.lat;
  me.lng = data.lng;
  me.area = data.area || area.name;
  me.city = data.city || area.city;
  me.locationSource = data.source || "manual";
  const db = load();
  const prefs = db.prefs ?? { nearbyNotifs: true, circleNotifs: true };
  const nearby = db.posts
    .filter((p) => p.status === "open" && p.userId !== me.userId && p.type === "request")
    .map(card)
    .filter((c) => c.presence === "online" || (c.distanceKm != null && c.distanceKm < 8));
  const skillN = nearby.filter((c) => skillHit(me.skills, c.category)).length;
  const circleN = nearby.filter((c) => c.circleId && me.circleIds.includes(c.circleId)).length;
  const moved = prevArea !== me.area || data.source === "gps";
  const already = db.notifs.some((n) => n.type === "nearby_match" && Date.now() - +new Date(n.createdAt) < 36e5);
  if (moved && prefs.nearbyNotifs && skillN > 0 && !already) {
    notify(
      me.userId,
      skillN === 1 ? "Someone nearby needs your skills" : `${skillN} favors near you match your skills`,
      me.area ? `Around ${me.area}. Approximate areas only.` : "Matched by skill, distance, and reliability.",
      "/app",
      "nearby_match",
    );
  }
  if (moved && prefs.circleNotifs && circleN > 0 && !db.notifs.some((n) => n.type === "circle_match" && Date.now() - +new Date(n.createdAt) < 36e5)) {
    notify(me.userId, "Your Circle has a new request", "People you already trust asked for a hand nearby.", "/app/circles", "circle_match");
  }
  save();
  return ok(toMe(me));
}

export async function getPrefs() {
  const db = load();
  return ok(db.prefs ?? { nearbyNotifs: true, circleNotifs: true });
}

export async function updatePrefs(raw: DataArg<{ nearbyNotifs?: boolean; circleNotifs?: boolean }>) {
  const data = arg(raw, {});
  const db = load();
  db.prefs = {
    nearbyNotifs: data.nearbyNotifs ?? db.prefs?.nearbyNotifs ?? true,
    circleNotifs: data.circleNotifs ?? db.prefs?.circleNotifs ?? true,
  };
  save();
  return ok(db.prefs);
}

export async function shareMeeting(raw: DataArg<{ postId: string; note: string }>) {
  const { postId, note } = arg(raw, { postId: "", note: "" });
  const db = load();
  const post = db.posts.find((p) => p.id === postId);
  if (!post) return fail("Request not found.");
  if (post.userId !== db.selfId) return fail("Only the requester can share a meeting point.");
  if (!["accepted", "in_progress", "pending_confirm"].includes(post.status)) return fail("Share a meeting point after someone is accepted.");
  const text = note.trim().slice(0, 280);
  if (text.length < 4) return fail("Add a meeting point, without private details you are not ready to share.");
  post.exactShared = true;
  post.meetingNote = text;
  if (post.helperId) {
    notify(post.helperId, "A meeting point was shared", `For “${post.title}”. Keep it between you two.`, `/app/favor/${post.id}`, "meeting");
  }
  save();
  return ok(card(post));
}

export async function listCircles() {
  const db = load();
  const rows: CircleRow[] = db.circles.map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
    city: c.city,
    memberCount: c.memberIds.length,
    joined: c.memberIds.includes(db.selfId),
  }));
  return ok(rows);
}

export async function joinCircle(raw: DataArg<{ circleId: string; join?: boolean }>) {
  const { circleId, join } = arg(raw, { circleId: "", join: true });
  const db = load();
  const c = db.circles.find((x) => x.id === circleId);
  if (!c) return fail("Circle not found.");
  const me = self();
  if (join === false) {
    c.memberIds = c.memberIds.filter((id) => id !== me.userId);
    me.circleIds = me.circleIds.filter((id) => id !== c.id);
  } else if (!c.memberIds.includes(me.userId)) {
    c.memberIds.push(me.userId);
    me.circleIds.push(c.id);
  }
  save();
  return listCircles();
}

export async function saveHelpSkills(raw: DataArg<{ skills: string[] }>) {
  const { skills } = arg(raw, { skills: [] as string[] });
  const me = self();
  me.skills = skills.slice(0, 8);
  save();
  return ok(toMe(me));
}
