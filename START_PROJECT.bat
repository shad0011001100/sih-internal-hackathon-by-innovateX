@echo off
title SocioSolve Launcher
echo ========================================================
echo               SocioSolve Jharkhand
echo        Civic Grievance Redressal Platform
echo ========================================================
echo.
echo Launching SocioSolve on this computer...
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server (FastAPI on port 8004)...
start "SocioSolve Backend" cmd /c "%~dp0START_BACKEND.bat"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Vite on port 5173)...
start "SocioSolve Frontend" cmd /c "%~dp0START_FRONTEND.bat"

timeout /t 2 /nobreak >nul

echo.
echo Opening web browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo All services started!
echo Keep the backend and frontend command windows open while using the app.
echo.
