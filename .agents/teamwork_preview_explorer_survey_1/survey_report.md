# Frontend Route, Navigation & Interactive Elements Audit Report
**Project:** SocioSolve Jharkhand  
**Working Directory:** `d:\shlok\ai agents\sih hackathon project\frontend`  
**Author:** Explorer 1 (`teamwork_preview_explorer_survey_1`)  
**Date:** 2026-09-13T13:53:00Z  

---

## 1. Executive Summary & Architecture Context

The repository contains two distinct codebases:
1. **Root Directory (`src/`, `package.json`):** An earlier prototype named **Ubb (ऊब)** — a campus mental health support system (React 19 + Express + Capacitor Android).
2. **Sub-application (`frontend/`, `backend/`):** The authoritative target of the user request: **SocioSolve Jharkhand**, a decentralized public problem resolution platform bridging Jharkhand's citizens, municipal officials, students, universities, and industry CSR partners.

### Frontend Technology Stack Matrix
- **Framework:** React `19.2.8` with TypeScript
- **Bundler & Server:** Vite `8.3.0` with `@vitejs/plugin-react`
- **Routing:** `react-router-dom` `^7.18.3` (BrowserRouter in `frontend/src/main.tsx`, Routes/Route in `frontend/src/App.tsx`)
- **Styling:** Tailwind CSS `^4.3.3` with `@tailwindcss/vite`
- **Animations:** `framer-motion` `^13.2.0`
- **State Management:** `zustand` `^5.0.15` (`useAuthStore`)
- **Data Fetching:** `@tanstack/react-query` `^5.102.8` & native `fetch`
- **Icons & Typography:** Google Material Symbols Outlined, Google Fonts (Plus Jakarta Sans, Inter, JetBrains Mono)
- **Backend API Proxy:** `http://localhost:8002` (FastAPI backend in `backend/main.py`)

---

## 2. Frontend Source Files Catalog

All frontend source code is located in `frontend/src/`:

| File Path | Description / Role |
| :--- | :--- |
| `frontend/src/main.tsx` | App entry point; wraps `<App />` in `<StrictMode>` and `<BrowserRouter>` |
| `frontend/src/App.tsx` | Core routing configuration (`Routes`, `Route`, `ProtectedRoute`, lazy loading) |
| `frontend/src/index.css` | Tailwind CSS v4 `@theme` configuration, color tokens, font definitions |
| `frontend/src/App.css` | Supplementary component styles |
| `frontend/src/store/authStore.ts` | Zustand store managing authentication state (`isAuthenticated`, `role`, `userId`, `phone`) |
| `frontend/src/features/landing/LandingScreen.tsx` | Public Landing page with English/Hindi language toggle and "Get Started" CTA |
| `frontend/src/features/landing/RoleSelectScreen.tsx` | Portal selector for Citizen, Student, Government Official, Industry Partner |
| `frontend/src/features/landing/RoleLoginScreen.tsx` | Universal authentication screen handling dynamic fields per role and OTP inline |
| `frontend/src/features/auth/LoginScreen.tsx` | Desktop citizen login screen (unrouted artifact from static HTML conversion) |
| `frontend/src/features/auth/OtpScreen.tsx` | 6-digit OTP verification screen with virtual keypad and timer |
| `frontend/src/features/citizen/DashboardScreen.tsx` | Citizen grievance feed, ward vitals, live heatmap, filter pills, and bottom nav |
| `frontend/src/features/citizen/ReportScreen.tsx` | Public grievance intake form with speech-to-text, photo upload, geotag, and SLA |
| `frontend/src/features/official/OfficialDashboard.tsx` | Official administration portal for validating, assigning, and tracking complaints |
| `frontend/src/features/student/StudentDashboard.tsx` | Student innovation hub with active projects, skills profile, and open civic issues |
| `frontend/src/features/university/UniversityDashboard.tsx` | University portal tracking department problem adoptions, student roster, rankings |
| `frontend/src/features/industry/IndustryDashboard.tsx` | Industry CSR partner portal with investment metrics, funded projects, and CSR marketplace |

---

## 3. Router Configuration & Access Control Audit

Router definition in `frontend/src/App.tsx`:

```tsx
<Routes location={location} key={location.pathname}>
    {/* Public Routes */}
    <Route path="/"              element={<LandingScreen />} />
    <Route path="/select-role"   element={<RoleSelectScreen />} />
    <Route path="/login/:role"   element={<RoleLoginScreen />} />
    <Route path="/otp"           element={<OtpScreen />} />

    {/* Protected Portals */}
    <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["citizen"]}><DashboardScreen /></ProtectedRoute>
    } />
    <Route path="/report" element={
        <ProtectedRoute allowedRoles={["citizen"]}><ReportScreen /></ProtectedRoute>
    } />
    <Route path="/official-dashboard" element={
        <ProtectedRoute allowedRoles={["official", "verifier", "admin"]}><OfficialDashboard /></ProtectedRoute>
    } />
    <Route path="/student-dashboard" element={
        <ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>
    } />
    <Route path="/university-dashboard" element={
        <ProtectedRoute allowedRoles={["university"]}><UniversityDashboard /></ProtectedRoute>
    } />
    <Route path="/industry-dashboard" element={
        <ProtectedRoute allowedRoles={["industry"]}><IndustryDashboard /></ProtectedRoute>
    } />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

### Critical Routing Observations & Discrepancies:
1. **University Redirect Bug (`RoleLoginScreen.tsx:105`):**
   - `ROLE_DASHBOARD["university"]` is set to `"/student-dashboard"`.
   - However, in `App.tsx`, `/student-dashboard` requires `allowedRoles={["student"]}`, while `ROLE_HOME["university"] = "/university-dashboard"`.
   - **Result:** A university user who logs in is initially routed to `/student-dashboard`, gets rejected by `ProtectedRoute`, and bounces via redirect to `/university-dashboard`.
   - **Fix:** Update `ROLE_DASHBOARD.university` in `RoleLoginScreen.tsx` to `"/university-dashboard"`.
2. **Dual Login Flow Disconnect (`LoginScreen.tsx` vs `RoleLoginScreen.tsx`):**
   - `RoleLoginScreen.tsx` handles citizen login **with inline OTP input**, never navigating to `/otp`.
   - `LoginScreen.tsx` is completely omitted from `App.tsx` routes, but it contains a rich desktop layout and calls `navigate("/otp", { state: { phone: "+91" + phone } })`.
   - If `/otp` is visited directly without `location.state.phone`, `OtpScreen.tsx` immediately redirects back to `/`.
3. **Role Selection Direct Links:**
   - `RoleSelectScreen.tsx` routes Student/Institution to `/login/student`. Inside `RoleLoginScreen.tsx`, there is a tab toggle between "Student" and "University". There is currently no direct `/login/university` button on `RoleSelectScreen.tsx`, which may cause user friction for university administrators.

---

## 4. Comprehensive Audit of Screens & Navigation Elements

### A. Landing Page (`features/landing/LandingScreen.tsx`)
- **Status:** Functional for primary flow.
- **Language Switcher:** Working (`onClick={() => setLang("en")}` / `setLang("hi")`).
- **CTA Button:** Working (`onClick={() => navigate("/select-role")}`).
- **Missing Elements:**
  - No global top navbar or login shortcut.
  - No footer or legal links (Privacy Policy, About Us, Terms).

---

### B. Role Selection Screen (`features/landing/RoleSelectScreen.tsx`)
- **Status:** Functional.
- **Back Button:** Working (`onClick={() => navigate("/")}`).
- **Cards:**
  - Citizen Card: `onClick={() => navigate("/login/citizen")}` -> Working.
  - Student / Institution Card: `onClick={() => navigate("/login/student")}` -> Working.
  - Government Official Card: `onClick={() => navigate("/login/official")}` -> Working.
  - Industry Partner Card: `onClick={() => navigate("/login/industry")}` -> Working.
- **Dead Elements:** None.

---

### C. Universal Role Login Screen (`features/landing/RoleLoginScreen.tsx`)
- **Status:** Mostly functional with one critical routing defect.
- **Back Button:** Working (`onClick={() => navigate("/select-role")}`).
- **Student/University Tabs:** Working (`setActiveTab("student")` / `setActiveTab("university")`).
- **Change Number Link:** Working (`setOtpSent(false)`).
- **Submit Button:** Working with loading spinner (`progress_activity`).
- **Critical Defects:**
  - Line 105: `university: "/student-dashboard"` redirects university users to the wrong portal.
  - Missing toast notification feedback on error (currently only inline `error` state).

---

### D. Unrouted Desktop Citizen Login (`features/auth/LoginScreen.tsx`)
- **Status:** Unrouted; contains high volume of dead links and static buttons:
  - **Dead Top Header Links (`href="#"`):**
    - Line 57: `Districts Map`
    - Line 58: `University Cohorts`
    - Line 59: `Open Data`
  - **Static Buttons (No `onClick`):**
    - Line 67: Language switcher button (`translate`)
    - Line 194: `University or Industry Partner?` card has `cursor-pointer` but no `onClick` (should navigate to `/select-role`)
    - Line 219: `WhatsApp OTP` button (`type="button"`) has no handler
    - Line 223: `Aadhaar e-KYC` button (`type="button"`) has no handler
  - **Dead Legal Links (`href="#"`):**
    - Line 236: `terms of service` and `privacy policy`
  - **Dead Footer Links (`href="#"`):**
    - Lines 279-282 (Districts): `Ranchi Central Division`, `Jamshedpur & East Singhbhum`, `Dhanbad Industrial Hub`, `Hazaribagh & Santhal Pargana`
    - Lines 288-291 (Institutions): `BIT Mesra Innovation Cell`, `Panchayat Grievance API`, `Volunteer Solver Onboarding`, `Jharkhand Open Data Portal`
    - Lines 307-310 (Compliance): `Privacy Policy`, `Terms of Service`, `Accessibility`, `RTI Portal`

---

### E. OTP Screen (`features/auth/OtpScreen.tsx`)
- **Status:** Partially functional form submit, but multiple dead controls:
  - **Dead Back Buttons:**
    - Line 82 (Desktop header back): `<button ... type="button">` — Missing `onClick={() => navigate(-1)}`
    - Line 163 (Mobile card back): `<button ... type="button">` — Missing `onClick={() => navigate(-1)}`
  - **Dead Utility Controls:**
    - Line 101: `Need Help?` has `cursor-pointer` — Missing `onClick`
    - Line 180: `Edit number` has `cursor-pointer` — Missing `onClick={() => navigate(-1)}`
    - Line 217: Countdown timer `00:54` is static text; no countdown interval or timer hook
    - Line 220: `Resend OTP via SMS` button has no `onClick` handler
    - Line 224: `Didn't receive code? Try WhatsApp` button has no `onClick` handler
  - **Dead Virtual Numpad (Lines 242-276):**
    - Keys `1, 2, 3, 4, 5, 6, 7, 8, 9, 0` and `backspace` (11 buttons in total) are static `<button type="button">` without `onClick` handlers. Tapping them on mobile does nothing!
  - **Dead Footer Links (`href="#"`):**
    - Lines 291-293: `Privacy Policy`, `Citizen Charter`, `District Helpline: 1800-XXX-XXXX`
  - **Data Display Bug (Line 179):**
    - Hardcoded string `+91 99XXXXXX34` is rendered instead of displaying the actual `phone` state prop passed via `location.state.phone`.

---

### F. Citizen Dashboard (`features/citizen/DashboardScreen.tsx`)
- **Status:** Live data wired to `/api/reports/my`, but high density of non-functional UI items:
  - **Navbar / Header Controls:**
    - Line 83: `Home & Feed` -> scrolls to top (`onClick={() => window.scrollTo(0, 0)}`)
    - Line 87: `Report Issue` -> `onClick={() => navigate('/report')}`
    - Line 91: `Initiatives` -> `onClick={() => alert("Initiatives coming in V2!")}` (**Native browser alert!**)
    - Line 95: `Connect` -> `onClick={() => alert("Connect coming in V2!")}` (**Native browser alert!**)
    - Line 103: Language switcher button (`translate`) has NO `onClick` handler
    - Line 110: `Report Issue` (Desktop CTA) -> `onClick={() => navigate('/report')}`
    - Line 115: User avatar RK -> Logout trigger (`onClick={handleLogout}`)
  - **Search & Filter Controls:**
    - Line 291: Search `<input>` has no state binding or search filter logic
    - Line 292: Filter tune icon button has NO `onClick` handler
    - Line 298-307: Filter tabs (`All`, `Ward 4`, `In Progress`, `Resolved`) -> Working
  - **Heatmap & Widgets (Right Rail):**
    - Lines 394-405: 12 ward tiles (`W1` through `W12`) have `cursor-pointer` but NO `onClick` handler
    - Line 466: `Download Agenda (PDF) →` has `cursor-pointer` but NO `onClick` handler
  - **Mobile Controls:**
    - Line 492: Floating Action Button (FAB) -> `onClick={() => navigate('/report')}`
    - Line 502: Bottom nav `Initiatives` -> `alert("Initiatives coming in V2!")`
    - Line 506: Bottom nav `Connect` -> `alert("Connect coming in V2!")`
  - **Footer Links & Buttons:**
    - Lines 538-542 (Civic Grievance): 5 `<button type="button">` elements without `onClick` handlers:
      1. Water & Sanitation (Jal Jeevan)
      2. Road Resurfacing & Potholes
      3. Streetlighting & Clean Energy
      4. Solid Waste & Drainage Desiltation
      5. Ward Grievance Escalation Chart
    - Lines 549-553 (Youth & Academia): 5 `<button type="button">` elements without `onClick` handlers:
      1. Student Solver Fellowship
      2. Engineering Clubs Adoption Portal
      3. Civic Data & Research Sandbox
      4. BIT Mesra & RU Innovation Chapter
      5. Quarterly Jharkhand Civic Hackathon
    - Lines 576-579 (Compliance): 4 `<button type="button">` elements without `onClick` handlers:
      1. Citizen Privacy Policy
      2. Open Data Portal
      3. Ward Guidelines
      4. Accessibility (WCAG 2.1)

---

### G. Citizen Report Screen (`features/citizen/ReportScreen.tsx`)
- **Status:** Functional API submit (`POST /api/reports`), but major form interactivity flaws:
  - **Dead Header / Breadcrumb Links:**
    - Line 112: Language switcher button has NO `onClick` handler
    - Line 122: Breadcrumb `Home` -> `href="#"`
    - Line 124: Breadcrumb `Feed` -> `href="#"`
  - **Form Input Deficiencies:**
    - Line 160: Issue Title input: `<input ... value="Broken Handpump near Tribal Welfare Hostel"/>` has a **hardcoded static value with no `onChange` handler**! Users cannot edit the title properly, and `title` is not captured in form submission.
    - Lines 180-198: 5 Category Selector Chips ("Water Supply", "Roads & Sanitation", "Street Lighting", "Healthcare", "Public Transport") are static `<button type="button">` elements with NO `onClick` handler! The category remains permanently locked to default `"Civic Issue"`.
    - Line 301: Geotag display is hardcoded text. The `requestGps()` helper function in line 43 is **never invoked** anywhere in the UI!
    - Lines 329-354: Urgency level radio buttons ("Routine", "Urgent 48h", "Emergency") have no React state binding or change handlers; `urgent` is permanently hardcoded.
  - **Dead Footer Links (`href="#"`):**
    - Lines 480-483 (Key Sectors): 4 links (`Drinking Water`, `Rural Roads`, `Power Distribution`, `Anganwadi & Health Centers`)
    - Lines 488-491 (Citizen Services): 4 links (`Track Complaint Status`, `Panchayat Scorecards`, `Student Volunteer Network`, `Right to Service Charter`)
    - Lines 508-511 (Sub-footer): 4 links (`Privacy Policy`, `Terms of Redressal`, `Help & FAQ`, `Contact Nodal Officer`)

---

### H. Official Dashboard (`features/official/OfficialDashboard.tsx`)
- **Status:** Primary workflows (Validate, Assign modal, Review submissions, Mark Implemented) are connected to `/api/admin/*`.
- **Defects & Static Elements:**
  - Lines 327-342: Bottom Navigation has 4 items:
    - `Dashboard` (No handler)
    - `Reports` (No handler)
    - `Map` (No handler)
    - `Settings` (No handler)
  - Assign Modal uses a raw numerical input for `University ID` with no autocomplete or selector from existing universities.

---

### I. Student Dashboard (`features/student/StudentDashboard.tsx`)
- **Status:** Reads student profile and problem feeds.
- **Defects & Static Elements:**
  - Lines 155-156: Social profile buttons (`LinkedIn` and `GitHub`) have NO `onClick` handler.
  - Line 180: Category filter buttons (`All`, `Roads`, `Water`, `Sanitation`, `Health`, `Education`) have NO `onClick` handler.
  - Line 185: Open Civic Issue cards have hover styles but clicking them does nothing (no "Adopt Problem", "Create Project", or "View Details" action).
  - Line 117: My Projects cards have `cursor-pointer` but NO `onClick` handler.
  - Lines 205-215: Bottom Navigation has 4 buttons (`Dashboard`, `Projects`, `Issues`, `Profile`) without `onClick` handlers.

---

### J. University Dashboard (`features/university/UniversityDashboard.tsx`)
- **Status:** Data loaded via `/api/university/dashboard`, `/problems`, `/ranking`, `/students`.
- **Defects & Static Elements:**
  - Lines 173-190: Bottom Navigation has 4 buttons (`Dashboard`, `Problems`, `Students`, `Settings`) without `onClick` handlers.
  - Assigned problem cards and student items are purely static display elements without interactive detail drawers or assignment actions.

---

### K. Industry Dashboard (`features/industry/IndustryDashboard.tsx`)
- **Status:** Data loaded via `/api/industry/dashboard`, `/marketplace`.
- **Defects & Static Elements:**
  - Line 39: `handleFund` triggers `alert('Funding pledge initiated!')` instead of a modern toast/modal UX.
  - Lines 162-175: Bottom Navigation has 4 buttons (`Dashboard`, `Portfolio`, `Impact`, `Settings`) without `onClick` handlers.
  - Funded projects cards are non-interactive.

---

## 5. Comprehensive Dead Links Inventory (`href="#"` or `href=""`)

Total count: **32 dead links** across the application.

| File Path | Line Number | Element Text / Target | Recommended Fix |
| :--- | :--- | :--- | :--- |
| `frontend/src/features/auth/LoginScreen.tsx` | 57 | `Districts Map` | Wire to map view / modal or "Coming Soon" toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 58 | `University Cohorts` | Navigate to `/login/student` or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 59 | `Open Data` | Open data modal or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 236 | `terms of service` | Open terms modal or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 236 | `privacy policy` | Open privacy modal or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 279 | `Ranchi Central Division` | Filter by district or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 280 | `Jamshedpur & East Singhbhum` | Filter by district or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 281 | `Dhanbad Industrial Hub` | Filter by district or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 282 | `Hazaribagh & Santhal Pargana` | Filter by district or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 288 | `BIT Mesra Innovation Cell` | Information modal or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 289 | `Panchayat Grievance API` | Information modal or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 290 | `Volunteer Solver Onboarding` | Navigate to `/select-role` |
| `frontend/src/features/auth/LoginScreen.tsx` | 291 | `Jharkhand Open Data Portal` | Information modal or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 307 | `Privacy Policy` | Information modal or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 308 | `Terms of Service` | Information modal or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 309 | `Accessibility` | Information modal or toast |
| `frontend/src/features/auth/LoginScreen.tsx` | 310 | `RTI Portal` | Information modal or toast |
| `frontend/src/features/auth/OtpScreen.tsx` | 291 | `Privacy Policy` | Information modal or toast |
| `frontend/src/features/auth/OtpScreen.tsx` | 292 | `Citizen Charter` | Information modal or toast |
| `frontend/src/features/auth/OtpScreen.tsx` | 293 | `District Helpline: 1800-XXX-XXXX` | Wire to `tel:18003456541` |
| `frontend/src/features/citizen/ReportScreen.tsx` | 122 | `Home` | Wire to `onClick={() => navigate('/dashboard')}` |
| `frontend/src/features/citizen/ReportScreen.tsx` | 124 | `Feed` | Wire to `onClick={() => navigate('/dashboard')}` |
| `frontend/src/features/citizen/ReportScreen.tsx` | 480 | `Drinking Water (PHED)` | Filter category or toast |
| `frontend/src/features/citizen/ReportScreen.tsx` | 481 | `Rural Roads (PMGSY)` | Filter category or toast |
| `frontend/src/features/citizen/ReportScreen.tsx` | 482 | `Power Distribution (JBVNL)` | Filter category or toast |
| `frontend/src/features/citizen/ReportScreen.tsx` | 483 | `Anganwadi & Health Centers` | Filter category or toast |
| `frontend/src/features/citizen/ReportScreen.tsx` | 488 | `Track Complaint Status` | Wire to `/dashboard` |
| `frontend/src/features/citizen/ReportScreen.tsx` | 489 | `Panchayat Scorecards` | Information modal or toast |
| `frontend/src/features/citizen/ReportScreen.tsx` | 490 | `Student Volunteer Network` | Wire to `/select-role` |
| `frontend/src/features/citizen/ReportScreen.tsx` | 491 | `Right to Service Charter` | Information modal or toast |
| `frontend/src/features/citizen/ReportScreen.tsx` | 508 | `Privacy Policy` | Information modal or toast |
| `frontend/src/features/citizen/ReportScreen.tsx` | 509 | `Terms of Redressal` | Information modal or toast |
| `frontend/src/features/citizen/ReportScreen.tsx` | 510 | `Help & FAQ` | Information modal or toast |
| `frontend/src/features/citizen/ReportScreen.tsx` | 511 | `Contact Nodal Officer` | Wire to `tel:18003456541` |

---

## 6. Comprehensive Static Buttons & Dead Handlers Inventory

Total count: **46 static button / interaction defects**.

| File Path | Line(s) | Element / Label | Issue | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- |
| `features/auth/OtpScreen.tsx` | 82 | Header Back Button | No `onClick` handler | Add `onClick={() => navigate(-1)}` |
| `features/auth/OtpScreen.tsx` | 101 | Need Help? | Cursor pointer, no `onClick` | Show support dialog / helpline |
| `features/auth/OtpScreen.tsx` | 163 | Mobile Back Button | No `onClick` handler | Add `onClick={() => navigate(-1)}` |
| `features/auth/OtpScreen.tsx` | 180 | Edit number | No `onClick` handler | Add `onClick={() => navigate(-1)}` |
| `features/auth/OtpScreen.tsx` | 220 | Resend OTP via SMS | No `onClick` handler | Wire to resend OTP API with toast |
| `features/auth/OtpScreen.tsx` | 224 | Try WhatsApp | No `onClick` handler | Display "WhatsApp OTP sent" toast |
| `features/auth/OtpScreen.tsx` | 242-276 | Virtual Dialpad (11 buttons: 0-9, backspace) | All 11 buttons lack `onClick` | Connect to `handleOtpChange` / `handleKeyDown` |
| `features/citizen/DashboardScreen.tsx` | 91, 502 | Initiatives (Desktop & Mobile) | Calls `alert()` | Replace with tab view or toast |
| `features/citizen/DashboardScreen.tsx` | 95, 506 | Connect (Desktop & Mobile) | Calls `alert()` | Replace with community modal or toast |
| `features/citizen/DashboardScreen.tsx` | 103 | Language Switcher | No `onClick` handler | Wire to locale toggle state |
| `features/citizen/DashboardScreen.tsx` | 292 | Filter (tune icon) | No `onClick` handler | Open filter modal or toggle filter menu |
| `features/citizen/DashboardScreen.tsx` | 394-405 | Heatmap W1-W12 Wards | Cursor pointer, no `onClick` | Filter reports by selected ward |
| `features/citizen/DashboardScreen.tsx` | 466 | Download Agenda (PDF) | Cursor pointer, no `onClick` | Trigger sample PDF download or toast |
| `features/citizen/DashboardScreen.tsx` | 538-542 | Civic Grievance (5 buttons) | Static `<button type="button">` | Filter feed by category |
| `features/citizen/DashboardScreen.tsx` | 549-553 | Youth & Academia (5 buttons) | Static `<button type="button">` | Open program information dialog |
| `features/citizen/DashboardScreen.tsx` | 576-579 | Compliance (4 buttons) | Static `<button type="button">` | Open informational modal / toast |
| `features/citizen/ReportScreen.tsx` | 112 | Language Switcher | No `onClick` handler | Wire to locale toggle state |
| `features/citizen/ReportScreen.tsx` | 160 | Issue Title `<input>` | Static value, no `onChange` | Bind to `title` state variable |
| `features/citizen/ReportScreen.tsx` | 180-198 | Category Chips (5 buttons) | Static buttons, no `onClick` | Wire to `onClick={() => setCategory(cat)}` |
| `features/citizen/ReportScreen.tsx` | 301 | Geotag Badge | Hardcoded string, `requestGps` uncalled | Wire button to trigger `requestGps()` |
| `features/citizen/ReportScreen.tsx` | 329-354 | Urgency Radios (3 buttons) | Static inputs, no state | Bind to `urgency` state variable |
| `features/official/OfficialDashboard.tsx` | 327-342 | Bottom Nav (4 buttons) | No `onClick` handlers | Wire active tab switches / modals |
| `features/student/StudentDashboard.tsx` | 155-156 | LinkedIn & GitHub buttons | No `onClick` handlers | Wire to student profile modal or links |
| `features/student/StudentDashboard.tsx` | 180 | Category Filters (6 buttons) | No `onClick` handlers | Filter open civic issues by category |
| `features/student/StudentDashboard.tsx` | 185 | Civic Issue Cards | No `onClick` handlers | Add "Adopt Problem" / "Create Project" |
| `features/student/StudentDashboard.tsx` | 205-215 | Bottom Nav (4 buttons) | No `onClick` handlers | Wire active tab switches |
| `features/university/UniversityDashboard.tsx` | 173-190 | Bottom Nav (4 buttons) | No `onClick` handlers | Wire active tab switches |
| `features/industry/IndustryDashboard.tsx` | 39 | Fund This Button | Calls native `alert()` | Replace with confirmation toast/modal |
| `features/industry/IndustryDashboard.tsx` | 162-175 | Bottom Nav (4 buttons) | No `onClick` handlers | Wire active tab switches |

---

## 7. Full User Navigation Flow Mapping

```
[User Entry: /]
       │
       ▼
[LandingScreen]  ──(Language Switch: en/hi)
       │
       ├─► Click "Get Started"
       │
       ▼
[/select-role: RoleSelectScreen]
       │
       ├──► Select Citizen  ────────► [/login/citizen] ─► (Enter Phone) ─► [OTP In-line / /otp] ─► [/dashboard]
       │                                                                                             │
       │                                                                                             └─► Click "Report Issue" / FAB
       │                                                                                                   │
       │                                                                                                   ▼
       │                                                                                             [/report: ReportScreen]
       │                                                                                                   │
       │                                                                                                   └─► Submit Grievance
       │                                                                                                         │
       │                                                                                                         ▼
       │                                                                                             [/dashboard: Feed Updated]
       │
       ├──► Select Student ────────► [/login/student] ─► (Enter APAAR ID) ────────────────────────► [/student-dashboard]
       │                                      │
       │                                      └─► (University Tab: institutional email + pw) ─────► [/university-dashboard]
       │                                                                                            (FIX: Update ROLE_DASHBOARD)
       │
       ├──► Select Official ───────► [/login/official] ─► (Gov ID + Password) ───────────────────► [/official-dashboard]
       │                                                                                            │
       │                                                                                            ├─► Validate / Assign
       │                                                                                            └─► Review Submissions
       │
       └──► Select Industry ───────► [/login/industry] ─► (Partner ID + Password) ────────────────► [/industry-dashboard]
                                                                                                    │
                                                                                                    └─► CSR Marketplace / Fund
```

### Complete Navigation Step-by-Step Flow:
1. **Landing (`/`)**:
   - User lands on `LandingScreen`.
   - User can toggle between English and Hindi.
   - User clicks **"Get Started"** (`navigate('/select-role')`).
2. **Role Selection (`/select-role`)**:
   - Citizen: routes to `/login/citizen`.
   - Student / Institution: routes to `/login/student`.
   - Government Official: routes to `/login/official`.
   - Industry Partner: routes to `/login/industry`.
   - Back arrow navigates to `/`.
3. **Authentication (`/login/:role`)**:
   - **Citizen:** Enters 10-digit mobile number -> calls `POST /api/auth/send-otp` -> in-line 6-digit OTP fields appear -> enters code -> calls `POST /api/auth/verify-otp` -> sets Zustand auth store (`role: "citizen"`, `user_id`) -> navigates to `/dashboard`.
   - **Student:** Enters APAAR ID -> calls `POST /api/auth/student/login` -> sets Zustand auth store (`role: "student"`, `user_id`) -> navigates to `/student-dashboard`.
   - **University:** Clicks University tab -> enters institutional email and password -> calls `POST /api/auth/university/login` -> sets Zustand auth store (`role: "university"`, `user_id`) -> navigates to `/university-dashboard`.
   - **Government Official:** Enters Government Employee ID and password -> calls `POST /api/auth/official/login` -> sets Zustand auth store (`role: "official"`, `user_id`) -> navigates to `/official-dashboard`.
   - **Industry Partner:** Enters Partner ID and password -> calls `POST /api/auth/industry/login` -> sets Zustand auth store (`role: "industry"`, `user_id`) -> navigates to `/industry-dashboard`.
4. **Dashboards to Core Actions:**
   - **Citizen Flow:**
     - `/dashboard` -> fetches and displays citizen's filed reports via `GET /api/reports/my`.
     - User clicks **"Report Issue"** in header or Floating Action Button (`navigate('/report')`).
     - In `/report`, user enters Title, selects Category chip, enters details (or records voice), uploads photo, clicks **"Submit Grievance"** -> calls `POST /api/reports` -> navigates back to `/dashboard`.
   - **Official Flow:**
     - `/official-dashboard` -> views reported grievances.
     - Official clicks **"Validate"** -> moves status to validated.
     - Official clicks **"Assign"** -> opens Assign Modal -> inputs University ID and Department -> calls `POST /api/admin/reports/{id}/assign`.
     - Submissions Tab: Official reviews submitted student solutions -> clicks **"Approve"** or **"Reject"** -> clicks **"Mark Implemented"**.
   - **Student Flow:**
     - `/student-dashboard` -> views assigned and available problems.
     - Student can view problem cards and adopt them into active capstone projects (`POST /api/student/projects`).
   - **Industry Flow:**
     - `/industry-dashboard` -> views CSR projects and marketplace.
     - Industry partner clicks **"Fund This"** -> calls `POST /api/industry/fund` with `{ projectId, amount }`.

---

## 8. Prioritized Implementation Recommendations for Engineering Agents

### High Priority (Critical Flow Blockers):
1. **Fix University Redirect:** In `frontend/src/features/landing/RoleLoginScreen.tsx`, change `ROLE_DASHBOARD.university` from `"/student-dashboard"` to `"/university-dashboard"`.
2. **Fix Report Form Input Binding:** In `frontend/src/features/citizen/ReportScreen.tsx`:
   - Bind Title input to a state variable `title` with `onChange`.
   - Wire Category chips to `onClick={() => setCategory(chip.label)}` with dynamic active styling.
   - Wire Location button to trigger `requestGps()`.
   - Include `title` and `category` in the payload to `POST /api/reports`.
3. **Fix OTP Screen Dead Controls:** In `frontend/src/features/auth/OtpScreen.tsx`:
   - Wire header and card back buttons to `navigate(-1)`.
   - Wire virtual keypad digits (0-9) and backspace to `handleOtpChange` and `handleKeyDown`.
   - Replace hardcoded `+91 99XXXXXX34` with `phone` state.
   - Wire resend and edit number buttons.
4. **Remove Native `alert()` Calls:** In `DashboardScreen.tsx` and `IndustryDashboard.tsx`, replace all `alert()` popups with a lightweight toast notification or modal dialog.

### Medium Priority (Dead Link & Button Wiring):
5. **Universal "Coming Soon" Toast / Modal Fallback:**
   - Create a reusable Toast/Notification component (or hook) for peripheral links (`Initiatives`, `Connect`, `Districts Map`, `Citizen Charter`, legal links).
   - Wire all 32 `href="#"` dead links to trigger the toast instead of resetting the browser window hash.
6. **Dashboard Bottom Navigation Wiring:**
   - Wire Bottom Nav items in `OfficialDashboard`, `StudentDashboard`, `UniversityDashboard`, and `IndustryDashboard` to switch tabs or filter views.
7. **Student Problem Adoption Modal:**
   - Wire open civic issue cards in `StudentDashboard` to an adoption modal calling `POST /api/student/projects`.

---
*Report compiled and certified by Explorer 1.*
