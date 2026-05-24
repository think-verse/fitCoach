import type { UserProfile } from "@/lib/db/schema";
import { generateStructured } from "./client";
import { WorkoutPlanSchema, type WorkoutPlanAI, type BodyAnalysis } from "./schemas";

const SYSTEM = `You are FitCoach AI generating a personalized training plan.

Rules:
- Split must match training days/week: 3=full body, 4=upper/lower or PPL+full,
  5=PPL+upper/lower, 6=PPL repeated.
- Bias volume toward the priority muscle groups from the analysis.
- Beginner = movement-focused, fewer total sets, longer rest. Advanced = higher
  volume, intensity techniques okay.
- For home users with no equipment, use bodyweight/dumbbell progressions.
- Respect injuries: if shoulder pain, avoid behind-the-neck pressing; if knee
  pain, avoid deep loaded squats — substitute and say why in form_cues.
- demo_video_url: prefer canonical YouTube URLs for well-known exercises
  (e.g. Athlean-X, Jeff Nippard, Renaissance Periodization). If unsure, leave empty.
- Every exercise needs a concrete progression_rule
  (e.g. "Add 2.5kg when you hit top of rep range for all sets").`;

export interface WorkoutPlanInput {
  profile: UserProfile;
  analysis: BodyAnalysis;
}

export async function generateWorkoutPlan(
  input: WorkoutPlanInput,
): Promise<WorkoutPlanAI> {
  const { profile, analysis } = input;

  const prompt = `Generate a complete weekly training plan for this user.

User profile:
- Goal: ${profile.goal}
- Experience: ${profile.experience}
- Training: ${profile.trainingDaysPerWeek} days/week at ${profile.trainingLocation}
- Equipment available: ${(profile.equipment ?? []).join(", ") || "unknown — assume minimal"}
- Injuries / limitations: ${profile.injuries || "none"}
- Height/weight: ${profile.heightCm} cm / ${profile.weightKg} kg

From the body analysis:
- Physique type: ${analysis.physique_type}
- Priority muscle groups: ${analysis.priority_muscle_groups.join(", ")}
- Weaknesses to address: ${analysis.cons.join("; ")}
- 30-day goal: ${analysis.realistic_30_day_goal}

Output every training day (do not skip rest days — for rest days emit a day with
exercises=[] is NOT allowed; instead emit only the actual training days). Each
exercise must include realistic numbers a real trainee can follow tomorrow.`;

  return generateStructured({
    system: SYSTEM,
    user: prompt,
    schema: WorkoutPlanSchema,
    toolName: "submit_workout_plan",
    toolDescription: "Submit the personalized weekly workout plan.",
    maxTokens: 5000,
  });
}
