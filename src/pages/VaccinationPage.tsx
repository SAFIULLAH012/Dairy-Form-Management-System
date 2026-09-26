import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { AnimalSearchInput } from '../components/AnimalSearchInput.tsx';
import { Syringe, Plus, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const VaccinationPage: React.FC = () => {
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [cows, setCows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    animalId: '',
    vaccineType: 'FMD',
    lastDate: new Date().toISOString().slice(0, 10),
    nextDueDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    product: 'Aftovaxpur',
    dose: '2ml SC',
    provider: 'Government Livestock Dept',
    cost: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [vacs, animalList] = await Promise.all([
        api.getVaccinations(),
        api.getAnimals({ status: 'Active' }),
      ]);
      setVaccinations(vacs);
      setCows(animalList);
      if (animalList.length > 0 && !formData.animalId) {
        setFormData(prev => ({ ...prev, animalId: animalList[0].id }));
      }
    } catch (err) {
      console.error('Error loading vaccinations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveVaccination = async () => {
    try {
      await api.recordVaccination({
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
      });

      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording vaccination');
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <Syringe className="w-4 h-4 text-emerald-700" />
          <span>Herd Immunization & Deworming Protocols</span>
        </div>

        <button
          onClick={() => {
            setFormData({
              animalId: cows[0]?.id || '',
              vaccineType: 'FMD',
              lastDate: new Date().toISOString().slice(0, 10),
              nextDueDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
              product: 'Aftovaxpur',
              dose: '2ml SC',
              provider: 'Government Livestock Dept',
              cost: '',
              notes: '',
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Vaccination</span>
        </button>
      </div>

      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
        💡 Supported core protocols: <b>FMD (Foot-and-Mouth)</b>, <b>HS (Hemorrhagic Septicemia)</b>,{' '}
        <b>BQ (Blackleg)</b>, and <b>Deworming</b>. Next due dates automatically generate background reminders.
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Animal ID</th>
                <th className="p-3">Vaccine / Protocol</th>
                <th className="p-3">Last Administered</th>
                <th className="p-3">Next Due Date</th>
                <th className="p-3">Product / Dose</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {vaccinations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    No vaccination records found.
                  </td>
                </tr>
              ) : (
                vaccinations.map(v => {
                  const isOverdue = v.nextDueDate < todayStr;
                  const isDueToday = v.nextDueDate === todayStr;

                  return (
                    <tr key={v.id} className="hover:bg-stone-50/70">
                      <td className="p-3 font-extrabold text-stone-900">{v.animalId}</td>
                      <td className="p-3 font-bold text-emerald-800">{v.vaccineType}</td>
                      <td className="p-3 font-medium text-stone-600">{v.lastDate}</td>
                      <td className="p-3 font-bold text-stone-900">{v.nextDueDate}</td>
                      <td className="p-3 text-stone-600">
                        {v.product ? `${v.product} (${v.dose || '-'})` : '-'}
                      </td>
                      <td className="p-3 text-stone-500">{v.provider || '-'}</td>
                      <td className="p-3">
                        {isOverdue ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            OVERDUE
                          </span>
                        ) : isDueToday ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            DUE TODAY
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            SCHEDULED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        title="Record Vaccination or Deworming"
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
              onClick={handleSaveVaccination}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Record
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
<AnimalSearchInput
  animals={cows}
  value={formData.animalId}
  onChange={(id) => setFormData({ ...formData, animalId: id })}
  placeholder="Select animal..."
/>
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Vaccine / Disease *</label>
              <select
                value={formData.vaccineType}
                onChange={e => setFormData({ ...formData, vaccineType: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
              >
                <option value="FMD">FMD (Foot & Mouth)</option>
                <option value="HS">HS (Hemorrhagic Septicemia)</option>
                <option value="BQ">BQ (Blackleg)</option>
                <option value="Deworming">Deworming (Internal Parasites)</option>
                <option value="Anthrax">Anthrax</option>
                <option value="Brucellosis">Brucellosis</option>
                <option value="Other">Other Custom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Administered Date *</label>
              <input
                type="date"
                value={formData.lastDate}
                onChange={e => setFormData({ ...formData, lastDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Next Due Date *</label>
              <input
                type="date"
                value={formData.nextDueDate}
                onChange={e => setFormData({ ...formData, nextDueDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Product Brand</label>
              <input
                type="text"
                placeholder="e.g. Aftovaxpur, Albendazole"
                value={formData.product}
                onChange={e => setFormData({ ...formData, product: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Dose</label>
              <input
                type="text"
                placeholder="e.g. 2ml SC, 50ml oral"
                value={formData.dose}
                onChange={e => setFormData({ ...formData, dose: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Provider / Vet</label>
              <input
                type="text"
                value={formData.provider}
                onChange={e => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Cost (Rs.)</label>
              <input
                type="number"
                value={formData.cost}
                onChange={e => setFormData({ ...formData, cost: e.target.value })}
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
