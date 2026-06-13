/**
 * Derived user insights — pure computation over data we already have in
 * Firestore. NO AI / external calls. Used to make the dashboard & home feel
 * alive without any token cost.
 */
import type {
  UserProfile,
  BodyMeasurement,
  WeeklyCheckin,
} from "@/lib/firestore/types";

/* ------------------------------- greeting ------------------------------ */

export function getGreeting(now: Date = new Date(), timezone?: string): string {
  let hour: number;
  try {
    hour =
      parseInt(
        new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          hour12: false,
          timeZone: timezone || undefined,
        }).format(now),
        10,
      ) % 24;
  } catch {
    hour = now.getHours();
  }
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function formatToday(now: Date = new Date(), timezone?: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: timezone || undefined,
    }).format(now);
  } catch {
    return now.toDateString();
  }
}

/* ----------------------------- check-ins ------------------------------- */

export interface CheckinStatus {
  nextWeek: number;
  lastWeek: number | null;
  daysUntil: number | null;
  overdue: boolean;
  hasHistory: boolean;
}

/** `checkins` is expected newest-first (weekNumber desc), as getCheckins returns. */
export function nextCheckinInfo(
  checkins: WeeklyCheckin[],
  now: Date = new Date(),
): CheckinStatus {
  if (!checkins || checkins.length === 0) {
    return {
      nextWeek: 1,
      lastWeek: null,
      daysUntil: null,
      overdue: false,
      hasHistory: false,
    };
  }
  const last = checkins[0];
  const lastDate = new Date(last.createdAt);
  const msPerDay = 86_400_000;
  const daysSince = Number.isFinite(lastDate.getTime())
    ? Math.floor((now.getTime() - lastDate.getTime()) / msPerDay)
    : 0;
  const daysUntil = 7 - daysSince;
  return {
    nextWeek: (last.weekNumber ?? 0) + 1,
    lastWeek: last.weekNumber ?? null,
    daysUntil,
    overdue: daysUntil <= 0,
    hasHistory: true,
  };
}

/* ------------------------------- weight -------------------------------- */

export interface WeightDeltas {
  current: number | null;
  start: number | null;
  sinceStart: number | null;
  thisWeek: number | null;
}

/** `measurements` is expected newest-first, as getWeightHistory returns. */
export function weightDeltas(measurements: BodyMeasurement[]): WeightDeltas {
  const weights = (measurements ?? [])
    .map((m) =>
      m.weightKg != null && Number.isFinite(m.weightKg)
        ? Number(m.weightKg)
        : null,
    )
    .filter((w): w is number => w != null);

  if (weights.length === 0) {
    return { current: null, start: null, sinceStart: null, thisWeek: null };
  }
  const current = weights[0];
  const start = weights[weights.length - 1];
  const prev = weights.length > 1 ? weights[1] : null;
  return {
    current,
    start,
    sinceStart: +(current - start).toFixed(1),
    thisWeek: prev != null ? +(current - prev).toFixed(1) : null,
  };
}

export interface HealthyRange {
  minKg: number | null;
  maxKg: number | null;
}

/** Healthy weight band from height (BMI 18.5–24.9). */
export function healthyWeightRange(
  heightCm: number | null | undefined,
): HealthyRange {
  if (heightCm == null || !Number.isFinite(heightCm) || heightCm <= 0) {
    return { minKg: null, maxKg: null };
  }
  const m = Number(heightCm) / 100;
  return {
    minKg: +(18.5 * m * m).toFixed(1),
    maxKg: +(24.9 * m * m).toFixed(1),
  };
}

/* ---------------------------- completeness ----------------------------- */

export interface Completeness {
  pct: number;
  filled: number;
  total: number;
  missing: string[];
}

const COMPLETENESS_FIELDS: Array<{ key: keyof UserProfile; label: string }> = [
  { key: "name", label: "Name" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "heightCm", label: "Height" },
  { key: "weightKg", label: "Weight" },
  { key: "goal", label: "Goal" },
  { key: "experience", label: "Experience" },
  { key: "trainingLocation", label: "Training location" },
  { key: "trainingDaysPerWeek", label: "Training days" },
  { key: "foodPref", label: "Food preference" },
  { key: "dietStyle", label: "Diet style" },
  { key: "activityLevel", label: "Activity level" },
];

export function profileCompleteness(profile: UserProfile | null): Completeness {
  const total = COMPLETENESS_FIELDS.length;
  if (!profile) {
    return {
      pct: 0,
      filled: 0,
      total,
      missing: COMPLETENESS_FIELDS.map((f) => f.label),
    };
  }
  const missing: string[] = [];
  let filled = 0;
  for (const f of COMPLETENESS_FIELDS) {
    const v = profile[f.key];
    const ok =
      v != null && v !== "" && !(Array.isArray(v) && v.length === 0);
    if (ok) filled++;
    else missing.push(f.label);
  }
  return { pct: Math.round((filled / total) * 100), filled, total, missing };
}
