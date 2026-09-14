# DISPATCH — Worker M3: Backend API Enhancements & Schema Alignment

## Identity & Working Directory
- Archetype: teamwork_preview_worker
- Working Directory: d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m3
- Parent Conversation ID: 4e5ea7ed-4eab-4f39-8ba6-6043b827ee2d

## Mandatory References
- Authoritative User Request: `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`
- Project Blueprint: `d:\shlok\ai agents\sih hackathon project\PROJECT.md`
- Explorer 2 Report: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_2\survey_report.md`
- Explorer 3 Report: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_3\survey_report.md`
- Domain Skill: `C:\Users\Admin\.gemini\config\skills\engineering-backend-architect\SKILL.md`

## Write Ownership
You EXCLUSIVELY own:
- `backend/routers/reports.py`
- `backend/routers/auth.py`
- `backend/routers/industry.py`

DO NOT touch frontend files.

## Implementation Requirements
1. **Public Community Feed API (`backend/routers/reports.py`)**:
   - Implement `GET /api/reports` that returns approved / verified civic reports with optional filtering (`limit: int = 50`, `category: Optional[str] = None`).
   - Allow public access (does not require auth token, or tolerates unauthenticated requests) so community citizens can browse existing issues without login barriers.
2. **Session Verification API (`backend/routers/auth.py`)**:
   - Implement `GET /api/auth/me` to verify active user token / session and return `{ id: int, role: str, phone?: str, name?: str }`.
3. **Industry Funding Schema Alignment (`backend/routers/industry.py`)**:
   - Inspect `FundingOfferCreate` model and endpoint `POST /api/industry/fund`.
   - Update model to accept `offer_type: Optional[str] = "funding"` (default to "funding" if not supplied) and accept both `project_id: Optional[int]` and `projectId: Optional[int]` (via alias or validator) so that frontend calls succeed cleanly without HTTP 422.
4. **Verification**:
   - Run Python syntax checks and test the backend endpoints using python/pytest or a quick verification script against the SQLite database. Ensure no regressions in existing endpoints.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When done, write your report to `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m3\handoff.md` and send a message to parent.

## 2026-09-13T13:53:26Z
Enhance backend FastAPI endpoints and resolve schema mismatches:
1. In `backend/routers/reports.py`: Add `GET /api/reports` endpoint to return approved/verified reports with optional limit and category filters for public community browsing without forcing authentication.
2. In `backend/routers/auth.py`: Add `GET /api/auth/me` endpoint to verify active session tokens.
3. In `backend/routers/industry.py`: Update `FundingOfferCreate` to accept `offer_type: Optional[str] = "funding"` and allow `projectId` alias or validator to prevent HTTP 422 errors when frontend submits funding pledges.
4. Run python verification checks on the backend endpoints to verify no syntax errors or regressions.

