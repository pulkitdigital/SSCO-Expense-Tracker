import { ArrowDown, ArrowUp } from 'lucide-react';

const colorStyles = {
  indigo: {
    circle: 'bg-indigo-100 text-indigo-600',
  },
  green: {
    circle: 'bg-green-100 text-green-600',
  },
  red: {
    circle: 'bg-red-100 text-red-600',
  },
  orange: {
    circle: 'bg-orange-100 text-orange-600',
  },
};

function formatCurrency(value) {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
  return `₹ ${formatted}`;
}

function StatCard({ title, value, icon: Icon, color = 'indigo', trend }) {
  const styles = colorStyles[color] || colorStyles.indigo;
  const trendPositive = trend ? trend.value >= 0 : false;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-gray-500">{title}</p>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.circle}`}
        >
          <Icon size={20} strokeWidth={2} aria-hidden />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-gray-800">
        {formatCurrency(value)}
      </p>

      {trend && (
        <div
          className={`mt-3 flex items-center gap-1 text-sm ${
            trendPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trendPositive ? (
            <ArrowUp size={16} aria-hidden />
          ) : (
            <ArrowDown size={16} aria-hidden />
          )}
          <span>
            {trendPositive ? '+' : ''}
            {trend.value}% {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
