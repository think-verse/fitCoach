import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/supabase/server";
import { answerCoachChat } from "@/lib/ai/coach-chat";
import { AIConfigError } from "@/lib/ai/client";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/coach
 * Body: { message: string }
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

  const [profile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, user.id))
    .limit(1);
  if (!profile) {
    return NextResponse.json({ error: "Onboarding incomplete." }, { status: 400 });
  }

  // Last 10 messages for context.
  const history = await db
    .select()
    .from(schema.aiChatMessages)
    .where(eq(schema.aiChatMessages.userId, user.id))
    .orderBy(desc(schema.aiChatMessages.createdAt))
    .limit(10);

  const orderedHistory = history
    .reverse()
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Persist user message.
  await db.insert(schema.aiChatMessages).values({
    userId: user.id,
    role: "user",
    content: message,
  });

  let reply: string;
  try {
    reply = await answerCoachChat({
      profile,
      history: orderedHistory,
      question: message,
    });
  } catch (e) {
    if (e instanceof AIConfigError) {
      return NextResponse.json(
        { error: e.message, code: "AI_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    console.error("[/api/coach] AI error:", e);
    return NextResponse.json({ error: "Coach is unavailable." }, { status: 502 });
  }

  await db.insert(schema.aiChatMessages).values({
    userId: user.id,
    role: "assistant",
    content: reply,
  });

  return NextResponse.json({ reply });
}
