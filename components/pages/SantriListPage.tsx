'use client';

import { Search, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Santri {
  id: number;
  name: string;
  level: string;
  status: 'hadir' | 'alpa' | 'sakit';
  slug: string;
}

interface SantriListPageProps {
  onNavigate: (page: string) => void;
}

export default function SantriListPage({ onNavigate }: SantriListPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const santris: Santri[] = [
    { id: 1, name: 'Ahmad Fauzi', slug: 'ahmad-fauzi-x9a', level: 'Iqro 4', status: 'hadir' },
    { id: 2, name: 'Budi Santoso', slug: 'budi-santoso-y8b', level: 'Iqro 5', status: 'alpa' },
    { id: 3, name: 'Siti Aminah', slug: 'siti-aminah-z7c', level: 'Juz 1', status: 'hadir' },
    { id: 4, name: 'Rizky Ramadhan', slug: 'rizky-ramadhan-a1d', level: 'Iqro 2', status: 'sakit' },
    { id: 5, name: 'Novia Handayani', slug: 'novia-handayani-b2e', level: 'Iqro 3', status: 'hadir' },
    { id: 6, name: 'Hafiz Abdullah', slug: 'hafiz-abdullah-c3f', level: 'Juz 2', status: 'hadir' },
  ];

  const filteredSantris = santris.filter(santri =>
    santri.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    santri.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hadir':
        return 'bg-emerald-100 text-emerald-700';
      case 'alpa':
        return 'bg-red-100 text-red-700';
      case 'sakit':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-4 pb-24">
      {/* Search */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari santri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Santri List */}
      <div className="space-y-2">
        {filteredSantris.map((santri) => (
          <button
            key={santri.id}
            onClick={() => onNavigate('santri-detail')}
            className="w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex items-center justify-between"
          >
            <div className="text-left">
              <h4 className="font-bold text-slate-800 text-sm mb-1">{santri.name}</h4>
              <p className="text-xs text-slate-500 mb-2">{santri.level}</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(santri.status)}`}>
                {santri.status.charAt(0).toUpperCase() + santri.status.slice(1)}
              </span>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </button>
        ))}
      </div>

      {filteredSantris.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">Tidak ada santri ditemukan</p>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 bg-slate-100 rounded-xl p-4 text-center">
        <p className="text-sm text-slate-600">
          Total: <span className="font-bold text-emerald-600">{filteredSantris.length}</span> Santri
        </p>
      </div>
    </div>
  );
}
