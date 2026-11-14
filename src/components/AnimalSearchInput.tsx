import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface Animal {
  id: string;
  breed?: string;
}

interface AnimalSearchInputProps {
  animals: Animal[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export const AnimalSearchInput: React.FC<AnimalSearchInputProps> = ({
  animals,
  value,
  onChange,
  placeholder = 'Select animal...',
}) => {
  const [search, setSearch] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== search) {
      setSearch(value || '');
    }
  }, [value]);

  // Click-outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filtered = useMemo(() => {
    const lower = search.toLowerCase().trim();
    if (!lower) return animals;
    return animals.filter(
      a =>
        a.id.toLowerCase().includes(lower) ||
        (a.breed && a.breed.toLowerCase().includes(lower))
    );
  }, [search, animals]);

  const handleSelect = (id: string) => {
    onChange(id);
    setSearch(id);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange('');
            }
          }}
          className="w-full px-3 py-1.5 pr-8 border border-stone-200 rounded-lg bg-white text-stone-800 focus:outline-none focus:border-emerald-600 text-xs font-medium"
        />
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 p-0.5 text-stone-400 hover:text-stone-600 rounded cursor-pointer"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-stone-200 rounded-lg shadow-lg text-xs divide-y divide-stone-100">
          {filtered.slice(0, 50).map(a => (
            <li
              key={a.id}
              onClick={() => handleSelect(a.id)}
              className={`px-3 py-2 cursor-pointer hover:bg-emerald-50 transition-colors flex items-center justify-between ${
                a.id === value ? 'bg-emerald-50/70 font-bold text-emerald-900' : 'text-stone-700'
              }`}
            >
              <span>{a.id}</span>
              {a.breed && (
                <span className="text-[10px] text-stone-400 font-normal">{a.breed}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOpen && filtered.length === 0 && search && (
        <div className="absolute z-30 left-0 right-0 mt-1 p-3 bg-white border border-stone-200 rounded-lg shadow-lg text-xs text-stone-400 text-center">
          No matching animals found.
        </div>
      )}

      {/* Hidden input to bind selected value for standard form submissions */}
      <input type="hidden" value={value} />
    </div>
  );
};
