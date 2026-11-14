@echo off
title Dairy Farm ERP Windows Desktop
echo ========================================================
echo   Launching Dairy Farm ERP (Windows Desktop App)
echo ========================================================
cd /d "%~dp0"
npm run electron
if %errorlevel% neq 0 (
  echo.
  echo Electron launch encountered an issue. Falling back to local server...
  call start-server.bat
)

