'use client';

import { User, BarChart3, MessageCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SantriDetailPageProps {
  onNavigate: (page: string) => void;
  santriId?: string | null;
}

interface SantriData {
  id: number;
  name: string;
  current_level: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  mosque_name?: string;
  group_name?: string | null;
  created_at?: string;
}

export default function SantriDetailPage({ onNavigate, santriId }: SantriDetailPageProps) {
  const [santri, setSantri] = useState<SantriData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!santriId) {
      setSantri(null);
      setLoading(false);
      return;
    }
    const fetchSantri = async () => {
      try {
        const res = await fetch(`/api/students?id=${santriId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setSantri(json.data);
        } else {
          setSantri(null);
        }
      } catch {
        setSantri(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSantri();
  }, [santriId]);

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const [history, setHistory] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [worshipHistory, setWorshipHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!santriId) return;
    
    // Fetch Learning History
    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/learning-records?student_id=${santriId}&limit=10`);
            const json = await res.json();
             if (json.success && Array.isArray(json.data)) {
                 setHistory(json.data);
            } else if (Array.isArray(json.data)) { 
                setHistory(json.data);
            } else if (Array.isArray(json)) {
                setHistory(json);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Fetch Attendance History
    const fetchAttendance = async () => {
        try {
            const resAtt = await fetch(`/api/attendance?student_id=${santriId}`);
            const jsonAtt = await resAtt.json();
             if (jsonAtt.success && Array.isArray(jsonAtt.data)) {
                 setAttendanceHistory(jsonAtt.data);
            } else if (Array.isArray(jsonAtt.data)) {
                setAttendanceHistory(jsonAtt.data);
            } else if (Array.isArray(jsonAtt)) {
                setAttendanceHistory(jsonAtt);
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Fetch Worship History
    const fetchWorship = async () => {
        try {
            const res = await fetch(`/api/worship-records?student_id=${santriId}`);
            const json = await res.json();
             if (json.success && Array.isArray(json.data)) {
                 setWorshipHistory(json.data);
            } else {
                setWorshipHistory([]);
            }
        } catch (err) {
            console.error(err);
        }
    }

    fetchHistory();
    fetchAttendance();
    fetchWorship();
  }, [santriId]);

  if (loading) {
    return (
      <div className="p-4 pb-24 text-center text-slate-500">Memuat data santri...</div>
    );
  }

  if (!santri) {
    return (
      <div className="p-4 pb-24 text-center">
        <p className="text-slate-500 mb-4">Santri tidak ditemukan</p>
        <button
          onClick={() => onNavigate('santri-list')}
          className="text-emerald-600 font-semibold"
        >
          Kembali ke Daftar Santri
        </button>
      </div>
    );
  }

  // Build WA link with parent portal URL
  const buildWaLink = () => {
    if (!santri.parent_phone) return null;
    const phone = santri.parent_phone.replace(/\D/g, '');
    // Use window.location.origin for current domain (works both local + production)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portalUrl = `${origin}/laporan/${santri.id}`;
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const text = [
      `Assalamualaikum, Bapak/Ibu orang tua dari *${santri.name}* 🕌`,
      ``,
      `Berikut laporan perkembangan belajar mengaji anak Anda per *${today}*:`,
      `👉 ${portalUrl}`,
      ``,
      `Silakan klik link di atas untuk melihat:
• Kehadiran (grafik 6 bulan)
• Riwayat mengaji & hafalan
• Level pembelajaran`,
      ``,
      `Jazakumullahu khairan 🤲`,
    ].join('\n');
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };
  const waUrl = buildWaLink();

  return (
    <div className="p-4 pb-24">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center mb-6 relative">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{santri.name}</h2>
        {santri.current_level && (
          <div className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
            {santri.current_level}
          </div>
        )}
        {santri.mosque_name && (
          <p className="text-xs text-slate-500 mb-1">{santri.mosque_name}</p>
        )}
        {santri.created_at && (
          <p className="text-xs text-slate-500">Bergabung: {formatDate(santri.created_at)}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
            {/* Show total present count */}
          <p className="text-2xl font-bold text-blue-600">
            {attendanceHistory.filter(a => a.status?.toUpperCase().trim() === 'HADIR').length}
          </p>
          <p className="text-xs text-blue-600 font-semibold">Total Hadir</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
            <p className="text-2xl font-bold text-emerald-600">{history.length}</p>
            <p className="text-xs text-emerald-600 font-semibold">Total Mengaji</p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-4">Data Orang Tua</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1">NAMA</p>
            <p className="text-sm text-slate-800">{santri.parent_name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1">NOMOR TELEPON</p>
            <p className="text-sm text-slate-800">{santri.parent_phone || '-'}</p>
          </div>
          {santri.birth_date && (
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">TANGGAL LAHIR</p>
              <p className="text-sm text-slate-800">{formatDate(santri.birth_date)}</p>
            </div>
          )}
          {santri.gender && (
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">JENIS KELAMIN</p>
              <p className="text-sm text-slate-800">
                {santri.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
              </p>
            </div>
          )}
          {santri.address && (
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">ALAMAT</p>
              <p className="text-sm text-slate-800">{santri.address}</p>
            </div>
          )}
        </div>
      </div>

       {/* Learning History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                Riwayat Mengaji
            </h3>
            <button 
              onClick={() => santri && onNavigate(`santri-history?id=${santri.id}&mode=learning`)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Lihat Semua
            </button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
              {history.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 text-sm">Belum ada riwayat mengaji.</p>
              ) : (
                  history.map((record: any) => (
                      <div key={record.id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                              <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      {formatDate(record.date)}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-800">
                                      {record.type === 'IQRO' ? record.level_or_surah : `QS. ${record.level_or_surah}`}
                                  </h4>
                                  <p className="text-xs text-slate-600 mt-0.5">
                                      {record.type === 'IQRO' 
                                        ? `Hal ${record.start_point} - ${record.end_point}` 
                                        : `Ayat ${record.start_point} - ${record.end_point}`}
                                  </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      record.quality === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                      record.quality === 'B' ? 'bg-blue-100 text-blue-700' :
                                      record.quality === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                  }`}>
                                      Nilai: {record.quality}
                                  </span>
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
      
      {/* Attendance History (NEW) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
              Riwayat Kehadiran (Terakhir)
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
              {attendanceHistory.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 text-sm">Belum ada data kehadiran.</p>
              ) : (
                  attendanceHistory.map((att: any) => (
                      <div key={att.id} className="flex justify-between items-center p-2 border-b border-slate-50 last:border-0">
                          <span className="text-sm text-slate-700 font-medium">{formatDate(att.date)}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                                att.status?.toUpperCase().trim() === 'HADIR' ? 'bg-emerald-100 text-emerald-700' :
                                att.status?.toUpperCase().trim() === 'SAKIT' ? 'bg-yellow-100 text-yellow-700' :
                                att.status?.toUpperCase().trim() === 'IZIN' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {att.status?.toUpperCase() === 'ALFA' ? 'ALPA' : att.status} 
                          </span>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Worship History (Hafalan Doa & Sholat) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                Riwayat Hafalan
            </h3>
            <button 
              onClick={() => santri && onNavigate(`santri-history?id=${santri.id}&mode=worship`)}
              className="text-xs font-bold text-purple-600 hover:text-purple-700"
            >
              Lihat Semua
            </button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
              {worshipHistory.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 text-sm">Belum ada riwayat hafalan.</p>
              ) : (
                  worshipHistory.map((record: any) => (
                      <div key={record.id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                              <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      {formatDate(record.date)}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-800">
                                      {record.type === 'DOA_HARIAN' ? record.daily_prayer_title : record.prayer_reading_title}
                                  </h4>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                        {record.type === 'DOA_HARIAN' ? 'Doa Harian' : 'Bacaan Sholat'}
                                    </span>
                                    {record.is_completed && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-1">
                                            <CheckCircle size={10} /> Lulus
                                        </span>
                                    )}
                                  </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      record.quality === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                      record.quality === 'B' ? 'bg-blue-100 text-blue-700' :
                                      record.quality === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                  }`}>
                                      Nilai: {record.quality}
                                  </span>
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={() => onNavigate(`parent-view?student_id=${santri.id}`)}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
         Laporan
        </button>
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Lapor Ortu via WA
          </a>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 bg-slate-200 text-slate-500 font-semibold py-3 rounded-xl cursor-not-allowed"
          >
            <MessageCircle className="w-4 h-4" />
            No. HP orang tua belum diisi
          </button>
        )}
      </div>
    </div>
  );
}
