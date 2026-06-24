-- TwisTop Global Sales OS — Database Schema
-- Run this in Supabase SQL Editor after project creation

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Prospects (leads) ────────────────────────────────────────────────────────
create table public.prospects (
  id            uuid primary key default uuid_generate_v4(),
  company       text not null,
  country       text not null,
  flag          text,
  contact       text not null,
  email         text not null,
  website       text,
  segment       text not null,
  axis          text not null check (axis in ('A', 'B')),
  stage         text not null default 'Cold',
  score         integer not null default 50 check (score between 0 and 100),
  notes         text,
  last_contacted date,
  source        text default 'manual' check (source in ('manual', 'ai_generated', 'import')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Outreach plans ───────────────────────────────────────────────────────────
create table public.outreach_plans (
  id            uuid primary key default uuid_generate_v4(),
  prospect_id   uuid references public.prospects(id) on delete cascade,
  steps         jsonb not null default '[]',
  status        text not null default 'draft' check (status in ('draft', 'approved', 'sent')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Outreach email events (send / open / reply / bounce) ─────────────────────
create table public.email_events (
  id            uuid primary key default uuid_generate_v4(),
  prospect_id   uuid references public.prospects(id) on delete cascade,
  plan_id       uuid references public.outreach_plans(id) on delete set null,
  step_day      integer,
  resend_id     text,
  event_type    text not null check (event_type in ('sent', 'opened', 'replied', 'bounced', 'complained')),
  subject       text,
  body_preview  text,
  reply_body    text,
  reply_intent  text check (reply_intent in ('interested', 'not_interested', 'out_of_office', 'unsubscribe', 'other')),
  created_at    timestamptz default now()
);

-- ── Content assets ───────────────────────────────────────────────────────────
create table public.content_assets (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  type          text not null check (type in ('video', 'pdf', 'image', 'gif')),
  url           text not null,
  storage_path  text,
  size_bytes    bigint,
  thumbnail_url text,
  tags          text[] default '{}',
  created_at    timestamptz default now()
);

-- ── RLS policies ─────────────────────────────────────────────────────────────
alter table public.prospects      enable row level security;
alter table public.outreach_plans enable row level security;
alter table public.email_events   enable row level security;
alter table public.content_assets enable row level security;

-- Allow authenticated users full access (Ken + Damon)
create policy "auth_full_access" on public.prospects
  for all using (auth.role() = 'authenticated');

create policy "auth_full_access" on public.outreach_plans
  for all using (auth.role() = 'authenticated');

create policy "auth_full_access" on public.email_events
  for all using (auth.role() = 'authenticated');

create policy "auth_full_access" on public.content_assets
  for all using (auth.role() = 'authenticated');

-- ── Service role bypass (for API routes + webhooks) ──────────────────────────
-- Service role key ignores RLS by default — no extra policy needed.

-- ── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger prospects_updated_at
  before update on public.prospects
  for each row execute function update_updated_at();

create trigger outreach_plans_updated_at
  before update on public.outreach_plans
  for each row execute function update_updated_at();

-- ── Storage bucket for content assets ────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('content-assets', 'content-assets', true)
on conflict do nothing;

create policy "public_read" on storage.objects
  for select using (bucket_id = 'content-assets');

create policy "auth_upload" on storage.objects
  for insert with check (bucket_id = 'content-assets' and auth.role() = 'authenticated');

create policy "auth_delete" on storage.objects
  for delete using (bucket_id = 'content-assets' and auth.role() = 'authenticated');
