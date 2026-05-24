import { z } from "zod";

/* ============================================================================
   Body analysis — what the AI returns after looking at the user's photos.
   Every field is treated as an estimate, not a measurement.
   ============================================================================ */

export const ScoreSchema = z.object({
  label: z.string(),
  // 0–100 score, our visual category rating
  value: z.number().min(0).max(100),
  note: z.string().optional(),
});

export const BodyAnalysisSchema = z.object({
  overall_summary: z.string(),
  physique_type: z.string(), // "ectomorph-leaning", "endomorph", etc.
  estimated_body_fat_range: z.string(), // "14–17%"
  pros: z.array(z.string()).min(1),
  cons: z.array(z.string()).min(1),
  priority_muscle_groups: z.array(z.string()).min(1),
  posture_notes: z.array(z.string()),
  fat_loss_notes: z.array(z.string()),
  muscle_gain_notes: z.array(z.string()),
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
  sets: z.number().int().positive(),
  reps: z.string(), // "8-10" or "AMRAP"
  rest_seconds: z.number().int().positive(),
  rpe: z.string().optional(), // "RPE 7-8"
  tempo: z.string().optional(), // "3-1-1-0"
  form_cues: z.array(z.string()),
  common_mistakes: z.array(z.string()),
  demo_video_url: z.string().url().optional().or(z.literal("")),
  alternative_exercise: z.string().optional(),
  progression_rule: z.string(),
});

export const WorkoutDaySchema = z.object({
  day_index: z.number().int().min(0).max(6),
  title: z.string(),
  focus: z.string(),
  warmup: z.string(),
  cooldown: z.string(),
  cardio: z.string().optional(),
  exercises: z.array(ExerciseSchema).min(2),
});

export const WorkoutPlanSchema = z.object({
  split_name: z.string(),
  days_per_week: z.number().int().min(2).max(7),
  notes: z.string(),
  days: z.array(WorkoutDaySchema).min(2),
});

export type WorkoutPlanAI = z.infer<typeof WorkoutPlanSchema>;
export type WorkoutDayAI = z.infer<typeof WorkoutDaySchema>;
export type ExerciseAI = z.infer<typeof ExerciseSchema>;

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
  calories: z.number().int().nonnegative(),
  protein_g: z.number().int().nonnegative(),
  carbs_g: z.number().int().nonnegative(),
  fat_g: z.number().int().nonnegative(),
  alternatives: z.array(z.string()),
});

export const DietPlanSchema = z.object({
  target_calories: z.number().int().positive(),
  protein_g: z.number().int().positive(),
  carbs_g: z.number().int().nonnegative(),
  fat_g: z.number().int().nonnegative(),
  water_ml: z.number().int().positive(),
  notes: z.string(),
  grocery_list: z.array(z.string()).min(3),
  meals: z.array(MealItemSchema).min(3),
});

export type DietPlanAI = z.infer<typeof DietPlanSchema>;
export type MealItemAI = z.infer<typeof MealItemSchema>;

/* ============================================================================
   Weekly update
   ============================================================================ */

export const WeeklyUpdateSchema = z.object({
  progress_summary: z.string(),
  what_improved: z.array(z.string()),
  what_did_not_improve: z.array(z.string()),
  estimated_fat_trend: z.enum(["down", "flat", "up", "unclear"]),
  estimated_muscle_trend: z.enum(["up", "flat", "down", "unclear"]),
  calorie_adjustment_kcal: z.number().int(), // can be negative
  workout_adjustment: z.string(),
  motivation_message: z.string(),
  next_week_focus: z.array(z.string()),
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
