export const APP_NAME = "Por Favor";
export const APP_TAGLINE = "Your time is currency.";
export const STARTER_CREDITS = 3;
export const MAX_REWARD = 10;
export const MIN_REWARD = 1;
export const PHOTO_MAX_CHARS = 120_000;

export const CATEGORIES = [
  "Home",
  "Tech",
  "Errands",
  "Learning",
  "Transport",
  "Shopping",
  "Creative",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const TIMES = [
  "5–15 min",
  "15–30 min",
  "30–60 min",
  "1–2 hours",
  "Other",
] as const;

export type TimeEstimate = (typeof TIMES)[number];

export const SKILL_OPTS = [
  "Tech setup",
  "Home",
  "Errands",
  "English",
  "Excel",
  "Design",
  "Moving",
  "Driving",
  "Photoshop",
];

export const NEED_OPTS = ["Tech", "Home", "Errands", "Learning", "Transport", "Creative"];

export const INTEREST_OPTS = [
  "Neighbors",
  "Skills",
  "Languages",
  "Family",
  "Pets",
  "Fitness",
  "Food",
  "Art",
];

export const REVIEW_TAGS = [
  "Reliable",
  "Friendly",
  "Helpful",
  "On time",
  "Skilled",
  "Respectful",
];

export const LEVELS = [
  { level: 1, name: "New Neighbor", min: 0 },
  { level: 2, name: "Helper", min: 5 },
  { level: 3, name: "Regular", min: 10 },
  { level: 4, name: "Pillar", min: 25 },
  { level: 5, name: "Loop Legend", min: 50 },
] as const;

export function levelFor(given: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (given >= l.min) current = l;
  return current;
}

export const POST_STATUSES = [
  "open",
  "accepted",
  "pending_confirm",
  "completed",
  "cancelled",
] as const;
