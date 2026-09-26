# SocioSolve - Standalone Portable Package

This folder contains the complete **SocioSolve** project with all pre-installed dependencies for both the frontend (Node.js/Vite/React) and backend (Python/FastAPI/SQLite).

---

## 🚀 How to Run on Any Computer / Laptop

### Option 1: 1-Click Launch (Recommended)
Just double-click:
👉 **`START_PROJECT.bat`**

This will automatically:
1. Start the FastAPI Backend on `http://localhost:8004`
2. Start the React Frontend on `http://localhost:5173`
3. Automatically open your browser to `http://localhost:5173`

---

### Option 2: Run Frontend & Backend Separately

#### 1. Frontend
- Double-click **`START_FRONTEND.bat`**
- Or in terminal:
  ```bash
  cd frontend
  npm run dev
  ```
- Open browser at `http://localhost:5173`

#### 2. Backend
- Double-click **`START_BACKEND.bat`**
- Or in terminal:
  ```bash
  cd backend
  venv\Scripts\activate
  uvicorn main:app --host 0.0.0.0 --port 8004 --reload
  ```

---

## 📦 What is Included in this Package

- **All Frontend Dependencies**: `frontend/node_modules/` is fully bundled and verified.
- **Pre-built Production Frontend**: `frontend/dist/` is pre-compiled.
- **All Backend Dependencies**: `backend/venv/` with all Python packages pre-installed.
- **SQLite Database**: `backend/sanjha.db` with sample civic complaints, official data, and student solver chapters.
- **API Keys & Environment**: `backend/.env` pre-configured.
- **Redesigned Dashboard**: Streamlined 4-tab Citizen Dashboard with progressive disclosure and single primary CTA.

---

## 🛠 Prerequisites on Target PC
- **Node.js** (v18 or higher): To run `npm run dev`
- **Python** (v3.10 to v3.12): To run the FastAPI backend (optional if using mock mode in the frontend)
