'use client';

import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import DeleteModal from '@/components/DeleteModal';

interface Mosque {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  name: string;
}

interface StudyGroup {
  id: number;
  mosque_id: number;
  teacher_id: number | null;
  name: string;
  description: string | null;
  mosque_name?: string;
  teacher_name?: string;
}

interface User {
  id: number;
  name: string;
  role: 'teacher' | 'admin' | 'parent' | 'superadmin' | null;
  mosque_id?: number;
}

interface StudyGroupManagePageProps {
  onNavigate: (page: string) => void;
  onSave?: (message: string) => void;
  currentUser?: User | null;
}

const emptyForm = {
  mosque_id: '',
  teacher_id: '',
  name: '',
  description: '',
};

export default function StudyGroupManagePage({ onNavigate, onSave, currentUser }: StudyGroupManagePageProps) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: 0, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = async () => {
    try {
      let url = '/api/study-groups';
      const params = new URLSearchParams();
      if (currentUser?.mosque_id) {
        params.append('mosque_id', String(currentUser.mosque_id));
      }
      if (currentUser?.role === 'teacher' && currentUser?.id) {
        params.append('teacher_id', String(currentUser.id));
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      const json = await res.json();
      if (json.success !== false && json.data) {
        setGroups(json.data);
      } else if (Array.isArray(json)) {
        setGroups(json);
      }
    } catch (e) {
      console.error(e);
      onSave?.('Gagal memuat data kelompok belajar');
    } finally {
      setLoading(false);
    }
  };

  const fetchMosques = async () => {
    try {
      const res = await fetch('/api/mosques');
      const json = await res.json();
      if (json.success !== false && json.data) {
        setMosques(json.data);
      } else if (Array.isArray(json)) {
        setMosques(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeachers = async (mosqueId?: string) => {
    try {
      let url = '/api/teachers';
      if (mosqueId) {
        url += `?mosque_id=${mosqueId}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success !== false && json.data) {
        setTeachers(json.data);
      } else if (Array.isArray(json)) {
        setTeachers(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchMosques();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (formData.mosque_id) {
      fetchTeachers(formData.mosque_id);
    } else {
      setTeachers([]); 
    }
  }, [formData.mosque_id]);

  const openAddModal = () => {
    setEditingId(null);
    const initialMosqueId = currentUser?.mosque_id ? String(currentUser.mosque_id) : '';
    setFormData({
      ...emptyForm,
      mosque_id: initialMosqueId,
    });
    // If we have a mosque ID, fetch teachers for it immediately
    if (initialMosqueId) {
      fetchTeachers(initialMosqueId);
    }
    setShowModal(true);
  };

  const openEditModal = (g: StudyGroup) => {
    setEditingId(g.id);
    setFormData({
      mosque_id: String(g.mosque_id),
      teacher_id: g.teacher_id ? String(g.teacher_id) : '',
      name: g.name,
      description: g.description || '',
    });
    fetchTeachers(String(g.mosque_id)); // update teachers for this mosque
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onSave?.('Nama kelompok wajib diisi');
      return;
    }
    if (!formData.mosque_id) {
      onSave?.('Pilih masjid');
      return;
    }

    try {
      const payload = {
        mosque_id: parseInt(formData.mosque_id),
        teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : null,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      };

      if (editingId) {
        const res = await fetch('/api/study-groups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const json = await res.json();
        if (json.success) {
          onSave?.('Kelompok berhasil diubah');
          fetchGroups();
          closeModal();
        } else {
          onSave?.(json.error || 'Gagal mengubah kelompok');
        }
      } else {
        const res = await fetch('/api/study-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          onSave?.('Kelompok berhasil ditambah');
          fetchGroups();
          closeModal();
        } else {
          onSave?.(json.error || 'Gagal menambah kelompok');
        }
      }
    } catch (err) {
      console.error(err);
      onSave?.('Terjadi kesalahan');
    }
  };

  const handleDelete = (id: number, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/study-groups?id=${deleteModal.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        onSave?.('Kelompok berhasil dihapus');
        fetchGroups();
        setDeleteModal({ isOpen: false, id: 0, name: '' });
      } else {
        onSave?.(json.error || 'Gagal menghapus kelompok');
      }
    } catch (err) {
      console.error(err);
      onSave?.('Terjadi kesalahan');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Kelola Kelompok Belajar</h2>
        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 transition-colors"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari kelompok..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Memuat...</div>
      ) : (
        <div className="space-y-2">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{group.name}</h4>
                  {group.description && (
                    <p className="text-xs text-slate-500 mb-1">{group.description}</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-semibold">
                      ID: {group.id}
                    </span>
                    {/* Ideally calculate member count here if API returned it */}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(group)}
                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id, group.name)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">
            {searchQuery ? 'Tidak ada kelompok ditemukan' : 'Belum ada data kelompok'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4 text-slate-800">
              {editingId ? 'Edit Kelompok' : 'Tambah Kelompok'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Masjid *</label>
                <select
                  required
                  value={formData.mosque_id}
                  onChange={(e) => setFormData({ ...formData, mosque_id: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  disabled={!!currentUser?.mosque_id} // Disable if user is bound to a mosque
                >
                  <option value="">Pilih Masjid</option>
                  {mosques.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Kelompok *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama kelompok"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pengajar</label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Pilih Pengajar (opsional)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi kelompok"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {editingId ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '' })}
        onConfirm={executeDelete}
        title="Hapus Kelompok?"
        message={
          <>
            Anda yakin ingin menghapus kelompok <span className="font-bold text-slate-800">"{deleteModal.name}"</span>? 
            Data yang dihapus tidak dapat dikembalikan.
          </>
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
