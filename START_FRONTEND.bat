@echo off
title SocioSolve - Frontend
cd /d "%~dp0frontend"
echo ========================================================
echo           SocioSolve Frontend (React + Vite)
echo ========================================================
echo Starting frontend dev server on http://localhost:5173 ...
call npm run dev
pause
