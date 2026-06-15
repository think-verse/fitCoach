"use client";

import * as React from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  primaryLabel: string;
  primaryHref: string;
  /** Signed-in user's display name, or null if not signed in / no profile. */
  userName?: string | null;
  /** Human-readable goal label (e.g. "Fat loss"), or null. */
  goalLabel?: string | null;
}

const TRUST = [
  "Home or gym",
  "Vegan-friendly",
  "Weekly check-ins",
  "Macro targets",
  "Form cues",
  "Adapts to you",
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const rise = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function Hero({
  primaryLabel,
  primaryHref,
  userName,
  goalLabel,
}: HeroProps) {
  const reduce = useReducedMotion();

  // Mouse-parallax (desktop pointer only — touch never fires these).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  const mockX = useTransform(sx, (v) => v * 16);
  const mockY = useTransform(sy, (v) => v * 16);
  const mockRotY = useTransform(sx, (v) => v * 5);
  const mockRotX = useTransform(sy, (v) => v * -5);
  const blobX = useTransform(sx, (v) => v * -36);
  const blobY = useTransform(sy, (v) => v * -36);

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <section
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative overflow-hidden"
    >
      {/* ---------- animated background ---------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div style={{ x: blobX, y: blobY }} className="absolute inset-0">
          <motion.div
            className="absolute -left-28 top-0 h-80 w-80 rounded-full bg-emerald-500/20 blur-[90px] sm:h-[26rem] sm:w-[26rem]"
            animate={
              reduce ? undefined : { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
            }
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[-7rem] top-10 h-80 w-80 rounded-full bg-indigo-500/20 blur-[90px] sm:h-[24rem] sm:w-[24rem]"
            animate={
              reduce ? undefined : { scale: [1.1, 1, 1.1], opacity: [0.6, 0.9, 0.6] }
            }
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="hairline-glow absolute inset-x-0 top-0 h-px opacity-60" />
        {/* perspective floor grid — desktop only (too busy on small screens) */}
        <div className="absolute inset-x-0 bottom-0 hidden h-40 [mask-image:linear-gradient(to_top,black,transparent)] md:block">
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)/0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.6) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              transform: "perspective(420px) rotateX(60deg)",
              transformOrigin: "bottom",
            }}
          />
        </div>
      </div>

      <div className="container relative grid items-center gap-10 pb-16 pt-12 md:gap-12 md:pb-28 md:pt-24 lg:grid-cols-2">
        {/* ---------- left: copy ---------- */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={rise}>
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="relative mr-2 flex h-2 w-2">
                {!reduce && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              AI fitness, done right
            </span>
          </motion.div>

          <h1 className="mt-6 max-w-xl text-balance text-[2.25rem] font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            <motion.span variants={rise} className="block">
              Your AI
            </motion.span>
            <motion.span
              variants={rise}
              className="gradient-text-animated block drop-shadow-[0_0_30px_rgba(52,211,153,0.25)]"
            >
              personal trainer
            </motion.span>
            <motion.span variants={rise} className="block text-foreground/95">
              &amp; diet coach in one.
            </motion.span>
          </h1>

          <motion.p
            variants={rise}
            className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg"
          >
            Upload your physique, get an instant AI body analysis, and unlock a
            workout &amp; diet plan built for your goal, gear, and budget — then
            check in weekly and watch it adapt.
          </motion.p>

          <motion.div
            variants={rise}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="xl" className="w-full sm:w-auto">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            variants={rise}
            className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            AI visual estimate — not a medical diagnosis. For fitness only.
          </motion.div>

          {/* trust marquee */}
          <motion.div
            variants={rise}
            className="mask-fade-x mt-8 overflow-hidden"
          >
            <div
              className={
                reduce ? "flex flex-wrap gap-2" : "flex w-max animate-marquee gap-2"
              }
            >
              {(reduce ? TRUST : [...TRUST, ...TRUST]).map((t, i) => (
                <span
                  key={`${t}-${i}`}
                  className="whitespace-nowrap rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ---------- right: personalized profile card ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          style={{ perspective: 1200 }}
          className="mx-auto w-full max-w-sm sm:max-w-md"
        >
          <motion.div
            style={
              reduce
                ? undefined
                : { x: mockX, y: mockY, rotateX: mockRotX, rotateY: mockRotY }
            }
            className="card-glow relative overflow-hidden rounded-3xl border border-border bg-card/80 p-6 backdrop-blur-md sm:p-8"
          >
            {/* scanning beam */}
            {!reduce && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scanline bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_18px_2px_rgba(52,211,153,0.6)]"
              />
            )}

            {userName ? (
              <ProfileCard
                name={userName}
                goalLabel={goalLabel ?? null}
                reduce={!!reduce}
              />
            ) : (
              <EmptyCard reduce={!!reduce} />
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/** Signed-in: show the user's name + goal. */
function ProfileCard({
  name,
  goalLabel,
  reduce,
}: {
  name: string;
  goalLabel: string | null;
  reduce: boolean;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-2 flex w-full items-center justify-between text-[11px] text-muted-foreground">
        <span className="uppercase tracking-wide">Your profile</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Active
        </span>
      </div>

      {/* avatar with rotating gradient ring */}
      <div className="relative mt-3 h-24 w-24">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, #34d399, #2dd4bf, #818cf8, #34d399)",
          }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-card text-3xl font-bold">
          {initial}
        </div>
      </div>

      <div className="mt-5 text-xs text-muted-foreground">Welcome back,</div>
      <div className="mt-0.5 max-w-full truncate text-2xl font-bold tracking-tight">
        {name}
      </div>

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-emerald-300">
        <Target className="h-4 w-4" />
        Goal: {goalLabel ?? "Not set yet"}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        {goalLabel
          ? "Your AI workout & diet plan is tuned to this goal — and adapts every week."
          : "Finish your profile to lock in a goal and personalize your plan."}
      </p>
    </div>
  );
}

/** Not signed in / no profile yet. */
function EmptyCard({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <div className="relative h-20 w-20">
        {!reduce && (
          <span className="absolute inset-0 animate-pulse-glow rounded-full" />
        )}
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground">
          <UserRound className="h-9 w-9" />
        </div>
      </div>

      <h3 className="mt-5 text-xl font-semibold">No profile yet</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Sign in and tell us your goal — your name, target, and personalized AI
        snapshot show up right here.
      </p>

      <Button asChild size="sm" className="mt-5">
        <Link href="/login">
          <Sparkles className="h-4 w-4" />
          Get started free
        </Link>
      </Button>
    </div>
  );
}

export default Hero;
