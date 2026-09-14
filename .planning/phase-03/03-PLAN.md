---
wave: 3
depends_on: ["Phase 2"]
files_modified:
  - backend/routers/reports.py
  - backend/main.py
  - frontend/src/features/citizen/ReportScreen.tsx
  - frontend/src/features/citizen/DashboardScreen.tsx
  - frontend/src/App.tsx
autonomous: true
---

# Phase 3: Citizen Reporting & Request Tracking

## Objective
Implement the core citizen reporting pipeline. Citizens must be able to capture live photos (preventing gallery uploads), capture GPS coordinates (geo-tagging), and submit the report to the backend. The citizen dashboard must display an interactive, visually innovative timeline tracking the status of their reports using advanced Framer Motion scroll and staggered animations.

## Verification Criteria
- `POST /api/reports` successfully saves a report with GPS coordinates and a photo to the PostgreSQL database.
- `GET /api/reports/my` returns the authenticated citizen's reports.
- `ReportScreen.tsx` requests camera and location permissions natively in the browser.
- `DashboardScreen.tsx` displays the tracking timeline with staggered Framer Motion scroll animations.

## Tasks

<task>
<id>1</id>
<title>Backend Reports Router</title>
<type>execute</type>
<read_first>
- backend/models.py
- .planning/DECISIONS.md
</read_first>
<action>
1. Create `backend/routers/reports.py`.
2. Implement a `get_current_user` dependency that reads the `httpOnly` cookie (`access_token`) and decodes it (for now, simply extracting the `user_id` from the DB since we bypassed Supabase JWT decode on the backend, or querying the DB using a mock mechanism if needed. Note: We will use a simple auth dependency to fetch the user).
3. Add `POST /api/reports`: Accepts `category`, `description`, `gps_lat`, `gps_lon`, and `photo_base64`. Saves a new `Report` to the database.
4. Add `GET /api/reports/my`: Returns all reports belonging to the current user, ordered by `created_at` descending.
5. Register the router in `backend/main.py`.
</action>
<acceptance_criteria>
- `backend/routers/reports.py` exists with POST and GET endpoints.
- Endpoints are secured via a cookie-based dependency.
</acceptance_criteria>
</task>

<task>
<id>2</id>
<title>Build Camera & GPS Reporting Screen</title>
<type>execute</type>
<read_first>
- site/public/report.html
</read_first>
<action>
1. Convert `site/public/report.html` into `frontend/src/features/citizen/ReportScreen.tsx`.
2. Implement `navigator.geolocation.getCurrentPosition` to capture GPS when the user taps "Add Location".
3. Implement live camera capture using `<input type="file" accept="image/*" capture="environment" />` to enforce the anti-spam live photo constraint.
4. Wire the submit button to `POST /api/reports`.
5. Wrap the screen in `<motion.div>` for page transitions.
</action>
<acceptance_criteria>
- Report screen successfully requests GPS and Camera permissions.
- Submits JSON payload to backend successfully.
</acceptance_criteria>
</task>

<task>
<id>3</id>
<title>Build Innovative Scroll Dashboard (Tracking System)</title>
<type>execute</type>
<read_first>
- site/public/home.html
</read_first>
<action>
1. Convert `site/public/home.html` into `frontend/src/features/citizen/DashboardScreen.tsx`.
2. Fetch `GET /api/reports/my` on mount using React Query or standard fetch.
3. Implement advanced Framer Motion animations:
   - Use `staggerChildren` to make the history cards "pop out" one by one as they load.
   - Implement `whileInView` so that as the user scrolls down, older reports smoothly scale up and fade in (parallax/scroll-linked feeling).
4. Build the dynamic tracking timeline UI (Pending -> Verified -> WIP -> Resolved) based on the `status` field of each report.
5. Update `App.tsx` routing to point `/dashboard` to `DashboardScreen` and `/report` to `ReportScreen`.
</action>
<acceptance_criteria>
- Dashboard fetches and displays reports from the backend.
- Scrolling reveals advanced staggered framer motion pop-up animations.
- Tracking timeline accurately reflects the `status` of the database record.
</acceptance_criteria>
</task>

## must_haves
- [ ] Camera input explicitly uses `capture="environment"` to block gallery uploads.
- [ ] Backend routes strictly require the `access_token` cookie.
- [ ] Dashboard features highly polished, industry-level scroll animations.
