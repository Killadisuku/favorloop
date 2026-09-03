export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type ProfilePublic = {
  userId: string;
  name: string;
  username: string;
  bio: string;
  city: string;
  area: string;
  photoUrl: string | null;
  avatarHue: number;
  skills: string[];
  needHelpWith: string[];
  interests: string[];
  reputation: number;
  favorsGiven: number;
  favorsReceived: number;
  peopleHelped: number;
  hoursGiven: number;
  streak: number;
  level: number;
  verified: boolean;
  phoneVerified: boolean;
  plus: boolean;
  plusStatus: string;
  createdAt: string;
  completionRate: number;
  responseRate: number;
  circleNames: string[];
};

export type ProfileMe = ProfilePublic & {
  email: string | null;
  credits: number;
  reserved: number;
  available: number;
  onboardingComplete: boolean;
  lat: number | null;
  lng: number | null;
  circleIds: string[];
  locationSource: string;
};

export type PostCard = {
  id: string;
  type: "request" | "offer";
  title: string;
  description: string;
  category: string;
  city: string;
  area: string;
  destArea: string | null;
  estimatedTime: string;
  creditReward: number;
  helpType: string;
  presence: string;
  whenNeeded: string;
  photoUrl: string | null;
  circleId: string | null;
  circleName: string | null;
  audience: string;
  status: string;
  lifecycle: string;
  deadline: string | null;
  boostedUntil: string | null;
  createdAt: string;
  distanceKm: number | null;
  matchScore: number;
  bookmarked: boolean;
  author: ProfilePublic;
  helper: ProfilePublic | null;
  pendingOfferCount: number;
  myOfferStatus: string | null;
  approxLat: number | null;
  approxLng: number | null;
  exactShared: boolean;
  canSeeExact: boolean;
  meetingNote: string | null;
};

export type OfferRow = {
  id: string;
  postId: string;
  message: string;
  status: string;
  createdAt: string;
  helper: ProfilePublic;
};

export type TxRow = {
  id: string;
  fromUserId: string | null;
  toUserId: string;
  amount: number;
  type: string;
  relatedFavorId: string | null;
  label: string;
  status: string;
  createdAt: string;
  signedAmount: number;
  counterparty: string | null;
};

export type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type ConversationRow = {
  id: string;
  postId: string | null;
  postTitle: string | null;
  other: ProfilePublic | null;
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
};

export type NotifRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export type ReviewRow = {
  id: string;
  favorId: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  stars: number;
  tags: string[];
  body: string;
  createdAt: string;
};

export type ChallengeRow = {
  id: string;
  title: string;
  description: string;
  reward: number;
  goal: number;
  kind: string;
  progress: number;
  completed: boolean;
  rewarded: boolean;
};

export type CircleRow = {
  id: string;
  name: string;
  kind: string;
  city: string;
  memberCount: number;
  joined: boolean;
};

export type Impact = {
  favorsCompleted: number;
  peopleHelped: number;
  hoursGiven: number;
  peopleHelpedYou: number;
};

export type HomePayload = {
  me: ProfileMe;
  openMine: PostCard[];
  helping: PostCard[];
  recommended: PostCard[];
  skillMatches: PostCard[];
  people: ProfilePublic[];
  notifications: NotifRow[];
  unread: number;
  challenges: ChallengeRow[];
  impact: Impact;
  circles: CircleRow[];
  needsLocation: boolean;
};
