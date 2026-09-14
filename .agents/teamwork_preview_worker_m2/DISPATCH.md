# DISPATCH — Worker M2: Auth & Navigation Spine

## Identity & Working Directory
- Archetype: teamwork_preview_worker
- Working Directory: d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m2
- Parent Conversation ID: 4e5ea7ed-4eab-4f39-8ba6-6043b827ee2d

## Mandatory References
- Authoritative User Request: `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`
- Project Blueprint: `d:\shlok\ai agents\sih hackathon project\PROJECT.md`
- Explorer 1 Report: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_1\survey_report.md`
- Test Baseline Defect List: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_test_writer_e2e\handoff.md`
- Domain Skill: `C:\Users\Admin\.gemini\config\skills\engineering-frontend-developer\SKILL.md`

## Write Ownership
You EXCLUSIVELY own:
- `frontend/src/features/landing/RoleLoginScreen.tsx`
- `frontend/src/features/auth/OtpScreen.tsx`
- `frontend/src/features/auth/LoginScreen.tsx`
- `frontend/src/store/authStore.ts`

DO NOT touch citizen, official, student, university, or industry dashboard files.

## Implementation Requirements
1. **Fix Critical University Redirect Bug (`frontend/src/features/landing/RoleLoginScreen.tsx`)**:
   - Line 105 currently sets `university: "/student-dashboard"`. Fix it to `university: "/university-dashboard"` matching `App.tsx:24` and `ROLE_HOME["university"]`.
   - Wrap fetch calls in try/catch managing loading and error state via `useToast()`.
2. **Wire OtpScreen Keypad & Navigation (`frontend/src/features/auth/OtpScreen.tsx`)**:
   - Wire Back buttons (`navigate(-1)` or `navigate("/select-role")`).
   - Wire all 11 virtual keypad buttons (digits 0-9 and backspace/delete) to update the OTP state and focus next box.
   - Wire dynamic phone number prop (or retrieve from location/state/authStore rather than hardcoded `+91 99XXXXXX34`).
   - Wire "Edit Number" to navigate back to login.
   - Wire "Resend SMS" to reset timer and show toast notification.
   - Eliminate all dead `href="#"` links (replace with button or `showComingSoon()`).
3. **Eliminate Dead Links in LoginScreen (`frontend/src/features/auth/LoginScreen.tsx`)**:
   - Eliminate all 17 instances of `href="#"`. Replace peripheral links (Districts Map, University Cohorts, Open Data, Terms, Division links) with buttons calling `showComingSoon(...)` or proper routes.
   - Wire inert buttons without onClick (e.g. KYC, WhatsApp, Partner shortcuts) to `showComingSoon` or appropriate actions.
4. **Auth State Persistence (`frontend/src/store/authStore.ts`)**:
   - Ensure user auth state is stored in `localStorage` so refreshing the page preserves the login session.
5. **Verification**:
   - Run `npm run build` in `frontend/` to confirm zero TypeScript / build errors.
   - Run `python scripts/verify_acceptance.py --check 1` and `--check 4` to confirm elimination of dead links and resolution of navigation defect.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When done, write your report to `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m2\handoff.md` and send a message to parent.

## 2026-09-13T14:00:42Z
User Request received for Milestone M2 (Auth & Navigation Spine).
Target scope:
- Fix University redirect bug in RoleLoginScreen.tsx: line 105 set university: "/university-dashboard". Wrap fetch with try/catch, loading states, error handling.
- Wire OtpScreen.tsx: back buttons, all 11 virtual keypad buttons, dynamic phone number, edit number, resend timer, eliminate dead links.
- Eliminate all 17 dead href="#" links in LoginScreen.tsx, wire inert buttons.
- Ensure auth persistence in authStore.ts via localStorage.
- Verify build and acceptance tests.
