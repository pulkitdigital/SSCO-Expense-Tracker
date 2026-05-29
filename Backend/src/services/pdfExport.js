const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 20;
const ROW_HEIGHT_GROUP = 18;
const ROW_HEIGHT_HEADER = 22;
const ROW_HEIGHT_DATA = 14;
const LETTERHEAD_HEIGHT = 56;
const FOOTER_HEIGHT = 24;

const COLORS = {
  receipt: { r: 1, g: 0.843, b: 0 },
  budgeted: { r: 0.573, g: 0.816, b: 0.314 },
  actual: { r: 0.753, g: 0, b: 0 },
  variance: { r: 0.851, g: 0.851, b: 0.851 },
  white: { r: 1, g: 1, b: 1 },
  purple: { r: 0.388, g: 0.4, b: 0.945 },
  rowAlt: { r: 0.976, g: 0.98, b: 0.984 },
  indigo: { r: 0.388, g: 0.4, b: 0.945 },
  red: { r: 0.86, g: 0.15, b: 0.15 },
  green: { r: 0.086, g: 0.639, b: 0.29 },
  orange: { r: 0.976, g: 0.549, b: 0.086 },
};

const GROUP_HEADERS = [
  { label: '', colspan: 2, bg: 'white', textDark: true },
  { label: 'Receipt', colspan: 3, bg: 'receipt', textDark: true },
  { label: 'Budgeted', colspan: 4, bg: 'budgeted', textDark: true },
  { label: 'Actual', colspan: 4, bg: 'actual', textDark: false },
  { label: 'Variance', colspan: 4, bg: 'variance', textDark: true },
];

/** Relative widths so column labels fit (matches on-screen table proportions) */
const COLUMN_WIDTH_WEIGHTS = {
  date: 1.15,
  acNo: 0.95,
  freshReceipt: 1.25,
  carryForward: 1.05,
  totalAmount: 1.1,
  budgetedGST: 1.05,
  budgetedSalary: 1.15,
  budgetedOther: 1.1,
  totalBudgeted: 1.1,
  actualGST: 1.05,
  actualSalary: 1.1,
  actualOther: 1.05,
  totalSpent: 1.15,
  gstVariance: 1.05,
  salaryVariance: 1.0,
  otherVariance: 1.05,
  totalVariance: 1.1,
};

const COLUMNS = [
  { key: 'date', label: 'Date', group: 'base' },
  { key: 'acNo', label: 'A/c No', group: 'base' },
  { key: 'freshReceipt', label: 'Fresh Receipt', group: 'receipt', numeric: true },
  { key: 'carryForward', label: 'Carry Fwd', group: 'receipt', numeric: true },
  { key: 'totalAmount', label: 'Total Amt', group: 'receipt', numeric: true },
  { key: 'budgetedGST', label: 'Bgt GST', group: 'budgeted', numeric: true },
  { key: 'budgetedSalary', label: 'Bgt Salary', group: 'budgeted', numeric: true },
  { key: 'budgetedOther', label: 'Bgt Other', group: 'budgeted', numeric: true },
  { key: 'totalBudgeted', label: 'Total Bgt', group: 'budgeted', numeric: true },
  { key: 'actualGST', label: 'Act GST', group: 'actual', numeric: true },
  { key: 'actualSalary', label: 'Act Salary', group: 'actual', numeric: true },
  { key: 'actualOther', label: 'Act Other', group: 'actual', numeric: true },
  { key: 'totalSpent', label: 'Total Spent', group: 'actual', numeric: true },
  { key: 'gstVariance', label: 'GST Var', group: 'variance', numeric: true, variance: true },
  { key: 'salaryVariance', label: 'Sal Var', group: 'variance', numeric: true, variance: true },
  { key: 'otherVariance', label: 'Other Var', group: 'variance', numeric: true, variance: true },
  { key: 'totalVariance', label: 'Total Var', group: 'variance', numeric: true, variance: true },
];

function filterByDateRange(expenses, from, to) {
  return expenses.filter((expense) => {
    if (from && expense.date < from) return false;
    if (to && expense.date > to) return false;
    return true;
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatINRNumber(value) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

/** PDF (Helvetica / WinAnsi cannot encode U+20B9) */
function formatINRPdf(value) {
  return `Rs. ${formatINRNumber(value)}`;
}

/** HTML preview — matches on-screen ₹ format */
function formatINRHtml(value) {
  return `&#8377; ${formatINRNumber(value)}`;
}

function getDateRangeLabel(from, to) {
  if (from && to) return `${from} to ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Up to ${to}`;
  return 'All Entries';
}

function computeSummary(expenses) {
  const totalReceipt = expenses.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
  const totalSpent = expenses.reduce((sum, row) => sum + (row.totalSpent || 0), 0);
  const totalVariance = expenses.reduce((sum, row) => sum + (row.totalVariance || 0), 0);
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  const lastRow = sorted[sorted.length - 1];
  const carryForward = lastRow?.carryForward ?? 0;

  return { totalReceipt, totalSpent, totalVariance, carryForward };
}

function getGroupColorKey(group) {
  if (group === 'receipt') return 'receipt';
  if (group === 'budgeted') return 'budgeted';
  if (group === 'actual') return 'actual';
  if (group === 'variance') return 'variance';
  return 'white';
}

function toRgb(colorKey) {
  const c = COLORS[colorKey] || COLORS.white;
  return rgb(c.r, c.g, c.b);
}

function getVarianceRgb(value) {
  if (value > 0) return rgb(0.086, 0.639, 0.29);
  if (value < 0) return rgb(0.86, 0.15, 0.15);
  return rgb(0.2, 0.2, 0.2);
}

function formatCellPdf(column, expense) {
  const value = expense[column.key];
  if (column.numeric) return formatINRPdf(value);
  return value != null ? String(value) : '';
}

function getColumnWidths() {
  const tableWidth = PAGE_WIDTH - MARGIN * 2;
  const totalWeight = COLUMNS.reduce(
    (sum, col) => sum + (COLUMN_WIDTH_WEIGHTS[col.key] || 1),
    0
  );
  return COLUMNS.map(
    (col) => (tableWidth * (COLUMN_WIDTH_WEIGHTS[col.key] || 1)) / totalWeight
  );
}

function fitTextToWidth(text, font, fontSize, maxWidth) {
  const full = String(text ?? '');
  if (font.widthOfTextAtSize(full, fontSize) <= maxWidth) return full;
  let trimmed = full;
  while (trimmed.length > 1 && font.widthOfTextAtSize(`${trimmed}…`, fontSize) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

function drawCenteredText(page, text, x, y, width, font, fontSize, color) {
  const display = fitTextToWidth(text, font, fontSize, width - 4);
  const textWidth = font.widthOfTextAtSize(display, fontSize);
  page.drawText(display, {
    x: x + (width - textWidth) / 2,
    y,
    size: fontSize,
    font,
    color,
  });
}

async function generateExpensePDF(expenses, profile, dateFrom, dateTo) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const colWidths = getColumnWidths();
  const summary = computeSummary(expenses);
  const generatedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let pageIndex = 0;
  let y = PAGE_HEIGHT - MARGIN;

  const drawFooter = (targetPage, index, totalPages) => {
    targetPage.drawText(`Generated on ${generatedAt}`, {
      x: MARGIN,
      y: MARGIN - 4,
      size: 8,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
    targetPage.drawText(`Page ${index + 1} of ${totalPages}`, {
      x: PAGE_WIDTH - MARGIN - 60,
      y: MARGIN - 4,
      size: 8,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
  };

  const drawLetterhead = (targetPage) => {
    targetPage.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - LETTERHEAD_HEIGHT,
      width: PAGE_WIDTH,
      height: LETTERHEAD_HEIGHT,
      color: toRgb('purple'),
    });

    const company = profile?.companyName || 'SSCO Expense Tracker';
    targetPage.drawText(company, {
      x: MARGIN,
      y: PAGE_HEIGHT - 28,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    const subline = [
      profile?.address?.replace(/\n/g, ' '),
      profile?.gstin ? `GSTIN: ${profile.gstin}` : null,
      profile?.phone ? `Phone: ${profile.phone}` : null,
    ]
      .filter(Boolean)
      .join('  |  ')
      .slice(0, 110);

    if (subline) {
      targetPage.drawText(subline, {
        x: MARGIN,
        y: PAGE_HEIGHT - 44,
        size: 8,
        font,
        color: rgb(0.92, 0.92, 1),
      });
    }
  };

  const drawSummaryBoxes = (targetPage, startY) => {
    const boxWidth = (PAGE_WIDTH - MARGIN * 2 - 18) / 4;
    const boxHeight = 32;
    const items = [
      { label: 'Total Receipt', value: summary.totalReceipt, color: 'indigo' },
      { label: 'Total Spent', value: summary.totalSpent, color: 'red' },
      { label: 'Total Variance', value: summary.totalVariance, color: 'green' },
      { label: 'Carry Forward', value: summary.carryForward, color: 'orange' },
    ];

    items.forEach((item, index) => {
      const x = MARGIN + index * (boxWidth + 6);
      targetPage.drawRectangle({
        x,
        y: startY - boxHeight,
        width: boxWidth,
        height: boxHeight,
        color: toRgb(item.color),
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 0.5,
      });
      targetPage.drawText(item.label, {
        x: x + 6,
        y: startY - 12,
        size: 7,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      targetPage.drawText(formatINRPdf(item.value), {
        x: x + 6,
        y: startY - 24,
        size: 9,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
    });

    return startY - boxHeight - 14;
  };

  const drawGroupHeaderRow = () => {
    let x = MARGIN;
    let colIndex = 0;
    GROUP_HEADERS.forEach((group) => {
      let groupWidth = 0;
      for (let i = 0; i < group.colspan; i += 1) {
        groupWidth += colWidths[colIndex + i];
      }

      page.drawRectangle({
        x,
        y: y - ROW_HEIGHT_GROUP,
        width: groupWidth,
        height: ROW_HEIGHT_GROUP,
        color: toRgb(group.bg),
        borderColor: rgb(0.75, 0.75, 0.75),
        borderWidth: 0.5,
      });

      if (group.label) {
        const textColor = group.textDark ? rgb(0.1, 0.1, 0.1) : rgb(1, 1, 1);
        drawCenteredText(
          page,
          group.label,
          x,
          y - ROW_HEIGHT_GROUP + 6,
          groupWidth,
          fontBold,
          8,
          textColor
        );
      }

      x += groupWidth;
      colIndex += group.colspan;
    });
    y -= ROW_HEIGHT_GROUP;
  };

  const drawColumnHeaderRow = () => {
    let x = MARGIN;
    COLUMNS.forEach((column, index) => {
      const w = colWidths[index];
      const bg = getGroupColorKey(column.group);
      const textColor =
        column.group === 'actual' ? rgb(1, 1, 1) : rgb(0.15, 0.15, 0.15);

      page.drawRectangle({
        x,
        y: y - ROW_HEIGHT_HEADER,
        width: w,
        height: ROW_HEIGHT_HEADER,
        color: toRgb(bg),
        borderColor: rgb(0.75, 0.75, 0.75),
        borderWidth: 0.5,
      });

      drawCenteredText(
        page,
        column.label,
        x,
        y - ROW_HEIGHT_HEADER + 7,
        w,
        fontBold,
        6.5,
        textColor
      );
      x += w;
    });
    y -= ROW_HEIGHT_HEADER;
  };

  const drawDataRow = (expense, rowIndex) => {
    let x = MARGIN;
    const rowFill = rowIndex % 2 === 0 ? toRgb('white') : toRgb('rowAlt');

    COLUMNS.forEach((column, index) => {
      const w = colWidths[index];
      page.drawRectangle({
        x,
        y: y - ROW_HEIGHT_DATA,
        width: w,
        height: ROW_HEIGHT_DATA,
        color: rowFill,
        borderColor: rgb(0.88, 0.88, 0.88),
        borderWidth: 0.25,
      });

      const text = formatCellPdf(column, expense);
      const display =
        text.length > 14 ? `${text.slice(0, 13)}…` : text;
      const textColor = column.variance
        ? getVarianceRgb(expense[column.key])
        : rgb(0.15, 0.15, 0.15);
      const fontSize = 5.5;
      const textX = column.numeric
        ? x + w - font.widthOfTextAtSize(display, fontSize) - 3
        : x + 2;

      page.drawText(display, {
        x: textX,
        y: y - ROW_HEIGHT_DATA + 3,
        size: fontSize,
        font,
        color: textColor,
      });
      x += w;
    });
    y -= ROW_HEIGHT_DATA;
  };

  const redrawTableHeaders = () => {
    drawGroupHeaderRow();
    drawColumnHeaderRow();
  };

  const ensureSpace = (needed) => {
    if (y - needed < MARGIN + FOOTER_HEIGHT + 10) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageIndex += 1;
      y = PAGE_HEIGHT - MARGIN - 8;
      drawLetterhead(page);
      y = PAGE_HEIGHT - LETTERHEAD_HEIGHT - 16;
      redrawTableHeaders();
      return true;
    }
    return false;
  };

  drawLetterhead(page);
  y = PAGE_HEIGHT - LETTERHEAD_HEIGHT - 12;

  page.drawText('Daily Expense Report', {
    x: MARGIN,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.2),
  });
  y -= 18;

  page.drawText(getDateRangeLabel(dateFrom, dateTo), {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.45),
  });
  y -= 16;

  y = drawSummaryBoxes(page, y);

  const widths = getColumnWidths();
  colWidths.length = 0;
  colWidths.push(...widths);

  drawGroupHeaderRow();
  drawColumnHeaderRow();

  expenses.forEach((expense, rowIndex) => {
    ensureSpace(ROW_HEIGHT_DATA + 2);
    drawDataRow(expense, rowIndex);
  });

  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i += 1) {
    drawFooter(pdfDoc.getPage(i), i, totalPages);
  }

  return pdfDoc.save();
}

function generateExpensePreviewHTML(expenses, profile, dateFrom, dateTo, options = {}) {
  const summary = computeSummary(expenses);
  const reportTitle = options.reportTitle || 'Daily Expense Report';
  const generatedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const groupHeaderCells = GROUP_HEADERS.map(
    (group) => {
      const bgClass = `grp-${group.bg}`;
      const textClass = group.textDark ? 'text-dark' : 'text-light';
      return `<th colspan="${group.colspan}" class="${bgClass} ${textClass} group-th">${escapeHtml(group.label)}</th>`;
    }
  ).join('');

  const columnHeaderCells = COLUMNS.map((column) => {
    const bgClass = `grp-${getGroupColorKey(column.group)}`;
    const textClass = column.group === 'actual' ? 'text-light' : 'text-dark';
    return `<th class="${bgClass} ${textClass} col-th">${escapeHtml(column.label)}</th>`;
  }).join('');

  const dataRows = expenses
    .map((expense, index) => {
      const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';
      const cells = COLUMNS.map((column) => {
        const value = expense[column.key];
        let cellClass = 'data-td';
        let content;
        if (column.numeric) {
          content = formatINRHtml(value);
          cellClass += ' num';
          if (column.variance) {
            if (value > 0) cellClass += ' var-pos';
            else if (value < 0) cellClass += ' var-neg';
          }
        } else {
          content = escapeHtml(value ?? '—');
        }
        return `<td class="${cellClass}">${content}</td>`;
      }).join('');
      return `<tr class="${rowClass}">${cells}</tr>`;
    })
    .join('');

  const company = escapeHtml(profile?.companyName || 'SSCO Expense Tracker');
  const subline = escapeHtml(
    [profile?.address?.replace(/\n/g, ' '), profile?.gstin ? `GSTIN: ${profile.gstin}` : '']
      .filter(Boolean)
      .join(' | ')
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #1f2937; padding: 16px; background: #f8fafc; }
    .letterhead { background: #6366f1; color: #fff; padding: 14px 18px; border-radius: 8px 8px 0 0; }
    .letterhead h1 { font-size: 18px; margin-bottom: 4px; }
    .letterhead p { font-size: 10px; opacity: 0.95; }
    .report-title { font-size: 16px; font-weight: 700; margin: 14px 0 4px; }
    .date-range { font-size: 11px; color: #6b7280; margin-bottom: 12px; }
    .summary { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .summary-box { flex: 1; min-width: 140px; padding: 10px 12px; border-radius: 8px; color: #fff; }
    .summary-box .label { font-size: 10px; font-weight: 600; opacity: 0.95; }
    .summary-box .value { font-size: 14px; font-weight: 700; margin-top: 4px; }
    .box-indigo { background: #6366f1; }
    .box-red { background: #dc2626; }
    .box-green { background: #16a34a; }
    .box-orange { background: #f97316; }
    .table-wrap { overflow-x: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #d1d5db; padding: 5px 6px; white-space: nowrap; text-align: left; }
    .group-th { text-align: center; font-weight: 700; font-size: 10px; letter-spacing: 0.02em; }
    .col-th { font-weight: 600; font-size: 9px; text-align: center; white-space: normal; line-height: 1.2; }
    .grp-white { background: #ffffff; }
    .grp-receipt { background: #FFD700; }
    .grp-budgeted { background: #92D050; }
    .grp-actual { background: #C00000; }
    .grp-variance { background: #D9D9D9; }
    .text-dark { color: #1f2937; }
    .text-light { color: #ffffff; }
    .row-even { background: #ffffff; }
    .row-odd { background: #F9FAFB; }
    .data-td { color: #1f2937; }
    .data-td.num { text-align: right; }
    .var-pos { color: #16a34a; font-weight: 600; }
    .var-neg { color: #dc2626; font-weight: 600; }
    .toolbar { margin: 12px 0; display: flex; gap: 8px; align-items: center; }
    .print-btn { background: #6366f1; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .print-btn:hover { background: #4f46e5; }
    .footer { margin-top: 12px; font-size: 9px; color: #9ca3af; text-align: right; }
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none !important; }
      .table-wrap { border: none; }
    }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>${company}</h1>
    ${subline ? `<p>${subline}</p>` : ''}
  </div>
  <div class="report-title">${escapeHtml(reportTitle)}</div>
  <div class="date-range">${escapeHtml(getDateRangeLabel(dateFrom, dateTo))}</div>
  <div class="summary">
    <div class="summary-box box-indigo"><div class="label">Total Receipt</div><div class="value">${formatINRHtml(summary.totalReceipt)}</div></div>
    <div class="summary-box box-red"><div class="label">Total Spent</div><div class="value">${formatINRHtml(summary.totalSpent)}</div></div>
    <div class="summary-box box-green"><div class="label">Total Variance</div><div class="value">${formatINRHtml(summary.totalVariance)}</div></div>
    <div class="summary-box box-orange"><div class="label">Carry Forward</div><div class="value">${formatINRHtml(summary.carryForward)}</div></div>
  </div>
  <div class="toolbar">
    <button type="button" class="print-btn" onclick="window.print()">Print</button>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>${groupHeaderCells}</tr>
        <tr>${columnHeaderCells}</tr>
      </thead>
      <tbody>
        ${dataRows || '<tr><td colspan="17" style="text-align:center;padding:16px;">No entries</td></tr>'}
      </tbody>
    </table>
  </div>
  <div class="footer">Generated on ${escapeHtml(generatedAt)}</div>
</body>
</html>`;
}

async function generateSingleExpensePDF(expense, profile) {
  return generateExpensePDF([expense], profile, expense.date, expense.date);
}

function generateSingleExpensePreviewHTML(expense, profile) {
  return generateExpensePreviewHTML([expense], profile, expense.date, expense.date, {
    reportTitle: `Expense Report - ${expense.date}`,
  });
}

module.exports = {
  COLUMNS,
  GROUP_HEADERS,
  filterByDateRange,
  computeSummary,
  generateExpensePDF,
  generateSingleExpensePDF,
  generateExpensePreviewHTML,
  generateSingleExpensePreviewHTML,
};
