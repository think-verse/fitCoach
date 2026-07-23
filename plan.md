# AesthetixAI — Rebuild & Migration Plan

> Goal: take the current Supabase-backed MVP and turn it into a **sellable,
> mobile-first product** with a **Firebase backend**, an **admin panel**, a
> **configurable PayPal-powered pricing page**, a **redesigned public site**,
> and a **concurrency-limited AI queue**. Deployed on **Vercel** (frontend +
> API routes), with **Firebase** as the backend (Auth + Firestore + Storage).

---

## 0. Guiding principles (read first)

1. **Firebase Storage holds files; Firestore holds references only.**
   Images / generated media are uploaded to **Firebase Storage (bucket)**, and
   Firestore stores **only the storage path / download URL**, never the bytes.
   This keeps documents small (1 MB doc cap) and prevents the "broken flow" of
   stuffing binary data into the database. (This is already the pattern today —
   `progress_photos.storagePath` — we preserve it.)
2. **All data access goes through a thin repository layer** (`src/lib/repo/*`),
   never raw Firebase SDK calls scattered in components. Makes a future
   Firebase→Supabase move ~2× cheaper.
3. **The DB does not enforce integrity — our code does.** Cascade-deletes,
   enum validation, and "foreign keys" (reference IDs) are handled in code /
   Cloud Functions / Security Rules.
4. **Hybrid AI model stays.** Sonnet 4.6 for vision, Haiku 4.5 for text —
   overridable via env. (Confirmed in `src/lib/ai/client.ts`.)
5. **Keys are never committed.** Everything secret lives in `.env.local`
   (gitignored). `.env.example` documents the shape only.

---

## Phase 1 — Backend migration: Supabase → Firebase

### 1.1 Remove Supabase entirely
- Delete `src/lib/supabase/*` (client, server, middleware).
- Delete `src/lib/db/*` (Drizzle schema + Postgres client).
- Remove deps: `@supabase/ssr`, `@supabase/supabase-js`, `drizzle-orm`,
  `drizzle-kit`, `postgres`. Remove `db:*` scripts + `drizzle.config.ts`.
- Delete `supabase/setup.sql`.

### 1.2 Add Firebase
- Add deps: `firebase` (client SDK) + `firebase-admin` (server SDK).
- `src/lib/firebase/client.ts` — browser app init (public config).
- `src/lib/firebase/admin.ts` — Admin SDK init (service account, server only).
- `src/lib/firebase/auth.ts` — Google OAuth + **email magic link**
  (`sendSignInLinkToEmail` / `signInWithEmailLink`) to replace Supabase auth.
- Rewrite `middleware.ts` for Firebase session cookies (keep `/api/webhooks`
  bypass already in place).

### 1.3 Firestore data model (re-map the 16 tables)
Top-level + per-user subcollections (reference-by-ID where needed):
```
users/{uid}                       profile fields + tier
  measurements/{id}
  progressPhotos/{id}             { angle, storagePath, weekNumber }  ← Storage ref only
  analyses/{id}
  checkins/{id}
  chatMessages/{id}
  workoutPlans/{planId}/days/{dayId}/exercises/{exId}
  workoutLogs/{id}
  dietPlans/{planId}/meals/{mealId}
  foodLogs/{id}
  subscription                    (single doc)
  settings                        (single doc)
config/pricing                    ← admin-configurable pricing (see Phase 4)
admin/{uid}                       ← who is allowed into the admin panel
```
- **Cascade-delete:** Cloud Function (or recursive client delete) on account
  deletion — tears down all subcollections + Storage files. (We already had an
  orphaned-photo bug once; handle this deliberately.)
- **Enums** (goal/gender/food_pref/tier/…) validated in code + Security Rules.

### 1.4 Storage
- Firebase Storage bucket, per-user folder `users/{uid}/photos/...`.
- Server reads bytes via Admin SDK → base64 → Claude (same flow as today,
  different SDK). **Compress/resize on upload** (Claude image limit ≈ 5 MB;
  base64 inflates ~33%).

### 1.5 Security Rules (replace RLS)
- Firestore rules: a user can read/write only their own `users/{uid}/**`.
- Storage rules: a user can read/write only their own folder.
- Admin rules: `admin/{uid}` membership grants read access to all user data.

### 1.6 Rewrite touch-points (Supabase → Firebase repo calls)
- `src/lib/data/user-state.ts`, all `src/app/actions/*`, all `src/app/api/*`,
  `src/app/auth/callback`, the systeme.io webhook (swap user create/lookup +
  subscription upsert to Firestore).
- **AI layer (`src/lib/ai/*`) is backend-agnostic — left untouched.**

---

## Phase 2 — AI call queue (concurrency limit = 5)

**Requirement:** at most **5 AI calls run at once**; the 6th, 7th… wait in a
queue and start as slots free up. Protects against rate limits + cost spikes
when many users hit generation simultaneously.

- `src/lib/ai/queue.ts` — a concurrency-limited dispatcher (semaphore, limit
  configurable via `AI_MAX_CONCURRENCY=5`). All calls in `src/lib/ai/*` route
  through it.
- Per-user fairness: optional cap (e.g. 1–2 in-flight per user) so one user
  can't starve the queue.
- Surface queue state to the UI ("You're #3 in line…") for generation screens.
- **Note:** Vercel serverless functions are stateless per-invocation, so an
  in-process queue only limits concurrency *within one instance*. For a true
  global limit across instances, back the queue with **Firestore or Upstash
  Redis** (recommended for production). Document both; ship in-process first,
  upgrade to Redis-backed if traffic warrants.

---

## Phase 3 — Admin panel (`/admin`, gated)

Access gated by `admin/{uid}` membership (checked server-side + in Rules).

**Sections:**
1. **Users** — table of all users: name/email, tier (free/paid), signup date,
   last active. Filter by free vs paid. Paginated (Firestore per-read cost).
2. **Usage / generation stats** — per user + aggregate: # analyses, # plans,
   # generations, # check-ins, storage used. (Heavy aggregation → see note.)
3. **API health** — live status of each external dependency:
   - Anthropic (Claude), and for the YouTube-type product: Gemini, revid.
   - Shows: reachable? last call latency, success/error rate, queue depth,
     today's call count. Backed by a lightweight `apiHealth` log written on
     each call + a `/api/admin/health` probe endpoint.
   - *"API health" = a dashboard answering "are my external APIs up, fast, and
     within quota right now?"* — so you spot an outage/rate-limit before users
     complain.
4. **Pricing config** — edit tiers, prices, features, PayPal plan IDs; writes
   to `config/pricing` (drives the public pricing page — Phase 4).
5. **Payments** — list PayPal transactions, paid users, basic revenue rollup.

> **Heavy reporting note:** Firestore can't do joins / GROUP BY. For rich admin
> analytics (revenue over time, cohort stats) wire the **Firestore → BigQuery
> export extension** and run SQL there. Start with simple Firestore queries;
> add BigQuery when reporting gets rich.

---

## Phase 4 — Public site, navbar, pricing page (PayPal)

1. **Home page** — redesigned, conversion-focused landing: hero, how-it-works,
   features, social proof, FAQ, CTA. Good visual design, mobile-first.
2. **Navbar** — shared top nav (logo, links, sign-in / dashboard CTA),
   responsive (hamburger on mobile).
3. **Pricing page** — reads tiers/prices **from `config/pricing`** (admin-
   editable, Phase 3), so you change pricing without a deploy.
   - **PayPal SDK** checkout (Smart Buttons / Subscriptions). Keys added later
     to env (see Phase 6). On success → PayPal webhook → set user tier in
     Firestore (idempotent, dedupe by transaction ID — same pattern as the
     existing systeme.io webhook).
   - Replaces the Stripe scaffolding + systeme.io flow.

---

## Phase 5 — Mobile-first UX pass + product polish

- Audit every page for mobile: tap targets, bottom-nav, image upload UX,
  forms, charts (Recharts responsive), safe-area insets.
- PWA basics (installable, splash, offline shell) so it feels app-like.
- Loading / empty / error states on every async screen (esp. generation).
- Keep the existing bottom-nav (mobile) + sidebar (desktop) pattern.

---

## Phase 6 — Environment variables (`.env.example` rewrite)

Replace Supabase/Stripe blocks with Firebase + PayPal. You create the Firebase
project + keys; I wire them in. Target shape:

```bash
# --- Firebase (client / public) ---
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# --- Firebase Admin (server only — service account) ---
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# --- AI: Anthropic (hybrid tiers — kept) ---
ANTHROPIC_API_KEY=
ANTHROPIC_VISION_MODEL=claude-sonnet-4-6
ANTHROPIC_TEXT_MODEL=claude-haiku-4-5
AI_MAX_CONCURRENCY=5

# --- (YouTube-type product, if merged in) ---
GEMINI_API_KEY=
REVID_API_KEY=

# --- PayPal ---
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_ENV=sandbox        # sandbox | live

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AesthetixAI

# --- Admin / queue / cron ---
ADMIN_EMAILS=             # comma-separated allow-list for first admin bootstrap
CRON_SECRET=
# Optional: Upstash Redis for global AI queue
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Phase 7 — Deploy

- **Vercel** for Next.js (frontend + API routes); set all env vars there.
- **Firebase** backend: Firestore, Storage, Auth, Cloud Functions (cascade
  delete + any heavy server jobs).
- Add production domains to Firebase Auth authorized domains.
- Configure PayPal + (optional) systeme.io webhooks to the deployed URLs.

---

## Suggested improvements (my recommendations — your call)

- **Email/notifications:** weekly check-in reminders (you have notify flags
  already) via Resend + a Vercel cron.
- **Referral / coupon codes** in pricing config — cheap growth lever for selling.
- **Rate-limit per user** on AI generation (free vs paid quotas) — ties into
  the queue + tiers; protects cost.
- **Analytics** (PostHog / GA) on the funnel: landing → signup → paid.
- **Free-tier gating:** decide what's free vs paid (e.g. 1 analysis free, plans
  behind paywall) — needs a clear matrix before building the paywall.
- **Onboarding polish + demo data** so a new user sees value before paying.
- **Soft-delete + data export** (GDPR-friendly, builds trust for paid users).

---

## Open questions for you (need answers before/while building)

1. **Two products or one?** Is the "YouTube-type" generator (Gemini + revid)
   a *separate* project, or being merged into this AesthetixAI codebase? The env
   includes both, but scope changes a lot if it's one app.
2. **Free vs paid feature matrix** — what exactly is gated behind PayPal?
3. **Pricing tiers** — names, prices, billing period (one-time / monthly /
   yearly)? (Even placeholders to wire the PayPal flow.)
4. **Admin bootstrap** — which email(s) are the first admins?
5. **Global vs per-instance AI queue** — ship in-process first, or go straight
   to Redis-backed for a true global limit?

---

## Build order (suggested)

1. Phase 6 env scaffold + Phase 1 Firebase wiring (auth + Firestore + Storage).
2. Phase 1 data migration of code paths (repo layer) + Security Rules.
3. Phase 2 AI queue.
4. Phase 3 admin panel (users → usage → API health → pricing → payments).
5. Phase 4 home + navbar + pricing + PayPal.
6. Phase 5 mobile/UX polish.
7. Phase 7 deploy.
