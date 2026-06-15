import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getChatHistory } from "@/lib/firestore/repo";
import { getCoachUsage } from "@/lib/limits/limits";
import { ChatUI } from "@/components/coach/chat-ui";

export const metadata = { title: "AI Coach" };
export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [recent, usage] = await Promise.all([
    getChatHistory(user.id, 20).catch(() => []),
    getCoachUsage(user.id).catch(() => null),
  ]);

  const initialMessages = recent
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
      <ChatUI
        initialMessages={initialMessages}
        initialRemaining={usage?.remaining ?? null}
        dailyLimit={usage?.limit ?? null}
      />
    </div>
  );
}
