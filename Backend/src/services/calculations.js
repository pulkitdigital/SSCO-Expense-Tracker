/**
 * Computes carry forward from the previous day's totals.
 * Carry forward is what was left unspent: previous total amount minus previous total spent.
 * For day 1 (no prior record), pass 0 for both arguments to get a carry forward of 0.
 *
 * @param {number} prevTotalAmount - Previous day's total amount (fresh receipt + prior carry forward)
 * @param {number} prevTotalSpent - Previous day's total spent (actual GST + salary + other)
 * @returns {number} Amount to carry forward into the current day
 */
function getCarryForward(prevTotalAmount, prevTotalSpent) {
  return prevTotalAmount - prevTotalSpent;
}

/**
 * Calculates budgeted splits, spending totals, and variances for one expense day.
 * Budget: 18% GST, then remaining split 50/50 between salary and other.
 * Variance is budgeted minus actual (positive = under budget / saved, negative = overspent).
 *
 * @param {number} freshReceipt - New receipt amount entered for the day
 * @param {number} carryForward - Unspent balance from the previous day
 * @param {number} actualGST - Actual GST spent
 * @param {number} actualSalary - Actual salary spent
 * @param {number} actualOther - Actual other expenses spent
 * @returns {object} Calculated totals, budgeted amounts, and variances
 */
function calculate(freshReceipt, carryForward, actualGST, actualSalary, actualOther) {
  const totalAmount = freshReceipt + carryForward;
  const budgetedGST = totalAmount * 0.18;
  const remaining = totalAmount - budgetedGST;
  const budgetedSalary = remaining * 0.5;
  const budgetedOther = remaining * 0.5;
  const totalBudgeted = budgetedGST + budgetedSalary + budgetedOther;
  const totalSpent = actualGST + actualSalary + actualOther;

  const gstVariance = budgetedGST - actualGST;
  const salaryVariance = budgetedSalary - actualSalary;
  const otherVariance = budgetedOther - actualOther;
  const totalVariance = gstVariance + salaryVariance + otherVariance;

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
