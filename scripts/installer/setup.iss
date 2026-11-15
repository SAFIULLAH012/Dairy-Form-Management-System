; ===============================================================
; BA Dairy Farm ERP - Inno Setup Script
; Generates a Single-File Setup Installer: BA_Farm_Setup.exe
; ===============================================================

#define MyAppName "BA Farm Management System"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "BA Dairy Farm"
#define MyAppExeName "DairyFarmERP.exe"
#define MyAppIcon "ba-farm.ico"

[Setup]
AppId={{D37F8E92-3482-4BD1-9A31-4FE1C47E3291}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\BA Farm
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\..\installer_output
OutputBaseFilename=BA_Farm_Setup
SetupIconFile=..\..\{#MyAppIcon}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppIcon}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Files]
; Primary executable and icons
Source: "..\..\DairyFarmERP.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\ba-farm.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\app-icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\server.ts"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\USER_GUIDE.md"; DestDir: "{app}"; Flags: ignoreversion

; Embedded portable Node.js runtime (Zero external dependencies)
Source: "..\..\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs

; Production Web UI distribution
Source: "..\..\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

; Public static assets
Source: "..\..\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs

; Source and domain rules
Source: "..\..\src\*"; DestDir: "{app}\src"; Flags: ignoreversion recursesubdirs createallsubdirs

; Scripts and utilities
Source: "..\..\scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs

; Node modules dependencies
Source: "..\..\node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppIcon}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\BA Farm"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppIcon}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
