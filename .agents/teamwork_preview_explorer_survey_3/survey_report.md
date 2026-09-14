# Comprehensive Backend Architecture & Frontend API Integration Audit

**Application**: SocioSolve (Jharkhand Grassroots Public Problem Redressal Platform)  
**Auditor**: Explorer 3 (Backend API & Fetch/State Audit)  
**Date**: 2026-09-13  
**Working Directory**: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_3`  

---

## Executive Summary

This audit evaluated the architecture of the **FastAPI backend** (`/backend`) and the **React 19 + Vite frontend** (`/frontend`), analyzing all routers, database models, API clients, state stores, and UI interactions. 

### Key Findings:
1. **FastAPI Backend Structure**: The backend is well-modularized with 8 domain routers, SQLAlchemy ORM, SQLite database (`sanjha.db`), and AI integration (Gemini Flash for vision triage, NVIDIA Nemotron for civic problem routing).
2. **Frontend Architecture**: Built with React 19, Vite, Tailwind CSS v4, `react-router-dom`, and Zustand (`authStore`). It proxies `/api` requests to `http://localhost:8002`.
3. **Severe R3 Non-Compliance**:
   - **Zero toast notification system**: No toast library or context provider exists. Browser `alert()` is used inconsistently.
   - **Silent Error Swallowing**: Multiple dashboards (`StudentDashboard`, `IndustryDashboard`, `DashboardScreen`) catch network and HTTP errors and silently replace them with hardcoded mock fallback data or empty arrays without informing the user.
   - **Missing Loading & Error States**: Mutating operations (status change, assignment, submission review, project implementation, funding pledge) do not manage loading or error states.
4. **Critical Schema & Endpoint Mismatches**:
   - `UniversityDashboard`: Metric keys expected by UI (`assigned_problems_count`, `active_projects_count`, `student_participation_count`) do not match backend response keys (`assigned_reports_count`).
   - `IndustryDashboard`: Funding request sends `{ projectId, amount }` (camelCase) omitting the required `offer_type: str`, triggering a `422 Unprocessable Entity` validation failure in FastAPI. Dashboard response structure also conflicts with frontend expectations.
   - `RoleLoginScreen`: Redirects university logins to `/student-dashboard` instead of `/university-dashboard`.
5. **Authentication State Fragility**:
   - Zustand `authStore` does not persist across page refreshes.
   - No `GET /api/auth/me` endpoint exists to restore session state from the HTTP-only `access_token` cookie.
6. **Under-Utilized Backend Features**:
   - Rich student workflows (`POST /api/student/projects`, `PUT /api/student/skill-profile`, `POST /api/student/projects/{id}/submit`) and citizen feedback (`POST /api/reports/{id}/feedback`) exist in FastAPI but have zero UI trigger in the frontend.

---

## 1. FastAPI Backend Architecture Inspection

### 1.1 Directory Layout
```
backend/
├── alembic/                    # Database migration environment
│   ├── versions/
│   │   ├── 70659152b85a_initial_schema.py
│   │   └── 01c9fcca0a82_add_institution_employee_partner_id_.py
│   └── env.py
├── alembic.ini
├── database.py                 # SQLAlchemy engine & SessionLocal (SQLite fallback to sanjha.db)
├── main.py                     # FastAPI entrypoint, CORS configuration, router mounting, /api/health
├── migrate_v6.py               # Standalone database migration and seeding script
├── models.py                   # 10 SQLAlchemy ORM models
├── requirements.txt            # Dependencies (fastapi, uvicorn, sqlalchemy, etc.)
├── sanjha.db                   # Local SQLite database
├── routers/                    # 8 domain routers
│   ├── admin.py                # Official review, status workflow, university assignment
│   ├── auth.py                 # Citizen OTP auth & JWT cookie issuance
│   ├── auth_institutional.py   # Student, University, Official, Industry login endpoints
│   ├── feedback.py             # Citizen feedback submission & retrieval for implemented reports
│   ├── industry.py             # Industry dashboard, marketplace, funding offers
│   ├── reports.py              # Report creation (with AI triage) and citizen reports retrieval
│   ├── students.py             # Student dashboard, problem discovery, project/skill management
│   └── university.py           # University dashboard, problem allocation, rankings, student tracking
└── services/
    └── ai_engine.py            # Gemini 1.5 Flash (image triage) & NVIDIA Nemotron 3.5 (problem routing)
```

### 1.2 Database Models (`backend/models.py`)
The database schema defines 10 interconnected entities:
- **`User`**: Supports multi-role authentication (`citizen`, `student`, `university`, `official`, `industry`, `admin`) with `phone_number`, `apaar_id`, `email`, `employee_id`, and `password_hash`.
- **`Report`**: Citizen grievance reports with 6-stage lifecycle (`reported` → `validated` → `assigned` → `in_progress` → `under_review` → `implemented`), AI spam score, priority score, AI summary, and foreign keys to `User` and `University`.
- **`University`**: Institutional profile with department, specializations JSON, faculty expertise, and ranking score.
- **`Feedback`**: Citizen rating (1-5) and comment linked 1:1 to an implemented `Report`.
- **`Project`**: Student team capstone project linked to a `Report` with status (`draft`, `submitted`, `under_review`, `accepted`, `completed`), progress percentage, and documentation/prototype URLs.
- **`Team` & `TeamMember`**: Student groups collaborating on projects with leader/member roles.
- **`SkillProfile`**: Student verified competencies with proficiency levels and challenge demonstration counts.
- **`FundingOffer`**: Industry CSR funding and mentorship pledges for projects or reports.
- **`IndustryProfile`**: Corporate CSR metrics (budget, total invested, issues funded, success rate).

### 1.3 Pre-Seeded Accounts (`backend/migrate_v6.py`)
- **Government Official**: `employee_id`: `GOV-001`, password: `sanjha@2025`
- **Industry Partner**: `partner_id` / `employee_id`: `IND-001`, password: `sanjha@2025` (Tata Steel CSR profile)
- **University Profile**: `BIT Mesra` (Computer Science & Engineering)
- **Citizens & Students**: Auto-registered upon first login (OTP or APAAR ID).

### 1.4 Complete Backend API Endpoint Catalog

| Router | Method | Path | Auth / RBAC | Description |
|---|---|---|---|---|
| **Health** | `GET` | `/api/health` | Public | DB connectivity check |
| **Auth** | `POST` | `/api/auth/send-otp` | Public | Sends mock 6-digit OTP to phone number |
| **Auth** | `POST` | `/api/auth/verify-otp` | Public | Verifies OTP, auto-creates citizen, sets `access_token` cookie |
| **Auth** | `POST` | `/api/auth/logout` | Public | Deletes `access_token` cookie |
| **Auth Inst.** | `POST` | `/api/auth/student/login` | Public | Login via APAAR ID, auto-creates student, sets cookie |
| **Auth Inst.** | `POST` | `/api/auth/university/login` | Public | Login via institutional email & password, sets cookie |
| **Auth Inst.** | `POST` | `/api/auth/official/login` | Public | Login via Employee ID & password, sets cookie |
| **Auth Inst.** | `POST` | `/api/auth/industry/login` | Public | Login via Partner ID & password, sets cookie |
| **Auth Inst.** | `POST` | `/api/auth/admin/create-user` | Public (Admin intent) | Pre-registers official/industry accounts |
| **Reports** | `POST` | `/api/reports` | Cookie (`access_token`) | Creates report, triggers AI vision and text routing |
| **Reports** | `GET` | `/api/reports/my` | Cookie (`access_token`) | Retrieves reports submitted by logged-in citizen |
| **Feedback** | `POST` | `/api/reports/{id}/feedback` | Citizen Owner | Submits 1-5 star rating and comment for implemented report |
| **Feedback** | `GET` | `/api/reports/{id}/feedback` | Public | Retrieves feedback for a given report |
| **Admin** | `GET` | `/api/admin/reports` | Official/Admin/Univ | Lists all reports in system ordered by newest |
| **Admin** | `POST` | `/api/admin/reports/{id}/status` | Official/Admin/Univ | Transitions report status in the 6-stage lifecycle |
| **Admin** | `POST` | `/api/admin/reports/{id}/assign` | Official/Admin/Univ | Assigns report to a university & department |
| **Admin** | `GET` | `/api/admin/submissions` | Official/Admin/Univ | Lists all student projects with `status='submitted'` |
| **Admin** | `POST` | `/api/admin/submissions/{id}/review` | Official/Admin/Univ | Approves (sets report to `under_review`) or rejects project |
| **Admin** | `POST` | `/api/admin/submissions/{id}/implement` | Official/Admin/Univ | Marks project completed and report `implemented` |
| **Student** | `GET` | `/api/student/dashboard` | Student | User profile, active projects, skill count, problem counts |
| **Student** | `GET` | `/api/student/problems` | Student | Lists reports in `reported`, `validated`, `assigned` |
| **Student** | `POST` | `/api/student/projects` | Student | Creates a new Team and Project for an assigned issue |
| **Student** | `POST` | `/api/student/teams/{id}/join` | Student | Adds student as member to an existing team |
| **Student** | `GET` | `/api/student/skill-profile` | Student | Gets logged-in student's skill profile |
| **Student** | `PUT` | `/api/student/skill-profile` | Student | Bulk upserts student's skills |
| **Student** | `PUT` | `/api/student/profile` | Student | Updates student's name, LinkedIn URL, GitHub URL |
| **Student** | `PUT` | `/api/student/projects/{id}` | Student | Updates project documentation, prototype URL, progress |
| **Student** | `POST` | `/api/student/projects/{id}/submit` | Student | Submits project for government official review |
| **University** | `GET` | `/api/university/dashboard` | University | Assigned reports count, departments, active projects |
| **University** | `GET` | `/api/university/problems` | University | Reports assigned specifically to this university |
| **University** | `GET` | `/api/university/ranking` | University | Leaderboard of universities by ranking score |
| **University** | `GET` | `/api/university/students` | University | Students registered with project and skill counts |
| **Industry** | `GET` | `/api/industry/dashboard` | Industry | Corporate CSR profile and existing funding offers |
| **Industry** | `GET` | `/api/industry/marketplace` | Industry | Browse submitted projects and validated reports with cost estimates |
| **Industry** | `POST` | `/api/industry/fund` | Industry | Creates funding offer for project or report |
| **Industry** | `GET` | `/api/industry/portfolio` | Industry | Status tracker of all funding offers pledged |

---

## 2. Frontend API Clients & State Inspection

### 2.1 API Client Implementation
- **Client Type**: Raw native `fetch()` calls distributed across UI components.
- **Centralized Client**: **None exists**. There is no `axios` instance, no `apiClient.ts`, and no centralized request interceptor.
- **Data Fetching Hooks**: Even though `@tanstack/react-query` is present in `package.json`, **zero** components utilize TanStack Query hooks (`useQuery`, `useMutation`).
- **Proxy Configuration**: `frontend/vite.config.ts` proxies `/api` to `http://localhost:8002`.

### 2.2 Global Auth Store (`frontend/src/store/authStore.ts`)
```ts
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  userId: null,
  phone: null,
  setAuth: (role, userId) => set({ isAuthenticated: true, role, userId }),
  setPhone: (phone) => set({ phone }),
  logout: () => set({ isAuthenticated: false, role: null, userId: null, phone: null }),
}))
```
- **Defect**: Lacks persistence. On browser refresh, `isAuthenticated` defaults back to `false`, causing `ProtectedRoute` to immediately eject the user back to the landing page (`/`), even though a valid HTTP-only `access_token` cookie is present in the browser.

### 2.3 Toast & Notification Provider
- **Current State**: **Completely Absent**.
- **Impact**: Applications rely on either:
  1. Primitive browser modal alerts (`alert()`), which break mobile aesthetics and block execution.
  2. Inline text error strings (`error && <div>...</div>`), which are not universally implemented across screens.
  3. Silent console errors (`console.error(e)`), giving zero feedback to the user on operation success or failure.

---

## 3. R3 & R4 Compliance Audit

The table below measures each frontend component against **Requirement R3** (Try/catch wrapped, loading state, error state, toast notifications) and **Requirement R4** (Graceful "Coming Soon" fallbacks for peripheral features).

| Component / Screen | API Calls | Try/Catch? | Loading State? | Error State? | Toast System? | R3 / R4 Compliance Assessment |
|---|---|---|---|---|---|---|
| `RoleLoginScreen.tsx` | `/api/auth/*` | Yes | Yes (`loading`) | Yes (`error` banner) | No | **Partial**. Manages loading and inline error, but lacks toast system. Mismatched redirect for university. |
| `OtpScreen.tsx` | `/api/auth/verify-otp` | Yes | Yes (`loading`) | Yes (`error` banner) | No | **Partial**. Inline error only. Dialpad and secondary buttons lack handlers. |
| `DashboardScreen.tsx` (Citizen) | `GET /api/reports/my`, `POST /api/auth/logout` | Partial (`.catch`) | Yes (`loading`) | **NO** (silently sets `[]`) | No | **FAILED**. Swallows errors silently. `logout` has no error handling. Secondary buttons use raw `alert()`. |
| `ReportScreen.tsx` (Citizen) | `POST /api/reports` | Yes | Yes (`loading`) | Yes (`error` string) | No | **Partial**. Inline error only; does not display backend AI rejection reasons (`data.detail`). Voice recorder uses raw `alert()`. |
| `OfficialDashboard.tsx` | `/api/admin/reports`, `/api/admin/submissions`, `/status`, `/assign`, `/review`, `/implement` | Mixed | Only for `fetchData` | **NO** (`console.error` only) | No | **FAILED**. All action mutations (`status`, `assign`, `review`, `implement`) fail silently on error without user notification. |
| `StudentDashboard.tsx` | `/api/student/dashboard`, `/skill-profile`, `/problems` | No (Promise.all `.catch`) | Yes (`loading`) | **NO** (Swallows errors to mock data) | No | **FAILED**. Masks backend errors with hardcoded mocks. Zero mutations wired up. |
| `UniversityDashboard.tsx` | `/api/university/dashboard`, `/problems`, `/ranking`, `/students` | Yes | Yes (`loading`) | **NO** (`console.error` only) | No | **FAILED**. No error messaging. Data schema mismatch prevents metrics from rendering. |
| `IndustryDashboard.tsx` | `/api/industry/dashboard`, `/marketplace`, `/fund` | Mixed | Yes (`loading`) | **NO** (Swallows errors to mock data) | No | **FAILED**. Funding action triggers `alert()` even on failure. Schema mismatch triggers 422 error. |

---

## 4. Frontend Action vs Backend Endpoint Cross-Reference Matrix

### 4.1 Role: Citizen

| Frontend UI Action | Component & Line | Intended Endpoint | Backend Status | Schema / Wiring Compatibility |
|---|---|---|---|---|
| Send OTP | `RoleLoginScreen.tsx:153` | `POST /api/auth/send-otp` | **Working** | Compatible |
| Verify OTP & Login | `RoleLoginScreen.tsx:164` | `POST /api/auth/verify-otp` | **Working** | Compatible |
| View My Reports | `DashboardScreen.tsx:23` | `GET /api/reports/my` | **Working** | Compatible |
| Submit New Issue | `ReportScreen.tsx:59` | `POST /api/reports` | **Working** | Compatible (AI triage active) |
| Submit Feedback on Resolved Issue | **MISSING IN UI** | `POST /api/reports/{id}/feedback` | **Backend Exists** | Needs modal or card trigger in `DashboardScreen` |
| View Public Community Issues | **MISSING IN UI** | `GET /api/reports` | **MISSING IN BACKEND** | Backend must expose public reports query |
| Filter by Ward / Category | `DashboardScreen.tsx:14` | Local client filter | N/A | Ward filter is currently hardcoded mock |
| Initiatives / Connect Nav | `DashboardScreen.tsx:91, 95` | Peripheral feature | Out of scope | Currently triggers `alert()`; needs R4 "Coming Soon" toast |

### 4.2 Role: Government Official / Verifier

| Frontend UI Action | Component & Line | Intended Endpoint | Backend Status | Schema / Wiring Compatibility |
|---|---|---|---|---|
| Official Login | `RoleLoginScreen.tsx:207` | `POST /api/auth/official/login` | **Working** | Compatible with `GOV-001` / `sanjha@2025` |
| View All Civic Reports | `OfficialDashboard.tsx:31` | `GET /api/admin/reports` | **Working** | Compatible |
| Update Report Status | `OfficialDashboard.tsx:53` | `POST /api/admin/reports/{id}/status` | **Working** | Compatible |
| Assign to University & Dept | `OfficialDashboard.tsx:68` | `POST /api/admin/reports/{id}/assign` | **Working** | Compatible |
| View Student Submissions | `OfficialDashboard.tsx:35` | `GET /api/admin/submissions` | **Working** | Compatible |
| Review Submission (Approve/Reject) | `OfficialDashboard.tsx:86` | `POST /api/admin/submissions/{id}/review` | **Working** | Compatible |
| Mark Project & Issue Implemented | `OfficialDashboard.tsx:99` | `POST /api/admin/submissions/{id}/implement` | **Working** | Compatible |

### 4.3 Role: Student

| Frontend UI Action | Component & Line | Intended Endpoint | Backend Status | Schema / Wiring Compatibility |
|---|---|---|---|---|
| Student Login (APAAR ID) | `RoleLoginScreen.tsx:180` | `POST /api/auth/student/login` | **Working** | Compatible |
| View Student Dashboard | `StudentDashboard.tsx:18` | `GET /api/student/dashboard` | **Working** | Compatible (currently swallowed to mock data) |
| View Skill Profile | `StudentDashboard.tsx:25` | `GET /api/student/skill-profile` | **Working** | Compatible (currently swallowed to mock data) |
| Browse Available Problems | `StudentDashboard.tsx:29` | `GET /api/student/problems` | **Working** | Compatible (currently swallowed to mock data) |
| Create Project for Issue | `StudentDashboard.tsx:142` (Dead button) | `POST /api/student/projects` | **Backend Exists** | **MISSING IN UI**: Button lacks click handler and modal |
| Join Project Team | **MISSING IN UI** | `POST /api/student/teams/{id}/join` | **Backend Exists** | **MISSING IN UI** |
| Add / Update Skills | `StudentDashboard.tsx:150` (Static) | `PUT /api/student/skill-profile` | **Backend Exists** | **MISSING IN UI**: No dialog to edit skills |
| Edit Profile (LinkedIn/GitHub) | `StudentDashboard.tsx:155` (Static) | `PUT /api/student/profile` | **Backend Exists** | **MISSING IN UI**: Buttons have no handlers |
| Update Project Progress & Links | `StudentDashboard.tsx:117` (Static) | `PUT /api/student/projects/{id}` | **Backend Exists** | **MISSING IN UI**: Clicking project does nothing |
| Submit Project for Gov Review | **MISSING IN UI** | `POST /api/student/projects/{id}/submit` | **Backend Exists** | **MISSING IN UI**: Cannot transition to `submitted` |

### 4.4 Role: University

| Frontend UI Action | Component & Line | Intended Endpoint | Backend Status | Schema / Wiring Compatibility |
|---|---|---|---|---|
| University Login | `RoleLoginScreen.tsx:195` | `POST /api/auth/university/login` | **Working** | Bug in redirect: sends to `/student-dashboard` |
| View University Metrics | `UniversityDashboard.tsx:21` | `GET /api/university/dashboard` | **Working** | **SCHEMA MISMATCH**: UI expects `assigned_problems_count`, backend gives `assigned_reports_count` |
| View Assigned Problems | `UniversityDashboard.tsx:22` | `GET /api/university/problems` | **Working** | Compatible |
| View State University Rankings | `UniversityDashboard.tsx:23` | `GET /api/university/ranking` | **Working** | Compatible |
| View Registered Student Solvers | `UniversityDashboard.tsx:24` | `GET /api/university/students` | **Working** | Compatible |

### 4.5 Role: Industry Partner

| Frontend UI Action | Component & Line | Intended Endpoint | Backend Status | Schema / Wiring Compatibility |
|---|---|---|---|---|
| Industry Login | `RoleLoginScreen.tsx:218` | `POST /api/auth/industry/login` | **Working** | Compatible with `IND-001` / `sanjha@2025` |
| View Corporate CSR Dashboard | `IndustryDashboard.tsx:16` | `GET /api/industry/dashboard` | **Working** | **SCHEMA MISMATCH**: UI expects `companyName`, `metrics.totalInvestment`; backend returns `{ profile, offers }` |
| Browse Marketplace | `IndustryDashboard.tsx:24` | `GET /api/industry/marketplace` | **Working** | Compatible (currently swallowed to mock data) |
| Pledge Funding / Mentorship | `IndustryDashboard.tsx:35` | `POST /api/industry/fund` | **Working** | **PAYLOAD MISMATCH**: UI sends `{ projectId, amount }`, backend requires `{ project_id, offer_type: str, amount }` (422 Error) |
| Track Funded Portfolio | **MISSING IN UI** | `GET /api/industry/portfolio` | **Backend Exists** | **MISSING IN UI**: Portfolio endpoint is unused |

---

## 5. Architectural Defect & Gap Matrix

| ID | Module | Severity | Defect Description | Recommended Fix |
|---|---|---|---|---|
| **GAP-01** | Frontend Auth | **High** | No session restoration on refresh (`authStore` not persisted, no `/api/auth/me`). | 1. Add `GET /api/auth/me` to FastAPI. 2. Add `persist` to Zustand store or verify `/api/auth/me` on initial render. |
| **GAP-02** | Frontend Feedback | **Medium** | Zero toast or notification provider implemented in `/frontend/src`. | Create a centralized Toast provider/hook (`useToast`) styled with Tailwind and Framer Motion. |
| **GAP-03** | Industry Funding | **High** | `POST /api/industry/fund` fails with 422 because `offer_type` is missing and key is `projectId`. | Update backend model to allow optional `offer_type="funding"` and alias `projectId` → `project_id`, or update frontend payload. |
| **GAP-04** | Industry Dashboard | **High** | Backend returns `{ profile, offers }`; frontend crashes looking for `dashboardData.metrics.totalInvestment`. | Transform backend response or update frontend mapper to safely handle `profile.total_invested`. |
| **GAP-05** | University Dashboard | **Medium** | Metric key mismatch: `assigned_problems_count` vs `assigned_reports_count`. | Add compatibility keys to backend response or update frontend property accessors. |
| **GAP-06** | Student Dashboard | **High** | Student actions (create project, update skills, submit project) exist in backend but have zero UI wiring. | Implement interactive action modals on `StudentDashboard` connected to `/api/student/projects` and `/skill-profile`. |
| **GAP-07** | Citizen Feed | **Medium** | Citizens cannot view community/citywide reports because no public `GET /api/reports` exists. | Add `GET /api/reports` (public/filtered) in `routers/reports.py`. |
| **GAP-08** | Navigation / Auth | **Medium** | In `RoleLoginScreen.tsx:105`, `ROLE_DASHBOARD.university` points to `/student-dashboard`. | Update `ROLE_DASHBOARD.university` to `/university-dashboard`. |
| **GAP-09** | Error Handling | **High** | Errors swallowed by `.catch(() => fallbackMockData)` across multiple dashboards. | Replace fallback mock swallowing with standard `try/catch` managing `error` state and toast notifications. |
| **GAP-10** | Citizen Feedback | **Medium** | `POST /api/reports/{id}/feedback` not surfaced to citizens when issues reach `implemented`. | Add a "Rate Redressal" modal on resolved reports in `DashboardScreen`. |

---

## 6. Implementation Action Plan for Downstream Agents

1. **Step 1 — Foundation: Toast System & Auth State Persistence**:
   - Implement `ToastProvider` and `useToast` in `frontend/src/components/ui/toast.tsx`.
   - Implement `GET /api/auth/me` in `backend/routers/auth.py`.
   - Update `frontend/src/store/authStore.ts` to persist authentication and re-validate via `/api/auth/me`.

2. **Step 2 — Backend Schema Alignment & Missing Routes**:
   - In `backend/routers/industry.py`:
     - Make `offer_type` optional (default `"funding"`).
     - Add field alias or accept `projectId`.
     - Align `GET /api/industry/dashboard` return structure.
   - In `backend/routers/university.py`:
     - Add metric alias keys (`assigned_problems_count`, `active_projects_count`, `student_participation_count`).
   - In `backend/routers/reports.py`:
     - Add `GET /api/reports` (public feed for citizens).

3. **Step 3 — Frontend Wiring & R3 Compliance**:
   - Wrap all `fetch` calls in `try/catch` managing `loading` and `error` states.
   - Replace native `alert()` calls with `toast.info("Coming Soon: ...")` (R4 compliance).
   - Wire `StudentDashboard` buttons to `/api/student/projects`, `/api/student/skill-profile`, and `/api/student/projects/{id}/submit`.
   - Wire `OfficialDashboard` mutation handlers to toast notifications on status update, assign, review, and implement.
   - Fix `RoleLoginScreen` university redirect route to `/university-dashboard`.
