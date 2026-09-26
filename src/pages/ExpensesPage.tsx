import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { Receipt, Plus, Calendar, DollarSign } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = [
    'Feed',
    'Medicine',
    'Labour',
    'Electricity',
    'Transport',
    'Repairs',
    'Animal Purchase',
    'Maintenance',
    'Other',
  ];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Electricity' as any,
    amount: '',
    vendor: '',
    paymentMethod: 'Cash' as any,
    reference: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await api.getExpenses(undefined, undefined, categoryFilter || undefined);
      setExpenses(list);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const handleSaveExpense = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Valid expense amount is required.');
      return;
    }

    try {
      await api.recordExpense({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording expense');
    }
  };

  const totalExpenseSum = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-600 font-medium">Category Filter:</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setFormData({
              date: new Date().toISOString().slice(0, 10),
              category: 'Electricity',
              amount: '',
              vendor: '',
              paymentMethod: 'Cash',
              reference: '',
              notes: '',
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Farm Expense</span>
        </button>
      </div>

      {/* Info banner */}
      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 flex items-center justify-between">
        <span>🧾 Complete history of feed, medicine, labour, utilities, and repairs.</span>
        <span className="font-extrabold text-stone-900 text-sm">
          Total: Rs. {totalExpenseSum.toLocaleString()}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Vendor / Payee</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3">Reference #</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="hover:bg-stone-50/70">
                    <td className="p-3 font-semibold text-stone-900">{e.date}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-3 font-black text-rose-700 font-mono text-sm">
                      Rs. {e.amount.toLocaleString()}
                    </td>
                    <td className="p-3 font-medium text-stone-800">{e.vendor || '-'}</td>
                    <td className="p-3 text-stone-600">{e.paymentMethod}</td>
                    <td className="p-3 font-mono text-stone-500">{e.reference || '-'}</td>
                    <td className="p-3 text-stone-500 truncate max-w-xs">{e.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        title="Record Farm Expense"
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
              onClick={handleSaveExpense}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Expense
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white font-bold"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">Expense Amount (Rs.) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 15000"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 text-base font-bold border border-stone-300 rounded-lg focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Vendor / Payee</label>
              <input
                type="text"
                placeholder="e.g. WAPDA, Shell Diesel, Workshop"
                value={formData.vendor}
                onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Bill / Receipt #</label>
            <input
              type="text"
              placeholder="e.g. BILL-9921"
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
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
