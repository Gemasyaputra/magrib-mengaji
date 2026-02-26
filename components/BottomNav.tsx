'use client';

import { Home, Users, MessageSquare, Settings, BarChart3, BookOpen } from 'lucide-react';

interface BottomNavProps {
  role: string;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function BottomNav({ role, currentPage, onNavigate }: BottomNavProps) {
  const getNavItems = (role: string) => {
    switch (role) {
      case 'superadmin':
        return [
          { id: 'dashboard-superadmin', label: 'Home', icon: Home },
          { id: 'login', label: 'Keluar', icon: Settings },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Home', icon: Home },
          { id: 'santri-list', label: 'Santri', icon: Users },
          { id: 'kabar', label: 'Kabar', icon: MessageSquare },
          { id: 'login', label: 'Keluar', icon: Settings },
        ];
      case 'teacher':
        return [
          { id: 'dashboard', label: 'Home', icon: Home },
          { id: 'presensi', label: 'Presensi', icon: BarChart3 },
          { id: 'kabar', label: 'Kabar', icon: MessageSquare },
          { id: 'login', label: 'Keluar', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(role);
  const isSuperAdmin = role === 'superadmin';

  return (
    <nav className="bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 max-w-md mx-auto">
      <div className={`h-16 grid ${isSuperAdmin ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
              currentPage === id || (id === 'santri-list' && currentPage?.startsWith('santri-detail'))
                ? 'text-emerald-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
