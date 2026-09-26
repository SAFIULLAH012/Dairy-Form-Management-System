import React from 'react';
import { Menu, Bell, Plus, ShieldCheck } from 'lucide-react';
import { NavItem } from './Sidebar.tsx';

interface HeaderProps {
  title: string;
  onOpenMobileMenu: () => void;
  onOpenTasks: () => void;
  onQuickAdd: () => void;
  pendingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenMobileMenu,
  onOpenTasks,
  onQuickAdd,
  pendingCount,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenTasks}
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4 text-stone-600" />
          <span>Pending</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              pendingCount > 0
                ? 'bg-amber-500 text-stone-900'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={onQuickAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Add</span>
        </button>
      </div>
    </header>
  );
};
