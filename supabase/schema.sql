-- ============================================================
-- GuestVue Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────
-- Auto-created when a user signs up (via trigger on auth.users)
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  email           text,
  plan_type       text not null default 'free',
  referral_code   text unique,
  referred_by     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── events ───────────────────────────────────────────────────
create table if not exists public.events (
  id                uuid primary key default uuid_generate_v4(),
  host_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  event_date        date,
  hashtag           text,
  plan              text not null default 'free',
  status            text not null default 'active', -- active | paused | expired
  qr_url            text,
  gallery_url       text,
  upload_count      integer not null default 0,
  upload_limit      integer not null default 50,
  page_expires_at   timestamptz,
  storage_expires_at timestamptz,
  custom_color      text,
  custom_logo       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Hosts can manage own events"
  on public.events for all
  using (auth.uid() = host_id);

create policy "Anyone can view active events"
  on public.events for select
  using (status = 'active');


-- ── uploads ──────────────────────────────────────────────────
create table if not exists public.uploads (
  id               uuid primary key default uuid_generate_v4(),
  event_id         uuid not null references public.events(id) on delete cascade,
  original_url     text not null,
  display_url      text,
  type             text not null, -- photo | video
  size_bytes       bigint,
  duration_secs    numeric,
  status           text not null default 'processing', -- processing | ready | failed
  moderation_ok    boolean,
  guest_ip_hash    text,
  flagged_for_reel boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table public.uploads enable row level security;

create policy "Event hosts can view uploads"
  on public.uploads for select
  using (
    exists (
      select 1 from public.events
      where events.id = uploads.event_id
      and events.host_id = auth.uid()
    )
  );

create policy "Anyone can insert uploads"
  on public.uploads for insert
  with check (true);


-- ── reels ────────────────────────────────────────────────────
create table if not exists public.reels (
  id           uuid primary key default uuid_generate_v4(),
  event_id     uuid not null references public.events(id) on delete cascade,
  url          text,
  status       text not null default 'pending', -- pending | processing | ready | failed
  created_at   timestamptz not null default now()
);

alter table public.reels enable row level security;

create policy "Event hosts can manage reels"
  on public.reels for all
  using (
    exists (
      select 1 from public.events
      where events.id = reels.event_id
      and events.host_id = auth.uid()
    )
  );


-- ── affiliates ───────────────────────────────────────────────
create table if not exists public.affiliates (
  id               uuid primary key references public.profiles(id) on delete cascade,
  type             text not null default 'standard',
  referral_code    text unique not null,
  commission_rate  numeric not null default 0.10,
  total_referrals  integer not null default 0,
  total_earned     integer not null default 0, -- in kobo
  total_paid       integer not null default 0, -- in kobo
  created_at       timestamptz not null default now()
);

alter table public.affiliates enable row level security;

create policy "Affiliates can view own record"
  on public.affiliates for select
  using (auth.uid() = id);


-- ── referrals ────────────────────────────────────────────────
create table if not exists public.referrals (
  id                uuid primary key default uuid_generate_v4(),
  affiliate_id      uuid not null references public.affiliates(id) on delete cascade,
  referred_user_id  uuid references public.profiles(id) on delete set null,
  event_id          uuid references public.events(id) on delete set null,
  subscription_id   uuid,
  amount_kobo       integer not null default 0,
  commission_kobo   integer not null default 0,
  status            text not null default 'pending', -- pending | confirmed | paid
  created_at        timestamptz not null default now()
);

alter table public.referrals enable row level security;

create policy "Affiliates can view own referrals"
  on public.referrals for select
  using (
    exists (
      select 1 from public.affiliates
      where affiliates.id = referrals.affiliate_id
      and affiliates.id = auth.uid()
    )
  );


-- ── payments ─────────────────────────────────────────────────
create table if not exists public.payments (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references public.profiles(id) on delete set null,
  paystack_ref   text unique,
  amount_kobo    integer not null,
  plan           text,
  type           text not null default 'one_time', -- one_time | subscription
  status         text not null default 'pending',  -- pending | success | failed
  metadata       jsonb,
  created_at     timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);


-- ── subscriptions ─────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references public.profiles(id) on delete set null,
  plan                  text not null,
  status                text not null default 'active', -- active | cancelled | paused
  paystack_sub_id       text unique,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  created_at            timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);


-- ── RPC: increment_upload_count ───────────────────────────────
create or replace function public.increment_upload_count(event_id_input uuid)
returns void language plpgsql security definer as $$
begin
  update public.events
  set upload_count = upload_count + 1,
      updated_at   = now()
  where id = event_id_input;
end;
$$;


-- ── RPC: increment_affiliate_earnings ─────────────────────────
create or replace function public.increment_affiliate_earnings(
  affiliate_id_input uuid,
  commission_input   integer
)
returns void language plpgsql security definer as $$
begin
  update public.affiliates
  set total_earned    = total_earned + commission_input,
      total_referrals = total_referrals + 1
  where id = affiliate_id_input;
end;
$$;


-- ── Indexes for performance ────────────────────────────────────
create index if not exists idx_events_host_id     on public.events(host_id);
create index if not exists idx_events_status      on public.events(status);
create index if not exists idx_uploads_event_id   on public.uploads(event_id);
create index if not exists idx_uploads_status     on public.uploads(status);
create index if not exists idx_referrals_affiliate on public.referrals(affiliate_id);
create index if not exists idx_payments_user_id   on public.payments(user_id);
create index if not exists idx_payments_ref       on public.payments(paystack_ref);
