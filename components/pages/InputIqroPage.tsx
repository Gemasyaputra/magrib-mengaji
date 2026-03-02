'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronRight, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  role: 'teacher' | 'admin' | 'parent' | 'superadmin' | null;
  mosque_id?: number;
}

interface InputIqroPageProps {
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
  current_level: string | null;
}

// Today's setoran record for a student
interface TodayRecord {
  student_id: number;
  level_or_surah: string;
  start_point: string;
  end_point: string;
  quality: string;
  date: string;
}

// Recent record for sidebar
interface RecentRecord {
  id: number;
  date: string;
  level_or_surah: string;
  start_point: string;
  end_point: string;
  quality: string;
  type: string;
}

const TODAY = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

export default function InputIqroPage({ onSave, currentUser, onNavigate }: InputIqroPageProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Track which students already have setoran today
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([]);
  // Recent records for selected student (shown in form as history panel)
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);



  const [formData, setFormData] = useState({
    date: TODAY,
    type: 'IQRO',
    level_or_surah: '',
    start_point: '',
    end_point: '',
    quality: 'A',
    notes: '',
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
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, [currentUser]);

  // Fetch Students + Today's Records when Group Selected
  useEffect(() => {
    if (!selectedGroup) return;
    const fetchStudents = async () => {
      try {
        const res = await fetch(`/api/students?group_id=${selectedGroup.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setStudents(data.data);
          // Now fetch today's learning records for this group
          await fetchTodayRecords(data.data);
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error(err);
      }
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
      // Fetch today's records for all students in group
      const ids = studentList.map(s => s.id).join(',');
      if (!ids) return;
      const res = await fetch(`/api/learning-records?group_student_ids=${ids}&date=${selectedDate}&t=${Date.now()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTodayRecords(data.data);
      }
    } catch (err) {
      console.error('fetchTodayRecords error', err);
    }
  };

  // Fetch recent records for selected student
  const fetchRecentRecords = async (studentId: number) => {
    setRecentLoading(true);
    try {
      const res = await fetch(`/api/learning-records?student_id=${studentId}&limit=5&t=${Date.now()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRecentRecords(data.data);
      } else {
        setRecentRecords([]);
      }
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
    const level = student.current_level?.toLowerCase() || '';
    const isQuran = level.includes('juz') || level.includes('quran') || level.includes("qur'an") || level.includes('qur');
    const type = isQuran ? 'QURAN' : 'IQRO';
    
    setFormData(prev => ({
      ...prev,
      date: selectedDate, // Sync form date with selected date
      type,
      level_or_surah: type === 'IQRO' ? 'Jilid 1' : 'Al-Fatihah',
      start_point: '',
      end_point: '',
      quality: 'A',
      notes: ''
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
    try {
      const payload = {
        student_id: selectedStudent.id,
        teacher_id: currentUser.id,
        date: formData.date,
        type: formData.type,
        level_or_surah: formData.level_or_surah,
        start_point: formData.start_point,
        end_point: formData.end_point,
        quality: formData.quality,
        notes: formData.notes
      };

      const res = await fetch('/api/learning-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onSave('Setoran berhasil disimpan!');
        // Update todayRecords locally so indicator appears immediately
        setTodayRecords(prev => [
          ...prev.filter(r => Number(r.student_id) !== Number(selectedStudent.id)),
          { ...payload } as TodayRecord
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

  const surahs = [
    'Al-Fatihah','Al-Baqarah','Ali Imran','An-Nisa','Al-Maidah',
    'Al-Anam','Al-Araf','Al-Anfal','At-Taubah','Yunus',
    'Hud','Yusuf','Ar-Rad','Ibrahim','Al-Hijr',
    'An-Nahl','Al-Isra','Al-Kahf','Maryam','Ta-Ha',
    'Al-Anbiya','Al-Hajj','Al-Muminun','An-Nur','Al-Furqan',
    'Asy-Syuara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum',
    'Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir',
    'Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir',
    'Fussilat','Asy-Syura','Az-Zukhruf','Ad-Dukhan','Al-Jasiyah',
    'Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf',
    'Az-Zariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman',
    'Al-Waqiah','Al-Hadid','Al-Mujadilah','Al-Hasyr','Al-Mumtahanah',
    'As-Saf','Al-Jumuah','Al-Munafiqun','At-Tagabun','At-Talaq',
    'At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Maarij',
    'Nuh','Al-Jin','Al-Muzzammil','Al-Muddassir','Al-Qiyamah',
    'Al-Insan','Al-Mursalat','An-Naba','An-Naziat','Abasa',
    'At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Insyiqaq','Al-Buruj',
    'At-Tariq','Al-Ala','Al-Gasyiyah','Al-Fajr','Al-Balad',
    'Asy-Syams','Al-Lail','Ad-Duha','Asy-Syarh','At-Tin',
    'Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat',
    'Al-Qariah','At-Takasur','Al-Asr','Al-Humazah','Al-Fil',
    'Quraisy','Al-Maun','Al-Kausar','Al-Kafirun','An-Nasr',
    'Al-Lahab','Al-Ikhlas','Al-Falaq','An-Nas',
  ];

  const getStudentTodayRecord = (studentId: number) =>
    todayRecords.find(r => Number(r.student_id) === Number(studentId));

  const qualityColor = (q: string) => {
    if (q === 'A') return 'bg-emerald-100 text-emerald-700';
    if (q === 'B') return 'bg-blue-100 text-blue-700';
    if (q === 'C') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const doneCount = students.filter(s => getStudentTodayRecord(s.id)).length;

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

      {/* Header + breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        {step > 1 && (
          <button onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)} className="text-slate-400 hover:text-slate-600">
            ←
          </button>
        )}
        <h2 className="font-bold text-lg text-slate-800">
          {step === 1 ? 'Pilih Kelompok' : step === 2 ? 'Pilih Santri' : 'Setoran Tilawah'}
        </h2>
      </div>

      {/* Step 1: Group Selection */}
      {step === 1 && (
        <div className="grid gap-3">
          {studyGroups.length === 0 ? (
            <div className="text-center p-8 text-slate-500 bg-slate-100 rounded-xl">
              Belum ada kelompok belajar.
            </div>
          ) : (
            studyGroups.map(group => (
              <div
                key={group.id}
                onClick={() => handleGroupSelect(group)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:border-emerald-500 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <BookOpen size={18} className="text-emerald-600" />
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
            {/* Progress indicator */}
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
                    isDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 hover:border-emerald-400'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isDone ? <CheckCircle2 size={20} /> : student.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 truncate">{student.name}</span>
                      {isDone && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold shrink-0">
                          ✓ Hari ini
                        </span>
                      )}
                    </div>
                    {isDone ? (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {todayRec.level_or_surah}
                        {todayRec.start_point && todayRec.end_point
                          ? ` · Hal ${todayRec.start_point}–${todayRec.end_point}`
                          : ''}
                        {' · '}
                        <span className="font-bold">{todayRec.quality}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Level: <span className="font-semibold text-slate-500">{student.current_level || 'IQRO'}</span>
                        {' · '}
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
          {/* Student Info + Done badge */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                {selectedStudent.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{selectedStudent.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                    {formData.type}
                  </span>
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

            {/* Dynamic Fields */}
            {formData.type === 'IQRO' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">JILID</label>
                  <SearchableSelect
                    options={[1,2,3,4,5,6].map(i => ({ value: `Jilid ${i}`, label: `Jilid ${i}` }))}
                    value={formData.level_or_surah}
                    onChange={(val) => setFormData(prev => ({ ...prev, level_or_surah: String(val) }))}
                    placeholder="Pilih Jilid..."
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2">HALAMAN MULAI</label>
                    <input type="text" name="start_point" placeholder="Contoh: 10" value={formData.start_point} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2">SAMPAI</label>
                    <input type="text" name="end_point" placeholder="Contoh: 12" value={formData.end_point} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">SURAH</label>
                  <SearchableSelect
                    options={surahs.map((s, idx) => ({ value: s, label: `${idx + 1}. ${s}` }))}
                    value={formData.level_or_surah}
                    onChange={(val) => setFormData(prev => ({ ...prev, level_or_surah: String(val) }))}
                    placeholder="Pilih surah..."
                    searchPlaceholder="Cari nama atau nomor..."
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2">AYAT MULAI</label>
                    <input type="text" name="start_point" placeholder="Ayat awal" value={formData.start_point} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2">SAMPAI</label>
                    <input type="text" name="end_point" placeholder="Ayat akhir" value={formData.end_point} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </>
            )}

            {/* Quality */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">KUALITAS BACAAN</label>
              <div className="flex gap-2">
                {['A', 'B', 'C', 'D'].map(q => (
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
                name="notes" value={formData.notes} onChange={handleChange}
                placeholder="Catatan perkembangan..."
                className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm h-24 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors active:scale-95"
            >
              Simpan Hasil
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
                          {rec.level_or_surah}
                          {rec.start_point && rec.end_point
                            ? ` · Hal ${rec.start_point}–${rec.end_point}`
                            : ''}
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
                    onClick={() => selectedStudent && onNavigate(`santri-history?id=${selectedStudent.id}`)}
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
