# DISPATCH — Worker M5: Multi-Role Dashboard Wiring

## Identity & Working Directory
- Archetype: teamwork_preview_worker
- Working Directory: d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m5
- Parent Conversation ID: 4e5ea7ed-4eab-4f39-8ba6-6043b827ee2d

## Mandatory References
- Authoritative User Request: `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`
- Project Blueprint: `d:\shlok\ai agents\sih hackathon project\PROJECT.md`
- Explorer 2 Report: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_2\survey_report.md`
- Explorer 3 Report: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_3\survey_report.md`
- Worker M3 Handoff: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m3\handoff.md`
- Domain Skill: `C:\Users\Admin\.gemini\config\skills\engineering-frontend-developer\SKILL.md`

## Write Ownership
You EXCLUSIVELY own:
- `frontend/src/features/official/OfficialDashboard.tsx`
- `frontend/src/features/student/StudentDashboard.tsx`
- `frontend/src/features/industry/IndustryDashboard.tsx`
- `frontend/src/features/university/UniversityDashboard.tsx`

DO NOT touch citizen, auth, or backend files.

## Implementation Requirements
1. **Official Dashboard (`frontend/src/features/official/OfficialDashboard.tsx`)**:
   - Add loading indicators and toast feedback (`useToast()`) to all mutation actions (`updateReportStatus`, `assignReport`, `reviewSubmission`, `implementProject`).
   - Wire all 4 bottom navigation buttons (`Dashboard`, `Reports`, `Map`, `Settings`) to tab switching or `showComingSoon()`.
2. **Student Dashboard (`frontend/src/features/student/StudentDashboard.tsx`)**:
   - Wire Category filter tabs to filter problem statements list in real time.
   - Wire "Adopt Problem" / "Submit Solution" modal on problem cards: connect to `POST /api/student/projects` and `POST /api/student/projects/{id}/submit` with try/catch, loading indicator, and toast notifications.
   - Wire project cards to open details/edit progress modal.
   - Wire empty state "Browse Problems" button and social links (LinkedIn/GitHub -> proper prompts or coming soon toast).
   - Wire all 4 bottom navigation buttons.
   - Replace silent error swallowing with proper error states.
3. **Industry Dashboard (`frontend/src/features/industry/IndustryDashboard.tsx`)**:
   - Fix `handleFund`: ensure it sends `{ project_id: projectId, amount, offer_type: "funding" }`.
   - Replace native `alert('Funding pledge initiated!')` with `showToast("Funding pledge initiated successfully!", "success")`.
   - Add loading spinner to fund button and error handling.
   - Wire all 4 bottom navigation buttons.
4. **University Dashboard (`frontend/src/features/university/UniversityDashboard.tsx`)**:
   - Align metric property keys with backend data (`assigned_reports_count`, `departments`, `projects_in_progress`).
   - Wire all 4 bottom navigation buttons.
5. **Verification**:
   - Run `npm run build` in `frontend/` to confirm zero compilation errors.
   - Run `python scripts/verify_acceptance.py --check 2` and `--check 3` to verify resolution of inert buttons and error/loading handling.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When done, write your report to `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m5\handoff.md` and send a message to parent.

## 2026-09-13T14:00:42Z
You are Worker M5. Your working directory is `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m5`.
First, read:
- `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`
- `d:\shlok\ai agents\sih hackathon project\PROJECT.md`
- `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m5\DISPATCH.md`
- `C:\Users\Admin\.gemini\config\skills\engineering-frontend-developer\SKILL.md`

Your Task:
Implement Milestone M5 (Multi-Role Dashboards):
1. In `OfficialDashboard.tsx`: Add loading indicators and toast feedback to mutation actions; wire all 4 bottom nav buttons.
2. In `StudentDashboard.tsx`: Wire category filters; wire "Adopt Problem" action to `POST /api/student/projects`; wire project details/submission action to `POST /api/student/projects/{id}/submit`; wire empty state button and bottom nav buttons; replace silent error swallowing with error states.
3. In `IndustryDashboard.tsx`: Fix `handleFund` payload (`project_id`, `offer_type: "funding"`), replace `alert()` with success toast, add loading/error state, wire bottom nav.
4. In `UniversityDashboard.tsx`: Align metric keys with backend, wire bottom nav.
5. Verify build with `npm run build` and run `python scripts/verify_acceptance.py --check 2 --check 3`.

