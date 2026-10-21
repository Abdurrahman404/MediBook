-- ==========================================================
-- Migration 001: Initial Schema
-- MediBook — Healthcare Appointment Management System
-- Run this in Supabase SQL Editor FIRST
-- ==========================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
create type public.user_role as enum ('patient', 'doctor', 'admin');
create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

-- ==========================================================
-- TABLES
-- ==========================================================

create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  full_name   text not null,
  role        public.user_role not null default 'patient',
  phone       text,
  created_at  timestamptz not null default now()
);

create table public.doctors (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid references public.profiles(id) on delete set null unique,
  name             text not null,
  specialty        text not null,
  bio              text,
  consultation_fee numeric(10, 2) default 50.00,
  created_at       timestamptz not null default now()
);

create table public.availability_slots (
  id         uuid primary key default gen_random_uuid(),
  doctor_id  uuid references public.doctors(id) on delete cascade not null,
  start_time timestamptz not null,
  end_time   timestamptz not null,
  is_booked  boolean not null default false,
  created_at timestamptz not null default now(),
  constraint slot_time_check check (end_time > start_time)
);

create index idx_slots_doctor_time
  on public.availability_slots (doctor_id, start_time);
create unique index idx_unique_doctor_slot
  on public.availability_slots (doctor_id, start_time);

create table public.appointments (
  id               uuid primary key default gen_random_uuid(),
  slot_id          uuid references public.availability_slots(id) on delete restrict,
  patient_id       uuid references public.profiles(id) on delete cascade not null,
  doctor_id        uuid references public.doctors(id) on delete cascade not null,
  start_time       timestamptz not null,
  end_time         timestamptz not null,
  reason_for_visit text not null,
  patient_phone    text,
  status           public.appointment_status not null default 'scheduled',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Hard safety: a doctor cannot have two non-cancelled bookings at the same time
create unique index idx_doctor_active_booking
  on public.appointments (doctor_id, start_time)
  where (status != 'cancelled');

create unique index idx_slot_active_booking
  on public.appointments (slot_id)
  where (status != 'cancelled');

create index idx_appointments_patient on public.appointments(patient_id);
create index idx_appointments_doctor  on public.appointments(doctor_id);
create index idx_appointments_status  on public.appointments(status);

-- ==========================================================
-- AUTO-PROFILE TRIGGER
-- ==========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Patient'),
    'patient'::public.user_role,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================

alter table public.profiles           enable row level security;
alter table public.doctors            enable row level security;
alter table public.availability_slots enable row level security;
alter table public.appointments       enable row level security;

-- Helper: is the current caller an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles
create policy "Own profile select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy "Own profile update" on public.profiles for update
  using (auth.uid() = id);

-- Profile roles are managed through the privileged SQL editor, not the browser.
revoke insert, update, delete on public.profiles from public, anon, authenticated;
revoke update (id, email, full_name, role, phone, created_at)
  on public.profiles from public, anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Doctors (publicly readable)
create policy "Doctors select — public"   on public.doctors for select using (true);
create policy "Doctors all   — admin"     on public.doctors for all    using (public.is_admin());

-- Slots (future slots readable by all auth users)
create policy "Slots select — auth users" on public.availability_slots for select
  using (start_time > now() or public.is_admin());
create policy "Slots all — admin"         on public.availability_slots for all
  using (public.is_admin());

-- Appointments
create policy "Appointments — patient own" on public.appointments for select
  using (auth.uid() = patient_id or public.is_admin());
create policy "Appointments — admin all"   on public.appointments for all
  using (public.is_admin());

-- All appointment writes must use the locking RPC functions.
revoke insert, update, delete on public.appointments from public, anon, authenticated;
