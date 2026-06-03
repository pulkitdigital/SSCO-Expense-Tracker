// import { useMemo, useState } from 'react';
// import { Calendar, Save } from 'lucide-react';
// import { useApp } from '../context/AppContext';

// function getTodayISO() {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = String(now.getMonth() + 1).padStart(2, '0');
//   const day = String(now.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }

// function getInitialForm() {
//   return {
//     date: getTodayISO(),
//     acNo: '',
//     freshReceipt: '',
//     actualGST: '',
//     actualSalary: '',
//     actualOther: '',
//   };
// }

// function formatCurrency(value) {
//   return `₹ ${new Intl.NumberFormat('en-IN', {
//     maximumFractionDigits: 2,
//   }).format(value ?? 0)}`;
// }

// function parseAmount(value) {
//   const parsed = parseFloat(value);
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function PreviewRow({ label, value, valueClassName = 'text-gray-800' }) {
//   return (
//     <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
//       <span className="text-sm text-gray-500">{label}</span>
//       <span className={`text-sm font-semibold ${valueClassName}`}>{value}</span>
//     </div>
//   );
// }

// function AddExpense() {
//   const { saveExpense, expenses, loading, showToast } = useApp();
//   const [form, setForm] = useState(getInitialForm);
//   const [submitting, setSubmitting] = useState(false);

//   const carryForward = useMemo(() => {
//     const lastExpense = expenses.length > 0 ? expenses[0] : null;
//     if (!lastExpense) return 0;
//     return (lastExpense.totalAmount || 0) - (lastExpense.totalSpent || 0);
//   }, [expenses]);

//   const calculated = useMemo(() => {
//     const freshReceipt = parseAmount(form.freshReceipt);
//     const actualGST = parseAmount(form.actualGST);
//     const actualSalary = parseAmount(form.actualSalary);
//     const actualOther = parseAmount(form.actualOther);

//     const totalAmount = freshReceipt + carryForward;
//     const budgetedGST = totalAmount * 0.18;
//     const remaining = totalAmount - budgetedGST;
//     const budgetedSalary = remaining * 0.5;
//     const budgetedOther = remaining * 0.5;
//     const totalBudgeted = budgetedGST + budgetedSalary + budgetedOther;
//     const totalSpent = actualGST + actualSalary + actualOther;
//     const totalVariance = totalBudgeted - totalSpent;

//     return {
//       carryForward,
//       totalAmount,
//       budgetedGST,
//       budgetedSalary,
//       budgetedOther,
//       totalSpent,
//       totalVariance,
//     };
//   }, [form, carryForward]);

//   const handleChange = (field) => (event) => {
//     setForm((prev) => ({ ...prev, [field]: event.target.value }));
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (String(form.freshReceipt).trim() === '') {
//       showToast('Fresh Receipt is required.', 'error');
//       return;
//     }

//     setSubmitting(true);
//     try {
//       await saveExpense({
//         date: form.date,
//         acNo: form.acNo,
//         freshReceipt: Number(form.freshReceipt) || 0,
//         actualGST: Number(form.actualGST) || 0,
//         actualSalary: Number(form.actualSalary) || 0,
//         actualOther: Number(form.actualOther) || 0,
//       });
//       showToast('Entry saved successfully!', 'success');
//       setForm(getInitialForm());
//     } catch {
//       showToast('Failed to save entry', 'error');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const varianceColor =
//     calculated.totalVariance >= 0 ? 'text-green-600' : 'text-red-600';

//   if (loading && expenses.length === 0) {
//     return (
//       <div className="flex min-h-[400px] items-center justify-center">
//         <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//         <form
//           onSubmit={handleSubmit}
//           className="rounded-2xl bg-white p-6 shadow-md"
//         >
//           <h2 className="mb-6 text-lg font-semibold text-gray-800">
//             Daily Entry
//           </h2>

//           <div className="space-y-4">
//             <label className="block">
//               <span className="mb-1.5 block text-sm font-medium text-gray-600">
//                 Date
//               </span>
//               <div className="relative">
//                 <Calendar
//                   size={18}
//                   className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//                   aria-hidden
//                 />
//                 <input
//                   type="date"
//                   value={form.date}
//                   onChange={handleChange('date')}
//                   required
//                   className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
//                 />
//               </div>
//             </label>

//             <label className="block">
//               <span className="mb-1.5 block text-sm font-medium text-gray-600">
//                 A/c No
//               </span>
//               <input
//                 type="text"
//                 value={form.acNo}
//                 onChange={handleChange('acNo')}
//                 placeholder="Account number"
//                 className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
//               />
//             </label>

//             {[
//               { key: 'freshReceipt', label: 'Fresh Receipt' },
//               { key: 'actualGST', label: 'Actual GST Spent' },
//               { key: 'actualSalary', label: 'Actual Salary Spent' },
//               { key: 'actualOther', label: 'Actual Other Spent' },
//             ].map(({ key, label }) => (
//               <label key={key} className="block">
//                 <span className="mb-1.5 block text-sm font-medium text-gray-600">
//                   {label}
//                 </span>
//                 <div className="relative">
//                   <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
//                     ₹
//                   </span>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     value={form[key]}
//                     onChange={handleChange(key)}
//                     required={key === 'freshReceipt'}
//                     placeholder="0"
//                     className="w-full rounded-lg border border-gray-200 py-2.5 pl-8 pr-3 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
//                   />
//                 </div>
//               </label>
//             ))}
//           </div>

//           <button
//             type="submit"
//             disabled={submitting}
//             className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             <Save size={18} aria-hidden />
//             {submitting ? 'Saving…' : 'Save Entry'}
//           </button>
//         </form>

//         <aside className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 shadow-md">
//           <h2 className="mb-2 text-lg font-semibold text-gray-800">
//             Live Preview
//           </h2>
//           <p className="mb-4 text-xs text-gray-500">
//             Calculations update as you type
//           </p>

//           <div className="rounded-xl bg-white px-4 py-2">
//             <PreviewRow
//               label="Carry Forward"
//               value={formatCurrency(calculated.carryForward)}
//             />
//             <PreviewRow
//               label="Total Amount"
//               value={formatCurrency(calculated.totalAmount)}
//             />
//             <PreviewRow
//               label="Budgeted GST"
//               value={formatCurrency(calculated.budgetedGST)}
//             />
//             <PreviewRow
//               label="Budgeted Salary"
//               value={formatCurrency(calculated.budgetedSalary)}
//             />
//             <PreviewRow
//               label="Budgeted Other"
//               value={formatCurrency(calculated.budgetedOther)}
//             />
//             <PreviewRow
//               label="Total Spent"
//               value={formatCurrency(calculated.totalSpent)}
//             />
//             <PreviewRow
//               label="Total Variance"
//               value={formatCurrency(calculated.totalVariance)}
//               valueClassName={varianceColor}
//             />
//           </div>
//         </aside>
//     </div>
//   );
// }

// export default AddExpense;







































// import { useMemo, useState } from 'react';
// import { Calendar, Save, Receipt, ClipboardList } from 'lucide-react';
// import { useApp } from '../context/AppContext';

// // ─── Helpers ────────────────────────────────────────────────────────────────

// function getTodayISO() {
//   const now = new Date();
//   const year  = now.getFullYear();
//   const month = String(now.getMonth() + 1).padStart(2, '0');
//   const day   = String(now.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }

// function formatCurrency(value) {
//   return `₹ ${new Intl.NumberFormat('en-IN', {
//     maximumFractionDigits: 2,
//   }).format(value ?? 0)}`;
// }

// function parseAmount(value) {
//   const parsed = parseFloat(value);
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// // ─── Sub-components ──────────────────────────────────────────────────────────

// function PreviewRow({ label, value, valueClassName = 'text-gray-800' }) {
//   return (
//     <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
//       <span className="text-sm text-gray-500">{label}</span>
//       <span className={`text-sm font-semibold ${valueClassName}`}>{value}</span>
//     </div>
//   );
// }

// function AmountInput({ label, fieldKey, value, onChange, required = false }) {
//   return (
//     <label className="block">
//       <span className="mb-1.5 block text-sm font-medium text-gray-600">{label}</span>
//       <div className="relative">
//         <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
//           ₹
//         </span>
//         <input
//           type="number"
//           min="0"
//           step="0.01"
//           value={value}
//           onChange={(e) => onChange(fieldKey, e.target.value)}
//           required={required}
//           placeholder="0"
//           className="w-full rounded-lg border border-gray-200 py-2.5 pl-8 pr-3 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
//         />
//       </div>
//     </label>
//   );
// }

// // ─── Tab 1: Add Receipt ──────────────────────────────────────────────────────

// function AddReceiptTab({ expenses, carryForward }) {
//   const { saveExpense, showToast } = useApp();
//   const [form, setForm] = useState({
//     date:         getTodayISO(),
//     acNo:         '',
//     freshReceipt: '',
//   });
//   const [submitting, setSubmitting] = useState(false);

//   const calculated = useMemo(() => {
//     const freshReceipt  = parseAmount(form.freshReceipt);
//     const totalAmount   = freshReceipt + carryForward;
//     const budgetedGST   = totalAmount * 0.18;
//     const remaining     = totalAmount - budgetedGST;
//     const budgetedSalary = remaining * 0.5;
//     const budgetedOther  = remaining * 0.5;
//     return { totalAmount, budgetedGST, budgetedSalary, budgetedOther };
//   }, [form.freshReceipt, carryForward]);

//   const handleChange = (field, value) =>
//     setForm((prev) => ({ ...prev, [field]: value }));

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.freshReceipt.toString().trim()) {
//       showToast('Fresh Receipt is required.', 'error');
//       return;
//     }
//     setSubmitting(true);
//     try {
//       // Save receipt only — actuals = 0
//       await saveExpense({
//         date:         form.date,
//         acNo:         form.acNo,
//         freshReceipt: Number(form.freshReceipt) || 0,
//         actualGST:    0,
//         actualSalary: 0,
//         actualOther:  0,
//       });
//       showToast('Receipt saved! Fill actuals later from Add Entry tab.', 'success');
//       setForm({ date: getTodayISO(), acNo: '', freshReceipt: '' });
//     } catch {
//       showToast('Failed to save receipt', 'error');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//       {/* Form */}
//       <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-md">
//         <h2 className="mb-6 text-lg font-semibold text-gray-800">Receipt Details</h2>

//         <div className="space-y-4">
//           {/* Date */}
//           <label className="block">
//             <span className="mb-1.5 block text-sm font-medium text-gray-600">Date</span>
//             <div className="relative">
//               <Calendar
//                 size={18}
//                 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//                 aria-hidden
//               />
//               <input
//                 type="date"
//                 value={form.date}
//                 onChange={(e) => handleChange('date', e.target.value)}
//                 required
//                 className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
//               />
//             </div>
//           </label>

//           {/* A/c No */}
//           <label className="block">
//             <span className="mb-1.5 block text-sm font-medium text-gray-600">A/c No</span>
//             <input
//               type="text"
//               value={form.acNo}
//               onChange={(e) => handleChange('acNo', e.target.value)}
//               placeholder="Account number"
//               className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
//             />
//           </label>

//           {/* Fresh Receipt */}
//           <AmountInput
//             label="Fresh Receipt"
//             fieldKey="freshReceipt"
//             value={form.freshReceipt}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={submitting}
//           className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
//         >
//           <Save size={18} aria-hidden />
//           {submitting ? 'Saving…' : 'Save Receipt'}
//         </button>
//       </form>

//       {/* Live Preview */}
//       <aside className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 shadow-md">
//         <h2 className="mb-2 text-lg font-semibold text-gray-800">Live Preview</h2>
//         <p className="mb-4 text-xs text-gray-500">Calculations update as you type</p>
//         <div className="rounded-xl bg-white px-4 py-2">
//           <PreviewRow label="Carry Forward"    value={formatCurrency(carryForward)} />
//           <PreviewRow label="Total Amount"     value={formatCurrency(calculated.totalAmount)} />
//           <PreviewRow label="Budgeted GST"     value={formatCurrency(calculated.budgetedGST)} />
//           <PreviewRow label="Budgeted Salary"  value={formatCurrency(calculated.budgetedSalary)} />
//           <PreviewRow label="Budgeted Other"   value={formatCurrency(calculated.budgetedOther)} />
//         </div>
//         <p className="mt-4 text-xs text-gray-400 italic">
//           Actual spent fields will be filled later from the "Add Entry" tab.
//         </p>
//       </aside>
//     </div>
//   );
// }

// // ─── Tab 2: Add Entry ────────────────────────────────────────────────────────

// function AddEntryTab() {
//   const { expenses, fillEntry, showToast } = useApp();

//   // Only show expenses where all actuals are 0 (receipt saved, entry pending)
//   const pendingExpenses = useMemo(
//     () =>
//       expenses.filter(
//         (e) =>
//           (e.actualGST    ?? 0) === 0 &&
//           (e.actualSalary ?? 0) === 0 &&
//           (e.actualOther  ?? 0) === 0
//       ),
//     [expenses]
//   );

//   const [selectedId, setSelectedId] = useState('');
//   const [form, setForm] = useState({
//     actualGST:    '',
//     actualSalary: '',
//     actualOther:  '',
//   });
//   const [submitting, setSubmitting] = useState(false);

//   // Selected expense object
//   const selectedExpense = useMemo(
//     () => pendingExpenses.find((e) => String(e.id) === String(selectedId)) ?? null,
//     [pendingExpenses, selectedId]
//   );

//   // Live preview calculations based on selected expense + typed actuals
//   const calculated = useMemo(() => {
//     if (!selectedExpense) return null;

//     const totalAmount    = selectedExpense.totalAmount  ?? 0;
//     const budgetedGST    = selectedExpense.budgetedGST  ?? 0;
//     const budgetedSalary = selectedExpense.budgetedSalary ?? 0;
//     const budgetedOther  = selectedExpense.budgetedOther  ?? 0;

//     const actualGST    = parseAmount(form.actualGST);
//     const actualSalary = parseAmount(form.actualSalary);
//     const actualOther  = parseAmount(form.actualOther);

//     const totalSpent    = actualGST + actualSalary + actualOther;
//     const totalVariance = totalAmount - totalSpent;

//     return {
//       totalAmount,
//       budgetedGST,
//       budgetedSalary,
//       budgetedOther,
//       actualGST,
//       actualSalary,
//       actualOther,
//       totalSpent,
//       totalVariance,
//     };
//   }, [selectedExpense, form]);

//   const handleChange = (field, value) =>
//     setForm((prev) => ({ ...prev, [field]: value }));

//   const handleSelectChange = (e) => {
//     setSelectedId(e.target.value);
//     setForm({ actualGST: '', actualSalary: '', actualOther: '' });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!selectedId) {
//       showToast('Please select a receipt first.', 'error');
//       return;
//     }
//     setSubmitting(true);
//     try {
//       await fillEntry(selectedId, {
//         actualGST:    Number(form.actualGST)    || 0,
//         actualSalary: Number(form.actualSalary) || 0,
//         actualOther:  Number(form.actualOther)  || 0,
//       });
//       // Reset form after successful save
//       setSelectedId('');
//       setForm({ actualGST: '', actualSalary: '', actualOther: '' });
//     } catch {
//       // toast already shown in context
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const varianceColor =
//     !calculated
//       ? 'text-gray-800'
//       : calculated.totalVariance >= 0
//       ? 'text-green-600'
//       : 'text-red-600';

//   return (
//     <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//       {/* Form */}
//       <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-md">
//         <h2 className="mb-6 text-lg font-semibold text-gray-800">Fill Actual Expenses</h2>

//         {pendingExpenses.length === 0 ? (
//           // Empty state — all entries filled
//           <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
//             <ClipboardList size={36} className="mb-3 text-gray-300" />
//             <p className="text-sm font-medium text-gray-500">No pending entries</p>
//             <p className="mt-1 text-xs text-gray-400">
//               All receipts have their actuals filled. Add a new receipt first.
//             </p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {/* Receipt Dropdown */}
//             <label className="block">
//               <span className="mb-1.5 block text-sm font-medium text-gray-600">
//                 Select Receipt
//               </span>
//               <select
//                 value={selectedId}
//                 onChange={handleSelectChange}
//                 required
//                 className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2 bg-white"
//               >
//                 <option value="">— Choose a pending receipt —</option>
//                 {pendingExpenses.map((e) => (
//                   <option key={e.id} value={e.id}>
//                     {e.date}
//                     {e.acNo ? `  |  A/c: ${e.acNo}` : ''}
//                     {`  |  ₹ ${new Intl.NumberFormat('en-IN').format(e.freshReceipt ?? 0)}`}
//                   </option>
//                 ))}
//               </select>
//             </label>

//             {/* Show actual fields only when a receipt is selected */}
//             {selectedExpense && (
//               <>
//                 {/* Read-only receipt info */}
//                 <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 space-y-1">
//                   <p className="text-xs text-gray-500">
//                     <span className="font-medium text-gray-700">Total Amount: </span>
//                     {formatCurrency(selectedExpense.totalAmount)}
//                   </p>
//                   <p className="text-xs text-gray-500">
//                     <span className="font-medium text-gray-700">Carry Forward: </span>
//                     {formatCurrency(selectedExpense.carryForward)}
//                   </p>
//                 </div>

//                 {/* Actual inputs */}
//                 <AmountInput
//                   label="Actual GST Spent"
//                   fieldKey="actualGST"
//                   value={form.actualGST}
//                   onChange={handleChange}
//                 />
//                 <AmountInput
//                   label="Actual Salary Spent"
//                   fieldKey="actualSalary"
//                   value={form.actualSalary}
//                   onChange={handleChange}
//                 />
//                 <AmountInput
//                   label="Actual Other Spent"
//                   fieldKey="actualOther"
//                   value={form.actualOther}
//                   onChange={handleChange}
//                 />
//               </>
//             )}
//           </div>
//         )}

//         {pendingExpenses.length > 0 && (
//           <button
//             type="submit"
//             disabled={submitting || !selectedId}
//             className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             <Save size={18} aria-hidden />
//             {submitting ? 'Saving…' : 'Save Entry'}
//           </button>
//         )}
//       </form>

//       {/* Live Preview */}
//       <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-md">
//         <h2 className="mb-2 text-lg font-semibold text-gray-800">Live Preview</h2>
//         <p className="mb-4 text-xs text-gray-500">Calculations update as you type</p>

//         {!calculated ? (
//           <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
//             <p className="text-sm text-gray-400">Select a receipt to see preview</p>
//           </div>
//         ) : (
//           <div className="rounded-xl bg-white px-4 py-2">
//             <PreviewRow label="Total Amount"    value={formatCurrency(calculated.totalAmount)} />
//             <PreviewRow label="Budgeted GST"    value={formatCurrency(calculated.budgetedGST)} />
//             <PreviewRow label="Budgeted Salary" value={formatCurrency(calculated.budgetedSalary)} />
//             <PreviewRow label="Budgeted Other"  value={formatCurrency(calculated.budgetedOther)} />
//             <PreviewRow label="Actual GST"      value={formatCurrency(calculated.actualGST)} />
//             <PreviewRow label="Actual Salary"   value={formatCurrency(calculated.actualSalary)} />
//             <PreviewRow label="Actual Other"    value={formatCurrency(calculated.actualOther)} />
//             <PreviewRow label="Total Spent"     value={formatCurrency(calculated.totalSpent)} />
//             <PreviewRow
//               label="Total Variance"
//               value={formatCurrency(calculated.totalVariance)}
//               valueClassName={varianceColor}
//             />
//           </div>
//         )}
//       </aside>
//     </div>
//   );
// }

// // ─── Main Component ──────────────────────────────────────────────────────────

// function AddExpense() {
//   const { expenses, loading } = useApp();
//   const [activeTab, setActiveTab] = useState('receipt'); // 'receipt' | 'entry'

//   const carryForward = useMemo(() => {
//     const lastExpense = expenses.length > 0 ? expenses[0] : null;
//     if (!lastExpense) return 0;
//     return (lastExpense.totalAmount || 0) - (lastExpense.totalSpent || 0);
//   }, [expenses]);

//   // Count pending entries for the badge
//   const pendingCount = useMemo(
//     () =>
//       expenses.filter(
//         (e) =>
//           (e.actualGST    ?? 0) === 0 &&
//           (e.actualSalary ?? 0) === 0 &&
//           (e.actualOther  ?? 0) === 0
//       ).length,
//     [expenses]
//   );

//   if (loading && expenses.length === 0) {
//     return (
//       <div className="flex min-h-[400px] items-center justify-center">
//         <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Tab Bar */}
//       <div className="flex gap-2 rounded-xl bg-gray-100 p-1 w-fit">
//         <button
//           type="button"
//           onClick={() => setActiveTab('receipt')}
//           className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
//             activeTab === 'receipt'
//               ? 'bg-white text-indigo-600 shadow-sm'
//               : 'text-gray-500 hover:text-gray-700'
//           }`}
//         >
//           <Receipt size={16} aria-hidden />
//           Add Receipt
//         </button>

//         <button
//           type="button"
//           onClick={() => setActiveTab('entry')}
//           className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
//             activeTab === 'entry'
//               ? 'bg-white text-emerald-600 shadow-sm'
//               : 'text-gray-500 hover:text-gray-700'
//           }`}
//         >
//           <ClipboardList size={16} aria-hidden />
//           Add Entry
//           {/* Badge — shows count of pending receipts */}
//           {pendingCount > 0 && (
//             <span className="ml-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
//               {pendingCount}
//             </span>
//           )}
//         </button>
//       </div>

//       {/* Tab Content */}
//       {activeTab === 'receipt' ? (
//         <AddReceiptTab expenses={expenses} carryForward={carryForward} />
//       ) : (
//         <AddEntryTab />
//       )}
//     </div>
//   );
// }

// export default AddExpense;































import { useMemo, useState } from 'react';
import { Calendar, Save, Receipt, ClipboardList } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayISO() {
  const now = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

/**
 * Frontend mirror of Backend calculations.js — must stay in sync.
 *
 * NEW LOGIC:
 * - GST budgeted only on freshReceipt (not carryForward)
 * - prevRemainingGST = prevBudgetedGST - prevActualGST added to GST budget
 * - nonGSTCarry = carryForward - prevRemainingGST used for salary/other split
 */
function calculatePreview({
  freshReceipt,
  carryForward,
  actualGST,
  actualSalary,
  actualOther,
  prevBudgetedGST = 0,
  prevActualGST   = 0,
}) {
  const totalAmount        = freshReceipt + carryForward;
  const budgetedGSTOnFresh = freshReceipt * 0.18;
  const prevRemainingGST   = prevBudgetedGST - prevActualGST;
  const budgetedGST        = budgetedGSTOnFresh + prevRemainingGST;
  const nonGSTCarry        = carryForward - prevRemainingGST;
  const remaining          = (freshReceipt - budgetedGSTOnFresh) + nonGSTCarry;
  const budgetedSalary     = remaining * 0.5;
  const budgetedOther      = remaining * 0.5;
  const totalBudgeted      = budgetedGST + budgetedSalary + budgetedOther;
  const totalSpent         = actualGST + actualSalary + actualOther;
  const totalVariance      = totalBudgeted - totalSpent;

  return {
    totalAmount,
    budgetedGST,
    budgetedSalary,
    budgetedOther,
    totalBudgeted,
    totalSpent,
    totalVariance,
    prevRemainingGST,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PreviewRow({ label, value, valueClassName = 'text-gray-800' }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${valueClassName}`}>{value}</span>
    </div>
  );
}

function AmountInput({ label, fieldKey, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-600">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          ₹
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          required={required}
          placeholder="0"
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-8 pr-3 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
        />
      </div>
    </label>
  );
}

// ─── Tab 1: Add Receipt ──────────────────────────────────────────────────────

function AddReceiptTab({ expenses, carryForward }) {
  const { saveExpense, showToast } = useApp();
  const [form, setForm] = useState({
    date:         getTodayISO(),
    acNo:         '',
    freshReceipt: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Previous expense for GST carry logic
  const lastExpense = expenses.length > 0 ? expenses[0] : null;
  const prevBudgetedGST = lastExpense ? (lastExpense.budgetedGST ?? 0) : 0;
  const prevActualGST   = lastExpense ? (lastExpense.actualGST   ?? 0) : 0;

  const calculated = useMemo(() => {
    const freshReceipt = parseAmount(form.freshReceipt);
    return calculatePreview({
      freshReceipt,
      carryForward,
      actualGST:    0,
      actualSalary: 0,
      actualOther:  0,
      prevBudgetedGST,
      prevActualGST,
    });
  }, [form.freshReceipt, carryForward, prevBudgetedGST, prevActualGST]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.freshReceipt.toString().trim()) {
      showToast('Fresh Receipt is required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await saveExpense({
        date:         form.date,
        acNo:         form.acNo,
        freshReceipt: Number(form.freshReceipt) || 0,
        actualGST:    0,
        actualSalary: 0,
        actualOther:  0,
      });
      showToast('Receipt saved! Fill actuals later from Add Entry tab.', 'success');
      setForm({ date: getTodayISO(), acNo: '', freshReceipt: '' });
    } catch {
      showToast('Failed to save receipt', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="mb-6 text-lg font-semibold text-gray-800">Receipt Details</h2>

        <div className="space-y-4">
          {/* Date */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-600">Date</span>
            <div className="relative">
              <Calendar
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
              />
            </div>
          </label>

          {/* A/c No */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-600">A/c No</span>
            <input
              type="text"
              value={form.acNo}
              onChange={(e) => handleChange('acNo', e.target.value)}
              placeholder="Account number"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2"
            />
          </label>

          {/* Fresh Receipt */}
          <AmountInput
            label="Fresh Receipt"
            fieldKey="freshReceipt"
            value={form.freshReceipt}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} aria-hidden />
          {submitting ? 'Saving…' : 'Save Receipt'}
        </button>
      </form>

      {/* Live Preview */}
      <aside className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 shadow-md">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">Live Preview</h2>
        <p className="mb-4 text-xs text-gray-500">Calculations update as you type</p>
        <div className="rounded-xl bg-white px-4 py-2">
          <PreviewRow label="Carry Forward"       value={formatCurrency(carryForward)} />
          <PreviewRow label="Total Amount"        value={formatCurrency(calculated.totalAmount)} />
          {calculated.prevRemainingGST > 0 && (
            <PreviewRow
              label="Prev. Remaining GST"
              value={formatCurrency(calculated.prevRemainingGST)}
              valueClassName="text-orange-500"
            />
          )}
          <PreviewRow label="Budgeted GST"        value={formatCurrency(calculated.budgetedGST)} />
          <PreviewRow label="Budgeted Salary"     value={formatCurrency(calculated.budgetedSalary)} />
          <PreviewRow label="Budgeted Other"      value={formatCurrency(calculated.budgetedOther)} />
        </div>
        <p className="mt-4 text-xs text-gray-400 italic">
          Actual spent fields will be filled later from the "Add Entry" tab.
        </p>
      </aside>
    </div>
  );
}

// ─── Tab 2: Add Entry ────────────────────────────────────────────────────────

function AddEntryTab({ expenses }) {
  const { fillEntry, showToast } = useApp();

  // Only show expenses where all actuals are 0 (receipt saved, entry pending)
  const pendingExpenses = useMemo(
    () =>
      expenses.filter(
        (e) =>
          (e.actualGST    ?? 0) === 0 &&
          (e.actualSalary ?? 0) === 0 &&
          (e.actualOther  ?? 0) === 0
      ),
    [expenses]
  );

  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({
    actualGST:    '',
    actualSalary: '',
    actualOther:  '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Selected expense object
  const selectedExpense = useMemo(
    () => pendingExpenses.find((e) => String(e.id) === String(selectedId)) ?? null,
    [pendingExpenses, selectedId]
  );

  // Live preview — uses already-saved budgeted values from DB (calculated at POST time)
  const calculated = useMemo(() => {
    if (!selectedExpense) return null;

    const totalAmount    = selectedExpense.totalAmount    ?? 0;
    const budgetedGST    = selectedExpense.budgetedGST    ?? 0;
    const budgetedSalary = selectedExpense.budgetedSalary ?? 0;
    const budgetedOther  = selectedExpense.budgetedOther  ?? 0;
    const totalBudgeted  = selectedExpense.totalBudgeted  ?? 0;

    const actualGST    = parseAmount(form.actualGST);
    const actualSalary = parseAmount(form.actualSalary);
    const actualOther  = parseAmount(form.actualOther);

    const totalSpent    = actualGST + actualSalary + actualOther;
    const totalVariance = totalBudgeted - totalSpent;

    return {
      totalAmount,
      budgetedGST,
      budgetedSalary,
      budgetedOther,
      actualGST,
      actualSalary,
      actualOther,
      totalSpent,
      totalVariance,
    };
  }, [selectedExpense, form]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSelectChange = (e) => {
    setSelectedId(e.target.value);
    setForm({ actualGST: '', actualSalary: '', actualOther: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      showToast('Please select a receipt first.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await fillEntry(selectedId, {
        actualGST:    Number(form.actualGST)    || 0,
        actualSalary: Number(form.actualSalary) || 0,
        actualOther:  Number(form.actualOther)  || 0,
      });
      setSelectedId('');
      setForm({ actualGST: '', actualSalary: '', actualOther: '' });
    } catch {
      // toast already shown in context
    } finally {
      setSubmitting(false);
    }
  };

  const varianceColor =
    !calculated
      ? 'text-gray-800'
      : calculated.totalVariance >= 0
      ? 'text-green-600'
      : 'text-red-600';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="mb-6 text-lg font-semibold text-gray-800">Fill Actual Expenses</h2>

        {pendingExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
            <ClipboardList size={36} className="mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No pending entries</p>
            <p className="mt-1 text-xs text-gray-400">
              All receipts have their actuals filled. Add a new receipt first.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Receipt Dropdown */}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-600">
                Select Receipt
              </span>
              <select
                value={selectedId}
                onChange={handleSelectChange}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none ring-indigo-500 focus:ring-2 bg-white"
              >
                <option value="">— Choose a pending receipt —</option>
                {pendingExpenses.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.date}
                    {e.acNo ? `  |  A/c: ${e.acNo}` : ''}
                    {`  |  ₹ ${new Intl.NumberFormat('en-IN').format(e.freshReceipt ?? 0)}`}
                  </option>
                ))}
              </select>
            </label>

            {selectedExpense && (
              <>
                {/* Read-only receipt info */}
                <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 space-y-1">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Total Amount: </span>
                    {formatCurrency(selectedExpense.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Budgeted GST: </span>
                    {formatCurrency(selectedExpense.budgetedGST)}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Carry Forward: </span>
                    {formatCurrency(selectedExpense.carryForward)}
                  </p>
                </div>

                <AmountInput
                  label="Actual GST Spent"
                  fieldKey="actualGST"
                  value={form.actualGST}
                  onChange={handleChange}
                />
                <AmountInput
                  label="Actual Salary Spent"
                  fieldKey="actualSalary"
                  value={form.actualSalary}
                  onChange={handleChange}
                />
                <AmountInput
                  label="Actual Other Spent"
                  fieldKey="actualOther"
                  value={form.actualOther}
                  onChange={handleChange}
                />
              </>
            )}
          </div>
        )}

        {pendingExpenses.length > 0 && (
          <button
            type="submit"
            disabled={submitting || !selectedId}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} aria-hidden />
            {submitting ? 'Saving…' : 'Save Entry'}
          </button>
        )}
      </form>

      {/* Live Preview */}
      <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-md">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">Live Preview</h2>
        <p className="mb-4 text-xs text-gray-500">Calculations update as you type</p>

        {!calculated ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm text-gray-400">Select a receipt to see preview</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white px-4 py-2">
            <PreviewRow label="Total Amount"    value={formatCurrency(calculated.totalAmount)} />
            <PreviewRow label="Budgeted GST"    value={formatCurrency(calculated.budgetedGST)} />
            <PreviewRow label="Budgeted Salary" value={formatCurrency(calculated.budgetedSalary)} />
            <PreviewRow label="Budgeted Other"  value={formatCurrency(calculated.budgetedOther)} />
            <PreviewRow label="Actual GST"      value={formatCurrency(calculated.actualGST)} />
            <PreviewRow label="Actual Salary"   value={formatCurrency(calculated.actualSalary)} />
            <PreviewRow label="Actual Other"    value={formatCurrency(calculated.actualOther)} />
            <PreviewRow label="Total Spent"     value={formatCurrency(calculated.totalSpent)} />
            <PreviewRow
              label="Total Variance"
              value={formatCurrency(calculated.totalVariance)}
              valueClassName={varianceColor}
            />
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function AddExpense() {
  const { expenses, loading } = useApp();
  const [activeTab, setActiveTab] = useState('receipt');

  const carryForward = useMemo(() => {
    const lastExpense = expenses.length > 0 ? expenses[0] : null;
    if (!lastExpense) return 0;
    return (lastExpense.totalAmount || 0) - (lastExpense.totalSpent || 0);
  }, [expenses]);

  const pendingCount = useMemo(
    () =>
      expenses.filter(
        (e) =>
          (e.actualGST    ?? 0) === 0 &&
          (e.actualSalary ?? 0) === 0 &&
          (e.actualOther  ?? 0) === 0
      ).length,
    [expenses]
  );

  if (loading && expenses.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-2 rounded-xl bg-gray-100 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'receipt'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Receipt size={16} aria-hidden />
          Add Receipt
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('entry')}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'entry'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList size={16} aria-hidden />
          Add Entry
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'receipt' ? (
        <AddReceiptTab expenses={expenses} carryForward={carryForward} />
      ) : (
        <AddEntryTab expenses={expenses} />
      )}
    </div>
  );
}

export default AddExpense;
