# Create Desktop Shortcut for BA Farm
$wsh = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$baseDir = Split-Path -Parent $PSScriptRoot

$shortcutPath = Join-Path $desktop "BA Farm.lnk"
$exePath = Join-Path $baseDir "DairyFarmERP.exe"
$icoPath = Join-Path $baseDir "ba-farm.ico"
if (-not (Test-Path $icoPath)) {
    $icoPath = Join-Path $baseDir "app-icon.ico"
}

$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = $baseDir
if (Test-Path $icoPath) {
    $shortcut.IconLocation = "$icoPath,0"
}
$shortcut.Description = "BA Farm Management System"
$shortcut.Save()

Write-Host "✅ Desktop shortcut created: $shortcutPath"
