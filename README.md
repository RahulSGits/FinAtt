# GeoSelfie Attendance

A comprehensive cross-platform attendance system featuring a Next.js web application for Employees, HR, and Admins, and a powerful FastAPI backend. 

Employees mark attendance by taking a real-time selfie inside their assigned work site. The backend verifies GPS location against an admin-defined geofence and scheduled shift hours, uses OpenCV for face verification and liveness detection, tracks how long each person is on-site, and automatically manages daily attendance status (Present / Half-day / Absent).

## Tech Stack

- **Web Frontend**: Next.js (React, TailwindCSS, Recharts, React-Leaflet)
- **Backend**: FastAPI (Python, WebSockets)
- **Database**: PostgreSQL (managed via Prisma ORM)
- **Face Recognition & AI**: Python (OpenCV, liveness detection, AI models)

## What's Implemented

- **Auth** — JWT-based authentication with role-based routing (Admin, HR, Employee).
- **Face Recognition & Liveness** — Employees enroll their face on their first login. Subsequent check-ins require a real-time selfie, verified by the FastAPI backend using OpenCV for 1:1 face matching and liveness detection to prevent spoofing.
- **Geofenced Check-in / Check-out** — Real-time GPS location validation ensures employees are physically present within their assigned site's geofence during scheduled shift hours.and set the real timing of check in and check out with proper date .
- **Presence Tracking & Auto Status** — Check-in/out pairings constitute a session. The system calculates total hours present and automatically flags daily attendance based on minimum presence thresholds.
- **Employee App (Web)** — A rich web interface for employees for check-ins/outs, face enrollment, monthly attendance history, and viewing assigned shifts/sites.
- **Admin & HR Dashboard (Web)** — A rich web interface for administrators to manage sites, shifts, employees, view company-wide reports, and monitor real-time attendance via WebSockets.
- **Real-Time Updates** — Built-in WebSocket connections sync live attendance data between the web-app, backend, and admin dashboards.

## Architecture Structure

```
├── fastapi-backend/     # Python FastAPI Server
│   ├── app/
│   │   ├── api/         # Routes (auth, attendance, websockets)
│   │   ├── core/        # Config, security, database setup
│   │   ├── models/      # Prisma schema and generated client
│   │   ├── services/    # Business logic (OpenCV face matching, geofence math)
│   │   └── main.py      # Entry point
│
├── frontend/            # Next.js Web Dashboard
│   ├── src/
│   │   ├── app/         # Next.js App Router pages (admin, hr, employee)
│   │   ├── components/  # Reusable UI components (charts, maps, layout)
│   │   └── lib/         # API clients and utility functions
```

## Setup & Installation

### 1. Database Setup
Ensure you have a supabase instance running. You will need to configure your database connection string in the backend's `.env` file.

### 2. FastAPI Backend
```bash
cd fastapi-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Generate Prisma client and push schema
prisma generate
prisma db push

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 3. Next.js Web Dashboard
```bash
cd frontend
npm install

# Start the development server
npm run dev
```
The web dashboard will be available at `http://localhost:3000`.

## License
MIT License
