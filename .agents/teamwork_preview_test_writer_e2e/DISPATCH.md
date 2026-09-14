# DISPATCH — E2E Test Writer: Test Harness & Automated Verification

## Identity & Working Directory
- Archetype: teamwork_preview_test_writer
- Working Directory: d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_test_writer_e2e
- Parent Conversation ID: 4e5ea7ed-4eab-4f39-8ba6-6043b827ee2d

## Mandatory References
- Authoritative User Request: `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`
- Project Blueprint: `d:\shlok\ai agents\sih hackathon project\PROJECT.md`
- Explorer Reports: `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_explorer_survey_1\survey_report.md`, `survey_2`, `survey_3`

## Write Ownership
You EXCLUSIVELY own:
- `TEST_INFRA.md` (at project root)
- `scripts/verify_acceptance.py` or `scripts/verify_ui.cjs` (verification harness for acceptance criteria)

DO NOT modify frontend or backend implementation source files.

## Responsibilities
1. **Create `TEST_INFRA.md`** at project root following the E2E Testing Track template in the Project Pattern:
   - Document Test Philosophy (opaque-box, requirement-driven).
   - Enumerate test tiers (Tiers 1-4).
   - Define acceptance criteria checking methodology.
2. **Implement Automated Verification Script (`scripts/verify_acceptance.py`)**:
   - Check 1: Scan all `.tsx` and `.jsx` files in `frontend/src/` to verify **zero** dead `href="#"` links and **zero** inert `<button type="button">` elements without `onClick`.
   - Check 2: Scan all frontend fetch calls to verify presence of try/catch or `.catch()` error handling with state management.
   - Check 3: Automated navigation journey check (verifies routes exist and can be traversed).
   - Check 4: Backend API smoke check against live/mocked endpoints (`/api/health`, `/api/reports`, `/api/auth/me`, etc.).
3. **Execution & Baseline**:
   - Run the script to establish a baseline report of current failures vs passing criteria.
   - When all tests are ready, document the commands in your handoff.

When done, write your report to `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_test_writer_e2e\handoff.md` and send a message to parent.

## 2026-09-13T13:53:26Z
You are the E2E Test Writer. Your working directory is `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_test_writer_e2e`.
First, read:
- `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`
- `d:\shlok\ai agents\sih hackathon project\PROJECT.md`
- `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_test_writer_e2e\DISPATCH.md`

Your Task:
1. Create `TEST_INFRA.md` at project root documenting test tiers (Tiers 1-4) and acceptance checking methodology.
2. Create automated verification script `scripts/verify_acceptance.py` to check:
   - Check 1: 0 dead `href="#"` links across `frontend/src/`
   - Check 2: 0 inert `<button type="button">` without `onClick` across primary screens
   - Check 3: Every API fetch call has try/catch or `.catch()` error handling with loading/error state
   - Check 4: Navigation flow verification from Landing -> Role Selection -> Login -> Dashboard -> Action
   - Check 5: Backend API endpoint smoke verification
3. Run the verification script using python to record the initial baseline results.

When finished and verified, write `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_test_writer_e2e\handoff.md` and send a message to parent.
