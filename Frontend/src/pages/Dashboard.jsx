import { useMemo } from 'react';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';

const BAR_COLORS = {
  actualGST: '#3b82f6',
  actualSalary: '#22c55e',
  actualOther: '#f97316',
};

const PIE_COLORS = ['#6366f1', '#22c55e', '#f97316'];

function parseExpenseDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isWithinLast30Days(dateStr) {
  const expenseDate = parseExpenseDate(dateStr);
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 30);
  return expenseDate >= cutoff;
}

function formatChartDate(dateStr) {
  const date = parseExpenseDate(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function formatTooltipValue(value) {
  return `₹ ${new Intl.NumberFormat('en-IN').format(value ?? 0)}`;
}

function Dashboard() {
  const { expenses, loading } = useApp();

  const last30Days = useMemo(
    () => expenses.filter((expense) => isWithinLast30Days(expense.date)),
    [expenses]
  );

  const summary = useMemo(() => {
    const totalReceipt = last30Days.reduce(
      (sum, expense) => sum + (expense.freshReceipt || 0),
      0
    );
    const totalSpent = last30Days.reduce(
      (sum, expense) => sum + (expense.totalSpent || 0),
      0
    );
    const totalVariance = last30Days.reduce(
      (sum, expense) => sum + (expense.totalVariance || 0),
      0
    );

    const latest = expenses.length > 0 ? expenses[0] : null;
    const carryForward = latest
      ? (latest.totalAmount || 0) - (latest.totalSpent || 0)
      : 0;

    return { totalReceipt, totalSpent, totalVariance, carryForward };
  }, [last30Days, expenses]);

  const barChartData = useMemo(() => {
    return [...expenses]
      .sort((a, b) => parseExpenseDate(a.date) - parseExpenseDate(b.date))
      .slice(-7)
      .map((expense) => ({
        date: formatChartDate(expense.date),
        actualGST: expense.actualGST || 0,
        actualSalary: expense.actualSalary || 0,
        actualOther: expense.actualOther || 0,
      }));
  }, [expenses]);

  const pieChartData = useMemo(() => {
    const todayExpense = expenses.find((expense) => expense.date === getTodayISO());

    if (!todayExpense) {
      return [];
    }

    return [
      { name: 'Budgeted GST', value: todayExpense.budgetedGST || 0 },
      { name: 'Budgeted Salary', value: todayExpense.budgetedSalary || 0 },
      { name: 'Budgeted Other', value: todayExpense.budgetedOther || 0 },
    ];
  }, [expenses]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-md">
        <p className="text-lg font-medium text-gray-700">
          No expenses yet. Add your first entry!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Receipt"
          value={summary.totalReceipt}
          icon={Wallet}
          color="indigo"
        />
        <StatCard
          title="Total Spent"
          value={summary.totalSpent}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Total Variance"
          value={summary.totalVariance}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Carry Forward (today)"
          value={summary.carryForward}
          icon={ArrowRight}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Last 7 Days Spending
          </h2>
          {barChartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              Not enough data for chart.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={formatTooltipValue} />
                <Legend />
                <Bar
                  dataKey="actualGST"
                  name="Actual GST"
                  fill={BAR_COLORS.actualGST}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actualSalary"
                  name="Actual Salary"
                  fill={BAR_COLORS.actualSalary}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actualOther"
                  name="Actual Other"
                  fill={BAR_COLORS.actualOther}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Budget Distribution (Today)
          </h2>
          {pieChartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              No expense entry for today.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={formatTooltipValue} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
