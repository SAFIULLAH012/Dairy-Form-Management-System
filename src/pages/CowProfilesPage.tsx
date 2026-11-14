import React, { useEffect, useState, useRef } from 'react';
import { api } from '../client/api.ts';
import {
  Search,
  X,
  ArrowLeft,
  Milk,
  Heart,
  Dna,
  Activity,
  Calendar,
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// ─── Mini bar chart using canvas-free SVG ───────────────────────────────────
const MilkSparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#16a34a' }) => {
  if (!data || data.length === 0) return <span className="text-[10px] text-stone-400">No data</span>;
  const max = Math.max(...data, 0.1);
  const w = 160;
  const h = 40;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / max) * h;
        return <circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
      })}
    </svg>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcAge(dob: string): string {
  if (!dob) return '–';
  const diff = Date.now() - new Date(dob).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months} mo`;
  return `${Math.floor(months / 12)}y ${months % 12}mo`;
}

function statusColor(status: string) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (status === 'Sold') return 'bg-blue-100 text-blue-800 border-blue-300';
  return 'bg-rose-100 text-rose-800 border-rose-300';
}

function reproColor(repro: string) {
  if (repro === 'Pregnant') return 'bg-amber-100 text-amber-800';
  if (repro === 'Milking') return 'bg-emerald-100 text-emerald-800';
  if (repro === 'Dry') return 'bg-stone-100 text-stone-700';
  return 'bg-purple-100 text-purple-800';
}

// ─── Cow Card (grid item) ─────────────────────────────────────────────────────
const CowCard: React.FC<{ animal: any; onClick: () => void }> = ({ animal, onClick }) => {
  const initials = (animal.id || 'XX').slice(0, 2).toUpperCase();
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left overflow-hidden group cursor-pointer w-full"
    >
      {/* Photo / Avatar */}
      <div className="relative h-28 bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center overflow-hidden">
        {animal.photoUrl ? (
          <img src={animal.photoUrl} alt={animal.id} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-black text-xl flex items-center justify-center shadow-md">
              {initials}
            </div>
            <span className="text-[10px] text-stone-400">No photo</span>
          </div>
        )}
        {/* Sex badge */}
        <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
          animal.sex === 'Female' ? 'bg-pink-100 text-pink-700 border-pink-300' : 'bg-sky-100 text-sky-700 border-sky-300'
        }`}>
          {animal.sex === 'Female' ? '♀ Female' : '♂ Male'}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <div className="font-extrabold text-stone-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
            {animal.id}
          </div>
          {animal.tag1 && (
            <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
              <Tag className="w-2.5 h-2.5" /> {animal.tag1}
            </div>
          )}
        </div>

        <div className="text-[10px] text-stone-600 font-medium">{animal.breed || '–'}</div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${statusColor(animal.status)}`}>
            {animal.status}
          </span>
          {animal.reproStatus && (
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${reproColor(animal.reproStatus)}`}>
              {animal.reproStatus}
            </span>
          )}
        </div>

        <div className="flex justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-100">
          <span>🎂 {calcAge(animal.dob)}</span>
          <span className="text-emerald-700 font-bold">{animal.group || '–'}</span>
        </div>
      </div>
    </button>
  );
};

// ─── Profile Detail Panel ─────────────────────────────────────────────────────
const CowProfilePanel: React.FC<{ animal: any; onClose: () => void }> = ({ animal, onClose }) => {
  const [milkHistory, setMilkHistory] = useState<any[]>([]);
  const [healthCases, setHealthCases] = useState<any[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [milk, health, breeding, hist] = await Promise.all([
          api.getAnimalMilkHistory(animal.id),
          api.getHealthCases(animal.id),
          api.getBreedingRecords(animal.id),
          api.getTimeline(animal.id),
        ]);
        setMilkHistory(milk || []);
        setHealthCases(health || []);
        setBreedingRecords(breeding || []);
        setTimeline(hist || []);
      } catch (e) {
        console.error('Failed to load animal detail', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [animal.id]);

  const milkValues = milkHistory.slice(0, 14).map((m: any) => m.litres || 0).reverse();
  const avgMilk = milkValues.length > 0 ? milkValues.reduce((a, b) => a + b, 0) / milkValues.length : 0;
  const trend = milkValues.length >= 3
    ? milkValues[milkValues.length - 1] > milkValues[0] ? 'up' : milkValues[milkValues.length - 1] < milkValues[0] ? 'down' : 'flat'
    : 'flat';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#103b2a] to-[#1a5c40] text-white p-5 flex items-start gap-4">
          <button onClick={onClose} className="mt-0.5 p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-black truncate">{animal.id}</div>
            <div className="text-emerald-200 text-sm">{animal.breed} · {animal.sex}</div>
          </div>
          {animal.photoUrl && (
            <img src={animal.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white/50 shadow" />
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Key stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Age', value: calcAge(animal.dob), icon: Calendar, color: 'text-amber-600' },
                { label: 'Group', value: animal.group || '–', icon: Activity, color: 'text-emerald-700' },
                { label: 'Stage', value: animal.stage || '–', icon: Tag, color: 'text-blue-600' },
              ].map(s => (
                <div key={s.label} className="bg-stone-50 rounded-xl p-3 text-center border border-stone-200">
                  <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                  <div className="font-extrabold text-stone-900 text-sm">{s.value}</div>
                  <div className="text-[10px] text-stone-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor(animal.status)}`}>
                {animal.status}
              </span>
              {animal.reproStatus && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${reproColor(animal.reproStatus)}`}>
                  {animal.reproStatus}
                </span>
              )}
              {animal.milkStatus && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                  🥛 {animal.milkStatus}
                </span>
              )}
            </div>

            {/* Milk Production Chart */}
            {animal.sex === 'Female' && (
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Milk className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-stone-800 text-sm">Milk Production (last 14 days)</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold">
                    {trend === 'up' && <><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-700">Improving</span></>}
                    {trend === 'down' && <><TrendingDown className="w-3.5 h-3.5 text-rose-600" /><span className="text-rose-700">Declining</span></>}
                    {trend === 'flat' && <><Minus className="w-3.5 h-3.5 text-stone-500" /><span className="text-stone-600">Stable</span></>}
                  </div>
                </div>

                {milkValues.length > 0 ? (
                  <>
                    <MilkSparkline data={milkValues} />
                    <div className="mt-3 flex justify-between text-[11px] text-stone-500 border-t border-stone-100 pt-2">
                      <span>Avg: <strong className="text-stone-800">{avgMilk.toFixed(1)}L/day</strong></span>
                      <span>Peak: <strong className="text-emerald-700">{Math.max(...milkValues).toFixed(1)}L</strong></span>
                      <span>Entries: <strong className="text-stone-800">{milkValues.length}</strong></span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-stone-400 text-xs">
                    No individual milk entries recorded for this cow.
                    <br />Record milk in the Milk Production page.
                  </div>
                )}
              </div>
            )}

            {/* Health History */}
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-stone-800 text-sm">Health Cases</span>
                <span className="ml-auto text-xs text-stone-400">{healthCases.length} records</span>
              </div>
              {healthCases.length === 0 ? (
                <div className="flex items-center gap-2 py-3 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3">
                  <CheckCircle2 className="w-4 h-4" />
                  No health issues recorded. Animal is healthy!
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {healthCases.map((h: any, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs p-2.5 bg-rose-50 border border-rose-100 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-stone-800">{h.diagnosis || h.title || 'Health Case'}</div>
                        <div className="text-stone-500">{h.date || h.createdAt || ''} · {h.treatment || h.notes || ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Breeding Records */}
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Dna className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-stone-800 text-sm">Breeding Records</span>
                <span className="ml-auto text-xs text-stone-400">{breedingRecords.length} records</span>
              </div>
              {breedingRecords.length === 0 ? (
                <div className="text-xs text-stone-400 text-center py-4">No breeding records yet.</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {breedingRecords.map((b: any, i) => (
                    <div key={i} className="text-xs p-2.5 bg-purple-50 border border-purple-100 rounded-lg">
                      <div className="font-bold text-stone-800">{b.method || 'AI/Natural'} · {b.date || b.breedingDate}</div>
                      <div className="text-stone-500">{b.sireId ? `Sire: ${b.sireId}` : ''} {b.result ? `· ${b.result}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            {timeline.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-stone-800 text-sm">Activity Timeline</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {timeline.slice(0, 10).map((t: any, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium text-stone-700">{t.changeType || t.eventType || 'Event'}</span>
                        {t.newValue && <span className="text-stone-500"> → {t.newValue}</span>}
                        <div className="text-stone-400">{t.date || t.createdAt || ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic info */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <div className="font-bold text-stone-700 text-xs mb-3 uppercase tracking-wide">Animal Details</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {[
                  ['ID', animal.id],
                  ['Cow #', animal.cowNumber || '–'],
                  ['Tag 1', animal.tag1 || '–'],
                  ['Tag 2', animal.tag2 || '–'],
                  ['DOB', animal.dob || '–'],
                  ['Breed', animal.breed || '–'],
                  ['Supplier', animal.supplier || '–'],
                  ['Purchase Date', animal.purchaseDate || '–'],
                  ['Purchase Price', animal.purchasePrice ? `₨${animal.purchasePrice.toLocaleString()}` : '–'],
                  ['Notes', animal.notes || '–'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-stone-400">{k}: </span>
                    <span className="font-medium text-stone-800 break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const CowProfilesPage: React.FC = () => {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sexFilter, setSexFilter] = useState<'All' | 'Female' | 'Male'>('All');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [selectedAnimal, setSelectedAnimal] = useState<any | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await api.getAnimals({ status: statusFilter || undefined });
      setAnimals(data);
    } catch (err) {
      console.error('Failed to load animals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [statusFilter]);

  const filtered = animals.filter(a => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      String(a.id || '').toLowerCase().includes(q) ||
      String(a.tag1 || '').toLowerCase().includes(q) ||
      String(a.breed || '').toLowerCase().includes(q) ||
      String(a.cowNumber || '').toLowerCase().includes(q);
    const matchSex = sexFilter === 'All' || a.sex === sexFilter;
    return matchSearch && matchSex;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Toolbar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search ID, tag, breed, cow number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2 cursor-pointer">
              <X className="w-3.5 h-3.5 text-stone-400" />
            </button>
          )}
        </div>

        {/* Sex filter */}
        <div className="flex rounded-lg overflow-hidden border border-stone-200 text-xs font-bold">
          {(['All', 'Female', 'Male'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSexFilter(s)}
              className={`px-3 py-1.5 cursor-pointer transition-colors ${sexFilter === s ? 'bg-[#16734b] text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
            >
              {s === 'Female' ? '♀ Female' : s === 'Male' ? '♂ Male' : 'All'}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
        >
          <option value="Active">Active</option>
          <option value="Sold">Sold</option>
          <option value="Deceased">Deceased</option>
          <option value="">All Statuses</option>
        </select>

        <span className="ml-auto text-xs font-bold text-stone-500">
          {filtered.length} animals
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-16 text-center text-stone-400">
          <div className="text-4xl mb-3">🐄</div>
          <div className="font-bold text-stone-600 mb-1">No animals found</div>
          <div className="text-xs">Add animals using Female Cows or Male Animals tabs in the sidebar.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(animal => (
            <CowCard
              key={animal.id || Math.random()}
              animal={animal}
              onClick={() => setSelectedAnimal(animal)}
            />
          ))}
        </div>
      )}

      {/* Profile Slide-in Panel */}
      {selectedAnimal && (
        <CowProfilePanel
          animal={selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
        />
      )}
    </div>
  );
};
