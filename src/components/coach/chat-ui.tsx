"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  Sparkles,
  Dumbbell,
  Flame,
  HeartPulse,
  CalendarX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Usage {
  used: number;
  limit: number;
  remaining: number;
}

const SUGGESTIONS = [
  { icon: Dumbbell, text: "Can I replace bench press with dumbbell press?" },
  { icon: CalendarX, text: "I missed gym today, what should I do?" },
  { icon: Flame, text: "I ate 500 extra calories — how to adjust?" },
  { icon: HeartPulse, text: "My shoulder hurts, modify today's workout." },
];

export function ChatUI({
  initialMessages = [],
  initialRemaining = null,
  dailyLimit = null,
}: {
  initialMessages?: Message[];
  initialRemaining?: number | null;
  dailyLimit?: number | null;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null = unknown (limit lookup failed) → don't gate or show the counter.
  const [remaining, setRemaining] = useState<number | null>(initialRemaining);
  const [limit, setLimit] = useState<number | null>(dailyLimit);
  const scrollRef = useRef<HTMLDivElement>(null);

  const knowRemaining = remaining !== null;
  const outOfMessages = knowRemaining && remaining! <= 0;
  const isEmpty = messages.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  function applyUsage(usage?: Usage) {
    if (!usage) return;
    setRemaining(Math.max(0, usage.remaining));
    setLimit(usage.limit);
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    if (outOfMessages) return; // hard stop — server would 429 anyway
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    // Optimistic decrement so the counter ticks down the instant they send;
    // reconciled to the server's authoritative value when the reply lands.
    if (knowRemaining) setRemaining((r) => Math.max(0, (r ?? 0) - 1));
    setSending(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      applyUsage(data.usage as Usage | undefined);
      if (!res.ok) throw new Error(data.error ?? "Coach failed.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coach failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="card-glow relative flex h-[calc(100dvh-14rem)] flex-col overflow-hidden border-border/60 md:h-[calc(100dvh-10rem)]">
      {/* Ambient glow bleeding from the top of the panel. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-hero-glow opacity-70"
      />

      {/* ---- Header: coach identity + live message budget ---- */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3 md:px-6">
        <CoachAvatar speaking={sending} />
        <div className="min-w-0 flex-1">
          <h2 className="gradient-text-animated text-base font-bold leading-tight">
            FitCoach AI
          </h2>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {sending ? "Coach is typing…" : "Online · tuned to your plan"}
          </p>
        </div>
        {knowRemaining && (
          <UsagePill
            remaining={remaining!}
            limit={limit}
            outOfMessages={outOfMessages}
          />
        )}
      </div>
      <div className="hairline-glow h-px" />

      {/* ---- Message stream ---- */}
      <div
        ref={scrollRef}
        className="scrollbar-none relative z-10 flex-1 space-y-4 overflow-y-auto p-4 md:p-6"
      >
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-5 pt-6 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400/25 via-teal-400/15 to-indigo-400/20 ring-1 ring-emerald-400/30"
            >
              <Bot className="h-8 w-8 text-primary" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background ring-1 ring-emerald-400/40">
                <Sparkles className="h-3 w-3 text-emerald-300" />
              </span>
            </motion.div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                Ask your <span className="gradient-text">AI coach</span>
              </h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                Training, food, recovery, motivation — your coach knows your plan
                and answers in seconds.
              </p>
            </div>
            <div className="grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s.text}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i + 0.1 }}
                  onClick={() => send(s.text)}
                  disabled={outOfMessages || sending}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-card/40 p-3 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-lg hover:shadow-primary/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="leading-snug">{s.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.content}
          </Bubble>
        ))}

        <AnimatePresence>
          {sending && (
            <Bubble role="assistant">
              <TypingDots />
            </Bubble>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* ---- Composer ---- */}
      <div className="relative z-10 border-t border-border/60 bg-background/40 p-3 backdrop-blur md:p-4">
        {!isEmpty && !outOfMessages && (
          <div className="scrollbar-none mb-2.5 flex gap-2 overflow-x-auto pb-0.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                onClick={() => send(s.text)}
                disabled={sending}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
              >
                <s.icon className="h-3 w-3 text-primary" />
                {s.text.length > 32 ? `${s.text.slice(0, 30)}…` : s.text}
              </button>
            ))}
          </div>
        )}

        {outOfMessages ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <Flame className="h-5 w-5 shrink-0 text-amber-500" />
            <span>
              You&apos;ve used all your coach messages for now. Each message frees
              up 24 hours after you sent it — check back later.
            </span>
          </div>
        ) : (
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background/60 p-1.5 pl-3 transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask your coach anything…"
              rows={1}
              disabled={sending}
              className="min-h-[40px] min-w-0 flex-1 resize-none border-0 bg-transparent px-0 py-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              onClick={() => send()}
              size="icon"
              disabled={!input.trim() || sending}
              className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-emerald-950 shadow-lg shadow-primary/20 hover:from-emerald-300 hover:to-teal-400"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
        <p className="mt-2 px-1 text-[10px] text-muted-foreground">
          For injuries or medical issues, see a qualified professional. Coach
          replies are AI-generated guidance only.
        </p>
      </div>
    </Card>
  );
}

/* The remaining-messages budget, rendered as a labeled mini progress bar. */
function UsagePill({
  remaining,
  limit,
  outOfMessages,
}: {
  remaining: number;
  limit: number | null;
  outOfMessages: boolean;
}) {
  const pct =
    limit && limit > 0 ? Math.max(0, Math.min(100, (remaining / limit) * 100)) : 0;
  const low = !outOfMessages && remaining <= 3;
  const tone = outOfMessages
    ? "text-destructive"
    : low
      ? "text-amber-500"
      : "text-muted-foreground";
  const fill = outOfMessages
    ? "from-destructive to-destructive"
    : low
      ? "from-amber-400 to-orange-400"
      : "from-emerald-400 to-teal-300";

  return (
    <div className="flex flex-col items-end gap-1">
      <span className={cn("text-xs font-medium tabular-nums", tone)}>
        {outOfMessages ? (
          "0 left today"
        ) : (
          <>
            <span className="font-bold text-foreground">{remaining}</span>
            {limit !== null && (
              <span className="text-muted-foreground">/{limit}</span>
            )}{" "}
            left
          </>
        )}
      </span>
      {limit !== null && limit > 0 && (
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", fill)}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          />
        </div>
      )}
    </div>
  );
}

/* Animated coach avatar with a live "online" ring that pulses while replying. */
function CoachAvatar({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/25 via-teal-400/15 to-indigo-400/20 text-primary ring-1 ring-emerald-400/30 transition-shadow",
          speaking && "animate-pulse-glow",
        )}
      >
        <Bot className="h-5 w-5" />
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-400" />
    </div>
  );
}

/* Three-dot typing indicator. */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "flex w-full items-end gap-2.5",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/25 to-indigo-400/20 text-primary ring-1 ring-emerald-400/25">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] min-w-0 overflow-hidden whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-2xl rounded-br-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-primary/20"
            : "rounded-2xl rounded-bl-md border border-border bg-card/80 backdrop-blur",
        )}
      >
        {children}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
          <UserIcon className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}
