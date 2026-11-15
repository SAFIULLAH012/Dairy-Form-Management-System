import React, { useEffect, useState } from 'react';
import { api } from '../api/api.ts';
import { Modal } from './Modal.tsx';
import { Activity, Beaker, Heart, Calendar, ArrowUpRight, ArrowDownRight, Printer } from 'lucide-react';
import { calculateAge } from '../domain/calculations.ts';

interface AnimalProfileModalProps {
  animalId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AnimalProfileModal: React.FC<AnimalProfileModalProps> = ({ animalId, isOpen, onClose }) => {
  const [animal, setAnimal] = useState<any | null>(null);
  const [milkHistory, setMilkHistory] = useState<any[]>([]);
  const [healthCases, setHealthCases] = useState<any[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && animalId) {
      loadProfile(animalId);
    }
  }, [isOpen, animalId]);

  const loadProfile = async (id: string) => {
    setLoading(true);
    try {
      const [animRes, milkRes, healthRes, breedRes] = await Promise.all([
        api.getAnimal(id),
        api.getAnimalMilkHistory(id),
        api.getHealthCases(id),
        api.getBreedingRecords(id)
      ]);
      setAnimal(animRes);
      setMilkHistory(milkRes || []);
      setHealthCases(healthRes || []);
      setBreedingRecords(breedRes || []);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !animalId) return null;

  // Process milk data for simple bar chart
  const last14Days = milkHistory.slice(-14);
  const getYield = (m: any) => Number(m.litres ?? m.yield ?? 0);
  const maxMilk = Math.max(...last14Days.map(getYield), 10); // Minimum scale 10

  return (
    <Modal
      title={`Cow Profile: ${animal?.id || animalId}`}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-stone-500">Official BA Dairy Herd Management Dossier</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Passport</span>
            </button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="py-10 text-center text-stone-500 animate-pulse">Loading profile data...</div>
      ) : (
        <div className="printable-sheet space-y-6">
          
          {/* Header Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <div className="text-stone-400 text-[10px] uppercase font-bold tracking-wider mb-1">Breed</div>
              <div className="font-bold text-stone-800">{animal?.breed || '-'}</div>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <div className="text-stone-400 text-[10px] uppercase font-bold tracking-wider mb-1">Age</div>
              <div className="font-bold text-stone-800">
                {animal?.dob ? calculateAge(animal.dob).display : (animal?.calculatedAge || '-')}
              </div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <div className="text-emerald-600 text-[10px] uppercase font-bold tracking-wider mb-1">Milk Status</div>
              <div className="font-bold text-emerald-900">{animal?.milkStatus || '-'}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <div className="text-blue-600 text-[10px] uppercase font-bold tracking-wider mb-1">Repro Status</div>
              <div className="font-bold text-blue-900">{animal?.reproStatus || '-'}</div>
            </div>
          </div>

          {/* Milk Performance Chart (CSS based) */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Beaker className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-stone-800 text-sm">Recent Milk Production (Last 14 Days)</h3>
            </div>
            
            {last14Days.length > 0 ? (
              <div className="h-32 flex items-end gap-1.5 mt-4">
                {last14Days.map((m, i) => {
                  const yVal = getYield(m);
                  const heightPct = Math.min(100, Math.max(0, (yVal / maxMilk) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-stone-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {m.date}: {yVal.toFixed(1)} L
                      </div>
                      <div 
                        className="w-full bg-emerald-100 rounded-t-sm relative overflow-hidden group-hover:bg-emerald-200 transition-colors"
                        style={{ height: `${heightPct}%` }}
                      >
                        <div className="absolute bottom-0 w-full bg-emerald-500 rounded-t-sm" style={{ height: '100%' }}></div>
                      </div>
                      <span className="text-[8px] text-stone-400 rotate-45 origin-left mt-1">{m.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-stone-400 text-center py-6">No milk records found.</div>
            )}
          </div>

          {/* Health & Breeding Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            
            {/* Health Cases */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-stone-800 text-sm">Medical History</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {healthCases.length > 0 ? healthCases.map((hc, i) => (
                  <div key={i} className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-xs">
                    <div className="flex justify-between font-bold text-stone-700 mb-1">
                      <span>{hc.diagnosis || hc.problem || 'Medical Case'}</span>
                      <span className="text-stone-400">{hc.date}</span>
                    </div>
                    <div className="text-stone-500 text-[11px] truncate">
                      {hc.medicine ? `${hc.medicine}${hc.dose ? ` (${hc.dose})` : ''}` : (hc.treatment || hc.notes || 'No treatment details')}
                    </div>
                  </div>
                )) : (
                  <div className="text-xs text-stone-400">No medical issues recorded.</div>
                )}
              </div>
            </div>

            {/* Breeding */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-stone-800 text-sm">Breeding Records</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {breedingRecords.length > 0 ? breedingRecords.map((br, i) => (
                  <div key={i} className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-xs">
                    <div className="flex justify-between font-bold text-stone-700 mb-1">
                      <span>{br.event || br.type || 'Breeding Event'}</span>
                      <span className="text-stone-400">{br.date}</span>
                    </div>
                    <div className="text-stone-500 text-[11px]">
                      {br.status === 'Completed' || br.isSuccessful ? 'Successful' : (br.status === 'Failed' || br.isSuccessful === false ? 'Failed' : (br.status || 'Pending Check'))}
                      {br.sireBreedOrId ? ` · Sire: ${br.sireBreedOrId}` : ''}
                    </div>
                  </div>
                )) : (
                  <div className="text-xs text-stone-400">No breeding events recorded.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </Modal>
  );
};
