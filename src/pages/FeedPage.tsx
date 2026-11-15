import React, { useEffect, useState } from 'react';
import { api } from '../api/api.ts';
import { Modal } from '../components/Modal.tsx';
import { Wheat, Plus, Calculator, Users, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { maundToKg, calculateFeedCost } from '../domain/calculations.ts';

interface FeedPageProps {
  autoOpenNonce?: number;
}

export const FeedPage: React.FC<FeedPageProps> = ({ autoOpenNonce }) => {
  const [feedLogs, setFeedLogs] = useState<any[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [cowCountInGroup, setCowCountInGroup] = useState<number>(0);

  // Form state
  const [feedForm, setFeedForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    group: 'High',
    feedType: '',
    maund: '',
    pricePerKg: '',
    supplier: '',
    notes: '',
  });

  // The matched inventory item (for stock warning)
  const [matchedInventoryItem, setMatchedInventoryItem] = useState<any>(null);

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
    } catch (err) {
      console.error('Error loading feed data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCowCount = async (group: string) => {
    try {
      const cows = await api.getAnimals({ status: 'Active', group });
      setCowCountInGroup(cows.length);
    } catch {
      setCowCountInGroup(0);
    }
  };

  useEffect(() => { loadData(); }, [groupFilter]);

  useEffect(() => {
    if (autoOpenNonce) {
      setShowAddModal(true);
    }
  }, [autoOpenNonce]);

  useEffect(() => {
    if (showAddModal && feedForm.group) {
      loadCowCount(feedForm.group);
    }
  }, [showAddModal, feedForm.group]);

  // Auto-match inventory item and fill price when feedType changes
  useEffect(() => {
    if (!feedForm.feedType) { setMatchedInventoryItem(null); return; }
    const found = inventoryItems.find(
      i => i.name.toLowerCase() === feedForm.feedType.toLowerCase()
    );
    setMatchedInventoryItem(found || null);
    // Auto-fill price from inventory item's last unit cost
    if (found && found.unitCost && !feedForm.pricePerKg) {
      setFeedForm(prev => ({ ...prev, pricePerKg: String(found.unitCost) }));
    }
  }, [feedForm.feedType, inventoryItems]);

  // Live calculations
  const calculatedKg    = feedForm.maund    ? maundToKg(parseFloat(feedForm.maund))     : 0;
  const priceNum        = feedForm.pricePerKg ? parseFloat(feedForm.pricePerKg)          : 0;
  const calculatedCost  = calculateFeedCost(calculatedKg, priceNum);
  const perCowMaund     = cowCountInGroup > 0 && feedForm.maund ? parseFloat(feedForm.maund) / cowCountInGroup : 0;
  const perCowKg        = perCowMaund * 40;
  const perCowCost      = perCowKg * priceNum;

  const handleSaveFeed = async () => {
    if (!feedForm.feedType.trim()) { alert('Please select or enter a Feed Type.'); return; }
    const today = new Date().toISOString().slice(0, 10);
    if (feedForm.date > today) { alert('Feed date cannot be in the future.'); return; }
    const maundNum = parseFloat(feedForm.maund);
    if (isNaN(maundNum) || maundNum <= 0) { alert('Please enter a valid positive quantity in Maund.'); return; }
    const priceNum = parseFloat(feedForm.pricePerKg || '0');
    if (isNaN(priceNum) || priceNum < 0) { alert('Price per KG must be 0 or greater.'); return; }
    try {
      await api.recordFeed({
        date: feedForm.date,
        group: feedForm.group,
        feedType: feedForm.feedType,
        maund: maundNum,
        pricePerKg: priceNum,
        supplier: feedForm.supplier,
        notes: feedForm.notes,
      });
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording feed');
    }
  };

  // Group logs by date for daily totals
  const logsByDate: Record<string, any[]> = {};
  feedLogs.forEach(log => {
    if (!logsByDate[log.date]) logsByDate[log.date] = [];
    logsByDate[log.date].push(log);
  });
  const sortedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-600 font-medium">Filter by Group:</label>
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          >
            <option value="">All Groups</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <button
          onClick={() => {
            const firstItem = inventoryItems[0];
            setFeedForm({
              date: new Date().toISOString().slice(0, 10),
              group: groups[0] || 'High',
              feedType: firstItem?.name || '',
              maund: '',
              pricePerKg: firstItem?.unitCost ? String(firstItem.unitCost) : '',
              supplier: '',
              notes: '',
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Feed</span>
        </button>
      </div>

      {/* Info bar */}
      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-700 shrink-0" />
          <span><b>1 Maund = 40 KG.</b> Feed entry automatically deducts from inventory stock if a matching item name exists.</span>
        </div>
        <span className="font-extrabold text-emerald-800 shrink-0 ml-2">{feedLogs.length} Records</span>
      </div>

      {/* Feed Log — grouped by date */}
      {loading ? (
        <div className="p-8 text-center text-stone-400 text-xs">Loading feed records...</div>
      ) : sortedDates.length === 0 ? (
        <div className="p-8 text-center text-stone-400 text-xs bg-white rounded-xl border border-stone-200">
          No feed consumption recorded yet.
        </div>
      ) : (
        sortedDates.map(date => {
          const dayLogs = logsByDate[date];
          const dayTotalMaund = dayLogs.reduce((s, l) => s + (l.maund || 0), 0);
          const dayTotalCost  = dayLogs.reduce((s, l) => s + (l.totalCost || 0), 0);
          const dayTotalKg    = dayLogs.reduce((s, l) => s + (l.kg || 0), 0);

          return (
            <div key={date} className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              {/* Day header row */}
              <div className="flex items-center justify-between px-4 py-2 bg-stone-50 border-b border-stone-200">
                <span className="text-xs font-extrabold text-stone-800">{date}</span>
                <div className="flex items-center gap-4 text-xs text-stone-600 font-semibold">
                  <span>{dayLogs.length} entr{dayLogs.length > 1 ? 'ies' : 'y'}</span>
                  <span className="font-mono text-stone-800">{dayTotalMaund.toFixed(2)} Maund ({dayTotalKg.toFixed(1)} KG)</span>
                  <span className="font-bold text-emerald-800">Total: Rs. {dayTotalCost.toLocaleString()}</span>
                </div>
              </div>

              {/* Entries for this day */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50/50 text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-100">
                    <tr>
                      <th className="px-4 py-2">Group</th>
                      <th className="px-4 py-2">Feed Type</th>
                      <th className="px-4 py-2">Quantity</th>
                      <th className="px-4 py-2">KG</th>
                      <th className="px-4 py-2">Price/KG</th>
                      <th className="px-4 py-2">Cost</th>
                      <th className="px-4 py-2">Per Cow</th>
                      <th className="px-4 py-2">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {dayLogs.map(log => (
                      <tr key={log.id} className="hover:bg-stone-50/60">
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {log.group}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-bold text-stone-800">{log.feedType}</td>
                        <td className="px-4 py-2 font-mono font-bold text-stone-900">{log.maund} M</td>
                        <td className="px-4 py-2 font-mono text-stone-600">{log.kg} KG</td>
                        <td className="px-4 py-2 font-mono text-stone-500">Rs. {log.pricePerKg}</td>
                        <td className="px-4 py-2 font-bold text-stone-900">Rs. {log.totalCost?.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          {log.cowCount && log.cowCount > 0 ? (
                            <div>
                              <div className="font-bold text-emerald-800">Rs. {((log.totalCost || 0) / log.cowCount).toFixed(0)}</div>
                              <div className="text-[10px] text-stone-400">{(log.maund / log.cowCount).toFixed(2)} M ({log.cowCount} cows)</div>
                            </div>
                          ) : <span className="text-stone-400">-</span>}
                        </td>
                        <td className="px-4 py-2 text-stone-500">{log.supplier || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      {/* Add Feed Modal */}
      <Modal
        title="Record Feed Consumption"
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        footer={
          <>
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer">Cancel</button>
            <button onClick={handleSaveFeed} className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer">Save Feed Record</button>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">

          {/* Date + Group */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Date *</label>
              <input type="date" value={feedForm.date}
                onChange={e => setFeedForm({ ...feedForm, date: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Cow Group *</label>
              <select value={feedForm.group}
                onChange={e => setFeedForm({ ...feedForm, group: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white">
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                <Users className="w-3 h-3" />
                {cowCountInGroup > 0
                  ? `${cowCountInGroup} active cows in "${feedForm.group}" group`
                  : `No active cows in "${feedForm.group}" group`}
              </div>
            </div>
          </div>

          {/* Feed Type — dropdown from inventory + manual option */}
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Feed Type *</label>
            {inventoryItems.length > 0 ? (
              <select
                value={feedForm.feedType}
                onChange={e => {
                  const selected = inventoryItems.find(i => i.name === e.target.value);
                  setFeedForm(prev => ({
                    ...prev,
                    feedType: e.target.value,
                    pricePerKg: selected?.unitCost ? String(selected.unitCost) : prev.pricePerKg,
                  }));
                }}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
              >
                <option value="">-- Select Feed Type --</option>
                {inventoryItems.map(i => (
                  <option key={i.id} value={i.name}>
                    {i.name} (Stock: {i.currentStock} {i.unit})
                  </option>
                ))}
                <option value="__manual__">+ Enter Manually</option>
              </select>
            ) : (
              <input type="text" placeholder="e.g. Silage, Wanda, Green Fodder"
                value={feedForm.feedType}
                onChange={e => setFeedForm({ ...feedForm, feedType: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg" />
            )}
            {feedForm.feedType === '__manual__' && (
              <input type="text" placeholder="Type feed name manually..."
                onChange={e => setFeedForm({ ...feedForm, feedType: e.target.value })}
                className="mt-1.5 w-full px-3 py-1.5 border border-stone-300 rounded-lg" autoFocus />
            )}

            {/* Inventory match status */}
            {feedForm.feedType && feedForm.feedType !== '__manual__' && (
              matchedInventoryItem ? (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700">
                  <CheckCircle className="w-3 h-3" />
                  <span>Stock found: <b>{matchedInventoryItem.currentStock} {matchedInventoryItem.unit}</b> available. Will auto-deduct on save.</span>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>No matching inventory item. Stock will NOT be deducted. Add this feed in Inventory first.</span>
                </div>
              )
            )}
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Total Quantity (Maund) *</label>
              <input type="number" step="0.1" min="0" placeholder="e.g. 15"
                value={feedForm.maund}
                onChange={e => setFeedForm({ ...feedForm, maund: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-lg focus:border-emerald-600" />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Price per KG (Rs.)
                {matchedInventoryItem?.unitCost && (
                  <span className="ml-1 text-[10px] font-normal text-emerald-600">← auto from inventory</span>
                )}
              </label>
              <input type="number" step="0.01" min="0" placeholder="e.g. 18.5"
                value={feedForm.pricePerKg}
                onChange={e => setFeedForm({ ...feedForm, pricePerKg: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-lg focus:border-emerald-600" />
            </div>
          </div>

          {/* Live Calculation */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-emerald-800 font-semibold block">Total Feed (Group)</span>
                <span className="text-base font-extrabold text-emerald-950">
                  {feedForm.maund || 0} Maund = {calculatedKg.toFixed(1)} KG
                </span>
              </div>
              <div className="text-right">
                <span className="text-emerald-800 font-semibold block">Total Cost</span>
                <span className="text-base font-extrabold text-emerald-950">
                  Rs. {calculatedCost.toLocaleString()}
                </span>
              </div>
            </div>

            {cowCountInGroup > 0 && feedForm.maund && parseFloat(feedForm.maund) > 0 && (
              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between bg-emerald-100/60 rounded-lg px-2 py-1.5">
                <div>
                  <span className="text-emerald-900 font-bold block text-[11px] uppercase tracking-wide">Per Cow / Day</span>
                  <span className="text-sm font-extrabold text-emerald-950">{perCowMaund.toFixed(2)} Maund</span>
                  <span className="text-[10px] text-emerald-700 ml-1">({perCowKg.toFixed(1)} KG)</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-900 font-bold block text-[11px] uppercase tracking-wide">Cost Per Cow</span>
                  <span className="text-sm font-extrabold text-emerald-950">Rs. {perCowCost.toFixed(0)}</span>
                </div>
              </div>
            )}

            {/* Stock availability warning */}
            {matchedInventoryItem && calculatedKg > matchedInventoryItem.currentStock && (
              <div className="flex items-center gap-1 text-[10px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>
                  Warning: You are consuming <b>{calculatedKg.toFixed(1)} KG</b> but only <b>{matchedInventoryItem.currentStock} {matchedInventoryItem.unit}</b> in stock!
                </span>
              </div>
            )}
          </div>

          {/* Supplier + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Supplier / Batch</label>
              <input type="text" placeholder="e.g. Agri Store"
                value={feedForm.supplier}
                onChange={e => setFeedForm({ ...feedForm, supplier: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Notes</label>
              <input type="text" value={feedForm.notes}
                onChange={e => setFeedForm({ ...feedForm, notes: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
