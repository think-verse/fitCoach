/**
 * AI call queue — caps concurrent calls to the model provider.
 *
 * At most AI_MAX_CONCURRENCY calls (default 5) run at once; the rest wait in a
 * FIFO queue and start as slots free up. Optionally caps in-flight calls per
 * user (AI_MAX_PER_USER) so one user can't starve everyone else.
 *
 * NOTE: this is an in-PROCESS limiter. On Vercel each serverless instance has
 * its own counter, so the *global* concurrency = limit × live instances. For a
 * true global cap, back this with Upstash Redis (see UPSTASH_* env) — the
 * public API here (`enqueue`) stays the same when you swap the backend.
 */

const MAX_CONCURRENCY = Math.max(
  1,
  Number(process.env.AI_MAX_CONCURRENCY ?? 5),
);
const MAX_PER_USER = Math.max(0, Number(process.env.AI_MAX_PER_USER ?? 0));

interface Waiter {
  userId?: string;
  start: () => void;
}

let active = 0;
const perUser = new Map<string, number>();
const waiters: Waiter[] = [];

function canRun(userId?: string): boolean {
  if (active >= MAX_CONCURRENCY) return false;
  if (MAX_PER_USER > 0 && userId) {
    if ((perUser.get(userId) ?? 0) >= MAX_PER_USER) return false;
  }
  return true;
}

function acquire(userId?: string): void {
  active++;
  if (userId) perUser.set(userId, (perUser.get(userId) ?? 0) + 1);
}

function release(userId?: string): void {
  active = Math.max(0, active - 1);
  if (userId) {
    const n = (perUser.get(userId) ?? 1) - 1;
    if (n <= 0) perUser.delete(userId);
    else perUser.set(userId, n);
  }
  // Wake the first waiter that is now allowed to run.
  const idx = waiters.findIndex((w) => canRun(w.userId));
  if (idx !== -1) {
    const [w] = waiters.splice(idx, 1);
    w.start();
  }
}

/** Current queue snapshot — surfaced to the admin API-health panel + UI. */
export function queueStats() {
  return { active, queued: waiters.length, maxConcurrency: MAX_CONCURRENCY };
}

/**
 * Run `fn` once a concurrency slot is free. Pass `userId` to apply the
 * per-user fairness cap and report queue position to the caller.
 */
export function enqueue<T>(
  fn: () => Promise<T>,
  userId?: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      acquire(userId);
      fn().then(resolve, reject).finally(() => release(userId));
    };
    if (canRun(userId)) run();
    else waiters.push({ userId, start: run });
  });
}
