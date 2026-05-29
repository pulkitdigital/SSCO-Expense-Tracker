import { useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/add': 'Add Expense',
  '/all': 'All Expenses',
  '/profile': 'Profile',
};

function formatTodayDate() {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

function Navbar() {
  const { pathname } = useLocation();
  const { profile, triggerSync, syncing, isOnline } = useApp();

  const pageTitle = PAGE_TITLES[pathname] || 'SSCO Expense Tracker';

  const handleSync = () => {
    triggerSync().catch(() => {});
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || !isOnline}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Sync expenses"
          title="Sync to cloud"
        >
          <RefreshCw
            size={18}
            className={syncing ? 'animate-spin' : ''}
            aria-hidden
          />
        </button>

        <span className="text-sm text-slate-600">{formatTodayDate()}</span>

        <span
          className="max-w-[150px] truncate text-sm font-bold text-slate-800"
          title={profile.companyName}
        >
          {profile.companyName || 'SSCO'}
        </span>
      </div>
    </header>
  );
}

export default Navbar;
