'use client';

import { Bell, ChevronLeft, User as UserIcon, X, LogOut, Settings, CheckCheck } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

interface HeaderProps {
  role: string | null;
  title: string;
  onBack: () => void;
  showBackButton: boolean;
  currentUser?: any;
  onLogout?: () => void;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const ICON_MAP: Record<string, string> = {
  attendance: '📋',
  learning: '📖',
  worship: '🤲',
  system: '🔔',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} hari lalu`;
}

export default function Header({ role, title, onBack, showBackButton, currentUser, onLogout }: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ─── Fetch notifications from API ───────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.mosque_id) return;
    try {
      const params = new URLSearchParams({ mosque_id: String(currentUser.mosque_id), limit: '20' });
      if (currentUser?.id) params.set('user_id', String(currentUser.id));
      const res = await fetch(`/api/notifications?${params}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Re-fetch when bell is opened
  const handleBellClick = () => {
    setShowNotif(v => !v);
    setShowUserMenu(false);
    if (!showNotif) fetchNotifications();
  };

  // ─── Mark as read ────────────────────────────────────────────────────────────
  const markRead = async (ids: number[]) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      console.error('markRead error:', err);
    }
  };

  const markAllRead = () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length) markRead(unreadIds);
  };

  // ─── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getRoleDisplay = (role: string | null) => {
    switch (role) {
      case 'superadmin': return { badge: 'SUPER ADMIN', subtitle: 'Panel Pusat', badgeClass: 'bg-slate-800 text-white' };
      case 'admin': return { badge: 'ADMIN DKM', subtitle: currentUser?.mosque_name || 'Masjid', badgeClass: 'bg-yellow-500 text-white' };
      case 'teacher': return { badge: 'GURU', subtitle: currentUser?.mosque_name || 'Masjid', badgeClass: 'bg-white/20 text-white' };
      case 'parent': return { badge: 'ORANG TUA', subtitle: 'Portal Orang Tua', badgeClass: 'bg-emerald-700 text-white' };
      default: return { badge: 'USER', subtitle: 'App', badgeClass: 'bg-white/20 text-white' };
    }
  };

  const { badge, subtitle, badgeClass } = getRoleDisplay(role);

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'superadmin': return 'bg-slate-700';
      case 'admin': return 'bg-yellow-500';
      case 'teacher': return 'bg-emerald-700';
      default: return 'bg-emerald-700';
    }
  };

  return (
    <header className="bg-emerald-600 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="flex justify-between items-center">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button onClick={onBack} className="text-white hover:bg-emerald-700 p-2 rounded-full transition">
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="font-bold text-lg leading-tight">{title}</h1>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 rounded font-bold uppercase ${badgeClass}`}>{badge}</span>
              <p className="text-xs text-emerald-100 truncate w-32">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Right: Notification + User */}
        <div className="flex gap-3 items-center">
          {/* === NOTIFICATION BELL === */}
          <div ref={notifRef} className="relative">
            <button
              onClick={handleBellClick}
              className="relative p-1 hover:bg-emerald-700 rounded-full transition"
              aria-label="Notifikasi"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotif && (
              <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-700 text-sm">Notifikasi</h3>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1">
                        <CheckCheck size={12} /> Tandai semua
                      </button>
                    )}
                    <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="text-center py-10">
                      <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">Belum ada notifikasi</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => { if (!notif.is_read) markRead([notif.id]); }}
                        className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition ${!notif.is_read ? 'bg-emerald-50' : 'bg-white'}`}
                      >
                        <div className="flex gap-3 items-start">
                          <span className="text-base shrink-0 mt-0.5">{ICON_MAP[notif.type] || '🔔'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-700 leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.created_at)}</p>
                          </div>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* === USER AVATAR / DROPDOWN === */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => { setShowUserMenu(v => !v); setShowNotif(false); }}
              className={`w-8 h-8 rounded-full border-2 border-white ${getRoleBadgeColor(role)} flex items-center justify-center hover:opacity-90 transition`}
              aria-label="Profil pengguna"
            >
              <span className="text-xs font-bold text-white">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
              </span>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-10 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                <div className="px-4 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getRoleBadgeColor(role)} flex items-center justify-center`}>
                      <span className="text-sm font-bold text-white">
                        {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.name || 'Pengguna'}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{role || 'User'}</p>
                      {currentUser?.email && (
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Settings size={16} className="text-slate-400" />
                    Pengaturan Akun
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); onLogout?.(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition border-t border-slate-100"
                  >
                    <LogOut size={16} />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
