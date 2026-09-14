# Handoff Report — Explorer 1: Frontend Route & Navigation Audit

## 1. Observation
- **Root vs Subproject**: The workspace contains an earlier project `Ubb` in the root (`src/App.jsx`, `TECHNICAL_APPROACH.md`) and the authoritative target application `SocioSolve` in `frontend/` (`frontend/package.json`, `frontend/src/App.tsx`).
- **Framework & Router**: `frontend/package.json` specifies `"react": "^19.2.8"`, `"react-router-dom": "^7.18.3"`, and `"vite": "^8.3.0"`. `frontend/src/main.tsx` wraps the app in `<BrowserRouter>`.
- **Active Router Configuration (`frontend/src/App.tsx:60-109`)**:
  - Public routes: `/` (`LandingScreen`), `/select-role` (`RoleSelectScreen`), `/login/:role` (`RoleLoginScreen`), `/otp` (`OtpScreen`).
  - Protected routes: `/dashboard` (`DashboardScreen`, citizen), `/report` (`ReportScreen`, citizen), `/official-dashboard` (`OfficialDashboard`), `/student-dashboard` (`StudentDashboard`), `/university-dashboard` (`UniversityDashboard`), `/industry-dashboard` (`IndustryDashboard`).
- **University Redirect Defect (`frontend/src/features/landing/RoleLoginScreen.tsx:105`)**:
  ```ts
  const ROLE_DASHBOARD = {
      citizen: "/dashboard",
      student: "/student-dashboard",
      university: "/student-dashboard", // <-- Direct observation: line 105 maps university to /student-dashboard
      ...
  };
  ```
  While `App.tsx:24` sets `university: "/university-dashboard"` and line 95 protects `/university-dashboard` for `["university"]`, line 88 restricts `/student-dashboard` to `["student"]`.
- **Dead Links (`href="#"`)**: Ripgrep confirmed **32 occurrences** of `href="#"` across:
  - `frontend/src/features/auth/LoginScreen.tsx`: Lines 57, 58, 59, 236, 279, 280, 281, 282, 288, 289, 290, 291, 307, 308, 309, 310 (17 dead links).
  - `frontend/src/features/auth/OtpScreen.tsx`: Lines 291, 292, 293 (3 dead links).
  - `frontend/src/features/citizen/ReportScreen.tsx`: Lines 122, 124, 480, 481, 482, 483, 488, 489, 490, 491, 508, 509, 510, 511 (14 dead links, 2 breadcrumbs + 12 footer).
- **Static Buttons Without `onClick` Handlers / Dead Handlers**:
  - `OtpScreen.tsx`: Lines 82 & 163 (Back buttons lack `onClick`), line 180 (Edit number lacks `onClick`), line 220 (Resend SMS lacks `onClick`), lines 242-276 (all 11 virtual keypad buttons lack `onClick`).
  - `OtpScreen.tsx:179`: Hardcoded text `+91 99XXXXXX34` is rendered instead of dynamic phone prop.
  - `DashboardScreen.tsx`: Lines 91 & 95 (Desktop) and lines 502 & 506 (Mobile) use native `alert("Initiatives coming in V2!")` and `alert("Connect coming in V2!")`.
  - `DashboardScreen.tsx`: Lines 103 (Language switch), 292 (Filter tune icon), 394-405 (12 heatmap ward tiles), 466 (Download Agenda PDF), 538-542 (5 Civic grievance buttons), 549-553 (5 Youth & academia buttons), 576-579 (4 Compliance buttons) are static buttons without `onClick` handlers.
  - `ReportScreen.tsx`: Line 160 has a hardcoded static value `value="Broken Handpump near Tribal Welfare Hostel"` with no `onChange`; lines 180-198 (5 Category chips) have no `onClick` handlers; `requestGps()` at line 43 is never triggered.
  - `OfficialDashboard.tsx`: Lines 327-342 (4 bottom nav buttons lack `onClick`).
  - `StudentDashboard.tsx`: Lines 155-156 (LinkedIn/GitHub lack `onClick`), line 180 (Category filters lack `onClick`), line 185 (Issue cards lack `onClick`), lines 205-215 (Bottom nav lacks `onClick`).
  - `UniversityDashboard.tsx`: Lines 173-190 (Bottom nav lacks `onClick`).
  - `IndustryDashboard.tsx`: Line 39 uses native `alert()`; lines 162-175 (Bottom nav lacks `onClick`).

---

## 2. Logic Chain
1. *From Root vs `frontend/` observation:* Developing or editing files in the root `src/` directory would target the old `Ubb` application and fail the requirements of the SocioSolve specification in `ORIGINAL_REQUEST.md`. All frontend fixes must target `frontend/src/`.
2. *From Router & `RoleLoginScreen.tsx:105` observation:* When a university user submits institutional credentials via `RoleLoginScreen.tsx`, the component calls `navigate(ROLE_DASHBOARD["university"])` which sends them to `/student-dashboard`. The `ProtectedRoute` guard in `App.tsx:88` enforces `allowedRoles={["student"]}`, rejecting the university role and redirecting to `ROLE_HOME["university"]` (`/university-dashboard`). This produces an unnecessary redirect bounce.
3. *From `OtpScreen.tsx` observations:* On mobile viewports or when using the virtual numpad, tapping digits 0-9 produces zero interaction because buttons lack `onClick` triggers for `handleOtpChange`. Furthermore, back buttons are inert, stranding users on `/otp` if an incorrect number is provided.
4. *From `ReportScreen.tsx` observations:* The grievance intake form cannot record user-typed titles because the title input has a hardcoded value without `onChange`. Furthermore, category selection is visual-only because buttons lack `onClick` handlers to update `category` state, causing all submitted grievances to default to `"Civic Issue"`.
5. *From Dashboard observations:* Multiple buttons invoke `alert()` (e.g. `DashboardScreen.tsx:91,95` and `IndustryDashboard.tsx:39`), violating Requirement R3 ("Production-Grade UX: Implement robust loading states and error handling (toast notifications or inline error messages)... Graceful Fallbacks: display a clean 'Coming Soon' toast message").

---

## 3. Caveats
- The backend FastAPI server runs on port 8002 (as configured in `frontend/vite.config.ts`), while root Vite proxies port 5000. Verification of live HTTP requests requires `uvicorn backend.main:app --port 8002` to be running.
- Speech recognition in `ReportScreen.tsx` relies on `webkitSpeechRecognition`, which is browser-dependent (primarily Chrome/Edge).
- `features/auth/LoginScreen.tsx` was identified as an unrouted desktop artifact. Whether it should replace `/login/citizen` or remain unrouted is an architectural decision documented in the survey report.

---

## 4. Conclusion
The frontend application structure and core navigation spine (Landing -> Role Selection -> Role Login -> Portals) are intact and functional, but exhibit **32 dead links (`href="#"`)** and **46 static/inert button defect areas**. 
The most critical blockers are:
1. University routing redirect mismatch in `RoleLoginScreen.tsx:105`.
2. Frozen Title input and static Category buttons in `ReportScreen.tsx`.
3. Inert back buttons and disconnected virtual keypad in `OtpScreen.tsx`.
4. Native `alert()` calls on secondary navigation items.

All identified items are cataloged with exact file locations and line numbers in `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_1\survey_report.md`.

---

## 5. Verification Method
1. **Verify Dead Links (`href="#"`):**
   Run Ripgrep inside `frontend/src`:
   ```bash
   rg 'href="#"' "frontend/src"
   ```
   Confirm the 32 instances documented in Section 5 of `survey_report.md`.
2. **Verify University Redirect Target:**
   Inspect `frontend/src/features/landing/RoleLoginScreen.tsx` line 105:
   ```ts
   university: "/student-dashboard"
   ```
   Contrast with `frontend/src/App.tsx` line 24 (`university: "/university-dashboard"`).
3. **Verify Report Screen Form Inputs:**
   Inspect `frontend/src/features/citizen/ReportScreen.tsx` line 160 (`value="Broken Handpump..."` without `onChange`) and line 180 (Category chips without `onClick`).
4. **Verify OtpScreen Virtual Keypad:**
   Inspect `frontend/src/features/auth/OtpScreen.tsx` lines 242-276 (buttons without `onClick`).
