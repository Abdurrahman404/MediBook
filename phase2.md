# Phase 2: Authentication

Implemented email/password login, patient registration, email-confirmation
feedback, session restoration, profile loading, role-based redirects, and
current-browser sign-out. Uses the existing Supabase project and installed
React Hook Form/Zod dependencies.

## Behavior

- `/register` collects name, email, optional Sri Lankan mobile number,
  password, and confirmation. Passwords require 8 characters, an uppercase
  letter, and a number. Only name and phone are included in signup metadata;
  the database assigns the patient role.
- Mobiles accept local `0771234567` and international `+94771234567` formats,
  including common spaces, hyphens, parentheses, `94`, and `0094` prefixes.
  Registration and booking normalize them to local `07XXXXXXXX` format.
- If Supabase returns a session at signup, the patient proceeds to the dashboard
  or their requested booking page. If confirmation is required, the page shows
  a check-email message. Email links return to `/login` on the current origin.
- `/login` signs in with Supabase. Patients default to `/dashboard`; admins
  default to `/admin`. Redirects wait until the profile is loaded.
- Visiting a protected page anonymously preserves its internal destination.
  Registration/login links preserve this intent. Unknown/external destinations
  are rejected, and patients cannot redirect into admin content.
- The SDK persists sessions in its existing browser storage and refreshes tokens.
  AuthProvider restores sessions on mount and fetches profiles in a separate
  effect, outside the auth callback. Initialization/profile failures show retry
  controls after at most 15 seconds. Old requests cannot assign another user's
  profile after an account change or sign-out.
- Sign-out uses `scope: 'local'`, clears private query caches, and returns to `/`.
  Failures show a retryable message instead of pretending sign-out succeeded.

## Live account smoke checks

These steps remain for a real patient/admin account. Automated flow tests use
mocked Supabase responses; implementation did not use the user's credentials or
create hosted test users.

1. Start `pnpm dev` and open `http://127.0.0.1:5173/register`.
2. Submit empty/invalid fields. Confirm field errors and focus on the first
   invalid input. Test the show/hide password buttons.
3. Register a test patient using an email you control. With email confirmation
   disabled, expect `/dashboard`. Otherwise follow the email link and sign in.
4. Confirm the navbar shows the patient's name. Reload `/dashboard`; the session
   should restore without returning to login. The dashboard itself remains a stub.
5. Sign out. Visit `/book`, sign in, and confirm you return to `/book`.
6. As a patient, visit `/admin`; expect `/dashboard`.
7. Sign out and sign in with the admin account created in Supabase. Expect `/admin`
   and the Admin navbar link. Reload to verify session/profile restoration.
8. Sign out and try an incorrect password; confirm a clear error and no redirect.
9. With two tabs on the same origin, sign out in one and confirm the other loses
   access to protected pages when it receives the SDK auth event.

## Verification completed

- TypeScript and ESLint passed.
- Production build passed. Vite reports a non-failing 596 kB main chunk warning.
- `pnpm test --maxWorkers=2 --minWorkers=1`: 115 passing tests in 8 files,
  including auth, routing, schemas, booking, and appointment dashboard workflows.
- Chrome: both auth forms render, blank submissions validate, anonymous `/admin`
  redirects to `/login`, and no browser console errors were captured during these
  checks. A successful live patient/admin login is not yet verified.
- The reported registration failure was traced to HTTP 400 invalid-email entries
  in the project's auth logs. The form now identifies invalid/restricted email
  addresses and other auth failures with safe, specific messages. Use an email
  address you control for the live check. Confirmation remains enabled.
- The hosted booking RPC now accepts Sri Lankan mobiles; the focused migration
  is `supabase/migrations/004_sri_lankan_mobile.sql`. It was applied and returned
  `sri_lankan_mobile_enabled = true` without changing existing records or grants.

Format reference: [TRCSL National Numbering Plan](https://www.trc.gov.lk/content/files/numbering/numberingmanual.pdf).
Auth error reference: [Supabase error codes](https://supabase.com/docs/guides/auth/debugging/error-codes).

Booking, patient appointment management, and admin appointment management are
implemented in the application. Remaining live-account smoke checks require
the user's own patient and admin accounts; they are not replaced by mocked
automated tests.
