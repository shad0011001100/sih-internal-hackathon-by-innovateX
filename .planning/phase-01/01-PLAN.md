---
wave: 1
depends_on: []
files_modified:
  - backend/main.py
  - backend/database.py
  - backend/alembic.ini
  - backend/requirements.txt
  - frontend/package.json
  - frontend/vite.config.ts
  - frontend/src/App.tsx
autonomous: true
---

# Phase 1: Walking Skeleton

## Objective
Set up the foundational stack (FastAPI, React, Postgres) so that the app compiles, runs locally, and can pass basic health checks end-to-end to prove the stack.

## Verification Criteria
- `cd backend && uvicorn main:app` starts the backend successfully.
- `cd frontend && npm run dev` starts the frontend successfully.
- Visiting `http://localhost:5173` shows a successful health check message fetched from the backend.
- `alembic upgrade head` runs without errors against the database.

## Tasks

<task>
<id>1</id>
<title>Initialize Backend FastAPI App</title>
<type>execute</type>
<read_first>
- .planning/PROJECT.md
</read_first>
<action>
1. Create `backend/` directory.
2. Create `backend/requirements.txt` with `fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `alembic`, `pydantic-settings`, `python-dotenv`.
3. Create `backend/main.py` with a simple FastAPI app instance, CORS middleware configured to allow `http://localhost:5173`, and a `GET /api/health` endpoint returning `{"status": "ok", "db": "disconnected"}`.
</action>
<acceptance_criteria>
- `backend/main.py` contains `FastAPI()` and `CORSMiddleware`.
- `backend/requirements.txt` lists the dependencies.
</acceptance_criteria>
</task>

<task>
<id>2</id>
<title>Setup SQLAlchemy & Alembic</title>
<type>execute</type>
<read_first>
- backend/main.py
</read_first>
<action>
1. Create `backend/database.py` with SQLAlchemy engine and `SessionLocal` setup using a `DATABASE_URL` env var.
2. Initialize alembic (`alembic init alembic`) in `backend/`.
3. Update `backend/alembic/env.py` to import a declarative base and setup `target_metadata`.
4. Update `backend/main.py` health check to actually try a simple DB query (like `SELECT 1`) to verify connection, returning `{"status": "ok", "db": "connected"}` if successful.
</action>
<acceptance_criteria>
- `backend/database.py` exists with `create_engine`.
- `backend/alembic.ini` exists.
- Health check endpoint attempts a DB connection.
</acceptance_criteria>
</task>

<task>
<id>3</id>
<title>Initialize Frontend Vite App</title>
<type>execute</type>
<read_first>
- .planning/PROJECT.md
</read_first>
<action>
1. Scaffold a React TS Vite app in `frontend/`.
2. Configure `frontend/vite.config.ts` with a proxy so `/api` routes to `http://localhost:8000`.
3. Install `tailwindcss` and initialize it (Tailwind is required for future Stitch UI drops).
4. Update `frontend/src/App.tsx` to use `fetch('/api/health')` on mount and display the resulting JSON on the screen.
</action>
<acceptance_criteria>
- `frontend/package.json` exists with React and Vite.
- `frontend/vite.config.ts` contains a proxy for `^/api`.
- `frontend/src/App.tsx` contains a `fetch` call to `/api/health`.
</acceptance_criteria>
</task>

## must_haves
- [ ] Backend runs via uvicorn
- [ ] Frontend runs via vite
- [ ] Frontend can successfully fetch from backend via proxy or CORS
- [ ] Backend can successfully connect to the Postgres database
