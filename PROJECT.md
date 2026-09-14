# Project: SocioSolve Web Application Interactivity & UI Audit

## Architecture
- **Target Application**: React 19 + Vite 8 + Tailwind CSS 4 + React Router v7 located in `frontend/`.
- **Backend Application**: FastAPI + SQLite (`sanjha.db`) + SQLAlchemy models located in `backend/`.
- **State Management**: Zustand (`useAuthStore`) in `frontend/src/store/authStore.ts`.
- **Navigation Flow**:
  - `LandingScreen` (`/`) -> `RoleSelectScreen` (`/select-role`) -> `RoleLoginScreen` (`/login/:role`) -> `OtpScreen` (`/otp`)
  - Citizen: `/dashboard` (`DashboardScreen`), `/report` (`ReportScreen`)
  - Official: `/official-dashboard` (`OfficialDashboard`)
  - Student: `/student-dashboard` (`StudentDashboard`)
  - University: `/university-dashboard` (`UniversityDashboard`)
  - Industry: `/industry-dashboard` (`IndustryDashboard`)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Toast Notification System | Lightweight Toast provider & hook (`useToast`) replacing `alert()` with success, error, and "Coming Soon" notifications | M1 | Survey |
| 2 | Graceful Fallback Wiring | Wire peripheral buttons and links (footer links, policy links, unused tabs) to "Coming Soon" toast per R4 | M1 | Survey |
| 3 | University Role Route Fix | Fix `RoleLoginScreen.tsx` redirect mapping for university (`/university-dashboard` instead of `/student-dashboard`) | M2 | Survey |
| 4 | OtpScreen Keypad & Navigation | Wire back buttons, dynamic phone number, timer, and 11 virtual keypad buttons to input state in `OtpScreen.tsx` | M2 | Survey |
| 5 | Auth Dead Link Removal | Remove/replace all `href="#"` dead links in `LoginScreen.tsx` and `OtpScreen.tsx` | M2 | Survey |
| 6 | Auth Session Persistence | Add localStorage persistence in `authStore.ts` so login session survives browser reload | M2 | Survey |
| 7 | Public Community Feed API | Implement `GET /api/reports` in `backend/routers/reports.py` to allow browsing reports publicly without user filter | M3 | Survey |
| 8 | Session Verification API | Implement `GET /api/auth/me` in `backend/routers/auth.py` for token/session verification | M3 | Survey |
| 9 | Industry Funding Schema Alignment | Fix `POST /api/industry/fund` request payload in frontend and schema tolerance in backend (`offer_type`, `project_id`) | M3 | Survey |
| 10 | University Metric Keys Alignment | Map backend university dashboard response keys to frontend expected properties | M3 | Survey |
| 11 | ReportScreen Form Wiring | Controlled Title input, selectable category chips with active styling, GPS button trigger, form submit to `POST /api/reports` with try/catch, loading spinner, and success toast | M4 | Survey |
| 12 | ReportScreen Dead Link Elimination | Replace 14 `href="#"` breadcrumb and footer links in `ReportScreen.tsx` with valid actions / toasts | M4 | Survey |
| 13 | Citizen Dashboard Interactivity | Controlled search bar filtering feed reports, upvote trigger, issue detail view, and replace alert popups | M4 | Survey |
| 14 | Official Dashboard Mutation States | Add loading spinners and toast notifications to status updates, department assignment, and submission review | M5 | Survey |
| 15 | Official Bottom Navigation | Wire bottom navigation buttons (`Dashboard`, `Reports`, `Map`, `Settings`) to routes or coming soon toasts | M5 | Survey |
| 16 | Student Problem Adoption & Filter | Category filter tab switching, "Adopt Problem" modal triggering `POST /api/student/projects`, project submission modal | M5 | Survey |
| 17 | Student Bottom Navigation | Wire bottom navigation buttons in `StudentDashboard.tsx` | M5 | Survey |
| 18 | Industry Dashboard Funding & Nav | Wire funding modal with `project_id` and `offer_type: "funding"`, add loading/error state, wire bottom navigation | M5 | Survey |
| 19 | University Dashboard Bottom Nav | Wire bottom navigation in `UniversityDashboard.tsx` | M5 | Survey |
| 20 | Automated Zero-Dead-Link Verification | Script confirming 0 `href="#"` and no inert buttons without handlers across all primary screens | M6 | Acceptance |
| 21 | API Error & Loading State Verification | Script checking every API fetch call has try/catch managing loading and error states | M6 | Acceptance |
| 22 | End-to-End Navigation Journey | Automated verification of Landing -> Role Selection -> Login -> Dashboard -> Report Issue flow | M6 | Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: UX Foundation & Toast System | Create `ToastContext` / `useToast`, replace native alerts, provide "Coming Soon" toast fallback helper | none | DONE |
| 2 | M2: Auth & Navigation Spine | Fix University redirect, wire OtpScreen numpad/back buttons, remove `href="#"` in Auth, persist session | M1 | DONE |
| 3 | M3: Backend API & Schema Alignment | Add `GET /api/reports`, `GET /api/auth/me`, fix Industry funding schema & University metric alignment | none | DONE |
| 4 | M4: Citizen Portal & Grievance Flow | Wire ReportScreen form (title, category, GPS, submit), eliminate ReportScreen dead links, wire DashboardScreen search & actions | M1, M2, M3 | DONE |
| 5 | M5: Multi-Role Dashboard Wiring | Wire Student problem adoption/submission, Industry funding flow, Official mutation UX, bottom navs across all 4 dashboards | M1, M3 | DONE |
| 6 | M6: E2E Verification & Audit | Automated verification script (`href="#"`, dead buttons, loading/error states, E2E journey), adversarial tests, audit | M1, M2, M3, M4, M5 | IN_PROGRESS |

## Interface Contracts
### Toast Provider (`frontend/src/components/ui/Toast.tsx` / `frontend/src/context/ToastContext.tsx`)
```ts
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}
export interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], title?: string) => void;
  showComingSoon: (featureName?: string) => void;
}
```

### Backend Feed API (`GET /api/reports`)
- Request: `GET /api/reports?limit=50&category=...`
- Response: `List[ReportResponse]` with id, title, description, category, status, department, location, created_at.

### Backend Session API (`GET /api/auth/me`)
- Headers: `Authorization: Bearer <token>`
- Response: `{ id: int, role: str, phone?: str, email?: str, name?: str }`

### Industry Funding API (`POST /api/industry/fund`)
- Request: `{ project_id: int, amount: float, offer_type: "funding", message?: str }`
- Response: `FundingOfferResponse`

## Code Layout
- `frontend/src/components/ui/Toast.tsx`: Toast container and component
- `frontend/src/context/ToastContext.tsx`: Toast context & hook
- `frontend/src/features/auth/`: `LoginScreen.tsx`, `OtpScreen.tsx`
- `frontend/src/features/landing/`: `LandingScreen.tsx`, `RoleSelectScreen.tsx`, `RoleLoginScreen.tsx`
- `frontend/src/features/citizen/`: `DashboardScreen.tsx`, `ReportScreen.tsx`
- `frontend/src/features/official/`: `OfficialDashboard.tsx`
- `frontend/src/features/student/`: `StudentDashboard.tsx`
- `frontend/src/features/industry/`: `IndustryDashboard.tsx`
- `frontend/src/features/university/`: `UniversityDashboard.tsx`
- `frontend/src/store/authStore.ts`: Zustand auth store with localStorage persistence
- `backend/routers/`: `reports.py`, `auth.py`, `industry.py`, `university.py`, `admin.py`, `students.py`
