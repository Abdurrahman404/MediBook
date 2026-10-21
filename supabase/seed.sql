-- ==========================================================
-- seed.sql — Sample doctors and 7-day slot generation
-- Run after schema and RPC setup. Repeating this seed does not duplicate samples.
-- ==========================================================

-- 1. Insert sample doctors
insert into public.doctors (name, specialty, bio, consultation_fee)
select sample.name, sample.specialty, sample.bio, sample.consultation_fee
from (values
  (
    'Dr. Sarah Jenkins, MD',
    'Cardiology',
    'Board-certified cardiologist with 12+ years of experience in cardiovascular health, hypertension management, and preventive cardiology.',
    120.00
  ),
  (
    'Dr. Marcus Chen, MD',
    'Dermatology',
    'Specialist in clinical and cosmetic dermatology, acne treatment, eczema management, and skin cancer screenings.',
    95.00
  ),
  (
    'Dr. Emily Rodriguez, MD',
    'Pediatrics & Family Medicine',
    'Dedicated to comprehensive child wellness, adolescent medicine, and preventive family care.',
    80.00
  )
) as sample(name, specialty, bio, consultation_fee)
where not exists (
  select 1 from public.doctors existing
  where existing.name = sample.name and existing.specialty = sample.specialty
);

-- 2. Generate eight 30-minute slots per day for seven days, starting tomorrow.
-- Explicit timezone conversion makes the seed independent of the SQL session zone.
do $$
declare
  d       record;
  day_off int;
  h       int;
  slot_start timestamptz;
begin
  for d in (
    select id from public.doctors
    where (name, specialty) in (
      ('Dr. Sarah Jenkins, MD', 'Cardiology'),
      ('Dr. Marcus Chen, MD', 'Dermatology'),
      ('Dr. Emily Rodriguez, MD', 'Pediatrics & Family Medicine')
    )
  ) loop
    for day_off in 1..7 loop
      for h in 0..7 loop
        slot_start := (
          (now() at time zone 'Asia/Kolkata')::date + day_off
          + time '09:00' + h * interval '30 minutes'
        ) at time zone 'Asia/Kolkata';
        insert into public.availability_slots (doctor_id, start_time, end_time, is_booked)
        values (d.id, slot_start, slot_start + interval '30 minutes', false)
        on conflict (doctor_id, start_time) do nothing;
      end loop;
    end loop;
  end loop;
end;
$$;
