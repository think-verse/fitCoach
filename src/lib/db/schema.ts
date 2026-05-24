import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* =========================================================================
   Enums
   ========================================================================= */

export const goalEnum = pgEnum("goal", [
  "fat_loss",
  "muscle_gain",
  "recomposition",
  "strength",
  "general_fitness",
]);

export const experienceEnum = pgEnum("experience", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const trainingLocationEnum = pgEnum("training_location", [
  "gym",
  "home",
  "both",
]);

export const foodPrefEnum = pgEnum("food_pref", [
  "vegetarian",
  "non_vegetarian",
  "eggetarian",
  "vegan",
]);

export const dietStyleEnum = pgEnum("diet_style", ["indian", "western", "mixed"]);

export const budgetEnum = pgEnum("budget", ["low", "medium", "high"]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro_monthly",
  "pro_yearly",
  "lifetime",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
]);

export const photoAngleEnum = pgEnum("photo_angle", ["front", "side", "back"]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant", "system"]);

/* =========================================================================
   Users (mirrors auth.users via Supabase trigger; we keep a public row)
   ========================================================================= */

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches auth.users.id
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  age: integer("age"),
  gender: genderEnum("gender"),
  heightCm: numeric("height_cm", { precision: 5, scale: 1 }),
  weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
  goal: goalEnum("goal"),
  experience: experienceEnum("experience"),
  trainingLocation: trainingLocationEnum("training_location"),
  equipment: jsonb("equipment").$type<string[]>().default([]),
  trainingDaysPerWeek: integer("training_days_per_week"),
  foodPref: foodPrefEnum("food_pref"),
  dietStyle: dietStyleEnum("diet_style"),
  budget: budgetEnum("budget"),
  injuries: text("injuries"),
  activityLevel: text("activity_level"), // sedentary | light | moderate | active | very_active
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* Body measurements snapshot — one row per week or manual entry. */
export const bodyMeasurements = pgTable(
  "body_measurements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
    waistCm: numeric("waist_cm", { precision: 5, scale: 1 }),
    chestCm: numeric("chest_cm", { precision: 5, scale: 1 }),
    armsCm: numeric("arms_cm", { precision: 5, scale: 1 }),
    thighsCm: numeric("thighs_cm", { precision: 5, scale: 1 }),
    hipsCm: numeric("hips_cm", { precision: 5, scale: 1 }),
    neckCm: numeric("neck_cm", { precision: 5, scale: 1 }),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({ userIdx: index("bm_user_idx").on(t.userId, t.recordedAt) }),
);

/* Progress photos — stored in Supabase Storage, we keep the storage path only. */
export const progressPhotos = pgTable(
  "progress_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    angle: photoAngleEnum("angle").notNull(),
    storagePath: text("storage_path").notNull(), // path within the private bucket
    weekNumber: integer("week_number"), // 0 = baseline, 1+ = weekly check-in
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("pp_user_idx").on(t.userId, t.uploadedAt),
    weekIdx: index("pp_week_idx").on(t.userId, t.weekNumber),
  }),
);

/* AI body analysis report — full structured JSON kept verbatim for replay. */
export const bodyAnalysisReports = pgTable(
  "body_analysis_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bmi: numeric("bmi", { precision: 5, scale: 2 }),
    bmiCategory: text("bmi_category"),
    bmr: integer("bmr"),
    tdee: integer("tdee"),
    targetCalories: integer("target_calories"),
    proteinG: integer("protein_g"),
    carbsG: integer("carbs_g"),
    fatG: integer("fat_g"),
    estimatedBodyFatRange: text("estimated_body_fat_range"),
    physiqueType: text("physique_type"),
    report: jsonb("report").notNull(), // full BodyAnalysis JSON
    confidenceLevel: text("confidence_level"),
    weekNumber: integer("week_number").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({ userIdx: index("bar_user_idx").on(t.userId, t.createdAt) }),
);

/* =========================================================================
   Workout plan
   ========================================================================= */

export const workoutPlans = pgTable("workout_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  splitName: text("split_name").notNull(), // e.g. "Push/Pull/Legs"
  daysPerWeek: integer("days_per_week").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const workoutDays = pgTable("workout_days", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => workoutPlans.id, { onDelete: "cascade" }),
  dayIndex: integer("day_index").notNull(), // 0..6
  title: text("title").notNull(), // e.g. "Push (Chest, Shoulders, Triceps)"
  focus: text("focus"), // e.g. "Upper body strength"
  warmup: text("warmup"),
  cooldown: text("cooldown"),
  cardio: text("cardio"),
});

export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  dayId: uuid("day_id")
    .notNull()
    .references(() => workoutDays.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  name: text("name").notNull(),
  targetMuscle: text("target_muscle"),
  sets: integer("sets"),
  reps: text("reps"), // "8-10" or "AMRAP"
  restSeconds: integer("rest_seconds"),
  rpe: text("rpe"),
  tempo: text("tempo"),
  formCues: jsonb("form_cues").$type<string[]>().default([]),
  commonMistakes: jsonb("common_mistakes").$type<string[]>().default([]),
  demoVideoUrl: text("demo_video_url"),
  alternativeExercise: text("alternative_exercise"),
  progressionRule: text("progression_rule"),
});

export const workoutLogs = pgTable(
  "workout_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id").references(() => exercises.id, {
      onDelete: "set null",
    }),
    exerciseName: text("exercise_name").notNull(), // snapshot
    setNumber: integer("set_number").notNull(),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
    reps: integer("reps"),
    rpe: numeric("rpe", { precision: 3, scale: 1 }),
    completed: boolean("completed").default(true).notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({ userIdx: index("wl_user_idx").on(t.userId, t.loggedAt) }),
);

/* =========================================================================
   Diet plan
   ========================================================================= */

export const dietPlans = pgTable("diet_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetCalories: integer("target_calories").notNull(),
  proteinG: integer("protein_g").notNull(),
  carbsG: integer("carbs_g").notNull(),
  fatG: integer("fat_g").notNull(),
  waterMl: integer("water_ml"),
  notes: text("notes"),
  groceryList: jsonb("grocery_list").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const mealItems = pgTable("meal_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => dietPlans.id, { onDelete: "cascade" }),
  mealType: text("meal_type").notNull(), // breakfast | lunch | dinner | snack | pre_workout | post_workout
  orderIndex: integer("order_index").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  calories: integer("calories"),
  proteinG: integer("protein_g"),
  carbsG: integer("carbs_g"),
  fatG: integer("fat_g"),
  alternatives: jsonb("alternatives").$type<string[]>().default([]),
});

export const foodLogs = pgTable(
  "food_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    calories: integer("calories"),
    proteinG: integer("protein_g"),
    carbsG: integer("carbs_g"),
    fatG: integer("fat_g"),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({ userIdx: index("fl_user_idx").on(t.userId, t.loggedAt) }),
);

/* =========================================================================
   Weekly check-ins & AI chat
   ========================================================================= */

export const weeklyCheckins = pgTable(
  "weekly_checkins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekNumber: integer("week_number").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
    adherenceWorkoutPct: integer("adherence_workout_pct"),
    adherenceDietPct: integer("adherence_diet_pct"),
    consistencyScore: integer("consistency_score"),
    summary: jsonb("summary"), // full WeeklyUpdate JSON from AI
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({ userIdx: index("wc_user_idx").on(t.userId, t.weekNumber) }),
);

export const aiChatMessages = pgTable(
  "ai_chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: chatRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({ userIdx: index("acm_user_idx").on(t.userId, t.createdAt) }),
);

/* =========================================================================
   Subscriptions & settings
   ========================================================================= */

export const subscriptions = pgTable("subscriptions", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").default("free").notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  units: text("units").default("metric").notNull(), // metric | imperial
  notifyDaily: boolean("notify_daily").default(true).notNull(),
  notifyWeekly: boolean("notify_weekly").default(true).notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* =========================================================================
   Relations
   ========================================================================= */

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  measurements: many(bodyMeasurements),
  photos: many(progressPhotos),
  analyses: many(bodyAnalysisReports),
  workoutPlans: many(workoutPlans),
  dietPlans: many(dietPlans),
  workoutLogs: many(workoutLogs),
  foodLogs: many(foodLogs),
  checkins: many(weeklyCheckins),
  chatMessages: many(aiChatMessages),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ many }) => ({
  days: many(workoutDays),
}));

export const workoutDaysRelations = relations(workoutDays, ({ one, many }) => ({
  plan: one(workoutPlans, {
    fields: [workoutDays.planId],
    references: [workoutPlans.id],
  }),
  exercises: many(exercises),
}));

export const dietPlansRelations = relations(dietPlans, ({ many }) => ({
  meals: many(mealItems),
}));

/* =========================================================================
   Types
   ========================================================================= */

export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type ProgressPhoto = typeof progressPhotos.$inferSelect;
export type BodyAnalysisReport = typeof bodyAnalysisReports.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type WorkoutDay = typeof workoutDays.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type DietPlan = typeof dietPlans.$inferSelect;
export type MealItem = typeof mealItems.$inferSelect;
export type FoodLog = typeof foodLogs.$inferSelect;
export type WeeklyCheckin = typeof weeklyCheckins.$inferSelect;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
