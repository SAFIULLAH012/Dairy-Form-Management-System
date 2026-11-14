import React, { useEffect, useState } from 'react';
import { api } from '../api/api.ts';
import { Modal } from '../components/Modal.tsx';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Calendar,
  Layers,
  Camera,
  CheckSquare,
  DollarSign,
  HeartCrack,
} from 'lucide-react';

export const AnimalsPage: React.FC = () => {
  const [animals, setAnimals] = useState<any[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<any | null>(null);
  const [selectedAnimalProfile, setSelectedAnimalProfile] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [animalMilkHistory, setAnimalMilkHistory] = useState<any[]>([]);
  const [showSoldModal, setShowSoldModal] = useState<any | null>(null);
  const [showDeceasedModal, setShowDeceasedModal] = useState<any | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    dob: new Date().toISOString().slice(0, 10),
    originType: 'Farm Born',
    purchasePrice: '',
    supplier: '',
    simpleState: 'Milking',
    group: 'High',
    stage: 'Adult',
    reproStatus: 'Milking',
    milkStatus: 'Milking',
    status: 'Active',
    notes: '',
    photoUrl: '',
  });

  const [soldForm, setSoldForm] = useState({
    saleDate: new Date().toISOString().slice(0, 10),
    buyer: '',
    salePrice: '',
    notes: '',
  });

  const [deceasedForm, setDeceasedForm] = useState({
    deathDate: new Date().toISOString().slice(0, 10),
    deathReason: '',
    notes: '',
  });

  const [bulkGroup, setBulkGroup] = useState('');

  const loadAnimals = async () => {
    try {
      setLoading(true);
      const [data, grps] = await Promise.all([
        api.getAnimals({ sex: 'Female', status: statusFilter || undefined, group: groupFilter || undefined }),
        api.getGroups(),
      ]);
      setAnimals(data);
      setGroups(grps);
      if (grps.length > 0 && !bulkGroup) setBulkGroup(grps[0]);
    } catch (err) {
      console.error('Error loading animals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnimals();
  }, [groupFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingAnimal(null);
    setFormData({
      id: '',
      dob: new Date().toISOString().slice(0, 10),
      originType: 'Farm Born',
      purchasePrice: '',
      supplier: '',
      simpleState: 'Milking',
      group: groups[0] || 'High',
      stage: 'Adult',
      reproStatus: 'Milking',
      milkStatus: 'Milking',
      status: 'Active',
      notes: '',
      photoUrl: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (animal: any) => {
    setEditingAnimal(animal);
    setFormData({
      id: animal.id,
      dob: animal.dob || '',
      originType: animal.purchasePrice ? 'Purchased' : 'Farm Born',
      purchasePrice: animal.purchasePrice ? String(animal.purchasePrice) : '',
      supplier: animal.supplier || '',
      simpleState: animal.stage === 'Calf' ? 'Calf' : animal.stage === 'Heifer' ? 'Heifer' : animal.reproStatus === 'Pregnant' ? 'Pregnant' : animal.milkStatus === 'Dry' ? 'Dry' : 'Milking',
      group: animal.group || 'High',
      stage: animal.stage || 'Adult',
      reproStatus: animal.reproStatus || 'Milking',
      milkStatus: animal.milkStatus || 'Milking',
      status: animal.status || 'Active',
      notes: animal.notes || '',
      photoUrl: animal.photoUrl || '',
    });
    setShowAddModal(true);
  };

  const handleSaveAnimal = async () => {
    if (!formData.id.trim()) {
      alert('Tag Number is required.');
      return;
    }

    try {
      let stage = 'Adult', reproStatus = 'Milking', milkStatus = 'Milking';
      switch(formData.simpleState) {
        case 'Calf': stage = 'Calf'; reproStatus = 'Nil'; milkStatus = 'Not Milking'; break;
        case 'Heifer': stage = 'Heifer'; reproStatus = 'Open'; milkStatus = 'Not Milking'; break;
        case 'Milking': stage = 'Adult'; reproStatus = 'Milking'; milkStatus = 'Milking'; break;
        case 'Pregnant': stage = 'Adult'; reproStatus = 'Pregnant'; milkStatus = 'Dry'; break;
        case 'Dry': stage = 'Adult'; reproStatus = 'Open'; milkStatus = 'Dry'; break;
      }

      const payload: any = {
        id: formData.id.trim(),
        cowNumber: formData.id.trim(),
        tag1: formData.id.trim(),
        sex: 'Female',
        dob: formData.dob || new Date().toISOString().slice(0, 10),
        breed: 'Unknown',
        group: formData.group || (groups[0] || 'High'),
        stage,
        reproStatus,
        milkStatus,
        status: formData.status || 'Active',
      };
      
      if (formData.originType === 'Purchased') {
        const parsedPrice = parseFloat(formData.purchasePrice || '0');
        payload.purchasePrice = isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice);
        payload.supplier = formData.supplier.trim();
        payload.purchaseDate = new Date().toISOString().slice(0, 10);
      } else {
        payload.purchasePrice = 0;
        payload.supplier = '';
      }

      if (editingAnimal) {
        await api.updateAnimal(editingAnimal.id, payload);
      } else {
        await api.createAnimal(payload);
      }

      setShowAddModal(false);
      loadAnimals();
    } catch (err: any) {
      alert(err.message || 'Error saving animal');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const [profileHealth, setProfileHealth] = useState<any[]>([]);
  const [profileBreeding, setProfileBreeding] = useState<any[]>([]);

  const handleOpenProfile = async (animal: any) => {
    setSelectedAnimalProfile(animal);
    setProfileHealth([]);
    setProfileBreeding([]);
    try {
      const [hist, milk, health, breeding] = await Promise.all([
        api.getTimeline(animal.id),
        api.getAnimalMilkHistory(animal.id),
        api.getHealthCases(animal.id),
        api.getBreedingRecords(animal.id),
      ]);
      setTimeline(hist);
      setAnimalMilkHistory(milk);
      setProfileHealth(health || []);
      setProfileBreeding(breeding || []);
    } catch (err) {
      console.error('Error fetching animal details:', err);
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
      loadAnimals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkDeceased = async () => {
    if (!showDeceasedModal) return;
    if (!deceasedForm.deathReason.trim()) {
      alert('Reason of death is required.');
      return;
    }
    try {
      await api.markDeceased(showDeceasedModal.id, {
        deathDate: deceasedForm.deathDate,
        deathReason: deceasedForm.deathReason,
        notes: deceasedForm.notes,
      });
      setShowDeceasedModal(null);
      loadAnimals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApplyBulkGroup = async () => {
    if (selectedIds.length === 0 || !bulkGroup) return;
    try {
      await api.bulkUpdateGroup(selectedIds, bulkGroup, `Bulk reassignment to ${bulkGroup}`);
      setShowBulkModal(false);
      setSelectedIds([]);
      loadAnimals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredAnimals = animals.filter(a => {
    const q = searchTerm.toLowerCase();
    return (
      (a.id && String(a.id).toLowerCase().includes(q)) ||
      (a.cowNumber && String(a.cowNumber).toLowerCase().includes(q)) ||
      (a.tag1 && String(a.tag1).toLowerCase().includes(q)) ||
      (a.tag2 && String(a.tag2).toLowerCase().includes(q)) ||
      (a.breed && String(a.breed).toLowerCase().includes(q))
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
              placeholder="Search ID, tag, cow number, breed..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          {/* Group Filter */}
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          >
            <option value="Active">Active Herd</option>
            <option value="Sold">Sold</option>
            <option value="Deceased">Deceased</option>
            <option value="">All Statuses</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bulk Action ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Female Animal</span>
          </button>
        </div>
      </div>

      {/* Info notice */}
      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 flex items-center justify-between">
        <span>
          💡 Group assignment is strictly user-controlled. The system does not automatically decide High/Low based on milk.
        </span>
        <span className="font-bold text-stone-800 shrink-0 ml-2">
          {filteredAnimals.length} Female Animals
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 && selectedIds.length === filteredAnimals.length
                    }
                    onChange={e => {
                      if (e.target.checked) setSelectedIds(filteredAnimals.map(a => a.id));
                      else setSelectedIds([]);
                    }}
                    className="rounded text-emerald-600"
                  />
                </th>
                <th className="p-3">Tag Number</th>
                <th className="p-3">Breed</th>
                <th className="p-3">Calculated Age</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Reproductive</th>
                <th className="p-3">Group</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400">
                    No animals found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAnimals.map(animal => {
                  const isSelected = selectedIds.includes(animal.id);
                  return (
                    <tr
                      key={animal.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) setSelectedIds(prev => [...prev, animal.id]);
                            else setSelectedIds(prev => prev.filter(id => id !== animal.id));
                          }}
                          className="rounded text-emerald-600"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {animal.photoUrl ? (
                            <img
                              src={animal.photoUrl}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-stone-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 font-bold flex items-center justify-center text-[10px]">
                              {animal.id.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <span className="font-extrabold text-stone-900 block">{animal.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-stone-800">{animal.breed}</td>
                      <td className="p-3 text-stone-600 font-medium">
                        {animal.calculatedAge || '-'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                          {animal.stage}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            animal.reproStatus === 'Pregnant'
                              ? 'bg-amber-100 text-amber-800'
                              : animal.reproStatus === 'Milking'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {animal.reproStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {animal.group}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            animal.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : animal.status === 'Sold'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {animal.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenProfile(animal)}
                            className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                            title="View Profile & Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(animal)}
                            className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                            title="Edit Animal"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {animal.status === 'Active' && (
                            <>
                              <button
                                onClick={() => {
                                  setShowSoldModal(animal);
                                  setSoldForm({
                                    saleDate: new Date().toISOString().slice(0, 10),
                                    buyer: '',
                                    salePrice: '',
                                    notes: '',
                                  });
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                title="Mark as Sold"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setShowDeceasedModal(animal);
                                  setDeceasedForm({
                                    deathDate: new Date().toISOString().slice(0, 10),
                                    deathReason: '',
                                    notes: '',
                                  });
                                }}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Record Deceased"
                              >
                                <HeartCrack className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={editingAnimal ? `Edit Female Animal: ${editingAnimal.id}` : 'Add New Female Animal'}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="lg"
        footer={
          <>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAnimal}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Animal
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3.5 text-xs">
          <div>
            <label className="block text-stone-600 font-semibold mb-1">
              Tag Number *
            </label>
            <input
              type="text"
              placeholder="e.g. TAG-001"
              value={formData.id}
              disabled={Boolean(editingAnimal)}
              onChange={e => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg bg-stone-50 disabled:bg-stone-100 text-sm font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">
              Date of Birth / Age *
            </label>
            <input
              type="date"
              value={formData.dob}
              onChange={e => setFormData({ ...formData, dob: e.target.value })}
              className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">
              Origin (Kahan paida hui?)
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="origin" 
                  checked={formData.originType === 'Farm Born'} 
                  onChange={() => setFormData({...formData, originType: 'Farm Born'})} 
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="font-medium text-stone-700">Born on Farm</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="origin" 
                  checked={formData.originType === 'Purchased'} 
                  onChange={() => setFormData({...formData, originType: 'Purchased'})} 
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="font-medium text-stone-700">Purchased (Kharidi gai)</span>
              </label>
            </div>
          </div>

          {formData.originType === 'Purchased' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Seller / Supplier Name</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Purchase Price (Rs)</label>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-stone-600 font-semibold mb-1">
              Current State (Ye cow abhi kis category me hai?) *
            </label>
            <select
              value={formData.simpleState}
              onChange={e => setFormData({ ...formData, simpleState: e.target.value })}
              className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg bg-white font-semibold text-stone-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="Calf">Calf (Bachi / Choti hai)</option>
              <option value="Heifer">Heifer (Nai gai - ready for breeding)</option>
              <option value="Milking">Milking (Doodh de rahi hai)</option>
              <option value="Pregnant">Pregnant (Gabban / Dry)</option>
              <option value="Dry">Dry (Doodh sookh gaya / Open)</option>
            </select>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">
              Group (Feeding Group / Bada) *
            </label>
            <select
              value={formData.group}
              onChange={e => setFormData({ ...formData, group: e.target.value })}
              className="w-full px-3 py-2 border-2 border-stone-300 rounded-lg bg-white font-semibold text-stone-700 focus:border-emerald-500 focus:outline-none"
            >
              {groups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-stone-500">Naye groups banane ke liye Settings me jayen.</p>
          </div>
        </div>
      </Modal>

      {/* Animal Profile Modal */}
      <Modal
        title={`Animal Profile — ${selectedAnimalProfile?.id || ''}`}
        isOpen={Boolean(selectedAnimalProfile)}
        onClose={() => setSelectedAnimalProfile(null)}
        maxWidth="xl"
      >
        {selectedAnimalProfile && (
          <div className="space-y-4 text-xs">
            {/* Top overview card */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
              {selectedAnimalProfile.photoUrl ? (
                <img
                  src={selectedAnimalProfile.photoUrl}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border border-stone-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-stone-200 text-stone-600 font-black text-xl flex items-center justify-center">
                  {selectedAnimalProfile.id.slice(0, 3)}
                </div>
              )}
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-stone-900">
                  {selectedAnimalProfile.id}
                </h3>
                <div className="text-stone-500 font-medium">
                  {selectedAnimalProfile.breed} · Calculated Age: {selectedAnimalProfile.calculatedAge}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    Group: {selectedAnimalProfile.group}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                    Repro: {selectedAnimalProfile.reproStatus}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800">
                    Milk: {selectedAnimalProfile.milkStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Milk Production Chart */}
            {animalMilkHistory.length > 0 && (() => {
              const last14 = animalMilkHistory.slice(-14);
              const maxVal = Math.max(...last14.map((m: any) => m.litres || 0), 1);
              return (
                <div className="space-y-2">
                  <h4 className="font-bold text-stone-800">📊 Milk Production Chart (Last 14 Days)</h4>
                  <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                    <div className="flex items-end gap-1 h-24">
                      {last14.map((m: any, i: number) => {
                        const pct = ((m.litres || 0) / maxVal) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                            <div
                              className="absolute -top-6 opacity-0 group-hover:opacity-100 bg-stone-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity"
                            >
                              {m.litres}L
                            </div>
                            <div
                              className="w-full rounded-t bg-emerald-400 group-hover:bg-emerald-500 transition-colors"
                              style={{ height: `${Math.max(pct, 4)}%` }}
                            />
                            <span className="text-[8px] text-stone-400 rotate-45 origin-left mt-0.5">{(m.date || '').slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[9px] text-stone-400 mt-1">
                      <span>0 L</span>
                      <span>{maxVal} L (peak)</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Health & Breeding side by side */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <h4 className="font-bold text-stone-800">❤️ Medical History</h4>
                {profileHealth.length === 0 ? (
                  <div className="p-3 text-center text-stone-400 bg-stone-50 rounded-lg">No medical records.</div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {profileHealth.map((hc: any, i: number) => (
                      <div key={i} className="p-2 bg-rose-50 border border-rose-100 rounded-lg">
                        <div className="flex justify-between font-bold text-stone-700">
                          <span>{hc.diagnosis}</span>
                          <span className="text-stone-400">{hc.date}</span>
                        </div>
                        <div className="text-stone-500 text-[10px] mt-0.5">{hc.treatment || 'No treatment details'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-stone-800">🔬 Breeding Records</h4>
                {profileBreeding.length === 0 ? (
                  <div className="p-3 text-center text-stone-400 bg-stone-50 rounded-lg">No breeding events.</div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {profileBreeding.map((br: any, i: number) => (
                      <div key={i} className="p-2 bg-purple-50 border border-purple-100 rounded-lg">
                        <div className="flex justify-between font-bold text-stone-700">
                          <span>{br.type}</span>
                          <span className="text-stone-400">{br.date}</span>
                        </div>
                        <div className="text-stone-500 text-[10px] mt-0.5">
                          {br.isSuccessful ? '✅ Successful' : br.isSuccessful === false ? '❌ Failed' : '⏳ Pending'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Milk history summary */}
            <div className="space-y-2">
              <h4 className="font-bold text-stone-800 flex items-center justify-between">
                <span>🥛 Recent Milking Entries</span>
                <span className="text-[10px] text-stone-500">Last 10 records</span>
              </h4>
              {animalMilkHistory.length === 0 ? (
                <div className="p-3 text-center text-stone-400 bg-stone-50 rounded-lg">
                  No individual milk records recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-stone-100 rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-stone-50 text-stone-500">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Shift</th>
                        <th className="p-2">Litres</th>
                        <th className="p-2">Fat %</th>
                        <th className="p-2">SNF %</th>
                        <th className="p-2">Reason/Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {animalMilkHistory.slice(0, 8).map(m => (
                        <tr key={m.id}>
                          <td className="p-2">{m.date}</td>
                          <td className="p-2 font-medium">{m.shift}</td>
                          <td className="p-2 font-bold text-emerald-800">{m.litres} L</td>
                          <td className="p-2">{m.fatPercent ? `${m.fatPercent}%` : '-'}</td>
                          <td className="p-2">{m.snfPercent ? `${m.snfPercent}%` : '-'}</td>
                          <td className="p-2 text-stone-500">{m.reason || m.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Chronological Timeline */}
            <div className="space-y-2">
              <h4 className="font-bold text-stone-800">📜 Audit & Status History</h4>
              {timeline.length === 0 ? (
                <div className="p-3 text-center text-stone-400 bg-stone-50 rounded-lg">
                  No historical status changes recorded.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {timeline.map(t => (
                    <div
                      key={t.id}
                      className="p-2 bg-stone-50 border border-stone-100 rounded-lg flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-stone-800">{t.changeType} Change: </span>
                        <span className="line-through text-stone-400 mr-1">{t.oldValue}</span>
                        <span className="font-bold text-emerald-700">{t.newValue}</span>
                        {t.reason && <div className="text-[10px] text-stone-500">{t.reason}</div>}
                      </div>
                      <div className="text-right text-[10px] text-stone-400">
                        <div>{t.date}</div>
                        <div>{t.user}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Mark Sold Modal */}
      <Modal
        title={`Record Sale of Animal: ${showSoldModal?.id || ''}`}
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
              placeholder="e.g. Haji Aslam Farm"
              value={soldForm.buyer}
              onChange={e => setSoldForm({ ...soldForm, buyer: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Sale Price (Rs.) *</label>
            <input
              type="number"
              placeholder="e.g. 250000"
              value={soldForm.salePrice}
              onChange={e => setSoldForm({ ...soldForm, salePrice: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Terms or transportation..."
              value={soldForm.notes}
              onChange={e => setSoldForm({ ...soldForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Mark Deceased Modal */}
      <Modal
        title={`Record Death: ${showDeceasedModal?.id || ''}`}
        isOpen={Boolean(showDeceasedModal)}
        onClose={() => setShowDeceasedModal(null)}
        footer={
          <>
            <button
              onClick={() => setShowDeceasedModal(null)}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkDeceased}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              Confirm Deceased
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Death Date *</label>
            <input
              type="date"
              value={deceasedForm.deathDate}
              onChange={e => setDeceasedForm({ ...deceasedForm, deathDate: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Reason / Diagnosis *</label>
            <input
              type="text"
              placeholder="e.g. Acute Bloat, Heat Stroke, Old Age"
              value={deceasedForm.deathReason}
              onChange={e => setDeceasedForm({ ...deceasedForm, deathReason: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Vet inspection, post-mortem..."
              value={deceasedForm.notes}
              onChange={e => setDeceasedForm({ ...deceasedForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        title={`Bulk Group Assignment (${selectedIds.length} Cows)`}
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowBulkModal(false)}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyBulkGroup}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg"
            >
              Assign to Group
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600">
            Reassign all {selectedIds.length} selected cows to a new farm management group. This action is fully auditable.
          </p>
          <div>
            <label className="block text-stone-700 font-bold mb-1">Select Target Group</label>
            <select
              value={bulkGroup}
              onChange={e => setBulkGroup(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
            >
              {groups.map(g => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
