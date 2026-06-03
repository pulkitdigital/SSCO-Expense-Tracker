const ExcelJS = require('exceljs');

const CURRENCY_FORMAT = '₹#,##0.00';

const HEADERS = [
  { label: 'Date', bg: 'FFFFFFFF', isNumber: false },
  { label: 'A/c No', bg: 'FFFFFFFF', isNumber: false },
  { label: 'Fresh Receipt', bg: 'FFFFD700', isNumber: true },
  { label: 'Carry Forward', bg: 'FFFFD700', isNumber: true },
  { label: 'Total Amount', bg: 'FFFFD700', isNumber: true },
  { label: 'Prev GST Carry', bg: 'FFFFA500', isNumber: true },
  { label: 'Budgeted GST', bg: 'FF92D050', isNumber: true },
  { label: 'Budgeted Salary', bg: 'FF92D050', isNumber: true },
  { label: 'Budgeted Other', bg: 'FF92D050', isNumber: true },
  { label: 'Total Budgeted', bg: 'FF92D050', isNumber: true },
  { label: 'Actual GST', bg: 'FFFF0000', isNumber: true, whiteText: true },
  { label: 'Actual Salary', bg: 'FFFF0000', isNumber: true, whiteText: true },
  { label: 'Actual Other', bg: 'FFFF0000', isNumber: true, whiteText: true },
  { label: 'Total Spent', bg: 'FFFF0000', isNumber: true, whiteText: true },
  { label: 'GST Variance', bg: 'FFD9D9D9', isNumber: true },
  { label: 'Salary Variance', bg: 'FFD9D9D9', isNumber: true },
  { label: 'Other Variance', bg: 'FFD9D9D9', isNumber: true },
  { label: 'Total Variance', bg: 'FFD9D9D9', isNumber: true },
];

const EXPENSE_FIELDS = [
  'date',
  'acNo',
  'freshReceipt',
  'carryForward',
  'totalAmount',
  'prevRemainingGST',
  'budgetedGST',
  'budgetedSalary',
  'budgetedOther',
  'totalBudgeted',
  'actualGST',
  'actualSalary',
  'actualOther',
  'totalSpent',
  'gstVariance',
  'salaryVariance',
  'otherVariance',
  'totalVariance',
];

/**
 * Builds an Excel workbook for expense planning and returns it as a buffer.
 * @param {object[]} expenses - Expense rows from SQLite
 * @returns {Promise<Buffer>} XLSX file buffer
 */
async function generateExcel(expenses) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Planning of Receipts and Expenses');

  sheet.mergeCells('A1:R1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Planning of Receipts and Expenses';
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD700' },
  };
  sheet.getRow(1).height = 24;

  const headerRow = sheet.getRow(2);
  HEADERS.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header.label;
    cell.font = {
      bold: true,
      color: header.whiteText ? { argb: 'FFFFFFFF' } : undefined,
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: header.bg },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  headerRow.height = 20;

  expenses.forEach((expense, rowIndex) => {
    const row = sheet.getRow(rowIndex + 3);
    EXPENSE_FIELDS.forEach((field, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      const value = expense[field];
      cell.value = value ?? (HEADERS[colIndex].isNumber ? 0 : '');

      if (HEADERS[colIndex].isNumber) {
        cell.numFmt = CURRENCY_FORMAT;
      }
    });
  });

  HEADERS.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    let maxLength = header.label.length;

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < 2) return;
      const cellValue = row.getCell(index + 1).value;
      const text =
        cellValue === null || cellValue === undefined
          ? ''
          : String(cellValue);
      maxLength = Math.max(maxLength, text.length);
    });

    column.width = Math.min(Math.max(maxLength + 2, 12), 40);
  });

  sheet.views = [{ state: 'frozen', ySplit: 2, activeCell: 'A3' }];

  return workbook.xlsx.writeBuffer();
}

module.exports = { generateExcel };
