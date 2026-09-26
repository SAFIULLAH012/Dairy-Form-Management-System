import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { IndividualMilkModal } from './IndividualMilkModal.tsx';
import {
  Milk,
  Plus,
  Lock,
  Unlock,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const MilkPage: React.FC = () => {
  const [totalEntries, setTotalEntries] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  // Modals
  const [showTotalModal, setShowTotalModal] = useState(false);
  const [showIndividualModal, setShowIndividualModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<any | null>(null);
  const [detailRows, setDetailRows] = useState<any[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState<any | null>(null);
  const [unlockReason, setUnlockReason] = useState('');

  // Total Form
  const [totalForm, setTotalForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    shift: 'Morning',
    totalLitres: '',
    fatPercent: '',
    snfPercent: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [totals, shiftList] = await Promise.all([
        api.getMilkTotals(fromDate, toDate),
        api.getMilkShifts(),
      ]);
      setTotalEntries(totals);
      setShifts(shiftList);
      if (shiftList.length > 0 && !totalForm.shift) {
        setTotalForm(prev => ({ ...prev, shift: shiftList[0].name }));
      }
    } catch (err) {
      console.error('Error loading milk entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fromDate, toDate]);

  const handleSaveTotal = async () => {
    if (!totalForm.totalLitres || parseFloat(totalForm.totalLitres) <= 0) {
      alert('Total litres is required.');
      return;
    }

    try {
      await api.saveMilkTotal({
        date: totalForm.date,
        shift: totalForm.shift,
        totalLitres: parseFloat(totalForm.totalLitres),
        fatPercent: totalForm.fatPercent ? parseFloat(totalForm.fatPercent) : undefined,
        snfPercent: totalForm.snfPercent ? parseFloat(totalForm.snfPercent) : undefined,
        notes: totalForm.notes,
      });

      setShowTotalModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving milk total');
    }
  };

  const handleOpenDetails = async (entry: any) => {
    setShowDetailsModal(entry);
    try {
      const rows = await api.getMilkIndividual(entry.date, entry.shift);
      setDetailRows(rows);
    } catch (err) {
      console.error(err);
      setDetailRows([]);
    }
  };

  const handleUnlockShift = async () => {
    if (!showUnlockModal || !unlockReason.trim()) {
      alert('A valid reason is required to unlock this completed shift.');
      return;
    }

    try {
      await api.unlockMilkShift(showUnlockModal.date, showUnlockModal.shift, unlockReason);
      setShowUnlockModal(null);
      setUnlockReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error unlocking shift');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Range:</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          />
          <span className="text-stone-400 text-xs">to</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTotalModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-stone-600" />
            <span>Enter Total Milk</span>
          </button>

          <button
            onClick={() => setShowIndividualModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Individual Cow Grid</span>
          </button>
        </div>
      </div>

      {/* Mode explanation card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div
          onClick={() => setShowTotalModal(true)}
          className="p-3.5 bg-white border border-stone-200 rounded-xl shadow-xs hover:border-emerald-600 transition-colors cursor-pointer space-y-1"
        >
          <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
            <Milk className="w-4 h-4 text-emerald-700" />
            <span>🥛 Total Milk Entry (Quick Mode)</span>
          </div>
          <p className="text-[11px] text-stone-500">
            Record overall shift production, shift Fat % and SNF % in seconds, even if individual cow
            collection is not ready.
          </p>
        </div>

        <div
          onClick={() => setShowIndividualModal(true)}
          className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-xs hover:border-emerald-700 transition-colors cursor-pointer space-y-1"
        >
          <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>🐄 Individual Cow Milking (High & Low Groups)</span>
          </div>
          <p className="text-[11px] text-emerald-800/80">
            Interactive full-screen grid with color-coded cow tiles. Automatically calculates weighted
            Fat & SNF averages and registers sick cows into health cases.
          </p>
        </div>
      </div>

      {/* Production Records Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-700">
          <span>Shift Production Log</span>
          <span className="text-[11px] text-stone-500">{totalEntries.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Shift</th>
                <th className="p-3">Total Yield</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Fat %</th>
                <th className="p-3">SNF %</th>
                <th className="p-3">Status</th>
                <th className="p-3">Notes</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {totalEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400">
                    No milk records found for selected period.
                  </td>
                </tr>
              ) : (
                totalEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-stone-50/70">
                    <td className="p-3 font-semibold text-stone-900">{entry.date}</td>
                    <td className="p-3 font-medium text-stone-800">{entry.shift}</td>
                    <td className="p-3 font-extrabold text-emerald-800 text-sm">
                      {entry.totalLitres.toFixed(1)} L
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.mode === 'individual'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {entry.mode}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      {entry.fatPercent ? `${entry.fatPercent}%` : '-'}
                    </td>
                    <td className="p-3 font-mono">
                      {entry.snfPercent ? `${entry.snfPercent}%` : '-'}
                    </td>
                    <td className="p-3">
                      {entry.locked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3 text-stone-500" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Unlock className="w-3 h-3 text-amber-600" /> Editable
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-stone-500 truncate max-w-xs">{entry.notes || '-'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(entry)}
                          className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {entry.locked ? (
                          <button
                            onClick={() => {
                              setShowUnlockModal(entry);
                              setUnlockReason('');
                            }}
                            className="p-1 text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                            title="Unlock Shift for Authorized Correction"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Total Milk Modal */}
      <Modal
        title="Enter Shift Milk Total"
        isOpen={showTotalModal}
        onClose={() => setShowTotalModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowTotalModal(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTotal}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Milk Total
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
                value={totalForm.date}
                onChange={e => setTotalForm({ ...totalForm, date: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Shift *</label>
              <select
                value={totalForm.shift}
                onChange={e => setTotalForm({ ...totalForm, shift: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">Total Milk (Litres) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 450.5"
              value={totalForm.totalLitres}
              onChange={e => setTotalForm({ ...totalForm, totalLitres: e.target.value })}
              className="w-full px-3 py-2 text-base font-bold border border-stone-300 rounded-lg focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Fat % (Optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 4.20"
                value={totalForm.fatPercent}
                onChange={e => setTotalForm({ ...totalForm, fatPercent: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">SNF % (Optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 8.50"
                value={totalForm.snfPercent}
                onChange={e => setTotalForm({ ...totalForm, snfPercent: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Notes on milking temperature, batch, or weather..."
              value={totalForm.notes}
              onChange={e => setTotalForm({ ...totalForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={`Milk Shift Details: ${showDetailsModal?.date || ''} — ${showDetailsModal?.shift || ''}`}
        isOpen={Boolean(showDetailsModal)}
        onClose={() => setShowDetailsModal(null)}
        maxWidth="lg"
      >
        {showDetailsModal && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
              <div>
                <span className="text-[10px] text-stone-500 font-medium">Total Yield</span>
                <div className="text-lg font-black text-stone-900">
                  {showDetailsModal.totalLitres} L
                </div>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-medium">Fat Content</span>
                <div className="text-lg font-black text-stone-900">
                  {showDetailsModal.fatPercent ? `${showDetailsModal.fatPercent}%` : '—'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-medium">SNF Content</span>
                <div className="text-lg font-black text-stone-900">
                  {showDetailsModal.snfPercent ? `${showDetailsModal.snfPercent}%` : '—'}
                </div>
              </div>
            </div>

            {detailRows.length > 0 ? (
              <div className="space-y-1.5">
                <h4 className="font-bold text-stone-800">
                  Individual Cow Breakdown ({detailRows.length} cows)
                </h4>
                <div className="max-h-60 overflow-y-auto border border-stone-200 rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-stone-50 text-stone-500 sticky top-0">
                      <tr>
                        <th className="p-2">Cow ID</th>
                        <th className="p-2">Yield</th>
                        <th className="p-2">Fat %</th>
                        <th className="p-2">SNF %</th>
                        <th className="p-2">Reason/Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {detailRows.map(r => (
                        <tr key={r.id}>
                          <td className="p-2 font-bold text-stone-900">{r.animalId}</td>
                          <td className="p-2 font-bold text-emerald-800">{r.litres} L</td>
                          <td className="p-2">{r.fatPercent ? `${r.fatPercent}%` : '-'}</td>
                          <td className="p-2">{r.snfPercent ? `${r.snfPercent}%` : '-'}</td>
                          <td className="p-2 text-stone-600">
                            {r.reason === 'Sick' ? (
                              <span className="text-rose-700 font-bold">Sick: {r.notes}</span>
                            ) : (
                              r.reason || r.notes || '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-stone-400 bg-stone-50 rounded-lg">
                No individual cow allocation stored for this shift (Entered via quick total mode).
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Unlock Shift Modal */}
      <Modal
        title={`Unlock Shift: ${showUnlockModal?.date || ''} — ${showUnlockModal?.shift || ''}`}
        isOpen={Boolean(showUnlockModal)}
        onClose={() => setShowUnlockModal(null)}
        footer={
          <>
            <button
              onClick={() => setShowUnlockModal(null)}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleUnlockShift}
              className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
            >
              Authorize & Unlock
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-700">
            Locked shifts represent completed official records. To modify or correct this shift, you
            must provide an explicit auditable reason.
          </p>
          <div>
            <label className="block text-stone-700 font-bold mb-1">Reason for Correction *</label>
            <textarea
              rows={3}
              placeholder="e.g. Milk meter recalibration, data entry error corrected by supervisor..."
              value={unlockReason}
              onChange={e => setUnlockReason(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Fullscreen Dedicated Individual Cow Milking Modal */}
      <IndividualMilkModal
        isOpen={showIndividualModal}
        onClose={() => setShowIndividualModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
