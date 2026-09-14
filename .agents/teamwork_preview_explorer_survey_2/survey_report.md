# Role-Specific Dashboard & Form Interactivity Audit Report
**Explorer 2 Investigation** • SocioSolve Jharkhand Frontend & Backend Sync  
**Location**: `d:\shlok\ai agents\sih hackathon project`  
**Date**: September 13, 2026

---

## 1. Executive Summary

A comprehensive audit of the SocioSolve React/Vite frontend (`frontend/src/features/`) and FastAPI backend (`backend/routers/`) was conducted. The application features four primary role dashboards (`citizen`, `official`, `student`, `industry`), plus a companion `university` dashboard.

While several core workflows have backend routes already implemented in FastAPI (`backend/routers/`), many frontend UI elements remain either:
1. **Completely static / dead**: missing `onClick`, missing `onChange`, or unhandled forms.
2. **Disconnected from backend endpoints**: backend routes exist (e.g., student adopting problems, student submitting projects, citizen leaving feedback), but have zero UI triggers.
3. **Broken by schema mismatch or browser alerts**: e.g., the Industry funding action sends `projectId` instead of `project_id` and omits mandatory `offer_type`, causing HTTP 422 errors, and relies on crude `alert()` calls rather than toast notifications.
4. **Dead `href="#"` links**: prominent in breadcrumbs and footer navigation across dashboards.

### Classification Taxonomy
- **Core Features**: Must be connected to the FastAPI backend or interactive local state (search, filters, tabs, forms, problem adoption, status updates).
- **Peripheral Features**: Outside hackathon MVP scope (static legal policies, external helpline links, complex multi-tier analytics) — must be wired to a clean "Coming Soon" toast message per requirement R4 rather than left dead or throwing browser alerts.

---

## 2. Citizen Dashboard & Report Screen Audit

### 2.1 Component Files
- `frontend/src/features/citizen/DashboardScreen.tsx` (590 lines)
- `frontend/src/features/citizen/ReportScreen.tsx` (520 lines)

### 2.2 DashboardScreen.tsx Element Catalog

| Line | Element / Tag | Visual Label / Role | Current Handler / Attribute | State / Connectivity | Classification | Issue / Required Fix |
|---|---|---|---|---|---|---|
| 83 | `<button>` | "Home & Feed" | `onClick={() => window.scrollTo(0,0)}` | Local scroll | **Core** | Functional (scrolls to top). |
| 87 | `<button>` | "Report Issue" | `onClick={() => navigate('/report')}` | React Router | **Core** | Functional. |
| 91 | `<button>` | "Initiatives" | `onClick={() => alert("Initiatives coming in V2!")}` | Browser alert | **Peripheral** | Replace `alert()` with clean "Coming Soon" toast. |
| 95 | `<button>` | "Connect" | `onClick={() => alert("Connect coming in V2!")}` | Browser alert | **Peripheral** | Replace `alert()` with clean "Coming Soon" toast. |
| 103 | `<button>` | Language ("EN / हिन्दी") | None (missing `onClick`) | None | **Peripheral** | Static button. Wire language state toggle or "Hindi language support coming soon" toast. |
| 110 | `<button>` | "Report Issue" (Desktop CTA) | `onClick={() => navigate('/report')}` | React Router | **Core** | Functional. |
| 115 | `<div>` | "RK" (Avatar / Logout) | `onClick={handleLogout}` | `/api/auth/logout` + zustand | **Core** | Functional. |
| 276 | `<a>` | "Call 1913 Toll-Free" | `href="tel:1913"` | Native tel | **Core** | Functional native phone link. |
| 291 | `<input>` | Search Bar | None (no `value`, no `onChange`) | Missing state | **Core** | **BUG: Static/Uncontrolled input.** Bind to `searchQuery` state and filter `reports` in real time. |
| 292 | `<button>` | Filter Button (`tune` icon) | None (missing `onClick`) | None | **Peripheral** | Dead icon button. Wire to toggle quick-filter dropdown or show toast. |
| 298 | `<button>` | Tab: "All Issues" | `onClick={() => setActiveTab('All')}` | `activeTab` state | **Core** | Functional. |
| 301 | `<button>` | Tab: "My Ward (Ward 4)" | `onClick={() => setActiveTab('Ward 4')}` | `activeTab` state | **Core** | Filter currently hardcoded as `return true;`. Filter by `gps` or ward attribute. |
| 304 | `<button>` | Tab: "In Progress" | `onClick={() => setActiveTab('In Progress')}` | `activeTab` state | **Core** | Functional (`r.status === 'in_progress'`). |
| 307 | `<button>` | Tab: "Resolved" | `onClick={() => setActiveTab('Resolved')}` | `activeTab` state | **Core** | Functional (`r.status === 'resolved'`). |
| 318-376 | `<article>` | Feed Issue Cards | Read-only display | Fetch `/api/reports/my` | **Core** | **MISSING FEATURES:**<br>1. No upvote/vote button on issue cards.<br>2. No status tracking modal / timeline view.<br>3. No "Leave Feedback" button on resolved tickets (`POST /api/reports/{id}/feedback`). |
| 394-405| `<div>` | Heatmap Wards (W1 - W12) | None (`cursor-pointer` only) | None | **Peripheral** | Static clickable divs. Wire to filter feed by ward or show "Ward status: X issues" toast. |
| 466 | `<span>` | "Download Agenda (PDF) →" | None (`cursor-pointer` only) | None | **Peripheral** | Static text. Wire to show "Ward Agenda PDF Coming Soon" toast. |
| 482 | `<a>` | Tribal Voice Helpline | `href="tel:18005486423"` | Native tel | **Core** | Functional native phone link. |
| 492 | `<button>` | Mobile FAB ("+") | `onClick={() => navigate('/report')}` | React Router | **Core** | Functional. |
| 498 | `<button>` | Mobile Nav: "Home" | `onClick={() => window.scrollTo(0, 0)}` | Local scroll | **Core** | Functional. |
| 502 | `<button>` | Mobile Nav: "Initiatives" | `onClick={() => alert("Initiatives coming in V2!")}` | Browser alert | **Peripheral** | Replace `alert()` with clean toast. |
| 506 | `<button>` | Mobile Nav: "Connect" | `onClick={() => alert("Connect coming in V2!")}` | Browser alert | **Peripheral** | Replace `alert()` with clean toast. |
| 538-542| `<button>` | Footer Civic Grievance (5 links) | `type="button"`, no `onClick` | None | **Peripheral** | 5 dead buttons. Wire to category filter shortcuts or "Section Coming Soon" toast. |
| 549-553| `<button>` | Footer Youth & Academia (5 links)| `type="button"`, no `onClick` | None | **Peripheral** | 5 dead buttons. Wire to "Coming Soon" toast. |
| 576-579| `<button>` | Footer Policy & Guidelines (4 links)| `type="button"`, no `onClick` | None | **Peripheral** | 4 dead buttons. Wire to modal or "Coming Soon" toast. |

---

### 2.3 ReportScreen.tsx Element Catalog

| Line | Element / Tag | Visual Label / Role | Current Handler / Attribute | State / Connectivity | Classification | Issue / Required Fix |
|---|---|---|---|---|---|---|
| 93 | `<button>` | Back Arrow | `onClick={() => navigate('/dashboard')}`| React Router | **Core** | Functional. |
| 112 | `<button>` | Language ("English / हिन्दी") | None (missing `onClick`) | None | **Peripheral** | Static button. Wire language toggle or toast. |
| 122 | `<a>` | Breadcrumb "Home" | `href="#"` | None | **Core** | **DEAD LINK (`href="#"`).** Replace with `onClick={() => navigate('/dashboard')}`. |
| 124 | `<a>` | Breadcrumb "Feed" | `href="#"` | None | **Core** | **DEAD LINK (`href="#"`).** Replace with `onClick={() => navigate('/dashboard')}`. |
| 160 | `<input>` | "1. Issue Title" | `value="Broken Handpump near Tribal Welfare Hostel"` | Hardcoded string! | **Core** | **CRITICAL BUG: Hardcoded static `value` without `onChange`.** User cannot type new title. Input is completely omitted from `onSubmit` payload. |
| 180-199| `<button>` | Category Chips (5 chips) | `type="button"` (no `onClick`) | Hardcoded styling | **Core** | **CRITICAL BUG: All 5 category buttons have NO `onClick`.** `category` state is stuck on default `"Civic Issue"` and never updates on click. |
| 219 | `<button>` | Voice Complaint Mic | `onClick={handleMic}` | Web Speech API | **Core** | Functional. Records audio transcript into description. |
| 259 | `<textarea>`| "3. Written Description" | `value={description} onChange={...}` | `description` state | **Core** | Functional. |
| 282 | `<input>` | File Upload (`id="media-upload"`) | `onChange={handleFile}` | Base64 FileReader | **Core** | Functional. Reads file to `photo` state. |
| 301 | `<div>` | Geotag Badge | Hardcoded coordinates string in JSX | Disconnected | **Core** | **BUG: `requestGps()` is defined at line 43 but NEVER called or bound to any trigger.** GPS remains `null` when submitted unless auto-called. |
| 315 | `<button>` | Remove Photo Button | `onClick={(e) => { e.preventDefault(); setPhoto(null); }}` | `photo` state | **Core** | Functional. |
| 329-354| `<input>` | Priority Radios (3 options) | `name="urgency"`, no `onChange` | React warning | **Core / Supporting** | Static inputs with `checked=""` triggering React warnings. Bind to `urgency` state and append to description or payload. |
| 369 | `<button>` | "Submit Grievance" | `onClick={onSubmit} disabled={loading}` | `POST /api/reports` | **Core** | Form submits, but misses title and category selection unless fixed. |
| 480-483| `<a>` | Key Sectors (4 links) | `href="#"` | None | **Peripheral** | 4 dead `href="#"` links. Wire to toast. |
| 488-491| `<a>` | Citizen Services (4 links) | `href="#"` | None | **Peripheral** | 4 dead `href="#"` links. Wire to toast. |
| 508-511| `<a>` | Legal & Support (4 links) | `href="#"` | None | **Peripheral** | 4 dead `href="#"` links. Wire to toast. |

---

## 3. Official Dashboard Audit

### 3.1 Component File
- `frontend/src/features/official/OfficialDashboard.tsx` (370 lines)

### 3.2 OfficialDashboard.tsx Element Catalog

| Line | Element / Tag | Visual Label / Role | Current Handler / Attribute | State / Connectivity | Classification | Issue / Required Fix |
|---|---|---|---|---|---|---|
| 165 | `<button>` | Logout Button | `onClick={handleLogout}` | `/api/auth/logout` + zustand | **Core** | Functional. |
| 175 | `<button>` | Main Tab: "Reports" | `onClick={() => setActiveTab(tab)}` | `activeTab` state | **Core** | Functional. Fetches `/api/admin/reports`. |
| 175 | `<button>` | Main Tab: "Submissions" | `onClick={() => setActiveTab(tab)}` | `activeTab` state | **Core** | Functional. Fetches `/api/admin/submissions`. |
| 217 | `<button>` | Filter Tabs (7 filters) | `onClick={() => setFilter(t)}` | `filter` state | **Core** | Functional. Filters reports list locally by status. |
| 135 | `<button>` | Action: "Validate" | `onClick={() => updateReportStatus(report.id, 'validated')}` | `POST /api/admin/reports/{id}/status` | **Core** | Functional status pipeline transition. |
| 137 | `<button>` | Action: "Assign" | `onClick={() => { setSelectedReportId(report.id); setShowAssignModal(true); }}` | Modal state | **Core** | Functional. Opens Assign Modal. |
| 139 | `<button>` | Action: "Start Work" | `onClick={() => updateReportStatus(report.id, 'in_progress')}` | Status API | **Core** | Functional. |
| 141 | `<button>` | Action: "Send to Review" | `onClick={() => updateReportStatus(report.id, 'under_review')}` | Status API | **Core** | Functional. |
| 143 | `<button>` | Action: "Implement" | `onClick={() => updateReportStatus(report.id, 'implemented')}` | Status API | **Core** | Functional. |
| 297 | `<a>` | Submission "Docs" | `href={sub.documentation_url}` | External link | **Core** | Functional when URL present. |
| 302 | `<a>` | Submission "Prototype" | `href={sub.prototype_url}` | External link | **Core** | Functional when URL present. |
| 311 | `<button>` | Submission: "Reject" | `onClick={() => reviewSubmission(sub.id, 'reject')}` | `POST /api/admin/submissions/{id}/review` | **Core** | Functional. Sets status back to `draft`. |
| 312 | `<button>` | Submission: "Approve" | `onClick={() => reviewSubmission(sub.id, 'approve')}` | `POST /api/admin/submissions/{id}/review` | **Core** | Functional. Sets project to `accepted` and report to `under_review`. |
| 316 | `<button>` | Submission: "Mark Implemented"| `onClick={() => implementProject(sub.id)}` | `POST /api/admin/submissions/{id}/implement` | **Core** | Functional. Sets project to `completed` and report to `implemented`. |
| 327 | `<button>` | Bottom Nav: "Dashboard" | None (missing `onClick`) | None | **Core** | **DEAD BUTTON.** Wire to `setActiveTab('Reports')` and scroll to top. |
| 331 | `<button>` | Bottom Nav: "Reports" | None (missing `onClick`) | None | **Core** | **DEAD BUTTON.** Wire to `setActiveTab('Reports')`. |
| 335 | `<button>` | Bottom Nav: "Map" | None (missing `onClick`) | None | **Peripheral** | **DEAD BUTTON.** Wire to "GIS Ward Map Coming Soon" toast. |
| 339 | `<button>` | Bottom Nav: "Settings" | None (missing `onClick`) | None | **Peripheral** | **DEAD BUTTON.** Wire to "Official Portal Settings Coming Soon" toast. |
| 350 | `<form>` | Assign University Form | `onSubmit={assignReport}` | `POST /api/admin/reports/{id}/assign` | **Core** | Functional submission. |
| 353 | `<input>` | University ID | `value={universityId} onChange={...}` | `universityId` state | **Core** | Functional. (UX improvement: convert manual numeric ID to a `<select>` dropdown of universities). |
| 357 | `<input>` | Department | `value={department} onChange={...}` | `department` state | **Core** | Functional. |
| 360 | `<button>` | Assign Modal "Cancel" | `onClick={() => setShowAssignModal(false)}` | Modal state | **Core** | Functional. |
| 361 | `<button>` | Assign Modal "Assign" | `type="submit"` | Form submit | **Core** | Functional. |

---

## 4. Student Dashboard Audit

### 4.1 Component File
- `frontend/src/features/student/StudentDashboard.tsx` (220 lines)

### 4.2 StudentDashboard.tsx Element Catalog

| Line | Element / Tag | Visual Label / Role | Current Handler / Attribute | State / Connectivity | Classification | Issue / Required Fix |
|---|---|---|---|---|---|---|
| 76 | `<button>` | Logout Button | `onClick={handleLogout}` | `/api/auth/logout` + zustand | **Core** | Functional. |
| 117 | `<div>` | My Projects Cards | `className="... cursor-pointer"` (no `onClick`) | Static click | **Core** | **MISSING FEATURE: Projects cannot be opened or managed.** Students cannot update progress, add docs/prototype links (`PUT /api/student/projects/{id}`), or click "Submit to Government" (`POST /api/student/projects/{id}/submit`). Needs modal. |
| 142 | `<button>` | "Browse Problems" (Empty state) | None (missing `onClick`) | None | **Core** | **DEAD BUTTON.** Wire to scroll down to Open Civic Issues section. |
| 155 | `<button>` | Skill LinkedIn Button | None (missing `onClick`) | None | **Peripheral** | Dead button. Open `userData?.linkedin_url` or show "Edit Profile" modal/toast. |
| 156 | `<button>` | Skill GitHub Button | None (missing `onClick`) | None | **Peripheral** | Dead button. Open `userData?.github_url` or show "Edit Profile" modal/toast. |
| 180 | `<button>` | Category Filter Tabs (6 tabs) | None (missing `onClick`) | Hardcoded styling | **Core** | **CRITICAL BUG: All 6 category buttons have NO `onClick`.** Always highlights 'All'. Does NOT filter open civic issues. |
| 185 | `<div>` | Open Civic Issue Cards | `className="... hover:border-primary/50"` (no `onClick` or action) | Disconnected | **Core** | **CRITICAL MISSING WORKFLOW:** Students can see open problems but CANNOT adopt them or form a team! Backend has `POST /api/student/projects` specifically for this. Add an "Adopt Problem / Propose Solution" button and modal. |
| 205-216| `<button>` | Bottom Nav (4 tabs: Dashboard, Projects, Issues, Profile) | None (missing `onClick`) | Hardcoded `active: true` | **Core / Peripheral** | **ALL 4 ARE DEAD BUTTONS.**<br>- `Dashboard`: scroll top<br>- `Projects`: scroll to My Projects<br>- `Issues`: scroll to Open Issues<br>- `Profile`: toast "Profile Settings Coming Soon" |

---

## 5. Industry Dashboard Audit

### 5.1 Component File
- `frontend/src/features/industry/IndustryDashboard.tsx` (178 lines)

### 5.2 IndustryDashboard.tsx Element Catalog

| Line | Element / Tag | Visual Label / Role | Current Handler / Attribute | State / Connectivity | Classification | Issue / Required Fix |
|---|---|---|---|---|---|---|
| 75 | `<button>` | Logout Button | `onClick={handleLogout}` | `/api/auth/logout` + zustand | **Core** | Functional. |
| 150 | `<button>` | "Fund This" Button | `onClick={() => handleFund(item.id, item.estCost)}` | Calls `handleFund` | **Core** | **CRITICAL BUGS:**<br>1. API payload error: sends `{ projectId, amount }`, but backend `FundingOfferCreate` requires `offer_type: str` (mandatory, no default in FastAPI!) and `project_id: Optional[int] = None`. FastAPI returns **HTTP 422 Unprocessable Entity**.<br>2. Shows browser `alert('Funding pledge initiated!')` instead of toast.<br>3. Does not update local `fundedProjects` list or stats on success. |
| N/A | Missing | "Post Innovation Challenge" / Sponsorship | None | None | **Peripheral / Core** | DISPATCH specifies "Industry Dashboard (sponsorship, challenge posting, partnerships)". Adding a "Post Challenge / Sponsor Fund" CTA with a "Coming Soon: Industry Challenge Portal" toast per R4 satisfies this requirement cleanly. |
| 163-174| `<button>` | Bottom Nav (4 tabs: Dashboard, Portfolio, Impact, Settings) | None (missing `onClick`) | Hardcoded `active: true` | **Core / Peripheral** | **ALL 4 ARE DEAD BUTTONS.**<br>- `Dashboard`: active tab<br>- `Portfolio`: fetch `/api/industry/portfolio` or toggle view<br>- `Impact`: toast "Impact Metrics Coming Soon"<br>- `Settings`: toast "Settings Coming Soon" |

---

## 6. Companion: University Dashboard Audit

### 6.1 Component File
- `frontend/src/features/university/UniversityDashboard.tsx` (194 lines)

### 6.2 Overview of Interactive Elements
- Header Logout: Line 67 `<button onClick={handleLogout}>` — Functional.
- Stats & Lists: Department Activity, Leaderboard, Students — Read-only API rendering.
- Bottom Nav: Lines 174-188 (`Dashboard`, `Problems`, `Students`, `Settings`) — **ALL 4 ARE DEAD BUTTONS without `onClick`**. Wire navigation / toasts.

---

## 7. Global Deficiencies & Systemic Findings

### 7.1 Absence of Toast Notification System (R3 & R4 Violation)
- `package.json` in `frontend` currently lacks a toast library (`sonner`, `react-hot-toast`).
- Buttons throughout the app use either disruptive native `alert(...)` popups (e.g., `DashboardScreen.tsx:91,95`, `IndustryDashboard.tsx:39`) or console errors.
- **Recommendation**: Create a lightweight, high-performance Toast system (or Zustand toast store + floating container) providing `toast.success()`, `toast.error()`, and `toast.info("Coming Soon: ...")`.

### 7.2 Dead Navigation Links (`href="#"` and Unhandled Buttons)
- Grep confirms multiple `<a href="#">` tags in `ReportScreen.tsx` (breadcrumbs: lines 122, 124; footer: lines 480-512) and dead `<button type="button">` elements in `DashboardScreen.tsx` (footer: lines 538-580).
- All must either route cleanly via `react-router-dom` or fire a graceful "Coming Soon" toast per Acceptance Criteria.

### 7.3 Disconnected Endpoints in Backend Ready for Wiring
The following FastAPI backend routes are already built and tested, but currently have **zero connection** in the frontend:
1. `POST /api/reports/{id}/feedback`: Submitting 1-5 star citizen rating and comments on implemented reports.
2. `POST /api/student/projects`: Creating a student project for an open problem statement.
3. `PUT /api/student/projects/{id}`: Updating student project details, progress %, documentation URL, and prototype URL.
4. `POST /api/student/projects/{id}/submit`: Submitting student project for official government review.
5. `GET /api/industry/portfolio`: Retrieving historical funding offers and statuses.

---

## 8. Prioritized Implementation Roadmap for Teamwork Developers

### Phase 1: Core Form Fixes & Bug Patches (Highest Priority)
1. **`ReportScreen.tsx`**:
   - Add `title` state, bind to `<input id="issue-title">`, and include in `onSubmit` payload.
   - Fix 5 Category Selector Chips: wire `onClick={() => setCategory(chip.name)}` and dynamic active class.
   - Fix GPS Auto-lock: call `requestGps()` on mount or add an interactive "Detect Location" button.
   - Bind Priority / Urgency radio buttons to local state and remove invalid `checked=""`.
   - Replace dead breadcrumbs (`href="#"`) with `navigate('/dashboard')`.
2. **`IndustryDashboard.tsx`**:
   - Fix `handleFund` payload: send `{ project_id: projectId, offer_type: 'funding', amount }` to prevent HTTP 422.
   - Replace `alert()` with a toast notification and optimistically update metrics.

### Phase 2: Complete the Civic Innovation Pipeline (Student & Citizen)
1. **`StudentDashboard.tsx`**:
   - Wire Category Filter buttons (`All`, `Roads`, `Water`, etc.) to filter `openIssues`.
   - Add an "Adopt Problem" button to each issue card opening a modal to invoke `POST /api/student/projects`.
   - Add an "Edit / Submit" modal on project cards to invoke `PUT /api/student/projects/{id}` and `POST /api/student/projects/{id}/submit`.
   - Wire "Browse Problems" empty state button to smooth-scroll to Open Issues.
2. **`DashboardScreen.tsx`**:
   - Bind search bar input to state and filter reports feed by description and category.
   - Add an upvote button on report cards (with local count increment).
   - Add feedback button on resolved cards to call `POST /api/reports/{id}/feedback`.

### Phase 3: Polish UX & Fallback Coverage (R3 & R4)
1. Install or implement a lightweight Toast Provider.
2. Wire all bottom navigation bars across Citizen, Official, Student, and Industry dashboards to either switch views or trigger "Coming Soon" toasts.
3. Wire all peripheral footer links and buttons to clean "Coming Soon" notifications.
