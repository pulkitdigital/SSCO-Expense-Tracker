const express = require('express');
const { generateExcel } = require('../services/excelExport');
const { getAllExpenses, getExpenseById, getProfile } = require('../services/sqlite');
const {
  filterByDateRange,
  generateExpensePDF,
  generateSingleExpensePDF,
  generateExpensePreviewHTML,
  generateSingleExpensePreviewHTML,
} = require('../services/pdfExport');

const router = express.Router();

function sendPdfHeaders(res, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
}

function sendHtmlPreview(res, html) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.send(html);
}

function getExpensesForExport(from, to) {
  let expenses = getAllExpenses();
  if (from || to) {
    expenses = filterByDateRange(expenses, from, to);
  }
  return [...expenses].sort((a, b) => a.date.localeCompare(b.date));
}

router.get('/export/excel', async (req, res) => {
  try {
    const expenses = getAllExpenses();
    console.log('Excel export requested, rows:', expenses.length);

    const buffer = await generateExcel(expenses);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="SSCO_Expenses.xlsx"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Excel export failed:', error);
    res.status(500).json({ error: 'Failed to generate Excel export' });
  }
});

router.get('/export/pdf-preview/:id', (req, res) => {
  try {
    console.log('GET /api/export/pdf-preview/:id', req.params.id);
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid expense id' });
    }

    const expense = getExpenseById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const profile = getProfile();
    const html = generateSingleExpensePreviewHTML(expense, profile);
    sendHtmlPreview(res, html);
  } catch (error) {
    console.error('Single row PDF preview failed:', error);
    res.status(500).json({ error: 'Failed to generate PDF preview' });
  }
});

router.get('/export/pdf-preview', (req, res) => {
  try {
    console.log('GET /api/export/pdf-preview', req.query);
    const { from, to } = req.query;
    const expenses = getExpensesForExport(from, to);
    const profile = getProfile();
    const html = generateExpensePreviewHTML(expenses, profile, from, to);
    sendHtmlPreview(res, html);
  } catch (error) {
    console.error('PDF preview failed:', error);
    res.status(500).json({ error: 'Failed to generate PDF preview' });
  }
});

router.get('/export/pdf/:id', async (req, res) => {
  try {
    console.log('GET /api/export/pdf/:id', req.params.id);
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid expense id' });
    }

    const expense = getExpenseById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const profile = getProfile();
    const pdfBytes = await generateSingleExpensePDF(expense, profile);

    sendPdfHeaders(res, `SSCO_Expense_${id}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Single row PDF export failed:', error);
    res.status(500).json({ error: 'Failed to generate PDF export' });
  }
});

router.get('/export/pdf', async (req, res) => {
  try {
    console.log('GET /api/export/pdf', req.query);
    const { from, to } = req.query;
    const expenses = getExpensesForExport(from, to);
    const profile = getProfile();
    const pdfBytes = await generateExpensePDF(expenses, profile, from, to);

    sendPdfHeaders(res, 'SSCO_Report.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('PDF export failed:', error);
    res.status(500).json({ error: 'Failed to generate PDF export' });
  }
});

module.exports = router;
