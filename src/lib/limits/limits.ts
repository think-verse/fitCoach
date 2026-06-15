import "server-only";

/**
 * Usage-limit enforcement. One "generation" = a full analysis→plan flow
 * (body analysis + workout + diet) and is counted once, at /api/analysis.
 * Coach messages are counted per user message sent to /api/coach.
 *
 * Windows are ROLLING (not calendar): weekly = last 7 days, monthly = last
 * 30 days, daily = last 24 hours. Rolling windows are simpler to reason about
 * and can't be gamed by waiting for a calendar reset.
 */
import {
  getLimitsConfig,
  getUserLimits,
  countGenerationsSince,
  countCoachMessagesSince,
} from "@/lib/firestore/repo";
import type { LimitsConfig } from "@/lib/firestore/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function sinceIso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * DAY_MS).toISOString();
}

export interface EffectiveLimits {
  generationsPerWeek: number;
  generationsPerMonth: number;
  coachMessagesPerDay: number;
}

/** Merge the global config with a per-user override (override wins when set). */
export async function getEffectiveLimits(
  uid: string,
): Promise<{ effective: EffectiveLimits; global: LimitsConfig }> {
  const [global, override] = await Promise.all([
    getLimitsConfig(),
    getUserLimits(uid),
  ]);
  const pick = (o: number | null | undefined, g: number) =>
    o === null || o === undefined ? g : o;
  return {
    global,
    effective: {
      generationsPerWeek: pick(
        override?.generationsPerWeek,
        global.generationsPerWeek,
      ),
      generationsPerMonth: pick(
        override?.generationsPerMonth,
        global.generationsPerMonth,
      ),
      coachMessagesPerDay: pick(
        override?.coachMessagesPerDay,
        global.coachMessagesPerDay,
      ),
    },
  };
}

export interface LimitCheck {
  allowed: boolean;
  /** Human-readable reason when blocked. */
  reason?: string;
  window?: "week" | "month" | "day";
  used?: number;
  limit?: number;
}

/**
 * Can this user start a new generation right now? Checks BOTH the weekly and
 * monthly caps; whichever is hit first blocks. A limit of 0 means unlimited
 * is NOT assumed — 0 blocks. Use a large number for "effectively unlimited".
 */
export async function checkGenerationAllowed(
  uid: string,
): Promise<LimitCheck> {
  const { effective } = await getEffectiveLimits(uid);

  const [usedWeek, usedMonth] = await Promise.all([
    countGenerationsSince(uid, sinceIso(7)),
    countGenerationsSince(uid, sinceIso(30)),
  ]);

  if (usedWeek >= effective.generationsPerWeek) {
    return {
      allowed: false,
      window: "week",
      used: usedWeek,
      limit: effective.generationsPerWeek,
      reason: `You've used all ${effective.generationsPerWeek} of your weekly generations. Limit resets within 7 days.`,
    };
  }
  if (usedMonth >= effective.generationsPerMonth) {
    return {
      allowed: false,
      window: "month",
      used: usedMonth,
      limit: effective.generationsPerMonth,
      reason: `You've used all ${effective.generationsPerMonth} of your monthly generations. Limit resets within 30 days.`,
    };
  }
  return { allowed: true };
}

export interface CoachUsage {
  /** Coach messages the user has sent in the rolling 24h window. */
  used: number;
  /** The effective per-day cap for this user. */
  limit: number;
  /** Messages still available right now (never negative). */
  remaining: number;
}

/**
 * Current coach-message usage for the live "messages left" counter. Single
 * source of truth — both the chat page (initial value) and /api/coach (the
 * value returned after each send) call this, so the UI and the server can
 * never disagree about the count.
 */
export async function getCoachUsage(uid: string): Promise<CoachUsage> {
  const { effective } = await getEffectiveLimits(uid);
  const used = await countCoachMessagesSince(uid, sinceIso(1));
  const limit = effective.coachMessagesPerDay;
  return { used, limit, remaining: Math.max(0, limit - used) };
}

/** Can this user send another coach message in the last 24h? */
export async function checkCoachAllowed(uid: string): Promise<LimitCheck> {
  const { effective } = await getEffectiveLimits(uid);
  const usedDay = await countCoachMessagesSince(uid, sinceIso(1));
  if (usedDay >= effective.coachMessagesPerDay) {
    return {
      allowed: false,
      window: "day",
      used: usedDay,
      limit: effective.coachMessagesPerDay,
      reason: `You've reached your daily limit of ${effective.coachMessagesPerDay} coach messages. Try again tomorrow.`,
    };
  }
  return { allowed: true };
}
