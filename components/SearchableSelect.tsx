'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  className = '',
  searchPlaceholder = 'Cari...',
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch(''); // Reset search on close
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setIsOpen(!isOpen); setSearch(''); } }}
        className={`w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-left transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 focus:outline-none focus:border-emerald-500'
        }`}
      >
        <span className={selectedOption ? 'text-slate-700 font-medium' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50 sticky top-0">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700 placeholder-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >✕</button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-3 text-slate-400 text-xs">Tidak ditemukan</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left rounded-lg transition-colors ${
                    String(value) === String(opt.value)
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {String(value) === String(opt.value) && <Check size={14} className="text-emerald-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
