# Handoff Report — Explorer 3: Backend Architecture & Frontend API Integration Audit

**Type**: Hard Handoff (Task Complete)  
**Agent**: Explorer 3 (`teamwork_preview_explorer_survey_3`)  
**Parent Agent ID**: `4e5ea7ed-4eab-4f39-8ba6-6043b827ee2d`  
**Date**: 2026-09-13T13:52:00Z  
**Primary Output**: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_3\survey_report.md`  

---

## 1. Observation

### 1.1 Backend Architecture Observations
1. **FastAPI Application Setup**:
   - `backend/main.py:9`: `app = FastAPI(title="Sanjha API", version="1.0.0")`
   - `backend/main.py:26-33`: Mounts 8 routers: `auth.router`, `auth_institutional.router`, `reports.router`, `admin.router`, `feedback.router`, `students.router`, `university.router`, `industry.router`.
   - `backend/main.py:35-42`: Exposes `GET /api/health`.
   - `backend/database.py:10`: `SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sanjha.db")`.
2. **Database Schema**:
   - `backend/models.py:6-196`: 10 SQLAlchemy models: `User`, `Report`, `University`, `Feedback`, `Project`, `Team`, `TeamMember`, `SkillProfile`, `FundingOffer`, `IndustryProfile`.
   - `backend/migrate_v6.py:223-226`: Pre-seeds `GOV-001` (official), `IND-001` (industry), and BIT Mesra university profile. Password hash is SHA-256 of `"sanjha@2025"`.
3. **AI Services**:
   - `backend/services/ai_engine.py:22-60`: `verify_image_authenticity()` uses Gemini 1.5 Flash.
   - `backend/services/ai_engine.py:61-100`: `analyze_and_route_problem()` uses NVIDIA Nemotron 3.5.
4. **Existing Backend Routers & Endpoints**:
   - Total of 32 distinct endpoints exist across the 8 routers (cataloged in `survey_report.md` §1.4).

### 1.2 Frontend API & State Observations
1. **Frontend App Structure**:
   - `frontend/src/App.tsx:4-29`: Routes configured with `react-router-dom` for `LandingScreen`, `RoleSelectScreen`, `RoleLoginScreen`, `OtpScreen`, `DashboardScreen`, `ReportScreen`, `OfficialDashboard`, `StudentDashboard`, `UniversityDashboard`, `IndustryDashboard`.
   - `frontend/vite.config.ts:14-17`: Proxies `/api` to `http://localhost:8002`.
2. **Toast & Notification Systems**:
   - `grep_search` for `toast` in `frontend/src`: 0 results found.
   - `grep_search` for `alert(` in `frontend/src`: 6 instances found:
     - `IndustryDashboard.tsx:39`: `.then(() => alert('Funding pledge initiated!'));`
     - `ReportScreen.tsx:18`: `alert("Speech recognition is not supported in this browser.");`
     - `DashboardScreen.tsx:91, 95, 502, 506`: `alert("Initiatives coming in V2!")`, `alert("Connect coming in V2!")`
3. **Swallowed Errors & Mock Fallbacks**:
   - `StudentDashboard.tsx:18-32`: `fetch("/api/student/dashboard").catch(() => mockData)`, `fetch("/api/student/skill-profile").catch(() => mockData)`, `fetch("/api/student/problems").catch(() => mockData)`. No error state is managed.
   - `IndustryDashboard.tsx:16-26`: `fetch("/api/industry/dashboard").catch(() => mockData)`, `fetch("/api/industry/marketplace").catch(() => mockData)`.
   - `DashboardScreen.tsx:29-32`: `fetch("/api/reports/my").catch(() => { setReports([]); setLoading(false); })`.
4. **Schema & Endpoint Mismatches**:
   - `RoleLoginScreen.tsx:105`: `university: "/student-dashboard"` (should be `"/university-dashboard"`).
   - `IndustryDashboard.tsx:38`: Sends `{ projectId, amount }` to `POST /api/industry/fund`.
   - `backend/routers/industry.py:16-21`: `FundingOfferCreate` requires `offer_type: str` (mandatory) and `project_id: Optional[int]`. Result: FastApi returns `422 Unprocessable Entity`.
   - `UniversityDashboard.tsx:80, 84, 88`: Accesses `dashboardData?.assigned_problems_count`, `active_projects_count`, `student_participation_count`. Backend `routers/university.py:32-37` returns `assigned_reports_count`, `departments`, `projects_in_progress`.

---

## 2. Logic Chain

1. **Premise 1**: Requirement R3 requires: "Every API fetch call in the frontend is wrapped in a try/catch block that manages a loading state and an error state", and production-grade error handling (toast notifications).
2. **Observation Step 1**: `grep_search` confirms zero toast notifications in `frontend/src/` and reveals 6 hardcoded `alert()` dialogs.
3. **Observation Step 2**: Direct inspection of `OfficialDashboard.tsx` lines 51-106 shows mutations (`updateReportStatus`, `assignReport`, `reviewSubmission`, `implementProject`) only do `console.error(e)` without loading indicators or UI error feedback.
4. **Observation Step 3**: Direct inspection of `StudentDashboard.tsx` lines 18-40 shows errors are swallowed and replaced by static fallback data.
5. **Deduction 1**: The frontend fails Requirement R3 on multiple primary screens.
6. **Premise 2**: Requirement R2 requires: "connect forms to the existing FastAPI backend. If a backend route is missing for a core feature, build it."
7. **Observation Step 4**: In `StudentDashboard.tsx`, buttons for browsing problems, updating skills, and viewing projects are dead or static, while backend `routers/students.py` provides `POST /projects`, `PUT /skill-profile`, `PUT /profile`, and `POST /projects/{id}/submit`.
8. **Observation Step 5**: In `IndustryDashboard.tsx:38`, `handleFund` sends a payload that violates `FundingOfferCreate` Pydantic model (`offer_type` is required in backend), generating HTTP 422 errors.
9. **Observation Step 6**: `authStore.ts` does not persist state to `localStorage`, and `backend/routers/auth.py` lacks a `GET /api/auth/me` endpoint. On page refresh, user state is lost and `ProtectedRoute` redirects to `/`.
10. **Deduction 2**: Core backend endpoints already exist for almost all features, but they suffer from integration gaps: payload/schema mismatches, dead UI triggers, missing session verification, and lack of a public feed endpoint for citizens.

---

## 3. Caveats

- **External AI Providers**: `services/ai_engine.py` references Google Gemini and NVIDIA Nemotron APIs. During local development without active external API keys, fallback logic in `ai_engine.py:28` allows basic execution without throwing fatal errors.
- **Supabase SMS**: `routers/auth.py:44-48` bypasses actual SMS dispatch and accepts any 6-digit number in demo mode.
- **Scope Limit**: As an explorer subagent, no source code was modified during this survey. All proposed changes are structured into an actionable implementation plan.

---

## 4. Conclusion

The FastAPI backend is solidly architected and contains endpoints for almost the entire civic grievance and student innovation lifecycle. However, the frontend integration has critical flaws:
1. **Zero Toast/Notification System**: Must create a unified toast provider (`useToast`) to replace native `alert()` and provide R3/R4 feedback.
2. **Data & Schema Mismatches**: FastApi 422 error on industry funding and metric key mismatch on university dashboard must be resolved.
3. **Silent Error Suppression**: Fallback mock data swallowing in student, industry, and citizen dashboards must be replaced with true error state handling.
4. **Unwired Backend Endpoints**: Student project creation, skill upsert, project submission, and citizen feedback are already implemented on the backend and merely need UI wiring in the frontend.
5. **Missing Backend Endpoints**: `GET /api/auth/me` (session verification) and `GET /api/reports` (public citizen feed) must be implemented in FastAPI.

---

## 5. Verification Method

To independently verify these findings:
1. **Toast & Alert Audit**:
   - Run `grep -rn "alert(" frontend/src/` → verify instances in `DashboardScreen.tsx`, `IndustryDashboard.tsx`, and `ReportScreen.tsx`.
   - Run `grep -rn "toast" frontend/src/` → verify 0 results.
2. **Schema Mismatch Verification**:
   - Inspect `frontend/src/features/industry/IndustryDashboard.tsx:38` vs `backend/routers/industry.py:16-21`. Verify `offer_type` is mandatory in backend but omitted in frontend payload.
   - Inspect `frontend/src/features/university/UniversityDashboard.tsx:80` vs `backend/routers/university.py:32-37`. Verify key mismatch (`assigned_problems_count` vs `assigned_reports_count`).
3. **University Redirect Route**:
   - Inspect `frontend/src/features/landing/RoleLoginScreen.tsx:105` → verify `university: "/student-dashboard"` maps incorrectly.
4. **Backend Router Audit**:
   - Inspect `backend/main.py:26-33` and verify all 8 mounted routers.
