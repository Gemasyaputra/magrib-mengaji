'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, User, Calendar } from 'lucide-react';

interface PresensiDetailPageProps {
  onNavigate: (page: string) => void;
  date?: string | null;
  groupId?: string | null;
}

interface AttendanceDetail {
  id: number;
  student_id: number;
  student_name: string;
  status: string;
  notes?: string;
  group_name?: string;
}

export default function PresensiDetailPage({ onNavigate, date, groupId }: PresensiDetailPageProps) {
  const [details, setDetails] = useState<AttendanceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState<string>('');

  useEffect(() => {
    if (!date) {
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const dateOnly = date.split('T')[0];
        let url = `/api/attendance?date=${dateOnly}`;
        if (groupId) url += `&group_id=${groupId}`;

        const res = await fetch(url);
        const json = await res.json();
        
        if (json.success && Array.isArray(json.data)) {
          setDetails(json.data);
          if (json.data.length > 0) {
            setGroupName(json.data[0].group_name || 'Semua Kelompok');
          }
        } else {
            setDetails([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [date, groupId]);

  const formatDate = (d: string) => {
    try {
        return new Date(d).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return d;
    }
  };

  const counts = { HADIR: 0, SAKIT: 0, IZIN: 0, ALPA: 0 };
  details.forEach((h) => {
    const s = h.status?.toUpperCase().trim();
    if (s === 'HADIR') counts.HADIR++;
    else if (s === 'SAKIT') counts.SAKIT++;
    else if (s === 'IZIN') counts.IZIN++;
    else counts.ALPA++;
  });

  if (loading) {
    return (
        <div className="p-4 flex items-center justify-center min-h-screen">
            <p className="text-slate-500">Memuat data...</p>
        </div>
    );
  }

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => onNavigate('presensi')} 
          className="p-2 bg-white rounded-full shadow-sm text-slate-600 hover:text-emerald-600 border border-slate-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-bold text-lg text-slate-800">Detail Kehadiran</h1>
          <p className="text-xs text-slate-500">{date ? formatDate(date) : '-'}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
            <p className="text-xl font-bold text-emerald-600">{counts.HADIR}</p>
            <p className="text-[10px] font-bold text-emerald-600 uppercase">Hadir</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl text-center">
            <p className="text-xl font-bold text-yellow-500">{counts.SAKIT}</p>
            <p className="text-[10px] font-bold text-yellow-500 uppercase">Sakit</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-center">
            <p className="text-xl font-bold text-blue-500">{counts.IZIN}</p>
            <p className="text-[10px] font-bold text-blue-500 uppercase">Izin</p>
        </div>
        <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-center">
            <p className="text-xl font-bold text-red-500">{counts.ALPA}</p>
            <p className="text-[10px] font-bold text-red-500 uppercase">Alpa</p>
        </div>
      </div>

      {/* Group Info if available */}
      {groupName && (
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-100 mb-4 inline-block shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase mr-2">Kelompok:</span>
            <span className="text-sm font-bold text-slate-700">{groupName}</span>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {details.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Data tidak ditemukan.</div>
        ) : (
            <div className="divide-y divide-slate-50">
                {details.map((h) => (
                    <div key={h.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                h.status?.toUpperCase() === 'HADIR' ? 'bg-emerald-100 text-emerald-600' :
                                h.status?.toUpperCase() === 'SAKIT' ? 'bg-yellow-100 text-yellow-600' :
                                h.status?.toUpperCase() === 'IZIN' ? 'bg-blue-100 text-blue-600' :
                                'bg-red-100 text-red-600'
                            }`}>
                                {h.student_name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{h.student_name}</span>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            h.status?.toUpperCase().trim() === 'HADIR' ? 'bg-emerald-100 text-emerald-700' :
                            h.status?.toUpperCase().trim() === 'SAKIT' ? 'bg-yellow-100 text-yellow-700' :
                            h.status?.toUpperCase().trim() === 'IZIN' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                            {h.status?.toUpperCase().trim() === 'ALFA' ? 'ALPA' : h.status?.toUpperCase().trim()}
                        </span>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
