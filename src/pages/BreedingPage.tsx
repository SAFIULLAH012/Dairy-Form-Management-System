import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { GitBranch, Plus, Sparkles, Baby, TrendingUp, Calendar, Heart } from 'lucide-react';
import { calculateBreedingPredictions } from '../domain/calculations.ts';

export const BreedingPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [cows, setCows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCalvingModal, setShowCalvingModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState<any | null>(null);
  const [growthList, setGrowthList] = useState<any[]>([]);

  // Breeding Event Form
  const [eventForm, setEventForm] = useState({
    animalId: '',
    date: new Date().toISOString().slice(0, 10),
    event: 'Insemination' as any,
    sireBreedOrId: 'Imported Holstein Bull #402',
    inseminatorName: 'Dr. Tariq',
    notes: '',
  });

  // Calving Workflow Form
  const [calvingForm, setCalvingForm] = useState({
    damId: '',
    calvingDate: new Date().toISOString().slice(0, 10),
    calfSex: 'Female' as 'Female' | 'Male',
    calfId: '',
    calfBreed: 'Friesian Cross',
    birthWeight: '38',
    sireId: '',
    notes: 'Normal unassisted birth',
  });

  // Growth Form
  const [growthForm, setGrowthForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weightKg: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [recs, femaleCows] = await Promise.all([
        api.getBreedingRecords(),
        api.getAnimals({ sex: 'Female', status: 'Active' }),
      ]);
      setRecords(recs);
      setCows(femaleCows);
      if (femaleCows.length > 0) {
        if (!eventForm.animalId) setEventForm(prev => ({ ...prev, animalId: femaleCows[0].id }));
        if (!calvingForm.damId) setCalvingForm(prev => ({ ...prev, damId: femaleCows[0].id }));
      }
    } catch (err) {
      console.error('Error loading breeding data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time biological predictions display
  const predictions = calculateBreedingPredictions({
    inseminationDate: eventForm.event === 'Insemination' ? eventForm.date : undefined,
    lastHeatDate: eventForm.event === 'Heat' ? eventForm.date : undefined,
    isPregnant: eventForm.event === 'Pregnant',
  });

  const handleSaveEvent = async () => {
    try {
      await api.recordBreedingEvent(eventForm);
      setShowEventModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording breeding event');
    }
  };

  const handleSaveCalving = async () => {
    if (!calvingForm.calfId.trim()) {
      alert('New Calf ID is required.');
      return;
    }

    try {
      await api.recordCalving({
        ...calvingForm,
        birthWeight: calvingForm.birthWeight ? parseFloat(calvingForm.birthWeight) : undefined,
      });

      setShowCalvingModal(false);
      loadData();
      alert(`Calf ${calvingForm.calfId} successfully created and registered! Dam updated to Milking Adult.`);
    } catch (err: any) {
      alert(err.message || 'Error processing calving workflow');
    }
  };

  const handleOpenGrowth = async (animal: any) => {
    setShowGrowthModal(animal);
    try {
      const g = await api.getGrowth(animal.animalId || animal.id);
      setGrowthList(g);
    } catch (err) {
      console.error(err);
      setGrowthList([]);
    }
  };

  const handleSaveGrowth = async () => {
    if (!showGrowthModal || !growthForm.weightKg) {
      alert('Weight in KG is required.');
      return;
    }

    try {
      await api.recordGrowth(showGrowthModal.animalId || showGrowthModal.id, {
        date: growthForm.date,
        weightKg: parseFloat(growthForm.weightKg),
        notes: growthForm.notes,
      });

      setGrowthForm({ date: new Date().toISOString().slice(0, 10), weightKg: '', notes: '' });
      const updated = await api.getGrowth(showGrowthModal.animalId || showGrowthModal.id);
      setGrowthList(updated);
    } catch (err: any) {
      alert(err.message || 'Error recording growth');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <GitBranch className="w-4 h-4 text-emerald-700" />
          <span>Reproductive Cycles & Gestation Management</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCalvingForm({
                damId: cows[0]?.id || '',
                calvingDate: new Date().toISOString().slice(0, 10),
                calfSex: 'Female',
                calfId: `CALF-${Date.now().toString().slice(-4)}`,
                calfBreed: 'Friesian Cross',
                birthWeight: '38',
                sireId: '',
                notes: '',
              });
              setShowCalvingModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <Baby className="w-4 h-4" />
            <span>Record Calving (New Calf)</span>
          </button>

          <button
            onClick={() => setShowEventModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Breeding Event</span>
          </button>
        </div>
      </div>

      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
        💡 <b>Scientific Predictions:</b> Insemination triggers a <b>~283-day</b> gestation expected
        calving date and a <b>~60-day</b> prior dry-off target. Heat events compute a <b>~21-day</b>{' '}
        next-heat monitoring reminder. Predicted dates are clearly separated from actual recorded dates.
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Cow ID</th>
                <th className="p-3">Breeding Event</th>
                <th className="p-3">Expected Calving (283d)</th>
                <th className="p-3">Dry-off Target (-60d)</th>
                <th className="p-3">Next Heat (~21d)</th>
                <th className="p-3">Sire / Inseminator</th>
                <th className="p-3">Growth / History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    No breeding records found.
                  </td>
                </tr>
              ) : (
                records.map(r => (
                  <tr key={r.id} className="hover:bg-stone-50/70">
                    <td className="p-3 font-semibold text-stone-900">{r.date}</td>
                    <td className="p-3 font-extrabold text-emerald-800">{r.animalId}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.event === 'Pregnant'
                            ? 'bg-amber-100 text-amber-800'
                            : r.event === 'Calving'
                            ? 'bg-purple-100 text-purple-800'
                            : r.event === 'Insemination'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {r.event}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-stone-800">
                      {r.expectedCalvingDate ? (
                        <span className="flex items-center gap-1 text-emerald-800">
                          <Calendar className="w-3.5 h-3.5" />
                          {r.expectedCalvingDate}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 font-medium text-stone-600">
                      {r.recommendedDryOffDate || '—'}
                    </td>
                    <td className="p-3 font-medium text-stone-600">
                      {r.expectedNextHeatDate || '—'}
                    </td>
                    <td className="p-3 text-stone-600">
                      {r.sireBreedOrId ? `${r.sireBreedOrId} (${r.inseminatorName || '-'})` : '-'}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleOpenGrowth(r)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Growth Log</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Breeding Event Modal */}
      <Modal
        title="Record Breeding / Reproductive Event"
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowEventModal(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEvent}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Event
            </button>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Female Cow *</label>
              <select
                value={eventForm.animalId}
                onChange={e => setEventForm({ ...eventForm, animalId: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
              >
                {cows.map(cow => (
                  <option key={cow.id} value={cow.id}>
                    {cow.id} ({cow.group} Group · {cow.reproStatus})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Date *</label>
              <input
                type="date"
                value={eventForm.date}
                onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">Event Type *</label>
            <select
              value={eventForm.event}
              onChange={e => setEventForm({ ...eventForm, event: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-bold"
            >
              <option value="Insemination">Insemination (AI / Natural Service)</option>
              <option value="Heat">Heat Detected</option>
              <option value="Pregnancy Check">Pregnancy Diagnosis (PD Check)</option>
              <option value="Pregnant">Confirmed Pregnant</option>
              <option value="Not Pregnant">Not Pregnant (Open)</option>
              <option value="Repeat">Repeat Breeder</option>
              <option value="Dry-off">Dry-off Transition</option>
              <option value="Nil">Nil (Non-responsive)</option>
              <option value="Other">Other Event</option>
            </select>
          </div>

          {/* Biological Calculation Display */}
          {(predictions.expectedCalvingDate || predictions.expectedNextHeatDate) && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1 text-xs">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                Automatic Gestation & Cycle Projections:
              </span>
              {predictions.expectedCalvingDate && (
                <div className="text-purple-800">
                  • Expected Calving Date: <b>{predictions.expectedCalvingDate}</b> (+283 days)
                </div>
              )}
              {predictions.recommendedDryOffDate && (
                <div className="text-purple-800">
                  • Recommended Dry-off Target: <b>{predictions.recommendedDryOffDate}</b> (60 days
                  before calving)
                </div>
              )}
              {predictions.expectedNextHeatDate && (
                <div className="text-purple-800">
                  • Expected Next Heat: <b>{predictions.expectedNextHeatDate}</b> (~21 days)
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                Sire Breed / Bull ID / Straw Code
              </label>
              <input
                type="text"
                placeholder="e.g. Bull 402, Semex Friesian"
                value={eventForm.sireBreedOrId}
                onChange={e => setEventForm({ ...eventForm, sireBreedOrId: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                Inseminator / AI Tech
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Tariq"
                value={eventForm.inseminatorName}
                onChange={e => setEventForm({ ...eventForm, inseminatorName: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={eventForm.notes}
              onChange={e => setEventForm({ ...eventForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Record Calving Workflow Modal */}
      <Modal
        title="Record Calving & Register Newborn Calf"
        isOpen={showCalvingModal}
        onClose={() => setShowCalvingModal(false)}
        maxWidth="lg"
        footer={
          <>
            <button
              onClick={() => setShowCalvingModal(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCalving}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Complete Calving & Create Calf
            </button>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs">
            ✨ This workflow automatically:
            <br />
            1. Registers the new calf in the farm herd with dam/sire pedigree.
            <br />
            2. Updates mother (Dam) to Adult Milking status.
            <br />
            3. Creates initial birth weight growth record.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Mother (Dam) *</label>
              <select
                value={calvingForm.damId}
                onChange={e => setCalvingForm({ ...calvingForm, damId: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
              >
                {cows.map(cow => (
                  <option key={cow.id} value={cow.id}>
                    {cow.id} ({cow.breed})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Calving Date *</label>
              <input
                type="date"
                value={calvingForm.calvingDate}
                onChange={e => setCalvingForm({ ...calvingForm, calvingDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">New Calf ID / Tag *</label>
              <input
                type="text"
                placeholder="e.g. C-105"
                value={calvingForm.calfId}
                onChange={e => setCalvingForm({ ...calvingForm, calfId: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Calf Sex *</label>
              <select
                value={calvingForm.calfSex}
                onChange={e => setCalvingForm({ ...calvingForm, calfSex: e.target.value as any })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-bold"
              >
                <option value="Female">Female (Heifer Calf)</option>
                <option value="Male">Male (Bull Calf)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Calf Breed</label>
              <input
                type="text"
                value={calvingForm.calfBreed}
                onChange={e => setCalvingForm({ ...calvingForm, calfBreed: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Birth Weight (KG)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 38"
                value={calvingForm.birthWeight}
                onChange={e => setCalvingForm({ ...calvingForm, birthWeight: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Father (Sire ID / Straw)</label>
            <input
              type="text"
              placeholder="e.g. Semex Bull #901"
              value={calvingForm.sireId}
              onChange={e => setCalvingForm({ ...calvingForm, sireId: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Calving Notes</label>
            <textarea
              rows={2}
              value={calvingForm.notes}
              onChange={e => setCalvingForm({ ...calvingForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Calf Growth History Modal */}
      <Modal
        title={`Weight & Growth: ${showGrowthModal?.animalId || ''}`}
        isOpen={Boolean(showGrowthModal)}
        onClose={() => setShowGrowthModal(null)}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Add measurement input */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
            <span className="font-bold text-stone-800">Add Weighing Measurement</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="date"
                value={growthForm.date}
                onChange={e => setGrowthForm({ ...growthForm, date: e.target.value })}
                className="px-2.5 py-1.5 border border-stone-200 rounded-lg bg-white"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Weight (KG) e.g. 65"
                value={growthForm.weightKg}
                onChange={e => setGrowthForm({ ...growthForm, weightKg: e.target.value })}
                className="px-2.5 py-1.5 border border-stone-200 rounded-lg bg-white font-bold"
              />
              <button
                onClick={handleSaveGrowth}
                className="px-3 py-1.5 font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
              >
                Record Weight
              </button>
            </div>
          </div>

          {/* Growth Table with Average Daily Gain */}
          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Weight (KG)</th>
                  <th className="p-2">Age at Weighing</th>
                  <th className="p-2">Average Daily Gain (ADG)</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {growthList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-stone-400">
                      No weight measurements recorded yet.
                    </td>
                  </tr>
                ) : (
                  growthList.map(g => (
                    <tr key={g.id}>
                      <td className="p-2 font-medium">{g.date}</td>
                      <td className="p-2 font-extrabold text-stone-900">{g.weightKg} KG</td>
                      <td className="p-2 text-stone-600">{g.ageDaysAtWeighing} days</td>
                      <td className="p-2 font-bold text-emerald-800">
                        {g.averageDailyGain ? `${g.averageDailyGain} kg/day` : '—'}
                      </td>
                      <td className="p-2 text-stone-500">{g.notes || '-'}</td>
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
