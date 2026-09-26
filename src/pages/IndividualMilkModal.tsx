import React, { useState, useEffect } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { X, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

interface CowDraftEntry {
  litres: number | '';
  fatPercent: number | '';
  snfPercent: number | '';
  reason: 'Normal' | 'Sick' | 'Dry' | 'Pregnant / dry period' | 'No milk today' | 'Not present' | 'Other';
  notes: string;
}

interface IndividualMilkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
  initialShift?: string;
}

export const IndividualMilkModal: React.FC<IndividualMilkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialShift,
}) => {
  const [date, setDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState(initialShift || 'Morning');
  const [shiftsList, setShiftsList] = useState<any[]>([]);
  const [cows, setCows] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CowDraftEntry>>({});
  const [selectedCowId, setSelectedCowId] = useState<string | null>(null);
  const [cowFormData, setCowFormData] = useState<CowDraftEntry>({
    litres: '',
    fatPercent: '',
    snfPercent: '',
    reason: 'Normal',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, date, shift]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [shifts, femaleCows, existingEntries] = await Promise.all([
        api.getMilkShifts(),
        api.getAnimals({ sex: 'Female', status: 'Active' }),
        api.getMilkIndividual(date, shift).catch(() => []),
      ]);

      setShiftsList(shifts);
      setCows(femaleCows);

      // Populate drafts with existing records
      const initialDrafts: Record<string, CowDraftEntry> = {};
      for (const entry of existingEntries) {
        initialDrafts[entry.animalId] = {
          litres: entry.litres ?? '',
          fatPercent: entry.fatPercent ?? '',
          snfPercent: entry.snfPercent ?? '',
          reason: entry.reason || 'Normal',
          notes: entry.notes || '',
        };
      }
      setDrafts(initialDrafts);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cow Tile state:
  // GREEN (pending): entry needed
  // GREY: completed normal
  // RED: completed sick
  const getCowState = (cowId: string) => {
    const entry = drafts[cowId];
    if (!entry) return 'pending';
    if (entry.reason === 'Sick') return 'sick';
    if (entry.litres !== '' || (entry.reason && entry.reason !== 'Normal')) return 'done';
    return 'pending';
  };

  // Real-time calculations
  const calculateMetrics = () => {
    let totalLitres = 0;
    let fatSum = 0;
    let snfSum = 0;
    let qualityLitres = 0;
    let completedCount = 0;
    let sickCount = 0;

    for (const cow of cows) {
      const e = drafts[cow.id];
      if (!e) continue;

      if (e.reason === 'Sick') sickCount++;

      const l = Number(e.litres || 0);
      if (l > 0 || (e.reason && e.reason !== 'Normal')) {
        completedCount++;
      }

      if (l > 0) {
        totalLitres += l;
        if (e.fatPercent !== '' && !isNaN(Number(e.fatPercent))) {
          fatSum += l * Number(e.fatPercent);
          qualityLitres += l;
        }
        if (e.snfPercent !== '' && !isNaN(Number(e.snfPercent))) {
          snfSum += l * Number(e.snfPercent);
        }
      }
    }

    const weightedFat = qualityLitres > 0 ? (fatSum / qualityLitres).toFixed(2) : null;
    const weightedSnf = qualityLitres > 0 ? (snfSum / qualityLitres).toFixed(2) : null;
    const remainingCount = Math.max(0, cows.length - completedCount);

    return {
      totalLitres: totalLitres.toFixed(1),
      weightedFat,
      weightedSnf,
      totalCows: cows.length,
      completedCount,
      remainingCount,
      sickCount,
    };
  };

  const metrics = calculateMetrics();

  // Find exact remaining cows
  const remainingCows = cows.filter(c => {
    const st = getCowState(c.id);
    return st === 'pending';
  });

  const handleOpenCowEntry = (cowId: string) => {
    setSelectedCowId(cowId);
    const existing = drafts[cowId];
    if (existing) {
      setCowFormData({ ...existing });
    } else {
      setCowFormData({
        litres: '',
        fatPercent: '',
        snfPercent: '',
        reason: 'Normal',
        notes: '',
      });
    }
  };

  const handleSaveCowEntry = () => {
    if (!selectedCowId) return;

    if (cowFormData.litres === '' && cowFormData.reason === 'Normal') {
      alert('Please enter milk litres or select a valid reason (e.g. Dry, Sick, etc.).');
      return;
    }

    if (cowFormData.reason === 'Sick' && !cowFormData.notes.trim()) {
      alert('Please describe the sickness or symptoms in notes.');
      return;
    }

    setDrafts(prev => ({
      ...prev,
      [selectedCowId]: {
        ...cowFormData,
        litres: cowFormData.litres === '' ? 0 : Number(cowFormData.litres),
      },
    }));

    setSelectedCowId(null);
  };

  const handleFinishShift = async () => {
    if (remainingCows.length > 0) {
      alert(
        `Cannot complete shift: ${remainingCows.length} cows still require an entry (${remainingCows
          .slice(0, 5)
          .map(c => c.id)
          .join(', ')}...). Tap each cow to enter litres or select Dry/Sick/Not Present.`
      );
      return;
    }

    try {
      setLoading(true);
      const entries = cows.map(c => {
        const d = drafts[c.id];
        return {
          animalId: c.id,
          litres: Number(d.litres || 0),
          fatPercent: d.fatPercent !== '' ? Number(d.fatPercent) : undefined,
          snfPercent: d.snfPercent !== '' ? Number(d.snfPercent) : undefined,
          reason: d.reason,
          notes: d.notes,
        };
      });

      await api.saveMilkIndividual(date, shift, entries);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving shift');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Group cows by Group
  const highCows = cows.filter(c => c.group === 'High');
  const lowCows = cows.filter(c => c.group === 'Low');
  const otherCows = cows.filter(c => c.group !== 'High' && c.group !== 'Low');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#103b2a] text-white shrink-0 border-b border-[#1b583f] shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white rounded-lg cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-extrabold tracking-tight">
              Individual Cow Milk Grid
            </h2>
            <div className="text-[11px] text-emerald-300 font-medium">
              {date} · {shift} Shift
            </div>
          </div>
        </div>

        {/* Date and Shift controls */}
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-[#164c36] text-white px-2 py-1 rounded-lg border border-[#1f684a] text-xs font-semibold"
          />
          <select
            value={shift}
            onChange={e => setShift(e.target.value)}
            className="bg-[#164c36] text-white px-2 py-1 rounded-lg border border-[#1f684a] text-xs font-semibold"
          >
            {shiftsList.map(s => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Metrics Banner */}
      <div className="bg-stone-50 border-b border-stone-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-4 flex-wrap font-medium text-stone-700">
          <div>
            Total Milk:{' '}
            <span className="font-extrabold text-stone-900 text-sm">{metrics.totalLitres} L</span>
          </div>
          <div>
            Weighted Fat:{' '}
            <span className="font-bold text-stone-900">
              {metrics.weightedFat ? `${metrics.weightedFat}%` : '—'}
            </span>
          </div>
          <div>
            Weighted SNF:{' '}
            <span className="font-bold text-stone-900">
              {metrics.weightedSnf ? `${metrics.weightedSnf}%` : '—'}
            </span>
          </div>
        </div>

        {/* Status Legend & Counts */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#e8f5ec] border border-[#9bc8aa]"></span>
            <span className="text-stone-600">Pending ({metrics.remainingCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#e5e8e6] border border-[#b9c2bc]"></span>
            <span className="text-stone-600">Normal ({metrics.completedCount - metrics.sickCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#f5c7c4] border border-[#d98781]"></span>
            <span className="text-stone-600 font-bold text-rose-700">Sick ({metrics.sickCount})</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-stone-100/50">
        {/* Warning if remaining cows */}
        {remainingCows.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <b>{remainingCows.length} cows still require an entry.</b> Tap the green squares below to enter milk or reason.
              </span>
            </div>
            <div className="flex gap-1 overflow-x-auto max-w-xs shrink-0">
              {remainingCows.slice(0, 4).map(c => (
                <button
                  key={c.id}
                  onClick={() => handleOpenCowEntry(c.id)}
                  className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-stone-900 font-bold text-[10px] rounded cursor-pointer"
                >
                  {c.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* High Group */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-extrabold text-xs text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <span>High Group</span>
              <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                {highCows.length} Cows
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(46px,46px))] gap-1.5 justify-start">
            {highCows.map(cow => {
              const state = getCowState(cow.id);
              const colorClasses =
                state === 'sick'
                  ? 'bg-[#f5c7c4] text-[#8e1f18] border-[#d98781]'
                  : state === 'done'
                  ? 'bg-[#e5e8e6] text-[#25302a] border-[#b9c2bc]'
                  : 'bg-[#e8f5ec] text-[#155c38] border-[#9bc8aa] hover:bg-[#d8edd9]';

              return (
                <button
                  key={cow.id}
                  onClick={() => handleOpenCowEntry(cow.id)}
                  className={`w-[46px] h-[46px] rounded-lg border font-extrabold text-[11px] cursor-pointer flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xs ${colorClasses}`}
                  title={`${cow.id}: ${drafts[cow.id]?.litres ?? 'Pending'} L`}
                >
                  {cow.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Low Group */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-extrabold text-xs text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <span>Low Group</span>
              <span className="px-2 py-0.2 bg-stone-100 text-stone-700 rounded-full text-[10px] font-bold">
                {lowCows.length} Cows
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(46px,46px))] gap-1.5 justify-start">
            {lowCows.map(cow => {
              const state = getCowState(cow.id);
              const colorClasses =
                state === 'sick'
                  ? 'bg-[#f5c7c4] text-[#8e1f18] border-[#d98781]'
                  : state === 'done'
                  ? 'bg-[#e5e8e6] text-[#25302a] border-[#b9c2bc]'
                  : 'bg-[#e8f5ec] text-[#155c38] border-[#9bc8aa] hover:bg-[#d8edd9]';

              return (
                <button
                  key={cow.id}
                  onClick={() => handleOpenCowEntry(cow.id)}
                  className={`w-[46px] h-[46px] rounded-lg border font-extrabold text-[11px] cursor-pointer flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xs ${colorClasses}`}
                  title={`${cow.id}: ${drafts[cow.id]?.litres ?? 'Pending'} L`}
                >
                  {cow.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Other Custom Groups */}
        {otherCows.length > 0 && (
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-extrabold text-xs text-stone-800 uppercase tracking-wider flex items-center gap-2">
                <span>Other Groups</span>
                <span className="px-2 py-0.2 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold">
                  {otherCows.length} Cows
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(46px,46px))] gap-1.5 justify-start">
              {otherCows.map(cow => {
                const state = getCowState(cow.id);
                const colorClasses =
                  state === 'sick'
                    ? 'bg-[#f5c7c4] text-[#8e1f18] border-[#d98781]'
                    : state === 'done'
                    ? 'bg-[#e5e8e6] text-[#25302a] border-[#b9c2bc]'
                    : 'bg-[#e8f5ec] text-[#155c38] border-[#9bc8aa] hover:bg-[#d8edd9]';

                return (
                  <button
                    key={cow.id}
                    onClick={() => handleOpenCowEntry(cow.id)}
                    className={`w-[46px] h-[46px] rounded-lg border font-extrabold text-[11px] cursor-pointer flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xs ${colorClasses}`}
                    title={`${cow.id}: ${drafts[cow.id]?.litres ?? 'Pending'} L`}
                  >
                    {cow.id}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-3.5 bg-white border-t border-stone-200 flex items-center justify-between shrink-0 shadow-lg">
        <div className="text-xs text-stone-600">
          <span>Accounted: </span>
          <b className="text-stone-900">
            {metrics.completedCount} / {metrics.totalCows}
          </b>
          {metrics.remainingCount > 0 && (
            <span className="text-rose-600 font-bold ml-1.5">
              ({metrics.remainingCount} remaining)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleFinishShift}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save & Lock Shift</span>
          </button>
        </div>
      </div>

      {/* Modal for Individual Cow Entry */}
      <Modal
        title={`Milk Entry: Cow ${selectedCowId || ''}`}
        isOpen={Boolean(selectedCowId)}
        onClose={() => setSelectedCowId(null)}
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setSelectedCowId(null)}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCowEntry}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Cow
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
            <span className="font-bold text-stone-800">Cow Number: {selectedCowId}</span>
            <span className="text-stone-500">
              Shift: {shift} ({date})
            </span>
          </div>

          <div>
            <label className="block text-stone-600 font-bold mb-1">Milk Yield (Litres)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 12.5"
              value={cowFormData.litres}
              onChange={e =>
                setCowFormData({
                  ...cowFormData,
                  litres: e.target.value === '' ? '' : parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-lg focus:border-emerald-600 focus:outline-none"
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
                value={cowFormData.fatPercent}
                onChange={e =>
                  setCowFormData({
                    ...cowFormData,
                    fatPercent: e.target.value === '' ? '' : parseFloat(e.target.value),
                  })
                }
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
                value={cowFormData.snfPercent}
                onChange={e =>
                  setCowFormData({
                    ...cowFormData,
                    snfPercent: e.target.value === '' ? '' : parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">
              If zero / no milk — Reason
            </label>
            <select
              value={cowFormData.reason}
              onChange={e => setCowFormData({ ...cowFormData, reason: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-medium"
            >
              <option value="Normal">Normal Milk Entry</option>
              <option value="Sick">Sick (Turns Red + Creates Health Case)</option>
              <option value="Dry">Dry Cow</option>
              <option value="Pregnant / dry period">Pregnant / Dry Period</option>
              <option value="No milk today">No Milk Today</option>
              <option value="Not present">Not Present</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {cowFormData.reason === 'Sick' && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
              ⚠️ Marking this cow <b>Sick</b> will turn the cow tile RED, create an active
              Health/Veterinary case, and schedule a follow-up reminder for tomorrow.
            </div>
          )}

          <div>
            <label className="block text-stone-600 font-semibold mb-1">
              {cowFormData.reason === 'Sick' ? 'Symptoms / Sickness Details *' : 'Notes (Optional)'}
            </label>
            <textarea
              rows={2}
              placeholder={
                cowFormData.reason === 'Sick'
                  ? 'Describe problem e.g. Mastitis, high fever, off-feed...'
                  : 'Any notes...'
              }
              value={cowFormData.notes}
              onChange={e => setCowFormData({ ...cowFormData, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
