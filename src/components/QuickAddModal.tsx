import React from 'react';
import { Modal } from './Modal.tsx';
import { NavItem } from './Sidebar.tsx';
import {
  ChevronRight,
  Milk,
  Wheat,
  Stethoscope,
  Truck,
  Receipt,
  Bell,
  Syringe,
  GitBranch,
  Users,
  Package,
  UserCheck,
} from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavItem) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const actions = [
    { label: '🐄 Female Animal', tab: 'animals' as NavItem, icon: ChevronRight, desc: 'Register dairy cow / heifer' },
    { label: '🐂 Male Animal', tab: 'male' as NavItem, icon: ChevronRight, desc: 'Register bull / male calf' },
    { label: '🥛 Daily Milk Record', tab: 'milk' as NavItem, icon: Milk, desc: 'Log morning / evening yield' },
    { label: '🌾 Feed Consumption', tab: 'feed' as NavItem, icon: Wheat, desc: 'Distribute silage / concentrate' },
    { label: '📦 Stock Movement', tab: 'inventory' as NavItem, icon: Package, desc: 'Stock in / out / wastage' },
    { label: '💉 Veterinary Case', tab: 'health' as NavItem, icon: Stethoscope, desc: 'Clinical diagnosis & treatment' },
    { label: '🛡️ Vaccination / Deworming', tab: 'vaccination' as NavItem, icon: Syringe, desc: 'Immunization schedule' },
    { label: '🔄 Breeding / Insemination', tab: 'breeding' as NavItem, icon: GitBranch, desc: 'AI service or calving' },
    { label: '🚚 Milk Sale Invoice', tab: 'deliveries' as NavItem, icon: Truck, desc: 'Issue delivery receipt' },
    { label: '👥 New Milk Customer', tab: 'customers' as NavItem, icon: Users, desc: 'Commercial dairy buyer' },
    { label: '🧾 Farm Expense', tab: 'expenses' as NavItem, icon: Receipt, desc: 'Operational outlay' },
    { label: '👷 Farm Worker', tab: 'workers' as NavItem, icon: UserCheck, desc: 'Employee / salary staff' },
    { label: '🔔 Reminder / Task', tab: 'tasks' as NavItem, icon: Bell, desc: 'Action item & follow-up' },
  ];

  return (
    <Modal title="⚡ Quick Add Action" isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.tab}
              onClick={() => {
                onNavigate(action.tab);
                onClose();
              }}
              className="p-3 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 border border-stone-200 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="font-bold text-stone-800 group-hover:text-emerald-900">{action.label}</div>
                <div className="text-[11px] text-stone-500">{action.desc}</div>
              </div>
              <Icon className="w-4 h-4 text-emerald-700 shrink-0 group-hover:scale-110 transition-transform" />
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
