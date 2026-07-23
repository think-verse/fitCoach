import { z } from "zod";

/* ============================================================================
   Tolerant primitives for AI output.

   We force structured output via Anthropic tool-use, so the tool's
   input_schema already advertises the correct JSON-Schema types (integer,
   array, …). But smaller/faster models (Haiku) still occasionally emit a FLOAT
   where we asked for an integer (e.g. fat_g: 12.5) or a JSON-STRINGIFIED array
   where we asked for an array (exercises: "[{…}]"). Those are valid-ish
   responses that nonetheless fail a strict Zod parse and 502 the whole plan.

   These helpers only RELAX parsing — they round floats to ints and JSON.parse
   stringified arrays. zod-to-json-schema unwraps z.preprocess to its inner
   type, so the schema we send the model is unchanged (still "integer"/"array").
   ============================================================================ */

const roundInt = (v: unknown) => (typeof v === "number" ? Math.round(v) : v);

/** Non-negative integer; tolerates floats by rounding. */
const nonnegInt = z.preprocess(roundInt, z.number().int().nonnegative());
/** Positive integer; tolerates floats by rounding. */
const posInt = z.preprocess(roundInt, z.number().int().positive());
/** Signed integer (can be negative); tolerates floats by rounding. */
const signedInt = z.preprocess(roundInt, z.number().int());
/** Bounded integer; tolerates floats by rounding. */
const boundedInt = (min: number, max: number) =>
  z.preprocess(roundInt, z.number().int().min(min).max(max));

const parseArray = (v: unknown) => {
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : v;
    } catch {
      return v;
    }
  }
  return v;
};
/** Array that also accepts a JSON-stringified array. */
const arrayOf = <T extends z.ZodTypeAny>(item: T, min = 0) =>
  z.preprocess(parseArray, z.array(item).min(min));

/* ============================================================================
   Body analysis — what the AI returns after looking at the user's photos.
   Every field is treated as an estimate, not a measurement.
   ============================================================================ */

export const ScoreSchema = z.object({
  label: z.string(),
  // 0–100 score, our visual category rating (float allowed)
  value: z.number().min(0).max(100),
  note: z.string().optional(),
});

export const BodyAnalysisSchema = z.object({
  overall_summary: z.string(),
  physique_type: z.string(), // "ectomorph-leaning", "endomorph", etc.
  estimated_body_fat_range: z.string(), // "14–17%"
  pros: arrayOf(z.string(), 1),
  cons: arrayOf(z.string(), 1),
  priority_muscle_groups: arrayOf(z.string(), 1),
  posture_notes: arrayOf(z.string()),
  fat_loss_notes: arrayOf(z.string()),
  muscle_gain_notes: arrayOf(z.string()),
  realistic_30_day_goal: z.string(),
  realistic_90_day_goal: z.string(),
  scores: z.object({
    body_fat: ScoreSchema,
    muscle_development: ScoreSchema,
    posture: ScoreSchema,
    symmetry: ScoreSchema,
    shoulder_to_waist_ratio: ScoreSchema,
    overall_fitness: ScoreSchema,
  }),
  confidence_level: z.enum(["low", "medium", "high"]),
  disclaimer: z.string(),
});

export type BodyAnalysis = z.infer<typeof BodyAnalysisSchema>;

/* ============================================================================
   Workout plan
   ============================================================================ */

export const ExerciseSchema = z.object({
  name: z.string(),
  target_muscle: z.string(),
  sets: posInt,
  reps: z.string(), // "8-10" or "AMRAP"
  rest_seconds: posInt,
  rpe: z.string().optional(), // "RPE 7-8"
  tempo: z.string().optional(), // "3-1-1-0"
  form_cues: arrayOf(z.string()),
  common_mistakes: arrayOf(z.string()),
  demo_video_url: z.string().url().optional().or(z.literal("")),
  alternative_exercise: z.string().optional(),
  progression_rule: z.string(),
});

export const WorkoutDaySchema = z.object({
  day_index: boundedInt(0, 6),
  title: z.string(),
  focus: z.string(),
  warmup: z.string(),
  cooldown: z.string(),
  cardio: z.string().optional(),
  exercises: arrayOf(ExerciseSchema, 2),
});

export const WorkoutPlanSchema = z.object({
  split_name: z.string(),
  days_per_week: boundedInt(2, 7),
  notes: z.string(),
  days: arrayOf(WorkoutDaySchema, 2),
});

export type WorkoutPlanAI = z.infer<typeof WorkoutPlanSchema>;
export type WorkoutDayAI = z.infer<typeof WorkoutDaySchema>;
export type ExerciseAI = z.infer<typeof ExerciseSchema>;

/* Lightweight structure (no exercises) — generated first, fast. */
export const WorkoutDayStubSchema = z.object({
  day_index: boundedInt(0, 6),
  title: z.string(),
  focus: z.string(),
  warmup: z.string(),
  cooldown: z.string(),
  cardio: z.string().optional(),
});

export const WorkoutStructureSchema = z.object({
  split_name: z.string(),
  days_per_week: boundedInt(2, 7),
  notes: z.string(),
  days: arrayOf(WorkoutDayStubSchema, 2),
});

/* A single day's exercises — generated per-day in parallel. */
export const WorkoutDayExercisesSchema = z.object({
  exercises: arrayOf(ExerciseSchema, 2),
});

export type WorkoutStructureAI = z.infer<typeof WorkoutStructureSchema>;
export type WorkoutDayStubAI = z.infer<typeof WorkoutDayStubSchema>;

/* ============================================================================
   Diet plan
   ============================================================================ */

export const MealItemSchema = z.object({
  meal_type: z.enum([
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "pre_workout",
    "post_workout",
  ]),
  name: z.string(),
  description: z.string(),
  calories: nonnegInt,
  protein_g: nonnegInt,
  carbs_g: nonnegInt,
  fat_g: nonnegInt,
  alternatives: arrayOf(z.string()),
});

export const DietPlanSchema = z.object({
  target_calories: posInt,
  protein_g: posInt,
  carbs_g: nonnegInt,
  fat_g: nonnegInt,
  water_ml: posInt,
  notes: z.string(),
  grocery_list: arrayOf(z.string(), 3),
  meals: arrayOf(MealItemSchema, 3),
});

export type DietPlanAI = z.infer<typeof DietPlanSchema>;
export type MealItemAI = z.infer<typeof MealItemSchema>;

/* ============================================================================
   Weekly update
   ============================================================================ */

export const WeeklyUpdateSchema = z.object({
  progress_summary: z.string(),
  what_improved: arrayOf(z.string()),
  what_did_not_improve: arrayOf(z.string()),
  estimated_fat_trend: z.enum(["down", "flat", "up", "unclear"]),
  estimated_muscle_trend: z.enum(["up", "flat", "down", "unclear"]),
  calorie_adjustment_kcal: signedInt, // can be negative
  workout_adjustment: z.string(),
  motivation_message: z.string(),
  next_week_focus: arrayOf(z.string()),
  confidence_level: z.enum(["low", "medium", "high"]),
});

export type WeeklyUpdate = z.infer<typeof WeeklyUpdateSchema>;

/* ============================================================================
   Coach chat reply
   ============================================================================ */

export const CoachReplySchema = z.object({
  reply: z.string(),
  safety_flag: z
    .enum(["none", "injury", "medical_referral", "extreme_request"])
    .default("none"),
  suggested_actions: z.array(z.string()).default([]),
});

export type CoachReply = z.infer<typeof CoachReplySchema>;
