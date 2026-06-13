/**
 * Firestore document shapes + enums. These replace the Drizzle row types that
 * used to live in src/lib/db/schema.ts. Plain TS so they import on client and
 * server. IDs are Firestore document IDs (strings). Timestamps are stored as
 * ISO strings for portability (a future Postgres move maps them 1:1).
 */

export type Goal =
  | "fat_loss"
  | "muscle_gain"
  | "recomposition"
  | "strength"
  | "general_fitness";
export type Experience = "beginner" | "intermediate" | "advanced";
export type Gender = "male" | "female" | "other";
export type TrainingLocation = "gym" | "home" | "both";
export type FoodPref = "vegetarian" | "non_vegetarian" | "eggetarian" | "vegan";
export type DietStyle = "indian" | "western" | "mixed";
export type Budget = "low" | "medium" | "high";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type PhotoAngle = "front" | "side" | "back";
export type ChatRole = "user" | "assistant" | "system";
export type SubscriptionTier = "free" | "pro_monthly" | "pro_yearly" | "lifetime";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export const ENUMS = {
  goal: ["fat_loss", "muscle_gain", "recomposition", "strength", "general_fitness"],
  experience: ["beginner", "intermediate", "advanced"],
  gender: ["male", "female", "other"],
  trainingLocation: ["gym", "home", "both"],
  foodPref: ["vegetarian", "non_vegetarian", "eggetarian", "vegan"],
  dietStyle: ["indian", "western", "mixed"],
  budget: ["low", "medium", "high"],
  tier: ["free", "pro_monthly", "pro_yearly", "lifetime"],
} as const;

/** Throw if `value` isn't a member of the named enum (DB won't enforce this). */
export function assertEnum<K extends keyof typeof ENUMS>(
  name: K,
  value: unknown,
): (typeof ENUMS)[K][number] {
  if (!ENUMS[name].includes(value as never)) {
    throw new Error(`Invalid ${name}: ${String(value)}`);
  }
  return value as (typeof ENUMS)[K][number];
}

export interface UserDoc {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  name: string | null;
  age: number | null;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: Goal | null;
  experience: Experience | null;
  trainingLocation: TrainingLocation | null;
  equipment: string[];
  trainingDaysPerWeek: number | null;
  foodPref: FoodPref | null;
  dietStyle: DietStyle | null;
  budget: Budget | null;
  injuries: string | null;
  activityLevel: ActivityLevel | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BodyMeasurement {
  id: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armsCm: number | null;
  thighsCm: number | null;
  hipsCm: number | null;
  neckCm: number | null;
  recordedAt: string;
}

export interface ProgressPhoto {
  id: string;
  angle: PhotoAngle;
  storagePath: string; // Firebase Storage path — never the bytes
  weekNumber: number | null;
  uploadedAt: string;
}

export interface BodyAnalysisReport {
  id: string;
  bmi: number | null;
  bmiCategory: string | null;
  bmr: number | null;
  tdee: number | null;
  targetCalories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  estimatedBodyFatRange: string | null;
  physiqueType: string | null;
  report: unknown; // full BodyAnalysis JSON
  confidenceLevel: string | null;
  weekNumber: number;
  createdAt: string;
}

export interface Exercise {
  id: string;
  orderIndex: number;
  name: string;
  targetMuscle: string | null;
  sets: number | null;
  reps: string | null;
  restSeconds: number | null;
  rpe: string | null;
  tempo: string | null;
  formCues: string[];
  commonMistakes: string[];
  demoVideoUrl: string | null;
  alternativeExercise: string | null;
  progressionRule: string | null;
}

export interface WorkoutDay {
  id: string;
  dayIndex: number;
  title: string;
  focus: string | null;
  warmup: string | null;
  cooldown: string | null;
  cardio: string | null;
  exercises?: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  splitName: string;
  daysPerWeek: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface MealItem {
  id: string;
  mealType: string;
  orderIndex: number;
  name: string;
  description: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  alternatives: string[];
}

export interface DietPlan {
  id: string;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number | null;
  notes: string | null;
  groceryList: string[];
  isActive: boolean;
  createdAt: string;
}

export interface WeeklyCheckin {
  id: string;
  weekNumber: number;
  weightKg: number | null;
  adherenceWorkoutPct: number | null;
  adherenceDietPct: number | null;
  consistencyScore: number | null;
  summary: unknown; // full WeeklyUpdate JSON
  createdAt: string;
}

export interface AiChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface Subscription {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  units: "metric" | "imperial";
  notifyDaily: boolean;
  notifyWeekly: boolean;
  timezone: string;
  updatedAt: string;
}

/** Admin-configurable pricing (config/pricing doc), drives the pricing page. */
export interface PricingTier {
  id: string; // matches a SubscriptionTier where applicable
  name: string;
  priceLabel: string; // e.g. "$9 / mo"
  amount: number;
  currency: string;
  interval: "month" | "year" | "one_time";
  features: string[];
  highlighted: boolean;
  active: boolean;
}

export interface PricingConfig {
  tiers: PricingTier[];
  updatedAt: string;
}

/**
 * Global usage limits (config/limits). One "generation" = a full analysis→plan
 * flow (body analysis + workout + diet) and is counted once, at /api/analysis.
 * Coach messages are counted per user message sent to /api/coach.
 * Windows are ROLLING: weekly = last 7 days, monthly = last 30 days,
 * daily = last 24 hours.
 *
 * costPerGenerationUsd / costPerCoachMessageUsd are admin-editable estimates of
 * the Anthropic API cost, used purely for the cost projector in the admin panel.
 */
export interface LimitsConfig {
  generationsPerWeek: number;
  generationsPerMonth: number;
  coachMessagesPerDay: number;
  costPerGenerationUsd: number;
  costPerCoachMessageUsd: number;
  updatedAt?: string;
}

/**
 * Per-user override (users/{uid}/meta/limits). Any null/undefined field falls
 * back to the global LimitsConfig. Lets the admin lift or restrict a single
 * user without touching the global defaults.
 */
export interface UserLimits {
  generationsPerWeek?: number | null;
  generationsPerMonth?: number | null;
  coachMessagesPerDay?: number | null;
  updatedAt?: string;
}

/**
 * A captured server-side error (errorLogs collection). The real message/stack
 * is stored here for the admin only — users never see these details.
 */
export interface ErrorLogEntry {
  id?: string;
  context: string; // where it happened, e.g. "/api/analysis"
  message: string; // the real error message
  stack: string | null;
  code: string | null; // optional classifier
  userId: string | null;
  createdAt: string;
}
