'use client';

import { useState, useEffect } from 'react';
import { Users, Globe, User, Mail, Phone, ChevronRight, ArrowLeft, Edit2, Lock, Trash2, Plus, Save } from 'lucide-react';
import DeleteModal from '@/components/DeleteModal';
import { toast } from 'sonner';

interface SuperAdminMosqueDetailProps {
  onNavigate: (page: string) => void;
  mosqueId?: string | null; // Passed from parent if needed, or stripped from URL
}

interface MosqueDetail {
  id: number;
  name: string;
  address: string;
  contact_phone: string;
  santri_count: number;
  guru_count: number;
}

interface DKMAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function SuperAdminMosqueDetail({ onNavigate, mosqueId }: SuperAdminMosqueDetailProps) {
  // Mosque ID is passed from parent component (app/page.tsx) or undefined if not provided
  
  const [activeTab, setActiveTab] = useState<'profile' | 'dkm'>('profile');
  const [mosque, setMosque] = useState<MosqueDetail | null>(null);
  const [admins, setAdmins] = useState<DKMAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use prop directly
  const id = mosqueId;

  // Modal State for DKM
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<DKMAdmin | null>(null);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });

  // Edit Mosque State
  const [isEditingMosque, setIsEditingMosque] = useState(false);
  const [mosqueForm, setMosqueForm] = useState({ name: '', address: '', contact_phone: '' });
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: 0, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
        fetchDetail(id);
        fetchAdmins(id);
    }
  }, [id]);

  // Fetch logic
  const fetchDetail = async (mId: string) => {
      setLoading(true);
      try {
          const res = await fetch(`/api/mosques/detail?id=${mId}`);
          const json = await res.json();
          if (json.success) {
              setMosque(json.data);
              setMosqueForm({
                  name: json.data.name,
                  address: json.data.address || '',
                  contact_phone: json.data.contact_phone || ''
              });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const fetchAdmins = async (mId: string) => {
      try {
          const res = await fetch(`/api/users?mosque_id=${mId}&role=admin`);
          const json = await res.json();
          if (json.success) {
              setAdmins(json.data);
          }
      } catch (e) {
          console.error(e);
      }
  };



  const handleMosqueUpdate = async () => {
      if (!mosque) return;
      try {
          const res = await fetch('/api/mosques/detail', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: mosque.id, ...mosqueForm })
          });
          const json = await res.json();
          if (json.success) {
              setMosque({ ...mosque, ...mosqueForm });
              setIsEditingMosque(false);
              toast.success('Data masjid berhasil disimpan');
          } else {
              toast.error(json.error);
          }
      } catch (e) {
          toast.error('Gagal menyimpan');
      }
  };

  const handleAdminSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!mosque) return;
      
      try {
          const method = editingAdmin ? 'PUT' : 'POST';
          const payload: any = { ...adminForm, mosque_id: mosque.id, role: 'admin' };
          if (editingAdmin) {
              payload.id = editingAdmin.id;
              // Only send fields that changed? API handles optional.
          }

          const res = await fetch('/api/users', {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          const json = await res.json();
          if (json.success) {
              setShowModal(false);
              setEditingAdmin(null);
              setAdminForm({ name: '', email: '', password: '' });
              fetchAdmins(String(mosque.id));
              toast.success('Data admin berhasil disimpan');
          } else {
              toast.error(json.error);
          }
      } catch (e) {
          console.error(e);
          toast.error('Terjadi kesalahan');
      }
  };

  const handleDeleteAdmin = (adminId: number, name: string) => {
    setDeleteModal({ isOpen: true, id: adminId, name });
  };
  
  const executeDeleteAdmin = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users?id=${deleteModal.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
          if (mosque) fetchAdmins(String(mosque.id));
          setDeleteModal({ isOpen: false, id: 0, name: '' });
      } else {
          toast.error('Gagal menghapus');
      }
    } catch (e) {
      toast.error('Error');
    } finally {
      setIsDeleting(false);
    }
  };
  


  if (!id && !loading && !mosque) {
       return <div className="p-4">Loading ID...</div>;
  }

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50">
      <div className="flex items-center gap-4 mb-6">
          <button onClick={() => onNavigate('dashboard-superadmin')} className="text-slate-500 hover:text-slate-700">
              <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-lg text-slate-800">Detail Masjid</h1>
      </div>

      {loading && !mosque ? (
          <div className="text-center py-10">Memuat info masjid...</div>
      ) : (
        <>
            {/* Header / Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <Globe size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">{mosque?.name}</h2>
                    <p className="text-sm text-slate-500">{mosque?.address}</p>
                </div>

                <div className="flex border-b border-slate-100">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'profile' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
                    >
                        Profil & Statistik
                    </button>
                    <button 
                        onClick={() => setActiveTab('dkm')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'dkm' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
                    >
                        Akun DKM
                    </button>
                </div>
            </div>

            {/* TAB 1: Profil & Statistik */}
            {activeTab === 'profile' && mosque && (
                <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                            <p className="text-2xl font-bold text-blue-600">{mosque.santri_count}</p>
                            <p className="text-[10px] text-blue-600 uppercase font-bold">Total Santri</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center">
                            <p className="text-2xl font-bold text-purple-600">{mosque.guru_count}</p>
                            <p className="text-[10px] text-purple-600 uppercase font-bold">Total Guru</p>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700">Data Masjid</h3>
                            <button 
                                onClick={() => setIsEditingMosque(!isEditingMosque)}
                                className="text-emerald-600 text-sm font-bold"
                            >
                                {isEditingMosque ? 'Batal' : 'Edit'}
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">NAMA MASJID</label>
                                <input 
                                    type="text" 
                                    disabled={!isEditingMosque}
                                    value={mosqueForm.name}
                                    onChange={(e) => setMosqueForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 disabled:text-slate-500 focus:outline-none focus:border-emerald-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">ALAMAT</label>
                                <textarea 
                                    disabled={!isEditingMosque}
                                    value={mosqueForm.address}
                                    onChange={(e) => setMosqueForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 disabled:text-slate-500 focus:outline-none focus:border-emerald-500 h-20 resize-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">KONTAK</label>
                                <input 
                                    type="text" 
                                    disabled={!isEditingMosque}
                                    value={mosqueForm.contact_phone}
                                    onChange={(e) => setMosqueForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 disabled:text-slate-500 focus:outline-none focus:border-emerald-500" 
                                />
                            </div>
                            {isEditingMosque && (
                                <button 
                                    onClick={handleMosqueUpdate}
                                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl mt-2"
                                >
                                    Simpan Perubahan
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: Akun DKM */}
            {activeTab === 'dkm' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Daftar Admin DKM</h3>
                        <button 
                            onClick={() => {
                                setEditingAdmin(null);
                                setAdminForm({ name: '', email: '', password: '' });
                                setShowModal(true);
                            }}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                            <Plus size={16} /> Tambah
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
                        {admins.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 italic">Belum ada admin terdaftar.</div>
                        ) : (
                            admins.map(admin => (
                                <div key={admin.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{admin.name}</h4>
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <Mail size={12} /> {admin.email}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                setEditingAdmin(admin);
                                                setAdminForm({ name: admin.name, email: admin.email, password: '' });
                                                setShowModal(true);
                                            }}
                                            className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-emerald-600 hover:bg-emerald-50"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                            className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
      )}

      {/* Modal DKM */}
      {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                  <h2 className="font-bold text-lg mb-4">{editingAdmin ? 'Edit Admin DKM' : 'Tambah Admin DKM'}</h2>
                  <form onSubmit={handleAdminSave} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">NAMA LENGKAP</label>
                          <input 
                            type="text" 
                            required
                            value={adminForm.name}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">EMAIL</label>
                          <input 
                            type="email" 
                            required
                            value={adminForm.email}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                              {editingAdmin ? 'PASSWORD BARU (Kosongkan jika tidak ubah)' : 'PASSWORD'}
                          </label>
                          <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                required={!editingAdmin}
                                value={adminForm.password}
                                onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                placeholder="******" 
                            />
                          </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-slate-600 font-bold bg-slate-100 rounded-lg hover:bg-slate-200">
                              Batal
                          </button>
                          <button type="submit" className="flex-1 py-2 text-white font-bold bg-emerald-600 rounded-lg hover:bg-emerald-700">
                              Simpan
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
        onConfirm={executeDeleteAdmin}
        title="Hapus Admin?"
        message={
          <>
            Anda yakin ingin menghapus admin <span className="font-bold text-slate-800">"{deleteModal.name}"</span>? 
            Tindakan ini tidak dapat dibatalkan.
          </>
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
