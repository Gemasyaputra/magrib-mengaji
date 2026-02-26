'use client';

import { Check } from 'lucide-react';

interface ToastProps {
  visible: boolean;
  message: string;
}

export default function Toast({ visible, message }: ToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 flex items-center gap-2 w-64 justify-center transition-opacity duration-300">
      <Check size={16} className="text-emerald-400" />
      <span>{message}</span>
    </div>
  );
}
