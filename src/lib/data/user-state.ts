import "server-only";

/**
 * Server-only loaders that aggregate a single user's app state.
 * Used by dashboard, workout, diet, progress, coach pages.
 *
 * Thin pass-through to the Firestore repository — kept as a stable import
 * surface so pages don't import the repo directly.
 */
export {
  getProfile,
  getActiveWorkoutPlan,
  getActiveDietPlan,
  getLatestAnalysis,
  getWeightHistory,
  getCheckins,
} from "@/lib/firestore/repo";

/** Pick "today's" workout day by day-of-week mod the plan's days. */
export function pickTodaysDay<T extends { dayIndex: number }>(
  days: T[],
): T | null {
  if (days.length === 0) return null;
  const dow = new Date().getDay(); // 0–6
  const exact = days.find((d) => d.dayIndex === dow);
  if (exact) return exact;
  const sorted = [...days].sort((a, b) => a.dayIndex - b.dayIndex);
  const earlier = [...sorted].reverse().find((d) => d.dayIndex < dow);
  return earlier ?? sorted[0];
}
