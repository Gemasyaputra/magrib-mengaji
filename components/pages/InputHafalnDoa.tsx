'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, XCircle, CheckCircle2, Clock, BookMarked } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  role: 'teacher' | 'admin' | 'parent' | 'superadmin' | null;
  mosque_id?: number;
}

interface InputHafalnDoaProps {
  onSave: (message: string) => void;
  currentUser?: User | null;
  onNavigate: (page: string) => void;
}

interface StudyGroup {
  id: number;
  name: string;
  teacher_id: number | null;
}

interface Student {
  id: number;
  name: string;
}

interface MasterData {
  id: number;
  title: string;
  category?: string;
}

interface TodayRecord {
  student_id: number;
  type: string;
  daily_prayer_title?: string;
  prayer_reading_title?: string;
  quality: string;
  is_completed: boolean;
}

interface RecentRecord {
  id: number;
  date: string;
  type: string;
  daily_prayer_title?: string;
  prayer_reading_title?: string;
  quality: string;
  is_completed: boolean;
}

const TODAY = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

export default function InputHafalnDoa({ onSave, currentUser, onNavigate }: InputHafalnDoaProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState(TODAY);

  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [dailyPrayers, setDailyPrayers] = useState<MasterData[]>([]);
  const [prayerReadings, setPrayerReadings] = useState<MasterData[]>([]);

  // Today's submission tracker
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([]);
  // Recent records for form history panel
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: TODAY,
    type: 'DOA_HARIAN',
    daily_prayer_id: '',
    prayer_reading_id: '',
    is_completed: false,
    quality: 'A',
    notes: ''
  });

  // Fetch Groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (!currentUser?.mosque_id) return;
      try {
        let url = `/api/study-groups?mosque_id=${currentUser.mosque_id}`;
        if (currentUser.role === 'teacher' && currentUser.id) {
            url += `&teacher_id=${currentUser.id}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setStudyGroups(data.data);
        }
      } catch (err) { console.error(err); }
    };
    fetchGroups();
  }, [currentUser]);

  // Fetch Master Data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [dailyRes, prayerRes] = await Promise.all([
          fetch('/api/master/daily-prayers'),
          fetch('/api/master/prayer-readings')
        ]);
        const dailyData = await dailyRes.json();
        const prayerData = await prayerRes.json();
        if (dailyData.success) setDailyPrayers(dailyData.data);
        if (prayerData.success) setPrayerReadings(prayerData.data);
      } catch (err) { console.error(err); }
    };
    fetchMasterData();
  }, []);

  // Fetch Students + Today's Records when Group Selected
  useEffect(() => {
    if (!selectedGroup) return;
    const fetchStudents = async () => {
      try {
        const res = await fetch(`/api/students?group_id=${selectedGroup.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setStudents(data.data);
          await fetchTodayRecords(data.data);
        } else {
          setStudents([]);
        }
      } catch (err) { console.error(err); }
    };
    fetchStudents();
  }, [selectedGroup]);

  // Refetch records when date changes
  useEffect(() => {
    if (selectedGroup && students.length > 0) {
      fetchTodayRecords(students);
    }
  }, [selectedDate]);

  const fetchTodayRecords = async (studentList: Student[]) => {
    try {
      const ids = studentList.map(s => s.id).join(',');
      if (!ids) return;
      const res = await fetch(`/api/worship-records?group_student_ids=${ids}&date=${selectedDate}&t=${Date.now()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTodayRecords(data.data);
      }
    } catch (err) { console.error('fetchTodayRecords error', err); }
  };

  const fetchRecentRecords = async (studentId: number) => {
    setRecentLoading(true);
    try {
      const res = await fetch(`/api/worship-records?student_id=${studentId}&limit=5&t=${Date.now()}`);
      const data = await res.json();
      setRecentRecords(data.success && Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      setRecentRecords([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const handleGroupSelect = (group: StudyGroup) => {
    setSelectedGroup(group);
    setStep(2);
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setFormData(prev => ({ 
      ...prev, 
      date: selectedDate, // Sync form date with selected date
      daily_prayer_id: '', 
      prayer_reading_id: '', 
      notes: '', 
      is_completed: false, 
      quality: 'A' 
    }));
    fetchRecentRecords(student.id);
    setStep(3);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !currentUser) return;
    if (formData.type === 'DOA_HARIAN' && !formData.daily_prayer_id) { toast.error('Pilih Doa Harian terlebih dahulu'); return; }
    if (formData.type === 'BACAAN_SHOLAT' && !formData.prayer_reading_id) { toast.error('Pilih Bacaan Sholat terlebih dahulu'); return; }

    try {
      const payload = {
        student_id: selectedStudent.id,
        teacher_id: currentUser.id,
        date: formData.date,
        type: formData.type,
        daily_prayer_id: formData.type === 'DOA_HARIAN' ? formData.daily_prayer_id : null,
        prayer_reading_id: formData.type === 'BACAAN_SHOLAT' ? formData.prayer_reading_id : null,
        is_completed: formData.is_completed,
        quality: formData.quality,
        notes: formData.notes
      };

      const res = await fetch('/api/worship-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onSave('Hafalan berhasil disimpan!');
        // Update todayRecords locally so indicator appears immediately
        setTodayRecords(prev => [
          ...prev.filter(r => Number(r.student_id) !== Number(selectedStudent.id)),
          { ...payload } as unknown as TodayRecord
        ]);
        setStep(2);
        setSelectedStudent(null);
      } else {
        toast.error(data.error || 'Gagal menyimpan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan');
    }
  };

  const getStudentTodayRecord = (studentId: number) =>
    todayRecords.find(r => Number(r.student_id) === Number(studentId));

  const doneCount = students.filter(s => getStudentTodayRecord(s.id)).length;

  const qualityColor = (q: string) => {
    if (q === 'A') return 'bg-emerald-100 text-emerald-700';
    if (q === 'B') return 'bg-blue-100 text-blue-700';
    if (q === 'C') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getRecordLabel = (rec: RecentRecord | TodayRecord) => {
    if (rec.type === 'DOA_HARIAN') return rec.daily_prayer_title || 'Doa Harian';
    return rec.prayer_reading_title || 'Bacaan Sholat';
  };

  return (
    <div className="p-4">
      {/* Date Picker Section - Always Visible */}
      <div className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Tanggal Setoran</label>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-2 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        {step > 1 && (
          <button onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)} className="text-slate-400 hover:text-slate-600">
            ←
          </button>
        )}
        <h2 className="font-bold text-lg text-slate-800">
          {step === 1 ? 'Pilih Kelompok' : step === 2 ? 'Pilih Santri' : 'Setoran Doa'}
        </h2>
      </div>

      {/* Step 1: Group Selection */}
      {step === 1 && (
        <div className="grid gap-3">
          {studyGroups.length === 0 ? (
            <div className="text-center p-8 text-slate-500 bg-slate-100 rounded-xl">Belum ada kelompok belajar.</div>
          ) : (
            studyGroups.map(group => (
              <div
                key={group.id}
                onClick={() => handleGroupSelect(group)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:border-emerald-500 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                    <BookMarked size={18} className="text-purple-600" />
                  </div>
                  <span className="font-bold text-slate-700">{group.name}</span>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
            ))
          )}
        </div>
      )}

      {/* Step 2: Student Selection */}
      {step === 2 && selectedGroup && (
        <div className="grid gap-3">
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 mb-1 flex justify-between items-center">
            <div>
              <span className="text-xs text-emerald-600 font-bold uppercase">Kelompok</span>
              <div className="font-bold text-emerald-800">{selectedGroup.name}</div>
            </div>
            {students.length > 0 && (
              <div className="text-right">
                <span className="text-xs text-emerald-600 font-bold">{doneCount}/{students.length}</span>
                <p className="text-[10px] text-emerald-500">sudah diisi</p>
              </div>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center p-8 text-slate-500">Belum ada santri di kelompok ini.</div>
          ) : (
            students.map(student => {
              const todayRec = getStudentTodayRecord(student.id);
              const isDone = !!todayRec;

              return (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`bg-white p-4 rounded-xl shadow-sm border flex items-center gap-3 cursor-pointer transition-all ${
                    isDone ? 'border-purple-200 bg-purple-50/30' : 'border-slate-100 hover:border-purple-400'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    isDone ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isDone ? <CheckCircle2 size={20} /> : student.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 truncate">{student.name}</span>
                      {isDone && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold shrink-0">
                          ✓ Hari ini
                        </span>
                      )}
                    </div>
                    {isDone ? (
                      <p className="text-xs text-purple-600 mt-0.5">
                        {getRecordLabel(todayRec)}
                        {' · '}
                        {todayRec.is_completed ? '✓ Lulus' : '○ Belum'}
                        {' · '}
                        <span className="font-bold">{todayRec.quality}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="text-amber-500 font-medium">Belum diisi</span>
                      </p>
                    )}
                  </div>

                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Step 3: Input Form */}
      {step === 3 && selectedStudent && (
        <div className="space-y-4">
          {/* Student Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                {selectedStudent.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{selectedStudent.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500">Input Data Hafalan</span>
                  {getStudentTodayRecord(selectedStudent.id) && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                      ⚠️ Sudah diisi hari ini — akan menambah
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Input Form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">KATEGORI</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, type: 'DOA_HARIAN', daily_prayer_id: '', prayer_reading_id: '' }))}
                  className={`flex-1 py-2 text-xs font-bold rounded ${formData.type === 'DOA_HARIAN' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}
                >
                  Doa Harian
                </button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, type: 'BACAAN_SHOLAT', daily_prayer_id: '', prayer_reading_id: '' }))}
                  className={`flex-1 py-2 text-xs font-bold rounded ${formData.type === 'BACAAN_SHOLAT' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                >
                  Bacaan Sholat
                </button>
              </div>
            </div>

            {/* Dynamic Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                {formData.type === 'DOA_HARIAN' ? 'PILIH DOA' : 'PILIH BACAAN'}
              </label>
              <SearchableSelect
                options={
                  formData.type === 'DOA_HARIAN'
                    ? dailyPrayers.map(d => ({ value: d.id, label: d.title }))
                    : prayerReadings.map(d => ({ value: d.id, label: d.title }))
                }
                value={formData.type === 'DOA_HARIAN' ? formData.daily_prayer_id : formData.prayer_reading_id}
                onChange={(val) => {
                  const name = formData.type === 'DOA_HARIAN' ? 'daily_prayer_id' : 'prayer_reading_id';
                  setFormData(prev => ({ ...prev, [name]: String(val) }));
                }}
                placeholder={formData.type === 'DOA_HARIAN' ? 'Pilih Doa...' : 'Pilih Bacaan...'}
                searchPlaceholder="Cari..."
              />
            </div>

            {/* Status Lulus/Belum */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">STATUS</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, is_completed: true }))}
                  className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${
                    formData.is_completed ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <CheckCircle size={16} />
                  <span className="font-bold text-sm">Lulus</span>
                </button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, is_completed: false }))}
                  className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${
                    !formData.is_completed ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <XCircle size={16} />
                  <span className="font-bold text-sm">Belum</span>
                </button>
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">KUALITAS</label>
              <div className="flex gap-2">
                {['A', 'B', 'C'].map(q => (
                  <button
                    key={q}
                    onClick={() => setFormData(prev => ({ ...prev, quality: q }))}
                    className={`flex-1 py-3 rounded-lg font-bold border transition ${
                      formData.quality === q
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">CATATAN</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Catatan..."
                className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm h-20 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors active:scale-95"
            >
              Simpan Data
            </button>
          </div>

          {/* Recent History Panel */}
          {(recentRecords.length > 0 || recentLoading) && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                <Clock size={12} className="text-slate-400" /> Riwayat Terakhir
              </h4>
              {recentLoading ? (
                <div className="text-xs text-slate-400 text-center py-2">Memuat...</div>
              ) : (
                <div className="space-y-2">
                  {recentRecords.map((rec, idx) => (
                    <div key={rec.id || idx} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {getRecordLabel(rec)}
                          <span className={`ml-2 text-[10px] ${rec.is_completed ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {rec.is_completed ? '✓ Lulus' : '○ Belum'}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(rec.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${qualityColor(rec.quality)}`}>
                        {rec.quality}
                      </span>
                    </div>
                  ))}

                  {/* Load More Button */}
                  <button 
                    onClick={() => selectedStudent && onNavigate(`santri-history?id=${selectedStudent.id}&mode=worship`)}
                    className="w-full mt-3 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    Lihat Semua Riwayat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
