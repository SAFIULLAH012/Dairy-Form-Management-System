import React from 'react';
import {
  LayoutDashboard,
  Milk,
  Truck,
  Users,
  Wheat,
  Package,
  Stethoscope,
  Syringe,
  GitBranch,
  Bell,
  UserCheck,
  Receipt,
  BarChart3,
  Settings,
  CircleDollarSign,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'animals'
  | 'male'
  | 'milk'
  | 'deliveries'
  | 'customers'
  | 'feed'
  | 'inventory'
  | 'health'
  | 'vaccination'
  | 'breeding'
  | 'tasks'
  | 'workers'
  | 'expenses'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingCount,
}) => {
  const sections = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tasks', label: 'Tasks & Reminders', icon: Bell, badge: pendingCount },
      ],
    },
    {
      group: 'Herd Management',
      items: [
        { id: 'animals', label: 'Female Herd', icon: ChevronRight },
        { id: 'male', label: 'Male Animals', icon: ChevronRight },
        { id: 'breeding', label: 'Breeding & Calves', icon: GitBranch },
        { id: 'health', label: 'Health & Vet', icon: Stethoscope },
        { id: 'vaccination', label: 'Vaccination Schedule', icon: Syringe },
      ],
    },
    {
      group: 'Daily Operations',
      items: [
        { id: 'milk', label: 'Milk Production', icon: Milk },
        { id: 'feed', label: 'Daily Feed (Maund/KG)', icon: Wheat },
        { id: 'inventory', label: 'Inventory & Stock', icon: Package },
      ],
    },
    {
      group: 'Sales & Finance',
      items: [
        { id: 'deliveries', label: 'Milk Sales & Invoices', icon: Truck },
        { id: 'customers', label: 'Customers & Receivables', icon: Users },
        { id: 'expenses', label: 'Expenses & Cash Out', icon: Receipt },
        { id: 'workers', label: 'Workers & Advances', icon: UserCheck },
        { id: 'reports', label: 'Financial & Herd Reports', icon: BarChart3 },
      ],
    },
    {
      group: 'System',
      items: [
        { id: 'settings', label: 'Settings, Health & Backup', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#103b2a] text-white flex flex-col transition-transform duration-200 ease-in-out border-r border-[#164c36] shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-[#1b583f] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🐄</span>
              <span className="font-extrabold text-base tracking-wide text-white">
                Dairy Farm ERP
              </span>
            </div>
            <div className="text-[11px] font-medium text-emerald-300/80 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Offline-First Local System
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-medium">
          {sections.map(sec => (
            <div key={sec.group}>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300/60">
                {sec.group}
              </div>
              <div className="mt-1 space-y-0.5">
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id as NavItem);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#164c36] text-white font-semibold shadow-inner'
                          : 'text-stone-300 hover:bg-[#134430] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0 text-emerald-300/80" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-stone-900 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#1b583f] bg-[#0c2f21] text-[11px] text-stone-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SQLite Local DB</span>
          </div>
          <span className="text-[10px] text-emerald-300/70 font-mono">v1.0 Ready</span>
        </div>
      </aside>
    </>
  );
};
