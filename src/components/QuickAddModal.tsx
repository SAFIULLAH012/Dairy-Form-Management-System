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
} from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavItem) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const actions = [
    { label: '🐄 Female Animal', tab: 'animals' as NavItem, icon: ChevronRight },
    { label: '🐂 Male Animal', tab: 'male' as NavItem, icon: ChevronRight },
    { label: '🥛 Daily Milk Record', tab: 'milk' as NavItem, icon: Milk },
    { label: '🌾 Feed Consumption', tab: 'feed' as NavItem, icon: Wheat },
    { label: '💉 Veterinary Case', tab: 'health' as NavItem, icon: Stethoscope },
    { label: '🛡️ Vaccination / Deworming', tab: 'vaccination' as NavItem, icon: Syringe },
    { label: '🔄 Breeding / Calving', tab: 'breeding' as NavItem, icon: GitBranch },
    { label: '🚚 Milk Sale Invoice', tab: 'deliveries' as NavItem, icon: Truck },
    { label: '🧾 Farm Expense', tab: 'expenses' as NavItem, icon: Receipt },
    { label: '🔔 Reminder / Task', tab: 'tasks' as NavItem, icon: Bell },
  ];

  return (
    <Modal title="⚡ Quick Add Action" isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="grid grid-cols-2 gap-2 text-xs">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.tab}
              onClick={() => {
                onNavigate(action.tab);
                onClose();
              }}
              className="p-3 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 border border-stone-200 rounded-xl text-left font-bold text-stone-800 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>{action.label}</span>
              <Icon className="w-4 h-4 text-emerald-700 shrink-0" />
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
