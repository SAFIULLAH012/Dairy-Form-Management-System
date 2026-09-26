import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { Stethoscope, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const HealthPage: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [cows, setCows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCase, setEditingCase] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    animalId: '',
    date: new Date().toISOString().slice(0, 10),
    problem: '',
    symptoms: '',
    diagnosis: '',
    medicine: '',
    dose: '',
    injection: '',
    provider: '',
    cost: '',
    status: 'Open' as 'Open' | 'Under Treatment' | 'Follow-up' | 'Recovered' | 'Closed',
    followUpDate: '',
    recoveryDate: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, animals] = await Promise.all([
        api.getHealthCases(undefined, statusFilter || undefined),
        api.getAnimals(),
      ]);
      setCases(list);
      setCows(animals);
      if (animals.length > 0 && !formData.animalId) {
        setFormData(prev => ({ ...prev, animalId: animals[0].id }));
      }
    } catch (err) {
      console.error('Error loading health cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenAdd = () => {
    setEditingCase(null);
    setFormData({
      animalId: cows[0]?.id || '',
      date: new Date().toISOString().slice(0, 10),
      problem: '',
      symptoms: '',
      diagnosis: '',
      medicine: '',
      dose: '',
      injection: '',
      provider: '',
      cost: '',
      status: 'Open',
      followUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      recoveryDate: '',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCase(c);
    setFormData({
      animalId: c.animalId,
      date: c.date,
      problem: c.problem,
      symptoms: c.symptoms || '',
      diagnosis: c.diagnosis || '',
      medicine: c.medicine || '',
      dose: c.dose || '',
      injection: c.injection || '',
      provider: c.provider || '',
      cost: c.cost ? String(c.cost) : '',
      status: c.status,
      followUpDate: c.followUpDate || '',
      recoveryDate: c.recoveryDate || '',
      notes: c.notes || '',
    });
    setShowAddModal(true);
  };

  const handleSaveCase = async () => {
    if (!formData.problem.trim()) {
      alert('Problem description is required.');
      return;
    }

    try {
      const payload: any = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        source: editingCase?.source || 'MANUAL',
      };

      if (editingCase) {
        await api.updateHealthCase(editingCase.id, payload);
      } else {
        await api.createHealthCase(payload);
      }

      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving health case');
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
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Treatment">Under Treatment</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Recovered">Recovered</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Health Case</span>
        </button>
      </div>

      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
        💉 When an active cow is marked <b>Sick</b> during morning or evening milk collection, a
        health case and next-day follow-up reminder are automatically created here.
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Animal ID</th>
                <th className="p-3">Problem / Issue</th>
                <th className="p-3">Treatment / Medicine</th>
                <th className="p-3">Follow-up Date</th>
                <th className="p-3">Cost (Rs.)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    No veterinary cases found.
                  </td>
                </tr>
              ) : (
                cases.map(c => (
                  <tr key={c.id} className="hover:bg-stone-50/70">
                    <td className="p-3 font-semibold text-stone-900">{c.date}</td>
                    <td className="p-3 font-bold text-emerald-800">{c.animalId}</td>
                    <td className="p-3">
                      <span className="font-bold text-stone-900 block">{c.problem}</span>
                      {c.symptoms && (
                        <span className="text-[10px] text-stone-500">{c.symptoms}</span>
                      )}
                    </td>
                    <td className="p-3 text-stone-600">
                      {c.medicine ? `${c.medicine} (${c.dose || '-'})` : '-'}
                    </td>
                    <td className="p-3 font-medium text-stone-600">{c.followUpDate || '-'}</td>
                    <td className="p-3 font-mono">{c.cost ? `Rs. ${c.cost}` : '-'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'Open'
                            ? 'bg-rose-100 text-rose-800'
                            : c.status === 'Under Treatment'
                            ? 'bg-amber-100 text-amber-800'
                            : c.status === 'Recovered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded cursor-pointer"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={editingCase ? `Update Health Case: ${editingCase.animalId}` : 'New Health Case'}
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
              onClick={handleSaveCase}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Health Case
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Animal *</label>
              <select
                value={formData.animalId}
                onChange={e => setFormData({ ...formData, animalId: e.target.value })}
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
              <label className="block text-stone-600 font-semibold mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">Problem / Symptoms *</label>
            <input
              type="text"
              placeholder="e.g. Mastitis in left rear quarter, off-feed, fever"
              value={formData.problem}
              onChange={e => setFormData({ ...formData, problem: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Medicine / Treatment</label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Flunixin"
                value={formData.medicine}
                onChange={e => setFormData({ ...formData, medicine: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Dose / Route</label>
              <input
                type="text"
                placeholder="e.g. 20ml IM daily"
                value={formData.dose}
                onChange={e => setFormData({ ...formData, dose: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
              >
                <option value="Open">Open</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Recovered">Recovered</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Follow-up Date</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={e => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Veterinarian / Provider</label>
              <input
                type="text"
                placeholder="e.g. Dr. Tariq"
                value={formData.provider}
                onChange={e => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Cost (Rs.)</label>
              <input
                type="number"
                placeholder="0"
                value={formData.cost}
                onChange={e => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Diagnosis Notes</label>
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
