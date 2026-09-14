# DISPATCH — Worker M1: UX Foundation & Toast Notification System

## Identity & Working Directory
- Archetype: teamwork_preview_worker
- Working Directory: d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m1
- Parent Conversation ID: 4e5ea7ed-4eab-4f39-8ba6-6043b827ee2d

## Mandatory References
- Authoritative User Request: `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`
- Project Blueprint: `d:\shlok\ai agents\sih hackathon project\PROJECT.md`
- Explorer 1 Report: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_1\survey_report.md`
- Explorer 2 Report: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_2\survey_report.md`
- Explorer 3 Report: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_3\survey_report.md`
- Domain Skill: `C:\Users\Admin\.gemini\config\skills\engineering-frontend-developer\SKILL.md`

## Write Ownership
You EXCLUSIVELY own:
- `frontend/src/context/ToastContext.tsx` (new file)
- `frontend/src/components/ui/Toast.tsx` (new file)
- `frontend/src/App.tsx` (only for wrapping the application with `<ToastProvider>`)

DO NOT touch backend files or dashboard feature logic outside of mounting the provider.

## Implementation Requirements
1. **Toast Notification System (R3)**:
   - Create a clean, elegant, non-intrusive Toast notification provider using React and Tailwind CSS.
   - Support `type: 'success' | 'error' | 'info' | 'warning'`.
   - Provide auto-dismiss (e.g. 3-4s timer), animated entrance/exit, manual close button.
   - Export a custom hook `useToast()` exposing:
     - `showToast(message: string, type?: ToastType, title?: string)`
     - `showComingSoon(featureName?: string)` which renders a clean "Coming Soon: [featureName] is arriving in the next release!" toast per R4.
2. **Mount in App**:
   - Wrap the router or root route element in `frontend/src/App.tsx` with `<ToastProvider>`.
3. **Verification**:
   - Run `npm run build` or Vite build in `frontend/` using powershell to verify that TypeScript compiles without errors and the build succeeds.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When done, write your report to `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_worker_m1\handoff.md` and send a message to parent.
