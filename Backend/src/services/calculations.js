// /**
//  * Computes carry forward from the previous day's totals.
//  * Carry forward is what was left unspent: previous total amount minus previous total spent.
//  * For day 1 (no prior record), pass 0 for both arguments to get a carry forward of 0.
//  *
//  * @param {number} prevTotalAmount - Previous day's total amount (fresh receipt + prior carry forward)
//  * @param {number} prevTotalSpent - Previous day's total spent (actual GST + salary + other)
//  * @returns {number} Amount to carry forward into the current day
//  */
// function getCarryForward(prevTotalAmount, prevTotalSpent) {
//   return prevTotalAmount - prevTotalSpent;
// }

// /**
//  * Calculates budgeted splits, spending totals, and variances for one expense day.
//  * Budget: 18% GST, then remaining split 50/50 between salary and other.
//  * Variance is budgeted minus actual (positive = under budget / saved, negative = overspent).
//  *
//  * @param {number} freshReceipt - New receipt amount entered for the day
//  * @param {number} carryForward - Unspent balance from the previous day
//  * @param {number} actualGST - Actual GST spent
//  * @param {number} actualSalary - Actual salary spent
//  * @param {number} actualOther - Actual other expenses spent
//  * @returns {object} Calculated totals, budgeted amounts, and variances
//  */
// function calculate(freshReceipt, carryForward, actualGST, actualSalary, actualOther) {
//   const totalAmount = freshReceipt + carryForward;
//   const budgetedGST = totalAmount * 0.18;
//   const remaining = totalAmount - budgetedGST;
//   const budgetedSalary = remaining * 0.5;
//   const budgetedOther = remaining * 0.5;
//   const totalBudgeted = budgetedGST + budgetedSalary + budgetedOther;
//   const totalSpent = actualGST + actualSalary + actualOther;

//   const gstVariance = budgetedGST - actualGST;
//   const salaryVariance = budgetedSalary - actualSalary;
//   const otherVariance = budgetedOther - actualOther;
//   const totalVariance = gstVariance + salaryVariance + otherVariance;

//   return {
//     totalAmount,
//     budgetedGST,
//     remaining,
//     budgetedSalary,
//     budgetedOther,
//     totalBudgeted,
//     totalSpent,
//     gstVariance,
//     salaryVariance,
//     otherVariance,
//     totalVariance,
//   };
// }

// module.exports = {
//   calculate,
//   getCarryForward,
// };
































/**
 * Computes carry forward from the previous day's totals.
 * Carry forward is what was left unspent: previous total amount minus previous total spent.
 * For day 1 (no prior record), pass 0 for both arguments to get a carry forward of 0.
 *
 * @param {number} prevTotalAmount - Previous day's total amount
 * @param {number} prevTotalSpent  - Previous day's total spent
 * @returns {number} Amount to carry forward into the current day
 */
function getCarryForward(prevTotalAmount, prevTotalSpent) {
  return prevTotalAmount - prevTotalSpent;
}

/**
 * Calculates budgeted splits, spending totals, and variances for one expense day.
 *
 * NEW LOGIC:
 * - GST is budgeted only on freshReceipt (not on carryForward)
 * - Previous day's unspent GST (prevBudgetedGST - prevActualGST) is added to current GST budget
 * - carryForward is split into GST portion and non-GST portion
 * - Salary/Other split is done on: (freshReceipt - budgetedGST) + nonGSTCarry
 *
 * @param {number} freshReceipt     - New receipt amount entered for the day
 * @param {number} carryForward     - Unspent balance carried from previous day
 * @param {number} actualGST        - Actual GST spent today
 * @param {number} actualSalary     - Actual salary spent today
 * @param {number} actualOther      - Actual other expenses spent today
 * @param {number} prevBudgetedGST  - Previous day's budgeted GST (default 0 for day 1)
 * @param {number} prevActualGST    - Previous day's actual GST spent (default 0 for day 1)
 * @returns {object} Calculated totals, budgeted amounts, and variances
 */
function calculate(
  freshReceipt,
  carryForward,
  actualGST,
  actualSalary,
  actualOther,
  prevBudgetedGST = 0,
  prevActualGST   = 0
) {
  // ── Step 1: Total Amount (unchanged) ──────────────────────────────────────
  const totalAmount = freshReceipt + carryForward;

  // ── Step 2: GST Budget ────────────────────────────────────────────────────
  // GST is calculated only on freshReceipt, not on carryForward
  const budgetedGSTOnFresh = freshReceipt * 0.18;

  // Previous day's unspent GST carries over
  const prevRemainingGST = prevBudgetedGST - prevActualGST;

  // Total GST budget for today = fresh GST + leftover GST from yesterday
  const budgetedGST = budgetedGSTOnFresh + prevRemainingGST;

  // ── Step 3: Salary / Other Budget ─────────────────────────────────────────
  // Non-GST portion of carryForward (remove the GST part already tracked above)
  const nonGSTCarry = carryForward - prevRemainingGST;

  // Remaining for salary/other = (freshReceipt after GST) + non-GST carry
  const remaining = (freshReceipt - budgetedGSTOnFresh) + nonGSTCarry;

  const budgetedSalary = remaining * 0.5;
  const budgetedOther  = remaining * 0.5;

  // ── Step 4: Total Budgeted ────────────────────────────────────────────────
  const totalBudgeted = budgetedGST + budgetedSalary + budgetedOther;

  // ── Step 5: Actuals & Variances ───────────────────────────────────────────
  const totalSpent = actualGST + actualSalary + actualOther;

  const gstVariance    = budgetedGST    - actualGST;
  const salaryVariance = budgetedSalary - actualSalary;
  const otherVariance  = budgetedOther  - actualOther;
  const totalVariance  = gstVariance + salaryVariance + otherVariance;

  return {
    totalAmount,
    budgetedGST,
    remaining,
    budgetedSalary,
    budgetedOther,
    totalBudgeted,
    totalSpent,
    gstVariance,
    salaryVariance,
    otherVariance,
    totalVariance,
  };
}

module.exports = {
  calculate,
  getCarryForward,
};