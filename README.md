

# SSCO Expense Tracker

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Electron](https://img.shields.io/badge/Electron-42-47848F?logo=electron)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![SQLite](https://img.shields.io/badge/SQLite-offline-003B57?logo=sqlite)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss)

---

A desktop expense tracking app for SSCO — built with Electron + React.
Tracks daily receipts and expenses with automatic GST, salary,
and variance calculations. Exports to Excel and PDF.
Stores data offline (SQLite) and syncs to cloud (Firebase) when online.

---

## Features

- [x] Daily expense entry with 6 input fields
- [x] Auto-calculation: GST 18%, salary 50/50 split, carry forward
- [x] Smart GST carry — previous day unspent GST tracked separately and added to next day GST budget
- [x] Live preview of all calculated values while typing
- [x] Carry Forward — previous day remaining auto-added to next day
- [x] Dashboard with stat cards and charts (bar + pie)
- [x] Full expense history table with search and date filter
- [x] Export to Excel (.xlsx) with color-coded headers
- [x] Export to PDF with company letterhead
- [x] Offline-first — works without internet (SQLite)
- [x] Auto sync to Firebase Firestore when online
- [x] Company profile with live PDF letterhead preview
- [x] Desktop app — packages as .exe / .dmg / .AppImage

---

## Project Structure

```
SSCO EXPENSE TRACKER/
├── Backend/                    ← Node.js + Express API server
│   ├── src/
│   │   ├── routes/             ← expenses.js, exports.js, profile.js
│   │   ├── services/           ← calculations, sqlite, sync, excel, pdf
│   │   └── index.js            ← Express entry (port 5000)
│   ├── data/
│   │   └── expenses.db         ← SQLite DB (auto-created)
│   ├── .env                    ← Firebase service account keys
│   └── package.json
│
├── Frontend/                   ← React + Electron app
│   ├── public/
│   │   ├── electron.js         ← Electron main process
│   │   └── preload.js          ← IPC context bridge
│   ├── src/
│   │   ├── components/         ← Sidebar, Navbar, StatCard, Toast, Skeleton
│   │   ├── pages/              ← Dashboard, AddExpense, AllExpenses, Profile
│   │   ├── services/           ← firebase.js, api.js
│   │   ├── context/            ← AppContext.jsx
│   │   └── utils/              ← fileDownload.js
│   ├── .env                    ← Firebase web config keys
│   └── package.json
│
└── README.md
```

---

## How It Works — Data Flow

1. User opens app → Electron loads React app from localhost:3000 (dev) or build/ (prod)
2. React app starts → AppContext loads expenses from Backend API
3. Backend API reads from SQLite database (local file)
4. User fills AddExpense form → types 6 fields
5. React calculates preview in real-time (no API call)
6. User clicks Save → POST /api/expenses to Backend
7. Backend runs calculations → inserts full row into SQLite → returns saved row
8. React reloads expenses list → Dashboard updates
9. When internet available → Frontend calls GET /api/sync
10. Backend pushes unsynced SQLite rows to Firebase Firestore → marks synced

---

## Business Logic — Calculation Rules

Given: freshReceipt, actualGST, actualSalary, actualOther

carryForward       = previousDay.totalAmount - previousDay.totalSpent
totalAmount        = freshReceipt + carryForward

budgetedGSTOnFresh = freshReceipt × 18%
prevRemainingGST   = previousDay.budgetedGST - previousDay.actualGST
budgetedGST        = budgetedGSTOnFresh + prevRemainingGST

nonGSTCarry        = carryForward - prevRemainingGST
remaining          = (freshReceipt - budgetedGSTOnFresh) + nonGSTCarry
budgetedSalary     = remaining × 50%
budgetedOther      = remaining × 50%
totalBudgeted      = budgetedGST + budgetedSalary + budgetedOther

totalSpent         = actualGST + actualSalary + actualOther
totalVariance      = totalBudgeted - totalSpent
  (positive = money saved, negative = overspent)

Key Rule:
- GST is budgeted only on freshReceipt, NOT on carryForward
- Previous day unspent GST (prevRemainingGST) is carried forward separately into today's GST budget
- carryForward splits into GST portion and non-GST portion to keep categories accurate

---

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- Git
- Firebase account (free tier) — for cloud sync
- Windows / macOS / Linux

---

## Installation & Setup

**Step 1 — Clone the repo:**

```bash
git clone [your-repo-url]
cd "SSCO EXPENSE TRACKER"
```

**Step 2 — Setup Backend:**

```bash
cd Backend
npm install
cp .env.example .env
# Fill in your Firebase service account details in .env
```

**Step 3 — Setup Frontend:**

```bash
cd ../Frontend
npm install
cp .env.example .env
# Fill in your Firebase web config in .env
```

**Step 4 — Firebase Setup:**

1. Go to console.firebase.google.com
2. Create project → name: "SSCO Tracker"
3. Firestore Database → Create → Start in test mode → asia-south1
4. Project Settings → Service Accounts → Generate new private key → Copy values to `Backend/.env`
5. Project Settings → Add Web App → Copy config values to `Frontend/.env`

---

## Running the App

**Dev mode:**

```bash
# Terminal 1 — Backend
cd Backend
npm run dev
# Server starts at http://localhost:5000
```

```bash
# Terminal 2 — Frontend + Electron
cd Frontend
npm run electron-dev
# Electron window opens automatically
```

**Web browser only (no Electron):**

```bash
cd Frontend
npm start
# Open http://localhost:3000
```

---

## Building Desktop App

**Windows (.exe):**

```bash
cd Frontend
npm run dist
# Output: Frontend/dist/SSCO Expense Tracker Setup.exe
```

**macOS (.dmg):**

```bash
cd Frontend
npm run dist
# Output: Frontend/dist/SSCO Expense Tracker.dmg
```

**Linux (.AppImage):**

```bash
cd Frontend
npm run dist
# Output: Frontend/dist/SSCO Expense Tracker.AppImage
```

---

## API Reference — Quick Table

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Save new expense (auto-calculates) |
| GET | `/api/expenses/:date` | Get expense for specific date |
| GET | `/api/sync` | Sync offline data to Firebase |
| GET | `/api/export/excel` | Download Excel file |
| GET | `/api/export/pdf` | Download PDF report |
| GET | `/api/profile` | Get company profile |
| POST | `/api/profile` | Save company profile |

---

## Export Formats

**Excel (.xlsx):**

- Color-coded column groups (Receipt=yellow, Budgeted=green, Actual=red, Variance=gray)
- Prev GST Carry column (orange) in Budgeted group showing previous day unspent GST
- All rows with ₹ Indian number formatting
- Auto-width columns, frozen header rows
- Title row merged across all columns

**PDF Report:**

- Company letterhead (from Profile settings)
- Summary boxes: Total Receipt, Total Spent, Variance, Carry Forward
- Full expense table
- Page numbers and generation date in footer

---

## .gitignore — what NOT to commit

```
node_modules/
.env
Frontend/build/
Backend/data/*.db
dist/
*.log
.DS_Store
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend not starting | Check Node.js version (need v18+), run `npm install` in `Backend/` |
| Electron window blank | Make sure Backend is running first, check port 5000 is free |
| Firebase sync not working | Check `.env` keys in both `Backend/` and `Frontend/` |
| Excel download not working | Check Backend is running, check browser console for errors |
| SQLite error on Windows | Run `npm rebuild better-sqlite3` in `Backend/` |
| Build fails | Delete `Frontend/node_modules` and reinstall |
| Old entries deleted after GitHub push | data/expenses.db is git-ignored — SQLite is local only. Use Firebase sync for cloud backup |

---

## Developer Notes

- Frontend and Backend are completely separate Node projects with their own `package.json`
- Frontend never directly touches SQLite — always goes through Backend API
- Calculations happen in two places: Backend (for saving) and Frontend (for live preview)
- In production Electron build, Backend is spawned as a child process automatically
- Firebase is used only for cloud backup — app fully works offline without it
