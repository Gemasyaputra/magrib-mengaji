'use client';

import { Plus, Mail, Phone, Trash2, Edit2, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import DeleteModal from '@/components/DeleteModal';
import { toast } from 'sonner';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  mosque_name?: string;
  mosque_id?: number;
}

interface ManageTeachersPageProps {
  onNavigate: (page: string) => void;
  currentUser?: any;
}

export default function ManageTeachersPage({ onNavigate, currentUser }: ManageTeachersPageProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: 0, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Teachers
  const fetchTeachers = async () => {
      if (!currentUser?.mosque_id) return;
      try {
          const res = await fetch(`/api/teachers?mosque_id=${currentUser.mosque_id}`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
              setTeachers(json.data);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchTeachers();
  }, [currentUser]);

  const handleOpenAdd = () => {
      setIsEditing(false);
      setFormData({ name: '', email: '', phone: '' });
      setShowModal(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
      setIsEditing(true);
      setCurrentTeacherId(teacher.id);
      setFormData({
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone || ''
      });
      setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !currentUser?.mosque_id) return;

    try {
        const url = isEditing ? '/api/teachers' : '/api/teachers';
        const method = isEditing ? 'PUT' : 'POST';
        
        const payload: any = {
            ...formData,
            mosque_id: currentUser.mosque_id
        };
        
        if (isEditing && currentTeacherId) {
            payload.id = currentTeacherId;
        }

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (json.success) {
            setShowModal(false);
            fetchTeachers();
            setFormData({ name: '', email: '', phone: '' });
        } else {
            toast.error(json.error || 'Gagal menyimpan data');
        }

    } catch (err) {
        console.error(err);
        toast.error('Terjadi kesalahan sistem');
    }
  };

  const handleDelete = (id: number, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

    const executeDelete = async () => {
    if(!deleteModal.id) return;
    setIsDeleting(true);
    try {
        const res = await fetch(`/api/teachers?id=${deleteModal.id}`, { method: 'DELETE' });
        const json = await res.json();
        if(json.success) {
            fetchTeachers();
            setDeleteModal({ isOpen: false, id: 0, name: '' });
        } else {
            toast.error(json.error || 'Gagal menghapus');
        }
    } catch (err) {
        console.error(err);
        toast.error('Terjadi kesalahan');
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="p-4">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Data Guru</h2>
        <button
          onClick={handleOpenAdd}
          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

        {loading ? (
            <div className="text-center text-slate-500 py-10">Memuat data guru...</div>
        ) : (
          /* Teachers List */
          <div className="space-y-3">
            {teachers.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 rounded-xl text-slate-500 text-sm">
                    Belum ada data guru.
                </div>
            ) : (
                teachers.map(teacher => (
                <div key={teacher.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="mb-3">
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{teacher.name}</h4>
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[10px] rounded font-semibold uppercase">
                        {teacher.mosque_name || 'Masjid'}
                    </span>
                    </div>
                    <div className="space-y-1 mb-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                        <Mail size={12} />
                        <span>{teacher.email}</span>
                    </div>
                    {teacher.phone && (
                        <div className="flex items-center gap-2">
                            <Phone size={12} />
                            <span>{teacher.phone}</span>
                        </div>
                    )}
                    </div>
                    <div className="flex gap-2">
                    <button 
                        onClick={() => handleOpenEdit(teacher)}
                        className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-blue-200"
                    >
                        <Edit2 size={12} /> Edit
                    </button>
                    <button
                        onClick={() => handleDelete(teacher.id, teacher.name)}
                        className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-red-200"
                    >
                        <Trash2 size={12} /> Hapus
                    </button>
                    </div>
                </div>
                ))
            )}
          </div>
      )}

      {/* Add/Edit Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-slate-800">
                {isEditing ? 'Edit Guru' : 'Tambah Guru'}
            </h3>
            <div className="space-y-3 mb-4">
              <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Email (Login)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Nomor Telepon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <X size={16} /> Batal
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
               <Save size={16} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
        onConfirm={executeDelete}
        title="Hapus Guru?"
        message={
          <>
            Anda yakin ingin menghapus guru <span className="font-bold text-slate-800">"{deleteModal.name}"</span>? 
            Data yang dihapus tidak dapat dikembalikan.
          </>
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
