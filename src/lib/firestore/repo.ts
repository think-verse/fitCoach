import "server-only";

/**
 * Firestore repository — the ONLY module that talks to Firestore directly.
 * Everything else (actions, routes, data loaders) calls these functions.
 * Keeping access funneled here is what makes a future backend swap cheap.
 *
 * Data model (see plan.md Phase 1.3):
 *   users/{uid}                          UserDoc + profile fields
 *     measurements/{id}, progressPhotos/{id}, analyses/{id}, checkins/{id},
 *     chatMessages/{id}, workoutLogs/{id}, foodLogs/{id}
 *     workoutPlans/{planId}/days/{dayId}/exercises/{exId}
 *     dietPlans/{planId}/meals/{mealId}
 *     meta/profile, meta/subscription, meta/settings   (single docs)
 *   config/pricing
 */
import { adminDb, adminBucket } from "@/lib/firebase/admin";
import type {
  UserProfile,
  BodyMeasurement,
  ProgressPhoto,
  BodyAnalysisReport,
  WorkoutPlan,
  WorkoutDay,
  Exercise,
  DietPlan,
  MealItem,
  WeeklyCheckin,
  AiChatMessage,
  Subscription,
  UserSettings,
  PricingConfig,
  LimitsConfig,
  UserLimits,
  ErrorLogEntry,
} from "./types";

const db = () => adminDb();
const userRef = (uid: string) => db().collection("users").doc(uid);
const nowIso = () => new Date().toISOString();

/** Pick the doc with the latest `createdAt` (ISO string) from a list. */
function newestByCreatedAt<T extends { get(field: string): unknown }>(
  docs: T[],
): T {
  return [...docs].sort((a, b) =>
    String(b.get("createdAt") ?? "").localeCompare(
      String(a.get("createdAt") ?? ""),
    ),
  )[0];
}

/* ----------------------------- user root ------------------------------ */

/** Ensure the users/{uid} root doc exists (replaces the old Supabase trigger). */
export async function ensureUser(
  uid: string,
  email: string,
  name: string | null,
): Promise<void> {
  await userRef(uid).set(
    { id: uid, email, name, updatedAt: nowIso() },
    { merge: true },
  );
  const snap = await userRef(uid).get();
  if (!snap.get("createdAt")) {
    await userRef(uid).set({ createdAt: nowIso() }, { merge: true });
  }
}

/* ----------------------------- profile -------------------------------- */

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await userRef(uid).collection("meta").doc("profile").get();
  return snap.exists ? (snap.data() as UserProfile) : null;
}

export async function upsertProfile(
  uid: string,
  patch: Partial<UserProfile>,
): Promise<void> {
  await userRef(uid)
    .collection("meta")
    .doc("profile")
    .set({ userId: uid, ...patch, updatedAt: nowIso() }, { merge: true });
}

/* ----------------------------- workout -------------------------------- */

export async function getActiveWorkoutPlan(uid: string) {
  // Equality-only query (no composite index needed). Only one plan is active
  // at a time, but we pick the newest in memory to be safe.
  const plans = await userRef(uid)
    .collection("workoutPlans")
    .where("isActive", "==", true)
    .get();
  if (plans.empty) return null;
  const planDoc = newestByCreatedAt(plans.docs);
  const plan = { id: planDoc.id, ...planDoc.data() } as WorkoutPlan;

  const daysSnap = await planDoc.ref.collection("days").orderBy("dayIndex").get();
  const days: WorkoutDay[] = [];
  for (const d of daysSnap.docs) {
    const exSnap = await d.ref.collection("exercises").orderBy("orderIndex").get();
    days.push({
      id: d.id,
      ...(d.data() as Omit<WorkoutDay, "id" | "exercises">),
      exercises: exSnap.docs.map((e) => ({ id: e.id, ...e.data() }) as Exercise),
    });
  }
  return { plan, days };
}

interface NewWorkoutPlan {
  splitName: string;
  daysPerWeek: number;
  notes: string | null;
  days: Array<
    Omit<WorkoutDay, "id" | "exercises"> & {
      exercises: Array<Omit<Exercise, "id">>;
    }
  >;
}

/** Deactivate prior workout plans + write the new one (days + exercises). */
export async function saveWorkoutPlan(
  uid: string,
  plan: NewWorkoutPlan,
): Promise<string> {
  const col = userRef(uid).collection("workoutPlans");
  const old = await col.where("isActive", "==", true).get();
  await Promise.all(old.docs.map((d) => d.ref.update({ isActive: false })));

  const planRef = await col.add({
    splitName: plan.splitName,
    daysPerWeek: plan.daysPerWeek,
    notes: plan.notes,
    isActive: true,
    createdAt: nowIso(),
  });
  for (const day of plan.days) {
    const { exercises, ...dayData } = day;
    const dayRef = await planRef.collection("days").add(dayData);
    for (const ex of exercises) {
      await dayRef.collection("exercises").add(ex);
    }
  }
  return planRef.id;
}

interface NewDietPlan {
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number | null;
  notes: string | null;
  groceryList: string[];
  meals: Array<Omit<MealItem, "id">>;
}

/** Deactivate prior diet plans + write the new one (meals). */
export async function saveDietPlan(
  uid: string,
  plan: NewDietPlan,
): Promise<string> {
  const col = userRef(uid).collection("dietPlans");
  const old = await col.where("isActive", "==", true).get();
  await Promise.all(old.docs.map((d) => d.ref.update({ isActive: false })));

  const { meals, ...planData } = plan;
  const planRef = await col.add({
    ...planData,
    isActive: true,
    createdAt: nowIso(),
  });
  for (const meal of meals) {
    await planRef.collection("meals").add(meal);
  }
  return planRef.id;
}

export async function getAnalysisById(
  uid: string,
  id: string,
): Promise<BodyAnalysisReport | null> {
  const snap = await userRef(uid).collection("analyses").doc(id).get();
  return snap.exists ? ({ id: snap.id, ...snap.data() } as BodyAnalysisReport) : null;
}

/** Download a photo from Storage as base64 + media type (for the AI calls). */
export async function downloadPhotoBase64(
  storagePath: string,
): Promise<{ base64: string; mediaType: string }> {
  const file = adminBucket().file(storagePath);
  const [raw] = await file.download();

  // Lazy-load sharp so it's only required on the image path — keeps a broken
  // native binary from crashing every route that imports this module (e.g. /).
  const sharp = (await import("sharp")).default;

  // Safety net: ensure Claude never receives an oversized image (10 MB cap on
  // base64). Re-encode to a bounded JPEG even for photos stored before upload
  // compression existed. Falls back to the raw bytes if sharp can't read it.
  try {
    const buf = await sharp(raw)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    return { base64: buf.toString("base64"), mediaType: "image/jpeg" };
  } catch {
    const [meta] = await file.getMetadata().catch(() => [{}] as never);
    const mediaType =
      (meta as { contentType?: string })?.contentType ??
      guessMediaType(storagePath);
    return { base64: raw.toString("base64"), mediaType };
  }
}

function guessMediaType(path: string): string {
  const l = path.toLowerCase();
  if (l.endsWith(".png")) return "image/png";
  if (l.endsWith(".webp")) return "image/webp";
  if (l.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function getActiveDietPlan(uid: string) {
  // Equality-only query (no composite index needed); newest picked in memory.
  const plans = await userRef(uid)
    .collection("dietPlans")
    .where("isActive", "==", true)
    .get();
  if (plans.empty) return null;
  const planDoc = newestByCreatedAt(plans.docs);
  const plan = { id: planDoc.id, ...planDoc.data() } as DietPlan;
  const mealsSnap = await planDoc.ref.collection("meals").orderBy("orderIndex").get();
  const meals = mealsSnap.docs.map((m) => ({ id: m.id, ...m.data() }) as MealItem);
  return { plan, meals };
}

/* --------------------------- analysis/measure -------------------------- */

export async function getLatestAnalysis(
  uid: string,
): Promise<BodyAnalysisReport | null> {
  const snap = await userRef(uid)
    .collection("analyses")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as BodyAnalysisReport;
}

export async function saveAnalysis(
  uid: string,
  data: Omit<BodyAnalysisReport, "id" | "createdAt">,
): Promise<string> {
  const ref = await userRef(uid)
    .collection("analyses")
    .add({ ...data, createdAt: nowIso() });
  return ref.id;
}

export async function getWeightHistory(
  uid: string,
  max = 20,
): Promise<BodyMeasurement[]> {
  const snap = await userRef(uid)
    .collection("measurements")
    .orderBy("recordedAt", "desc")
    .limit(max)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BodyMeasurement);
}

export async function addMeasurement(
  uid: string,
  data: Omit<BodyMeasurement, "id" | "recordedAt"> & { recordedAt?: string },
): Promise<void> {
  await userRef(uid)
    .collection("measurements")
    .add({ ...data, recordedAt: data.recordedAt ?? nowIso() });
}

/* ----------------------------- check-ins ------------------------------ */

export async function getCheckins(uid: string): Promise<WeeklyCheckin[]> {
  const snap = await userRef(uid)
    .collection("checkins")
    .orderBy("weekNumber", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WeeklyCheckin);
}

export async function saveCheckin(
  uid: string,
  data: Omit<WeeklyCheckin, "id" | "createdAt">,
): Promise<void> {
  await userRef(uid)
    .collection("checkins")
    .add({ ...data, createdAt: nowIso() });
}

export async function getCheckinByWeek(
  uid: string,
  weekNumber: number,
): Promise<WeeklyCheckin | null> {
  const snap = await userRef(uid)
    .collection("checkins")
    .where("weekNumber", "==", weekNumber)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as WeeklyCheckin;
}

export async function updateCheckinSummary(
  uid: string,
  checkinId: string,
  summary: unknown,
  consistencyScore: number,
): Promise<void> {
  await userRef(uid)
    .collection("checkins")
    .doc(checkinId)
    .update({ summary, consistencyScore });
}

/* ----------------------------- chat ----------------------------------- */

export async function getChatHistory(
  uid: string,
  max = 50,
): Promise<AiChatMessage[]> {
  const snap = await userRef(uid)
    .collection("chatMessages")
    .orderBy("createdAt", "asc")
    .limitToLast(max)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AiChatMessage);
}

export async function addChatMessage(
  uid: string,
  role: AiChatMessage["role"],
  content: string,
): Promise<void> {
  await userRef(uid)
    .collection("chatMessages")
    .add({ role, content, createdAt: nowIso() });
}

/* -------------------------- subscription/settings --------------------- */

export async function getSubscription(uid: string): Promise<Subscription | null> {
  const snap = await userRef(uid).collection("meta").doc("subscription").get();
  return snap.exists ? (snap.data() as Subscription) : null;
}

export async function upsertSubscription(
  uid: string,
  patch: Partial<Subscription>,
): Promise<void> {
  await userRef(uid)
    .collection("meta")
    .doc("subscription")
    .set({ userId: uid, ...patch, updatedAt: nowIso() }, { merge: true });
}

export async function getSettings(uid: string): Promise<UserSettings | null> {
  const snap = await userRef(uid).collection("meta").doc("settings").get();
  return snap.exists ? (snap.data() as UserSettings) : null;
}

export async function upsertSettings(
  uid: string,
  patch: Partial<UserSettings>,
): Promise<void> {
  await userRef(uid)
    .collection("meta")
    .doc("settings")
    .set({ userId: uid, ...patch, updatedAt: nowIso() }, { merge: true });
}

/* ----------------------------- photos --------------------------------- */

export async function addProgressPhoto(
  uid: string,
  data: Omit<ProgressPhoto, "id" | "uploadedAt">,
): Promise<void> {
  await userRef(uid)
    .collection("progressPhotos")
    .add({ ...data, uploadedAt: nowIso() });
}

export async function getProgressPhotos(
  uid: string,
  weekNumber?: number,
): Promise<ProgressPhoto[]> {
  const col = userRef(uid).collection("progressPhotos");
  if (weekNumber != null) {
    // Equality filter only (no composite index); sort by uploadedAt in memory.
    const snap = await col.where("weekNumber", "==", weekNumber).get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as ProgressPhoto)
      .sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
  }
  const snap = await col.orderBy("uploadedAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProgressPhoto);
}

/* ----------------------------- pricing -------------------------------- */

export async function getPricing(): Promise<PricingConfig | null> {
  const snap = await db().collection("config").doc("pricing").get();
  return snap.exists ? (snap.data() as PricingConfig) : null;
}

export async function setPricing(config: PricingConfig): Promise<void> {
  await db()
    .collection("config")
    .doc("pricing")
    .set({ ...config, updatedAt: nowIso() });
}

/* ----------------------------- limits --------------------------------- */

/** Default global limits, used when config/limits doc doesn't exist yet. */
export const DEFAULT_LIMITS: LimitsConfig = {
  generationsPerWeek: 2,
  generationsPerMonth: 6,
  coachMessagesPerDay: 15,
  costPerGenerationUsd: 0.18,
  costPerCoachMessageUsd: 0.006,
};

export async function getLimitsConfig(): Promise<LimitsConfig> {
  const snap = await db().collection("config").doc("limits").get();
  if (!snap.exists) return DEFAULT_LIMITS;
  return { ...DEFAULT_LIMITS, ...(snap.data() as Partial<LimitsConfig>) };
}

export async function setLimitsConfig(config: LimitsConfig): Promise<void> {
  await db()
    .collection("config")
    .doc("limits")
    .set({ ...config, updatedAt: nowIso() });
}

export async function getUserLimits(uid: string): Promise<UserLimits | null> {
  const snap = await userRef(uid).collection("meta").doc("limits").get();
  return snap.exists ? (snap.data() as UserLimits) : null;
}

export async function setUserLimits(
  uid: string,
  patch: UserLimits,
): Promise<void> {
  await userRef(uid)
    .collection("meta")
    .doc("limits")
    .set({ ...patch, updatedAt: nowIso() }, { merge: true });
}

/**
 * Count generations (= analyses) created at/after `sinceIso`. Single-field
 * range filter on createdAt — no composite index needed.
 */
export async function countGenerationsSince(
  uid: string,
  sinceIso: string,
): Promise<number> {
  const snap = await userRef(uid)
    .collection("analyses")
    .where("createdAt", ">=", sinceIso)
    .get();
  return snap.size;
}

/**
 * Count coach messages the user SENT at/after `sinceIso`. We range-filter on
 * createdAt only (no composite index) and filter role === "user" in memory.
 */
export async function countCoachMessagesSince(
  uid: string,
  sinceIso: string,
): Promise<number> {
  const snap = await userRef(uid)
    .collection("chatMessages")
    .where("createdAt", ">=", sinceIso)
    .get();
  return snap.docs.filter((d) => d.get("role") === "user").length;
}

/* ----------------------------- error logs ----------------------------- */

/** Persist a server-side error. Capped fields keep docs small. */
export async function logError(
  entry: Omit<ErrorLogEntry, "id" | "createdAt">,
): Promise<void> {
  await db()
    .collection("errorLogs")
    .add({
      context: entry.context.slice(0, 200),
      message: (entry.message ?? "").slice(0, 4000),
      stack: entry.stack ? entry.stack.slice(0, 8000) : null,
      code: entry.code ?? null,
      userId: entry.userId ?? null,
      createdAt: nowIso(),
    });
}

export async function listErrorLogs(max = 200): Promise<ErrorLogEntry[]> {
  const snap = await db()
    .collection("errorLogs")
    .orderBy("createdAt", "desc")
    .limit(max)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ErrorLogEntry);
}

/* ---------------------------- paid members ---------------------------- */

export interface PaidMember {
  uid: string;
  name: string;
  email: string;
  mobile: string;
  grantCount: number;
  createdAt: string;
  lastGrantedAt: string;
}

/** Doc id is the lowercased email so repeat grants upsert the same record. */
function paidMemberId(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
}

/**
 * Record (or refresh) a paid member captured from the thank-you page.
 * Idempotent by email: a returning email increments grantCount, keeps createdAt.
 */
export async function recordPaidMember(input: {
  uid: string;
  name: string;
  email: string;
  mobile: string;
}): Promise<void> {
  const ref = db().collection("paidMembers").doc(paidMemberId(input.email));
  const snap = await ref.get();
  const now = nowIso();
  if (snap.exists) {
    await ref.set(
      {
        uid: input.uid,
        name: input.name,
        email: input.email.trim().toLowerCase(),
        mobile: input.mobile,
        grantCount: (snap.get("grantCount") ?? 1) + 1,
        lastGrantedAt: now,
      },
      { merge: true },
    );
  } else {
    await ref.set({
      uid: input.uid,
      name: input.name,
      email: input.email.trim().toLowerCase(),
      mobile: input.mobile,
      grantCount: 1,
      createdAt: now,
      lastGrantedAt: now,
    });
  }
}

export async function listPaidMembers(max = 200): Promise<PaidMember[]> {
  const snap = await db()
    .collection("paidMembers")
    .orderBy("lastGrantedAt", "desc")
    .limit(max)
    .get();
  return snap.docs.map((d) => d.data() as PaidMember);
}

/* -------------------------- cascade delete ---------------------------- */

const SUBCOLLECTIONS = [
  "measurements",
  "progressPhotos",
  "analyses",
  "checkins",
  "chatMessages",
  "workoutLogs",
  "foodLogs",
  "meta",
];

/**
 * Delete a user and EVERYTHING under them — Firestore has no cascade, so we do
 * it by hand. Recursively removes nested plan→day→exercise trees, then the
 * user's Storage folder. (Postgres did this for free via onDelete:cascade.)
 */
export async function deleteUserData(uid: string): Promise<void> {
  const root = userRef(uid);

  // Nested workout plans → days → exercises.
  const plans = await root.collection("workoutPlans").get();
  for (const p of plans.docs) {
    const days = await p.ref.collection("days").get();
    for (const d of days.docs) {
      await db().recursiveDelete(d.ref);
    }
    await db().recursiveDelete(p.ref);
  }
  // Nested diet plans → meals.
  const diets = await root.collection("dietPlans").get();
  for (const d of diets.docs) await db().recursiveDelete(d.ref);

  // Flat subcollections.
  for (const c of SUBCOLLECTIONS) {
    await db().recursiveDelete(root.collection(c));
  }
  await root.delete();

  // Storage folder.
  try {
    await adminBucket().deleteFiles({ prefix: `users/${uid}/` });
  } catch {
    // Bucket may be empty / not configured in dev — non-fatal.
  }
}

/**
 * Reset a user's APP data (plans, photos, history, profile) but KEEP the
 * account, subscription, and settings. They re-enter onboarding fresh.
 */
export async function resetUserData(uid: string): Promise<void> {
  const root = userRef(uid);

  const plans = await root.collection("workoutPlans").get();
  for (const p of plans.docs) await db().recursiveDelete(p.ref);
  const diets = await root.collection("dietPlans").get();
  for (const d of diets.docs) await db().recursiveDelete(d.ref);

  for (const c of [
    "measurements",
    "progressPhotos",
    "analyses",
    "checkins",
    "chatMessages",
    "workoutLogs",
    "foodLogs",
  ]) {
    await db().recursiveDelete(root.collection(c));
  }
  // Profile doc only (keep subscription + settings in meta/).
  await root.collection("meta").doc("profile").delete().catch(() => {});

  try {
    await adminBucket().deleteFiles({ prefix: `users/${uid}/` });
  } catch {
    /* non-fatal */
  }
}
