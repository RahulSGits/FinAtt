# GeoSelfie Attendance

A cross-platform (Android + iOS) attendance app built with **Flutter** and a
**Supabase** backend. Employees mark attendance by taking a selfie inside their
assigned work site; the app verifies GPS location against an admin-defined
geofence and scheduled shift hours, tracks how long each person is on-site, and
auto-marks the day Present / Half-day / Absent. Admins get company-wide monthly
reports.

## What's implemented

- **Auth** — email/password sign-up & login (Supabase Auth); role-based routing
  (employee vs admin).
- **Face recognition** — one-time on-device face enrollment (ML Kit), and every
  check-in runs a liveness/quality gate (one face, eyes open, looking straight)
  plus a 1:1 geometry match against the enrolled face to stop proxy attendance.
- **Check-in / check-out** — front-camera selfie + high-accuracy GPS; Haversine
  math confirms the point is inside the site radius **and** within shift hours
  before a session is written.
- **Offline queue** — if there's no connection at check-in, the record (and its
  selfie) is stored locally and auto-synced when connectivity returns.
- **Presence tracking** — each check-in→check-out pair is a session; daily hours
  are the sum of in-geofence session time.
- **Auto status** — a scheduled `close-day` edge function force-closes open
  sessions and marks each employee Present / Half-day / Absent / On-leave based
  on `min_presence_percent` of the shift, respecting approved leave.
- **Reminders** — local daily check-in / check-out notifications aligned to the
  employee's shift (no Firebase required).
- **Employee dashboard** — monthly calendar colored by status, present/absent/
  hours/attendance-% summary cards, per-day check-in/out + selfie log, and
  **PDF export** of the monthly report.
- **Admin dashboard** — 5 tabs: company Reports (per-employee days + hours +
  bar chart + **Excel export**), Employees (assign site/shift/department), Sites
  (create with GPS + set geofence radius), Shifts (hours + min-presence
  threshold), Leave approvals.

## Architecture

```
app/                     Flutter app
  lib/
    models/              Site, Shift, Profile, AttendanceSession/Day
    services/            auth, location, geofence(math), attendance, report, admin,
                         storage, face, offline_queue, export, notification
    screens/auth         login, signup, auth_gate (role router)
    screens/employee     home, dashboard, day detail, selfie camera, face enrollment
    screens/admin        dashboard + reports/employees/sites/shifts/leave tabs
    widgets/             status chip, summary stat card
supabase/
  migrations/            0001 schema+RLS, 0002 storage, 0003 cron, 0004 face columns
  functions/close-day/   daily aggregation + absent-marking (service role)
```

### Face recognition note
Matching uses a scale-invariant **facial-landmark-geometry signature** derived
via ML Kit — fully on-device, offline, no bundled model. It reliably blocks
obvious proxies; for bank-grade accuracy, swap `FaceService` for a TFLite
face-embedding model (e.g. MobileFaceNet). Threshold is `FaceService.matchThreshold`.

## Setup

### 1. Backend (Supabase)
1. Create a project at supabase.com.
2. Run the migrations (SQL editor or `supabase db push`):
   `0001_init.sql`, `0002_storage.sql`, `0004_face.sql`.
3. Deploy the edge function and schedule it:
   ```bash
   supabase functions deploy close-day
   ```
   Then edit `0003_schedule.sql` with your project ref + service-role key and run
   it (or configure the cron job from the dashboard).
4. Make your own account an admin once: in the SQL editor,
   `update public.profiles set role='admin' where email='you@example.com';`

### 2. App
```bash
cd app
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://YOURPROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

Building for release:
```bash
flutter build apk        # Android
flutter build ios        # iOS (needs Xcode + Apple developer signing)
```

## Roadmap / future work

- **Deep face embeddings** — upgrade the geometry matcher to a TFLite
  face-embedding model (MobileFaceNet) or a cloud face-match API for higher
  accuracy under varied lighting/angles.
- **Background presence pinging** while the app is closed (currently presence =
  check-in→check-out duration). Needs a background-location/WorkManager pipeline
  and per-platform background-execution setup.
- **Cloud push (FCM/APNs)** for admin→employee messages; local reminders are
  already implemented and need no server.
