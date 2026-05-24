-- ============================================================================
-- FitCoach — Supabase setup
-- Run AFTER `pnpm db:push` (or drizzle migrations) has created the tables.
-- This script:
--   1) Mirrors auth.users into public.users via a trigger
--   2) Creates a private storage bucket for physique photos
--   3) Enables RLS on every app table and adds owner-only policies
-- ============================================================================

-- ---------- 1. Mirror auth.users -> public.users -----------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(excluded.name, public.users.name),
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
        updated_at = now();

  insert into public.user_settings (user_id) values (new.id)
    on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, tier, status)
  values (new.id, 'free', 'active')
    on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- 2. Private bucket for progress photos ----------------------------
insert into storage.buckets (id, name, public)
values ('physique-photos', 'physique-photos', false)
on conflict (id) do nothing;

-- Only the owner can read/write their own folder (path prefix = user uuid).
drop policy if exists "photos_owner_select" on storage.objects;
create policy "photos_owner_select" on storage.objects for select
  using (bucket_id = 'physique-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "photos_owner_insert" on storage.objects;
create policy "photos_owner_insert" on storage.objects for insert
  with check (bucket_id = 'physique-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "photos_owner_delete" on storage.objects;
create policy "photos_owner_delete" on storage.objects for delete
  using (bucket_id = 'physique-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- 3. Row-level security on every app table ------------------------
-- Helper: enable RLS + add "owner-only" policy on a table that has a user_id col.
do $$
declare
  t text;
  tables text[] := array[
    'users','user_profiles','body_measurements','progress_photos',
    'body_analysis_reports','workout_plans','workout_logs',
    'diet_plans','food_logs','weekly_checkins','ai_chat_messages',
    'subscriptions','user_settings'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_owner_all" on public.%I', t, t);

    if t = 'users' then
      execute format(
        'create policy "%s_owner_all" on public.%I
         for all using (auth.uid() = id) with check (auth.uid() = id)', t, t);
    else
      execute format(
        'create policy "%s_owner_all" on public.%I
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    end if;
  end loop;
end $$;

-- workout_days, exercises, meal_items don't have user_id directly — gate via parent.
alter table public.workout_days enable row level security;
drop policy if exists "workout_days_owner_all" on public.workout_days;
create policy "workout_days_owner_all" on public.workout_days for all
  using (exists (
    select 1 from public.workout_plans p
    where p.id = workout_days.plan_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_plans p
    where p.id = workout_days.plan_id and p.user_id = auth.uid()
  ));

alter table public.exercises enable row level security;
drop policy if exists "exercises_owner_all" on public.exercises;
create policy "exercises_owner_all" on public.exercises for all
  using (exists (
    select 1 from public.workout_days d
    join public.workout_plans p on p.id = d.plan_id
    where d.id = exercises.day_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_days d
    join public.workout_plans p on p.id = d.plan_id
    where d.id = exercises.day_id and p.user_id = auth.uid()
  ));

alter table public.meal_items enable row level security;
drop policy if exists "meal_items_owner_all" on public.meal_items;
create policy "meal_items_owner_all" on public.meal_items for all
  using (exists (
    select 1 from public.diet_plans p
    where p.id = meal_items.plan_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.diet_plans p
    where p.id = meal_items.plan_id and p.user_id = auth.uid()
  ));
