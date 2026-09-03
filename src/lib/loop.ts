import { APP_NAME, CATEGORIES, LEVELS, MAX_REWARD, MIN_REWARD, PHOTO_MAX_CHARS, STARTER_CREDITS, TIMES } from "@/lib/constants";
import type {
  ChallengeRow,
  ConversationRow,
  HomePayload,
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
  status: string;
  deadline: string | null;
  boostedUntil: string | null;
  helperId: string | null;
  createdAt: string;
};

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

const NEIGHBORS: Person[] = [
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

const SEED_POSTS: Array<Omit<Post, "createdAt"> & { hoursAgo: number }> = [
  { id: "p_wifi", userId: "nb_lina", type: "request", title: "Help me set up a mesh Wi-Fi", description: "New apartment, two floors, the office room gets one bar. Need someone who has done this before.", category: "Tech", city: "Dubai", area: "Downtown", estimatedTime: "30–60 min", creditReward: 3, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 2 },
  { id: "p_ikea", userId: "nb_maya", type: "request", title: "Build a Billy bookcase", description: "It’s still in the box. Tools are here, patience is not.", category: "Home", city: "Dubai", area: "Marina", estimatedTime: "1–2 hours", creditReward: 4, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 5 },
  { id: "p_excel", userId: "nb_omar", type: "request", title: "Excel formula for a small shop ledger", description: "Need SUMIFS and a clean monthly sheet. I can share a sample file.", category: "Learning", city: "Dubai", area: "JLT", estimatedTime: "30–60 min", creditReward: 2, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 8 },
  { id: "p_airport", userId: "nb_sofia", type: "request", title: "Lift to DXB tomorrow 6am", description: "One suitcase, Terminal 3. Happy to wait at the lobby.", category: "Transport", city: "Dubai", area: "Business Bay", estimatedTime: "30–60 min", creditReward: 3, status: "open", deadline: null, boostedUntil: new Date(Date.now() + 36e5).toISOString(), helperId: null, hoursAgo: 1 },
  { id: "p_canva", userId: "nb_yusuf", type: "offer", title: "I can make a simple flyer tonight", description: "Canva or Figma. Menus, event posters, Instagram square.", category: "Creative", city: "Dubai", area: "Al Barsha", estimatedTime: "15–30 min", creditReward: 2, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 3 },
  { id: "p_english", userId: "nb_yusuf", type: "offer", title: "English conversation, 20 minutes", description: "Casual practice. No textbooks. Voice note or in person nearby.", category: "Learning", city: "Dubai", area: "Al Barsha", estimatedTime: "15–30 min", creditReward: 1, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 12 },
  { id: "p_move", userId: "nb_noor", type: "offer", title: "I can help move boxes this weekend", description: "Car + two hands. Stairs are fine. Marina / JLT / Downtown.", category: "Home", city: "Dubai", area: "Deira", estimatedTime: "1–2 hours", creditReward: 3, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 9 },
  { id: "p_shop", userId: "nb_lina", type: "offer", title: "Carrefour run this evening", description: "Already going. Add your list if it’s small.", category: "Errands", city: "Dubai", area: "Downtown", estimatedTime: "15–30 min", creditReward: 1, status: "open", deadline: null, boostedUntil: null, helperId: null, hoursAgo: 4 },
];

function makeSelf(): Person {
  return {
    userId: nid("me"),
    name: "You",
    username: "you",
    bio: "New in the loop. Happy to help with small favors.",
    city: "Dubai",
    area: "Nearby",
    photoUrl: null,
    avatarHue: 168,
    skills: ["Errands"],
    needHelpWith: ["Tech", "Home"],
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
  };
}

function seed(): DB {
  const self = makeSelf();
  const posts: Post[] = SEED_POSTS.map((p) => ({
    ...p,
    createdAt: new Date(Date.now() - p.hoursAgo * 3600_000).toISOString(),
  }));
  return {
    selfId: self.userId,
    people: [self, ...NEIGHBORS],
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
        label: "Promotional starter credits",
        status: "completed",
        createdAt: now(),
      },
    ],
    notifs: [
      {
        id: nid("n"),
        type: "welcome",
        title: `Welcome to ${APP_NAME}`,
        body: "You have 3 credits. Help someone, or post a small request.",
        href: "/app/discover",
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
  };
}

let mem: DB | null = null;

function load(): DB {
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (raw) {
      mem = JSON.parse(raw) as DB;
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
  const { email: _e, credits: _c, onboardingComplete: _o, lat: _la, lng: _ln, ...pub } = p;
  return pub;
}
function reservedOf(userId: string) {
  return load()
    .posts.filter((p) => p.userId === userId && p.type === "request" && ["open", "accepted", "pending_confirm"].includes(p.status))
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
  };
}
function notify(userId: string, title: string, body: string, href: string, type = "note") {
  if (userId !== load().selfId) return;
  load().notifs.unshift({ id: nid("n"), type, title, body, href, read: false, createdAt: now() });
}
function card(post: Post): PostCard {
  const author = person(post.userId)!;
  const helper = post.helperId ? person(post.helperId) : null;
  const db = load();
  const pending = db.offers.filter((o) => o.postId === post.id && o.status === "pending").length;
  const mine = db.offers.find((o) => o.postId === post.id && o.helperId === db.selfId);
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    description: post.description,
    category: post.category,
    city: post.city,
    area: post.area,
    estimatedTime: post.estimatedTime,
    creditReward: post.creditReward,
    status: post.status,
    deadline: post.deadline,
    boostedUntil: post.boostedUntil,
    createdAt: post.createdAt,
    distanceKm: 1.2,
    bookmarked: db.bookmarks.includes(post.id),
    author: toPublic(author),
    helper: helper ? toPublic(helper) : null,
    pendingOfferCount: pending,
    myOfferStatus: mine?.status ?? null,
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

export async function createPost(raw: DataArg<{ type: "request" | "offer"; title: string; description: string; category: string; estimatedTime: string; creditReward: number; deadline: string | null }>) {
  const data = arg(raw, {} as never);
  const me = self();
  if (!data.title || data.title.trim().length < 4) return fail("Add a short title so neighbors know what you need.");
  if (!CATEGORIES.includes(data.category as (typeof CATEGORIES)[number])) return fail("Pick a valid category.");
  if (!TIMES.includes(data.estimatedTime as (typeof TIMES)[number])) return fail("Pick a time estimate.");
  const reward = Math.min(MAX_REWARD, Math.max(MIN_REWARD, Math.round(data.creditReward || 2)));
  if (data.type === "request" && toMe(me).available < reward) {
    return fail(`You need ${reward} available credits. You have ${toMe(me).available} free.`);
  }
  const post: Post = {
    id: nid("p"),
    userId: me.userId,
    type: data.type,
    title: data.title.slice(0, 140),
    description: data.description ?? "",
    category: data.category,
    city: me.city,
    area: me.area,
    estimatedTime: data.estimatedTime,
    creditReward: reward,
    status: "open",
    deadline: data.deadline,
    boostedUntil: null,
    helperId: null,
    createdAt: now(),
  };
  const db = load();
  db.posts.unshift(post);
  if (data.type === "request") {
    const helper = NEIGHBORS.find((n) => n.skills.some((s) => s.toLowerCase().includes(data.category.toLowerCase().slice(0, 4)))) ?? NEIGHBORS[0];
    db.offers.unshift({
      id: nid("o"),
      postId: post.id,
      requesterId: me.userId,
      helperId: helper.userId,
      message: `I can help with this around ${helper.area}.`,
      status: "pending",
      createdAt: now(),
    });
    notify(me.userId, "New offer to help", `${helper.name} offered on “${post.title}”.`, `/app/favor/${post.id}`, "new_offer");
  }
  save();
  return ok(card(post));
}

export async function listDiscover(raw?: DataArg<{ q?: string; category?: string; type?: string; sort?: string; nearby?: boolean }>) {
  const data = arg(raw, { q: "", category: "All", type: "all", sort: "newest", nearby: false });
  const db = load();
  let cards = db.posts.filter((p) => p.status === "open" && p.userId !== db.selfId && !db.blocks.includes(p.userId)).map(card);
  if (data.type === "offer" || data.type === "request") cards = cards.filter((c) => c.type === data.type);
  if (data.category && data.category !== "All" && data.category !== "Nearby") cards = cards.filter((c) => c.category === data.category);
  if (data.q) {
    const q = data.q.toLowerCase();
    cards = cards.filter((c) => `${c.title} ${c.description} ${c.category} ${c.author.name}`.toLowerCase().includes(q));
  }
  cards.sort((a, b) => {
    const boost = Number(!!(b.boostedUntil && new Date(b.boostedUntil) > new Date())) - Number(!!(a.boostedUntil && new Date(a.boostedUntil) > new Date()));
    if (boost) return boost;
    if (data.sort === "reward") return b.creditReward - a.creditReward;
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

export async function requestComplete(raw: DataArg<{ postId: string }>) {
  const { postId } = arg(raw, { postId: "" });
  const db = load();
  const post = db.posts.find((p) => p.id === postId);
  if (!post || post.helperId !== db.selfId || post.status !== "accepted") return fail("Only the helper can request completion on an accepted favor.");
  post.status = "pending_confirm";
  notify(post.userId, "Helper marked this done", `Confirm “${post.title}” to send credits.`, `/app/favor/${post.id}`, "favor_completed");
  save();
  return ok(true);
}

export async function confirmComplete(raw: DataArg<{ postId: string }>) {
  const { postId } = arg(raw, { postId: "" });
  const db = load();
  const post = db.posts.find((p) => p.id === postId);
  if (!post) return fail("Request not found.");
  if (post.userId !== db.selfId) return fail("Only the requester can confirm.");
  if (post.status !== "pending_confirm" && post.status !== "accepted") return fail("Nothing to confirm yet.");
  if (!post.helperId) return fail("No helper on this favor.");
  const requester = person(post.userId)!;
  const helper = person(post.helperId)!;
  if (requester.credits < post.creditReward) return fail("Not enough credits to pay out.");
  requester.credits -= post.creditReward;
  helper.credits += post.creditReward;
  requester.favorsReceived += 1;
  helper.favorsGiven += 1;
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
  save();
  return ok(true);
}

export async function submitReview(raw: DataArg<{ favorId: string; toUserId: string; stars: number; tags: string[]; body: string }>) {
  const data = arg(raw, {} as never);
  const db = load();
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
    .filter((p) => p.userId === me.userId && p.type === "request" && ["open", "accepted", "pending_confirm"].includes(p.status))
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
  const mine = db.posts.filter((p) => p.userId === me.userId && ["open", "accepted", "pending_confirm"].includes(p.status)).map(card);
  const helping = db.posts.filter((p) => p.helperId === me.userId && ["accepted", "pending_confirm"].includes(p.status)).map(card);
  const rec = (await listDiscover({ data: { type: "all", category: "All", sort: "newest", q: "" } })).ok
    ? ((await listDiscover({ data: { type: "all", category: "All", sort: "newest", q: "" } })) as { ok: true; data: PostCard[] }).data.slice(0, 6)
    : [];
  const people = db.people.filter((p) => p.userId !== me.userId).slice(0, 6).map(toPublic);
  const ch = await getChallenges();
  const payload: HomePayload = {
    me,
    openMine: mine,
    helping,
    recommended: rec,
    people,
    notifications: db.notifs.slice(0, 6),
    unread: db.notifs.filter((n) => !n.read).length,
    challenges: ch.ok ? ch.data.challenges : [],
  };
  return ok(payload);
}
