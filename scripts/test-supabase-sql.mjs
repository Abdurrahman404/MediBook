// Usage: node scripts/test-supabase-sql.mjs <path-to-pglite-module>
// Uses an isolated in-memory PostgreSQL engine; never reads .env or contacts Supabase.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { PGlite } = await import(pathToFileURL(process.argv[2]).href)
const db = new PGlite()
const root = new URL('../supabase/', import.meta.url)
let checks = 0

async function check(name, run) {
  await run()
  checks++
  console.log(`PASS ${name}`)
}

async function scalar(sql, params = []) {
  const { rows } = await db.query(sql, params)
  return Object.values(rows[0])[0]
}

async function rejects(sql, params, message) {
  await assert.rejects(db.query(sql, params), message)
}

async function asUser(id, run, role = 'authenticated') {
  await db.exec(`set role ${role}`)
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? ''])
  try { return await run() }
  finally {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub', '', false)")
  }
}

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text not null,
      raw_user_meta_data jsonb default '{}'::jsonb
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema public, auth to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    set timezone = 'Pacific/Honolulu';
  `)
  // PGlite has gen_random_uuid built in; the unused uuid-ossp extension is excluded.
  const initial = (await readFile(new URL('migrations/001_initial_schema.sql', root), 'utf8'))
    .replace('create extension if not exists "uuid-ossp";', '')
  await db.exec(initial)
  await check('fresh schema compiles and restricts role updates', async () => {
    assert.equal(await scalar("select has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')"), false)
    assert.equal(await scalar("select has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE')"), true)
  })

  // Reproduce the previous schema's unique constraint and permissive grants.
  await db.exec(`
    drop index public.idx_slot_active_booking;
    alter table public.appointments add constraint appointments_slot_id_key unique (slot_id);
    grant all on public.profiles, public.appointments to anon, authenticated;
  `)
  const bundle = await readFile(new URL('complete_setup.sql', root), 'utf8')
  await check('existing-schema setup executes and creates all RPCs', async () => {
    await db.exec(bundle)
    const { rows } = await db.query(await readFile(new URL('verify_setup.sql', root), 'utf8'))
    assert.equal(rows.length, 10)
    for (const row of rows) {
      const expected = row.check_name === 'Doctor count' ? '3' : row.check_name === 'Slot count' ? '168' : 'true'
      assert.equal(row.result, expected, row.check_name)
    }
  })
  await check('repeating setup preserves exactly 3 doctors and 168 slots', async () => {
    await db.exec(bundle)
    assert.equal(Number(await scalar('select count(*) from public.doctors')), 3)
    assert.equal(Number(await scalar('select count(*) from public.availability_slots')), 168)
  })
  await check('seed times use clinic timezone independently of session timezone', async () => {
    assert.equal(await scalar(`select bool_and(
      (start_time at time zone 'Asia/Kolkata')::time >= time '09:00'
      and (end_time at time zone 'Asia/Kolkata')::time <= time '13:00'
      and end_time - start_time = interval '30 minutes'
    ) from public.availability_slots`), true)
    assert.equal(Number(await scalar("select count(distinct (start_time at time zone 'Asia/Kolkata')::date) from public.availability_slots")), 7)
  })

  const patient = '00000000-0000-4000-8000-000000000001'
  const other = '00000000-0000-4000-8000-000000000002'
  const admin = '00000000-0000-4000-8000-000000000003'
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values
    ($1, 'patient@example.test', '{"full_name":"Patient","role":"admin"}'),
    ($2, 'other@example.test', '{"full_name":"Other","role":"doctor"}'),
    ($3, 'admin@example.test', '{"full_name":"Admin"}')`, [patient, other, admin])
  await db.query("update public.profiles set role = 'admin' where id = $1", [admin])
  await check('signup metadata cannot grant admin or doctor privileges', async () => {
    assert.equal(await scalar('select role from public.profiles where id = $1', [patient]), 'patient')
    assert.equal(await scalar('select role from public.profiles where id = $1', [other]), 'patient')
  })
  await check('patients can edit their own name but cannot change role or view other profiles', async () => {
    await asUser(patient, async () => {
      await db.query("update public.profiles set full_name = 'Updated patient' where id = $1", [patient])
      assert.equal(Number(await scalar('select count(*) from public.profiles')), 1)
      await rejects("update public.profiles set role = 'admin' where id = $1", [patient], /permission denied/)
    })
  })

  const slot = await scalar('select id from public.availability_slots order by start_time, id limit 1')
  const book = "select (public.book_appointment($1, 'Routine consultation', '+94 77 123 4567')).id"
  let first, second, third
  await check('anonymous calls and non-admin status updates are blocked', async () => {
    await asUser(null, () => rejects(book, [slot], /permission denied/), 'anon')
    await asUser(null, () => rejects(book, [slot], /Unauthorized/))
    await asUser(patient, () => rejects("select public.admin_update_appointment_status($1, 'cancelled')", [patient], /Admin privileges required/))
  })
  await check('server rejects short reasons and malformed phone numbers', async () => {
    await asUser(patient, async () => {
      await rejects("select public.book_appointment($1, 'short')", [slot], /between 10 and 500/)
      await rejects("select public.book_appointment($1, 'Routine consultation', '123')", [slot], /mobile number/)
    })
  })
  await check('booking reserves the slot and prevents double booking', async () => {
    first = await asUser(patient, () => scalar(book, [slot]))
    assert.equal(await scalar('select patient_phone from public.appointments where id = $1', [first]), '0771234567')
    assert.equal(await scalar('select is_booked from public.availability_slots where id = $1', [slot]), true)
    await asUser(other, () => rejects(book, [slot], /already been booked/))
  })
  await check('patients cannot view or cancel another patient appointment', async () => {
    await asUser(other, async () => {
      assert.equal(Number(await scalar('select count(*) from public.appointments')), 0)
      await rejects('select public.cancel_appointment($1)', [first], /Permission denied/)
    })
  })
  await check('cancellation releases the slot and rebooking keeps its history', async () => {
    await asUser(patient, () => db.query('select public.cancel_appointment($1)', [first]))
    assert.equal(await scalar('select is_booked from public.availability_slots where id = $1', [slot]), false)
    second = await asUser(other, () => scalar(book, [slot]))
    assert.equal(Number(await scalar('select count(*) from public.appointments where slot_id = $1', [slot])), 2)
  })
  await check('repeated admin cancellation of old history does not release the new booking', async () => {
    await asUser(admin, () => db.query("select public.admin_update_appointment_status($1, 'cancelled')", [first]))
    assert.equal(await scalar('select is_booked from public.availability_slots where id = $1', [slot]), true)
    await asUser(admin, () => rejects("select public.admin_update_appointment_status($1, 'scheduled')", [first], /Only scheduled/))
    await asUser(patient, () => rejects('select public.cancel_appointment($1)', [first], /scheduled/))
  })
  await check('admin cancellation releases a current booking; completed records cannot reopen', async () => {
    await asUser(admin, () => db.query("select public.admin_update_appointment_status($1, 'cancelled')", [second]))
    third = await asUser(patient, () => scalar(book, [slot]))
    await asUser(admin, async () => {
      await db.query("select public.admin_update_appointment_status($1, 'completed')", [third])
      await db.query("select public.admin_update_appointment_status($1, 'completed')", [third])
      await rejects("select public.admin_update_appointment_status($1, 'cancelled')", [third], /Only scheduled/)
      await rejects('select public.admin_update_appointment_status($1, null)', [third], /status is required/)
    })
    assert.equal(await scalar('select is_booked from public.availability_slots where id = $1', [slot]), true)
  })
  await check('direct appointment writes are blocked for patients and browser admins', async () => {
    for (const id of [patient, admin]) {
      await asUser(id, () => rejects("update public.appointments set status = 'cancelled' where id = $1", [third], /permission denied/))
    }
  })
  await check('anonymous doctor listings remain accessible', async () => {
    await asUser(null, async () => {
      assert.equal(Number(await scalar('select count(*) from public.doctors')), 3)
    }, 'anon')
  })
  await check('setup rerun preserves appointment history and reserved slots', async () => {
    await db.exec(bundle)
    assert.equal(Number(await scalar('select count(*) from public.appointments')), 3)
    assert.equal(await scalar('select is_booked from public.availability_slots where id = $1', [slot]), true)
    assert.equal(Number(await scalar('select count(*) from public.availability_slots')), 168)
  })
  await check('the focused mobile migration applies without modifying existing bookings or data', async () => {
    await db.exec(await readFile(new URL('migrations/004_sri_lankan_mobile.sql', root), 'utf8'))
    assert.equal(Number(await scalar('select count(*) from public.appointments')), 3)
    assert.equal(await scalar('select is_booked from public.availability_slots where id = $1', [slot]), true)
  })
  console.log(`${checks} SQL checks passed. Single-session PostgreSQL test; hosted Auth and concurrent sessions require live verification.`)
} finally {
  await db.close()
}
