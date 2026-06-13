import { NextResponse } from "next/server";
import { requireUser } from "@/lib/firebase/auth";
import {
  getProfile,
  getChatHistory,
  addChatMessage,
} from "@/lib/firestore/repo";
import { answerCoachChat } from "@/lib/ai/coach-chat";
import { AIConfigError } from "@/lib/ai/client";
import { checkCoachAllowed } from "@/lib/limits/limits";
import { reportError, GENERIC_ERROR } from "@/lib/errors/report";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/coach  Body: { message: string }
 * Persists user message + assistant reply, returns the reply.
 */
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const message: string = (body?.message ?? "").toString().trim();
  if (!message) {
    return NextResponse.json({ error: "Empty message." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long (2000 max)." }, { status: 400 });
  }

  const profile = await getProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Onboarding incomplete." }, { status: 400 });
  }

  // Enforce the per-day coach message cap.
  const gate = await checkCoachAllowed(user.id);
  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.reason, code: "LIMIT_REACHED", limit: gate.limit },
      { status: 429 },
    );
  }

  // Last 10 messages for context (ascending).
  const history = (await getChatHistory(user.id, 10))
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  await addChatMessage(user.id, "user", message);

  let reply: string;
  try {
    reply = await answerCoachChat({
      profile,
      history,
      question: message,
      // route through the queue's per-user fairness cap
      // (answerCoachChat forwards userId if supported)
    });
  } catch (e) {
    await reportError("/api/coach", e, {
      userId: user.id,
      code: e instanceof AIConfigError ? "AI_NOT_CONFIGURED" : null,
    });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }

  await addChatMessage(user.id, "assistant", reply);

  return NextResponse.json({ reply });
}
