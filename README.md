# MediBook 🩺

### Modern Clinic Appointment Management Platform

**MediBook** is a full-stack clinic appointment management application built with React, TypeScript, and Supabase. It helps patients discover specialists, book consultations, and manage appointments through a clean, user-friendly interface, while administrators manage clinic operations through a secure dashboard.

Built with a focus on **security, data integrity, and real-world usability**, MediBook uses PostgreSQL, Row Level Security (RLS), and server-side database functions to handle critical appointment workflows.

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-Fast%20Builds-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-Styling-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Application Routes](#-application-routes)
- [Architecture and Security](#-architecture-and-security)
- [Getting Started](#-getting-started)
- [Supabase Configuration](#-supabase-configuration)
- [Administrator Access](#-administrator-access)
- [Testing and Validation](#-testing-and-validation)
- [Project Structure](#-project-structure)
- [Future Enhancements](#-future-enhancements)

---

## 🌟 Overview

MediBook provides a centralized platform for managing clinic appointments with separate experiences for patients and administrators.

### Patient Experience
Discover medical specialists, select available consultation times, and manage appointments from one place.

### Administrative Experience
Monitor appointment activity, review booking details, filter records, and update appointment statuses through a protected dashboard.

### Design Principles

- **User-friendly:** Simple and intuitive appointment workflows.
- **Secure by design:** Database-level access control and authorization.
- **Reliable booking:** Server-side validation and transaction-safe booking operations.
- **Maintainable:** TypeScript, reusable components, validation schemas, and automated tests.
- **Sri Lanka-ready:** Appointment scheduling uses the `Asia/Colombo` timezone.
- **Calm and accessible UI:** A responsive botanical-green theme, clear typography, and keyboard-visible controls are used throughout the patient and admin workflows.

---

## ✨ Key Features

### 👤 Patient Portal

- Secure registration and email/password authentication.
- Persistent sessions and secure sign-out.
- Browse doctors by medical specialty.
- View doctor profiles, biographies, and consultation fees.
- Select available appointment slots using Sri Lankan local time.
- Submit visit reasons and optional Sri Lankan mobile numbers.
- Receive booking confirmation and an appointment reference.
- View and search upcoming and past appointments.
- Cancel eligible future scheduled appointments.

### 🛡️ Administrator Dashboard

- Protected dashboard available at `/admin`.
- Overview of total, today's, completed, and cancelled appointments.
- Detailed appointment records, including patient, doctor, time, contact details, visit reason, and status.
- Search by patient name, email, or doctor.
- Filter by doctor, appointment status, and date.
- Update scheduled appointments to completed, no-show, or cancelled.
- Role-based access control for administrative operations.

### 🔐 Security and Data Integrity

- Supabase Authentication for user identity and session management.
- PostgreSQL Row Level Security (RLS) policies for database access.
- New accounts receive the patient role by default.
- Administrative privileges are assigned through trusted database administration.
- Server-side PostgreSQL RPC functions handle booking, cancellation, and status changes.
- Database-level booking locks help prevent double-booking.
- Server-side authorization validates cancellation and administrator actions.
- Frontend configuration uses only the Supabase project URL and public/publishable key.

> **Security note:** Never expose a Supabase service-role key or other secret credentials in frontend code, environment variables prefixed with `VITE_`, or a public repository.

---

## 🧰 Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Routing | React Router |
| Styling | Tailwind CSS, Lucide Icons |
| Server State | TanStack Query |
| Forms | React Hook Form, Zod |
| Backend Services | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Database Security | Row Level Security (RLS) |
| Server-side Operations | PostgreSQL RPC functions |
| Testing | Vitest, Testing Library, jsdom |
| Package Manager | pnpm |

---

## 🗺️ Application Routes

| Route | Description | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/login` | Sign-in page | Public |
| `/register` | Patient registration | Public |
| `/book` | Appointment booking | Authenticated users |
| `/dashboard` | Patient appointment management | Authenticated users |
| `/admin` | Administrative dashboard | Admin role required |

**Route protection:** Unauthenticated users attempting to access protected pages are redirected to sign-in. Patients attempting to access `/admin` are redirected to their dashboard.

---

## 🏗️ Architecture and Security

MediBook separates the frontend experience from critical database operations.

```text
┌───────────────────────────────────┐
│          React Frontend            │
│                                   │
│ Patient Portal │ Admin Dashboard  │
└─────────────────┬─────────────────┘
                  │
                  ▼
┌───────────────────────────────────┐
│        Supabase Services           │
│                                   │
│ Authentication │ Data API         │
└─────────────────┬─────────────────┘
                  │
                  ▼
┌───────────────────────────────────┐
│           PostgreSQL               │
│                                   │
│ Tables │ RLS │ RPC Functions      │
│                                   │
│ Booking │ Cancellation │ Admin     │
└───────────────────────────────────┘
```

### Core Database Entities

| Table | Purpose |
|---|---|
| `profiles` | User profiles, contact details, and roles |
| `doctors` | Specialist profiles and consultation information |
| `availability_slots` | Doctor availability and booking state |
| `appointments` | Patient bookings and appointment status |

### Database Functions

| Function | Responsibility |
|---|---|
| `book_appointment` | Validates and processes appointment bookings |
| `cancel_appointment` | Validates and processes eligible cancellations |
| `admin_update_appointment_status` | Authorizes and processes administrative status changes |

These operations are designed to enforce important business rules at the database level rather than relying exclusively on frontend checks.

---

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) compatible with the installed Vite version.
- [pnpm](https://pnpm.io/) version `10.19.0`, as declared in `package.json`.
- A [Supabase](https://supabase.com/) project configured for MediBook.

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd MediBook
```

Replace `<YOUR_REPOSITORY_URL>` with your actual Git repository URL.

### 2. Install Dependencies

```powershell
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use the public/publishable key from your Supabase project. The existing variable name `VITE_SUPABASE_ANON_KEY` must match the application's current configuration.

Ensure `.env` is ignored by Git and never commit real credentials.

### 4. Configure Supabase Authentication

In the Supabase dashboard, configure the project's authentication URL settings.

For local development, allow the appropriate local origins, such as:

```text
http://localhost:5173/**
http://127.0.0.1:5173/**
```

Set the Site URL to the local origin you use. Configure production URLs separately when deploying.

Restart the development server after changing environment variables.

### 5. Start the Development Server

```powershell
pnpm dev
```

Open the local URL displayed in your terminal, typically:

`http://localhost:5173`

---

## 🗄️ Supabase Configuration

MediBook requires its database schema, enums, RLS policies, profile creation trigger, and RPC functions to be configured before the complete application can operate.

### Existing Configured Project

The existing project's schema and RPC setup have previously been applied and verified.

**Do not rerun the initial schema migration on an already configured database.**

Refer to [`supabase.md`](./supabase.md) for setup details, verification, and recovery instructions.

### New Supabase Project

For a fresh database:

1. Run [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) once in the Supabase SQL Editor.
2. Apply [`supabase/complete_setup.sql`](./supabase/complete_setup.sql) to configure the remaining setup, RPC functions, and sample doctor and availability data.
3. Add the Supabase URL and public key to `.env`.
4. Verify the configured schema, RLS policies, RPC functions, and sample data.

When changing the source SQL files, rebuild the combined setup script:

```powershell
node scripts/build-supabase-setup.mjs
```

The Sri Lankan mobile-number migration is available at [`supabase/migrations/004_sri_lankan_mobile.sql`](./supabase/migrations/004_sri_lankan_mobile.sql).

For the complete instructions, see [`supabase.md`](./supabase.md).

---

## 🔑 Administrator Access

Administrator access must be granted explicitly to a trusted account.

1. Register an account through MediBook or create one in Supabase Authentication.
2. Open **Supabase Dashboard → Table Editor → `profiles`**.
3. Locate the profile associated with that account.
4. Change its `role` from `patient` to `admin`.
5. Sign out and sign back in to refresh the account profile.
6. Navigate to `/admin`.

Newly registered users must not be able to assign themselves administrator privileges. Grant admin access only to trusted accounts.

---

## 🧪 Testing and Validation

Run the following commands from the project root.

### Production Build and TypeScript Validation

```powershell
pnpm build
```

### Linting

```powershell
pnpm lint
```

### Automated Test Suite

```powershell
pnpm test --maxWorkers=2 --minWorkers=1
```

The automated tests cover areas including:

- Authentication and routing.
- Form validation schemas.
- Booking interface workflows.
- Patient appointment dashboard behavior.
- Appointment status badges.

### Manual Integration Testing

Automated tests do not replace testing against a live Supabase project. Verify the following separately:

- Registration, login, session restoration, and sign-out.
- Successful booking and prevention of double-booking.
- Appointment cancellation rules.
- Patient and administrator access restrictions.
- Administrator status changes and dashboard filters.
- Appointment scheduling around the Sri Lankan timezone.

**Note:** Vite may report a non-blocking warning if the production JavaScript bundle exceeds 500 kB.

---

## 📂 Project Structure

```text
MediBook/
├── src/
│   ├── components/
│   │   ├── appointments/
│   │   ├── auth/
│   │   └── layout/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── schemas/
│   ├── tests/
│   └── types/
├── supabase/
│   ├── functions/
│   ├── migrations/
│   ├── complete_setup.sql
│   └── seed.sql
├── scripts/
├── supabase.md
├── phase2.md
├── checklist.md
├── package.json
└── README.md
```

### Supporting Documentation

- [`supabase.md`](./supabase.md) — Supabase setup, configuration, and verification.
- [`phase2.md`](./phase2.md) — Authentication behavior and live account smoke tests.
- [`checklist.md`](./checklist.md) — Development and implementation checklist.

---

## 🔮 Future Enhancements

Potential improvements for future iterations include:

- Email and appointment reminder notifications.
- Doctor-specific dashboards and availability management.
- Rescheduling and waitlist management.
- Appointment analytics and reporting.
- Calendar integration.
- Improved accessibility and mobile responsiveness.

*These are potential enhancements, not claims about existing functionality.*

---

## 👨‍💻 About the Project

MediBook is a practical full-stack application demonstrating modern frontend development, authentication, database design, access control, and reliable appointment management.

It reflects an emphasis on building maintainable software with secure backend workflows and a clear separation between user-facing features and critical business logic.

---

<p align="center">
  <strong>Built with React, TypeScript, and Supabase 💙</strong>
</p>
