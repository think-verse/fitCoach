import type { UserProfile } from "@/lib/firestore/types";
import { generateStructured, TEXT_MODEL } from "./client";
import {
  WorkoutStructureSchema,
  WorkoutDayExercisesSchema,
  WorkoutPlanSchema,
  type WorkoutPlanAI,
  type BodyAnalysis,
} from "./schemas";
import {
  pickRelevantExercises,
  matchExercise,
  formatExerciseList,
} from "@/lib/exercises/match";
import { videoUrl } from "@/lib/exercises/library";

/**
 * Two-phase generation for speed (and to stay under Vercel's function limit):
 *   1. One fast call produces the split structure (day titles + focus, no exercises).
 *   2. Every training day's exercises are generated in parallel.
 * A single monolithic call took ~85s and truncated; this lands at ~30–40s.
 */

const STRUCTURE_SYSTEM = `You are AesthetixAI designing a weekly training SPLIT (structure only — no exercises yet).

Rules:
- Split must match training days/week: 3=full body, 4=upper/lower or PPL+full,
  5=PPL+upper/lower, 6=PPL repeated.
- Bias the split toward the user's priority muscle groups.
- For each training day give: a short title (e.g. "Push — Chest/Shoulders/Triceps"),
  a one-line focus, a one-line warmup, a one-line cooldown, and optional cardio.
- Emit ONLY real training days (no rest days). Keep every field to one short sentence.`;

const DAY_SYSTEM = `You are AesthetixAI filling in exercises for ONE training day.

Rules:
- Max 5 exercises. Order them big compound → isolation.
- You will be given an EXERCISE LIBRARY (the only exercises with demo videos).
  Whenever possible, pick exercises FROM THE LIBRARY using the EXACT name shown.
  If a movement you want isn't in the library, you may invent one — but prefer
  the library for ≥3 of the 5 picks. This keeps the in-app demo videos working.
- Respect equipment and injuries (substitute and explain briefly in form_cues).
- form_cues: exactly 2 short cues (≤8 words each).
- common_mistakes: exactly 2 short items (≤8 words each).
- progression_rule: one short concrete sentence (e.g. "Add 2.5kg when you hit top of range").
- demo_video_url: leave as empty string "". The server fills it from the library.
- Be concise and practical.`;

export interface WorkoutPlanInput {
  profile: UserProfile;
  analysis: BodyAnalysis;
}

export async function generateWorkoutPlan(
  input: WorkoutPlanInput,
): Promise<WorkoutPlanAI> {
  const { profile, analysis } = input;

  const profileLine = [
    `Goal: ${profile.goal}`,
    `Experience: ${profile.experience}`,
    `Training: ${profile.trainingDaysPerWeek} days/week at ${profile.trainingLocation}`,
    `Equipment: ${(profile.equipment ?? []).join(", ") || "minimal"}`,
    `Injuries: ${profile.injuries || "none"}`,
    `Priority muscles: ${analysis.priority_muscle_groups.join(", ")}`,
    `Weaknesses: ${analysis.cons.join("; ")}`,
  ].join("\n");

  // Phase 1 — structure.
  const structure = await generateStructured({
    system: STRUCTURE_SYSTEM,
    user: `Design the weekly split structure (no exercises).\n\n${profileLine}\n\n30-day goal: ${analysis.realistic_30_day_goal}`,
    schema: WorkoutStructureSchema,
    toolName: "submit_structure",
    toolDescription: "Submit the weekly split structure (days, no exercises).",
    maxTokens: 1500,
    model: TEXT_MODEL,
  });

  // Phase 2 — exercises for each day, in parallel.
  const dayResults = await Promise.all(
    structure.days.map((day) => {
      // Filter our Cloudinary exercise library down to the muscles relevant to
      // this day's focus, then list them in the prompt so the AI picks from real
      // demo-available movements.
      const { exercises: candidates } = pickRelevantExercises(
        `${day.title} ${day.focus}`,
      );
      const library = formatExerciseList(candidates);

      return generateStructured({
        system: DAY_SYSTEM,
        user: `Fill in exercises for this training day.

User: ${profileLine}

Day: "${day.title}" — focus: ${day.focus}

EXERCISE LIBRARY (use these exact names whenever possible):
${library}

Pick up to 5 exercises that fit the equipment, injuries, and this day's focus.`,
        schema: WorkoutDayExercisesSchema,
        toolName: "submit_day_exercises",
        toolDescription: "Submit the exercises for this single training day.",
        maxTokens: 2500,
        model: TEXT_MODEL,
      }).then((res) => ({ day, exercises: res.exercises, candidates }));
    }),
  );

  // Assemble into the full plan shape, then match each AI-generated exercise to
  // the Cloudinary library and inject the demo video URL.
  const assembled = {
    split_name: structure.split_name,
    days_per_week: structure.days_per_week,
    notes: structure.notes,
    days: dayResults.map(({ day, exercises, candidates }) => ({
      day_index: day.day_index,
      title: day.title,
      focus: day.focus,
      warmup: day.warmup,
      cooldown: day.cooldown,
      cardio: day.cardio,
      exercises: exercises.map((ex) => {
        // Try same-day candidates first (faster, day-focus-relevant), fall back
        // to a global match (covers cross-muscle picks).
        const match =
          matchExercise(ex.name, candidates) ?? matchExercise(ex.name);
        return {
          ...ex,
          demo_video_url: match ? videoUrl(match.publicId) : "",
        };
      }),
    })),
  };

  return WorkoutPlanSchema.parse(assembled);
}
