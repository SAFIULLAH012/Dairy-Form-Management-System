@echo off
title Dairy Farm ERP Server
SET PATH=C:\Program Files\nodejs;%PATH%
echo Starting Dairy Farm ERP Server...
echo Open your browser at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server.
echo.
cd /d "%~dp0"
node node_modules\tsx\dist\cli.mjs server.ts
pause
