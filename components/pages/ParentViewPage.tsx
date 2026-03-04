'use client';

import { ArrowLeft, User, MapPin, BookOpen, Activity, Calendar, MessageCircle, Image as ImageIcon, X, Share2, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface ParentViewPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  studentId?: string | null;
}

export default function ParentViewPage({ onBack, onNavigate, studentId }: ParentViewPageProps) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // State for Detailed View
  const [attendanceStats, setAttendanceStats] = useState({ 
    percentage: 0, 
    currentMonthPresent: 0,
    currentMonthSessions: 0,
    chartData: [] as { key: string, label: string, value: number }[] 
  });
  const [learningProgress, setLearningProgress] = useState({
     percentage: 0,
     progresSaatIni: 0,
     targetLengkap: 0,
     labelProgress: 'Surat',
     subTitle: 'Juz 30',
     isIqro: false
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [kabarMasjid, setKabarMasjid] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Image Slider State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageSliderRef = useRef<HTMLDivElement>(null);

  const handleImageScroll = () => {
    if (imageSliderRef.current) {
        const { scrollLeft, offsetWidth } = imageSliderRef.current;
        const newIndex = Math.round(scrollLeft / offsetWidth);
        setCurrentImageIndex(newIndex);
    }
  };

  // Reset slider index when post opens
  useEffect(() => {
    if (selectedPost) setCurrentImageIndex(0);
  }, [selectedPost]);

  const handleShare = async (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    try {
        const url = `${window.location.origin}/public/kabar/${post.id}`;
        const text = `Kabar Masjid: ${post.title}\nBaca selengkapnya di:\n${url}`;
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    } catch (err) {
        console.error('Failed to share', err);
    }
  };

  useEffect(() => {
    if (!studentId) {
        setError('Data santri tidak ditemukan (ID missing).');
        setLoading(false);
        return;
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Student Profile
            const resStudent = await fetch(`/api/students?id=${studentId}`);
            const jsonStudent = await resStudent.json();
            
            if (!jsonStudent.success || !jsonStudent.data) {
                setError('Santri tidak ditemukan.');
                setLoading(false);
                return;
            }
            setSelectedStudent(jsonStudent.data);

            // 2. Fetch Attendance Stats & Chart
            const resAtt = await fetch(`/api/attendance?student_id=${studentId}&chart=true`);
            const jsonAtt = await resAtt.json();
            
            let percentage = 0;
            let currentMonthPresent = 0;
            let currentMonthSessions = 0;
            let chartData: { key: string, label: string, value: number }[] = []; 

            // Initialize last 6 months empty placeholders
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                // Use 'default' locale for label to match user system or specific 'id-ID'
                const label = d.toLocaleString('id-ID', { month: 'short' });
                chartData.push({ key: `${year}-${month}`, label, value: 0 });
            }

            if (jsonAtt.success && Array.isArray(jsonAtt.data)) {
                // 2b. Calculate Global Percentage (Fetch all history if needed or use what we have)
                // Since the chart API only returns monthly aggregation, we need the raw list for global percentage
                // Or we can just use the chart's total aggregation? 
                // Let's fetch the full list for accurate "All Time" percentage or "Last 50" as before.
                
                try {
                    const resGlobal = await fetch(`/api/attendance?student_id=${studentId}`);
                    const jsonGlobal = await resGlobal.json();
                    
                    if (jsonGlobal.success && Array.isArray(jsonGlobal.data)) {
                         const total = jsonGlobal.data.length;
                         const present = jsonGlobal.data.filter((r: any) => r.status === 'HADIR').length;
                         percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                    }
                } catch (e) {
                    console.error("Failed to fetch global stats", e);
                }

                // Map chart data
                jsonAtt.data.forEach((item: any) => {
                    const found = chartData.find(c => c.key === item.month);
                    if (found) {
                         const sessions = Number(item.total_sessions);
                         const present = Number(item.total_present);
                         const val = sessions > 0 ? Math.round((present / sessions) * 100) : 0;
                         found.value = val;
                         
                         // If this is the current month, save the raw numbers
                         const d = new Date();
                         const currentMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                         if (item.month === currentMonthKey) {
                             currentMonthPresent = present;
                             currentMonthSessions = sessions;
                         }
                    }
                });
            }
            setAttendanceStats({ percentage, currentMonthPresent, currentMonthSessions, chartData });

            // 3. Fetch Learning Records (more limit)
            const resLearn = await fetch(`/api/learning-records?student_id=${studentId}&limit=50`);
            const jsonLearn = await resLearn.json();
            const learningRecords = (jsonLearn.success && Array.isArray(jsonLearn.data)) ? jsonLearn.data : [];

            // Calculate Learning Progress Gauge Data
            const lastRecord = learningRecords.length > 0 ? learningRecords[0] : null;
            const isIqro = lastRecord?.type === 'IQRO';
            
            let targetLengkap = 37; 
            let progresSaatIni = learningRecords.length;
            let labelProgress = isIqro ? "Halaman" : "Surat";
            let subTitle = isIqro ? (lastRecord.level_or_surah || "Iqro") : "Juz 30";

            if (isIqro) {
                targetLengkap = 32; 
                const halamanTerakhir = learningRecords
                    .filter((h: any) => h.type === 'IQRO')
                    .map((h: any) => parseInt(h.end_point || '0'))
                    .filter((val: number) => !isNaN(val));

                progresSaatIni = halamanTerakhir.length > 0 ? Math.max(...halamanTerakhir) : 0;
            }

            const lpPercentage = targetLengkap > 0 ? Math.min(Math.round((progresSaatIni / targetLengkap) * 100), 100) : 0;
            setLearningProgress({ percentage: lpPercentage, progresSaatIni, targetLengkap, labelProgress, subTitle, isIqro });

            // 4. Fetch Worship Records (more limit)
            const resWorship = await fetch(`/api/worship-records?student_id=${studentId}&limit=10`);
            const jsonWorship = await resWorship.json();
            const worshipRecords = (jsonWorship.success && Array.isArray(jsonWorship.data)) ? jsonWorship.data : [];

            // Merge & Sort
            const combined = [
                ...learningRecords.map((r: any) => {
                    const typeLabel = r.type === 'IQRO' ? 'Setoran Bacaan' : r.type === 'QURAN' ? 'Setoran Quran' : r.type;
                    // level_or_surah already contains full name like 'Jilid 1' or surah name
                    const title = `${typeLabel} — ${r.level_or_surah || ''}`;
                    const hasPoints = r.start_point && r.end_point && r.start_point !== 'EMPTY';
                    const detail = hasPoints ? `Hal ${r.start_point} – ${r.end_point}` : (r.notes || '');
                    return { type: 'learning', date: r.date, title, detail, quality: r.quality, teacher: r.teacher_name, notes: r.notes };
                }),
                ...worshipRecords.map((r: any) => {
                    const typeLabel = r.type === 'DOA_HARIAN' ? 'Hafalan Doa' : r.type === 'BACAAN_SHOLAT' ? 'Bacaan Sholat' : r.type;
                    const detail = r.daily_prayer_title || r.prayer_reading_title || r.title || '';
                    return { type: 'worship', date: r.date, title: typeLabel, detail, quality: r.quality, teacher: r.teacher_name, notes: null };
                })
            ].sort((a, b) => new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime()).slice(0, 12);

            setRecentActivities(combined);
            
            // 5. Fetch Kabar Masjid
            const resKabar = await fetch(`/api/activities?mosque_id=${jsonStudent.data.mosque_id}&limit=5`);
            const jsonKabar = await resKabar.json();
            if (jsonKabar.success && Array.isArray(jsonKabar.data)) {
                setKabarMasjid(jsonKabar.data.map((p: any) => ({
                    ...p,
                    images: Array.isArray(p.images) ? p.images : []
                })));
            }

        } catch (err: any) {
            console.error(err);
            setError('Gagal memuat data.');
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [studentId]);


  if (loading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500">Memuat data santri...</p>
            </div>
        </div>
      );
  }

  if (error || !selectedStudent) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <p className="text-red-500 mb-4">{error || 'Data tidak tersedia'}</p>
            <button onClick={onBack} className="flex items-center gap-2 text-emerald-600 font-bold">
                <ArrowLeft size={20} /> Kembali
            </button>
        </div>
    );
  }

  // --- RENDER DETAIL VIEW ---
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-emerald-600 text-white rounded-b-[2.5rem] shadow-lg mb-6 relative p-6 pt-8">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <p className="text-xs font-light opacity-80 mb-1">Portal Orang Tua</p>
          <h1 className="text-2xl font-bold mb-3">{selectedStudent.name}</h1>
          <div className="inline-block bg-emerald-800 bg-opacity-50 px-4 py-2 rounded-full text-xs font-semibold">
            {selectedStudent.mosque_name || 'Masjid Al-Hikmah'}
          </div>
        </div>
      </div>

      <div className="px-4 pb-20">
        {/* Stats Card */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 mb-6 -mt-10 relative z-10">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Level Pembelajaran</p>
            <p className="text-2xl font-bold text-emerald-600 mb-4">{selectedStudent.current_level || 'Belum ada data'}</p>
            <p className="text-sm text-slate-600 mb-1">Kehadiran (Global)</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${attendanceStats.percentage}%` }}
                ></div>
              </div>
              <span className="text-lg font-bold text-emerald-600">{attendanceStats.percentage}%</span>
            </div>
            {attendanceStats.currentMonthSessions > 0 ? (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-md inline-block">
                     Hadir {attendanceStats.currentMonthPresent} Hari <span className="text-emerald-500 font-normal">dari total {attendanceStats.currentMonthSessions} hari ngaji bulan ini</span>
                </p>
            ) : (
                <p className="text-xs font-semibold text-slate-500 bg-slate-50 py-1.5 px-3 rounded-md inline-block">
                     Belum ada jadwal ngaji bulan ini
                </p>
            )}

            <hr className="my-5 border-slate-100" />

            <div className="flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4">
                    <p className="text-sm font-bold text-slate-700">Progres {learningProgress.isIqro ? 'Iqro' : 'Hafalan'}</p>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">{learningProgress.subTitle}</span>
                </div>
                
                {/* Circular Progress Bar */}
                <div className="relative w-32 h-32 flex items-center justify-center mb-3">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background Circle */}
                        <circle
                            className="text-slate-100"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r={40}
                            cx="50"
                            cy="50"
                        />
                        {/* Progress Circle (Warna Hijau Terang) */}
                        <circle
                            className="text-emerald-500 drop-shadow-sm transition-all duration-1000 ease-out"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={(2 * Math.PI * 40) - (learningProgress.percentage / 100) * (2 * Math.PI * 40)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={40}
                            cx="50"
                            cy="50"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-emerald-600">{learningProgress.percentage}%</span>
                    </div>
                </div>
                
                <p className="text-xs text-slate-500 font-medium">
                    <span className="text-slate-800 font-bold text-sm">{learningProgress.progresSaatIni}</span> dari <span className="text-slate-800 font-bold">{learningProgress.targetLengkap}</span> {learningProgress.labelProgress}
                </p>
            </div>
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 mb-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-emerald-500"/> Statistik Kehadiran
        </h3>
        <div className="flex items-end justify-between gap-2 px-2" style={{ height: '128px' }}>
            {attendanceStats.chartData.map((data, idx) => {
              const barHeightPx = data.value > 0 ? Math.round((data.value / 100) * 108) : 8;
              return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  {data.value > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {data.value}%
                      </div>
                  )}
                  {/* Bar */}
                  <div
                      className={`w-full rounded-t-md transition-all ${data.value > 0 ? 'bg-emerald-500 opacity-80 hover:opacity-100' : 'bg-slate-200'}`}
                      style={{ height: `${barHeightPx}px` }}
                  />
                  <span className="text-[9px] text-slate-400 font-medium">{data.label}</span>
              </div>
              );
            })}
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">Grafik kehadiran 6 bulan terakhir</p>
        </div>

        {/* Recent Activities */}
        <div>
        <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-500"/> Buku Penghubung Digital
        </h3>
        <div className="space-y-4 border-l-2 border-slate-200 ml-2 pl-4">
            {recentActivities.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Belum ada aktivitas tercatat.</p>
            ) : (
                recentActivities.map((activity, idx) => (
                <div key={idx} className="relative">
                    <div className={`absolute -left-[23px] top-2 w-3.5 h-3.5 rounded-full ring-4 ring-white ${activity.type === 'learning' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                    <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-slate-800 leading-tight flex-1">{activity.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            activity.quality === 'A' || activity.quality === 'LANCAR' ? 'bg-emerald-100 text-emerald-700' :
                            activity.quality === 'B' ? 'bg-blue-100 text-blue-700' :
                            activity.quality === 'C' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                        }`}>{activity.quality || 'N/A'}</span>
                    </div>
                    {activity.detail && (
                        <p className="text-xs text-slate-500 mt-1">{activity.detail}</p>
                    )}
                    {activity.notes && activity.notes !== activity.detail && (
                        <p className="text-xs text-slate-400 italic mt-1">📝 {activity.notes}</p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-slate-400 truncate">{activity.teacher ? `👤 ${activity.teacher}` : ''}</span>
                        <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                            <Calendar size={10} />
                            {new Date(activity.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                    </div>
                    </div>
                </div>
                ))
            )}
        </div>
        
        {recentActivities.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button 
                    onClick={() => onNavigate && onNavigate(`santri-history?id=${studentId}&mode=learning&returnPath=${encodeURIComponent(`parent-view?student_id=${studentId}`)}`)}
                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-3 rounded-xl font-bold text-sm transition-colors border border-emerald-100 flex items-center justify-center gap-2"
                >
                    Riwayat Mengaji
                </button>
                <button 
                    onClick={() => onNavigate && onNavigate(`santri-history?id=${studentId}&mode=worship&returnPath=${encodeURIComponent(`parent-view?student_id=${studentId}`)}`)}
                    className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 rounded-xl font-bold text-sm transition-colors border border-purple-100 flex items-center justify-center gap-2"
                >
                    Riwayat Hafalan
                </button>
            </div>
        )}
        </div>
        
        {/* Kabar Masjid Section */}
        <div className="mt-8">
            <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <MessageCircle size={16} className="text-emerald-500"/> Kabar Masjid
            </h3>
            <div className="space-y-4">
                {kabarMasjid.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4 bg-white rounded-xl border border-slate-100">Belum ada kabar terbaru.</p>
                ) : (
                    kabarMasjid.map(post => (
                        <div 
                            key={post.id} 
                            onClick={() => setSelectedPost(post)}
                            className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                            {(post.author_name || 'A').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800">{post.author_name || 'Admin'}</h4>
                                            <p className="text-[10px] text-slate-400">{new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleShare(e, post)}
                                        className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-full transition-colors flex items-center gap-1"
                                        title="Bagikan ke WA"
                                    >
                                        <Share2 size={16} />
                                    </button>
                                </div>

                                <h4 className="font-bold text-base text-slate-800 mb-2 leading-tight">{post.title}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-3">{post.content}</p>
                                
                                {/* Image Preview (limit to 2) */}
                                {post.images && post.images.length > 0 && (
                                    <div className="flex gap-1 overflow-hidden h-40 rounded-lg bg-slate-100 mt-3">
                                        {post.images.slice(0, 2).map((img: string, idx: number) => (
                                            <div key={idx} className="flex-1 relative h-full">
                                                <img src={img} className="w-full h-full object-cover" />
                                                {idx === 1 && post.images.length > 2 && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-bold">
                                                        +{post.images.length - 2}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
      
      {/* Detail Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPost(null)}
        >
            <div 
              className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-xl rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
              onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <h3 className="font-bold text-lg text-slate-800">Detail Kabar</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => handleShare(e, selectedPost)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700"
                        >
                            <Share2 size={14} /> Bagikan ke WA
                        </button>
                        <button 
                            onClick={() => setSelectedPost(null)}
                            className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"
                        >
                            <X size={20} className="text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-0 overflow-y-auto flex-1 bg-slate-50">
                    {/* Hero Image slider if available */}
                    {selectedPost.images && selectedPost.images.length > 0 && (
                        <div className="relative group bg-slate-200">
                             <div 
                                ref={imageSliderRef}
                                onScroll={handleImageScroll}
                                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                             >
                                {selectedPost.images.map((img: string, idx: number) => (
                                    <div 
                                        key={idx} 
                                        className="snap-center shrink-0 w-full h-64 sm:h-80 relative cursor-zoom-in"
                                        onClick={() => setLightboxImage(img)}
                                    >
                                        <img src={img} alt={`Detail ${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            
                            {/* Dot Indicators */}
                            {selectedPost.images.length > 1 && (
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                                    {selectedPost.images.map((_: any, idx: number) => (
                                        <div 
                                            key={idx} 
                                            className={`transition-all duration-300 rounded-full shadow-sm ${
                                                currentImageIndex === idx 
                                                ? 'w-6 h-1.5 bg-white' 
                                                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-5 bg-white">
                        <h2 className="font-bold text-xl text-slate-900 mb-2 leading-snug">{selectedPost.title}</h2>
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                {(selectedPost.author_name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800">{selectedPost.author_name || 'Admin'}</h4>
                                <p className="text-xs text-slate-500">{new Date(selectedPost.created_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                            </div>
                        </div>

                        <div className="prose prose-sm prose-slate max-w-none">
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col justify-center items-center animate-in fade-in duration-200" onClick={() => setLightboxImage(null)}>
            <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
            >
                <X size={24} />
            </button>
            
            <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
                <img 
                    src={lightboxImage} 
                    alt="Full view" 
                    className="max-w-full max-h-full object-contain shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
      )}
    </div>
  );
}
