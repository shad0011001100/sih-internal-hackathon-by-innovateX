# Walking Skeleton — Sanjha

**Phase:** 1
**Generated:** 2026-09-12

## Capability Proven End-to-End

A user can load the frontend, which fetches a basic health check and a static list of available endpoints from the FastAPI backend (connected to Postgres), proving the full stack configuration, CORS, and database connectivity.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend Framework | FastAPI (Python) | High performance, auto-docs, typed API. |
| Frontend Framework | Vite + React (TS) | Fast HMR, standard component model. |
| Data layer | PostgreSQL + SQLAlchemy 2.0 + Alembic | Robust ORM and migration tracking. |
| Auth | (None yet) | Deferred to Phase 2. |
| Styling | Tailwind CSS | Utility-first, needed for dropping in Stitch HTML later. |
| Directory layout | `backend/` and `frontend/` | Clear separation of concerns for full-stack. |

## Stack Touched in Phase 1

- [ ] Project scaffold (FastAPI, React, linting)
- [ ] Routing — basic API route (`/api/health`)
- [ ] Database — setup SQLAlchemy config, connect to Supabase Postgres, run one Alembic migration
- [ ] UI — simple fetch and render of API health
- [ ] Deployment — local `dev` commands documented

## Out of Scope (Deferred to Later Slices)

- Supabase Auth (Phase 2)
- Complex DB schemas for reports/universities (Phase 2)
- Stitch UI integration (We will drop the generated HTML/CSS into the React structure in later phases)
- AI / Whisper integration (Phase 4)

## Subsequent Slice Plan

- Phase 2: Authentication & Database Schema
- Phase 3: Citizen Reporting (Frontend + Local Queue)
- Phase 4: Problem Intelligence Engine (Backend AI)
- Phase 5: University & Funder Portals
