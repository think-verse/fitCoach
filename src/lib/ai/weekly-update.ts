import type { UserProfile } from "@/lib/firestore/types";
import { generateStructured } from "./client";
import {
  WeeklyUpdateSchema,
  type WeeklyUpdate,
  type BodyAnalysis,
} from "./schemas";

const SYSTEM = `You are FitCoach AI comparing the user's progress between two check-ins.

Rules:
- Visual changes from photos are estimates. Weight/measurement deltas are real.
- A 0.3–0.7 kg/week loss = healthy fat loss. >1 kg/week = warn user, recommend
  slightly more calories. <0.2 kg/week with diet adherence high = small further
  deficit (~100 kcal).
- For muscle gain: 0.2–0.4 kg/week is realistic. More = likely fat gain, warn.
- workout_adjustment must be CONCRETE (e.g. "Add one set to dumbbell row, drop
  one set from lateral raise"). Not vague encouragement.
- motivation_message is short, specific, and not cringey. No emojis unless the
  user used them first.
- Adherence below 60% = call it out gently and prescribe behavioral fixes, not
  plan changes.`;

interface WeeklyInput {
  profile: UserProfile;
  previous: {
    weightKg?: number;
    weekNumber: number;
    analysis: BodyAnalysis;
  };
  current: {
    weightKg?: number;
    weekNumber: number;
    measurements?: Record<string, number | undefined>;
    photosAvailable: boolean;
    workoutAdherencePct: number;
    dietAdherencePct: number;
  };
  photos?: Array<{
    label: string;
    base64: string;
    mediaType: string;
  }>;
}

export async function generateWeeklyUpdate(
  input: WeeklyInput,
): Promise<WeeklyUpdate> {
  const { profile, previous, current, photos } = input;

  const deltaKg =
    current.weightKg != null && previous.weightKg != null
      ? +(current.weightKg - previous.weightKg).toFixed(2)
      : null;

  const summary = [
    `Goal: ${profile.goal}`,
    `Week: ${previous.weekNumber} → ${current.weekNumber}`,
    previous.weightKg
      ? `Weight: ${previous.weightKg} → ${current.weightKg} kg (Δ ${deltaKg} kg)`
      : "",
    `Workout adherence: ${current.workoutAdherencePct}%`,
    `Diet adherence:    ${current.dietAdherencePct}%`,
    current.measurements
      ? `Measurements: ${JSON.stringify(current.measurements)}`
      : "",
    `Previous priority groups: ${previous.analysis.priority_muscle_groups.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const userContent = [
    {
      type: "text" as const,
      text: `Compare this week's check-in to last week. Produce structured feedback.\n\n${summary}\n\n${
        photos?.length
          ? "Photos below are paired: previous first, current second."
          : "No photos available this week — base analysis on the numbers."
      }`,
    },
    ...(photos ?? []).flatMap((p) => [
      { type: "text" as const, text: p.label },
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
    schema: WeeklyUpdateSchema,
    toolName: "submit_weekly_update",
    toolDescription: "Submit the structured weekly progress comparison.",
    maxTokens: 2000,
  });
}
