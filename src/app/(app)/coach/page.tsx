import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db";
import { ChatUI } from "@/components/coach/chat-ui";

export const metadata = { title: "AI Coach" };

export default async function CoachPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const recent = await db
    .select()
    .from(schema.aiChatMessages)
    .where(eq(schema.aiChatMessages.userId, user.id))
    .orderBy(desc(schema.aiChatMessages.createdAt))
    .limit(20)
    .catch(() => []);

  const initialMessages = recent
    .reverse()
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-muted-foreground">Your personal AI</p>
        <h1 className="text-3xl font-bold tracking-tight">Coach chat</h1>
      </header>
      <ChatUI initialMessages={initialMessages} />
    </div>
  );
}
