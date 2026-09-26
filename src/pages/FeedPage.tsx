import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { Wheat, Plus, Calendar, Layers, Calculator } from 'lucide-react';
import { maundToKg, calculateFeedCost } from '../domain/calculations.ts';

export const FeedPage: React.FC = () => {
  const [feedLogs, setFeedLogs] = useState<any[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [feedForm, setFeedForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    group: 'High',
    feedType: 'Silage',
    maund: '',
    pricePerKg: '18.5',
    supplier: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [txs, grps, items] = await Promise.all([
        api.getFeedTransactions(undefined, undefined, groupFilter || undefined),
        api.getGroups(),
        api.getInventoryItems(),
      ]);
      setFeedLogs(txs);
      setGroups(grps);
      setInventoryItems(items.filter((i: any) => i.category === 'FEED'));
      if (grps.length > 0 && !feedForm.group) {
        setFeedForm(prev => ({ ...prev, group: grps[0] }));
      }
    } catch (err) {
      console.error('Error loading feed data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [groupFilter]);

  const calculatedKg = feedForm.maund ? maundToKg(parseFloat(feedForm.maund)) : 0;
  const calculatedCost = calculateFeedCost(
    calculatedKg,
    feedForm.pricePerKg ? parseFloat(feedForm.pricePerKg) : 0
  );

  const handleSaveFeed = async () => {
    if (!feedForm.maund || parseFloat(feedForm.maund) <= 0) {
      alert('Please enter a valid feed quantity in Maund.');
      return;
    }

    try {
      await api.recordFeed({
        date: feedForm.date,
        group: feedForm.group,
        feedType: feedForm.feedType,
        maund: parseFloat(feedForm.maund),
        pricePerKg: parseFloat(feedForm.pricePerKg || '0'),
        supplier: feedForm.supplier,
        notes: feedForm.notes,
      });

      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording feed');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-600 font-medium">Filter by Group:</label>
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          >
            <option value="">All Groups</option>
            {groups.map(g => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setFeedForm({
              date: new Date().toISOString().slice(0, 10),
              group: groups[0] || 'High',
              feedType: inventoryItems[0]?.name || 'Silage',
              maund: '',
              pricePerKg: '18.5',
              supplier: '',
              notes: '',
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Daily Feed</span>
        </button>
      </div>

      {/* Info notice: 1 Maund = 40 KG */}
      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <b>Standard Conversion:</b> 1 Maund = 40 KG exactly. Feed is assigned to user-selected
            groups with historical price locking.
          </span>
        </div>
        <span className="font-extrabold text-emerald-800 shrink-0 ml-2">
          {feedLogs.length} Records
        </span>
      </div>

      {/* Feed Log Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Group</th>
                <th className="p-3">Feed Type</th>
                <th className="p-3">Quantity (Maund)</th>
                <th className="p-3">Normalized (KG)</th>
                <th className="p-3">Price / KG</th>
                <th className="p-3">Total Cost</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {feedLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400">
                    No feed consumption recorded yet.
                  </td>
                </tr>
              ) : (
                feedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50/70">
                    <td className="p-3 font-semibold text-stone-900">{log.date}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {log.group}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-stone-800">{log.feedType}</td>
                    <td className="p-3 font-mono font-bold text-stone-900">{log.maund} M</td>
                    <td className="p-3 font-mono text-stone-600 font-medium">{log.kg} KG</td>
                    <td className="p-3 font-mono text-stone-600">Rs. {log.pricePerKg}</td>
                    <td className="p-3 font-bold text-stone-900">
                      Rs. {log.totalCost?.toLocaleString()}
                    </td>
                    <td className="p-3 text-stone-500">{log.supplier || '-'}</td>
                    <td className="p-3 text-stone-500 truncate max-w-xs">{log.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Feed Modal */}
      <Modal
        title="Record Daily Feed Consumption"
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
              onClick={handleSaveFeed}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Feed Record
            </button>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Date *</label>
              <input
                type="date"
                value={feedForm.date}
                onChange={e => setFeedForm({ ...feedForm, date: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Cow Group *</label>
              <select
                value={feedForm.group}
                onChange={e => setFeedForm({ ...feedForm, group: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
              >
                {groups.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Feed Type *</label>
            <input
              type="text"
              placeholder="e.g. Silage, Wanda, Green Fodder"
              value={feedForm.feedType}
              onChange={e => setFeedForm({ ...feedForm, feedType: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Quantity (Maund) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 5"
                value={feedForm.maund}
                onChange={e => setFeedForm({ ...feedForm, maund: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-lg focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Price per KG (Rs.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 18.5"
                value={feedForm.pricePerKg}
                onChange={e => setFeedForm({ ...feedForm, pricePerKg: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-lg focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Automatic Live Calculation Box */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-emerald-800 font-semibold block">Automatic Normalization</span>
              <span className="text-base font-extrabold text-emerald-950">
                {calculatedKg.toFixed(1)} KG
              </span>
              <span className="text-[10px] text-emerald-700 ml-1">
                ({feedForm.maund || 0} Maund × 40 KG)
              </span>
            </div>
            <div className="text-right">
              <span className="text-emerald-800 font-semibold block">Total Cost</span>
              <span className="text-base font-extrabold text-emerald-950">
                Rs. {calculatedCost.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Supplier / Batch</label>
            <input
              type="text"
              placeholder="e.g. Agri Store, Self Harvest"
              value={feedForm.supplier}
              onChange={e => setFeedForm({ ...feedForm, supplier: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={feedForm.notes}
              onChange={e => setFeedForm({ ...feedForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
