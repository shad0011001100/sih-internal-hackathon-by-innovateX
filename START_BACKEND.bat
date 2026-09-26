@echo off
title SocioSolve - Backend API
cd /d "%~dp0backend"
echo ========================================================
echo           SocioSolve Backend (FastAPI)
echo ========================================================
if exist "venv\Scripts\python.exe" (
    echo Using bundled Python virtual environment...
    "venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload
) else (
    echo Virtual environment not found. Using system python...
    python -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload
)
pause
