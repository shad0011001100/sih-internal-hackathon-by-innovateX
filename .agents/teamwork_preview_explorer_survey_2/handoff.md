# Handoff Report — Role Dashboards & Form Interactivity Audit
**Explorer 2 Investigation** • SocioSolve Jharkhand  
**Working Directory**: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_2`  
**Date**: September 13, 2026  
**Type**: Hard Handoff (Task complete)

---

### 1. Observation

1. **Dashboard Locations & Architecture**:
   - The primary application under audit is located in `frontend/src/` (Vite, React 19, React Router v7, Zustand, Framer Motion, Tailwind CSS v4).
   - The 5 dashboard screen components are:
     - Citizen: `frontend/src/features/citizen/DashboardScreen.tsx` (590 lines) and `frontend/src/features/citizen/ReportScreen.tsx` (520 lines)
     - Official: `frontend/src/features/official/OfficialDashboard.tsx` (370 lines)
     - Student: `frontend/src/features/student/StudentDashboard.tsx` (220 lines)
     - Industry: `frontend/src/features/industry/IndustryDashboard.tsx` (178 lines)
     - University: `frontend/src/features/university/UniversityDashboard.tsx` (194 lines)
   - Backend APIs are defined in `backend/routers/`:
     - `reports.py` (`POST /api/reports`, `GET /api/reports/my`)
     - `admin.py` (`GET /api/admin/reports`, `POST /api/admin/reports/{id}/status`, `POST /api/admin/reports/{id}/assign`, `GET /api/admin/submissions`, `POST /api/admin/submissions/{id}/review`, `POST /api/admin/submissions/{id}/implement`)
     - `students.py` (`GET /api/student/dashboard`, `GET /api/student/problems`, `POST /api/student/projects`, `PUT /api/student/projects/{id}`, `POST /api/student/projects/{id}/submit`, `GET/PUT /api/student/skill-profile`, `PUT /api/student/profile`)
     - `industry.py` (`GET /api/industry/dashboard`, `GET /api/industry/marketplace`, `POST /api/industry/fund`, `GET /api/industry/portfolio`)
     - `feedback.py` (`POST /api/reports/{id}/feedback`, `GET /api/reports/{id}/feedback`)

2. **Citizen Portal Observations**:
   - `ReportScreen.tsx:160`: `<input ... id="issue-title" value="Broken Handpump near Tribal Welfare Hostel"/>` has hardcoded `value` with no `onChange`. In `onSubmit` (`ReportScreen.tsx:59-70`), `title` is not captured or passed to backend.
   - `ReportScreen.tsx:180-199`: All 5 category buttons lack `onClick` handlers. `category` state is never updated from its initial `"Civic Issue"`.
   - `ReportScreen.tsx:301-304`: Geotag display is hardcoded text. `requestGps()` defined at line 43 is never called or bound to any button.
   - `ReportScreen.tsx:122,124`: Breadcrumb links `<a href="#">` are dead links.
   - `ReportScreen.tsx:480-512`: 16 footer links are dead `href="#"`.
   - `DashboardScreen.tsx:291`: Search bar input has no `value` or `onChange` handler; search is dead.
   - `DashboardScreen.tsx:91,95,502,506`: Four buttons use intrusive browser `alert(...)` popups.
   - `DashboardScreen.tsx:538-580`: 14 footer buttons are dead `<button type="button">` with no handlers.
   - `DashboardScreen.tsx:318-376`: Report cards lack an upvote button and status timeline detail modal.

3. **Official Portal Observations**:
   - `OfficialDashboard.tsx:135-143`: Report status transitions (`Validate`, `Assign`, `Start Work`, `Send to Review`, `Implement`) are wired to `POST /api/admin/reports/{id}/status`.
   - `OfficialDashboard.tsx:311-316`: Submission actions (`Reject`, `Approve`, `Mark Implemented`) are wired to `POST /api/admin/submissions/{id}/review` and `/implement`.
   - `OfficialDashboard.tsx:327-342`: All 4 bottom navigation buttons (`Dashboard`, `Reports`, `Map`, `Settings`) lack `onClick` handlers.

4. **Student Portal Observations**:
   - `StudentDashboard.tsx:180`: All 6 category buttons (`['All', 'Roads', 'Water', ...]`) have no `onClick` handlers; issues list cannot be filtered.
   - `StudentDashboard.tsx:185`: Issue cards are static containers; no "Adopt Problem" or "Form Team" button exists, leaving backend `POST /api/student/projects` unused.
   - `StudentDashboard.tsx:117`: Project cards are static (`cursor-pointer` but no `onClick`). Students cannot update progress, add docs/prototype URLs, or submit projects (`PUT /api/student/projects/{id}` and `POST /api/student/projects/{id}/submit`).
   - `StudentDashboard.tsx:142`: "Browse Problems" empty state button has no `onClick`.
   - `StudentDashboard.tsx:205-216`: All 4 bottom navigation buttons have no `onClick`.

5. **Industry Portal Observations**:
   - `IndustryDashboard.tsx:34-40`: `handleFund` sends `{ projectId, amount }` to `POST /api/industry/fund`.
   - `backend/routers/industry.py:16-21`: `FundingOfferCreate` requires `offer_type: str` (mandatory, no default) and `project_id: Optional[int] = None`. Because `offer_type` is omitted and `projectId` is camelCase, the request fails with HTTP 422 Unprocessable Entity.
   - `IndustryDashboard.tsx:39`: Funding success uses browser `alert('Funding pledge initiated!')`.
   - `IndustryDashboard.tsx:163-174`: All 4 bottom navigation buttons have no `onClick`.

---

### 2. Logic Chain

1. **Static and Dead Elements**:
   - In `ReportScreen.tsx`, line 160 (`input id="issue-title"`) and lines 180-199 (category chips) have no state bindings or handlers. Therefore, user interaction has no effect, violating R1.
   - Multiple `href="#"` tags in `ReportScreen.tsx` and unhandled `<button type="button">` elements in `DashboardScreen.tsx` violate Acceptance Criterion 1.

2. **Missing Interactivity & Backend Alignment**:
   - In `StudentDashboard.tsx`, the primary user story (student browsing civic problems and proposing solutions) is broken because there are no action buttons on problem cards. However, `backend/routers/students.py` lines 90-120 already provides `POST /api/student/projects`. Wiring an "Adopt Problem" modal bridges this gap directly, satisfying R2.
   - In `IndustryDashboard.tsx`, calling `handleFund` results in an HTTP 422 error due to schema mismatch (`projectId` vs `project_id`, missing `offer_type`). Aligning the payload with `FundingOfferCreate` restores complete end-to-end functionality.

3. **Production UX and Graceful Fallbacks (R3 & R4)**:
   - Native `alert()` calls in `DashboardScreen.tsx` and `IndustryDashboard.tsx` degrade UX.
   - Installing/implementing a unified Toast provider enables replacing all `alert()` calls, handling API errors, and cleanly servicing peripheral buttons (Map, Settings, Initiatives, Connect, Policy links) with "Coming Soon" toasts per R4.

---

### 3. Caveats

- Investigation was strictly read-only; no code files were modified.
- The project has a root `src/` directory containing an unrelated or legacy prototype (`UbbAppRoot` / Marathi labels). The active application specified by the user request ("SocioSolve web application") is definitively located under `frontend/`.
- Mock fallback data exists in `catch()` blocks in several dashboards (e.g. `StudentDashboard.tsx:18-32`), allowing screens to render even when the backend is offline.
- Ward filtering on `DashboardScreen.tsx` is currently mocked as `activeTab === "Ward 4"` returning `true` because `models.Report` does not have an explicit `ward_number` column.

---

### 4. Conclusion

All role-specific dashboards and their sub-components have been completely cataloged in `survey_report.md`. Every button, form input, tab switcher, and action trigger has been classified into Core vs Peripheral, with exact line numbers and root causes identified:
- **Core Priority Fixes**:
  1. Fix `ReportScreen.tsx` title input, category chip handlers, GPS trigger, and submission payload.
  2. Fix `IndustryDashboard.tsx:34` payload bug (`project_id`, `offer_type: "funding"`) and replace `alert()`.
  3. Wire `StudentDashboard.tsx` category filter, "Adopt Problem" creation modal (`POST /api/student/projects`), and project edit/submit modal.
  4. Wire `DashboardScreen.tsx` search input to filter feed reports in real time.
- **Peripheral Priority Fixes**:
  1. Implement a lightweight Toast system to handle "Coming Soon" fallbacks.
  2. Wire all bottom navigation bars across Citizen, Official, Student, and Industry dashboards.
  3. Wire peripheral footer and header buttons to "Coming Soon" toasts.

---

### 5. Verification Method

To independently verify the observations:
1. **Dead `href="#"` check**:
   ```bash
   grep -rn 'href="#"' frontend/src/
   ```
   Matches will be found in `frontend/src/features/citizen/ReportScreen.tsx` lines 122, 124, 480-483, 488-491, 508-511.
2. **Dead button check**:
   Inspect `DashboardScreen.tsx:538-580`, `StudentDashboard.tsx:180,205-216`, and `OfficialDashboard.tsx:327-342` to confirm missing `onClick` attributes.
3. **ReportScreen Title & Category bug inspection**:
   Open `frontend/src/features/citizen/ReportScreen.tsx` and inspect lines 160 (`value="..."` without `onChange`), lines 180-199 (category buttons with no `onClick`), and lines 62-68 (payload omitting title).
4. **Industry 422 verification**:
   Inspect `frontend/src/features/industry/IndustryDashboard.tsx:34-40` vs `backend/routers/industry.py:16-21`. Notice `FundingOfferCreate` expects `offer_type: str` and `project_id: Optional[int]`, while frontend sends `{ projectId, amount }`.
