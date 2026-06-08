import {
  EXERCISE_LIBRARY,
  EXERCISES_BY_MUSCLE,
  videoUrl,
  type ExerciseDemo,
  type MuscleGroup,
} from "./library";

/**
 * Map a free-text day "focus" (e.g. "Chest, Shoulders, Triceps") to the muscle
 * groups in our Cloudinary library. Falls back to ALL muscles if the focus
 * doesn't match anything (better to show too many options than none).
 */
const FOCUS_KEYWORDS: Array<[RegExp, MuscleGroup[]]> = [
  // Push / pull / legs splits
  [/\b(push|chest|pec)\b/i, ["chest", "shoulders", "triceps"]],
  [/\b(pull|back|lat)\b/i, ["back", "biceps", "forearms"]],
  [/\b(leg|lower|quad|glute|hamstring|hip)\b/i, ["legs", "calves"]],
  // Upper / lower
  [/\bupper\b/i, ["chest", "back", "shoulders", "biceps", "triceps"]],
  // Individual muscles
  [/\bshoulder\b/i, ["shoulders"]],
  [/\bbicep\b/i, ["biceps"]],
  [/\btricep\b/i, ["triceps"]],
  [/\bback\b/i, ["back"]],
  [/\bchest\b/i, ["chest"]],
  [/\barm\b/i, ["biceps", "triceps"]],
  [/\bcore|abs?|abdominal\b/i, ["abs"]],
  [/\bcalv\b/i, ["calves"]],
  [/\bcardio|aerobic|conditioning\b/i, ["cardio"]],
  [/\btrap\b/i, ["traps"]],
  [/\bforearm\b/i, ["forearms"]],
];

export function pickRelevantExercises(focus: string | null | undefined): {
  muscles: MuscleGroup[];
  exercises: ExerciseDemo[];
} {
  const muscles = new Set<MuscleGroup>();
  const text = focus ?? "";
  for (const [re, groups] of FOCUS_KEYWORDS) {
    if (re.test(text)) groups.forEach((g) => muscles.add(g));
  }
  // Always include abs as a safety net (most days include core work).
  muscles.add("abs");
  // If nothing matched, return everything.
  if (muscles.size === 1) {
    return {
      muscles: Object.keys(EXERCISES_BY_MUSCLE) as MuscleGroup[],
      exercises: [...EXERCISE_LIBRARY],
    };
  }
  const list = Array.from(muscles)
    .flatMap((m) => EXERCISES_BY_MUSCLE[m] ?? [])
    .filter(Boolean);
  return { muscles: Array.from(muscles), exercises: list };
}

/* --------------------------------------------------------------------------
   Name matching
   -------------------------------------------------------------------------- */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Find the best library entry for an AI-generated exercise name.
 * Strategy: exact slug match → token-intersection fuzzy match → null.
 */
export function matchExercise(
  aiName: string,
  candidates: readonly ExerciseDemo[] = EXERCISE_LIBRARY,
): ExerciseDemo | null {
  if (!aiName) return null;
  const target = slugify(aiName);
  if (!target) return null;

  // 1. Exact slug match.
  const exact = candidates.find((e) => e.slug === target);
  if (exact) return exact;

  // 2. Token overlap — score by # shared tokens, prefer fewer extra tokens.
  const targetTokens = new Set(target.split("-").filter((t) => t.length > 2));
  if (targetTokens.size === 0) return null;

  let best: { entry: ExerciseDemo; score: number } | null = null;
  for (const c of candidates) {
    const candTokens = new Set(c.slug.split("-").filter((t) => t.length > 2));
    let shared = 0;
    targetTokens.forEach((t) => {
      if (candTokens.has(t)) shared++;
    });
    if (shared === 0) continue;
    // score: how much of the target is matched, minus penalty for extra tokens
    const coverage = shared / targetTokens.size;
    const noise = Math.max(0, candTokens.size - shared) / candTokens.size;
    const score = coverage - 0.3 * noise;
    if (!best || score > best.score) best = { entry: c, score };
  }
  // Require at least 60% target coverage to accept.
  if (best && best.score >= 0.55) return best.entry;
  return null;
}

/** Attach a Cloudinary video URL to an exercise by matching its name. */
export function findDemoUrl(
  aiName: string,
  candidates?: readonly ExerciseDemo[],
): string | null {
  const m = matchExercise(aiName, candidates);
  return m ? videoUrl(m.publicId) : null;
}

/** Compact list for embedding in an AI prompt. */
export function formatExerciseList(exercises: readonly ExerciseDemo[]): string {
  // Group by muscle for readability; one line per exercise (name + muscle).
  const byMuscle = new Map<string, ExerciseDemo[]>();
  for (const ex of exercises) {
    const arr = byMuscle.get(ex.muscle) ?? [];
    arr.push(ex);
    byMuscle.set(ex.muscle, arr);
  }
  const lines: string[] = [];
  for (const muscle of Array.from(byMuscle.keys()).sort()) {
    lines.push(`## ${muscle}`);
    for (const ex of byMuscle.get(muscle)!) {
      lines.push(`- ${ex.name}`);
    }
  }
  return lines.join("\n");
}
