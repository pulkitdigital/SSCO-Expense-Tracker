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

const router = express.Router();

router.get('/expenses', (req, res) => {
  res.json(getAllExpenses());
});

router.post('/expenses', (req, res) => {
  console.log('POST /api/expenses body:', req.body);

  const { date, acNo, freshReceipt, actualGST, actualSalary, actualOther } = req.body;

  if (freshReceipt === undefined || freshReceipt === null || freshReceipt === '') {
    return res.status(400).json({ error: 'freshReceipt is required' });
  }

  const parsedActualGST = Number(actualGST ?? 0);
  const parsedActualSalary = Number(actualSalary ?? 0);
  const parsedActualOther = Number(actualOther ?? 0);

  const lastExpense = getLastExpense();
  const carryForward = lastExpense
    ? getCarryForward(lastExpense.totalAmount, lastExpense.totalSpent)
    : 0;

  const calculated = calculate(
    Number(freshReceipt),
    carryForward,
    parsedActualGST,
    parsedActualSalary,
    parsedActualOther
  );

  insertExpense({
    date,
    acNo,
    freshReceipt: Number(freshReceipt),
    carryForward,
    ...calculated,
    actualGST: parsedActualGST,
    actualSalary: parsedActualSalary,
    actualOther: parsedActualOther,
  });

  const saved = getExpenseByDate(date);
  res.status(201).json(saved);
});

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

  const parsedActualGST = Number(actualGST ?? 0);
  const parsedActualSalary = Number(actualSalary ?? 0);
  const parsedActualOther = Number(actualOther ?? 0);

  const previous = getExpenseBeforeDate(date, id);
  const carryForward = previous
    ? getCarryForward(previous.totalAmount, previous.totalSpent)
    : 0;

  const calculated = calculate(
    Number(freshReceipt),
    carryForward,
    parsedActualGST,
    parsedActualSalary,
    parsedActualOther
  );

  const updated = updateExpense(id, {
    date,
    acNo,
    freshReceipt: Number(freshReceipt),
    carryForward,
    ...calculated,
    actualGST: parsedActualGST,
    actualSalary: parsedActualSalary,
    actualOther: parsedActualOther,
  });

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
