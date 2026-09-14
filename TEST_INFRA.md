# TEST_INFRA — SocioSolve E2E & Acceptance Test Infrastructure

## 1. System Architecture & Testing Philosophy

### 1.1 Architecture Context
SocioSolve is a decentralized public problem resolution platform bridging citizens, municipal authorities, student solvers, university innovation centers, and corporate CSR partners across Jharkhand.

- **Frontend**: React 19 + Vite 8 + Tailwind CSS 4 + React Router v7 (`frontend/src/`).
- **Backend**: FastAPI + SQLAlchemy ORM + SQLite (`backend/sanjha.db`) with modular routers (`backend/routers/`).
- **State & Routing**: Zustand authentication store (`frontend/src/store/authStore.ts`) with role-based routing (`frontend/src/App.tsx`).

### 1.2 Core Testing Principles
1. **Opaque-Box Requirement-Driven Verification**: Tests validate user-facing behavior, observable states, network contracts, and navigation flows rather than implementation internals.
2. **Progressive Testability**: Verification suites must be executable at every milestone (M1 through M6), establishing baseline failure metrics and tracking progressive remediation without requiring uncompleted future features.
3. **Deterministic & Self-Contained**: Every test manages its own state, isolates test dependencies, and produces reproducible results.
4. **Zero Facade Tests**: No dummy assertions or artificial passes. Tests must exercise real DOM structures, real route mappings, and authentic API contracts.
5. **Adversarial Edge-Case Coverage**: Verification tests inspect malformed inputs, boundary states, network failure simulations, and silent error swallowing.

---

## 2. Testing Tiers Taxonomy (Tiers 1 – 4)

| Tier | Name | Target Scope | Methodology | Key Assertions / Pass Criteria |
|---|---|---|---|---|
| **Tier 1** | Static Code Integrity & UI Interaction | All `.tsx`/`.jsx` in `frontend/src/` | Static AST & lexical pattern scanning | 0 dead `href="#"` links, 0 inert `<button type="button">` elements without `onClick`, 0 raw `alert()` popups, controlled inputs |
| **Tier 2** | API Contract & Error/Loading Resilience | All frontend `fetch()` calls & backend schemas | Network wrapper AST inspection & schema diffing | 100% of `fetch()` wrapped in try/catch or `.catch()`, active `loading` state toggling, visible `error` feedback (no silent swallowing) |
| **Tier 3** | Route & Role Navigation Journey Flow | `App.tsx`, `ProtectedRoute`, and navigation triggers | Route graph topology analysis & traversal simulation | Full traversal Landing → Role Select → Login → Dashboard → Action → Return without dead-ends; correct `ROLE_DASHBOARD` mapping |
| **Tier 4** | Backend Integration & Endpoint Smoke | FastAPI routers (`/api/*`) | Starlette `TestClient` and live HTTP smoke testing | All core REST endpoints return valid HTTP status codes (200/201), schema payloads conform to Pydantic models, DB queries execute |

---

### Tier 1: Static Code Integrity & Link/Button Auditing

#### Objective
Ensure that every interactive element rendered on screen is genuinely interactive, that no placeholder anchor links remain, and that native disruptive browser popups (`window.alert`) are replaced by modern UI toasts.

#### Scope
- All frontend screens under `frontend/src/features/`:
  - `LandingScreen.tsx` (Public Landing)
  - `RoleSelectScreen.tsx` (Portal Selector)
  - `RoleLoginScreen.tsx` (Unified Role Authentication)
  - `LoginScreen.tsx` (Desktop Citizen Login)
  - `OtpScreen.tsx` (Citizen OTP Verification)
  - `DashboardScreen.tsx` (Citizen Portal & Grievance Feed)
  - `ReportScreen.tsx` (Citizen Grievance Submission Form)
  - `OfficialDashboard.tsx` (Government Official Administration Portal)
  - `StudentDashboard.tsx` (Student Innovation & Problem Hub)
  - `UniversityDashboard.tsx` (University Coordination Portal)
  - `IndustryDashboard.tsx` (Corporate CSR Partner Portal)

#### Checked Properties
1. **Dead Link Detection**:
   - Matches: `href="#"`, `href={['"]#['"]}`, `href=""`, `href={""}`, `href="javascript:void(0)"`.
   - Threshold: **Strictly 0**. Every link must either navigate to a route, open a valid URI (`tel:`, `mailto:`, `https://`), or trigger a graceful action/toast.
2. **Inert Button Detection**:
   - Matches: `<button>` tags with `type="button"` (or no type outside a form) that lack an `onClick` handler and are not `disabled`.
   - Virtual keypads, category filter chips, tab switches, and bottom navigation bars must be wired to state handlers or navigation triggers.
3. **Native Alert Prohibition**:
   - Prohibits `alert(...)` or `window.alert(...)` in production code. All notifications must use `useToast()` / `ToastContext`.
4. **Controlled Form Inputs**:
   - Inputs and textareas must bind `value` to state with corresponding `onChange` handlers (e.g. Issue Title in `ReportScreen.tsx`, Search Bar in `DashboardScreen.tsx`).

---

### Tier 2: API Contract, Error Handling & State Resilience

#### Objective
Verify that all network operations communicate resiliently with the backend, manage UI loading states to prevent double submissions, and surface errors cleanly to users rather than crashing or silently swallowing failures into mock data.

#### Scope
- Every occurrence of `fetch(...)` across `frontend/src/`.
- Backend request/response Pydantic models in `backend/routers/` and `backend/models.py`.

#### Checked Properties
1. **Error Wrapper Requirement**:
   - Every `fetch()` invocation must either be enclosed in a `try { ... } catch (error) { ... }` block or have a chained `.catch((error) => { ... })`.
2. **Loading State Requirement**:
   - The enclosing function or component scope must manage a loading indicator (e.g. `setLoading(true)` before dispatch, reset in `finally` or completion callback).
3. **Error State & User Feedback Requirement**:
   - Catch handlers must update an error state variable (e.g. `setError(err.message)`) or invoke toast feedback (`showToast(msg, 'error')`).
   - **Silent Swallowing Prohibition**: Catch handlers that do nothing (`catch(e) {}`), only `console.error(e)`, or silently fallback to hardcoded mock data without notifying the user are flagged as defects.
4. **Schema Alignment**:
   - Request payloads must match FastAPI Pydantic requirements:
     - `POST /api/industry/fund`: Must send `project_id` and `offer_type: "funding"` (or backend must accept `projectId` with default `offer_type`).
     - `GET /api/university/dashboard`: Keys must match between frontend property accesses and backend dictionary keys (`assigned_problems_count` vs `assigned_reports_count`).

---

### Tier 3: Route, Role & Navigation Journey Flow

#### Objective
Verify the end-to-end navigational integrity of the entire web application, ensuring that users of any role can traverse from landing through authentication into their respective dashboard and trigger their primary actions without hitting dead-ends or redirect loops.

#### Core Journeys

```
Journey 1: Citizen Redressal Flow
[Landing /] ──► [/select-role] ──► [/login/citizen] ──► [/dashboard] ──► [/report] ──► [/dashboard]

Journey 2: Student Innovation Flow
[Landing /] ──► [/select-role] ──► [/login/student] ──► [/student-dashboard] ──► [Adopt Problem Modal]

Journey 3: Government Official Flow
[Landing /] ──► [/select-role] ──► [/login/official] ──► [/official-dashboard] ──► [Validate / Assign]

Journey 4: University Flow
[Landing /] ──► [/select-role] ──► [/login/student?tab=university] ──► [/university-dashboard]

Journey 5: Industry CSR Flow
[Landing /] ──► [/select-role] ──► [/login/industry] ──► [/industry-dashboard] ──► [Fund Project Modal]
```

#### Checked Properties
1. **Route Existence**: All target routes registered in `App.tsx` (`/`, `/select-role`, `/login/:role`, `/otp`, `/dashboard`, `/report`, `/official-dashboard`, `/student-dashboard`, `/university-dashboard`, `/industry-dashboard`).
2. **Role Mapping Consistency**:
   - `RoleLoginScreen.tsx` `ROLE_DASHBOARD` mappings must match `App.tsx` `ROLE_HOME` and `ProtectedRoute allowedRoles`.
   - Specifically validates that `university` routes to `/university-dashboard` (preventing the student dashboard bounce defect).
3. **Session Rehydration**:
   - Zustand `authStore` must persist login state or rehydrate via `GET /api/auth/me` to prevent reload ejection.

---

### Tier 4: Backend Integration & Endpoint Smoke Verification

#### Objective
Smoke-test all backend API endpoints to verify server health, database connectivity, request parsing, authentication token handling, and data retrieval.

#### Endpoints in Scope

| Endpoint | Method | Expected Status | Notes |
|---|---|---|---|
| `/api/health` | `GET` | `200 OK` | Database connection check (`SELECT 1`) |
| `/api/auth/send-otp` | `POST` | `200 OK` | Citizen OTP dispatch |
| `/api/auth/verify-otp` | `POST` | `200 OK` / `400` | Citizen OTP verification & JWT cookie |
| `/api/auth/student/login` | `POST` | `200 OK` | APAAR ID student login |
| `/api/auth/university/login` | `POST` | `200 OK` / `401` | Institutional email login |
| `/api/auth/official/login` | `POST` | `200 OK` | Official ID login (`GOV-001`) |
| `/api/auth/industry/login` | `POST` | `200 OK` | Partner ID login (`IND-001`) |
| `/api/auth/me` | `GET` | `200 OK` / `401` | Session verification endpoint (M3) |
| `/api/reports` | `POST` | `200 OK` / `422` | Report submission (AI triage) |
| `/api/reports` | `GET` | `200 OK` | Public community reports feed (M3) |
| `/api/reports/my` | `GET` | `200 OK` / `401` | Citizen personal reports |
| `/api/admin/reports` | `GET` | `200 OK` / `401` | All civic reports for administration |
| `/api/admin/submissions` | `GET` | `200 OK` / `401` | Student solution submissions |
| `/api/student/dashboard` | `GET` | `200 OK` / `401` | Student profile and counts |
| `/api/student/problems` | `GET` | `200 OK` / `401` | Open civic problems feed |
| `/api/university/dashboard` | `GET` | `200 OK` / `401` | University department activity |
| `/api/industry/dashboard` | `GET` | `200 OK` / `401` | Industry CSR profile & metrics |
| `/api/industry/marketplace` | `GET` | `200 OK` / `401` | CSR funding marketplace |

#### Execution Modes
The smoke test supports dual execution:
1. **Live HTTP Mode**: When backend server runs at `http://localhost:8002`, tests issue real HTTP requests.
2. **In-Process TestClient Mode**: Uses Starlette/FastAPI `TestClient` with the backend virtual environment, pointing directly to `backend/sanjha.db` with seeded test accounts.

---

## 3. Acceptance Criteria Checking Methodology

The project's acceptance criteria from `ORIGINAL_REQUEST.md` map directly to the automated checks implemented in `scripts/verify_acceptance.py`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ACCEPTANCE VERIFICATION HARNESS                        │
│                       (scripts/verify_acceptance.py)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Check 1: Zero Dead Links            │ Scans frontend/src for href="#"      │
│ Check 2: Zero Inert Buttons         │ Scans primary screens for dead btns   │
│ Check 3: API Error/Loading States   │ Scans fetch calls for try/catch/state │
│ Check 4: Navigation Flow Integrity  │ Validates full routing transitions    │
│ Check 5: Backend Smoke Verification │ Executes live/client endpoint tests   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Check 1: 0 Dead `href="#"` Links
- **Tool**: `scripts/verify_acceptance.py --check 1`
- **Pass Rule**: Total count of dead links across all `.tsx` and `.jsx` files in `frontend/src/` must equal **0**.
- **Failure Condition**: Any `<a href="#">`, `<a href={''}>`, or empty anchor tags found.
- **Reporting**: Reports filename, line number, and offending snippet.

### Check 2: 0 Inert `<button type="button">` Elements Without `onClick`
- **Tool**: `scripts/verify_acceptance.py --check 2`
- **Pass Rule**: Total count of static buttons without `onClick` handlers on primary screens must equal **0**.
- **Failure Condition**: Any `<button>` with `type="button"` or button without `onClick` (excluding disabled buttons or submit buttons inside valid forms).
- **Secondary Flag**: Buttons using raw `alert(...)` instead of toasts are flagged as UX defects.
- **Reporting**: Reports filename, line number, element content, and classification.

### Check 3: API Fetch Error & Loading State Management
- **Tool**: `scripts/verify_acceptance.py --check 3`
- **Pass Rule**: 100% of frontend `fetch()` calls must:
  1. Be enclosed in `try/catch` or `.catch()`.
  2. Toggle a loading state (`loading`, `setLoading`, `isSubmitting`).
  3. Update user-visible error state or toast on failure (no silent swallow).
- **Failure Condition**: Unhandled fetch, missing loading indicator, or silent error swallowing.
- **Reporting**: Reports each fetch URL, enclosing function, and specific missing safety flags.

### Check 4: End-to-End Navigation Journey
- **Tool**: `scripts/verify_acceptance.py --check 4`
- **Pass Rule**: All core navigation flows traversable without dead ends.
  - Landing (`/`) -> Role Select (`/select-role`) -> Role Login (`/login/:role`) -> Dashboard (`/dashboard`, `/official-dashboard`, `/student-dashboard`, `/university-dashboard`, `/industry-dashboard`).
  - Citizen Dashboard -> Action (`/report`) -> Return to `/dashboard`.
  - `ROLE_DASHBOARD` in `RoleLoginScreen.tsx` maps `university` to `/university-dashboard`.
- **Failure Condition**: Missing routes, broken redirect mappings, or unreachable action screens.
- **Reporting**: Step-by-step route traversal verification matrix.

### Check 5: Backend Endpoint Smoke Verification
- **Tool**: `scripts/verify_acceptance.py --check 5`
- **Pass Rule**: All primary backend endpoints respond with appropriate HTTP status codes and valid JSON structures.
- **Failure Condition**: Internal Server Errors (`500`), missing required routes (`404` for core endpoints), or unhandled database exceptions.
- **Reporting**: Tabular output of Endpoint, Method, Status Code, Latency, and Pass/Fail.

---

## 4. Verification Tooling & Execution Guide

### 4.1 Running Acceptance Verification

```powershell
# Run the complete acceptance verification suite (Checks 1 - 5)
python scripts/verify_acceptance.py

# Run an individual check
python scripts/verify_acceptance.py --check 1   # Check 1: Dead links
python scripts/verify_acceptance.py --check 2   # Check 2: Inert buttons
python scripts/verify_acceptance.py --check 3   # Check 3: API error/loading handling
python scripts/verify_acceptance.py --check 4   # Check 4: Navigation flow
python scripts/verify_acceptance.py --check 5   # Check 5: Backend smoke test

# Output machine-readable JSON summary for CI/CD pipelines
python scripts/verify_acceptance.py --json

# Run in verbose mode with full code context
python scripts/verify_acceptance.py --verbose
```

### 4.2 Exit Codes
- `0`: All executed checks **PASSED** (acceptance criteria satisfied).
- `1`: One or more checks **FAILED** (defects detected).

---

## 5. Baseline Defect Registry (Pre-Remediation State)

The initial baseline run of `scripts/verify_acceptance.py` established the following defect counts:

| Check # | Description | Baseline Result | Defect Count | Primary Locations |
|---|---|---|---|---|
| **Check 1** | Dead `href="#"` Links | **FAILED** | 33 dead links | `LoginScreen.tsx` (15), `ReportScreen.tsx` (14), `OtpScreen.tsx` (3), footer links |
| **Check 2** | Inert `<button>` Elements & Alerts | **FAILED** | 59 inert buttons / alerts | `OtpScreen.tsx` (15), `DashboardScreen.tsx` (16), `StudentDashboard.tsx` (11), `ReportScreen.tsx` (5), `OfficialDashboard.tsx` (4), `UniversityDashboard.tsx` (4), `IndustryDashboard.tsx` (4) |
| **Check 3** | API Fetch Error/Loading Resilience | **FAILED** | 22 unsafe fetch calls | `StudentDashboard.tsx` (3 silent swallow), `OfficialDashboard.tsx` (4 missing loading/error), `RoleLoginScreen.tsx` (4 unhandled), `IndustryDashboard.tsx` (2 unhandled/alert), `DashboardScreen.tsx` (2) |
| **Check 4** | Navigation Flow Integrity | **FAILED** | 1 routing mismatch | `RoleLoginScreen.tsx:105` maps `university` to `/student-dashboard` instead of `/university-dashboard` |
| **Check 5** | Backend Endpoint Smoke | **PARTIAL** | 3 endpoint defects | RBAC unauthenticated 403 on `/api/admin/reports`, `/api/student/problems`, `/api/university/dashboard`, missing `GET /api/reports` and `GET /api/auth/me` |

These baseline results serve as the regression prevention benchmark. As engineering agents complete Milestones M1 through M5, running `python scripts/verify_acceptance.py` verifies progressive reduction of defects to 0.
