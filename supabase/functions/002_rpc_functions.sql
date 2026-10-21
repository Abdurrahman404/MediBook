-- Run after the schema. complete_setup.sql includes these functions.
-- Every mutation locks the slot BEFORE the appointment to serialize writers.

create or replace function public.book_appointment(
  p_slot_id uuid,
  p_reason text,
  p_phone text default null
)
returns public.appointments
language plpgsql security definer
set search_path = ''
as $$
declare
  v_patient_id uuid := auth.uid();
  v_slot public.availability_slots;
  v_appt public.appointments;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[[:space:]()-]', '', 'g');
begin
  if v_patient_id is null then
    raise exception 'Unauthorized: You must be logged in to book an appointment.';
  end if;
  if p_reason is null or char_length(trim(p_reason)) not between 10 and 500 then
    raise exception 'Reason for visit must contain between 10 and 500 characters.';
  end if;
  if left(v_phone, 3) = '+94' then
    v_phone := '0' || substring(v_phone from 4);
  elsif left(v_phone, 4) = '0094' then
    v_phone := '0' || substring(v_phone from 5);
  elsif left(v_phone, 2) = '94' then
    v_phone := '0' || substring(v_phone from 3);
  end if;
  if v_phone != '' and v_phone !~ '^07[0-9]{8}$' then
    raise exception 'Enter a Sri Lankan mobile number, such as 0771234567 or +94771234567.';
  end if;

  select * into v_slot from public.availability_slots
  where id = p_slot_id for update;
  if not found then
    raise exception 'The selected slot does not exist.';
  end if;
  if v_slot.is_booked or exists (
    select 1 from public.appointments
    where slot_id = p_slot_id and status != 'cancelled'
  ) then
    raise exception 'This appointment slot has already been booked by another patient.';
  end if;
  if v_slot.start_time <= now() then
    raise exception 'Cannot book a slot that is in the past.';
  end if;

  update public.availability_slots set is_booked = true where id = p_slot_id;
  insert into public.appointments (
    slot_id, patient_id, doctor_id, start_time, end_time,
    reason_for_visit, patient_phone, status
  ) values (
    p_slot_id, v_patient_id, v_slot.doctor_id, v_slot.start_time, v_slot.end_time,
    trim(p_reason), nullif(v_phone, ''), 'scheduled'
  ) returning * into v_appt;
  return v_appt;
end;
$$;

create or replace function public.cancel_appointment(p_appointment_id uuid)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_appt public.appointments;
begin
  if v_user_id is null then raise exception 'Unauthorized.'; end if;

  select * into v_appt from public.appointments where id = p_appointment_id;
  if not found then raise exception 'Appointment not found.'; end if;
  if v_appt.patient_id != v_user_id and not public.is_admin() then
    raise exception 'Permission denied: You cannot cancel another patient''s appointment.';
  end if;

  perform 1 from public.availability_slots where id = v_appt.slot_id for update;
  select * into v_appt from public.appointments
  where id = p_appointment_id for update;
  if not found or v_appt.status != 'scheduled' then
    raise exception 'Appointment not found or is not in "scheduled" status.';
  end if;
  if v_appt.patient_id != v_user_id and not public.is_admin() then
    raise exception 'Permission denied: You cannot cancel another patient''s appointment.';
  end if;

  update public.appointments set status = 'cancelled', updated_at = now()
  where id = p_appointment_id;
  update public.availability_slots set is_booked = exists (
    select 1 from public.appointments
    where slot_id = v_appt.slot_id and status != 'cancelled'
  ) where id = v_appt.slot_id;
  return true;
end;
$$;

create or replace function public.admin_update_appointment_status(
  p_appointment_id uuid,
  p_status public.appointment_status
)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_appt public.appointments;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Permission denied: Admin privileges required.';
  end if;
  if p_status is null then raise exception 'Appointment status is required.'; end if;

  select * into v_appt from public.appointments where id = p_appointment_id;
  if not found then raise exception 'Appointment not found.'; end if;
  perform 1 from public.availability_slots where id = v_appt.slot_id for update;
  select * into v_appt from public.appointments
  where id = p_appointment_id for update;
  if not found then raise exception 'Appointment not found.'; end if;

  -- Repeating a completed operation is harmless; terminal records cannot reopen.
  if v_appt.status = p_status then return true; end if;
  if v_appt.status != 'scheduled' then
    raise exception 'Only scheduled appointments can change status.';
  end if;

  update public.appointments set status = p_status, updated_at = now()
  where id = p_appointment_id;
  if p_status = 'cancelled' then
    update public.availability_slots set is_booked = exists (
      select 1 from public.appointments
      where slot_id = v_appt.slot_id and status != 'cancelled'
    ) where id = v_appt.slot_id;
  end if;
  return true;
end;
$$;

-- Functions normally receive PUBLIC execution rights; restrict these entry points.
revoke all on function public.book_appointment(uuid, text, text) from public, anon;
revoke all on function public.cancel_appointment(uuid) from public, anon;
revoke all on function public.admin_update_appointment_status(uuid, public.appointment_status) from public, anon;
grant execute on function public.book_appointment(uuid, text, text) to authenticated;
grant execute on function public.cancel_appointment(uuid) to authenticated;
grant execute on function public.admin_update_appointment_status(uuid, public.appointment_status) to authenticated;
