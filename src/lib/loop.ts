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
  DisputeRow,
  HomePayload,
  Impact,
  MessageRow,
  NotifRow,
  OfferRow,
  PersonaRow,
  PostCard,
  ProfileMe,
  ProfilePublic,
  ReportRow,
  ReviewRow,
  TrustBreakdown,
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
  intent: string;
  availability: string;
  preferredRadius: number;
  presencePref: string;
  admin: boolean;
  suspended: boolean;
  warned: boolean;
  unreliableCancels: number;
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
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  radiusKm: number;
  expiredAt: string | null;
  disputeStatus: string | null;
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

type Prefs = {
  nearbyNotifs: boolean;
  circleNotifs: boolean;
  availability: string;
  preferredRadius: number;
  presencePref: string;
};

type StoredNotif = NotifRow & { userId: string };
type Bookmark = { userId: string; postId: string };
type Block = { blockerId: string; blockedId: string };
type Report = {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  postId: string | null;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  resolution: string | null;
};
type Dispute = {
  id: string;
  postId: string;
  reporterId: string;
  againstUserId: string | null;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  resolution: string | null;
};

type DB = {
  selfId: string;
  people: Person[];
  posts: Post[];
  offers: Offer[];
  convos: Convo[];
  messages: Msg[];
  txs: Tx[];
  notifs: StoredNotif[];
  reviews: Review[];
  bookmarks: Bookmark[];
  blocks: Block[];
  challenges: Challenge[];
  progress: Record<string, { progress: number; completed: boolean; rewarded: boolean }>;
  plusWaitlist: boolean;
  circles: Circle[];
  prefs: Prefs;
  reports: Report[];
  disputes: Dispute[];
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
  p: Omit<
    Person,
    "peopleHelped" | "hoursGiven" | "phoneVerified" | "completionRate" | "responseRate" | "circleNames" | "circleIds" | "locationSource" | "intent" | "availability" | "preferredRadius" | "presencePref" | "admin" | "suspended" | "warned" | "unreliableCancels"
  > & {
    circleIds?: string[];
    locationSource?: string;
    intent?: string;
    availability?: string;
    preferredRadius?: number;
    presencePref?: string;
    admin?: boolean;
    suspended?: boolean;
    warned?: boolean;
    unreliableCancels?: number;
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
    intent: p.intent ?? "both",
    availability: p.availability ?? "Flexible",
    preferredRadius: p.preferredRadius ?? 12,
    presencePref: p.presencePref ?? "either",
    admin: Boolean(p.admin),
    suspended: Boolean(p.suspended),
    warned: Boolean(p.warned),
    unreliableCancels: p.unreliableCancels ?? 0,
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
  Omit<Post, "createdAt" | "helpType" | "whenNeeded" | "photoUrl" | "circleId" | "presence" | "audience" | "lat" | "lng" | "destLat" | "destLng" | "destArea" | "exactShared" | "meetingNote" | "cancelledBy" | "cancelledAt" | "cancelReason" | "radiusKm" | "expiredAt" | "disputeStatus"> & {
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
      ...p,
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
      cancelledBy: null,
      cancelledAt: null,
      cancelReason: null,
      radiusKm: 12,
      expiredAt: null,
      disputeStatus: null,
      category: LEGACY_CATEGORY[p.category] ?? p.category,
      createdAt: new Date(Date.now() - p.hoursAgo * 3600_000).toISOString(),
    };
  });
  const people = [self, ...NEIGHBORS, demoAisha(), demoBilal(), demoAdmin(), demoNew()].map((p) => {
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
        userId: self.userId,
        type: "welcome",
        title: `Welcome to ${APP_NAME}`,
        body: "Ask for a small hand, or help someone nearby.",
        href: "/app/discover",
        read: false,
        createdAt: now(),
      },
      {
        id: nid("n"),
        userId: self.userId,
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
    prefs: { nearbyNotifs: true, circleNotifs: true, availability: "Flexible", preferredRadius: 12, presencePref: "either" },
    reports: [],
    disputes: [],
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
    { id: "c_marina", name: "Marina neighbors", kind: "My Neighborhood", city: "Dubai", memberIds: ["nb_maya", "demo_a", "demo_b", selfId] },
    { id: "c_jlt", name: "JLT building", kind: "My Building", city: "Dubai", memberIds: ["nb_omar", "demo_b"] },
    { id: "c_downtown", name: "Downtown community", kind: "Community", city: "Dubai", memberIds: ["nb_lina", "nb_sofia"] },
    { id: "c_friends", name: "Friends & family", kind: "Friends & Family", city: "Dubai", memberIds: [selfId, "demo_a"] },
  ];
}

function demoAisha(): Person {
  return enrichPerson({
    userId: "demo_a",
    name: "Aisha Rahman",
    username: "aisha",
    bio: "New in Marina. Asking neighbors for small hands, happy to return the favor.",
    city: "Dubai",
    area: "Marina",
    photoUrl: null,
    avatarHue: 18,
    skills: ["Household help", "Shopping"],
    needHelpWith: ["Moving", "Technology"],
    interests: ["Neighbors", "Family"],
    reputation: 50,
    favorsGiven: 0,
    favorsReceived: 0,
    streak: 0,
    level: 1,
    verified: true,
    plus: false,
    plusStatus: "free",
    createdAt: "2026-08-30T10:00:00.000Z",
    email: null,
    credits: STARTER_CREDITS,
    onboardingComplete: true,
    lat: 25.0805,
    lng: 55.1403,
    circleIds: ["c_marina", "c_friends"],
    locationSource: "manual",
    intent: "need",
    availability: "Today",
    preferredRadius: 8,
    presencePref: "in_person",
  });
}

function demoBilal(): Person {
  return enrichPerson({
    userId: "demo_b",
    name: "Bilal Hassan",
    username: "bilal",
    bio: "Ikea, stairs, and a reliable car. I like helping in JLT and Marina.",
    city: "Dubai",
    area: "JLT",
    photoUrl: null,
    avatarHue: 168,
    skills: ["Moving", "Household help", "Driving"],
    needHelpWith: ["Technology"],
    interests: ["Neighbors", "Fitness"],
    reputation: 50,
    favorsGiven: 0,
    favorsReceived: 0,
    streak: 0,
    level: 1,
    verified: true,
    plus: false,
    plusStatus: "free",
    createdAt: "2026-08-29T10:00:00.000Z",
    email: null,
    credits: STARTER_CREDITS,
    onboardingComplete: true,
    lat: 25.0692,
    lng: 55.1415,
    circleIds: ["c_marina", "c_jlt"],
    locationSource: "manual",
    intent: "help",
    availability: "Now",
    preferredRadius: 12,
    presencePref: "in_person",
  });
}

function demoAdmin(): Person {
  return enrichPerson({
    userId: "demo_admin",
    name: "Onegai Moderator",
    username: "moderator",
    bio: "Reviews reports and disputes so neighbors stay safe.",
    city: "Dubai",
    area: "Downtown",
    photoUrl: null,
    avatarHue: 220,
    skills: [],
    needHelpWith: [],
    interests: ["Neighbors"],
    reputation: 99,
    favorsGiven: 0,
    favorsReceived: 0,
    streak: 0,
    level: 5,
    verified: true,
    plus: true,
    plusStatus: "plus",
    createdAt: "2026-01-01T10:00:00.000Z",
    email: null,
    credits: 0,
    onboardingComplete: true,
    lat: 25.1972,
    lng: 55.2744,
    circleIds: [],
    locationSource: "manual",
    intent: "both",
    admin: true,
  });
}

function demoNew(): Person {
  return enrichPerson({
    userId: "demo_new",
    name: "New neighbor",
    username: "new",
    bio: "",
    city: "Dubai",
    area: "Nearby",
    photoUrl: null,
    avatarHue: 168,
    skills: [],
    needHelpWith: [],
    interests: [],
    reputation: 50,
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
    onboardingComplete: false,
    lat: null,
    lng: null,
    circleIds: [],
    locationSource: "default",
    intent: "both",
  });
}

function ensureDemoPeople(db: DB) {
  const add = (p: Person) => {
    if (!db.people.some((x) => x.userId === p.userId)) db.people.push(p);
  };
  add(demoAisha());
  add(demoBilal());
  add(demoAdmin());
  add(demoNew());
  for (const c of db.circles) {
    if (c.id === "c_marina") {
      for (const id of ["demo_a", "demo_b"]) if (!c.memberIds.includes(id)) c.memberIds.push(id);
    }
    if (c.id === "c_jlt" && !c.memberIds.includes("demo_b")) c.memberIds.push("demo_b");
    if (c.id === "c_friends" && !c.memberIds.includes("demo_a")) c.memberIds.push("demo_a");
  }
}

function migrate(db: DB): DB {
  if (!db.circles || db.circles.length === 0) db.circles = defaultCircles(db.selfId);
  db.prefs = {
    nearbyNotifs: db.prefs?.nearbyNotifs ?? true,
    circleNotifs: db.prefs?.circleNotifs ?? true,
    availability: db.prefs?.availability ?? "Flexible",
    preferredRadius: db.prefs?.preferredRadius ?? 12,
    presencePref: db.prefs?.presencePref ?? "either",
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
  ensureDemoPeople(db);
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
      cancelledBy: p.cancelledBy ?? null,
      cancelledAt: p.cancelledAt ?? null,
      cancelReason: p.cancelReason ?? null,
      radiusKm: p.radiusKm ?? 12,
      expiredAt: p.expiredAt ?? null,
      disputeStatus: p.disputeStatus ?? null,
    };
  });
  const rawBook = db.bookmarks as unknown;
  if (!Array.isArray(rawBook)) db.bookmarks = [];
  else if (typeof rawBook[0] === "string") {
    db.bookmarks = (rawBook as string[]).map((postId) => ({ userId: db.selfId, postId }));
  }
  const rawBlocks = db.blocks as unknown;
  if (!Array.isArray(rawBlocks)) db.blocks = [];
  else if (typeof rawBlocks[0] === "string") {
    db.blocks = (rawBlocks as string[]).map((blockedId) => ({ blockerId: db.selfId, blockedId }));
  }
  db.notifs = ((db.notifs ?? []) as StoredNotif[]).map((n) => ({
    ...n,
    userId: n.userId ?? db.selfId,
  }));
  db.reports = db.reports ?? [];
  db.disputes = db.disputes ?? [];
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
    .reduce((s, x) => s + hoursFromEstimate(x.estimatedTime), 0);
  const trust = trustOf(p);
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
    reputation: trust.score,
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
    completionRate: helperClosed ? Math.round((helperDone / helperClosed) * 100) : p.favorsGiven === 0 ? 100 : p.completionRate || 100,
    responseRate: responseRateOf(p),
    circleNames,
  };
}

function trustOf(p: Person): TrustBreakdown {
  const db = load();
  const reviews = db.reviews.filter((r) => r.toUserId === p.userId);
  const completedHelper = db.posts.filter((x) => x.status === "completed" && x.helperId === p.userId).length;
  const completedAsk = db.posts.filter((x) => x.status === "completed" && x.userId === p.userId).length;
  const avgStars = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : null;
  const identity = p.verified ? 8 : 0;
  const completed = Math.min(24, completedHelper * 3 + Math.min(8, completedAsk));
  const reviewPts = avgStars == null ? 0 : Math.round((avgStars - 3) * 8);
  const reliability = -Math.min(18, (p.unreliableCancels || 0) * 6);
  const accountAgeDays = Math.max(1, Math.round((Date.now() - +new Date(p.createdAt)) / 86400000));
  const score = Math.max(15, Math.min(99, 50 + identity + completed + reviewPts + reliability));
  return {
    score,
    identity,
    completed,
    reviews: reviewPts,
    reliability,
    reviewCount: reviews.length,
    avgStars,
    unreliableCancels: p.unreliableCancels || 0,
    accountAgeDays,
  };
}

function responseRateOf(p: Person) {
  const db = load();
  const incoming = db.offers.filter((o) => o.requesterId === p.userId);
  if (incoming.length === 0) return p.favorsGiven + p.favorsReceived === 0 ? 100 : p.responseRate || 100;
  const decided = incoming.filter((o) => o.status !== "pending").length;
  return Math.round((decided / incoming.length) * 100);
}

function blockedWith(otherId: string, selfId = load().selfId) {
  return load().blocks.some(
    (b) => (b.blockerId === selfId && b.blockedId === otherId) || (b.blockerId === otherId && b.blockedId === selfId),
  );
}

function myNotifs() {
  return load().notifs.filter((n) => n.userId === load().selfId);
}

function assertActive(): { ok: false; error: string } | null {
  if (self().suspended) return { ok: false, error: "This account is suspended. Contact Onegai if this is a mistake." };
  return null;
}

function expiresAt(post: Post): number {
  if (post.deadline) {
    const d = +new Date(post.deadline);
    if (Number.isFinite(d)) return d;
  }
  const created = +new Date(post.createdAt);
  const when = post.whenNeeded ?? "Flexible";
  if (when.startsWith("Today")) return created + 18 * 3600_000;
  if (when === "Tomorrow") return created + 36 * 3600_000;
  if (when === "This weekend") return created + 72 * 3600_000;
  return created + 7 * 86400_000;
}

function expireOpenPosts() {
  const db = load();
  let changed = false;
  for (const p of db.posts) {
    if (p.status !== "open") continue;
    if (Date.now() <= expiresAt(p)) continue;
    p.status = "expired";
    p.expiredAt = now();
    notify(p.userId, "Request expired", `No one accepted “${p.title}” in time. You can edit, expand the area, or try again.`, `/app/favor/${p.id}`, "expired");
    changed = true;
  }
  if (changed) save();
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
    intent: p.intent,
    availability: p.availability,
    preferredRadius: p.preferredRadius,
    presencePref: p.presencePref,
    admin: p.admin,
    suspended: p.suspended,
    trust: trustOf(p),
  };
}
function notify(userId: string, title: string, body: string, href: string, type = "note") {
  if (!userId) return;
  const recent = load().notifs.find(
    (n) => n.userId === userId && n.type === type && n.href === href && Date.now() - +new Date(n.createdAt) < 120_000,
  );
  if (recent) return;
  load().notifs.unshift({ id: nid("n"), userId, type, title, body, href, read: false, createdAt: now() });
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
  if (me.availability === "Now" || me.availability === "Today") s += 8;
  if (me.presencePref === "online" && post.presence === "in_person") s -= 12;
  else if (me.presencePref === "in_person" && post.presence === "online") s -= 8;
  else if (me.presencePref === post.presence || me.presencePref === "either" || post.presence === "either") s += 6;
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
  const bookmarked = db.bookmarks.some((b) => b.userId === me.userId && b.postId === post.id);
  const reviewedByMe = db.reviews.some((r) => r.favorId === post.id && r.fromUserId === me.userId);
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
    bookmarked,
    author: toPublic(author),
    helper: helper ? toPublic(helper) : null,
    pendingOfferCount: pending,
    myOfferStatus: mine?.status ?? null,
    approxLat: post.presence === "online" ? null : (approx?.lat ?? null),
    approxLng: post.presence === "online" ? null : (approx?.lng ?? null),
    exactShared: Boolean(post.exactShared),
    canSeeExact,
    meetingNote: canSeeExact ? post.meetingNote : null,
    cancelledBy: post.cancelledBy,
    cancelledAt: post.cancelledAt,
    cancelReason: post.cancelReason,
    radiusKm: post.radiusKm ?? 12,
    reviewedByMe,
    disputeStatus: post.disputeStatus,
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

export async function completeOnboarding(raw: DataArg<{ name: string; username: string; bio: string; city: string; area: string; photoUrl: string | null; avatarHue: number; lat: number | null; lng: number | null; skills: string[]; needHelpWith: string[]; interests: string[]; intent?: string }>) {
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
  if (data.lat != null && data.lng != null) me.locationSource = "gps";
  else if (data.area) me.locationSource = "manual";
  me.skills = data.skills ?? me.skills;
  me.needHelpWith = data.needHelpWith ?? me.needHelpWith;
  me.interests = data.interests ?? me.interests;
  if (data.intent && ["need", "help", "both"].includes(data.intent)) me.intent = data.intent;
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
  if (blockedWith(userId) && userId !== load().selfId) return fail("This profile is not available.");
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
    .filter((p) => p.userId !== db.selfId && !blockedWith(p.userId) && !p.suspended)
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
  const stopped = assertActive();
  if (stopped) return stopped;
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
    cancelledBy: null,
    cancelledAt: null,
    cancelReason: null,
    radiusKm: me.preferredRadius ?? 12,
    expiredAt: null,
    disputeStatus: null,
  };
  const db = load();
  db.posts.unshift(post);
  if (data.type === "request") {
    let n = 0;
    for (const helper of db.people) {
      if (helper.userId === me.userId || helper.suspended || helper.admin) continue;
      if (blockedWith(helper.userId, me.userId)) continue;
      if (audience === "circle" && circleId && !helper.circleIds.includes(circleId)) continue;
      if (!skillHit(helper.skills, category)) continue;
      const km = presence === "online" ? 0 : haversine(helper, { lat, lng });
      const radius = Math.max(post.radiusKm, helper.preferredRadius ?? 12);
      if (presence !== "online" && km != null && km > radius) continue;
      notify(helper.userId, "A nearby favor matches you", `“${post.title}” around ${area}.`, `/app/favor/${post.id}`, "match");
      n += 1;
      if (n >= 6) break;
    }
  }
  save();
  return ok(card(post));
}

export async function listDiscover(raw?: DataArg<{ q?: string; category?: string; type?: string; sort?: string; nearby?: boolean; circleId?: string; skillsOnly?: boolean; page?: number }>) {
  const data = arg(raw, { q: "", category: "All", type: "all", sort: "newest", nearby: false, circleId: "", skillsOnly: false, page: 0 });
  expireOpenPosts();
  const db = load();
  const me = self();
  const page = Math.max(0, data.page ?? 0);
  const pageSize = 24;
  let cards = db.posts
    .filter((p) => p.status === "open" && p.userId !== db.selfId && !blockedWith(p.userId) && p.type !== undefined)
    .filter((p) => p.audience !== "circle" || !p.circleId || me.circleIds.includes(p.circleId))
    .map(card)
    .filter((c) => c.presence === "online" || c.distanceKm == null || c.distanceKm <= (c.radiusKm ?? 12));
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
  return ok(cards.slice(page * pageSize, page * pageSize + pageSize));
}

export async function getPost(raw: DataArg<{ id: string }>) {
  const { id } = arg(raw, { id: "" });
  expireOpenPosts();
  const post = load().posts.find((p) => p.id === id);
  if (!post) return fail("This request is gone.");
  if (blockedWith(post.userId) && post.userId !== load().selfId && post.helperId !== load().selfId) {
    return fail("This user is no longer available.");
  }
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

export async function cancelPost(raw: DataArg<{ id: string; reason?: string }>) {
  const { id, reason } = arg(raw, { id: "", reason: "" });
  const stopped = assertActive();
  if (stopped) return stopped;
  const db = load();
  const post = db.posts.find((p) => p.id === id);
  if (!post) return fail("That favor is no longer available.");
  const me = db.selfId;
  const isRequester = post.userId === me;
  const isHelper = post.helperId === me;
  if (!isRequester && !isHelper) return fail("You can only cancel a favor you are part of.");
  if (["completed", "cancelled", "expired"].includes(post.status)) return fail("This request can no longer be cancelled.");
  const afterMatch = ["accepted", "in_progress", "pending_confirm", "disputed"].includes(post.status);
  post.status = "cancelled";
  post.cancelledBy = me;
  post.cancelledAt = now();
  post.cancelReason = (reason || "").trim().slice(0, 280) || (isHelper ? "Helper cancelled" : "Requester cancelled");
  db.offers.filter((o) => o.postId === post.id && o.status === "pending").forEach((o) => (o.status = "declined"));
  if (afterMatch) {
    const actor = self();
    actor.unreliableCancels = (actor.unreliableCancels || 0) + 1;
    if (actor.unreliableCancels <= 2) {
      /* first two late cancels are noted, not heavily punished */
    }
  }
  const otherId = isRequester ? post.helperId : post.userId;
  if (otherId) {
    notify(
      otherId,
      isHelper ? "The helper cancelled" : "The requester cancelled",
      `“${post.title}” was cancelled${post.cancelReason ? ` · ${post.cancelReason}` : ""}.`,
      `/app/favor/${post.id}`,
      "cancelled",
    );
  }
  save();
  return ok(true);
}

export async function toggleBookmark(raw: DataArg<{ id: string }>) {
  const { id } = arg(raw, { id: "" });
  const db = load();
  const existing = db.bookmarks.find((b) => b.userId === db.selfId && b.postId === id);
  if (existing) db.bookmarks = db.bookmarks.filter((b) => b !== existing);
  else db.bookmarks.push({ userId: db.selfId, postId: id });
  save();
  return ok({ bookmarked: db.bookmarks.some((b) => b.userId === db.selfId && b.postId === id) });
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
  const stopped = assertActive();
  if (stopped) return stopped;
  const db = load();
  const post = db.posts.find((p) => p.id === data.postId);
  if (!post) return fail("Request not found.");
  if (post.userId === db.selfId) return fail("You cannot offer help on your own request.");
  if (post.status !== "open") return fail("This request is no longer open.");
  if (post.type !== "request") return fail("This is an offer, not a request.");
  if (blockedWith(post.userId)) return fail("This user is no longer available.");
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
  const helper = self();
  notify(post.userId, "Someone offered to help", `${helper.name} offered on “${post.title}”.`, `/app/favor/${post.id}`, "new_offer");
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
    notify(offer.helperId, "Offer declined", `The requester passed on “${post.title}”.`, `/app/favor/${post.id}`, "offer_declined");
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
  notify(offer.helperId, "Your offer was accepted", `${self().name} accepted you for “${post.title}”.`, `/app/chat/${convoId}`, "offer_accepted");
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
  const otherId = c.memberIds.find((id) => id !== db.selfId);
  if (otherId && blockedWith(otherId)) return fail("You can’t message this person.");
  const stopped = assertActive();
  if (stopped) return stopped;
  db.messages.push({ id: nid("m"), conversationId: c.id, senderId: db.selfId, body: body.slice(0, 2000), createdAt: now() });
  if (otherId) {
    notify(otherId, "New message", body.slice(0, 80), `/app/chat/${c.id}`, "message");
  }
  if (otherId && otherId.startsWith("nb_")) {
    const replies = ["On my way in 10.", "Got it — see you downstairs.", "Done on my side when you are.", "Happy to help. Confirm when you’re ready."];
    db.messages.push({
      id: nid("m"),
      conversationId: c.id,
      senderId: otherId,
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
  if (blockedWith(userId)) return fail("This user is no longer available.");
  const stopped = assertActive();
  if (stopped) return stopped;
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
  notify(post.userId, "Favor in progress", `“${post.title}” is underway. Approximate location stays private until you meet.`, `/app/favor/${post.id}`, "in_progress");
  if (post.helperId) notify(post.helperId, "Favor in progress", `“${post.title}” is underway.`, `/app/favor/${post.id}`, "in_progress");
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
  notify(post.userId, "Please confirm completion", `Confirm “${post.title}” so both of you can leave a review.`, `/app/favor/${post.id}`, "confirm_needed");
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
  notify(helper.userId, "You helped someone today", `${requester.name} confirmed “${post.title}”. Please leave a review.`, `/app/favor/${post.id}`, "helped");
  notify(requester.userId, "Favor completed", `“${post.title}” is done. Please leave a review.`, `/app/favor/${post.id}`, "review_requested");
  save();
  return ok(true);
}

export async function submitReview(raw: DataArg<{ favorId: string; toUserId: string; stars: number; tags: string[]; body: string }>) {
  const data = arg(raw, {} as never);
  const db = load();
  if (data.toUserId === db.selfId) return fail("You cannot review yourself.");
  if (db.reviews.some((r) => r.favorId === data.favorId && r.fromUserId === db.selfId)) {
    return fail("You already reviewed this favor.");
  }
  const post = db.posts.find((p) => p.id === data.favorId);
  if (!post || post.status !== "completed") return fail("Reviews are only for completed favors.");
  if (post.userId !== db.selfId && post.helperId !== db.selfId) return fail("Only people on this favor can review it.");
  const counterpart = db.selfId === post.userId ? post.helperId : post.userId;
  if (!counterpart || data.toUserId !== counterpart) return fail("You can only review the other person on this favor.");
  const samePair = db.reviews.filter(
    (r) =>
      r.fromUserId === db.selfId &&
      r.toUserId === data.toUserId &&
      Date.now() - +new Date(r.createdAt) < 24 * 3600_000,
  ).length;
  if (samePair >= 2) return fail("Trust only moves from real completed favors — not repeated ratings.");
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
    target.reputation = trustOf(target).score;
  }
  notify(data.toUserId, "Someone thanked you", `${self().name} left a review after a completed favor.`, `/app/profile/${data.toUserId}`, "thanks");
  save();
  return ok(true);
}

export async function reportContent(raw?: DataArg<{ reportedUserId?: string | null; postId?: string | null; reason?: string; details?: string }>) {
  const data = arg(raw, { reportedUserId: null as string | null, postId: null as string | null, reason: "", details: "" });
  const db = load();
  if (!data.reason) return fail("Please say why you are reporting.");
  if (!data.reportedUserId && !data.postId) return fail("Nothing to report.");
  if (data.reportedUserId === db.selfId) return fail("You cannot report yourself.");
  const report: Report = {
    id: nid("rp"),
    reporterId: db.selfId,
    reportedUserId: data.reportedUserId ?? null,
    postId: data.postId ?? null,
    reason: data.reason.slice(0, 80),
    details: (data.details ?? "").slice(0, 500),
    status: "open",
    createdAt: now(),
    resolution: null,
  };
  db.reports.unshift(report);
  notify(db.selfId, "Report received", "Thanks. A moderator will review this.", "/app/safety", "report");
  const admin = db.people.find((p) => p.admin);
  if (admin) notify(admin.userId, "New report", `${self().name}: ${data.reason}`, "/app/admin", "report");
  save();
  return ok(true);
}

export async function blockUser(raw: DataArg<{ userId: string; blocked?: boolean }>) {
  const { userId, blocked } = arg(raw, { userId: "", blocked: true });
  const db = load();
  if (!userId || userId === db.selfId) return fail("You cannot block yourself.");
  if (blocked === false) db.blocks = db.blocks.filter((b) => !(b.blockerId === db.selfId && b.blockedId === userId));
  else if (!db.blocks.some((b) => b.blockerId === db.selfId && b.blockedId === userId)) {
    db.blocks.push({ blockerId: db.selfId, blockedId: userId });
    db.offers
      .filter((o) => o.status === "pending" && ((o.helperId === userId && o.requesterId === db.selfId) || (o.helperId === db.selfId && o.requesterId === userId)))
      .forEach((o) => (o.status = "declined"));
  }
  save();
  return ok(true);
}

export async function listBlocks() {
  const db = load();
  return ok(
    db.blocks
      .filter((b) => b.blockerId === db.selfId)
      .map((b) => person(b.blockedId))
      .filter(Boolean)
      .map((p) => toPublic(p!)),
  );
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
    .filter((p) => p.userId !== db.selfId && !blockedWith(p.userId) && !p.admin)
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
  const n = myNotifs();
  return ok({ notifications: n.map(({ userId: _u, ...rest }) => rest), unread: n.filter((x) => !x.read).length });
}

export async function markNotificationsRead() {
  const id = load().selfId;
  load().notifs.forEach((n) => {
    if (n.userId === id) n.read = true;
  });
  save();
  return ok(true);
}

export async function getHome() {
  expireOpenPosts();
  const db = load();
  const me = toMe(self());
  const mine = db.posts.filter((p) => p.userId === me.userId && ["open", "accepted", "in_progress", "pending_confirm", "expired", "disputed"].includes(p.status)).map(card);
  const helping = db.posts.filter((p) => p.helperId === me.userId && ["accepted", "in_progress", "pending_confirm", "disputed"].includes(p.status)).map(card);
  const radius = me.preferredRadius ?? 12;
  const open = db.posts
    .filter((p) => p.status === "open" && p.userId !== me.userId && p.type === "request" && !blockedWith(p.userId))
    .filter((p) => p.audience !== "circle" || !p.circleId || me.circleIds.includes(p.circleId))
    .map(card)
    .filter((c) => c.presence === "online" || c.distanceKm == null || c.distanceKm <= Math.max(c.radiusKm ?? 12, radius))
    .sort((a, b) => b.matchScore - a.matchScore);
  const skillMatches = open.filter((c) => skillHit(self().skills, c.category)).slice(0, 8);
  const people = db.people.filter((p) => p.userId !== me.userId && !blockedWith(p.userId) && !p.admin).slice(0, 6).map(toPublic);
  const ch = await getChallenges();
  const notes = myNotifs();
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
    notifications: notes.slice(0, 6).map(({ userId: _u, ...rest }) => rest),
    unread: notes.filter((n) => !n.read).length,
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
  const already = db.notifs.some((n) => n.userId === me.userId && n.type === "nearby_match" && Date.now() - +new Date(n.createdAt) < 36e5);
  if (moved && prefs.nearbyNotifs && skillN > 0 && !already) {
    notify(
      me.userId,
      skillN === 1 ? "Someone nearby needs your skills" : `${skillN} favors near you match your skills`,
      me.area ? `Around ${me.area}. Approximate areas only.` : "Matched by skill, distance, and reliability.",
      "/app",
      "nearby_match",
    );
  }
  if (moved && prefs.circleNotifs && circleN > 0 && !db.notifs.some((n) => n.userId === me.userId && n.type === "circle_match" && Date.now() - +new Date(n.createdAt) < 36e5)) {
    notify(me.userId, "Your Circle has a new request", "People you already trust asked for a hand nearby.", "/app/circles", "circle_match");
  }
  save();
  return ok(toMe(me));
}

export async function getPrefs() {
  const db = load();
  const me = self();
  return ok({
    nearbyNotifs: db.prefs?.nearbyNotifs ?? true,
    circleNotifs: db.prefs?.circleNotifs ?? true,
    availability: me.availability,
    preferredRadius: me.preferredRadius,
    presencePref: me.presencePref,
  });
}

export async function updatePrefs(raw: DataArg<{ nearbyNotifs?: boolean; circleNotifs?: boolean; availability?: string; preferredRadius?: number; presencePref?: string }>) {
  const data = arg(raw, {});
  const db = load();
  db.prefs = {
    nearbyNotifs: data.nearbyNotifs ?? db.prefs?.nearbyNotifs ?? true,
    circleNotifs: data.circleNotifs ?? db.prefs?.circleNotifs ?? true,
    availability: data.availability ?? db.prefs?.availability ?? "Flexible",
    preferredRadius: data.preferredRadius ?? db.prefs?.preferredRadius ?? 12,
    presencePref: data.presencePref ?? db.prefs?.presencePref ?? "either",
  };
  const me = self();
  if (data.availability) me.availability = data.availability;
  if (data.preferredRadius) me.preferredRadius = data.preferredRadius;
  if (data.presencePref) me.presencePref = data.presencePref;
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

export async function saveHelpSkills(raw: DataArg<{ skills: string[]; availability?: string; preferredRadius?: number; presencePref?: string }>) {
  const data = arg(raw, { skills: [] as string[] });
  const me = self();
  me.skills = data.skills.slice(0, 8);
  if (data.availability) me.availability = data.availability;
  if (data.preferredRadius) me.preferredRadius = data.preferredRadius;
  if (data.presencePref) me.presencePref = data.presencePref;
  save();
  return ok(toMe(me));
}

export async function adoptSession(
  raw: DataArg<{ userId: string; name: string | null; email: string | null; photoUrl: string | null }>,
) {
  const data = arg(raw, { userId: "", name: null, email: null, photoUrl: null });
  if (!data.userId) return fail("Missing account.");
  const db = load();
  const existing = person(data.userId);
  if (!existing) {
    const username =
      (data.email?.split("@")[0] || data.name || "neighbor")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 16) || "neighbor";
    const created = enrichPerson({
      userId: data.userId,
      name: (data.name || "Neighbor").slice(0, 60),
      username,
      bio: "",
      city: "Dubai",
      area: "Nearby",
      photoUrl: data.photoUrl,
      avatarHue: 168,
      skills: [],
      needHelpWith: [],
      interests: ["Neighbors"],
      reputation: 50,
      favorsGiven: 0,
      favorsReceived: 0,
      streak: 0,
      level: 1,
      verified: false,
      plus: false,
      plusStatus: "free",
      createdAt: now(),
      email: data.email,
      credits: STARTER_CREDITS,
      onboardingComplete: false,
      lat: null,
      lng: null,
      circleIds: [],
      locationSource: "default",
      intent: "both",
    });
    db.people.push(created);
    for (const c of db.circles) {
      if ((c.id === "c_marina" || c.id === "c_friends") && !c.memberIds.includes(created.userId)) c.memberIds.push(created.userId);
    }
    created.circleIds = db.circles.filter((c) => c.memberIds.includes(created.userId)).map((c) => c.id);
    notify(created.userId, `Welcome to ${APP_NAME}`, "Ask for a small hand, or help someone nearby.", "/app/discover", "welcome");
    db.selfId = created.userId;
    save();
    return ok(toMe(created));
  }
  if (data.email && !existing.email) existing.email = data.email;
  if (data.photoUrl && !existing.photoUrl) existing.photoUrl = data.photoUrl;
  if (data.name && (existing.name === "Neighbor" || existing.name === "You" || existing.name === "New neighbor")) existing.name = data.name.slice(0, 60);
  db.selfId = existing.userId;
  save();
  return ok(toMe(existing));
}

export async function updatePost(raw: DataArg<{ id: string; title?: string; description?: string; whenNeeded?: string; category?: string }>) {
  const data = arg(raw, { id: "" });
  const stopped = assertActive();
  if (stopped) return stopped;
  const post = load().posts.find((p) => p.id === data.id);
  if (!post) return fail("That favor is no longer available.");
  if (post.userId !== load().selfId) return fail("You can only edit your own request.");
  if (!["open", "expired"].includes(post.status)) return fail("This request can no longer be edited.");
  if (data.title && data.title.trim().length >= 4) post.title = data.title.slice(0, 140);
  if (data.description != null) post.description = data.description.slice(0, 800);
  if (data.whenNeeded && (WHEN_OPTS as readonly string[]).includes(data.whenNeeded)) post.whenNeeded = data.whenNeeded;
  if (data.category) post.category = LEGACY_CATEGORY[data.category] ?? data.category;
  if (post.status === "expired") {
    post.status = "open";
    post.expiredAt = null;
    post.createdAt = now();
  }
  save();
  return ok(card(post));
}

export async function expandArea(raw: DataArg<{ id: string }>) {
  const { id } = arg(raw, { id: "" });
  const post = load().posts.find((p) => p.id === id);
  if (!post) return fail("That favor is no longer available.");
  if (post.userId !== load().selfId) return fail("Only the requester can expand the area.");
  if (!["open", "expired"].includes(post.status)) return fail("This request can no longer be expanded.");
  post.radiusKm = Math.min(50, Math.round((post.radiusKm || 12) * 2));
  if (post.status === "expired") {
    post.status = "open";
    post.expiredAt = null;
    post.createdAt = now();
  }
  save();
  return ok(card(post));
}

export async function reopenPost(raw: DataArg<{ id: string }>) {
  const { id } = arg(raw, { id: "" });
  const post = load().posts.find((p) => p.id === id);
  if (!post) return fail("That favor is no longer available.");
  if (post.userId !== load().selfId) return fail("Only the requester can reopen this.");
  if (!["expired", "cancelled", "open"].includes(post.status)) return fail("This request cannot be tried again yet.");
  post.status = "open";
  post.expiredAt = null;
  post.cancelledBy = null;
  post.cancelledAt = null;
  post.cancelReason = null;
  post.helperId = null;
  post.createdAt = now();
  save();
  return ok(card(post));
}

export async function reportOutcome(raw: DataArg<{ postId: string; reason: string; details?: string }>) {
  const data = arg(raw, { postId: "", reason: "" });
  const stopped = assertActive();
  if (stopped) return stopped;
  const db = load();
  const post = db.posts.find((p) => p.id === data.postId);
  if (!post) return fail("That favor is no longer available.");
  if (post.userId !== db.selfId && post.helperId !== db.selfId) return fail("Only people on this favor can report what happened.");
  if (!["accepted", "in_progress", "pending_confirm", "disputed"].includes(post.status)) {
    return fail("You can only report a problem on an active favor.");
  }
  const against = db.selfId === post.userId ? post.helperId : post.userId;
  db.disputes.unshift({
    id: nid("ds"),
    postId: post.id,
    reporterId: db.selfId,
    againstUserId: against,
    reason: data.reason.slice(0, 80),
    details: (data.details ?? "").slice(0, 500),
    status: "open",
    createdAt: now(),
    resolution: null,
  });
  post.status = "disputed";
  post.disputeStatus = "open";
  if (against) {
    notify(against, "A favor needs review", `${self().name} reported a problem with “${post.title}”. Trust is not changed until a moderator looks.`, `/app/favor/${post.id}`, "dispute");
  }
  const admin = db.people.find((p) => p.admin);
  if (admin) notify(admin.userId, "New dispute", `${self().name}: ${data.reason} · ${post.title}`, "/app/admin", "dispute");
  save();
  return ok(true);
}

export async function listPersonas() {
  const db = load();
  const roles: Record<string, string> = {
    demo_a: "Requester",
    demo_b: "Helper",
    demo_admin: "Moderator",
    demo_new: "New neighbor",
  };
  const ids = new Set(["demo_a", "demo_b", "demo_admin", "demo_new", db.selfId]);
  const rows: PersonaRow[] = db.people
    .filter((p) => ids.has(p.userId))
    .map((p) => ({
      userId: p.userId,
      name: p.name,
      role: roles[p.userId] ?? "You",
      active: p.userId === db.selfId,
      admin: Boolean(p.admin),
    }));
  return ok(rows);
}

export async function switchUser(raw: DataArg<{ userId: string }>) {
  const { userId } = arg(raw, { userId: "" });
  const db = load();
  const p = person(userId);
  if (!p) return fail("That person isn’t in this neighborhood.");
  db.selfId = userId;
  save();
  return ok(toMe(p));
}

function requireAdmin(): { ok: false; error: string } | null {
  if (!self().admin) return { ok: false, error: "Admin tools are only for moderators." };
  return null;
}

export async function getAdmin() {
  const gate = requireAdmin();
  if (gate) return gate;
  const db = load();
  const reports: ReportRow[] = db.reports.map((r) => ({
    id: r.id,
    reporterId: r.reporterId,
    reporterName: person(r.reporterId)?.name ?? "Neighbor",
    reportedUserId: r.reportedUserId,
    reportedName: r.reportedUserId ? person(r.reportedUserId)?.name ?? null : null,
    postId: r.postId,
    postTitle: r.postId ? (db.posts.find((p) => p.id === r.postId)?.title ?? null) : null,
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.createdAt,
    resolution: r.resolution,
  }));
  const disputes: DisputeRow[] = db.disputes.map((d) => ({
    id: d.id,
    postId: d.postId,
    postTitle: db.posts.find((p) => p.id === d.postId)?.title ?? "Favor",
    reporterId: d.reporterId,
    reporterName: person(d.reporterId)?.name ?? "Neighbor",
    againstUserId: d.againstUserId,
    reason: d.reason,
    details: d.details,
    status: d.status,
    createdAt: d.createdAt,
    resolution: d.resolution,
  }));
  return ok({
    users: db.people.filter((p) => !p.admin).map((p) => ({
      ...toPublic(p),
      suspended: p.suspended,
      warned: p.warned,
    })),
    activeFavors: db.posts.filter((p) => ["open", "accepted", "in_progress", "pending_confirm", "disputed"].includes(p.status)).map(card),
    completedFavors: db.posts.filter((p) => p.status === "completed").slice(0, 40).map(card),
    reports,
    disputes,
    blocks: db.blocks.map((b) => ({
      blocker: person(b.blockerId)?.name ?? b.blockerId,
      blocked: person(b.blockedId)?.name ?? b.blockedId,
    })),
    suspended: db.people.filter((p) => p.suspended).map(toPublic),
    reviews: db.reviews.slice(0, 40),
  });
}

export async function adminAction(
  raw: DataArg<{
    action: string;
    reportId?: string;
    disputeId?: string;
    userId?: string;
    postId?: string;
    resolution?: string;
  }>,
) {
  const gate = requireAdmin();
  if (gate) return gate;
  const data = arg(raw, { action: "" });
  const db = load();
  const action = data.action;
  if (action === "review_report") {
    const r = db.reports.find((x) => x.id === data.reportId);
    if (!r) return fail("Report not found.");
    r.status = "reviewed";
    r.resolution = data.resolution || "Reviewed";
    notify(r.reporterId, "Report update", "A moderator reviewed your report.", "/app/safety", "report");
  } else if (action === "warn_user") {
    const p = person(data.userId ?? "");
    if (!p) return fail("User not found.");
    p.warned = true;
    notify(p.userId, "A moderator sent a warning", data.resolution || "Please follow Onegai’s safety guidelines.", "/app/safety", "warn");
  } else if (action === "suspend_user") {
    const p = person(data.userId ?? "");
    if (!p) return fail("User not found.");
    p.suspended = true;
    notify(p.userId, "Account suspended", "A moderator paused this account. Contact Onegai if this is a mistake.", "/app/safety", "suspend");
  } else if (action === "restore_user") {
    const p = person(data.userId ?? "");
    if (!p) return fail("User not found.");
    p.suspended = false;
    p.warned = false;
    notify(p.userId, "Account restored", "A moderator restored your account.", "/app", "restore");
  } else if (action === "remove_post") {
    const post = db.posts.find((p) => p.id === data.postId);
    if (!post) return fail("Favor not found.");
    post.status = "cancelled";
    post.cancelReason = "Removed by moderator";
    post.cancelledBy = db.selfId;
    post.cancelledAt = now();
    notify(post.userId, "A request was removed", `“${post.title}” was taken down.`, "/app", "removed");
  } else if (action === "resolve_dispute") {
    const d = db.disputes.find((x) => x.id === data.disputeId);
    if (!d) return fail("Dispute not found.");
    const post = db.posts.find((p) => p.id === d.postId);
    const how = data.resolution || "no_fault";
    d.status = "resolved";
    d.resolution = how;
    if (post) {
      post.disputeStatus = "resolved";
      if (how === "completed_anyway") post.status = "completed";
      else post.status = "cancelled";
      if (how === "helper_fault" && post.helperId) {
        const h = person(post.helperId);
        if (h) h.unreliableCancels += 1;
      }
      if (how === "requester_fault") {
        const r = person(post.userId);
        if (r) r.unreliableCancels += 1;
      }
      notify(post.userId, "Dispute resolved", "A moderator reviewed what happened. Trust only changes after a fair review.", `/app/favor/${post.id}`, "dispute");
      if (post.helperId) notify(post.helperId, "Dispute resolved", "A moderator reviewed what happened.", `/app/favor/${post.id}`, "dispute");
    }
  } else {
    return fail("Unknown admin action.");
  }
  save();
  return getAdmin();
}
