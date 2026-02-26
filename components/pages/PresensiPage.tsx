'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, X, Search } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  role: 'teacher' | 'admin' | 'parent' | 'superadmin' | null;
  mosque_id?: number;
}

interface PresensiPageProps {
  onSave: (message: string) => void;
  currentUser?: User | null;
  onNavigate: (page: string) => void;
}

interface Student {
  id: number;
  name: string;
  status: 'HADIR' | 'ALPA' | 'SAKIT' | 'IZIN';
  notes?: string;
  attendance_id?: number; // If editing existing
}

interface StudyGroup {
  id: number;
  mosque_id: number;
  teacher_id: number | null;
  name: string;
}

interface HistorySummary {
    date: string;
    total_attendance: string;
    total_hadir: string;
    group_name: string;
    teacher_name: string;
    group_id?: number;
}

export default function PresensiPage({ onSave, currentUser, onNavigate }: PresensiPageProps) {
  const [mode, setMode] = useState<'input' | 'history'>('input');
  
  // Data State
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<HistorySummary[]>([]);
  
  // Form State
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  // History Detail State
  const [selectedHistory, setSelectedHistory] = useState<any[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailDate, setDetailDate] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // History Filter State
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [historyLoading, setHistoryLoading] = useState(false);

  // 1. Fetch Study Groups on Mount
  useEffect(() => {
    const fetchGroups = async () => {
      if (!currentUser?.mosque_id) return;
      try {
        // Fetch groups for the mosque and optionally filter by teacher
        let url = `/api/study-groups?mosque_id=${currentUser.mosque_id}`;
        if (currentUser.role === 'teacher' && currentUser.id) {
            url += `&teacher_id=${currentUser.id}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
            setStudyGroups(data.data);
        } else if (Array.isArray(data)) {
            setStudyGroups(data);
        } else {
            console.error('Invalid study groups data format', data);
            setStudyGroups([]); // Fallback
        }
      } catch (err) {
        console.error('Failed to fetch groups', err);
      }
    };
    fetchGroups();
  }, [currentUser]);

  // 2. Fetch History on Switch to History Mode
  useEffect(() => {
    if (mode === 'history') {
        const fetchHistory = async () => {
            setHistoryLoading(true);
            try {
                let url = '/api/attendance?history=true';
                if (currentUser?.mosque_id) url += `&mosque_id=${currentUser.mosque_id}`;
                if (currentUser?.role === 'teacher' && currentUser?.id) url += `&teacher_id=${currentUser.id}`;
                const res = await fetch(url);
                const data = await res.json();
                 if (data.success && Array.isArray(data.data)) {
                    setHistory(data.data);
                } else if (Array.isArray(data)) {
                    setHistory(data);
                } else {
                    setHistory([]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setHistoryLoading(false);
            }
        };
        fetchHistory();
    }
  }, [mode, currentUser]);

  // 3. Fetch Students when Group Selected
  useEffect(() => {
    if (!selectedGroupId) {
        setStudents([]);
        return;
    }
    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch ALL students in the group
            const studentsRes = await fetch(`/api/students?group_id=${selectedGroupId}`);
            const studentsWrapper = await studentsRes.json();
            const allStudents = studentsWrapper.success && Array.isArray(studentsWrapper.data) ? studentsWrapper.data : [];

            // 2. Fetch existing attendance for this date/group
            const attRes = await fetch(`/api/attendance?date=${attendanceDate}&group_id=${selectedGroupId}`);
            const attDataWrapper = await attRes.json();
            const existingAttendance = attDataWrapper.success && Array.isArray(attDataWrapper.data) ? attDataWrapper.data : [];
            
            // 3. Merge data
            const mergedStudents = allStudents.map((s: any) => {
                const evidence = existingAttendance.find((a: any) => a.student_id === s.id);
                return {
                    id: s.id,
                    name: s.name,
                    status: evidence ? evidence.status : 'HADIR', // Default to HADIR if no record
                    notes: evidence ? evidence.notes : '',
                    attendance_id: evidence ? evidence.id : undefined
                };
            });
            
            setStudents(mergedStudents);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    fetchStudents();
  }, [selectedGroupId, attendanceDate]);


  const updateStatus = (id: number, status: 'HADIR' | 'ALPA' | 'SAKIT' | 'IZIN') => {
    setStudents(students.map(student =>
      student.id === id ? { ...student, status } : student
    ));
  };

  const handleSave = async () => {
    if (!currentUser || !selectedGroupId) return;
    try {
        const payload = students.map(s => ({
            student_id: s.id,
            teacher_id: currentUser.id,
            attendance_date: attendanceDate, // API expects 'attendance_date' in body, maps to 'date' col
            date: attendanceDate,
            status: s.status,
            notes: s.notes
        }));
        
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            onSave('Presensi berhasil disimpan!');
            setMode('history'); // Switch to history to see result
        } else {
            toast.error('Gagal menyimpan presensi');
        }
    } catch (err) {
        console.error(err);
        toast.error('Terjadi kesalahan');
    }
  };

  const openHistoryDetail = async (date: string, groupId?: number) => { 
      // Ensure we send YYYY-MM-DD
      const dateOnly = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
      
      let url = `presensi-detail?date=${dateOnly}`;
      if (groupId) url += `&group_id=${groupId}`;
      
      onNavigate(url);
  };


  // Filter study groups for teacher
  const filteredGroups = studyGroups.filter(g => {
      if (currentUser?.role === 'teacher') {
          return Number(g.teacher_id) === Number(currentUser.id);
      }
      return true;
  });

  const hadirCount = students.filter(s => s.status === 'HADIR').length;
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered history based on group + month filters
  const filteredHistory = history.filter(item => {
    const itemMonth = item.date ? item.date.substring(0, 7) : '';
    const matchMonth = filterMonth ? itemMonth === filterMonth : true;
    const matchGroup = filterGroup ? String(item.group_id) === filterGroup : true;
    return matchMonth && matchGroup;
  });

  // Stats from filtered history
  const totalSesi = filteredHistory.length;
  const totalHadir = filteredHistory.reduce((sum, h) => sum + Number(h.total_hadir || 0), 0);
  const totalAttendance = filteredHistory.reduce((sum, h) => sum + Number(h.total_attendance || 0), 0);
  const rataKehadiran = totalAttendance > 0 ? Math.round((totalHadir / totalAttendance) * 100) : 0;
  
  // Format date helper
  const formatDate = (d: string) => {
      const date = new Date(d);
      return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-4">
      {/* Mode Toggle */}
      <div className="flex bg-slate-200 p-1 rounded-xl mb-4 gap-1">
        <button
          onClick={() => setMode('input')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'input'
              ? 'bg-white shadow-sm text-emerald-700'
              : 'text-slate-500'
          }`}
        >
          Input Hari Ini
        </button>
        <button
          onClick={() => setMode('history')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'history'
              ? 'bg-white shadow-sm text-emerald-700'
              : 'text-slate-500'
          }`}
        >
          Riwayat
        </button>
      </div>

      {/* Input Mode */}
      {mode === 'input' && (
        <>
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 space-y-3">
              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tanggal</label>
                  <input 
                    type="date" 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Pilih Kelompok</label>
                  <SearchableSelect
                    options={filteredGroups.map(g => ({ value: g.id, label: g.name }))}
                    value={selectedGroupId}
                    onChange={(val) => setSelectedGroupId(String(val))}
                    placeholder="Pilih Kelompok..."
                    searchPlaceholder="Cari kelompok..."
                  />
              </div>
          </div>

          {selectedGroupId && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-4">
                {/* Search Input */}
                <div className="p-3 border-b border-slate-100">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama santri..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400 bg-slate-50"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 p-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">
                <div className="col-span-4">NAMA</div>
                <div className="col-span-8 text-center">STATUS</div>
                </div>

                {isLoading ? (
                    <div className="p-4 text-center text-slate-500">Memuat data santri...</div>
                ) : students.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Belum ada santri di kelompok ini.</div>
                ) : filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 italic">Tidak ada santri dengan nama "{searchQuery}"</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="p-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800 w-1/3 truncate">{student.name}</span>
                        <div className="flex gap-1 flex-1 justify-end">
                            <button
                            onClick={() => updateStatus(student.id, 'HADIR')}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                                student.status === 'HADIR'
                                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                            >
                            HADIR
                            </button>
                            <button
                            onClick={() => updateStatus(student.id, 'SAKIT')}
                            className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all ${
                                student.status === 'SAKIT'
                                ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-500'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                            >
                            SAKIT
                            </button>
                            <button
                            onClick={() => updateStatus(student.id, 'IZIN')}
                            className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all ${
                                student.status === 'IZIN'
                                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                            >
                            IZIN
                            </button>
                             <button
                            onClick={() => updateStatus(student.id, 'ALPA')}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                                student.status === 'ALPA'
                                ? 'bg-red-100 text-red-700 ring-1 ring-red-500'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                            >
                            ALPA
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
            </div>
          )}

          {selectedGroupId && students.length > 0 && (
            <>
                <div className="bg-slate-100 rounded-xl p-4 mb-4 text-center border border-slate-200">
                    <p className="text-sm text-slate-600">
                    Hadir: <span className="font-bold text-emerald-600">{hadirCount}</span> dari {students.length}
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors active:scale-95"
                >
                    Simpan Kehadiran
                </button>
            </>
          )}
        </>
      )}

      {/* History Mode */}
      {mode === 'history' && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 space-y-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Bulan</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Kelompok</label>
              <SearchableSelect
                options={[
                  { value: '', label: 'Semua Kelompok' },
                  ...studyGroups.map(g => ({ value: g.id, label: g.name }))
                ]}
                value={filterGroup}
                onChange={(val) => setFilterGroup(String(val))}
                placeholder="Semua Kelompok"
              />
            </div>
          </div>

          {/* Summary Stats */}
          {filteredHistory.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-600">{totalSesi}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase">Total Sesi</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{rataKehadiran}%</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase">Rata Hadir</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-slate-600">{totalHadir}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Hadir</p>
              </div>
            </div>
          )}

          {/* History List */}
          {historyLoading ? (
            <div className="text-center py-10 text-slate-400">Memuat riwayat...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic">Belum ada riwayat presensi pada periode ini.</div>
          ) : (
            filteredHistory.map((item, idx) => {
              const hadir = Number(item.total_hadir || 0);
              const total = Number(item.total_attendance || 0);
              const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
              return (
                <div
                  key={idx}
                  onClick={() => openHistoryDetail(item.date, item.group_id)}
                  className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-slate-200 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm">{formatDate(item.date)}</h4>
                      <p className="text-xs text-slate-500 flex gap-2 mt-0.5">
                        <span>{item.group_name || 'Tanpa Kelompok'}</span>
                        <span>•</span>
                        <span>{item.teacher_name || 'Guru'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${ pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500' }`}>
                        {hadir}/{total} Hadir
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-1">
                        Detail <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${ pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400' }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
