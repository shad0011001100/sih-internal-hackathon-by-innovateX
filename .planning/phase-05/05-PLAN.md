---
wave: 5
depends_on: ["Phase 4"]
files_modified:
  - backend/routers/admin.py
  - backend/main.py
  - frontend/src/features/official/OfficialDashboard.tsx
  - frontend/src/App.tsx
autonomous: true
---

# Phase 5: University & Funder Portals

## Objective
Implement the high-level dashboard for Verifiers, Universities, and Officials. While citizens report issues, the officials need a data-dense, role-gated view to see all system reports, verify their AI spam scores, view their geo-tags, and transition their workflow statuses (Pending -> Verified -> WIP -> Resolved) so that citizens see real-time updates on their tracking screens.

## Verification Criteria
- `GET /api/admin/reports` returns all system reports, strictly gated to users with the `verifier`, `official`, or `admin` role.
- `POST /api/admin/reports/{id}/status` allows officials to update the status of a report.
- `OfficialDashboard.tsx` provides a sleek, Framer Motion-animated data grid/list view of all reports, color-coded by AI spam confidence.
- `App.tsx` routes automatically redirect users to either the Citizen Dashboard or the Official Dashboard based on their authenticated role.

## Tasks

<task>
<id>1</id>
<title>Admin Backend Routes (Role-Based Access Control)</title>
<type>execute</type>
<read_first>
- backend/routers/reports.py
</read_first>
<action>
1. Create `backend/routers/admin.py`.
2. Implement a `get_official_user` dependency that wraps `get_current_user` but strictly throws a 403 Forbidden if the user's role is `citizen`.
3. Add `GET /api/admin/reports`: Returns all reports in the database, ordered by newest first.
4. Add `POST /api/admin/reports/{report_id}/status`: Accepts a new status (`verified`, `wip`, `resolved`) and updates the database row.
5. Register the router in `backend/main.py`.
</action>
<acceptance_criteria>
- Admin routes exist and are mathematically secured against citizen access.
- Status updates successfully persist to PostgreSQL.
</acceptance_criteria>
</task>

<task>
<id>2</id>
<title>Build Official Dashboard (React UI)</title>
<type>execute</type>
<read_first>
- frontend/src/features/citizen/DashboardScreen.tsx
</read_first>
<action>
1. Create `frontend/src/features/official/OfficialDashboard.tsx`.
2. Build a data-dense, professional UI displaying incoming reports.
3. For each report, display the `category`, `description`, `gps_lat`/`gps_lon`, and the `ai_spam_score` (render as a colored pill: Green for >0.8, Yellow for >0.5, Red for <0.5).
4. Add action buttons for the official to mathematically transition the state (e.g., "Mark Verified", "Start WIP", "Resolve").
5. Wire these buttons to call `POST /api/admin/reports/{id}/status` and instantly re-fetch the list.
6. Wrap the UI in smooth Framer Motion list animations (`staggerChildren` and `layout` animations for list reordering).
</action>
<acceptance_criteria>
- The UI is professional, psychologically satisfying, and displays critical AI verification data.
- Officials can successfully transition state, which will immediately update the Citizen's tracking timeline.
</acceptance_criteria>
</task>

<task>
<id>3</id>
<title>Role-Based Routing System</title>
<type>execute</type>
<read_first>
- frontend/src/App.tsx
- frontend/src/store/authStore.ts
</read_first>
<action>
1. Update `frontend/src/App.tsx`.
2. Inspect the Zustand `role` from `useAuthStore`.
3. If the user hits `/dashboard` and their role is `official` or `verifier`, redirect them to `/official-dashboard`.
4. If a `citizen` tries to hit `/official-dashboard`, aggressively bounce them back to `/dashboard`.
</action>
<acceptance_criteria>
- Client-side routing perfectly matches the backend RBAC constraints.
- UX remains seamless with Framer Motion `AnimatePresence` during redirects.
</acceptance_criteria>
</task>

## must_haves
- [ ] Strict Backend Role Validation (Never trust the client).
- [ ] Visual AI Triage Indicators (The Official UI must show the AI's confidence score to save human review time).
- [ ] Fluid State Transitions (When an official clicks "Resolve", the item smoothly animates its state change).
