import { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';

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
    <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${valueClassName}`}>{value}</span>
    </div>
  );
}

function EditExpenseModal({ isOpen, expense, onSave, onClose }) {
  const [form, setForm] = useState({
    date: '',
    acNo: '',
    freshReceipt: '',
    actualGST: '',
    actualSalary: '',
    actualOther: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !expense) return;
    console.log('[EditExpenseModal] pre-fill', expense.id, expense);

    setForm({
      date: expense.date || '',
      acNo: expense.acNo || '',
      freshReceipt: expense.freshReceipt ?? '',
      actualGST: expense.actualGST ?? '',
      actualSalary: expense.actualSalary ?? '',
      actualOther: expense.actualOther ?? '',
    });
  }, [isOpen, expense]); // ← fixed: expense?.id → expense

  const carryForward = expense?.carryForward ?? 0;

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
    if (String(form.freshReceipt).trim() === '') return;

    setSaving(true);
    const payload = {
      date: form.date,
      acNo: form.acNo,
      freshReceipt: Number(form.freshReceipt) || 0,
      actualGST: Number(form.actualGST) || 0,
      actualSalary: Number(form.actualSalary) || 0,
      actualOther: Number(form.actualOther) || 0,
    };
    console.log('[EditExpenseModal] onSave', payload);
    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !expense) return null;

  const varianceColor =
    calculated.totalVariance >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center gap-2">
          <Pencil className="text-indigo-600" size={22} aria-hidden />
          <h2 className="text-lg font-semibold text-gray-900">Edit Expense</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-600">Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={handleChange('date')}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-600">A/c No</span>
                <input
                  type="text"
                  value={form.acNo}
                  onChange={handleChange('acNo')}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
                />
              </label>
              {[
                { key: 'freshReceipt', label: 'Fresh Receipt' },
                { key: 'actualGST', label: 'Actual GST' },
                { key: 'actualSalary', label: 'Actual Salary' },
                { key: 'actualOther', label: 'Actual Other' },
              ].map(({ key, label }) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-600">{label}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form[key]}
                    onChange={handleChange(key)}
                    required={key === 'freshReceipt'}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
                  />
                </label>
              ))}
            </div>

            <aside className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Live Preview</h3>
              <div className="rounded-lg bg-white px-3 py-2">
                <PreviewRow label="Carry Forward" value={formatCurrency(carryForward)} />
                <PreviewRow label="Total Amount" value={formatCurrency(calculated.totalAmount)} />
                <PreviewRow label="Budgeted GST" value={formatCurrency(calculated.budgetedGST)} />
                <PreviewRow
                  label="Budgeted Salary"
                  value={formatCurrency(calculated.budgetedSalary)}
                />
                <PreviewRow
                  label="Budgeted Other"
                  value={formatCurrency(calculated.budgetedOther)}
                />
                <PreviewRow label="Total Spent" value={formatCurrency(calculated.totalSpent)} />
                <PreviewRow
                  label="Total Variance"
                  value={formatCurrency(calculated.totalVariance)}
                  valueClassName={varianceColor}
                />
              </div>
            </aside>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditExpenseModal;