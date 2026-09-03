export const APP_NAME = "Onegai";
export const APP_TAGLINE = "Small favors. Real connections.";
export const STARTER_CREDITS = 3;
export const MAX_REWARD = 10;
export const MIN_REWARD = 1;
export const PHOTO_MAX_CHARS = 120_000;

export const CATEGORIES = [
  "Home",
  "Errands",
  "Transport",
  "Moving",
  "Pets",
  "Technology",
  "Learning",
  "Shopping",
  "Elderly support",
  "Events",
  "Tools / lending",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const LEGACY_CATEGORY: Record<string, Category> = {
  Tech: "Technology",
  Creative: "Other",
  Home: "Home",
};

export const TIMES = ["5–15 min", "15–30 min", "30–60 min", "1–2 hours", "Other"] as const;
export type TimeEstimate = (typeof TIMES)[number];

export const WHEN_OPTS = ["Today · morning", "Today · afternoon", "Today · evening", "Tomorrow", "This weekend", "Flexible"] as const;
export type WhenNeeded = (typeof WHEN_OPTS)[number];

export const HELP_TYPES = [
  { id: "kindness", label: "Kindness", hint: "Help because you want to." },
  { id: "favor", label: "Favor", hint: "You help today. Someone helps you another day." },
  { id: "paid", label: "Paid", hint: "For favors where a paid thanks is appropriate." },
] as const;
export type HelpType = (typeof HELP_TYPES)[number]["id"];

export const SKILL_OPTS = [
  "Moving",
  "Driving",
  "Technology",
  "Pets",
  "Shopping",
  "Teaching",
  "Repairs",
  "Household help",
  "Other",
] as const;

export const LEGACY_SKILL: Record<string, string> = {
  "Tech setup": "Technology",
  Excel: "Teaching",
  English: "Teaching",
  Home: "Household help",
  Errands: "Shopping",
  Design: "Other",
  Photoshop: "Other",
};

export const NEED_OPTS = [...CATEGORIES];

export const INTEREST_OPTS = ["Neighbors", "Skills", "Languages", "Family", "Pets", "Fitness", "Food", "Art"];

export const REVIEW_TAGS = ["Reliable", "Friendly", "Helpful", "On time", "Skilled", "Respectful"];

export const CIRCLE_KINDS = [
  "My Building",
  "My Neighborhood",
  "My University",
  "My Workplace",
  "Friends & Family",
  "Community",
] as const;

export const LEVELS = [
  { level: 1, name: "New neighbor", min: 0 },
  { level: 2, name: "Helper", min: 5 },
  { level: 3, name: "Regular", min: 10 },
  { level: 4, name: "Pillar", min: 25 },
  { level: 5, name: "Community light", min: 50 },
] as const;

export function levelFor(given: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (given >= l.min) current = l;
  return current;
}

export const POST_STATUSES = ["open", "accepted", "in_progress", "pending_confirm", "completed", "cancelled"] as const;

export function hoursFromEstimate(est: string) {
  if (est.startsWith("5")) return 0.2;
  if (est.startsWith("15")) return 0.4;
  if (est.startsWith("30")) return 0.8;
  if (est.startsWith("1")) return 1.5;
  return 1;
}

export function helpTypeLabel(id: string) {
  return HELP_TYPES.find((h) => h.id === id)?.label ?? "Favor";
}

export function lifecycleLabel(status: string, pendingOffers = 0) {
  if (status === "completed") return "Completed";
  if (status === "pending_confirm") return "Completing";
  if (status === "in_progress") return "In progress";
  if (status === "accepted") return "Accepted";
  if (status === "cancelled") return "Cancelled";
  if (status === "open" && pendingOffers > 0) return "Matched";
  return "Requested";
}
