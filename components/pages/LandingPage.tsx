import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, BookOpen, History, Clock, CheckCircle2, 
  ShieldCheck, Users, Database, MessageCircle, Play, 
  ArrowRight, ChevronDown, Star, GraduationCap, 
  Building, LayoutDashboard, FileText, Send, 
  Check, X, AlertTriangle, Activity
} from 'lucide-react';

// --- CUSTOM HOOK FOR SCROLL ANIMATION ---
const useElementOnScreen = (options: IntersectionObserverInit) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target); // Hanya animasi sekali
      }
    }, options);
    
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [containerRef, options]);

  return [containerRef, isVisible] as const;
};

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale';
}

const AnimateOnScroll = ({ children, className = "", delay = 0, animation = "fade-up" }: AnimateOnScrollProps) => {
  const [ref, isVisible] = useElementOnScreen({
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  });

  const getAnimationClasses = () => {
    if (!isVisible) {
      if (animation === "fade-up") return "opacity-0 translate-y-10";
      if (animation === "fade-left") return "opacity-0 translate-x-10";
      if (animation === "fade-right") return "opacity-0 -translate-x-10";
      if (animation === "scale") return "opacity-0 scale-95";
      return "opacity-0";
    }
    return "opacity-100 translate-y-0 translate-x-0 scale-100";
  };

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-700 ease-out ${getAnimationClasses()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- MOCK UI COMPONENTS (Based on PDF) ---
const MockAppUI = () => (
  <div className="relative mx-auto w-full max-w-[300px] bg-white rounded-[2rem] border-8 border-slate-800 shadow-2xl overflow-hidden h-[500px] flex flex-col">
    {/* Status Bar */}
    <div className="bg-emerald-600 text-white h-12 flex items-center justify-between px-4 text-xs font-semibold">
      <span>10:23</span>
      <div className="flex space-x-1">
        <Activity size={14} />
      </div>
    </div>
    {/* App Header */}
    <div className="bg-emerald-600 p-4 text-white rounded-b-xl shadow-sm z-10">
      <h3 className="font-bold text-lg">Input Data</h3>
      <p className="text-emerald-100 text-xs">Kamis, 26 Feb 2026</p>
    </div>
    
    {/* App Content */}
    <div className="p-4 flex-1 bg-slate-50 flex flex-col gap-3 overflow-y-auto">
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">GS</div>
        <div>
          <p className="font-bold text-sm text-slate-800">Gema Syaputra</p>
          <p className="text-xs text-slate-500">Kelompok 1</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 mb-2">PILIH DOA / MATERI</p>
        <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm text-slate-700 flex justify-between items-center">
          <span>Doa Sesudah Makan</span>
          <ChevronDown size={14} />
        </div>

        <div className="mt-4 flex gap-2">
          <button className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-200 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1">
            <CheckCircle2 size={14} /> Lulus
          </button>
          <button className="flex-1 bg-white text-slate-400 border border-slate-200 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1">
             Belum
          </button>
        </div>

        <div className="mt-4">
           <p className="text-xs font-semibold text-slate-500 mb-2">KUALITAS BACAAN</p>
           <div className="flex gap-2">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">A</div>
              <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center font-bold text-sm border border-slate-200">B</div>
              <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center font-bold text-sm border border-slate-200">C</div>
           </div>
        </div>
      </div>

      <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm mt-auto shadow-md shadow-emerald-200">
        Simpan Data
      </button>
    </div>
  </div>
);

const faqs = [
  {
    q: "Apakah pengajar yang gaptek (gagap teknologi) bisa menggunakannya?",
    a: "Sangat bisa! Antarmuka aplikasi dirancang sesederhana mungkin seperti menggunakan WhatsApp. Kami juga menyediakan panduan video lengkap dan tim support yang siap membantu."
  },
  {
    q: "Apakah data nilai dan absensi santri kami aman?",
    a: "Sangat aman. Kami menggunakan server cloud dengan enkripsi standar industri. Selain itu, sistem pencadangan (backup) otomatis dilakukan setiap minggu untuk mencegah kehilangan data seperti buku prestasi fisik yang sering terselip."
  }
];

// --- MAIN APP COMPONENT ---
export default function LandingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedRoleModal, setSelectedRoleModal] = useState<'admin' | 'teacher' | 'parent' | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BookOpen className="text-white" size={18} />
              </div>
              <span className="font-bold text-xl text-emerald-900">MagribMengaji<span className="text-emerald-500">.</span></span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#solusi" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Solusi</a>
              <a href="#fitur" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Fitur</a>
              <a href="#peran" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Akses</a>
            </div>
            <div>
              <button 
                onClick={() => onNavigate && onNavigate('login')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-md shadow-emerald-200 text-sm">
                Masuk / Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-teal-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <AnimateOnScroll animation="fade-up" delay={100}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold mb-6">
                <span className="text-xl">🚀</span> Transformasi Digital untuk Madrasah & Masjid
              </span>
            </AnimateOnScroll>
            
            <AnimateOnScroll animation="fade-up" delay={200}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                Tinggalkan Buku Kertas.<br />
                <span className="text-emerald-600">Pantau Ngaji Anak 100% Digital.</span>
              </h1>
            </AnimateOnScroll>
            
            <AnimateOnScroll animation="fade-up" delay={300}>
              <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Tinggalkan cara lama yang repot. Platform manajemen Magrib Mengaji terlengkap untuk Pengurus Masjid, MDA, Pengajar, dan Orang Tua. Pantau progres, absensi, dan hafalan secara real-time.
              </p>
            </AnimateOnScroll>
            
            <AnimateOnScroll animation="fade-up" delay={400} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={() => onNavigate && onNavigate('login')}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group">
                Buat Akun Lembaga Baru
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                <Play className="text-emerald-600" size={20} fill="currentColor" />
                Tonton Demo Aplikasi
              </button>
            </AnimateOnScroll>
          </div>
          
          <div className="flex-1 w-full max-w-md lg:max-w-none">
            <AnimateOnScroll animation="scale" delay={500} className="relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 to-teal-300 rounded-[2.5rem] transform rotate-3 scale-105 opacity-20"></div>
               <MockAppUI />
               
               {/* Floating Badges */}
               <div className="absolute top-10 -left-10 z-50 bg-white p-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="bg-green-100 p-2 rounded-full text-green-600"><CheckCircle2 size={20} /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Gema S. - Lulus</p>
                    <p className="text-sm font-bold">Doa Sesudah Makan</p>
                  </div>
               </div>
               
               <div className="absolute bottom-20 -right-8 z-50 bg-white p-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Users size={20} /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Absensi Kelas</p>
                    <p className="text-sm font-bold text-slate-800">12/12 Hadir Hari Ini</p>
                  </div>
               </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <AnimateOnScroll delay={100}>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Masalah Klasik yang Sering Menghambat Kegiatan Mengaji</h2>
              <div className="w-20 h-1 bg-red-400 mx-auto rounded-full"></div>
            </AnimateOnScroll>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <AnimateOnScroll animation="fade-up" delay={200}>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 h-full hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-red-500">
                  <FileText size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Rawan Hilang & Rusak</h3>
                <p className="text-slate-600 leading-relaxed">
                  Masih Pakai Kertas. Buku prestasi dan kartu SPP masih berupa fisik. Sangat rawan sobek, terselip, basah, atau hilang terbawa oleh anak.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={300}>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 h-full hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
                  <History size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Sulit Dilacak & Direkap</h3>
                <p className="text-slate-600 leading-relaxed">
                  Tidak ada riwayat perkembangan bacaan yang tersimpan rapi. Pengurus repot merekap data kehadiran dan nilai secara manual setiap akhir bulan.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={400}>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 h-full hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                  <Clock size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Tidak Real-Time</h3>
                <p className="text-slate-600 leading-relaxed">
                  Orang Tua Kehilangan Jejak. Informasi perkembangan anak terlambat sampai ke orang tua karena harus menunggu buku dikembalikan.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* 3. SOLUTION & HOW IT WORKS */}
      <section id="solusi" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <AnimateOnScroll delay={100}>
              <span className="text-emerald-400 font-bold tracking-wider uppercase text-sm mb-2 block">Solusi Manajemen Cerdas</span>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Selamat Tinggal Tumpukan Kertas, Halo Kemudahan</h2>
              <p className="text-slate-300 text-lg">
                Aplikasi Magrib Mengaji mengotomatiskan seluruh alur pencatatan agar pengajar fokus mendidik, dan pengurus mudah memantau.
              </p>
            </AnimateOnScroll>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-700 z-0"></div>

            {[
              {
                step: "1",
                title: "Catat Sekali Klik",
                desc: "Pengajar mengisi absensi dan nilai harian santri langsung dari smartphone. Cepat, praktis, dan anti-repot.",
                icon: <Smartphone size={32} />
              },
              {
                step: "2",
                title: "Terekap Otomatis",
                desc: "Data langsung tersimpan dengan aman di sistem. Tidak ada lagi proses hitung manual untuk laporan bulanan lembaga.",
                icon: <Database size={32} />
              },
              {
                step: "3",
                title: "Distribusi Real-Time",
                desc: "Orang tua langsung menerima update pencapaian anak detik itu juga melalui aplikasi atau WhatsApp.",
                icon: <Send size={32} />
              }
            ].map((item, idx) => (
              <AnimateOnScroll key={idx} animation="fade-up" delay={200 + (idx * 150)} className="relative z-10 text-center">
                <div className="w-24 h-24 mx-auto bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-900/20 relative">
                  {item.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full text-white font-bold flex items-center justify-center border-4 border-slate-900 text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MAIN FEATURES (Buku Penghubung) */}
      <section id="fitur" className="py-24 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <div className="flex-1 order-2 lg:order-1 relative">
              <AnimateOnScroll animation="fade-right" delay={200}>
                {/* Mockup Desktop/Tablet UI for Parent Portal */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                  <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="mx-auto bg-white px-4 py-1 rounded-md text-xs text-slate-500 font-mono shadow-sm border border-slate-100">
                      portal.magribmengaji.com/wali/gema
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-2xl">GS</div>
                      <div>
                        <h4 className="font-bold text-xl text-slate-800">Gema Syaputra</h4>
                        <p className="text-emerald-600 font-semibold">Buku Penghubung Digital</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Timeline Item 1 */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full mt-1.5"></div>
                          <div className="w-0.5 h-full bg-emerald-100 my-1"></div>
                        </div>
                        <div className="pb-4 border-b border-slate-100 flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-800">Hari Ini (Hadir)</span>
                            <span className="text-xs text-slate-500">10:45 WIB</span>
                          </div>
                          <p className="text-sm text-slate-600"><span className="font-semibold text-emerald-600">Materi:</span> Doa Sesudah Makan (Lulus)</p>
                          <p className="text-sm text-slate-600"><span className="font-semibold text-emerald-600">Nilai:</span> A (Sangat Baik)</p>
                          <div className="mt-2 bg-amber-50 p-2 rounded text-xs text-amber-800 border border-amber-100 flex gap-2 items-start">
                            <MessageCircle size={14} className="mt-0.5 shrink-0" />
                            <span>"Alhamdulillah Gema sudah hafal doa makan, tolong dirutinkan di rumah ya Bun." - Ustadz Ali</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Timeline Item 2 */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-slate-300 rounded-full mt-1.5"></div>
                        </div>
                        <div className="pb-4 flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-800">Kemarin (Hadir)</span>
                            <span className="text-xs text-slate-500">25 Feb 2026</span>
                          </div>
                          <p className="text-sm text-slate-600"><span className="font-semibold text-blue-600">Setoran:</span> Iqra Jilid 4 Hal 15</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mock WA Bubble */}
                <div className="absolute -right-6 -bottom-6 bg-[#d9fdd3] p-4 rounded-2xl rounded-tr-none shadow-xl border border-green-200 max-w-[250px]">
                  <p className="text-sm text-slate-800 mb-2">
                    Assalamualaikum, Bunda. Berikut link laporan mengaji ananda Gema hari ini ya:
                  </p>
                  <a href="#" className="text-xs text-blue-600 underline truncate block">magribmengaji.com/l/gema123</a>
                  <span className="text-[10px] text-slate-500 block text-right mt-1">11:00 ✓✓</span>
                </div>
              </AnimateOnScroll>
            </div>

            <div className="flex-1 order-1 lg:order-2">
              <AnimateOnScroll animation="fade-left" delay={100}>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                  Pantau Progres Anak Tanpa Menunggu Akhir Bulan
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  Pengajar cukup membagikan satu tautan pintar (Smart Link). Orang tua dapat langsung mengakses "Portal Wali" untuk melihat rekam jejak belajar anak secara real-time dan transparan.
                </p>
              </AnimateOnScroll>

              <div className="space-y-6">
                {[
                  {
                    title: "Satu Klik ke WhatsApp",
                    desc: "Pengajar tidak perlu mencetak laporan. Tautan unik profil santri dikirim otomatis ke WA orang tua.",
                    icon: <Smartphone className="text-green-500" size={24} />
                  },
                  {
                    title: "Detail Hafalan & Bacaan",
                    desc: "Orang tua melihat riwayat harian anak. Contoh: Senin: Iqra 4 Hal 15 - Lancar | Rabu: Al-Ma'un - Perbaiki Tajwid.",
                    icon: <BookOpen className="text-blue-500" size={24} />
                  },
                  {
                    title: "Rekap Kehadiran Akurat",
                    desc: "Orang tua tahu pasti apakah anak hadir, terlambat, atau izin di kelas Magrib Mengaji.",
                    icon: <CheckCircle2 className="text-emerald-500" size={24} />
                  },
                  {
                    title: "Catatan Ustadz (Evaluasi)",
                    desc: "Kolom khusus di mana pengajar meninggalkan pesan area yang perlu dilatih ulang oleh anak di rumah.",
                    icon: <MessageCircle className="text-amber-500" size={24} />
                  }
                ].map((item, idx) => (
                  <AnimateOnScroll key={idx} animation="fade-left" delay={200 + (idx * 100)}>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-800 mb-1">{item.title}</h4>
                        <p className="text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 4.5 AI KTP UPLOAD SECTION */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            
            <div className="flex-1 order-1 w-full">
              <AnimateOnScroll animation="fade-right" delay={100}>
                <div className="bg-white rounded-[2rem] p-8 lg:p-12 text-slate-800 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                  
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                    Otomatisasi Isi Data KTP dengan AI
                  </h2>
                  <p className="text-lg text-slate-600 mb-8">
                    Daftar akun pengajar jadi lebih mudah dan cepat. Cukup dengan mengunggah foto KTP Anda, teknologi Kecerdasan Buatan (AI) kami akan membaca dan mengisi kolom data diri secara otomatis ke dalam form.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                        <Smartphone className="text-emerald-500" size={26} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">Upload Foto</h4>
                        <p className="text-slate-500 mt-1">Ambil/unggah foto KTP Anda langsung dari perangkat Anda.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                        <CheckCircle2 className="text-blue-500" size={26} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">Ekstraksi Pintar</h4>
                        <p className="text-slate-500 mt-1">Sistem AI mengenali NIK, Nama, dan ekstraksi data lainnya.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>

            <div className="flex-1 order-2 w-full flex justify-center">
              <AnimateOnScroll animation="fade-left" delay={200}>
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white bg-slate-100 max-w-[260px] lg:max-w-[300px] mx-auto transform hover:scale-105 transition-transform duration-500">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-auto object-cover rounded-[1.5rem]"
                  >
                    <source src="/video_upload_ktp_ai.mp4" type="video/mp4" />
                    Browser Anda tidak mendukung tag video.
                  </video>
                  {/* Decorative element */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-700">AI Powered</span>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
            
          </div>
        </div>
      </section>

      {/* 5. DIFFERENTIATOR SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll delay={100}>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-16">Kenapa Beralih ke Ekosistem Kami?</h2>
          </AnimateOnScroll>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <AnimateOnScroll animation="scale" delay={200}>
              <div className="bg-emerald-600 text-white p-10 rounded-3xl shadow-xl h-full flex flex-col items-center text-center">
                <ShieldCheck size={48} className="mb-6 text-emerald-200" />
                <h3 className="text-2xl font-bold mb-4">History Belajar Permanen</h3>
                <p className="text-emerald-100 text-lg leading-relaxed">
                  Jejak hafalan, perbaikan tajwid, dan kehadiran tersimpan selamanya di database cloud yang aman. Data berharga anak Anda tidak akan pernah hilang termakan waktu.
                </p>
              </div>
            </AnimateOnScroll>
            
            <AnimateOnScroll animation="scale" delay={300}>
              <div className="bg-slate-800 text-white p-10 rounded-3xl shadow-xl h-full flex flex-col items-center text-center">
                <Users size={48} className="mb-6 text-slate-400" />
                <h3 className="text-2xl font-bold mb-4">Terintegrasi 4 Pilar</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Satu aplikasi sentral yang menghubungkan harmonis antara Pengurus Masjid/MDA, Kepala Lembaga, Pengajar di kelas, dan Orang Tua di rumah.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* 6. SERVICE TIERS / ROLES */}
      <section id="peran" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <AnimateOnScroll delay={100}>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Dirancang Khusus Sesuai Peran Anda</h2>
              <p className="text-lg text-slate-600">Setiap pengguna mendapatkan dashboard khusus yang fokus pada tugas mereka.</p>
            </AnimateOnScroll>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Role 1 */}
            <AnimateOnScroll animation="fade-up" delay={200}>
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-slate-100 overflow-hidden flex flex-col h-full group">
                <div className="h-2 bg-blue-500 w-full"></div>
                <div className="p-8 flex-1 flex flex-col">
                  <LayoutDashboard className="text-blue-500 mb-4" size={36} />
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Pengurus Masjid / Admin MDA</h3>
                  <p className="text-slate-600 mb-6 flex-1">
                    Pantau total santri aktif, kinerja pengajar, sebar Kabar Masjid (seperti foto acara Tarawih), dan cetak laporan rekapitulasi instan dari satu layar.
                  </p>
                  <button onClick={() => setSelectedRoleModal('admin')} className="text-blue-600 font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Pelajari Dasbor Admin <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Role 2 */}
            <AnimateOnScroll animation="fade-up" delay={300}>
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-slate-100 overflow-hidden flex flex-col h-full group">
                <div className="h-2 bg-emerald-500 w-full"></div>
                <div className="p-8 flex-1 flex flex-col">
                  <GraduationCap className="text-emerald-500 mb-4" size={36} />
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Pengajar / Ustadz</h3>
                  <p className="text-slate-600 mb-6 flex-1">
                    Asisten Penilaian Digital. Bebas repot menulis. Fitur input nilai (A/B/C), catatan khusus, dan absensi harian yang dirancang praktis digunakan saat mengajar.
                  </p>
                  <button onClick={() => setSelectedRoleModal('teacher')} className="text-emerald-600 font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Lihat Fitur Pengajar <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Role 3 */}
            <AnimateOnScroll animation="fade-up" delay={400}>
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-slate-100 overflow-hidden flex flex-col h-full group">
                <div className="h-2 bg-amber-500 w-full"></div>
                <div className="p-8 flex-1 flex flex-col">
                  <Smartphone className="text-amber-500 mb-4" size={36} />
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Orang Tua Santri</h3>
                  <p className="text-slate-600 mb-6 flex-1">
                    Akses Monitoring Anak. Cek riwayat perkembangan bacaan, absensi, dan catatan evaluasi dari Ustadz kapan saja dan di mana saja.
                  </p>
                  <button onClick={() => setSelectedRoleModal('parent')} className="text-amber-600 font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Cara Memantau Anak <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* 7. SOCIAL PROOF & STATS */}
      <section className="py-20 bg-emerald-600 text-white relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <AnimateOnScroll delay={100}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Standar Baru Administrasi Pendidikan Al-Qur'an</h2>
            </AnimateOnScroll>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-16 divide-y md:divide-y-0 md:divide-x divide-emerald-400/50">
            <AnimateOnScroll animation="scale" delay={200} className="py-4">
              <p className="text-5xl md:text-6xl font-extrabold mb-2">0</p>
              <p className="text-emerald-100 font-medium text-lg uppercase tracking-wider">Buku Fisik Hilang</p>
            </AnimateOnScroll>
            <AnimateOnScroll animation="scale" delay={300} className="py-4">
              <p className="text-5xl md:text-6xl font-extrabold mb-2">100%</p>
              <p className="text-emerald-100 font-medium text-lg uppercase tracking-wider">Data Terekap Otomatis</p>
            </AnimateOnScroll>
            <AnimateOnScroll animation="scale" delay={400} className="py-4">
              <p className="text-5xl md:text-6xl font-extrabold mb-2">24/7</p>
              <p className="text-emerald-100 font-medium text-lg uppercase tracking-wider">Akses Riwayat Belajar</p>
            </AnimateOnScroll>
          </div>

          <AnimateOnScroll animation="fade-up" delay={500}>
            <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg p-8 md:p-10 rounded-3xl border border-white/20 text-center relative mt-10">
              <Star className="text-amber-300 absolute -top-5 left-1/2 -translate-x-1/2" fill="currentColor" size={40} />
              <p className="text-xl md:text-2xl font-medium italic leading-relaxed mb-6 mt-4">
                "Dulu tiap akhir semester pusing merekap absensi dan nilai ratusan santri MDA. Sejak pakai sistem ini, tidak ada lagi kertas tercecer, pengurus tenang, dan orang tua senang karena bisa pantau progres anaknya secara real-time dari HP."
              </p>
              <div>
                <p className="font-bold text-lg">H. Abdullah</p>
                <p className="text-emerald-200">Pengurus DKM & Kepala MDA Al-Hikmah</p>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 8. USE CASES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <AnimateOnScroll delay={100}>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Solusi Tepat untuk Berbagai Lembaga</h2>
            </AnimateOnScroll>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
             {[
               { icon: <BookOpen />, title: "TPA / TPQ", desc: "(Taman Pendidikan Al-Qur'an)" },
               { icon: <Building />, title: "MDA / MDT", desc: "(Madrasah Diniyah Awaliyah / Takmiliyah)" },
               { icon: <Users />, title: "Magrib Mengaji", desc: "Berbasis Masjid Tingkat RW / Desa" }
             ].map((item, i) => (
                <AnimateOnScroll key={i} animation="fade-up" delay={200 + (i*100)}>
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center gap-4 hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{item.title}</h4>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                </AnimateOnScroll>
             ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ SECTION */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
             <AnimateOnScroll delay={100}>
               <h2 className="text-3xl font-bold text-slate-900 mb-4">Pertanyaan yang Sering Ditanyakan</h2>
             </AnimateOnScroll>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <AnimateOnScroll key={idx} animation="fade-up" delay={200 + (idx * 50)}>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300">
                  <button 
                    className="w-full text-left p-6 font-bold text-slate-800 flex justify-between items-center focus:outline-none"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    aria-expanded={openFaq === idx}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`transform transition-transform duration-300 text-slate-400 ${openFaq === idx ? 'rotate-180' : ''}`} size={20} />
                  </button>
                  <div 
                    className={`px-6 text-slate-600 transition-all duration-300 ease-in-out overflow-hidden ${openFaq === idx ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    {faq.a}
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="py-24 bg-slate-900 text-white text-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-600 rounded-[100%] blur-[120px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimateOnScroll delay={100}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Tinggalkan Cara Lama.<br />
              <span className="text-emerald-400">Jadikan Manajemen Lebih Profesional!</span>
            </h2>
          </AnimateOnScroll>
          
          <AnimateOnScroll delay={200}>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Bebaskan pengurus dan pengajar dari administrasi yang repot. Berikan pengalaman terbaik bagi orang tua dalam memantau progres anak mereka hari ini.
            </p>
          </AnimateOnScroll>
          
          <AnimateOnScroll delay={300} className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button 
              onClick={() => onNavigate && onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-emerald-900/50">
              Daftar / Registrasi DKM
            </button>
            <button 
              onClick={() => onNavigate && onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-slate-600 hover:border-slate-400 text-white rounded-full font-bold text-lg transition-all">
              Sudah Punya Akun? Masuk
            </button>
          </AnimateOnScroll>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-8 text-center text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-2 font-bold text-white">
             <BookOpen className="text-emerald-500" size={18} />
             MagribMengaji.
           </div>
           <p>© {new Date().getFullYear()} Hak Cipta Dilindungi. Platform Digital Madrasah & Masjid.</p>
           <div className="flex gap-4">
              <a href="#" className="hover:text-emerald-400 transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Syarat & Ketentuan</a>
           </div>
        </div>
      </footer>

      {/* Role Modal */}
      {selectedRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedRoleModal(null)}>
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedRoleModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors z-10"
            >
              <X size={24} />
            </button>

            {selectedRoleModal === 'admin' && (
              <div className="flex flex-col max-h-[90vh]">
                <div className="bg-blue-600 p-8 text-white relative overflow-hidden shrink-0">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    <LayoutDashboard size={48} className="mb-4 text-blue-200" />
                    <h2 className="text-3xl font-bold mb-2">Dasbor Pengurus / Admin</h2>
                    <p className="text-blue-100">Pusat kendali TPA/MDA Anda dalam satu genggaman.</p>
                </div>
                <div className="p-8 overflow-y-auto">
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-1" size={20} /> <span className="text-slate-700">Manajemen Data Santri & Pengajar yang rapi, bisa lihat statistik global.</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-1" size={20} /> <span className="text-slate-700">Membagikan pengumuman atau acara (Kabar Masjid) langsung ke semua Guru & Orang Tua.</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-1" size={20} /> <span className="text-slate-700">Cetak Laporan Otomatis. Tidak perlu kumpul buku absen lagi saat akhir semester.</span></li>
                    </ul>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-600 text-sm">
                        "Sebagai pengurus, ini menghemat ratusan jam saya di akhir semester. Semuanya terekam dengan jelas!"
                    </div>
                </div>
              </div>
            )}

            {selectedRoleModal === 'teacher' && (
              <div className="flex flex-col max-h-[90vh]">
                <div className="bg-emerald-600 p-8 text-white relative overflow-hidden shrink-0">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    <GraduationCap size={48} className="mb-4 text-emerald-200" />
                    <h2 className="text-3xl font-bold mb-2">Asisten Mengajar Digital</h2>
                    <p className="text-emerald-100">Fokus pada kualitas mengaji santri, biarkan sistem yang merekapnya.</p>
                </div>
                <div className="p-8 overflow-y-auto">
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-start gap-3"><CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} /> <span className="text-slate-700">Input nilai (A,B,C) dan setoran Iqro/Quran sangat cepat & efisien saat proses mengajar tanpa mengganggu konsentrasi.</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} /> <span className="text-slate-700">Klik & Tap Absensi Harian semudah menggunakan sosial media.</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} /> <span className="text-slate-700">Langsung bisa menulis pesan atau evaluasi hafalan (Doa/Sholat) yang otomatis terbaca oleh wali santri.</span></li>
                    </ul>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-600 text-sm flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                        <span>"Ustadz/ah tinggal mengajar seperti biasa, HP di atas meja. Lebih cepat dari mencari halaman di buku fisik."</span>
                    </div>
                </div>
              </div>
            )}

            {selectedRoleModal === 'parent' && (
              <div className="flex flex-col max-h-[90vh]">
                <div className="bg-amber-500 p-8 text-white relative overflow-hidden shrink-0">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    <Smartphone size={48} className="mb-4 text-amber-200" />
                    <h2 className="text-3xl font-bold mb-2">Portal Orang Tua</h2>
                    <p className="text-amber-100">Buku penghubung digital yang transparan dan informatif.</p>
                </div>
                <div className="p-8 overflow-y-auto">
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-start gap-3"><CheckCircle2 className="text-amber-500 shrink-0 mt-1" size={20} /> <span className="text-slate-700">Menerima link akses pintar (tanpa ribet password) langsung dari WhatsApp.</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="text-amber-500 shrink-0 mt-1" size={20} /> <span className="text-slate-700">Melihat detail anaknya sampai Iqro jilid berapa atau hafalannya sudah sampai di mana.</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="text-amber-500 shrink-0 mt-1" size={20} /> <span className="text-slate-700">Melihat pesan penyemangat atau teguran dari Ustadz di satu layar interaktif yang mudah dipahami.</span></li>
                    </ul>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => {
                                setSelectedRoleModal(null);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                            className="bg-amber-50 text-amber-600 px-6 py-2.5 rounded-full font-bold hover:bg-amber-100 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}