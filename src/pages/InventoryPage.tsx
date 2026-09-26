import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { Package, Plus, ArrowDownRight, ArrowUpRight, History, AlertTriangle } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = useState<any | null>(null);
  const [historyRows, setHistoryRows] = useState<any[]>([]);

  // Movement Form
  const [txForm, setTxForm] = useState({
    itemId: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'STOCK_IN' as 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'WASTAGE',
    quantity: '',
    unitCost: '',
    reference: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getInventoryItems();
      setItems(data);
      if (data.length > 0 && !txForm.itemId) {
        setTxForm(prev => ({ ...prev, itemId: data[0].id }));
      }
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveMovement = async () => {
    if (!txForm.quantity || parseFloat(txForm.quantity) <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    try {
      await api.recordStockMovement({
        itemId: txForm.itemId,
        date: txForm.date,
        type: txForm.type,
        quantity: parseFloat(txForm.quantity),
        unitCost: txForm.unitCost ? parseFloat(txForm.unitCost) : undefined,
        reference: txForm.reference,
        notes: txForm.notes,
      });

      setShowTransactionModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording inventory movement');
    }
  };

  const handleViewHistory = async (item: any) => {
    setSelectedItemHistory(item);
    try {
      const rows = await api.getInventoryTransactions(item.id);
      setHistoryRows(rows);
    } catch (err) {
      console.error(err);
      setHistoryRows([]);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <Package className="w-4 h-4 text-emerald-700" />
          <span>Farm Supplies & Feed Stock</span>
        </div>

        <button
          onClick={() => {
            setTxForm({
              itemId: items[0]?.id || '',
              date: new Date().toISOString().slice(0, 10),
              type: 'STOCK_IN',
              quantity: '',
              unitCost: '',
              reference: '',
              notes: '',
            });
            setShowTransactionModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Movement</span>
        </button>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Item Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3">Est. Days Left</th>
                <th className="p-3">Threshold Alert</th>
                <th className="p-3 text-right">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    No inventory items defined yet.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-stone-50/70">
                    <td className="p-3 font-bold text-stone-900">{item.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-stone-900 text-sm">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="p-3 font-medium text-stone-600">
                      {item.daysRemaining != null ? `~${item.daysRemaining} days` : '—'}
                    </td>
                    <td className="p-3">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ADEQUATE
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleViewHistory(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Audit Log</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Movement Modal */}
      <Modal
        title="Record Stock Movement"
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowTransactionModal(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMovement}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Movement
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Item *</label>
            <select
              value={txForm.itemId}
              onChange={e => setTxForm({ ...txForm, itemId: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
            >
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.currentStock} {item.unit} in stock)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Date *</label>
              <input
                type="date"
                value={txForm.date}
                onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Movement Type *</label>
              <select
                value={txForm.type}
                onChange={e => setTxForm({ ...txForm, type: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
              >
                <option value="STOCK_IN">Stock In (Purchase)</option>
                <option value="STOCK_OUT">Stock Out (Consumption)</option>
                <option value="ADJUSTMENT">Adjustment (Count check)</option>
                <option value="WASTAGE">Wastage / Spoilage</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 50"
                value={txForm.quantity}
                onChange={e => setTxForm({ ...txForm, quantity: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Unit Cost (Rs.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={txForm.unitCost}
                onChange={e => setTxForm({ ...txForm, unitCost: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">
              Reference / Invoice Number
            </label>
            <input
              type="text"
              placeholder="e.g. BILL-4412"
              value={txForm.reference}
              onChange={e => setTxForm({ ...txForm, reference: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={txForm.notes}
              onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Item History Modal */}
      <Modal
        title={`Movement History: ${selectedItemHistory?.name || ''}`}
        isOpen={Boolean(selectedItemHistory)}
        onClose={() => setSelectedItemHistory(null)}
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span>
              Current Stock:{' '}
              <b className="text-stone-900 text-sm">
                {selectedItemHistory?.currentStock} {selectedItemHistory?.unit}
              </b>
            </span>
            <span className="text-stone-500">
              Min Threshold: {selectedItemHistory?.minStockThreshold} {selectedItemHistory?.unit}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-stone-50 text-stone-500 sticky top-0">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Unit Cost</th>
                  <th className="p-2">Total Value</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {historyRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-stone-400">
                      No stock transactions recorded.
                    </td>
                  </tr>
                ) : (
                  historyRows.map(row => (
                    <tr key={row.id}>
                      <td className="p-2 font-medium">{row.date}</td>
                      <td className="p-2">
                        <span
                          className={`font-bold ${
                            row.signedQuantity > 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="p-2 font-mono font-bold">
                        {row.signedQuantity > 0 ? `+${row.quantity}` : `-${row.quantity}`} {row.unit}
                      </td>
                      <td className="p-2">Rs. {row.unitCost}</td>
                      <td className="p-2 font-semibold">Rs. {row.totalValue?.toLocaleString()}</td>
                      <td className="p-2 text-stone-500">{row.notes || row.reference || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
