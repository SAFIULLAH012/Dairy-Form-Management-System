# BA Dairy Farm ERP - Automated Distribution Packager
$ErrorActionPreference = "Stop"

$baseDir = Split-Path -Parent $PSScriptRoot
Write-Host "📦 Starting BA Farm ERP Distribution Build..." -ForegroundColor Cyan

# 1. Build Frontend Production Assets
Write-Host "1. Building Vite Production Bundle..." -ForegroundColor Yellow
Set-Location $baseDir
npm run build

# 2. Build Native Windows Launcher Executable
Write-Host "2. Compiling DairyFarmERP.exe with embedded circular cow icon..." -ForegroundColor Yellow
npm run build:exe

# 3. Create Release Directory
$releaseDir = Join-Path $baseDir "release"
$portableDir = Join-Path $releaseDir "BA_Farm_ERP"
if (Test-Path $portableDir) {
    Remove-Item $portableDir -Recurse -Force
}
New-Item -ItemType Directory -Path $portableDir -Force | Out-Null

# 4. Copy Essential Application Files
Write-Host "3. Copying distribution files..." -ForegroundColor Yellow
$itemsToCopy = @(
    "DairyFarmERP.exe",
    "ba-farm.ico",
    "app-icon.ico",
    "server.ts",
    "package.json",
    "dist",
    "server",
    "src",
    "scripts",
    "README.md"
)

foreach ($item in $itemsToCopy) {
    $src = Join-Path $baseDir $item
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $portableDir -Recurse -Force
    }
}

# 5. Create a Quick Start Batch for easy launch
$startBat = Join-Path $portableDir "Start-BA-Farm.bat"
@"
@echo off
title BA Farm Management System
start "" "%~dp0DairyFarmERP.exe"
"@ | Set-Content -Path $startBat -Encoding ASCII

# 6. Create Readme Instructions for the end user
$setupTxt = Join-Path $portableDir "HOW_TO_RUN.txt"
@"
==================================================
   BA DAIRY FARM MANAGEMENT SYSTEM - USER SETUP
==================================================

HOW TO RUN:
1. Double-click 'DairyFarmERP.exe' (or 'Start-BA-Farm.bat').
2. The software will automatically:
   - Check and start the database server.
   - Open your desktop window / browser to BA Farm ERP.
   - Create a desktop shortcut 'BA Farm' with the farm icon.

REQUIREMENTS:
- Windows 10 or Windows 11 (64-bit).
- Node.js (v18 or higher): Download free from https://nodejs.org
  (If Node.js is not installed, the app will automatically ask you to download it).

FOR FULL OFFLINE PORTABILITY:
- You can place a copy of 'node.exe' directly inside this folder,
  and it will run completely standalone without installing anything!

SUPPORT & BACKUP:
- In the app, go to Settings -> 'Backup Database (JSON)' to safely save your farm data anytime.
==================================================
"@ | Set-Content -Path $setupTxt -Encoding UTF8

Write-Host "✅ Portable package created at: $portableDir" -ForegroundColor Green
Write-Host "   You can now zip the 'BA_Farm_ERP' folder and send it to any client/user!" -ForegroundColor Green
