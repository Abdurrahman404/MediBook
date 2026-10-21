-- Apply to an EXISTING MediBook schema; no tables, types, or rows are deleted.
-- complete_setup.sql includes this file, the RPC functions, and seed data.

create or replace function public.is_admin()
returns boolean
language sql security definer stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Signup metadata is supplied by the user and must never assign privileges.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
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

-- These privilege changes also protect projects using older policy names.
revoke insert, update, delete on public.profiles from public, anon, authenticated;
revoke update (id, email, full_name, role, phone, created_at)
  on public.profiles from public, anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

revoke insert, update, delete on public.appointments from public, anon, authenticated;
revoke insert (id, slot_id, patient_id, doctor_id, start_time, end_time,
  reason_for_visit, patient_phone, status, created_at, updated_at)
  on public.appointments from public, anon, authenticated;
revoke update (id, slot_id, patient_id, doctor_id, start_time, end_time,
  reason_for_visit, patient_phone, status, created_at, updated_at)
  on public.appointments from public, anon, authenticated;

-- Keep cancelled appointment history while permitting a new booking of its slot.
alter table public.appointments
  drop constraint if exists appointments_slot_id_key;
create unique index if not exists idx_slot_active_booking
  on public.appointments (slot_id) where (status != 'cancelled');
create unique index if not exists idx_doctor_active_booking
  on public.appointments (doctor_id, start_time) where (status != 'cancelled');

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.availability_slots enable row level security;
alter table public.appointments enable row level security;
