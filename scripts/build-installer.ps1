# BA Dairy Farm ERP - Automated Single-File Installer Generator
$ErrorActionPreference = "Stop"

$baseDir = Split-Path -Parent $PSScriptRoot
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " 🚀 Building Single-File Installer: BA_Farm_Setup.exe" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Ensure portable Node.js runtime is bundled
$runtimeDir = Join-Path $baseDir "runtime"
$runtimeNode = Join-Path $runtimeDir "node.exe"
if (-not (Test-Path $runtimeNode)) {
    Write-Host "1. Bundling portable node.exe into runtime folder..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
    $systemNode = (Get-Command node -ErrorAction SilentlyContinue).Source
    if ($systemNode -and (Test-Path $systemNode)) {
        Copy-Item $systemNode $runtimeNode -Force
        Write-Host "   Copied: $systemNode -> $runtimeNode" -ForegroundColor Green
    } else {
        Write-Warning "System node.exe not found. Please install Node.js."
    }
} else {
    Write-Host "1. Bundled portable node.exe verified." -ForegroundColor Green
}

# 2. Build Frontend Production Assets
Write-Host "2. Building Vite production bundle..." -ForegroundColor Yellow
Set-Location $baseDir
npm run build

# 3. Compile Native Windows Launcher
Write-Host "3. Compiling DairyFarmERP.exe with embedded circular cow icon..." -ForegroundColor Yellow
Get-Process DairyFarmERP -ErrorAction SilentlyContinue | Stop-Process -Force
npm run build:exe

# 4. Locate Inno Setup Compiler (ISCC.exe)
Write-Host "4. Locating Inno Setup Compiler..." -ForegroundColor Yellow
$isccCandidates = @(
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe",
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
)

$isccPath = $null
foreach ($c in $isccCandidates) {
    if (Test-Path $c) {
        $isccPath = $c
        break
    }
}

if (-not $isccPath) {
    throw "ISCC.exe not found! Please ensure Inno Setup is installed."
}
Write-Host "   Using compiler: $isccPath" -ForegroundColor Green

# 5. Compile Installer Script
Write-Host "5. Compiling Single-File Setup Executable..." -ForegroundColor Yellow
$issPath = Join-Path $baseDir "scripts\installer\setup.iss"
& "$isccPath" "$issPath"

# 6. Verify Output
$outExe = Join-Path $baseDir "installer_output\BA_Farm_Setup.exe"
if (Test-Path $outExe) {
    $sizeMB = [math]::Round((Get-Item $outExe).Length / 1MB, 2)
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host " ✅ SINGLE-FILE INSTALLER SUCCESSFULLY GENERATED!" -ForegroundColor Green
    Write-Host " 📁 Location: $outExe" -ForegroundColor Green
    Write-Host " 📊 Size:     $sizeMB MB (Completely Self-Contained)" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "You can now give this single file ('BA_Farm_Setup.exe') to anyone!" -ForegroundColor Cyan
    Write-Host "They just double-click it and the farm system runs without installing anything else." -ForegroundColor Cyan
} else {
    throw "Installer generation failed."
}
