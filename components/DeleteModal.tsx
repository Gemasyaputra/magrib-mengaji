'use client';

import { Trash2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  isLoading?: boolean;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  message,
  isLoading = false
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <Trash2 size={32} />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">{title}</h3>
          <div className="text-sm text-slate-500">
            {message}
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 py-3 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {isLoading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}
