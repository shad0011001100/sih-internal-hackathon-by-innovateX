# DISPATCH — Challenger 2: Edge-Case & Resiliency Adversarial Testing

## Identity & Working Directory
- Archetype: teamwork_preview_challenger
- Working Directory: d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_challenger_2
- Parent Conversation ID: 4e5ea7ed-4eab-4f39-8ba6-6043b827ee2d

## Mandatory References
- Authoritative User Request: `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`
- Project Blueprint: `d:\shlok\ai agents\sih hackathon project\PROJECT.md`
- Test Infrastructure: `d:\shlok\ai agents\sih hackathon project\TEST_INFRA.md`
- Acceptance Verification Script: `d:\shlok\ai agents\sih hackathon project\scripts\verify_acceptance.py`

## Challenger Responsibilities
1. Perform adversarial edge-case testing on interactive features:
   - What happens when a user submits an empty grievance title?
   - What happens if GPS permission is denied or fails?
   - What happens if the backend server is offline or returns HTTP 500? Does the frontend crash or display user-friendly error toasts/banners?
   - What happens if a citizen upvotes repeatedly?
   - What happens if a student tries to adopt a problem without filling in details?
   - Does `POST /api/industry/fund` succeed under various payload formats (`project_id`, `projectId`, missing `offer_type`)?
2. Write and execute an automated adversarial test harness or stress test script.
3. Deliver your final verdict: **CONFIRM_CORRECT** (pass) or **FAIL** in `handoff.md` with full empirical evidence.

## 2026-09-13T14:12:21Z
User Prompt:
You are Challenger 2. Your working directory is `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_challenger_2`.
First, read:
- `d:\shlok\ai agents\sih hackathon project\ORIGINAL_REQUEST.md`
- `d:\shlok\ai agents\sih hackathon project\PROJECT.md`
- `d:\shlok\ai agents\sih hackathon project\TEST_INFRA.md`
- `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_challenger_2\DISPATCH.md`

Your Task:
Adversarial edge-case & resiliency testing:
1. Test edge cases: empty title submission, denied GPS permissions, network failures / offline backend responses, repeated upvotes, student problem adoption without required fields, and industry funding payload formats.
2. Write and execute an adversarial test script to empirically validate resilience.
3. Deliver your verdict: CONFIRM_CORRECT or FAIL in `d:\shlok\ai agents\sih hackathon project\.agents\teamwork_preview_challenger_2\handoff.md` and message parent.
