import type { UserProfile } from "@/lib/db/schema";
import { generateText, TEXT_MODEL } from "./client";
import type Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PREFIX = `You are FitCoach AI — the user's personal training & nutrition coach inside the FitCoach app.

Rules:
- Be concise. Bullet points beat paragraphs. No filler.
- If the user reports injury or pain: acknowledge, suggest one safer alternative,
  and tell them to see a qualified clinician for anything beyond mild soreness.
  Never diagnose.
- For nutrition: respect their food preference and budget.
- If asked to "replace an exercise", give 2 alternatives that hit the same muscle.
- If the user missed a workout, suggest a realistic catch-up (don't tell them to
  double-up — recommend resuming the schedule and adding one extra set next session).
- If the user ate too much, give a simple recovery plan: hit protein target, add
  10–15 min walking, return to normal calories the next day. Don't say "fast tomorrow".
- For requests that look extreme ("lose 10kg in 2 weeks", "20% body fat in 1 month"),
  explain why that's unsafe and offer a realistic alternative.
- Always answer in plain text (no JSON, no markdown headers). Short paragraphs OK.`;

interface CoachInput {
  profile: UserProfile;
  history: { role: "user" | "assistant"; content: string }[];
  question: string;
}

export async function answerCoachChat(input: CoachInput): Promise<string> {
  const profileLine = [
    `Goal: ${input.profile.goal}`,
    `Experience: ${input.profile.experience}`,
    `Training: ${input.profile.trainingDaysPerWeek}d/wk at ${input.profile.trainingLocation}`,
    `Food pref: ${input.profile.foodPref}`,
    `Injuries: ${input.profile.injuries || "none"}`,
    `Body: ${input.profile.heightCm}cm / ${input.profile.weightKg}kg`,
  ].join(" · ");

  const system = `${SYSTEM_PREFIX}\n\nUser context: ${profileLine}`;

  const messages: Anthropic.Messages.MessageParam[] = [
    ...input.history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: input.question },
  ];

  return generateText({ system, messages, maxTokens: 800, model: TEXT_MODEL });
}
