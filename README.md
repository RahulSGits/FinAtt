# FinAtt — Attendance & Workforce Platform

A Next.js 16 web app for face-verified, geofenced attendance, backed entirely by Supabase.

Employees enroll their face once, then check in with a live selfie. Every check-in is
validated three ways — a 128-float face descriptor match, a blink liveness gate, and a GPS
geofence — with the face match and the fence **re-checked on the server**, so a forged
client request cannot mark someone present. Worked hours, lateness and the daily status
(Present / Half day / Absent) are computed by a Postgres trigger.

## Tech Stack

- **Frontend** — Next.js 16 (App Router, React 19, Turbopack), Tailwind CSS v4, `motion`, Recharts, React-Leaflet
- **Backend** — Supabase (Postgres, Auth, Row Level Security, triggers, Storage)
- **Face recognition** — `@vladmandic/face-api`, running fully client-side against weights in `public/models`
- **AI assistant** — Google Gemini, grounded on the signed-in user's own data

---

## Setup

### 1. Database (required — the app cannot load data until this is done)

Open your Supabase project → **SQL Editor**, then run, in order:

1. `supabase/migrations/20260721000000_finatt_full_schema.sql`
2. `supabase/seed_demo_accounts.sql` *(optional — creates the demo logins below)*

Both scripts are idempotent, so re-running them is safe.

The migration fixes a `42P17: infinite recursion detected in policy for relation
"profiles"` error in the original schema, where the HR policy on `profiles` queried
`profiles`. Until it is applied, **every** query returns HTTP 500 and the dashboards show
zeros with a red banner. It also adds work sites, shifts, face enrollment, the geo/selfie
columns, the auto-status trigger, and a private `selfies` storage bucket.

### 2. Environment

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon / publishable key>

# Only needed for HR → Add employee, which invites users via the Admin API.
SUPABASE_SERVICE_ROLE_KEY=<service_role key>

# Only needed for the AI assistant.
GEMINI_API_KEY=<key>
```

Both Supabase keys come from **Project Settings → API**. If `SUPABASE_SERVICE_ROLE_KEY` is
missing or stale, everything still works except inviting new employees, which reports
exactly that.

### 3. Run

```bash
cd frontend
npm install
npm run dev
```

Available at `http://localhost:3000`.

> The camera needs a secure context. `localhost` counts; any other host needs HTTPS.

---

## Demo accounts

Created by `supabase/seed_demo_accounts.sql`:

| Role     | Email               | Password   |
| -------- | ------------------- | ---------- |
| HR       | `hr@demo.com`       | `demo1234` |
| Employee | `employee@demo.com` | `demo1234` |

Anyone can also self-register at `/register` and pick a role.

---

## Features

### Employee portal
- Live check-in card with today's status, hours and lateness
- One-time face enrollment (5 frames averaged into a template)
- Verified check-in: GPS fence → face match → blink liveness → selfie stored privately
- Month calendar plus a full history table, exportable to CSV
- Leave requests with overlap detection and withdrawal
- Announcements feed and an editable profile

### HR console
- KPIs, a 14-day attendance trend, status mix and department headcount
- Employee directory: invite, edit, assign site + shift, reset a face enrollment
- Attendance across the company with date/status/name filters and CSV export
- Manual attendance override for days the automatic rules got wrong
- Leave approvals — approving a request posts those days to the attendance sheet
- Announcements with priority levels
- Work sites: geofence editor on a map, with radius and "use my location"
- Shifts: working days, grace period, and the thresholds driving Present/Half/Absent

---

## How verification works

| Layer | Where it runs | What it stops |
| ----- | ------------- | ------------- |
| Face descriptor match | Browser **and** re-checked server-side against the stored template | Someone else checking in for you |
| Blink liveness | Browser, via eye-aspect-ratio across frames | A printed photo or a phone screen |
| Geofence | Browser **and** re-checked server-side with haversine | Checking in from home |
| GPS accuracy gate | Both | A vague fix being treated as precise |
| Row Level Security | Postgres | Reading anyone else's records |

Face data is stored as a 128-float descriptor, never as a reference photograph. Check-in
selfies live in a private bucket readable only by their owner and HR.

## Project layout

```text
frontend/
  src/
    app/
      (auth)/          login, register, set-password + auth actions
      (main)/employee/ employee portal + its server actions
      (main)/hr/       HR console, sections/, + its server actions
      api/chat/        Gemini assistant, scoped to the caller's data
    components/        shell, modal, toasts, face check-in, map, charts, UI kit
    lib/               types, geo maths, face-api wrapper, formatting, auth guards
    proxy.ts           auth + role routing (Next 16's renamed middleware)
supabase/
  migrations/          schema, RLS, triggers, storage
  seed_demo_accounts.sql
```

## License

MIT
