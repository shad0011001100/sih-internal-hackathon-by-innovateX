---
wave: 2
depends_on: ["Phase 1"]
files_modified:
  - backend/database.py
  - backend/models.py
  - backend/routers/auth.py
  - backend/main.py
  - frontend/src/lib/supabase.ts
  - frontend/src/features/auth/LoginScreen.tsx
  - frontend/src/features/auth/OtpScreen.tsx
  - frontend/src/App.tsx
autonomous: true
---

# Phase 2: Authentication & Database Schema

## Objective
Implement role-based database schemas using SQLAlchemy, and set up Supabase OTP authentication in both the FastAPI backend and React frontend. Integrate the Stitch-generated UI for Mobile Login and OTP Verification, wrapped in fluid `framer-motion` page transitions.

## Verification Criteria
- `alembic upgrade head` successfully creates `users`, `reports`, and `universities` tables.
- Frontend user can enter a phone number on `LoginScreen.tsx` and receive a mocked/test OTP via Supabase.
- Entering the correct test OTP successfully returns a JWT session token and routes the user to the Dashboard.
- All auth screens use the downloaded `site/public/login.html` and `otp.html` designs converted to React, enriched with Framer Motion spring physics.

## Tasks

<task>
<id>1</id>
<title>Define Database Schema & Migrations</title>
<type>execute</type>
<read_first>
- .planning/PROJECT.md
- backend/database.py
</read_first>
<action>
1. Create `backend/models.py`.
2. Define `User` model (id, phone_number, role: citizen/verifier/university, trust_score).
3. Define `Report` model (id, citizen_id, category, description, gps_lat, gps_lon, photo_url, is_verified, ai_spam_score).
4. Define `University` model (id, name, department, user_id).
5. Generate alembic revision (`alembic revision --autogenerate -m "Initial schema"`) and apply it.
</action>
<acceptance_criteria>
- `backend/models.py` contains SQLAlchemy classes for User, Report, University.
- A new migration script exists in `backend/alembic/versions/`.
</acceptance_criteria>
</task>

<task>
<id>2</id>
<title>FastAPI Auth Routes (Supabase)</title>
<type>execute</type>
<read_first>
- backend/main.py
</read_first>
<action>
1. Install `supabase` python client (`pip install supabase`).
2. Create `backend/routers/auth.py`.
3. Add `POST /api/auth/send-otp` (takes phone number, calls supabase auth to send OTP).
4. Add `POST /api/auth/verify-otp` (takes phone, OTP, verifies via supabase, and syncs/creates the user in our Postgres `User` table).
5. Include the router in `backend/main.py`.
</action>
<acceptance_criteria>
- `backend/routers/auth.py` exposes `/send-otp` and `/verify-otp`.
- User record is successfully synced to the local DB upon first successful OTP verification.
</acceptance_criteria>
</task>

<task>
<id>3</id>
<title>Frontend Supabase Setup & React Auth Store</title>
<type>execute</type>
<read_first>
- frontend/package.json
</read_first>
<action>
1. Install `@supabase/supabase-js` in the frontend.
2. Create `frontend/src/lib/supabase.ts` to export the initialized client using environment variables.
3. Create `frontend/src/store/authStore.ts` using `zustand` to manage `user` and `session` state globally.
</action>
<acceptance_criteria>
- `frontend/src/lib/supabase.ts` exports `supabase`.
- `authStore.ts` exposes `setUser` and `setSession`.
</acceptance_criteria>
</task>

<task>
<id>4</id>
<title>Build Login & OTP Screens with Framer Motion</title>
<type>execute</type>
<read_first>
- site/public/login.html
- site/public/otp.html
- .planning/DECISIONS.md
</read_first>
<action>
1. Convert `login.html` into `frontend/src/features/auth/LoginScreen.tsx`.
2. Convert `otp.html` into `frontend/src/features/auth/OtpScreen.tsx`.
3. Wire up the forms to call the FastAPI `/api/auth/send-otp` and `/verify-otp` endpoints.
4. Wrap both screens in `<motion.div>` using `framer-motion` for fluid page transitions (e.g., slide-in from right with spring physics) as specified in `DECISIONS.md`.
5. Update `App.tsx` with React Router to navigate between `/` (Login), `/otp`, and `/dashboard`.
</action>
<acceptance_criteria>
- `LoginScreen.tsx` visually matches `login.html` styling.
- `OtpScreen.tsx` visually matches `otp.html` styling.
- Page transitions trigger smoothly via Framer Motion.
</acceptance_criteria>
</task>

## must_haves
- [ ] Database schema covers Citizens, Reports, and Universities.
- [ ] Backend routes can trigger and verify Supabase OTPs.
- [ ] Frontend successfully routes between Login and OTP screens using React Router and Framer Motion.
