import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { Search, Plus, DollarSign, Edit2, Calendar } from 'lucide-react';

export const MaleAnimalsPage: React.FC = () => {
  const [males, setMales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<any | null>(null);
  const [showSoldModal, setShowSoldModal] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    cowNumber: '',
    tag1: '',
    dob: new Date().toISOString().slice(0, 10),
    breed: 'Cross',
    group: 'Breeding Male',
    status: 'Active',
    purchaseDate: '',
    purchasePrice: '',
    supplier: '',
    notes: '',
  });

  const [soldForm, setSoldForm] = useState({
    saleDate: new Date().toISOString().slice(0, 10),
    buyer: '',
    salePrice: '',
    notes: '',
  });

  const loadMales = async () => {
    try {
      setLoading(true);
      const data = await api.getAnimals({ sex: 'Male', status: statusFilter || undefined });
      setMales(data);
    } catch (err) {
      console.error('Error loading male animals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMales();
  }, [statusFilter]);

  const handleOpenAdd = () => {
    setEditingAnimal(null);
    setFormData({
      id: '',
      cowNumber: '',
      tag1: '',
      dob: new Date().toISOString().slice(0, 10),
      breed: 'Cross',
      group: 'Breeding Male',
      status: 'Active',
      purchaseDate: '',
      purchasePrice: '',
      supplier: '',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: any) => {
    setEditingAnimal(m);
    setFormData({
      id: m.id,
      cowNumber: m.cowNumber || '',
      tag1: m.tag1 || '',
      dob: m.dob || '',
      breed: m.breed || '',
      group: m.group || 'Breeding Male',
      status: m.status || 'Active',
      purchaseDate: m.purchaseDate || '',
      purchasePrice: m.purchasePrice ? String(m.purchasePrice) : '',
      supplier: m.supplier || '',
      notes: m.notes || '',
    });
    setShowAddModal(true);
  };

  const handleSaveMale = async () => {
    if (!formData.id.trim()) {
      alert('Animal ID is required.');
      return;
    }
    if (!formData.dob) {
      alert('Date of birth is required.');
      return;
    }

    try {
      const payload: any = {
        ...formData,
        sex: 'Male',
        stage: 'Male',
        reproStatus: 'N/A',
        milkStatus: 'N/A',
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      };

      if (editingAnimal) {
        await api.updateAnimal(editingAnimal.id, payload);
      } else {
        await api.createAnimal(payload);
      }

      setShowAddModal(false);
      loadMales();
    } catch (err: any) {
      alert(err.message || 'Error saving male animal');
    }
  };

  const handleMarkSold = async () => {
    if (!showSoldModal) return;
    if (!soldForm.buyer.trim() || !soldForm.salePrice) {
      alert('Buyer name and sale price are required.');
      return;
    }
    try {
      await api.markSold(showSoldModal.id, {
        saleDate: soldForm.saleDate,
        buyer: soldForm.buyer,
        salePrice: parseFloat(soldForm.salePrice),
        notes: soldForm.notes,
      });
      setShowSoldModal(null);
      loadMales();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredMales = males.filter(m => {
    const q = searchTerm.toLowerCase();
    return (
      m.id.toLowerCase().includes(q) ||
      (m.tag1 && m.tag1.toLowerCase().includes(q)) ||
      (m.breed && m.breed.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search ID, tag, breed..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          >
            <option value="Active">Active Males</option>
            <option value="Sold">Sold</option>
            <option value="Deceased">Deceased</option>
            <option value="">All</option>
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Male Animal</span>
        </button>
      </div>

      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
        🐂 Male animals are tracked separately. They do not appear in female milking or reproductive workflows.
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">ID / Tag</th>
                <th className="p-3">Breed</th>
                <th className="p-3">Calculated Age</th>
                <th className="p-3">Group</th>
                <th className="p-3">Purchase Info</th>
                <th className="p-3">Sale Info</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredMales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    No male animals found.
                  </td>
                </tr>
              ) : (
                filteredMales.map(m => (
                  <tr key={m.id} className="hover:bg-stone-50/70">
                    <td className="p-3">
                      <span className="font-extrabold text-stone-900 block">{m.id}</span>
                      {m.tag1 && <span className="text-[10px] text-stone-400">{m.tag1}</span>}
                    </td>
                    <td className="p-3 font-medium text-stone-800">{m.breed}</td>
                    <td className="p-3 font-medium text-stone-600">{m.calculatedAge || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                        {m.group}
                      </span>
                    </td>
                    <td className="p-3 text-stone-600">
                      {m.purchaseDate || '-'}
                      {m.purchasePrice ? ` · Rs. ${m.purchasePrice.toLocaleString()}` : ''}
                    </td>
                    <td className="p-3 text-stone-600">
                      {m.saleDate ? `${m.saleDate} (Rs. ${m.salePrice?.toLocaleString()})` : '-'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === 'Sold'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {m.status === 'Active' && (
                          <button
                            onClick={() => {
                              setShowSoldModal(m);
                              setSoldForm({
                                saleDate: new Date().toISOString().slice(0, 10),
                                buyer: '',
                                salePrice: '',
                                notes: '',
                              });
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Mark Sold"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
        title={editingAnimal ? `Edit Male: ${editingAnimal.id}` : 'Add Male Animal'}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMale}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Male
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Male Animal ID *</label>
            <input
              type="text"
              placeholder="e.g. M-007"
              value={formData.id}
              disabled={Boolean(editingAnimal)}
              onChange={e => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-stone-50 disabled:bg-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Date of Birth (DOB) *</label>
            <input
              type="date"
              value={formData.dob}
              onChange={e => setFormData({ ...formData, dob: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Tag Number</label>
            <input
              type="text"
              placeholder="e.g. BULL-007"
              value={formData.tag1}
              onChange={e => setFormData({ ...formData, tag1: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Breed</label>
            <input
              type="text"
              placeholder="e.g. Sahiwal, Cross"
              value={formData.breed}
              onChange={e => setFormData({ ...formData, breed: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Purchase Date</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Purchase Price (Rs.)</label>
            <input
              type="number"
              placeholder="0"
              value={formData.purchasePrice}
              onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
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

      {/* Mark Sold Modal */}
      <Modal
        title={`Record Sale of Male: ${showSoldModal?.id || ''}`}
        isOpen={Boolean(showSoldModal)}
        onClose={() => setShowSoldModal(null)}
        footer={
          <>
            <button
              onClick={() => setShowSoldModal(null)}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkSold}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Confirm Sale
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Sale Date *</label>
            <input
              type="date"
              value={soldForm.saleDate}
              onChange={e => setSoldForm({ ...soldForm, saleDate: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Buyer Name *</label>
            <input
              type="text"
              value={soldForm.buyer}
              onChange={e => setSoldForm({ ...soldForm, buyer: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Sale Price (Rs.) *</label>
            <input
              type="number"
              value={soldForm.salePrice}
              onChange={e => setSoldForm({ ...soldForm, salePrice: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
