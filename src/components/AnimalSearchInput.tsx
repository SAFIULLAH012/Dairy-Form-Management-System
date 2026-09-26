import React, { useState, useMemo } from 'react';

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

export const AnimalSearchInput: React.FC<AnimalSearchInputProps> = ({ animals, value, onChange, placeholder = 'Select animal...' }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return animals.filter(a => a.id.toLowerCase().includes(lower) || (a.breed && a.breed.toLowerCase().includes(lower)));
  }, [search, animals]);

  const handleSelect = (id: string) => {
    onChange(id);
    setSearch('');
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-emerald-600"
      />
      {search && filtered.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-stone-200 rounded shadow-lg">
          {filtered.map(a => (
            <li
              key={a.id}
              onClick={() => handleSelect(a.id)}
              className="px-3 py-2 cursor-pointer hover:bg-emerald-50"
            >
              {a.id}{a.breed ? ` (${a.breed})` : ''}
            </li>
          ))}
        </ul>
      )}
      {/* Hidden input to bind selected value for forms */}
      <input type="hidden" value={value} />
    </div>
  );
};

