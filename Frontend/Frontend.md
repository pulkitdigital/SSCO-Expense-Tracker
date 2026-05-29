# SSCO Expense Tracker — Frontend

Tech Stack: React 19 + Electron 42 + Tailwind CSS + Recharts + Firebase

## Complete Folder Structure

```
Frontend/
├── public/
│   ├── electron.js
│   ├── preload.js
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   ├── StatCard.jsx
│   │   ├── Toast.jsx
│   │   └── Skeleton.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── AddExpense.jsx
│   │   ├── AllExpenses.jsx
│   │   └── Profile.jsx
│   ├── services/
│   │   ├── firebase.js
│   │   └── api.js
│   ├── context/
│   │   └── AppContext.jsx
│   ├── hooks/
│   │   └── useToast.js
│   ├── utils/
│   │   └── fileDownload.js
│   ├── App.js
│   └── index.css
├── .env
├── .env.example
├── tailwind.config.js
└── package.json
```

## File Roles Table

| File | Type | Purpose |
|------|------|---------|
| `public/electron.js` | Electron | Main process — BrowserWindow, backend spawn (production), IPC save dialogs |
| `public/preload.js` | Electron | `contextBridge` — exposes `window.electron.ipcRenderer.invoke` to renderer |
| `public/index.html` | Static | CRA HTML shell — root mount point for React |
| `public/favicon.ico` | Static | App favicon |
| `src/components/Sidebar.jsx` | React | Fixed left nav — routes, online/offline indicator |
| `src/components/Navbar.jsx` | React | Top bar — page title, sync button, date, company name |
| `src/components/StatCard.jsx` | React | Reusable metric card with icon, currency value, optional trend |
| `src/components/Toast.jsx` | React | Toast UI — success/error/warning/info, auto-dismiss, slide-in |
| `src/components/Skeleton.jsx` | React | Loading placeholders — card, row, chart shapes |
| `src/pages/Dashboard.jsx` | React | Summary stats + bar chart (7 days) + pie chart (today budget) |
| `src/pages/AddExpense.jsx` | React | Daily entry form + live calculated preview panel |
| `src/pages/AllExpenses.jsx` | React | Searchable table, filters, Excel/PDF export buttons |
| `src/pages/Profile.jsx` | React | Company profile form + live PDF letterhead preview |
| `src/services/firebase.js` | Service | Firebase Firestore CRUD for expenses and profile (v9 modular) |
| `src/services/api.js` | Service | All `fetch()` calls to Express backend on port 5000 |
| `src/context/AppContext.jsx` | React | Global state — expenses, profile, loading, online, toast, sync |
| `src/hooks/useToast.js` | React | Toast state hook — `showToast`, `hideToast` |
| `src/utils/fileDownload.js` | Util | Electron IPC or browser blob download for Excel/PDF |
| `src/App.js` | React | `HashRouter`, layout (Sidebar + Navbar + Outlet), Toast host |
| `src/index.css` | Styles | Tailwind directives, Inter font, component utility classes |
| `.env` | Config | Local secrets — Firebase keys, backend URL (not committed) |
| `.env.example` | Config | Template for required `REACT_APP_*` variables |
| `tailwind.config.js` | Config | Tailwind theme — colors, fonts, shadows, animations |
| `package.json` | Config | Dependencies, scripts (`start`, `electron-dev`, `dist`) |

## npm install commands

Already in `package.json` (no need to install):

```
react, react-dom, react-scripts, web-vitals
electron, electron-builder, concurrently, cross-env, wait-on
```

Need to install:

```bash
npm install react-router-dom firebase recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## .env.example content

```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_BACKEND_URL=http://localhost:5000
```

## All Pages — what each page does

### Dashboard

- **Route:** `/`
- **What the user sees:** Four summary stat cards, bar chart (last 7 days spending by category), pie chart (today’s budget split), or skeleton/empty states.
- **Reads from context:** `expenses`, `loading`
- **Actions:** None (read-only); data loaded via context on mount.

### Add Expense

- **Route:** `/add`
- **What the user sees:** Six-field entry form (date, A/c No, fresh receipt, three actuals) and live read-only preview of calculated budgets and variance.
- **Reads from context:** `expenses`, `loading`, `saveExpense`, `showToast`
- **Actions:** `saveExpense()` on submit → `showToast()` on success/error.

### All Expenses

- **Route:** `/all`
- **What the user sees:** Search and date filters, summary row, full expense table with color-coded column groups, Excel/PDF export buttons.
- **Reads from context:** `expenses`, `loading`
- **Actions:** `downloadExcel()`, `downloadPDF(from, to)` from `api.js` (not context).

### Profile

- **Route:** `/profile`
- **What the user sees:** Company info form (name, address, GSTIN, phone, email) and live letterhead preview matching PDF styling.
- **Reads from context:** `profile`, `updateProfile`
- **Actions:** `updateProfile(form)` on save.

## Context (AppContext) — state and actions table

| Name | Type | Description |
|------|------|-------------|
| `expenses` | State | Array of expense rows from backend SQLite API |
| `profile` | State | Company profile object (`companyName`, `address`, `gstin`, `phone`, `email`) |
| `loading` | State | `true` while initial expense fetch is in progress |
| `isOnline` | State | `navigator.onLine` — updated via window online/offline events |
| `syncing` | State | `true` while manual or auto sync to Firebase is running |
| `toast` | State | `{ show, message, type }` for global toast display |
| `loadExpenses` | Action | `GET /api/expenses` — refresh expense list |
| `saveExpense` | Action | `POST /api/expenses` then silent reload |
| `updateProfile` | Action | `POST /api/profile` then update local profile state |
| `triggerSync` | Action | `GET /api/sync` then silent expense reload |
| `showToast` | Action | Show global toast with message and type |
| `hideToast` | Action | Hide global toast |

## Business Logic (inline in AddExpense.jsx)

```
carryForward = lastExpense ? (lastExpense.totalAmount - lastExpense.totalSpent) : 0
totalAmount = freshReceipt + carryForward
budgetedGST = totalAmount * 0.18
remaining = totalAmount - budgetedGST
budgetedSalary = remaining * 0.50
budgetedOther = remaining * 0.50
totalBudgeted = budgetedGST + budgetedSalary + budgetedOther
totalSpent = actualGST + actualSalary + actualOther
totalVariance = totalBudgeted - totalSpent
nextDayCarryForward = totalAmount - totalSpent
```

## Electron IPC Handlers table

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `save-excel` | renderer → main | Native save dialog for `.xlsx` file; writes buffer to chosen path |
| `save-pdf` | renderer → main | Native save dialog for `.pdf` file; writes buffer to chosen path |

## How to Run

Dev mode — two terminals:

**Terminal 1:**

```bash
cd Backend && npm run dev
```

**Terminal 2:**

```bash
cd Frontend && npm run electron-dev
```

Build `.exe`:

```bash
cd Frontend && npm run dist
```

Output: `Frontend/dist/SSCO Expense Tracker Setup.exe`

## Cursor Prompts Reference

1. **F-01 | Tailwind Config + Global Styles** — `tailwind.config.js` + `index.css`
2. **F-02 | Firebase Service** — `src/services/firebase.js`
3. **F-03 | Backend API Service** — `src/services/api.js`
4. **F-04 | App Context** — `src/context/AppContext.jsx`
5. **F-05 | Toast Component** — `src/components/Toast.jsx` + `src/hooks/useToast.js`
6. **F-06 | Skeleton Component** — `src/components/Skeleton.jsx`
7. **F-07 | StatCard Component** — `src/components/StatCard.jsx`
8. **F-08 | Sidebar Component** — `src/components/Sidebar.jsx`
9. **F-09 | Navbar Component** — `src/components/Navbar.jsx`
10. **F-10 | App Router + Layout** — `src/App.js`
11. **F-11 | Dashboard Page** — `src/pages/Dashboard.jsx`
12. **F-12 | Add Expense Page** — `src/pages/AddExpense.jsx`
13. **F-13 | All Expenses Page** — `src/pages/AllExpenses.jsx`
14. **F-14 | Profile Page** — `src/pages/Profile.jsx`
15. **F-15 | Electron Main Process** — `public/electron.js`
16. **F-16 | Preload + File Download** — `public/preload.js` + `src/utils/fileDownload.js`
17. **F-17 | Final Integration Check** — all files
