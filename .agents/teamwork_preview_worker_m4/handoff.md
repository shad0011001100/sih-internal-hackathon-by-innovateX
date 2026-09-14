# Handoff Report — Milestone M4: Citizen Portal & Grievance Flow

## 1. Observation
- **Initial State Analysis**:
  - `frontend/src/features/citizen/ReportScreen.tsx`:
    - Line 160: `<input ... value="Broken Handpump near Tribal Welfare Hostel"/>` was a static unchangeable value with no `onChange` handler.
    - Lines 180-199: Category chips had hardcoded active styling on "Water Supply" and lacked `onClick` event handlers.
    - Line 43: `requestGps()` was defined in code but never invoked by any button in the UI.
    - Lines 122, 124, 480-483, 488-491, 508-511: Exactly 14 dead anchor links with `href="#"` existed across breadcrumbs and footer sections.
    - Line 18: Native browser `alert()` was used for speech recognition errors.
  - `frontend/src/features/citizen/DashboardScreen.tsx`:
    - Line 291: Search bar `<input ... />` had no `value` or `onChange` handler; search was non-functional.
    - Lines 91, 95, 502, 506: Native browser `alert("Initiatives coming in V2!")` and `alert("Connect coming in V2!")` were invoked directly.
    - Lines 23-33: `fetch("/api/reports/my")` lacked try/catch and swallowed errors silently with `.catch(() => { setReports([]); setLoading(false); })`.
    - Report cards lacked interactive upvoting mechanisms and timeline detail inspections.
    - Lines 538-554 and 576-580: Footer buttons were inert buttons without `onClick` handlers.

- **Baseline Acceptance Verification Output**:
  - `python scripts/verify_acceptance.py --check 1`: Reported 33 dead `href="#"` links total across the project, including 14 in `src/features/citizen/ReportScreen.tsx`.
  - `python scripts/verify_acceptance.py --check 2`: Reported 59 inert buttons / alert popups across the primary screens.

- **Post-Modification Acceptance Verification Output**:
  - `npm run build`:
    ```
    vite v8.3.0 building client environment for production...
    transforming...
    ✓ 2292 modules transformed.
    dist/assets/ReportScreen-D0c8SsfG.js          33.78 kB │ gzip:   7.66 kB
    dist/assets/DashboardScreen-BMtFDA_a.js       50.14 kB │ gzip:   9.20 kB
    dist/assets/index-CxayVTY3.js                439.15 kB │ gzip: 135.93 kB
    ✓ built in 438ms
    Exit code: 0
    ```
  - `python scripts/verify_acceptance.py --check 1`: 0 dead links in `src/features/citizen/` (14 eliminated; remaining 16 are strictly in `src/features/auth/` owned by M2).
  - `python scripts/verify_acceptance.py --check 2`: 0 inert buttons and 0 native alert popups in `src/features/citizen/` (remaining defects are strictly in M2 and M5 dashboard files).
  - `python scripts/verify_acceptance.py --check 3`: 0 unhandled fetch calls in `src/features/citizen/` (all API calls in ReportScreen and DashboardScreen use try/catch with loading and error feedback).

## 2. Logic Chain
1. **ReportScreen Intake Wiring**:
   - By creating controlled state `title` and binding it to `value={title}` and `onChange={(e) => setTitle(e.target.value)}`, users can edit the grievance title dynamically, which is sent directly to `POST /api/reports` in the payload.
   - By dynamically mapping `CATEGORIES` with `onClick={() => setCategory(cat.label)}` and applying conditional primary ring/background classes, category selection is fully reactive and reflected in form submission.
   - By adding a GPS action button wired to `requestGps()`, the component queries the HTML5 Geolocation API, sets `gps` latitude and longitude, updates status text, falls back to default Ranchi Ward 4 coordinates if permission is denied, and alerts the user with toast messages.
   - By wrapping the submission in try/catch, managing `loading` and `submitting` states, dispatching `showToast(..., "success")`, and navigating via `navigate('/dashboard')`, the form lifecycle complies with R2, R3, and Check 3.
   - By converting all 14 dead breadcrumb and footer `href="#"` links into accessible buttons calling `navigate()` or `showComingSoon()`, all dead links in ReportScreen were eliminated.
2. **DashboardScreen Interactivity**:
   - By adding a controlled state `searchQuery` and filtering feed reports on `title`, `description`, `category`, and `assigned_department` in real time, citizens can search and find grievances immediately.
   - By replacing all 4 occurrences of `alert(...)` with `showComingSoon("Initiatives")` and `showComingSoon("Connect")`, the screen uses non-disruptive toast alerts.
   - By adding an upvote state tracker (`upvotes`, `upvoted`) and an interactive button on each report card, citizens can boost the priority score with visual confirmation and toast feedback.
   - By introducing a 6-step Redressal Timeline modal (`selectedReport`), citizens can inspect grievance lifecycle progress from initial logging to citizen sign-off.
   - By converting all footer buttons to trigger either filtered search or `showComingSoon()`, and wiring all fetch calls (`/api/reports/my`, fallback `/api/reports?limit=50`, and `/api/auth/logout`) inside try/catch with loading spinners and error banners, Check 2 and Check 3 criteria are satisfied.

## 3. Caveats
- No changes were made to authentication files (`src/features/auth/*`), backend routers, or other role dashboards (`OfficialDashboard`, `StudentDashboard`, etc.) as Worker M4 exclusively owns `ReportScreen.tsx` and `DashboardScreen.tsx`.
- The GPS detection gracefully falls back to Ranchi Ward 4 coordinates (`23.3297, 85.3262`) when browser geolocation permissions are denied or unavailable in headless/CI test environments.

## 4. Conclusion
Milestone M4 is complete and verified. `ReportScreen.tsx` and `DashboardScreen.tsx` are fully functional, interactive, and resilient. All 14 dead links in `ReportScreen.tsx` and all inert buttons/alerts in citizen screens have been removed. API calls manage loading and error states via `useToast()`, and production builds pass with zero errors.

## 5. Verification Method
To independently verify this milestone:
1. **Compilation**:
   ```powershell
   cd "frontend"
   npm run build
   ```
   Confirm zero compilation errors and that `ReportScreen` and `DashboardScreen` chunks compile successfully.
2. **Acceptance Verification**:
   ```powershell
   python scripts/verify_acceptance.py --check 1
   python scripts/verify_acceptance.py --check 2
   python scripts/verify_acceptance.py --check 3
   ```
   Confirm that zero findings or defects originate from `frontend/src/features/citizen/`.
