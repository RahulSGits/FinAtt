# GeoSelfie Attendance

A comprehensive cross-platform attendance system featuring a Next.js web application for Employees, HR, and Admins, fully powered by a Supabase backend.

Employees mark attendance by taking a real-time selfie inside their assigned work site. The system verifies GPS location against an admin-defined geofence and scheduled shift hours, uses OpenCV/AI models for face verification and liveness detection, tracks how long each person is on-site, and automatically manages daily attendance status (Present / Half-day / Absent).

## Tech Stack

- **Web Frontend**: Next.js 15 (React, TailwindCSS, Recharts, React-Leaflet)
- **Backend / Database**: Supabase (PostgreSQL, Authentication, Row Level Security, Triggers)
- **Face Recognition & AI**: Web/Client-side AI models (`@vladmandic/face-api`, Google Generative AI)

## What's Implemented

- **Auth** — Supabase Authentication with role-based routing (Admin, HR, Employee) and Row Level Security (RLS) for data protection.
- **Employee Onboarding** — HR invites employees, automatically creating their Supabase Auth profiles and assigning them to the `employee` role. Employees set up their own secure passwords upon first login.
- **Face Recognition & Liveness** — Employees enroll their face on their first login. Subsequent check-ins require a real-time selfie, verified for 1:1 face matching and liveness detection to prevent spoofing.
- **Geofenced Check-in / Check-out** — Real-time GPS location validation ensures employees are physically present within their assigned site's geofence during scheduled shift hours.
- **Presence Tracking & Auto Status** — Check-in/out pairings constitute a session. The system calculates total hours present and automatically flags daily attendance based on minimum presence thresholds using Supabase Database Triggers.
- **Employee App (Web)** — A rich web interface for employees for check-ins/outs, face enrollment, monthly attendance history, and viewing assigned shifts/sites.
- **Admin & HR Dashboard (Web)** — A rich web interface for administrators to manage sites, shifts, employees, view company-wide reports, and monitor real-time attendance.

## Architecture Structure

```text
├── frontend/            # Next.js Web Dashboard
│   ├── src/
│   │   ├── app/         # Next.js App Router pages (admin, hr, employee)
│   │   ├── components/  # Reusable UI components (charts, maps, layout)
│   │   ├── utils/       # Supabase client helpers (SSR/Server Actions)
│   │   └── lib/         # API clients and utility functions
│
├── supabase_schema.sql  # Complete Supabase PostgreSQL schema and RLS policies
```

## Setup & Installation

### 1. Database Setup
Ensure you have a Supabase project created.
1. Run the SQL from `supabase_schema.sql` in your Supabase SQL Editor to create all tables, roles, and triggers.
2. Obtain your Supabase Project URL and Publishable API Key.

### 2. Next.js Web Dashboard
```bash
cd frontend
npm install

# Configure environment variables
# Create a .env.local file in the frontend folder with:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Start the development server
npm run dev
```
The web dashboard will be available at `http://localhost:3000` (or `http://0.0.0.0:3000` for network access).

## Demo Credentials

You can test the application by registering the following demo accounts on the `/register` page:

**HR Demo Account:**
- **Email:** hr@demo.com
- **Password:** demo1234
- **Role:** Select `HR`

**Employee Demo Account:**
- **Email:** employee@demo.com
- **Password:** demo1234
- **Role:** Select `Employee`

## License
MIT License
