'use client';

import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SearchableSelect from '@/components/SearchableSelect';
import DeleteModal from '@/components/DeleteModal';
import { toast } from 'sonner';
import { Mosque, StudyGroup, Santri, User } from '@/types';

interface SantriManagePageProps {
  onNavigate: (page: string) => void;
  onSave?: (message: string) => void;
  currentUser?: User | null;
}

const emptyForm = {
  mosque_id: '',
  group_id: '',
  name: '',
  parent_name: '',
  parent_phone: '',
  birth_date: '',
  gender: '',
  address: '',
  current_level: 'Iqro',
};

export default function SantriManagePage({ onNavigate, onSave, currentUser }: SantriManagePageProps) {
  /* const [santris, setSantris] = useState<Santri[]>([]);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true); */
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: 0, name: '' });
  /* const [isDeleting, setIsDeleting] = useState(false); */

  const queryClient = useQueryClient();

  // 1. Fetch Santris
  const { data: santris = [], isLoading: loadingSantri, isError: errorSantri } = useQuery<Santri[]>({
    queryKey: ['santris', currentUser?.id, currentUser?.mosque_id],
    queryFn: async () => {
      let url = '/api/students';
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
      // Handle different API response structures
      if (json.success !== false && json.data) return json.data;
      if (Array.isArray(json)) return json;
      return [];
    }
  });

  // 2. Fetch Mosques
  const { data: mosques = [] } = useQuery<Mosque[]>({
    queryKey: ['mosques'],
    queryFn: async () => {
      const res = await fetch('/api/mosques');
      const json = await res.json();
      if (json.success !== false && json.data) return json.data;
      if (Array.isArray(json)) return json;
      return [];
    }
  });

  // 3. Fetch Study Groups (Dependent on mosque_id)
  const { data: studyGroups = [] } = useQuery<StudyGroup[]>({
    queryKey: ['study-groups', formData.mosque_id, currentUser?.id],
    queryFn: async () => {
        if (!formData.mosque_id) return [];
        let url = `/api/study-groups?mosque_id=${formData.mosque_id}`;
        if (currentUser?.role === 'teacher' && currentUser?.id) {
            url += `&teacher_id=${currentUser.id}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (json.success !== false && json.data) return json.data;
        if (Array.isArray(json)) return json;
        return [];
    },
    enabled: !!formData.mosque_id
  });

  // loading state combination
  const loading = loadingSantri;

  /* REMOVED MANUAL FETCH FUNCTIONS AND USEEFFECTS */

  const openAddModal = () => {
    setEditingId(null);
    const initialMosqueId = currentUser?.mosque_id ? String(currentUser.mosque_id) : '';
    setFormData({
      ...emptyForm,
      mosque_id: initialMosqueId,
    });
    // If we have a mosque ID, fetch study groups for it immediately (will be handled by useEffect)
    setShowModal(true);
  };

  const openEditModal = (s: Santri) => {
    setEditingId(s.id);
    setFormData({
      mosque_id: String(s.mosque_id),
      group_id: s.group_id ? String(s.group_id) : '',
      name: s.name,
      parent_name: s.parent_name || '',
      parent_phone: s.parent_phone || '',
      birth_date: s.birth_date ? s.birth_date.substring(0, 10) : '', // Fix: Format date for input
      gender: s.gender || '',
      address: s.address || '',
      current_level: s.current_level || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  // Mutation: Save Santri (Create/Update)
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
        const method = editingId ? 'PUT' : 'POST';
        const body = editingId ? { id: editingId, ...payload } : payload;
        
        const res = await fetch('/api/students', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Gagal menyimpan santri');
        return json;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['santris'] });
        toast.success(editingId ? 'Santri berhasil diubah' : 'Santri berhasil ditambah');
        closeModal();
    },
    onError: (err: any) => {
        toast.error(err.message);
    }
  });

  // Mutation: Delete Santri
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
        const res = await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Gagal menghapus santri');
        return json;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['santris'] });
        toast.success('Santri berhasil dihapus');
        setDeleteModal({ isOpen: false, id: 0, name: '' });
    },
    onError: (err: any) => {
        toast.error(err.message);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }
    if (!formData.mosque_id) {
      toast.error('Pilih masjid');
      return;
    }

    const payload = {
        mosque_id: parseInt(formData.mosque_id),
        group_id: formData.group_id ? parseInt(formData.group_id) : null,
        name: formData.name.trim(),
        parent_name: formData.parent_name.trim() || null,
        parent_phone: formData.parent_phone.trim() || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        address: formData.address.trim() || null,
        current_level: formData.current_level.trim() || null,
    };

    saveMutation.mutate(payload);
  };

  const handleDelete = (id: number, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    deleteMutation.mutate(deleteModal.id);
  };

  const filteredSantris = santris.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.current_level && s.current_level.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.parent_name && s.parent_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Kelola Santri</h2>
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
          placeholder="Cari santri..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Memuat...</div>
      ) : (
        <div className="space-y-2">
          {filteredSantris.map((santri) => (
            <div
              key={santri.id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onNavigate(`santri-detail?id=${santri.id}`)}
                >
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{santri.name}</h4>
                  {santri.current_level && (
                    <p className="text-xs text-slate-500 mb-1">{santri.current_level}</p>
                  )}
                  {santri.mosque_name && (
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-semibold">
                      {santri.mosque_name}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(santri)}
                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(santri.id, santri.name)}
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

      {!loading && filteredSantris.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">
            {searchQuery ? 'Tidak ada santri ditemukan' : 'Belum ada data santri'}
          </p>
        </div>
      )}

      {!loading && santris.length > 0 && (
        <div className="mt-4 bg-slate-100 rounded-xl p-4 text-center">
          <p className="text-sm text-slate-600">
            Total: <span className="font-bold text-emerald-600">{santris.length}</span> Santri
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md md:max-w-2xl p-6 my-8 transition-all">
            <h3 className="font-bold text-lg mb-4 text-slate-800">
              {editingId ? 'Edit Santri' : 'Tambah Santri'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Masjid *</label>
                <SearchableSelect
                  disabled={!!currentUser?.mosque_id}
                  options={mosques.map(m => ({ value: m.id, label: m.name }))}
                  value={formData.mosque_id}
                  onChange={(val) => setFormData({ ...formData, mosque_id: String(val) })}
                  placeholder="Pilih Masjid"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kelompok Belajar
                </label>
                <SearchableSelect
                  options={[
                    { value: '', label: 'Pilih Kelompok' },
                    ...studyGroups
                      .filter(g => currentUser?.role === 'teacher' ? parseInt(String(g.teacher_id)) === parseInt(String(currentUser.id)) : true)
                      .map(g => {
                        const label = currentUser?.role === 'admin' && g.teacher_name 
                            ? `${g.name} - ${g.teacher_name}` 
                            : g.name;
                        return { value: g.id, label };
                      })
                  ]}
                  value={formData.group_id}
                  onChange={(val) => setFormData({ ...formData, group_id: String(val) })}
                  placeholder="Pilih Kelompok"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama santri"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Orang Tua
                </label>
                <input
                  type="text"
                  placeholder="Nama wali"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  No. HP Orang Tua
                </label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Kelamin</label>
                <SearchableSelect
                  options={[
                    { value: 'L', label: 'Laki-laki' },
                    { value: 'P', label: 'Perempuan' }
                  ]}
                  value={formData.gender}
                  onChange={(val) => setFormData({ ...formData, gender: String(val) })}
                  placeholder="Pilih Jenis Kelamin"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Level Saat Ini
                </label>
                <div className="flex bg-slate-100 p-1 rounded-lg w-full border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, current_level: 'Iqro' })}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                      formData.current_level === 'Iqro' 
                        ? 'bg-white text-emerald-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    Iqro
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, current_level: "Al-Qur'an" })}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                      formData.current_level === "Al-Qur'an" 
                        ? 'bg-white text-emerald-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    Al-Qur'an
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-2 md:col-span-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-70"
                >
                  {saveMutation.isPending ? 'Menyimpan...' : (editingId ? 'Simpan' : 'Tambah')}
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
        title="Hapus Santri?"
        message={
          <>
            Anda yakin ingin menghapus santri <span className="font-bold text-slate-800">"{deleteModal.name}"</span>? 
            Data yang dihapus tidak dapat dikembalikan.
          </>
        }
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
