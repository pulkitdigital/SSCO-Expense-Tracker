import { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Pencil,
  Trash2,
  FileDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  downloadExcel,
  downloadPDFFile,
  downloadSinglePDFFile,
  getPDFPreviewUrl,
  getSinglePDFPreviewUrl,
} from '../services/api';
import { SkeletonRow } from '../components/Skeleton';
import ConfirmPopup from '../components/ConfirmPopup';
import EditExpenseModal from '../components/EditExpenseModal';
import PDFPreviewModal from '../components/PDFPreviewModal';

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

const GROUP_HEADERS = [
  { label: '', colspan: 2, className: 'bg-white' },
  { label: 'Receipt', colspan: 3, className: 'bg-[#FFD700] text-gray-800' },
  { label: 'Budgeted', colspan: 4, className: 'bg-[#92D050] text-gray-800' },
  { label: 'Actual', colspan: 4, className: 'bg-red-600 text-white' },
  { label: 'Variance', colspan: 4, className: 'bg-[#D9D9D9] text-gray-800' },
  { label: '', colspan: 1, className: 'bg-white' },
];

function formatCurrency(value) {
  return `₹ ${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value ?? 0)}`;
}

function formatCellValue(column, expense) {
  const value = expense[column.key];
  if (column.numeric) return formatCurrency(value);
  return value ?? '—';
}

function getVarianceClass(value) {
  if (value > 0) return 'text-green-600 font-medium';
  if (value < 0) return 'text-red-600 font-medium';
  return 'text-gray-700';
}

function getExpenseId(expense) {
  const id = expense?.id;
  if (id == null || id === '') return null;
  return Number(id);
}

const emptyPdfPreview = {
  open: false,
  url: '',
  downloadFn: null,
  title: '',
};

function AllExpenses() {
  const { expenses, loading, editExpense, removeExpense, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(emptyPdfPreview);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      if (dateFrom && expense.date < dateFrom) return false;
      if (dateTo && expense.date > dateTo) return false;

      if (!query) return true;

      const dateMatch = expense.date?.toLowerCase().includes(query);
      const acMatch = expense.acNo?.toLowerCase().includes(query);
      return dateMatch || acMatch;
    });
  }, [expenses, search, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const totalReceipt = filteredExpenses.reduce(
      (sum, row) => sum + (row.totalAmount || 0),
      0
    );
    const totalSpent = filteredExpenses.reduce(
      (sum, row) => sum + (row.totalSpent || 0),
      0
    );
    const totalVariance = filteredExpenses.reduce(
      (sum, row) => sum + (row.totalVariance || 0),
      0
    );

    return { totalReceipt, totalSpent, totalVariance };
  }, [filteredExpenses]);

  const handleExcelExport = async () => {
    setExporting('excel');
    try {
      await downloadExcel();
    } catch {
      // logged in api.js
    } finally {
      setExporting(null);
    }
  };

  const openBulkPdfPreview = () => {
    setPdfPreview({
      open: true,
      url: getPDFPreviewUrl(dateFrom, dateTo),
      downloadFn: () => downloadPDFFile(dateFrom, dateTo),
      title: 'All Expenses — PDF Preview',
    });
  };

  const openRowPdfPreview = (row) => {
    const rowId = getExpenseId(row);
    if (rowId == null) return;

    setPdfPreview({
      open: true,
      url: getSinglePDFPreviewUrl(rowId),
      downloadFn: () => downloadSinglePDFFile(rowId),
      title: `Expense ${row.date} — PDF Preview`,
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-md">
        {Array.from({ length: 10 }, (_, index) => (
          <SkeletonRow key={index} />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-md">
        <p className="text-lg font-medium text-gray-700">
          No expenses recorded yet. Add entries to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="min-w-[200px] flex-1">
              <span className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500">
                <Search size={14} aria-hidden />
                Search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Date or A/c No"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              />
            </label>

            <label>
              <span className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500">
                <Filter size={14} aria-hidden />
                From
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 sm:w-auto"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-medium text-gray-500">
                To
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 sm:w-auto"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExcelExport}
              disabled={exporting === 'excel'}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
            >
              <FileSpreadsheet size={18} aria-hidden />
              {exporting === 'excel' ? 'Exporting…' : 'Export Excel'}
            </button>
            <button
              type="button"
              onClick={openBulkPdfPreview}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              <FileText size={18} aria-hidden />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
        <span className="font-medium text-gray-900">
          Showing {filteredExpenses.length} entries
        </span>
        <span className="mx-2 text-gray-300">|</span>
        <span>Total Receipt: {formatCurrency(summary.totalReceipt)}</span>
        <span className="mx-2 text-gray-300">|</span>
        <span>Total Spent: {formatCurrency(summary.totalSpent)}</span>
        <span className="mx-2 text-gray-300">|</span>
        <span
          className={
            summary.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'
          }
        >
          Variance: {formatCurrency(summary.totalVariance)}
        </span>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-white p-8 text-center shadow-md">
          <p className="text-gray-600">
            No entries match your search or date filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  {GROUP_HEADERS.map((group) => (
                    <th
                      key={group.label || 'base'}
                      colSpan={group.colspan}
                      className={`border border-gray-200 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide ${group.className}`}
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  {COLUMNS.map((column) => {
                    let headerClass = 'border border-gray-200 px-3 py-2 text-xs font-semibold whitespace-nowrap ';
                    if (column.group === 'receipt') {
                      headerClass += 'bg-[#FFD700] text-gray-800';
                    } else if (column.group === 'budgeted') {
                      headerClass += 'bg-[#92D050] text-gray-800';
                    } else if (column.group === 'actual') {
                      headerClass += 'bg-red-600 text-white';
                    } else if (column.group === 'variance') {
                      headerClass += 'bg-[#D9D9D9] text-gray-800';
                    } else {
                      headerClass += 'bg-white text-gray-700';
                    }

                    return (
                      <th key={column.key} className={headerClass}>
                        {column.label}
                      </th>
                    );
                  })}
                  <th className="min-w-[120px] border border-gray-200 bg-white px-3 py-2 text-center text-xs font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, index) => (
                  <tr
                    key={expense.id ?? `${expense.date}-${index}`}
                    className={`transition-colors hover:bg-blue-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    {COLUMNS.map((column) => {
                      const raw = expense[column.key];
                      let cellClass =
                        'border border-gray-100 px-3 py-2 whitespace-nowrap text-gray-800';

                      if (column.variance) {
                        cellClass += ` ${getVarianceClass(raw)}`;
                      }

                      return (
                        <td key={column.key} className={cellClass}>
                          {formatCellValue(column, expense)}
                        </td>
                      );
                    })}
                    <td className="border border-gray-100 px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => {
                            console.log('[AllExpenses] edit click', getExpenseId(expense));
                            setEditingExpense(expense);
                          }}
                          className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100"
                        >
                          <Pencil size={15} aria-hidden />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => {
                            console.log('[AllExpenses] delete click', getExpenseId(expense));
                            setConfirmDelete(expense);
                          }}
                          className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={15} aria-hidden />
                        </button>
                        <button
                          type="button"
                          title="Preview PDF"
                          onClick={() => openRowPdfPreview(expense)}
                          className="rounded-lg bg-green-50 p-1.5 text-green-600 hover:bg-green-100"
                        >
                          <FileDown size={15} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmPopup
        isOpen={confirmDelete !== null}
        title="Delete Expense"
        message={`Are you sure you want to delete the expense for ${confirmDelete?.date}? This cannot be undone.`}
        confirmText="Yes, Delete"
        confirmColor="red"
        onConfirm={async () => {
          const id = getExpenseId(confirmDelete);
          console.log('[AllExpenses] delete confirm', id);
          if (id == null) {
            setConfirmDelete(null);
            return;
          }
          await removeExpense(id);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      <EditExpenseModal
        isOpen={editingExpense !== null}
        expense={editingExpense}
        onSave={async (data) => {
          const id = getExpenseId(editingExpense);
          console.log('[AllExpenses] edit save', id, data);
          if (id == null) {
            setEditingExpense(null);
            return;
          }
          await editExpense(id, data);
          setEditingExpense(null);
        }}
        onClose={() => setEditingExpense(null)}
      />

      <PDFPreviewModal
        isOpen={pdfPreview.open}
        previewUrl={pdfPreview.url}
        title={pdfPreview.title}
        onDownload={async () => {
          if (!pdfPreview.downloadFn) return;
          try {
            await pdfPreview.downloadFn();
            showToast('PDF downloaded!', 'success');
            setPdfPreview(emptyPdfPreview);
          } catch {
            showToast('PDF download failed', 'error');
          }
        }}
        onClose={() => setPdfPreview(emptyPdfPreview)}
      />
    </div>
  );
}

export default AllExpenses;
