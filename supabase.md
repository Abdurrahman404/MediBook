# MediBook Supabase setup

## Current project

The user verified that both enums, all four tables, RLS flags, the signup trigger,
and all three RPC functions exist, with 3 doctors and 168 slots. A live public
doctor query using the app's Vite environment loader also succeeded with a count
of 3. Database setup has been applied; the instructions below are retained for
recovery or a new project, not as an additional step to run now.

1. Open `supabase/complete_setup.sql` locally and copy its entire contents.
2. Open the intended Supabase project's **SQL Editor → New query**.
3. Paste the entire script and click **Run** using the privileged SQL Editor role.
4. The final result should show four RLS flags, the signup trigger, and three
   functions as `true`, with 3 doctors and 168 slots for this initially empty project.
5. If a query errors, keep its exact message. The transaction rolls back its
   changes. Do not remove failing statements or run fragments.

This script patches the existing schema, creates RPCs, and adds sample data in
one transaction. It does not recreate enums/tables or delete existing rows.
Sequential repeat runs do not duplicate sample doctors or existing slots. Running
on a later day adds the newly covered dates; counts can then exceed 168 slots.
Previously duplicated doctors are not removed.

Do not rerun `001_initial_schema.sql` on the existing database: its objects already
exist. Do not execute SQL copied from older versions of this guide.

## A completely new, empty project

1. Run all of `supabase/migrations/001_initial_schema.sql` once.
2. Run all of `supabase/complete_setup.sql`.

The combined script includes `003_existing_schema_fixes.sql`,
`002_rpc_functions.sql`, and `seed.sql`; do not run those separately as extra steps.
Rebuild the combined script after editing its sources:

```powershell
node scripts/build-supabase-setup.mjs
```

## Authentication and application connection

1. Set the local `.env` values using the project's URL and publishable key:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_YOUR_KEY
   ```

   Keep these variable names because the current client reads them. Never use a
   secret or service-role key in this frontend.

2. Under **Authentication → URL Configuration**, set Site URL to
   `http://127.0.0.1:5173` and allow `http://127.0.0.1:5173/**` as a redirect URL.
   Add `http://localhost:5173/**` if using localhost too.
3. For local testing only, the checklist permits disabling email confirmation.
4. Create a test user through **Authentication → Users**. In the privileged
   Table Editor, change that user's `profiles.role` to `admin`. Signup always
   creates patients; client-supplied role metadata is ignored.
5. Restart `pnpm dev` after changing `.env`.

The application implements login, registration, session restoration, and
sign-out, plus patient booking, appointment history/cancellation, and an
admin appointment dashboard. See `phase2.md` for the remaining live account
checks. Booking and dashboard mutations use the database RPC functions so
booking locks, cancellation rules, and admin permissions remain server-enforced.

The hosted booking function has also received
`supabase/migrations/004_sri_lankan_mobile.sql`, which replaces Indian mobile
validation with Sri Lankan formats and normalizes them to local `07XXXXXXXX`.
The setup generator maintains this focused migration alongside the full bundle.

## Verification

Run the read-only application connection check:

```powershell
node scripts/check-supabase-connection.mjs
```

It loads environment settings the same way as Vite and queries public doctor IDs
with a limit of one and an exact count. It prints the HTTP status and count, never
credentials or patient data. HTTP 200 or 206 indicates a successful query.

`supabase/verify_setup.sql` is a read-only setup presence check. It does not
replace a security audit or a live authentication/booking test.

`scripts/test-supabase-sql.mjs` runs against an isolated PGlite PostgreSQL engine,
using a minimal Supabase auth fixture. Install `@electric-sql/pglite` in a temporary
directory and pass its `dist/index.js` path as the script's first argument. The
test does not read `.env` or contact the hosted project. It omits the unused
`uuid-ossp` extension and does not simulate concurrent database sessions.
