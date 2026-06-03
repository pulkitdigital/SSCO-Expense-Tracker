const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const defaultDataDir = path.join(__dirname, '../../data');
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(defaultDataDir, 'expenses.db');
const dataDir = path.dirname(dbPath);

let db;

/**
 * Opens the database connection (creates the data directory if needed).
 * @returns {import('better-sqlite3').Database}
 */
function getDB() {
  if (!db) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(dbPath);
  }
  return db;
}

/**
 * Creates the expenses table if it does not already exist.
 */
function initDB() {
  const database = getDB();
  database.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      acNo TEXT,
      freshReceipt REAL NOT NULL DEFAULT 0,
      carryForward REAL NOT NULL DEFAULT 0,
      prevRemainingGST REAL DEFAULT 0,
      totalAmount REAL NOT NULL DEFAULT 0,
      budgetedGST REAL NOT NULL DEFAULT 0,
      budgetedSalary REAL NOT NULL DEFAULT 0,
      budgetedOther REAL NOT NULL DEFAULT 0,
      totalBudgeted REAL NOT NULL DEFAULT 0,
      actualGST REAL NOT NULL DEFAULT 0,
      actualSalary REAL NOT NULL DEFAULT 0,
      actualOther REAL NOT NULL DEFAULT 0,
      totalSpent REAL NOT NULL DEFAULT 0,
      gstVariance REAL NOT NULL DEFAULT 0,
      salaryVariance REAL NOT NULL DEFAULT 0,
      otherVariance REAL NOT NULL DEFAULT 0,
      totalVariance REAL NOT NULL DEFAULT 0,
      synced INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
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

    INSERT OR IGNORE INTO profile (id) VALUES (1);
  `);

  try {
    db.prepare('ALTER TABLE expenses ADD COLUMN prevRemainingGST REAL DEFAULT 0').run();
  } catch (e) {
    // column already exists, ignore
  }
}

/**
 * Inserts one expense row and returns the new row id.
 * @param {object} data - Expense fields (date, acNo, amounts, variances, etc.)
 * @returns {number} Inserted row id
 */
function insertExpense(data) {
  const stmt = getDB().prepare(`
    INSERT INTO expenses (
      date, acNo, freshReceipt, carryForward, prevRemainingGST, totalAmount,
      budgetedGST, budgetedSalary, budgetedOther, totalBudgeted,
      actualGST, actualSalary, actualOther, totalSpent,
      gstVariance, salaryVariance, otherVariance, totalVariance,
      synced
    ) VALUES (
      @date, @acNo, @freshReceipt, @carryForward, @prevRemainingGST, @totalAmount,
      @budgetedGST, @budgetedSalary, @budgetedOther, @totalBudgeted,
      @actualGST, @actualSalary, @actualOther, @totalSpent,
      @gstVariance, @salaryVariance, @otherVariance, @totalVariance,
      @synced
    )
  `);

  const result = stmt.run({
    date: data.date,
    acNo: data.acNo ?? null,
    freshReceipt: data.freshReceipt ?? 0,
    carryForward: data.carryForward ?? 0,
    prevRemainingGST: data.prevRemainingGST ?? 0,
    totalAmount: data.totalAmount ?? 0,
    budgetedGST: data.budgetedGST ?? 0,
    budgetedSalary: data.budgetedSalary ?? 0,
    budgetedOther: data.budgetedOther ?? 0,
    totalBudgeted: data.totalBudgeted ?? 0,
    actualGST: data.actualGST ?? 0,
    actualSalary: data.actualSalary ?? 0,
    actualOther: data.actualOther ?? 0,
    totalSpent: data.totalSpent ?? 0,
    gstVariance: data.gstVariance ?? 0,
    salaryVariance: data.salaryVariance ?? 0,
    otherVariance: data.otherVariance ?? 0,
    totalVariance: data.totalVariance ?? 0,
    synced: data.synced ?? 0,
  });

  return result.lastInsertRowid;
}

/**
 * Returns all expense rows ordered by date descending.
 * @returns {object[]}
 */
function getAllExpenses() {
  return getDB()
    .prepare('SELECT * FROM expenses ORDER BY date DESC')
    .all();
}

/**
 * Returns the expense row for a specific date, or undefined if none exists.
 * @param {string} date - Date key (e.g. YYYY-MM-DD)
 * @returns {object|undefined}
 */
function getExpenseByDate(date) {
  return getDB()
    .prepare('SELECT * FROM expenses WHERE date = ?')
    .get(date);
}

/**
 * Returns the most recent expense row (by date) for carry-forward lookups.
 * @returns {object|undefined}
 */
function getLastExpense() {
  return getDB()
    .prepare('SELECT * FROM expenses ORDER BY date DESC LIMIT 1')
    .get();
}

/**
 * Returns a single expense row by id.
 * @param {number} id
 * @returns {object|undefined}
 */
function getExpenseById(id) {
  return getDB().prepare('SELECT * FROM expenses WHERE id = ?').get(id);
}

/**
 * Returns the expense immediately before a date (excluding an id).
 * @param {string} date
 * @param {number} excludeId
 * @returns {object|undefined}
 */
function getExpenseBeforeDate(date, excludeId) {
  return getDB()
    .prepare(
      'SELECT * FROM expenses WHERE date < ? AND id != ? ORDER BY date DESC LIMIT 1'
    )
    .get(date, excludeId);
}

/**
 * Updates an expense row and marks it unsynced.
 * @param {number} id
 * @param {object} data
 * @returns {object|undefined}
 */
function updateExpense(id, data) {
  getDB()
    .prepare(`
      UPDATE expenses SET
        date = @date,
        acNo = @acNo,
        freshReceipt = @freshReceipt,
        carryForward = @carryForward,
        totalAmount = @totalAmount,
        budgetedGST = @budgetedGST,
        budgetedSalary = @budgetedSalary,
        budgetedOther = @budgetedOther,
        totalBudgeted = @totalBudgeted,
        actualGST = @actualGST,
        actualSalary = @actualSalary,
        actualOther = @actualOther,
        totalSpent = @totalSpent,
        gstVariance = @gstVariance,
        salaryVariance = @salaryVariance,
        otherVariance = @otherVariance,
        totalVariance = @totalVariance,
        synced = 0
      WHERE id = @id
    `)
    .run({
      id,
      date: data.date,
      acNo: data.acNo ?? null,
      freshReceipt: data.freshReceipt ?? 0,
      carryForward: data.carryForward ?? 0,
      totalAmount: data.totalAmount ?? 0,
      budgetedGST: data.budgetedGST ?? 0,
      budgetedSalary: data.budgetedSalary ?? 0,
      budgetedOther: data.budgetedOther ?? 0,
      totalBudgeted: data.totalBudgeted ?? 0,
      actualGST: data.actualGST ?? 0,
      actualSalary: data.actualSalary ?? 0,
      actualOther: data.actualOther ?? 0,
      totalSpent: data.totalSpent ?? 0,
      gstVariance: data.gstVariance ?? 0,
      salaryVariance: data.salaryVariance ?? 0,
      otherVariance: data.otherVariance ?? 0,
      totalVariance: data.totalVariance ?? 0,
    });

  return getExpenseById(id);
}

/**
 * Deletes an expense row by id.
 * @param {number} id
 * @returns {{ changes: number }}
 */
function deleteExpense(id) {
  const result = getDB().prepare('DELETE FROM expenses WHERE id = ?').run(id);
  return { changes: result.changes };
}

/**
 * Returns all rows that have not been synced to Firebase yet.
 * @returns {object[]}
 */
function getUnsyncedExpenses() {
  return getDB()
    .prepare('SELECT * FROM expenses WHERE synced = 0 ORDER BY date ASC')
    .all();
}

/**
 * Marks an expense row as synced.
 * @param {number} id - Row id
 * @returns {boolean} True if a row was updated
 */
function markSynced(id) {
  const result = getDB()
    .prepare('UPDATE expenses SET synced = 1 WHERE id = ?')
    .run(id);
  return result.changes > 0;
}

/**
 * Returns the company profile row (id = 1).
 * @returns {object|undefined}
 */
function getProfile() {
  return getDB().prepare('SELECT * FROM profile WHERE id = 1').get();
}

/**
 * Updates the company profile row (id = 1).
 * @param {object} data - Profile fields to save
 * @returns {object} Updated profile row
 */
function saveProfile(data) {
  getDB()
    .prepare(`
      UPDATE profile SET
        companyName = @companyName,
        address = @address,
        gstin = @gstin,
        phone = @phone,
        email = @email,
        updatedAt = datetime('now')
      WHERE id = 1
    `)
    .run({
      companyName: data.companyName ?? 'SSCO',
      address: data.address ?? '',
      gstin: data.gstin ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
    });

  return getProfile();
}

initDB();

module.exports = {
  initDB,
  insertExpense,
  getAllExpenses,
  getExpenseByDate,
  getLastExpense,
  getExpenseById,
  getExpenseBeforeDate,
  updateExpense,
  deleteExpense,
  getUnsyncedExpenses,
  markSynced,
  getProfile,
  saveProfile,
};
