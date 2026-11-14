# 🐄 Dairy Farm ERP
### Offline-First Farm Management System for Windows

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-MIT-orange)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)

> A complete, professional ERP system built specifically for dairy farm operations. Works **100% offline** — no internet required after installation. All data is stored locally on your machine.

---

## 📸 Screenshots

| Dashboard | Animals | Milk Records |
|-----------|---------|--------------|
| Real-time herd stats | Full cow lifecycle | Shift-wise milk tracking |

---

## ✨ Features

### 🐄 Herd Management
- Add/Edit animals with Tag No. as primary identifier
- Track stages: Milking, Pregnant, Dry, Heifer/Calf
- Group management (High, Low, Breeding, Calves, Fresh)
- Full animal profiles and history

### 🥛 Milk Production
- 3-shift recording (Morning, Afternoon, Evening)
- Per-animal milk tracking
- Monthly trend reports

### 💰 Financial Management
- Milk sales & customer invoices
- Farm expenses tracking
- Animal sale revenue in P&L
- Complete Profit & Loss reports

### 🏥 Health & Vaccination
- Veterinary case management
- Vaccination schedules with auto-reminders
- Deworming records
- Auto-sync to Expenses

### 🌾 Feed & Inventory
- Daily feed recording (Maund/KG)
- Inventory stock management
- Low stock alerts

### 👷 Workers & Payroll
- Worker profiles
- Salary & advance management

### 📊 Reports
- Financial P&L Report
- Milk production trends
- Herd statistics
- Export to CSV

### ⚙️ Settings
- Farm name customization (shown in sidebar)
- Currency, units, timezone
- Backup & Restore (JSON)
- Data import/export (CSV)

---

## 🖥️ System Requirements

| Requirement | Minimum |
|-------------|---------|
| OS | Windows 10 / 11 (64-bit) |
| RAM | 4 GB |
| Storage | 500 MB free space |
| Internet | ❌ Not required |

---

## 🚀 Installation (Client)

### Option 1: Single EXE Installer (Recommended)
1. Download `DairyFarmERP-Setup.exe`
2. **Double-click** to run
3. It will install to `C:\DairyFarmERP\`
4. A **Desktop shortcut** is created automatically
5. Double-click the shortcut — **Done!** 🎉

### Option 2: Portable Folder
1. Copy the entire `dist-electron\Dairy Farm ERP-win32-x64\` folder
2. Double-click `Dairy Farm ERP.exe` inside it

---

## 🛠️ Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### Clone & Run
```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/dairy-farm-erp.git
cd dairy-farm-erp

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
# OR double-click start-server.bat

# 4. Open browser
# http://localhost:3001
```

### Build Desktop EXE
```bash
# Requires electron & electron-builder installed
npm install -D electron electron-builder

# Build (requires internet for first-time Electron download)
npm run dist

# Output: dist-electron/DairyFarmERP-Setup.exe
```

---

## 📁 Project Structure

```
dairy-farm-erp/
│
├── 📄 electron.js              # Electron Windows desktop entry (single-instance & process management)
├── 📄 server.ts                # Server entry point & environment bootstrapper
├── 📄 loading.html             # App loading screen
├── 📄 start-server.bat         # Quick browser launcher (Windows)
├── 📄 start-windows-app.bat    # Quick Electron desktop launcher (Windows)
├── 📄 package.json             # Project config & scripts
│
├── 📂 src/
│   ├── 📂 client/              # API client layer with offline fallback
│   │   └── api.ts              # Strongly typed REST client
│   │
│   ├── 📂 components/          # Reusable UI components
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── Header.tsx          # Top header bar
│   │   └── ...
│   │
│   ├── 📂 domain/              # Clean Architecture Domain Core
│   │   ├── types.ts            # Enterprise domain entities & DTOs
│   │   ├── repositories.ts     # Domain repository interfaces
│   │   ├── calculations.ts     # Pure mathematical domain rules (SNF, Maunds, etc.)
│   │   └── services/           # Domain business services (Animal, Milk, Sales, etc.)
│   │
│   ├── 📂 infrastructure/      # Technical infrastructure & storage
│   │   ├── database/
│   │   │   ├── sqliteDb.ts     # SQLite database engine
│   │   │   ├── migrations.ts   # Versioned schema migrations
│   │   │   └── repositories.ts # Concrete SQLite repository implementations
│   │   └── platform/           # Platform abstraction (Windows Desktop / Web)
│   │
│   ├── 📂 server/              # Modular Enterprise Backend Architecture
│   │   ├── container.ts        # Dependency Injection / Service Registry
│   │   ├── app.ts              # Express application factory
│   │   ├── middleware/         # Error handling & request validation
│   │   └── routes/             # Isolated domain route controllers
│   │       ├── animal.routes.ts
│   │       ├── milk.routes.ts
│   │       ├── feed.routes.ts
│   │       ├── inventory.routes.ts
│   │       ├── healthCare.routes.ts
│   │       ├── breeding.routes.ts
│   │       ├── sales.routes.ts
│   │       ├── worker.routes.ts
│   │       ├── finance.routes.ts
│   │       ├── reminder.routes.ts
│   │       ├── report.routes.ts
│   │       ├── settings.routes.ts
│   │       ├── system.routes.ts
│   │       └── index.ts
│   │
│   └── 📂 pages/               # Desktop application screen views
│       ├── DashboardPage.tsx
│       ├── AnimalsPage.tsx
│       ├── MilkPage.tsx
│       ├── HealthPage.tsx
│       ├── SettingsPage.tsx
│       └── ...
│
├── 📂 tests/                   # Domain & benchmark test suites
├── 📂 public/                  # Static assets
└── 📂 dist/                    # Production bundle output
```

---

## 🗄️ Database

- **Engine:** SQLite (via `better-sqlite3`)
- **Location:** `dairy_farm.sqlite` (next to the executable)
- **Backup:** Settings → Backup & Restore → Download JSON
- **Auto-migrations:** Schema updates apply automatically on startup

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron.js v44 |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Icons | Lucide React |
| Build Tool | Vite |

---

## 🔒 Data Privacy

All data is stored **100% locally** on the user's machine. No data is sent to any server or cloud. The system works without internet connection.

---

## 📝 License

MIT License © 2025 — Built for professional dairy farm management.

---

## 💬 Support

For issues or feature requests, please open a GitHub Issue.
