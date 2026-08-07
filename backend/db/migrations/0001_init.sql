-- Session 6: initial schema for persisting user settings (which league/owner to use)
-- in place of the SLEEPER_LEAGUE_ID / SLEEPER_OWNER_ID env vars. Run this once via the
-- Supabase dashboard's SQL Editor -- nothing in this repo executes it automatically.

create extension if not exists pgcrypto;

-- One row per user. No auth this session -- exactly one row will exist, created by
-- backend/scripts/seedSettings.ts. Exists now so Supabase Auth can be bolted on later
-- (e.g. linking auth.users.id -> users.id) without a schema migration.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  created_at timestamptz not null default now()
);

-- A user's saved leagues: one user -> many leagues. "provider" and the provider_*
-- columns are deliberately generic (not "sleeper_*") so ESPN support later (see
-- ROADMAP.md's Multi-Provider Architecture section) needs no rename -- they're opaque
-- external IDs, not Supabase-generated keys.
create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null default 'sleeper' check (provider in ('sleeper', 'espn')),
  provider_league_id text not null,
  provider_owner_id text not null,
  league_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_league_id, provider_owner_id)
);

create index if not exists leagues_user_id_idx on leagues(user_id);

-- Which of a user's saved leagues is active right now -- i.e. what GET /api/myteam
-- resolves against. A separate table (rather than an is_active flag on leagues) makes
-- "one active league per user" true by construction, since the primary key is user_id.
create table if not exists user_settings (
  user_id uuid primary key references users(id) on delete cascade,
  active_league_id uuid references leagues(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security intentionally left off: the backend only ever talks to Supabase
-- via the service_role key, which bypasses RLS. Revisit when Supabase Auth is added.
