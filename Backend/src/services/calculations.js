function getCarryForward(prevTotalAmount, prevTotalSpent) {
  return prevTotalAmount - prevTotalSpent;
}

function calculate(
  freshReceipt,
  carryForward,
  actualGST,
  actualSalary,
  actualOther,
  prevBudgetedGST = 0,
  prevActualGST = 0
) {
  const totalAmount = freshReceipt + carryForward;
  const budgetedGSTOnFresh = freshReceipt * 0.18;
  const prevRemainingGST = prevBudgetedGST - prevActualGST;
  const budgetedGST = budgetedGSTOnFresh + prevRemainingGST;
  const nonGSTCarry = carryForward - prevRemainingGST;
  const remaining = (freshReceipt - budgetedGSTOnFresh) + nonGSTCarry;
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
    prevRemainingGST,
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

module.exports = { calculate, getCarryForward };
