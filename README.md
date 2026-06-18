# AesthetixAI

> Your AI personal trainer, diet coach, and progress tracker — in one app.

A mobile-first AI fitness web app. Users upload physique photos, get an AI body analysis, unlock a personalized workout and diet plan, and check in weekly so the AI can adapt the plan.

**Stack:** Next.js 14 (App Router) · Tailwind + shadcn-style UI · Firebase (Auth + Firestore + Storage) · Anthropic Claude · Cloudinary (exercise demos) · Resend (email) · Framer Motion · Recharts · Zod · React Hook Form · Vercel-ready.

> **Note:** The backend was migrated from Supabase/Postgres/Drizzle to Firebase (Firestore + Storage + Admin SDK). Some setup sections below still reference the old Supabase flow and are being updated.

---

## What's in the box

The **core product loop** is built end-to-end:

```
sign in → onboarding → upload physique → AI body analysis →
unlock mystery button → AI-generated workout + diet plan →
dashboard → weekly check-in → AI updates the plan
```

All 12 pages from the spec exist; the loop above is wired for real AI calls against your Anthropic key.

### Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing — hero, features, pricing, FAQ |
| `/login` | Google OAuth via Supabase |
| `/onboarding` | Multi-step profile capture |
| `/photos` | Front / side / back upload |
| `/analysis` | AI body analysis + visual scores + Mystery Unlock |
| `/generate` | Plan generation loader |
| `/dashboard` | Today's workout, macros, weight trend, AI nudge |
| `/workout` | Weekly split, exercises, sets/reps/RPE, form cues |
| `/diet` | Calories/macros, meals, grocery list, swaps |
| `/progress` | Weekly photo upload + check-in + AI comparison |
| `/coach` | AI chat with the user's profile + plan as context |
| `/settings` | Profile, prefs, subscription, sign-out, delete |
| `/privacy`, `/terms` | Legal stubs |

### AI module (`src/lib/ai`)

Every AI call is structured-output via Anthropic tool use, validated with Zod:

- `generateBodyAnalysis(profile, photos)` — vision analysis from 3 photos.
- `generateWorkoutPlan(profile, analysis)` — full weekly split.
- `generateDietPlan(profile, calorieTargets)` — meals + grocery list.
- `generateWeeklyUpdate(prev, curr, photos)` — week-over-week comparison.
- `answerCoachChat(profile, history, question)` — conversational coach.

Edit the prompts in `src/lib/ai/*.ts` to tune voice and rules.

### Deterministic math (`src/lib/calc`)

BMI, BMR (Mifflin–St Jeor), TDEE, target calories, macros, water — all computed in code (not by the AI), then passed to the model so it doesn't hallucinate numbers.

### Database (`src/lib/db/schema.ts`)

16 Drizzle tables matching the spec: `users`, `user_profiles`, `body_measurements`, `progress_photos`, `body_analysis_reports`, `workout_plans`, `workout_days`, `exercises`, `workout_logs`, `diet_plans`, `meal_items`, `food_logs`, `weekly_checkins`, `ai_chat_messages`, `subscriptions`, `user_settings`. All gated by Supabase row-level security (see `supabase/setup.sql`).

---

## Setup (10 minutes)

### 1. Install

```bash
cd fitcoach
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com> → create a project.
2. **Project Settings → API**: copy `URL`, `anon key`, `service_role key`.
3. **Project Settings → Database → Connection string** (URI tab, "Session" pooler): copy the `postgresql://...` URL.
4. **Authentication → Providers → Google**: enable it. Add a Google OAuth client (see the Supabase docs — 2 minutes).
5. **Authentication → URL configuration**: add `http://localhost:3000/auth/callback` and your production URL to the allow-list.

### 3. Get an Anthropic API key

<https://console.anthropic.com> → API Keys → Create.

### 4. Configure env

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, ANTHROPIC_API_KEY.
```

### 5. Push the schema + RLS

```bash
npm run db:push
```

Then open the Supabase SQL editor and paste/run `supabase/setup.sql`. This:
- Creates the trigger that mirrors `auth.users` into `public.users`.
- Creates the private `physique-photos` storage bucket.
- Enables RLS on all tables with owner-only policies.

### 6. Run it

```bash
npm run dev
```

Visit <http://localhost:3000>.

---

## Deploying to Vercel

1. Push to GitHub.
2. Import into Vercel.
3. Set the same env vars (everything in `.env.example` except `NEXT_PUBLIC_APP_URL`, which should be your Vercel URL).
4. Add the production callback to Supabase Auth URL allow-list: `https://your-app.vercel.app/auth/callback`.
5. Ship.

The build runs `next build` — no extra steps.

---

## How the AI integration works

If `ANTHROPIC_API_KEY` is missing the app still runs — you can navigate, log in, complete onboarding, upload photos. Any page that needs the AI returns a clear "API key not configured" error so you know exactly where to plug in.

All AI calls are structured via Anthropic **tool use** with a single forced tool whose `input_schema` is generated from a Zod schema. The model's output is validated against that schema before it touches the database — no JSON parsing surprises.

Photo data flows like this:

1. Client uploads files to Supabase Storage (private bucket, RLS-scoped to the user's UUID folder).
2. `POST /api/analysis` runs server-side, reads the photo bytes via the service-role client, base64-encodes them, and sends them to Claude as image content blocks.
3. The structured body analysis is parsed, validated, and saved to `body_analysis_reports`.
4. The user clicks the Unlock button → `POST /api/plan` runs `generateWorkoutPlan` and `generateDietPlan` in parallel and persists both.

---

## Subscription scaffolding (not active yet)

The `subscriptions` table, free/pro/lifetime enum, and Stripe env vars are in place. Stripe webhooks aren't wired in the MVP — wire them when you're ready by adding `src/app/api/stripe/webhook/route.ts` and a checkout-session action. Until then, every user is `free` and all features work.

---

## What's intentionally minimal in this MVP

- **No Stripe integration yet** — schema & env vars ready, write the webhook when you're ready to charge.
- **No admin dashboard** — schema supports it (count users, count check-ins) but the page isn't built.
- **No exercise demo CDN** — the AI returns YouTube URLs where it knows good ones. You can replace these with a curated library later.
- **No food image recognition** — meal logging is text-only.

These are not blocking the core loop.

---

## Project layout

```
src/
  app/
    (auth)/login            Google sign-in
    (auth)/callback         OAuth code exchange
    (flow)/onboarding       Multi-step profile
    (flow)/photos           Photo upload
    (flow)/analysis         AI body analysis + Mystery button
    (flow)/generate         Plan generation loader
    (app)/dashboard         Today's plan, weight chart
    (app)/workout           Weekly split + exercise detail
    (app)/diet              Meals + grocery list
    (app)/progress          Weekly check-in flow
    (app)/coach             AI chat
    (app)/settings          Profile, sub, danger zone
    (legal)/{privacy,terms}
    actions/                Server actions (typed)
    api/                    API routes (AI calls)
  components/
    ui/                     Button, Card, Input, Badge, Progress, ScoreRing, StatCard, Disclaimer, ...
    nav/                    Sidebar (desktop) + bottom nav (mobile)
    onboarding/             Form steps + photo uploader
    analysis/               AnalysisView, Runner, Mystery unlock button, Plan-gen loader
    progress/               Check-in form + AI update view
    coach/                  Chat UI
    dashboard/              Weight chart (recharts)
    settings/               Settings form
  lib/
    ai/                     Prompts, schemas, Claude client (structured-output)
    calc/                   BMI / BMR / TDEE / macros / water
    db/                     Drizzle schema + Postgres client
    supabase/               Browser/server/service/middleware clients
    data/                   Server-side aggregate loaders
    utils.ts                cn(), formatNumber(), initials()
supabase/setup.sql          Triggers, storage bucket, RLS policies
```

---

## License

Use this however you like for your own product. No warranty.
