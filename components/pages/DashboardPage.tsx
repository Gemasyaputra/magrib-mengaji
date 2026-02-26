'use client';

import { useEffect, useState } from 'react';
import { Activity, BookOpen, Clock, Home, MapPin, Users } from 'lucide-react';

interface DashboardPageProps {
  role: string | null;
  onNavigate: (page: string) => void;
  currentUser?: any;
}

interface PrayerTime {
  name: string;
  time: string;
}

interface AladhanResponse {
  code: number;
  data: {
    date: {
      hijri: {
        day: string;
        month: { en: string };
        year: string;
      };
      gregorian: {
        date: string;
        weekday: { en: string };
      };
    };
    timings: Record<string, string>;
  };
}

const PRAYERS = [
  { id: 'Fajr', label: 'Subuh' },
  { id: 'Dhuhr', label: 'Dhuhr' },
  { id: 'Asr', label: 'Asr' },
  { id: 'Maghrib', label: 'Maghrib' },
  { id: 'Isha', label: 'Isha' },
] as const;

const WEEKDAY_ID: Record<string, string> = {
  Monday: 'Senin',
  Tuesday: 'Selasa',
  Wednesday: 'Rabu',
  Thursday: 'Kamis',
  Friday: 'Jumat',
  Saturday: 'Sabtu',
  Sunday: 'Minggu',
};

export default function DashboardPage({ role, onNavigate, currentUser }: DashboardPageProps) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [hijriDate, setHijriDate] = useState<string>('Memuat...');
  const [gregDate, setGregDate] = useState<string>('Memuat...');
  const [locationLabel, setLocationLabel] = useState<string>('Mencari Lokasi...');
  const [nextPrayerName, setNextPrayerName] = useState<string>('...');
  const [nextPrayerTime, setNextPrayerTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>('--:--:--');
  const [stats, setStats] = useState({ total_santri: 0, present_today: 0, mosque_name: 'Masjid Anda' });

  // Fetch Dashboard Stats
  useEffect(() => {
      if (!currentUser?.mosque_id) return;
      const fetchStats = async () => {
          try {
              let url = `/api/dashboard/stats?mosque_id=${currentUser.mosque_id}`;
              if (currentUser.role === 'teacher' && currentUser.id) {
                  url += `&teacher_id=${currentUser.id}`;
              }
              const res = await fetch(url);
              const json = await res.json();
              if (json.success) {
                  setStats(json.data);
              }
          } catch (err) {
              console.error(err);
          }
      };
      fetchStats();
  }, [currentUser]);

  // Ambil jadwal shalat dari API Aladhan (dengan geolokasi jika ada)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchPrayerTimes = async (lat: number, lng: number) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=11`;

      try {
        const res = await fetch(url);
        const json: AladhanResponse = await res.json();

        if (json.code !== 200) return;

        const { date, timings } = json.data;

        // Tanggal Hijriyah
        const h = date.hijri;
        setHijriDate(`${h.day} ${h.month.en} ${h.year} H`);

        // Tanggal Masehi + hari Indonesia
        const g = date.gregorian;
        const hariId = WEEKDAY_ID[g.weekday.en] ?? g.weekday.en;
        setGregDate(`${hariId}, ${g.date}`);

        // Lokasi label
        setLocationLabel((prev) =>
          prev === 'Mencari Lokasi...' ? 'Lokasi Terkini' : prev,
        );

        // Grid jadwal shalat + hitung shalat berikutnya
        const now = new Date();
        let upcomingName = '';
        let upcomingTime: Date | null = null;
        let minDiff = Infinity;

        const timesForState: PrayerTime[] = PRAYERS.map((p) => {
          const timeStr = timings[p.id]; // "HH:MM"

          const [hours, minutes] = timeStr.split(':').map((n) => parseInt(n, 10));
          const pTime = new Date();
          pTime.setHours(hours, minutes, 0, 0);

          if (pTime > now) {
            const diff = pTime.getTime() - now.getTime();
            if (diff < minDiff) {
              minDiff = diff;
              upcomingName = p.label;
              upcomingTime = pTime;
            }
          }

          return { name: p.label, time: timeStr };
        });

        // Jika sudah lewat Isya, set ke Subuh besok
        if (!upcomingTime) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const fajrTime = timings['Fajr'];
          const [fh, fm] = fajrTime.split(':').map((n) => parseInt(n, 10));
          tomorrow.setHours(fh, fm, 0, 0);
          upcomingTime = tomorrow;
          upcomingName = 'Subuh';
        }

        setPrayerTimes(timesForState);
        setNextPrayerName(upcomingName);
        setNextPrayerTime(upcomingTime);
      } catch {
        setHijriDate('Gagal memuat data');
      }
    };

    if (navigator.geolocation) {
      setLocationLabel('Mencari Lokasi...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setLocationLabel('Jakarta (Default)');
          fetchPrayerTimes(-6.2088, 106.8456);
        },
      );
    } else {
      setLocationLabel('Jakarta (Default)');
      fetchPrayerTimes(-6.2088, 106.8456);
    }
  }, []);

  // Jam realtime + countdown menuju shalat berikutnya
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour12: false,
        }),
      );

      if (nextPrayerTime) {
        const diff = nextPrayerTime.getTime() - now.getTime();
        if (diff > 0) {
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor(
            (diff % (1000 * 60 * 60)) / (1000 * 60),
          );
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          const pad = (n: number) => n.toString().padStart(2, '0');
          setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        } else {
          setCountdown('00:00:00');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextPrayerTime]);

  const dashboardMenu = [
    {
      icon: Users,
      label: 'Santri',
      page: 'santri-list',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      icon: Activity,
      label: 'Presensi',
      page: 'presensi',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      icon: BookOpen,
      label: 'Setoran Doa',
      page: 'input-hafalan-doa',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      icon: Users,
      label: 'Kelompok',
      page: 'study-groups',
      color: 'bg-orange-50 text-orange-600 border-orange-100',
    },
  ];

  if (role === 'admin') {
      dashboardMenu.push({
          icon: Users,
          label: 'Data Guru',
          page: 'manage-teachers',
          color: 'bg-teal-50 text-teal-600 border-teal-100',
      });
  }

  if (role === 'teacher') {
      dashboardMenu.push({
          icon: BookOpen,
          label: 'Setoran Tilawah',
          page: 'input-iqro',
          color: 'bg-purple-50 text-purple-600 border-purple-100',
      });
  }

  if (role === 'admin' || role === 'teacher') {
      dashboardMenu.push({
          icon: BookOpen,
          label: 'Bank Materi',
          page: 'master-hafalan',
          color: 'bg-purple-50 text-purple-600 border-purple-100',
      });
  }

  return (
    <div className="p-4">
      {/* Kartu Salam + Jadwal Shalat ala desain */}
      <div className="bg-linear-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 text-8xl -mr-4 -mt-4">
          <Home size={80} />
        </div>
        <p className="text-sm opacity-90">Assalamualaikum,</p>
        <h2 className="text-2xl font-bold mb-2">{currentUser?.name || 'Ustadz Ali'}</h2>

        <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm mb-4">
          <Users size={12} className="mr-1" />
          <span>{stats.mosque_name}</span>
        </div>

        <div className="border-t border-white/20 pt-3 mt-3">
          <div className="flex justify-between items-start mb-3">
            <div className="text-[10px] space-y-1">
              <p className="text-emerald-100 font-medium">{hijriDate}</p>
              <p className="text-[11px] font-bold text-white">{gregDate}</p>
              <p className="text-[9px] text-emerald-200 flex items-center gap-1">
                <MapPin size={10} />
                <span>{locationLabel}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold leading-none">{currentTime || '--:--:--'}</p>
              <p className="text-[9px] text-emerald-100 mt-1">
                Menuju <span className="font-semibold">{nextPrayerName}</span>:{' '}
                <span className="font-mono">{countdown}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1 text-center text-[11px]">
            {prayerTimes.map((p) => (
              <div key={p.name} className="bg-white/10 rounded p-1">
                <p className="text-[8px] uppercase opacity-80">{p.name}</p>
                <p className="text-xs font-bold">{p.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistik ringkas */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500">Total Santri</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.total_santri}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500">Hadir Hari Ini</p>
          <h3 className="text-2xl font-bold text-emerald-600">{stats.present_today}</h3>
        </div>
      </div>

      {/* Menu utama */}
      <div className="mb-4">
        <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">
          Menu Utama
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {dashboardMenu.map(({ icon: Icon, label, page, color }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`${color} border rounded-xl p-4 text-center shadow-sm active:bg-slate-50 transition`}
            >
              <Icon className="mx-auto mb-2" size={22} />
              <p className="text-xs font-semibold">{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
