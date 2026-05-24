import type { UserProfile } from "@/lib/db/schema";
import { generateStructured } from "./client";
import { BodyAnalysisSchema, type BodyAnalysis } from "./schemas";
import { computeNutrition } from "@/lib/calc";

const SYSTEM = `You are FitCoach AI — a careful, evidence-based fitness analyst.

You will look at the user's physique photos (front, side, back) and their profile,
then produce a structured body analysis. Important rules:

- Treat everything as a VISUAL ESTIMATE, not a medical measurement.
- Body fat percentage is given as a range (e.g. "14–17%"), never a single number.
- Be honest but motivating — name real weak points without being harsh.
- If photo quality is poor, lighting is bad, or the person is mostly clothed,
  lower the confidence_level and say so in overall_summary.
- The disclaimer must mention: AI visual estimate, not medical advice, use the
  same lighting and pose for weekly comparison.
- Always include at least 2 pros and 2 cons. Be specific (e.g. "good shoulder
  width relative to waist" not "looks good").
- Priority muscle groups must be the 2–4 areas that, if improved, would most
  change the physique toward their stated goal.
- Scores are 0–100 visual category ratings for THIS person at THIS moment,
  calibrated against a typical fitness-app population (not elite athletes).`;

interface BodyAnalysisInput {
  profile: UserProfile;
  photos: Array<{ angle: "front" | "side" | "back"; base64: string; mediaType: string }>;
}

export async function generateBodyAnalysis(
  input: BodyAnalysisInput,
): Promise<BodyAnalysis> {
  const { profile, photos } = input;

  // Deterministic metrics we feed to the model so it doesn't hallucinate them.
  const nutrition =
    profile.heightCm && profile.weightKg && profile.age && profile.gender
      ? computeNutrition({
          heightCm: Number(profile.heightCm),
          weightKg: Number(profile.weightKg),
          age: profile.age,
          gender: profile.gender,
          activityLevel: (profile.activityLevel ?? "moderate") as
            | "sedentary"
            | "light"
            | "moderate"
            | "active"
            | "very_active",
          goal: profile.goal ?? "general_fitness",
        })
      : null;

  const profileSummary = [
    `Name: ${profile.name ?? "—"}`,
    `Age: ${profile.age ?? "—"}`,
    `Gender: ${profile.gender ?? "—"}`,
    `Height: ${profile.heightCm ?? "—"} cm`,
    `Weight: ${profile.weightKg ?? "—"} kg`,
    `Goal: ${profile.goal ?? "—"}`,
    `Experience: ${profile.experience ?? "—"}`,
    `Training: ${profile.trainingDaysPerWeek ?? "—"} days/week, ${profile.trainingLocation ?? "—"}`,
    `Injuries: ${profile.injuries || "none reported"}`,
    nutrition ? `BMI: ${nutrition.bmi} (${nutrition.bmiCategory})` : "",
    nutrition ? `Computed BMR: ${nutrition.bmr} kcal, TDEE: ${nutrition.tdee} kcal` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const userContent = [
    {
      type: "text" as const,
      text: `Analyze the physique photos below for this user.\n\nProfile:\n${profileSummary}\n\nPhotos are labeled by angle.`,
    },
    ...photos.flatMap((p) => [
      { type: "text" as const, text: `${p.angle.toUpperCase()} view:` },
      {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: p.mediaType as "image/jpeg" | "image/png" | "image/webp",
          data: p.base64,
        },
      },
    ]),
  ];

  return generateStructured({
    system: SYSTEM,
    user: userContent,
    schema: BodyAnalysisSchema,
    toolName: "submit_body_analysis",
    toolDescription:
      "Submit the structured body analysis report for the user based on their photos and profile.",
    maxTokens: 3000,
  });
}
