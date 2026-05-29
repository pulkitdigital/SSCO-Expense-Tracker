import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Table2,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/add', label: 'Add Expense', icon: PlusCircle },
  { to: '/all', label: 'All Expenses', icon: Table2 },
  { to: '/profile', label: 'Profile', icon: Settings },
];

function Sidebar() {
  const { isOnline } = useApp();

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-full w-[240px] flex-col bg-[#1a1a2e] shadow-lg">
      <div className="border-b border-white/10 px-5 py-6">
        <h1 className="text-2xl font-bold text-white">SSCO</h1>
        <p className="mt-1 text-xs text-gray-400">Expense Tracker</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-[#6366f1]'
                  : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
            aria-hidden
          />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
