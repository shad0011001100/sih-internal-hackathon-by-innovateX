# Project: Sanjha

## What This Is
Sanjha ("shared/collective") is a platform for the Jharkhand Community Innovation & Research Platform. It routes citizen problems (like broken hand-pumps, road damage) through a verified pipeline to university departments and CSR funders, tracking the problem from report to measured community impact.

**One-line pitch:** Sanjha turns a citizen's voice note about a broken hand-pump into a tracked pipeline that ends in a funded, community-tested fix.

## Architecture
**Tech Stack (Rescoped MVP):**
- **Backend:** Python + FastAPI (Modular Monolith)
- **Database:** PostgreSQL + pgvector (Supabase managed)
- **Frontend:** React 18 + Vite (PWA with local offline queuing)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** TanStack Query + Zustand
- **Auth:** Supabase Auth (Mobile/OTP)
- **AI:** OpenAI API (Whisper for STT, embeddings for priority/clustering)

## Requirements

### Validated
(None yet — ship to validate)

### Active
- [ ] Citizen Portal: Voice/text/photo report submission, anonymous path, status tracking
- [ ] Intelligence Engine: Audio transcription, duplicate detection clustering, formula-based priority scoring
- [ ] University Portal: Department matching, challenge adoption, milestone tracking
- [ ] Funder Portal: Mentor/CSR funding workflow (status tracking only, no real payments)
- [ ] Impact Dashboard: Public aggregate view, single problem timeline traceability

### Out of Scope
- True background offline sync (using local storage fallback instead)
- Dynamic external geo APIs (using pre-seeded static data for District -> Village hierarchy)
- Complex ffmpeg audio conversions (using raw webm directly)
- Feature-phone IVR/USSD flows
- Real CSR payment gateways

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modular Monolith vs Microservices | Simpler to build and deploy for MVP | Fast iteration |
| Local Storage Sync vs Background Sync | Flawless demos without network unreliability | Explicit "Click to sync" |

---
*Last updated: 2026-09-12 after initialization*
