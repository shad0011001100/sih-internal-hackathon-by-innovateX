# DISPATCH — Explorer 2: Role Dashboards & Form Audit

## Identity & Working Directory
- Archetype: teamwork_preview_explorer
- Working Directory: d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_2
- Parent Conversation ID: 4e5ea7ed-4eab-4f39-8ba6-6043b827ee2d

## Authoritative User Request
- Read: `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`

## Mission & Scope
Perform an in-depth audit of all role-specific dashboard components:
1. Citizen Dashboard (issue reporting, feed, votes, status tracking, filters)
2. Official Dashboard (issue resolution, department assignment, analytics, updates)
3. Student Dashboard (problem statements, submissions, mentorship, hackathons)
4. Industry Dashboard (sponsorship, challenge posting, partnerships)
5. For every dashboard and its sub-components/modals:
   - Identify every `<button>`, `<form>`, `<input>`, tab switcher, and action trigger.
   - Catalog which ones are currently static, missing `onClick` or `onSubmit`, unhandled form submissions, or missing state.
   - Categorize each action as:
     a) Core feature (must connect to backend or interactive local state)
     b) Peripheral feature (candidate for clean "Coming Soon" toast / graceful fallback per R4).
6. Output your detailed audit findings to `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_2\survey_report.md` and deliver `handoff.md`.
