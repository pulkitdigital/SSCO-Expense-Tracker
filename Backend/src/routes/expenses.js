// const express = require('express');
// const { calculate, getCarryForward } = require('../services/calculations');
// const {
//   insertExpense,
//   getAllExpenses,
//   getLastExpense,
//   getExpenseByDate,
//   getExpenseById,
//   getExpenseBeforeDate,
//   updateExpense,
//   deleteExpense,
// } = require('../services/sqlite');
// const { syncToFirebase, isFirebaseEnabled } = require('../services/sync');

// const router = express.Router();

// // Background sync helper — never blocks the response
// function backgroundSync() {
//   if (!isFirebaseEnabled()) return;
//   syncToFirebase().catch(err =>
//     console.log('[sync] background sync failed:', err.message)
//   );
// }

// router.get('/expenses', (req, res) => {
//   res.json(getAllExpenses());
// });

// router.post('/expenses', (req, res) => {
//   console.log('POST /api/expenses body:', req.body);

//   const { date, acNo, freshReceipt, actualGST, actualSalary, actualOther } = req.body;

//   if (freshReceipt === undefined || freshReceipt === null || freshReceipt === '') {
//     return res.status(400).json({ error: 'freshReceipt is required' });
//   }

//   const parsedActualGST    = Number(actualGST    ?? 0);
//   const parsedActualSalary = Number(actualSalary ?? 0);
//   const parsedActualOther  = Number(actualOther  ?? 0);

//   const lastExpense  = getLastExpense();
//   const carryForward = lastExpense
//     ? getCarryForward(lastExpense.totalAmount, lastExpense.totalSpent)
//     : 0;

//   const calculated = calculate(
//     Number(freshReceipt),
//     carryForward,
//     parsedActualGST,
//     parsedActualSalary,
//     parsedActualOther
//   );

//   insertExpense({
//     date,
//     acNo,
//     freshReceipt: Number(freshReceipt),
//     carryForward,
//     ...calculated,
//     actualGST:    parsedActualGST,
//     actualSalary: parsedActualSalary,
//     actualOther:  parsedActualOther,
//   });

//   const saved = getExpenseByDate(date);

//   // Auto sync to Firebase after save
//   backgroundSync();

//   res.status(201).json(saved);
// });

// router.put('/expenses/:id', (req, res) => {
//   console.log('PUT /api/expenses/:id', req.params.id, req.body);
//   const id = Number(req.params.id);
//   if (!Number.isInteger(id) || id <= 0) {
//     return res.status(400).json({ error: 'Invalid expense id' });
//   }

//   const existing = getExpenseById(id);
//   if (!existing) {
//     return res.status(404).json({ error: 'Expense not found' });
//   }

//   const { date, acNo, freshReceipt, actualGST, actualSalary, actualOther } = req.body;

//   if (freshReceipt === undefined || freshReceipt === null || freshReceipt === '') {
//     return res.status(400).json({ error: 'freshReceipt is required' });
//   }

//   const parsedActualGST    = Number(actualGST    ?? 0);
//   const parsedActualSalary = Number(actualSalary ?? 0);
//   const parsedActualOther  = Number(actualOther  ?? 0);

//   const previous     = getExpenseBeforeDate(date, id);
//   const carryForward = previous
//     ? getCarryForward(previous.totalAmount, previous.totalSpent)
//     : 0;

//   const calculated = calculate(
//     Number(freshReceipt),
//     carryForward,
//     parsedActualGST,
//     parsedActualSalary,
//     parsedActualOther
//   );

//   const updated = updateExpense(id, {
//     date,
//     acNo,
//     freshReceipt: Number(freshReceipt),
//     carryForward,
//     ...calculated,
//     actualGST:    parsedActualGST,
//     actualSalary: parsedActualSalary,
//     actualOther:  parsedActualOther,
//   });

//   // Auto sync to Firebase after update
//   backgroundSync();

//   res.json(updated);
// });

// router.delete('/expenses/:id', (req, res) => {
//   console.log('DELETE /api/expenses/:id', req.params.id);
//   const id = Number(req.params.id);
//   if (!Number.isInteger(id) || id <= 0) {
//     return res.status(400).json({ error: 'Invalid expense id' });
//   }

//   const result = deleteExpense(id);
//   if (!result.changes) {
//     return res.status(404).json({ error: 'Expense not found' });
//   }

//   res.json({ success: true, id });
// });

// router.get('/expenses/:date', (req, res) => {
//   const expense = getExpenseByDate(req.params.date);
//   if (!expense) {
//     return res.status(404).json({ error: 'Expense not found for this date' });
//   }
//   res.json(expense);
// });

// module.exports = router;





























// const express = require('express');
// const { calculate, getCarryForward } = require('../services/calculations');
// const {
//   insertExpense,
//   getAllExpenses,
//   getLastExpense,
//   getExpenseByDate,
//   getExpenseById,
//   getExpenseBeforeDate,
//   updateExpense,
//   deleteExpense,
// } = require('../services/sqlite');
// const { syncToFirebase, isFirebaseEnabled } = require('../services/sync');

// const router = express.Router();

// // Background sync helper — never blocks the response
// function backgroundSync() {
//   if (!isFirebaseEnabled()) return;
//   syncToFirebase().catch(err =>
//     console.log('[sync] background sync failed:', err.message)
//   );
// }

// router.get('/expenses', (req, res) => {
//   res.json(getAllExpenses());
// });

// // POST /api/expenses — Save full entry OR receipt-only (actuals default to 0)
// router.post('/expenses', (req, res) => {
//   console.log('POST /api/expenses body:', req.body);

//   const { date, acNo, freshReceipt, actualGST, actualSalary, actualOther } = req.body;

//   if (freshReceipt === undefined || freshReceipt === null || freshReceipt === '') {
//     return res.status(400).json({ error: 'freshReceipt is required' });
//   }

//   const parsedActualGST    = Number(actualGST    ?? 0);
//   const parsedActualSalary = Number(actualSalary ?? 0);
//   const parsedActualOther  = Number(actualOther  ?? 0);

//   const lastExpense  = getLastExpense();
//   const carryForward = lastExpense
//     ? getCarryForward(lastExpense.totalAmount, lastExpense.totalSpent)
//     : 0;

//   const calculated = calculate(
//     Number(freshReceipt),
//     carryForward,
//     parsedActualGST,
//     parsedActualSalary,
//     parsedActualOther
//   );

//   insertExpense({
//     date,
//     acNo,
//     freshReceipt: Number(freshReceipt),
//     carryForward,
//     ...calculated,
//     actualGST:    parsedActualGST,
//     actualSalary: parsedActualSalary,
//     actualOther:  parsedActualOther,
//   });

//   const saved = getExpenseByDate(date);

//   backgroundSync();

//   res.status(201).json(saved);
// });

// // PATCH /api/expenses/:id/entry — Fill actuals for a receipt-only entry
// // Only updates actualGST, actualSalary, actualOther and recalculates
// router.patch('/expenses/:id/entry', (req, res) => {
//   console.log('PATCH /api/expenses/:id/entry', req.params.id, req.body);

//   const id = Number(req.params.id);
//   if (!Number.isInteger(id) || id <= 0) {
//     return res.status(400).json({ error: 'Invalid expense id' });
//   }

//   const existing = getExpenseById(id);
//   if (!existing) {
//     return res.status(404).json({ error: 'Expense not found' });
//   }

//   // Guard: only allow if actuals are still 0 (entry not yet filled)
//   if (
//     existing.actualGST !== 0 ||
//     existing.actualSalary !== 0 ||
//     existing.actualOther !== 0
//   ) {
//     return res.status(400).json({ error: 'Entry already filled. Use PUT to edit.' });
//   }

//   const { actualGST, actualSalary, actualOther } = req.body;

//   const parsedActualGST    = Number(actualGST    ?? 0);
//   const parsedActualSalary = Number(actualSalary ?? 0);
//   const parsedActualOther  = Number(actualOther  ?? 0);

//   // Recalculate using existing freshReceipt and carryForward
//   const calculated = calculate(
//     existing.freshReceipt,
//     existing.carryForward,
//     parsedActualGST,
//     parsedActualSalary,
//     parsedActualOther
//   );

//   const updated = updateExpense(id, {
//     date:         existing.date,
//     acNo:         existing.acNo,
//     freshReceipt: existing.freshReceipt,
//     carryForward: existing.carryForward,
//     ...calculated,
//     actualGST:    parsedActualGST,
//     actualSalary: parsedActualSalary,
//     actualOther:  parsedActualOther,
//   });

//   backgroundSync();

//   res.json(updated);
// });

// // PUT /api/expenses/:id — Full edit (existing behaviour)
// router.put('/expenses/:id', (req, res) => {
//   console.log('PUT /api/expenses/:id', req.params.id, req.body);
//   const id = Number(req.params.id);
//   if (!Number.isInteger(id) || id <= 0) {
//     return res.status(400).json({ error: 'Invalid expense id' });
//   }

//   const existing = getExpenseById(id);
//   if (!existing) {
//     return res.status(404).json({ error: 'Expense not found' });
//   }

//   const { date, acNo, freshReceipt, actualGST, actualSalary, actualOther } = req.body;

//   if (freshReceipt === undefined || freshReceipt === null || freshReceipt === '') {
//     return res.status(400).json({ error: 'freshReceipt is required' });
//   }

//   const parsedActualGST    = Number(actualGST    ?? 0);
//   const parsedActualSalary = Number(actualSalary ?? 0);
//   const parsedActualOther  = Number(actualOther  ?? 0);

//   const previous     = getExpenseBeforeDate(date, id);
//   const carryForward = previous
//     ? getCarryForward(previous.totalAmount, previous.totalSpent)
//     : 0;

//   const calculated = calculate(
//     Number(freshReceipt),
//     carryForward,
//     parsedActualGST,
//     parsedActualSalary,
//     parsedActualOther
//   );

//   const updated = updateExpense(id, {
//     date,
//     acNo,
//     freshReceipt: Number(freshReceipt),
//     carryForward,
//     ...calculated,
//     actualGST:    parsedActualGST,
//     actualSalary: parsedActualSalary,
//     actualOther:  parsedActualOther,
//   });

//   backgroundSync();

//   res.json(updated);
// });

// router.delete('/expenses/:id', (req, res) => {
//   console.log('DELETE /api/expenses/:id', req.params.id);
//   const id = Number(req.params.id);
//   if (!Number.isInteger(id) || id <= 0) {
//     return res.status(400).json({ error: 'Invalid expense id' });
//   }

//   const result = deleteExpense(id);
//   if (!result.changes) {
//     return res.status(404).json({ error: 'Expense not found' });
//   }

//   res.json({ success: true, id });
// });

// router.get('/expenses/:date', (req, res) => {
//   const expense = getExpenseByDate(req.params.date);
//   if (!expense) {
//     return res.status(404).json({ error: 'Expense not found for this date' });
//   }
//   res.json(expense);
// });

// module.exports = router;





















const express = require('express');
const { calculate, getCarryForward } = require('../services/calculations');
const {
  insertExpense,
  getAllExpenses,
  getLastExpense,
  getExpenseByDate,
  getExpenseById,
  getExpenseBeforeDate,
  updateExpense,
  deleteExpense,
} = require('../services/sqlite');
const { syncToFirebase, isFirebaseEnabled } = require('../services/sync');

const router = express.Router();

// Background sync helper — never blocks the response
function backgroundSync() {
  if (!isFirebaseEnabled()) return;
  syncToFirebase().catch(err =>
    console.log('[sync] background sync failed:', err.message)
  );
}

router.get('/expenses', (req, res) => {
  res.json(getAllExpenses());
});

// POST /api/expenses — Save full entry OR receipt-only (actuals default to 0)
router.post('/expenses', (req, res) => {
  console.log('POST /api/expenses body:', req.body);

  const { date, acNo, freshReceipt, actualGST, actualSalary, actualOther } = req.body;

  const lastExpense = getLastExpense();
  const carryForward = lastExpense ? (lastExpense.totalAmount - lastExpense.totalSpent) : 0;
  const prevBudgetedGST = lastExpense ? (lastExpense.budgetedGST ?? 0) : 0;
  const prevActualGST = lastExpense ? (lastExpense.actualGST ?? 0) : 0;

  if (freshReceipt === undefined || freshReceipt === null || freshReceipt === '') {
    return res.status(400).json({ error: 'freshReceipt is required' });
  }

  const parsedActualGST    = Number(actualGST    ?? 0);
  const parsedActualSalary = Number(actualSalary ?? 0);
  const parsedActualOther  = Number(actualOther  ?? 0);

  const result = calculate(freshReceipt, carryForward, actualGST, actualSalary, actualOther, prevBudgetedGST, prevActualGST);

  insertExpense({
    date,
    acNo,
    freshReceipt: Number(freshReceipt),
    carryForward,
    ...result,
    prevRemainingGST: result.prevRemainingGST,
    actualGST:    parsedActualGST,
    actualSalary: parsedActualSalary,
    actualOther:  parsedActualOther,
  });

  const saved = getExpenseByDate(date);
  backgroundSync();
  res.status(201).json(saved);
});

// PATCH /api/expenses/:id/entry — Fill actuals for a receipt-only entry
router.patch('/expenses/:id/entry', (req, res) => {
  console.log('PATCH /api/expenses/:id/entry', req.params.id, req.body);

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid expense id' });
  }

  const existing = getExpenseById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  // Guard: only allow if actuals are still 0 (entry not yet filled)
  if (
    existing.actualGST    !== 0 ||
    existing.actualSalary !== 0 ||
    existing.actualOther  !== 0
  ) {
    return res.status(400).json({ error: 'Entry already filled. Use PUT to edit.' });
  }

  const { actualGST, actualSalary, actualOther } = req.body;

  const parsedActualGST    = Number(actualGST    ?? 0);
  const parsedActualSalary = Number(actualSalary ?? 0);
  const parsedActualOther  = Number(actualOther  ?? 0);

  // Get previous expense before this date for GST carry values
  const previous        = getExpenseBeforeDate(existing.date, id);
  const prevBudgetedGST = previous ? (previous.budgetedGST ?? 0) : 0;
  const prevActualGST   = previous ? (previous.actualGST   ?? 0) : 0;

  // Recalculate using existing freshReceipt and carryForward
  const calculated = calculate(
    existing.freshReceipt,
    existing.carryForward,
    parsedActualGST,
    parsedActualSalary,
    parsedActualOther,
    prevBudgetedGST,
    prevActualGST
  );

  const updated = updateExpense(id, {
    date:         existing.date,
    acNo:         existing.acNo,
    freshReceipt: existing.freshReceipt,
    carryForward: existing.carryForward,
    ...calculated,
    actualGST:    parsedActualGST,
    actualSalary: parsedActualSalary,
    actualOther:  parsedActualOther,
  });

  backgroundSync();
  res.json(updated);
});

// PUT /api/expenses/:id — Full edit
router.put('/expenses/:id', (req, res) => {
  console.log('PUT /api/expenses/:id', req.params.id, req.body);

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid expense id' });
  }

  const existing = getExpenseById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const { date, acNo, freshReceipt, actualGST, actualSalary, actualOther } = req.body;

  if (freshReceipt === undefined || freshReceipt === null || freshReceipt === '') {
    return res.status(400).json({ error: 'freshReceipt is required' });
  }

  const parsedActualGST    = Number(actualGST    ?? 0);
  const parsedActualSalary = Number(actualSalary ?? 0);
  const parsedActualOther  = Number(actualOther  ?? 0);

  const previous     = getExpenseBeforeDate(date, id);
  const carryForward = previous
    ? getCarryForward(previous.totalAmount, previous.totalSpent)
    : 0;

  const prevBudgetedGST = previous ? (previous.budgetedGST ?? 0) : 0;
  const prevActualGST   = previous ? (previous.actualGST   ?? 0) : 0;

  const calculated = calculate(
    Number(freshReceipt),
    carryForward,
    parsedActualGST,
    parsedActualSalary,
    parsedActualOther,
    prevBudgetedGST,
    prevActualGST
  );

  const updated = updateExpense(id, {
    date,
    acNo,
    freshReceipt: Number(freshReceipt),
    carryForward,
    ...calculated,
    actualGST:    parsedActualGST,
    actualSalary: parsedActualSalary,
    actualOther:  parsedActualOther,
  });

  backgroundSync();
  res.json(updated);
});

router.delete('/expenses/:id', (req, res) => {
  console.log('DELETE /api/expenses/:id', req.params.id);

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid expense id' });
  }

  const result = deleteExpense(id);
  if (!result.changes) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  res.json({ success: true, id });
});

router.get('/expenses/:date', (req, res) => {
  const expense = getExpenseByDate(req.params.date);
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found for this date' });
  }
  res.json(expense);
});

module.exports = router;