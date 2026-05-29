import { useMemo, useState } from 'react';
import { Calendar, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getInitialForm() {
  return {
    date: getTodayISO(),
    acNo: '',
    freshReceipt: '',
    actualGST: '',
    actualSalary: '',
    actualOther: '',
  };
}

function formatCurrency(value) {
  return `₹ ${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value ?? 0)}`;
}

function parseAmount(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function PreviewRow({ label, value, valueClassName = 'text-gray-800' }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${valueClassName}`}>{value}</span>
    </div>
  );
}

function AddExpense() {
  const { saveExpense, expenses, loading, showToast } = useApp();
  const [form, setForm] = useState(getInitialForm);
  const [submitting, setSubmitting] = useState(false);

  const carryForward = useMemo(() => {
    const lastExpense = expenses.length > 0 ? expenses[0] : null;
    if (!lastExpense) return 0;
    return (lastExpense.totalAmount || 0) - (lastExpense.totalSpent || 0);
  }, [expenses]);

  const calculated = useMemo(() => {
    const freshReceipt = parseAmount(form.freshReceipt);
    const actualGST = parseAmount(form.actualGST);
    const actualSalary = parseAmount(form.actualSalary);
    const actualOther = parseAmount(form.actualOther);

    const totalAmount = freshReceipt + carryForward;
    const budgetedGST = totalAmount * 0.18;
    const remaining = totalAmount - budgetedGST;
    const budgetedSalary = remaining * 0.5;
    const budgetedOther = remaining * 0.5;
    const totalBudgeted = budgetedGST + budgetedSalary + budgetedOther;
    const totalSpent = actualGST + actualSalary + actualOther;
    const totalVariance = totalBudgeted - totalSpent;

    return {
      carryForward,
      totalAmount,
      budgetedGST,
      budgetedSalary,
      budgetedOther,
      totalSpent,
      totalVariance,
    };
  }, [form, carryForward]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (String(form.freshReceipt).trim() === '') {
      showToast('Fresh Receipt is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await saveExpense({
        date: form.date,
        acNo: form.acNo,
        freshReceipt: Number(form.freshReceipt) || 0,
        actualGST: Number(form.actualGST) || 0,
        actualSalary: Number(form.actualSalary) || 0,
        actualOther: Number(form.actualOther) || 0,
      });
      showToast('Entry saved successfully!', 'success');
      setForm(getInitialForm());
    } catch {
      showToast('Failed to save entry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const varianceColor =
    calculated.totalVariance >= 0 ? 'text-green-600' : 'text-red-600';

  if (loading && expenses.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-md"
        >
          <h2 className="mb-6 text-lg font-semibold text-gray-800">
            Daily Entry
          </h2>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-600">
                Date
              </span>
              <div className="relative">
                <Calendar
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <input
                  type="date"
                  value={form.date}
                  onChange={handleChange('date')}
                  required
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-600">
                A/c No
              </span>
              <input
                type="text"
                value={form.acNo}
                onChange={handleChange('acNo')}
                placeholder="Account number"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
              />
            </label>

            {[
              { key: 'freshReceipt', label: 'Fresh Receipt' },
              { key: 'actualGST', label: 'Actual GST Spent' },
              { key: 'actualSalary', label: 'Actual Salary Spent' },
              { key: 'actualOther', label: 'Actual Other Spent' },
            ].map(({ key, label }) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-600">
                  {label}
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form[key]}
                    onChange={handleChange(key)}
                    required={key === 'freshReceipt'}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-8 pr-3 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
                  />
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} aria-hidden />
            {submitting ? 'Saving…' : 'Save Entry'}
          </button>
        </form>

        <aside className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 shadow-md">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">
            Live Preview
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            Calculations update as you type
          </p>

          <div className="rounded-xl bg-white px-4 py-2">
            <PreviewRow
              label="Carry Forward"
              value={formatCurrency(calculated.carryForward)}
            />
            <PreviewRow
              label="Total Amount"
              value={formatCurrency(calculated.totalAmount)}
            />
            <PreviewRow
              label="Budgeted GST"
              value={formatCurrency(calculated.budgetedGST)}
            />
            <PreviewRow
              label="Budgeted Salary"
              value={formatCurrency(calculated.budgetedSalary)}
            />
            <PreviewRow
              label="Budgeted Other"
              value={formatCurrency(calculated.budgetedOther)}
            />
            <PreviewRow
              label="Total Spent"
              value={formatCurrency(calculated.totalSpent)}
            />
            <PreviewRow
              label="Total Variance"
              value={formatCurrency(calculated.totalVariance)}
              valueClassName={varianceColor}
            />
          </div>
        </aside>
    </div>
  );
}

export default AddExpense;
