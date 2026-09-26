import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { NavItem } from '../components/Sidebar.tsx';
import { Bell, Plus, CheckCircle, Trash2, ArrowRight, AlertTriangle, Clock } from 'lucide-react';

interface RemindersPageProps {
  onNavigateToModule: (module: NavItem) => void;
}

export const RemindersPage: React.FC<RemindersPageProps> = ({ onNavigateToModule }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    sourceModule: 'milk' as any,
    dueDate: new Date().toISOString().slice(0, 10),
    dueTime: '09:00',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await api.getTasks(statusFilter || undefined);
      setTasks(list);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSaveTask = async () => {
    if (!formData.title.trim()) {
      alert('Task title is required.');
      return;
    }

    try {
      await api.createTask({
        ...formData,
      });

      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating task');
    }
  };

  const handleCompleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.completeTask(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error completing task');
    }
  };

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteTask(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting task');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-600 font-medium">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          >
            <option value="">All Pending & Due</option>
            <option value="Overdue">Overdue</option>
            <option value="Due">Due Today</option>
            <option value="Scheduled">Scheduled (Future)</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              sourceModule: 'milk',
              dueDate: new Date().toISOString().slice(0, 10),
              dueTime: '09:00',
              notes: '',
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Reminder</span>
        </button>
      </div>

      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
        🔔 <b>Automated Task Engine:</b> Reminders persist until marked complete or cleared by their
        respective actions. Clicking on any reminder immediately takes you to the relevant screen.
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Due Date & Time</th>
                <th className="p-3">Reminder / Task</th>
                <th className="p-3">Module</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400">
                    No active tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => onNavigateToModule(t.sourceModule as NavItem)}
                    className="hover:bg-stone-50/70 transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-medium text-stone-600">
                      {t.dueDate} <span className="text-[10px] text-stone-400 font-mono">({t.dueTime})</span>
                    </td>
                    <td className="p-3 font-bold text-stone-900">{t.title}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 uppercase">
                        {t.sourceModule}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : t.status === 'Due'
                            ? 'bg-amber-100 text-amber-800'
                            : t.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {t.status !== 'Completed' && (
                          <button
                            onClick={e => handleCompleteTask(t.id, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded cursor-pointer"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </button>
                        )}
                        <button
                          onClick={e => handleDeleteTask(t.id, e)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete Reminder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal
        title="Create New Farm Reminder"
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTask}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Reminder
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Reminder Title *</label>
            <input
              type="text"
              placeholder="e.g. Order Wanda feed, Check milk chiller temp, Re-test cow C-002"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Target Screen to Open</label>
            <select
              value={formData.sourceModule}
              onChange={e => setFormData({ ...formData, sourceModule: e.target.value as any })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
            >
              <option value="milk">Milk Production</option>
              <option value="feed">Daily Feed</option>
              <option value="inventory">Inventory & Stock</option>
              <option value="health">Health & Vet</option>
              <option value="vaccination">Vaccination Schedule</option>
              <option value="breeding">Breeding & Cycles</option>
              <option value="deliveries">Milk Sales & Invoices</option>
              <option value="workers">Workers & Advances</option>
              <option value="expenses">Expenses</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Due Time</label>
              <input
                type="time"
                value={formData.dueTime}
                onChange={e => setFormData({ ...formData, dueTime: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
