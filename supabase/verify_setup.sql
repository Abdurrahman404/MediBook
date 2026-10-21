-- Read-only. These checks show setup presence, not a complete security audit.
select 'RLS: ' || tablename as check_name, rowsecurity::text as result
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'doctors', 'availability_slots', 'appointments')
union all
select 'Signup trigger', exists (
  select 1 from pg_trigger
  where tgrelid = 'auth.users'::regclass and tgname = 'on_auth_user_created'
    and not tgisinternal and tgenabled <> 'D'
)::text
union all
select 'Booking function', (to_regprocedure('public.book_appointment(uuid,text,text)') is not null)::text
union all
select 'Cancellation function', (to_regprocedure('public.cancel_appointment(uuid)') is not null)::text
union all
select 'Admin status function', (to_regprocedure('public.admin_update_appointment_status(uuid,public.appointment_status)') is not null)::text
union all
select 'Doctor count', count(*)::text from public.doctors
union all
select 'Slot count', count(*)::text from public.availability_slots;
