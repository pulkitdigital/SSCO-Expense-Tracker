# SSCO Expense Tracker — Backend

Tech Stack: Node.js + Express + SQLite + Firebase Admin + ExcelJS + pdf-lib

## Complete Folder Structure

```
Backend/
├── src/
│   ├── routes/
│   │   ├── expenses.js
│   │   ├── exports.js
│   │   └── profile.js
│   ├── services/
│   │   ├── calculations.js
│   │   ├── sqlite.js
│   │   ├── sync.js
│   │   ├── excelExport.js
│   │   └── pdfExport.js
│   └── index.js
├── data/
│   └── expenses.db  (auto-created by SQLite)
├── .env
├── .env.example
└── package.json
```

## File Roles Table

| File | Purpose |
|------|---------|
| `index.js` | Express server entry, port 5000, registers all routes, CORS |
| `routes/expenses.js` | `GET /api/expenses`, `POST /api/expenses`, `GET /api/expenses/:date` |
| `routes/exports.js` | `GET /api/export/excel`, `GET /api/export/pdf` |
| `routes/profile.js` | `GET /api/profile`, `POST /api/profile` |
| `services/calculations.js` | All formulas: GST 18%, carry forward, 50/50 split, variance |
| `services/sqlite.js` | SQLite DB init, all CRUD functions, profile table |
| `services/sync.js` | Firebase Admin init, `syncToFirebase()`, online push logic |
| `services/excelExport.js` | ExcelJS — styled `.xlsx` with color headers and formulas |
| `services/pdfExport.js` | pdf-lib — A4 PDF with letterhead, summary boxes, expense table |
| `data/expenses.db` | SQLite database file — auto-created, never commit to git |

## npm install commands

```bash
npm install express cors better-sqlite3 exceljs pdf-lib firebase-admin dotenv
npm install -D nodemon
```

## package.json scripts

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

## .env.example content

```
PORT=5000
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
DB_PATH=./data/expenses.db
```

## All API Endpoints table

| Method | Endpoint | Body/Params | Returns | Description |
|--------|----------|-------------|---------|-------------|
| GET | `/api/expenses` | — | array | All expenses ordered by date desc |
| POST | `/api/expenses` | body (see below) | object | Save new expense, auto-calculates all fields |
| GET | `/api/expenses/:date` | date param | object | Single expense for that date |
| GET | `/api/sync` | — | `{ synced, failed }` | Push unsynced SQLite rows to Firebase |
| GET | `/api/export/excel` | — | `.xlsx` file | Download Excel with all expenses |
| GET | `/api/export/pdf` | `?from=&to=` (optional) | `.pdf` file | Download PDF report for date range |
| GET | `/api/profile` | — | object | Get company profile |
| POST | `/api/profile` | body (see below) | object | Save company profile |

**POST `/api/expenses` body fields:**

```
{ date, acNo, freshReceipt, actualGST, actualSalary, actualOther }
```

**POST `/api/profile` body fields:**

```
{ companyName, address, gstin, phone, email }
```

## SQLite Tables

```sql
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  acNo TEXT,
  freshReceipt REAL,
  carryForward REAL,
  totalAmount REAL,
  budgetedGST REAL,
  budgetedSalary REAL,
  budgetedOther REAL,
  totalBudgeted REAL,
  actualGST REAL,
  actualSalary REAL,
  actualOther REAL, 
  totalSpent REAL,
  gstVariance REAL,
  salaryVariance REAL,
  otherVariance REAL,
  totalVariance REAL,
  synced INTEGER DEFAULT 0,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY,
  companyName TEXT DEFAULT 'SSCO',
  address TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  updatedAt TEXT
);
```

## SQLite Functions table

| Function | Description |
|----------|-------------|
| `initDB()` | Creates both tables if not exist, inserts default profile row |
| `insertExpense(data)` | Insert calculated expense row, return id |
| `getAllExpenses()` | Return all rows ordered by date DESC |
| `getExpenseByDate(date)` | Return single row for given date |
| `getLastExpense()` | Return most recent row (used for carry forward) |
| `getUnsyncedExpenses()` | Return rows where `synced = 0` |
| `markSynced(id)` | Set `synced = 1` for given id |
| `getProfile()` | Return profile row where `id = 1` |
| `saveProfile(data)` | `UPDATE profile SET` all fields `WHERE id = 1` |

## Business Logic — All Formulas

```
// Input fields (user provides these):
// date, acNo, freshReceipt, actualGST, actualSalary, actualOther

// Step 1: Carry Forward from previous day
carryForward = lastExpense ? (lastExpense.totalAmount - lastExpense.totalSpent) : 0

// Step 2: Total Amount
totalAmount = freshReceipt + carryForward

// Step 3: Budgeted breakdown
budgetedGST    = totalAmount * 0.18          // 18% GST
remaining      = totalAmount - budgetedGST   // 82%
budgetedSalary = remaining * 0.50            // 50% of remaining
budgetedOther  = remaining * 0.50            // 50% of remaining
totalBudgeted  = budgetedGST + budgetedSalary + budgetedOther  // always = totalAmount

// Step 4: Actuals (user entered)
totalSpent = actualGST + actualSalary + actualOther

// Step 5: Variances (positive = saved, negative = overspent)
gstVariance    = budgetedGST    - actualGST
salaryVariance = budgetedSalary - actualSalary
otherVariance  = budgetedOther  - actualOther
totalVariance  = gstVariance + salaryVariance + otherVariance

// Step 6: Next day carry forward
nextCarryForward = totalAmount - totalSpent
```

## Excel Export — Column Structure

| Column | Header Label | Background Color | Text Color |
|--------|--------------|------------------|------------|
| A | Date | white | black |
| B | A/c No | white | black |
| C | Fresh Receipt | yellow `#FFD700` | black |
| D | Carry Forward | yellow `#FFD700` | black |
| E | Total Amount | yellow `#FFD700` | black |
| F | Budgeted GST | green `#92D050` | black |
| G | Budgeted Salary | green `#92D050` | black |
| H | Budgeted Other | green `#92D050` | black |
| I | Total Budgeted | green `#92D050` | black |
| J | Actual GST | red `#FF0000` | white |
| K | Actual Salary | red `#FF0000` | white |
| L | Actual Other | red `#FF0000` | white |
| M | Total Spent | red `#FF0000` | white |
| N | GST Variance | gray `#D9D9D9` | black |
| O | Salary Variance | gray `#D9D9D9` | black |
| P | Other Variance | gray `#D9D9D9` | black |
| Q | Total Variance | gray `#D9D9D9` | black |

## PDF Export — Layout Structure

1. Header bar — purple `#6366f1`, company name + address + GSTIN from profile
2. Report title — "Daily Expense Report" + date range
3. Summary strip — 4 colored boxes: Total Receipt, Total Spent, Total Variance, Carry Forward
4. Expense table — all columns, color-coded headers matching Excel
5. Footer — page number + "Generated on [date]" + company name

## Firebase Sync Logic

1. `GET /api/sync` is called (by Frontend on app start or when online)
2. `sync.js` calls `getUnsyncedExpenses()` from `sqlite.js`
3. For each unsynced row: push to Firestore `expenses` collection
4. On success: `markSynced(row.id)` in SQLite
5. On error: log error, continue with next row
6. Return `{ synced: count, failed: count }`

Also note:

- Firebase Admin SDK uses service account (env vars), not client SDK
- Conflict prevention: date + acNo combination is unique key
- Internet check: done on Frontend side (`navigator.onLine`)

## Cursor Prompts Reference

1. **B-01 | Backend Express Server** — `src/index.js` + `package.json`
2. **B-02 | Calculations Service** — `src/services/calculations.js`
3. **B-03 | SQLite Service** — `src/services/sqlite.js`
4. **B-04 | Expenses API Route** — `src/routes/expenses.js`
5. **B-05 | Firebase Sync Service** — `src/services/sync.js`
6. **B-06 | Excel Export Service** — `src/services/excelExport.js`
7. **B-07 | PDF Export + Export Routes** — `src/services/pdfExport.js` + `src/routes/exports.js`
8. **B-08 | Profile Route + SQLite Profile** — `src/routes/profile.js` + `sqlite.js` updated
9. **B-09 | Environment + Package Scripts** — `.env.example` + `package.json` scripts
10. **B-10 | Final Backend Integration Check** — all files
