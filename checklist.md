# MediBook — Phase 1 Checklist

## Local verification — 21 October 2026

- [x] Installed application and development dependencies with pnpm 10.19.0; saved `pnpm-lock.yaml` and pinned the package manager.
- [x] Created `.env` from `.env.example`; the user added credentials. A live query using Vite's environment loader returned HTTP 206 with 3 doctors. `.env` is listed in `.gitignore`.
- [x] Fixed Supabase schema type compatibility, added Node.js configuration types, removed unused test imports, and added the missing ESLint configuration.
- [x] Resolved the Testing Library peer dependency mismatch and ran the required esbuild setup script.
- [x] `pnpm build` passes; production output is in `dist/`.
- [x] `pnpm lint` and `tsc -p tsconfig.node.json --noEmit` pass.
- [x] `pnpm test --maxWorkers=2 --minWorkers=1` passes: 115 tests in 8 files, including auth, routing, schemas, booking forms, and appointment dashboard workflows.
- [x] `pnpm dev --host 127.0.0.1 --port 5173 --strictPort` starts successfully.
- [x] Automated DOM tests cover all six routes with mocked authentication, anonymous redirects, patient/admin authorization, loading, and unknown routes.
- [x] Verified public Data API access using the application's environment settings with `node scripts/check-supabase-connection.mjs`.
- [x] Chrome checks verified login/registration rendering and validation, anonymous `/admin` → `/login` redirection, and no captured browser console errors during those checks.
- [x] The user reported completing authentication URL configuration and test admin setup.
- [ ] Successful live sign-in/registration with the user's accounts and live booking/cancellation remain unverified. Auth flow tests use mocked Supabase responses.
- [ ] Initialize Git and configure/push a GitHub repository; neither was configured in this workspace.

**Supabase setup follow-up:**

- [x] User-provided database checks confirm both enums, all four tables, four RLS flags, and the enabled signup trigger exist.
- [x] User-provided results after setup show all three RPC functions present, with 3 doctors and 168 slots.
- [x] Prepared `supabase/complete_setup.sql` for this existing schema. It applies the fixes below, creates the RPC functions, seeds sample data, and returns setup checks. It does not recreate enums/tables or delete existing rows.
- [x] Fixed signup metadata privilege escalation; browser users can update only their own name/phone, and appointment writes go through RPCs.
- [x] Replaced the unconditional slot uniqueness constraint with uniqueness for non-cancelled bookings, preserving cancellation history and allowing rebooking.
- [x] Fixed admin cancellation of historical records, restricted terminal status changes, added server-side input validation, and made slot locking consistent across RPCs.
- [x] Made seed data repeatable and timezone-explicit. Rebuild the combined script after source changes with `node scripts/build-supabase-setup.mjs`.
- [x] Passed 17 isolated PostgreSQL checks with PGlite: fresh/existing schema, repeated setup, 3 doctors/168 slots, privileges/RLS, booking/cancellation/rebooking, admin status changes, and the focused mobile migration. The unused `uuid-ossp` extension was excluded from the local harness; hosted Auth and concurrent sessions were not tested.
- [x] User ran the prepared setup in the hosted project and supplied passing setup-presence checks. Live public doctor access was independently verified; authenticated RPC execution remains unverified.
- [x] Applied the focused Sri Lankan mobile validator update to the hosted booking function through a separate SQL Editor query. Verification returned `sri_lankan_mobile_enabled = true`; no existing rows or access grants were changed. Source: `supabase/migrations/004_sri_lankan_mobile.sql`.

Local checks above do not constitute full Phase 1 sign-off. Original detailed items below remain pending unless independently verified.

**Goal:** Scaffold the complete project foundation — all configuration, types, data layer, routing skeleton, and layout — so that every subsequent phase plugs in cleanly with zero rework.

> **Definition of Done for Phase 1:** `pnpm install` succeeds, `pnpm dev` serves the app on `localhost:5173`, all six routes render without crashing, and `pnpm test` exits with 0 failures.

---

## 1.1 Supabase Project Setup

- [ ] Create a new Supabase project at [supabase.com](https://supabase.com) (region: Central India or Singapore)
- [ ] Copy **Project URL** and **`anon` public key** from *Project Settings → API*
- [ ] In *Authentication → Providers → Email*, **disable** "Confirm email" for local testing
- [ ] Open the **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
  - [ ] Verify tables exist: `profiles`, `doctors`, `availability_slots`, `appointments`
  - [ ] Verify RLS is enabled on all four tables (green lock icon in Table Editor)
  - [ ] Verify the `on_auth_user_created` trigger is present under *Database → Triggers*
- [ ] Run `supabase/functions/002_rpc_functions.sql`
  - [ ] Verify three functions exist under *Database → Functions*: `book_appointment`, `cancel_appointment`, `admin_update_appointment_status`
- [ ] Run `supabase/seed.sql`
  - [ ] Verify 3 doctor rows exist in the `doctors` table
  - [ ] Verify 168+ slot rows exist in `availability_slots`
- [ ] Manually create an admin user:
  - [ ] Register an account via *Authentication → Users → Add User* (e.g., `admin@medibook.com`)
  - [ ] In *Table Editor → profiles*, change `role` from `patient` → `admin` for that user

---

## 1.2 Local Project Initialisation

- [ ] Create `.env` file by copying `.env.example`
  ```
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  ```
- [ ] Run `pnpm install` — confirm **no errors** (expected: ~150 packages installed)
- [ ] Run `pnpm dev` — confirm app starts on `http://localhost:5173`
- [ ] Open the browser, navigate to `/` — confirm the **Landing Page** renders without console errors
- [ ] Initialise Git repository:
  ```bash
  git init
  git add .
  git commit -m "chore: Phase 1 — project scaffold and foundation"
  ```
- [ ] Create a new **GitHub repository** (`medibook`) and push:
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/medibook.git
  git push -u origin main
  ```
- [ ] Confirm `.env` is **NOT** tracked (verify it appears in `.gitignore`)

---

## 1.3 Configuration Files Verification

- [ ] **`package.json`** — all dependencies and scripts present
  - [ ] `pnpm dev` starts Vite dev server ✓
  - [ ] `pnpm build` compiles without TypeScript errors ✓
  - [ ] `pnpm test` runs Vitest ✓
- [ ] **`vite.config.ts`** — `@` alias resolves to `./src` ✓
- [ ] **`tsconfig.json`** — strict mode enabled, `@/*` path mapping configured ✓
- [ ] **`tailwind.config.ts`** — `content` glob covers all `.tsx` files ✓
- [ ] **`vitest.config.ts`** — `jsdom` environment, `setupFiles` points to `src/tests/setup.ts` ✓
- [ ] **`postcss.config.js`** — Tailwind and autoprefixer plugins present ✓
- [ ] **`.gitignore`** — `node_modules/`, `.env`, `dist/`, `coverage/` all listed ✓
- [ ] **`.env.example`** — committed to Git with placeholder values only ✓

---

## 1.4 Supabase Client & Types

- [ ] **`src/lib/supabase.ts`** — Supabase client initialises without throwing:
  - [ ] Open browser console on `localhost:5173` — no "Missing environment variables" error
- [ ] **`src/lib/database.types.ts`** — Row/Insert/Update types match the SQL schema:
  - [ ] `profiles`, `doctors`, `availability_slots`, `appointments` all typed ✓
  - [ ] RPC function signatures typed: `book_appointment`, `cancel_appointment`, `admin_update_appointment_status` ✓
- [ ] **`src/lib/utils.ts`** — utility functions correct:
  - [ ] `cn()` merges Tailwind classes without conflicts ✓
  - [ ] `formatDate()` outputs human-readable locale string ✓
  - [ ] `isPast()` returns `true` for yesterday ✓
- [ ] **`src/types/index.ts`** — all shared interfaces exported:
  - [ ] `Profile`, `Doctor`, `Slot`, `Appointment` ✓
  - [ ] `AppointmentWithDoctor`, `AppointmentWithDetails` ✓
  - [ ] `AdminFilters`, `PatientFilters` ✓

---

## 1.5 Application Entry & Routing

- [ ] **`src/main.tsx`** — providers in correct order: `BrowserRouter` → `QueryClientProvider` → `AuthProvider` → `App`
- [ ] **`src/index.css`** — CSS variables defined, Tailwind directives present, no errors in browser
- [ ] **`src/App.tsx`** — all six routes registered:

  | Route | Component | Guard |
  | :--- | :--- | :--- |
  | `/` | `LandingPage` | Public |
  | `/login` | `LoginPage` | Public |
  | `/register` | `RegisterPage` | Public |
  | `/book` | `BookingPage` | `ProtectedRoute` |
  | `/dashboard` | `PatientDashboard` | `ProtectedRoute` |
  | `/admin` | `AdminDashboard` | `AdminRoute` |

- [ ] Navigate to `/book` while **logged out** → redirected to `/login` ✓
- [ ] Navigate to `/admin` while **logged out** → redirected to `/login` ✓

---

## 1.6 Auth Context

- [ ] **`src/contexts/AuthContext.tsx`** — context initialises on mount:
  - [ ] Open app in browser — no console errors from `AuthProvider` ✓
  - [ ] `isLoading` resolves to `false` after ~500ms (no permanent spinner) ✓
  - [ ] `session` is `null` for a fresh anonymous browser visit ✓
- [ ] `useAuth()` hook throws a clear error if used outside `<AuthProvider>` ✓

---

## 1.7 Validation Schemas

- [ ] **`src/schemas/bookingSchema.ts`** — Zod schemas compile without errors:
  - [ ] `registerSchema` rejects passwords under 8 characters ✓
  - [ ] `registerSchema` rejects mismatched confirm passwords ✓
  - [ ] `loginSchema` rejects empty email ✓
  - [ ] `bookingSchema` rejects reason under 10 characters ✓
  - [x] `bookingSchema` validates Sri Lankan mobiles and normalizes local/international formatting.

---

## 1.8 Data Hooks (Compile Check)

Confirm all hooks are **importable without TypeScript errors** (full data wiring tested in Phase 3–5):

- [ ] `src/hooks/useDoctors.ts` — `useDoctors()` and `useSpecialties()` exported ✓
- [ ] `src/hooks/useSlots.ts` — `useSlots(doctorId, date)` exported ✓
- [ ] `src/hooks/useAppointments.ts` — `useAppointments()`, `useBookAppointment()`, `useCancelAppointment()` exported ✓
- [ ] `src/hooks/useAdminAppointments.ts` — `useAdminAppointments()`, `useAdminUpdateStatus()`, `useAdminStats()` exported ✓

---

## 1.9 Layout Components

- [ ] **`src/components/layout/Navbar.tsx`** renders on all pages ✓
  - [ ] Shows "Sign in" + "Get started" for unauthenticated users
  - [ ] Shows "Book Appointment", "My Appointments", user name, "Sign out" for authenticated patients
  - [ ] Shows "Admin" link for admin users
- [ ] **`src/components/layout/PageLayout.tsx`** renders `title` and `subtitle` ✓
- [ ] **`src/components/layout/ProtectedRoute.tsx`** — `ProtectedRoute` and `AdminRoute` exported ✓

---

## 1.10 Stub Pages & Test Setup

- [ ] **`LandingPage`** renders hero section and feature grid ✓
- [x] Login and registration forms plus booking, patient dashboard, and admin dashboard render without crashing; booking/dashboard implementation is recorded in Phases 3–5 below.
- [ ] **`src/tests/setup.ts`** — Supabase client mock is in place ✓
- [ ] **`src/tests/components/BookingForm.test.tsx`** — stub tests pass ✓
- [ ] **`src/tests/components/StatusBadge.test.tsx`** — stub tests pass ✓
- [ ] Run `pnpm test` → **all tests pass, 0 failures** ✓

---

## 1.11 Full Folder Structure Verification

Run `tree /F /A` (Windows) or `find . -not -path '*/node_modules/*'` to verify:

```
✅ package.json
✅ vite.config.ts
✅ tsconfig.json
✅ tsconfig.node.json
✅ tailwind.config.ts
✅ postcss.config.js
✅ vitest.config.ts
✅ index.html
✅ .gitignore
✅ .env.example
✅ .env                          ← (not committed, contains real keys)
✅ supabase/
    migrations/001_initial_schema.sql
    functions/002_rpc_functions.sql
    seed.sql
✅ src/
    main.tsx
    App.tsx
    index.css
    vite-env.d.ts
    lib/
      supabase.ts
      database.types.ts
      utils.ts
    types/
      index.ts
    contexts/
      AuthContext.tsx
    schemas/
      bookingSchema.ts
    hooks/
      useDoctors.ts
      useSlots.ts
      useAppointments.ts
      useAdminAppointments.ts
    components/
      layout/
        Navbar.tsx
        PageLayout.tsx
        ProtectedRoute.tsx
    pages/
      LandingPage.tsx
      LoginPage.tsx
      RegisterPage.tsx
      BookingPage.tsx
      PatientDashboard.tsx
      AdminDashboard.tsx
    tests/
      setup.ts
      components/
        BookingForm.test.tsx
        StatusBadge.test.tsx
```

---

## Phase 1 Complete — Sign-off

- [ ] `pnpm dev` — app serves on `localhost:5173` with no console errors ✓
- [ ] `pnpm build` — TypeScript compiles cleanly, no errors ✓
- [ ] `pnpm test` — all tests pass ✓
- [ ] All six routes render correctly (even as stubs) ✓
- [ ] Supabase schema, RLS policies, and RPC functions are live ✓
- [ ] Git repo initialised and pushed to GitHub ✓

## Phase 2 — Authentication implementation

- [x] Replaced login/registration placeholders with accessible React Hook Form and Zod forms.
- [x] Added full name, email, optional mobile number, password and confirmation fields; trimmed name/email/phone while preserving passwords exactly.
- [x] Added password visibility controls, field errors, server error messages, and disabled/pending submission states.
- [x] Connected login to `signInWithPassword` and registration to `signUp`, sending only name/phone as profile metadata.
- [x] Handled both immediate sign-in and email-confirmation registration responses.
- [x] Restored persisted SDK sessions, handled token refresh/sign-out events, cleaned up subscriptions and requests, and protected against stale responses/account changes.
- [x] Moved profile requests outside auth callbacks. Added bounded loading and retry controls for session/profile failures.
- [x] Added patient/admin redirects after profile loading and restored allowed internal destinations after protected-route login.
- [x] Restricted non-admin users from admin routes and held protected pages when account loading fails.
- [x] Added current-session sign-out with visible failure recovery and cleared account query caches on sign-out/account changes.
- [x] TypeScript, lint, build, and all 115 tests pass. Vite reports a non-failing bundle-size warning for the 596 kB main chunk.
- [x] Replaced Indian mobile validation/hints with Sri Lankan mobile support across registration, booking schemas, and the hosted booking RPC. Spaces/hyphens and `+94`/`94`/`0094` prefixes normalize to local `07XXXXXXXX` format; phone remains optional.
- [x] Traced the reported registration failure to Supabase auth logs: the service rejected the submitted email address as invalid (HTTP 400). Added specific email, SMTP, service, timeout, and CAPTCHA error messages without exposing raw server messages or submitted addresses.
- [x] Read-only auth settings confirm email login enabled, signups allowed, and email confirmation enabled. No authentication settings were changed; a successful signup with an email the user controls is still pending.
- [x] Checked both forms and anonymous admin redirection in Chrome.
- [ ] Complete the live patient/admin smoke checks in `phase2.md` using the user's accounts; no real user credentials were used during implementation.

## Phase 3 — Appointment booking

- [x] Added specialist browsing, specialty filtering, clinic-timezone date selection, live slot loading, validation, booking confirmation, and an appointment reference.
- [x] Booking uses the concurrency-safe `book_appointment` RPC and refreshes slot/appointment data after success.
- [x] Added loading, retry, error, and no-availability states.

## Phase 4 — Patient appointments

- [x] Added upcoming and past appointment views, search, status, doctor, visit reason, and clinic-local appointment time.
- [x] Added a confirmation step and retryable feedback for cancellation through the `cancel_appointment` RPC.

## Phase 5 — Admin dashboard

- [x] Added total/today/completed/cancelled statistics and patient/doctor appointment details.
- [x] Added search, doctor/status/date filters, and scheduled-appointment status updates through the admin RPC.
- [x] Added explicit loading/error/retry states and invalidation of affected dashboard data after changes.

Automated checks cover these application flows; live authenticated booking,
cancellation, and admin updates still require the user's hosted accounts.
