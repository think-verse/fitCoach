import { z } from "zod";

export const OnboardingSchema = z.object({
  name: z.string().min(1).max(80),
  age: z.coerce.number().int().min(13).max(99),
  gender: z.enum(["male", "female", "other"]),
  heightCm: z.coerce.number().min(120).max(230),
  weightKg: z.coerce.number().min(35).max(250),
  goal: z.enum([
    "fat_loss",
    "muscle_gain",
    "recomposition",
    "strength",
    "general_fitness",
  ]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  trainingLocation: z.enum(["gym", "home", "both"]),
  equipment: z.array(z.string()).default([]),
  trainingDaysPerWeek: z.coerce.number().int().min(2).max(7),
  foodPref: z.enum(["vegetarian", "non_vegetarian", "eggetarian", "vegan"]),
  dietStyle: z.enum(["western", "mixed"]),
  budget: z.enum(["low", "medium", "high"]),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .default("moderate"),
  injuries: z.string().max(500).optional().nullable(),
  measurements: z
    .object({
      waistCm: z.coerce.number().optional().nullable(),
      chestCm: z.coerce.number().optional().nullable(),
      armsCm: z.coerce.number().optional().nullable(),
      thighsCm: z.coerce.number().optional().nullable(),
      hipsCm: z.coerce.number().optional().nullable(),
      neckCm: z.coerce.number().optional().nullable(),
    })
    .optional(),
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export const CheckinSchema = z.object({
  weightKg: z.coerce.number().min(35).max(250).optional().nullable(),
  waistCm: z.coerce.number().optional().nullable(),
  chestCm: z.coerce.number().optional().nullable(),
  armsCm: z.coerce.number().optional().nullable(),
  thighsCm: z.coerce.number().optional().nullable(),
  hipsCm: z.coerce.number().optional().nullable(),
  neckCm: z.coerce.number().optional().nullable(),
  workoutAdherencePct: z.coerce.number().min(0).max(100).optional(),
  dietAdherencePct: z.coerce.number().min(0).max(100).optional(),
});
export type CheckinInput = z.infer<typeof CheckinSchema>;

export const UpdateProfileSchema = z.object({
  goal: z.enum([
    "fat_loss",
    "muscle_gain",
    "recomposition",
    "strength",
    "general_fitness",
  ]),
  trainingDaysPerWeek: z.coerce.number().int().min(2).max(7),
  foodPref: z.enum(["vegetarian", "non_vegetarian", "eggetarian", "vegan"]),
  dietStyle: z.enum(["western", "mixed"]),
  injuries: z.string().max(500).optional().nullable(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
