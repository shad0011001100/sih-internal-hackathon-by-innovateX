# DISPATCH — Worker M4: Citizen Portal & Grievance Flow

## Identity & Working Directory
- Archetype: teamwork_preview_worker
- Working Directory: d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m4
- Parent Conversation ID: 4e5ea7ed-4eab-4f39-8ba6-6043b827ee2d

## Mandatory References
- Authoritative User Request: `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`
- Project Blueprint: `d:\shlok\ai agents\sih hackathon project\PROJECT.md`
- Explorer 1 Report: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_1\survey_report.md`
- Explorer 2 Report: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_2\survey_report.md`
- Domain Skill: `C:\Users\Admin\.gemini\config\skills\engineering-frontend-developer\SKILL.md`

## Write Ownership
You EXCLUSIVELY own:
- `frontend/src/features/citizen/ReportScreen.tsx`
- `frontend/src/features/citizen/DashboardScreen.tsx`

DO NOT touch auth files, backend files, or other dashboard files.

## Implementation Requirements
1. **Wire Grievance Intake Form (`frontend/src/features/citizen/ReportScreen.tsx`)**:
   - Fix Issue Title input (currently hardcoded static `value="..."` without `onChange`). Connect it to controlled React state `title`, `setTitle`, and include `title` in form submission.
   - Fix all 5 Category buttons (Civic Issue, Infrastructure, Education, Health, Sanitation). Wire `onClick={() => setCategory(cat)}` with distinct active visual state (e.g. primary color border / background).
   - Wire GPS button to call `requestGps()` or trigger browser geolocation with fallback coordinates.
   - Connect `onSubmit` to `POST /api/reports` with try/catch, proper loading state (`submitting`), error handling, and success toast via `useToast()`. Navigate back to `/dashboard` upon successful creation.
   - Replace all 14 dead `href="#"` breadcrumb and footer links with proper `navigate()` or `showComingSoon()`.
2. **Citizen Dashboard Interactivity (`frontend/src/features/citizen/DashboardScreen.tsx`)**:
   - Wire Search input: make it a controlled input that dynamically filters feed reports by title, description, or category in real time.
   - Wire Category / Ward tabs to filter the report feed.
   - Replace native browser `alert("Initiatives coming in V2!")` and `alert("Connect coming in V2!")` with `showComingSoon("Initiatives")` and `showComingSoon("Connect")` using `useToast()`.
   - Wire Report Cards: add interactive Upvote button (with local state increment and toast confirmation) and Status Detail / Timeline modal trigger.
   - Wire all dead footer buttons (Grievance, Youth, Compliance) to `showComingSoon()` or appropriate navigation.
   - Ensure `fetch("/api/reports/my")` and community feed fetch have proper loading spinners and error states.
3. **Verification**:
   - Run `npm run build` in `frontend/` to confirm zero compilation errors.
   - Run `python scripts/verify_acceptance.py --check 1` and `--check 2` to verify reduction of dead links and inert buttons.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When done, write your report to `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m4\handoff.md` and send a message to parent.
