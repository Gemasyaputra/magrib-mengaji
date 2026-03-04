  'use client';

import { useState, useEffect } from 'react';
import { Globe, Users, Plus, X, Trash2, Search, ChevronLeft, ChevronRight, Edit2, MoreVertical } from 'lucide-react';
import DeleteModal from '@/components/DeleteModal';
import { toast } from 'sonner';

interface Mosque {
  id: number;
  name: string;
  address: string;
  santri: number;
  guru: number;
  is_approved?: boolean;
}

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser?: any;
}

export default function SuperAdminDashboard({ onNavigate, currentUser }: SuperAdminDashboardProps) {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', address: '', contact_phone: '' });
  const [saving, setSaving] = useState(false);
  
  // Super Admin Management State
  const [superAdmins, setSuperAdmins] = useState<any[]>([]);
  const [loadingSuperAdmins, setLoadingSuperAdmins] = useState(false);
  const [showAddSuperAdmin, setShowAddSuperAdmin] = useState(false);
  const [addSuperAdminForm, setAddSuperAdminForm] = useState({ name: '', email: '' });
  
  const [showEditSuperAdmin, setShowEditSuperAdmin] = useState(false);
  const [editSuperAdminId, setEditSuperAdminId] = useState<number | null>(null);
  const [editSuperAdminForm, setEditSuperAdminForm] = useState({ name: '', email: '' });
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: 0, name: '', type: 'mosque' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [mainTab, setMainTab] = useState<'mosques'|'superadmins'>('mosques');
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const ITEMS_PER_PAGE = 5;

  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Filter & Pagination Logic
  const filteredMosques = mosques.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'approved' ? m.is_approved === true : m.is_approved === false;
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filteredMosques.length / ITEMS_PER_PAGE);
  const paginatedMosques = filteredMosques.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filteredSuperAdmins = superAdmins.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalSaPages = Math.ceil(filteredSuperAdmins.length / ITEMS_PER_PAGE);
  const paginatedSuperAdmins = filteredSuperAdmins.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchMosques = async () => {
    try {
      const res = await fetch('/api/mosques');
      const json = await res.json();
      if (json.success) {
        const mapped = json.data.map((m: any) => ({
          id: m.id,
          name: m.name,
          address: m.address || '',
          santri: Number(m.santri_count || 0),
          guru: Number(m.guru_count || 0),
          is_approved: m.is_approved
        }));
        setMosques(mapped);
      }
    } catch (e) {
      console.error('Failed to fetch mosques', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuperAdmins = async () => {
    setLoadingSuperAdmins(true);
    try {
        const res = await fetch('/api/users?role=superadmin');
        const json = await res.json();
        if (json.success) setSuperAdmins(json.data || []);
    } catch (err) {
        console.error(err);
    } finally {
        setLoadingSuperAdmins(false);
    }
  };

  useEffect(() => {
    fetchMosques();
    fetchSuperAdmins();
  }, []);

  const handleAddMosque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/mosques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setAddForm({ name: '', address: '', contact_phone: '' });
        setLoading(true);
        fetchMosques();
        toast.success('Masjid berhasil ditambahkan!');
      } else {
        toast.error(json.error || 'Gagal menambahkan masjid');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveMosque = async (id: number, name: string) => {
    if (!confirm(`Setujui pendaftaran masjid "${name}"?`)) return;
    try {
      const res = await fetch('/api/mosques/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Masjid berhasil disetujui');
        fetchMosques();
      } else {
        toast.error(json.error || 'Gagal menyetujui masjid');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan server saat menyetujui');
    }
  };
  
  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...addSuperAdminForm, role: 'superadmin' })
        });
        const json = await res.json();
        if (json.success) {
            toast.success('Super Admin berhasil ditambahkan');
            setShowAddSuperAdmin(false);
            setAddSuperAdminForm({ name: '', email: '' });
            fetchSuperAdmins();
        } else {
            toast.error(json.error || 'Gagal menambahkan Super Admin');
        }
    } catch (err) {
        console.error(err);
        toast.error('Gagal menghubungi server');
    } finally {
        setSaving(false);
    }
  };

  const openEditSuperAdmin = (admin: any) => {
    setEditSuperAdminId(admin.id);
    setEditSuperAdminForm({ name: admin.name, email: admin.email });
    setShowEditSuperAdmin(true);
  };

  const submitEditSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSuperAdminId) return;
    setSaving(true);
    try {
        const res = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editSuperAdminId, name: editSuperAdminForm.name, email: editSuperAdminForm.email })
        });
        const json = await res.json();
        if (json.success) {
            toast.success('Super Admin berhasil diperbarui');
            setShowEditSuperAdmin(false);
            setEditSuperAdminId(null);
            setEditSuperAdminForm({ name: '', email: '' });
            fetchSuperAdmins();
        } else {
            toast.error(json.error || 'Gagal memperbarui Super Admin');
        }
    } catch (err) {
        console.error(err);
        toast.error('Gagal menghubungi server');
    } finally {
        setSaving(false);
    }
  };

  const handleDeleteSuperAdmin = (id: number, name: string) => {
    if (String(id) === String(currentUser?.id)) {
        toast.error('Anda tidak dapat menghapus akun Anda sendiri.');
        return;
    }
    setDeleteModal({ isOpen: true, id, name, type: 'superadmin' });
  };

  const handleDeleteMosque = (id: number, name: string) => {
    setDeleteModal({ isOpen: true, id, name, type: 'mosque' });
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      if (deleteModal.type === 'superadmin') {
          const res = await fetch(`/api/users?id=${deleteModal.id}&caller_id=${currentUser?.id}`, { method: 'DELETE' });
          const json = await res.json();
          if (json.success) {
              setDeleteModal({ isOpen: false, id: 0, name: '', type: 'mosque' });
              fetchSuperAdmins();
              toast.success('Super Admin berhasil dihapus');
          } else {
              toast.error(json.error || 'Gagal menghapus');
          }
      } else {
          const res = await fetch(`/api/mosques?id=${deleteModal.id}`, { method: 'DELETE' });
          const json = await res.json();
          if (json.success) {
            setDeleteModal({ isOpen: false, id: 0, name: '', type: 'mosque' });
            fetchMosques();
            toast.success('Masjid berhasil dihapus');
          } else {
            toast.error(json.error || 'Gagal menghapus masjid');
          }
      }
    } catch (e) {
      toast.error('Terjadi kesalahan server saat menghapus');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalSantri = mosques.reduce((sum, m) => sum + m.santri, 0);
  const totalGuru = mosques.reduce((sum, m) => sum + m.guru, 0);

  return (
    <div className="p-4 pb-4">
      {/* Panel Header */}
      <div className="bg-slate-800 rounded-2xl p-5 text-white shadow-lg mb-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 text-6xl -mr-4 -mt-4">
          <Globe size={80} />
        </div>
        <h2 className="text-xl font-bold mb-1 relative z-10">Super Admin Panel</h2>
        <p className="text-xs text-slate-300 relative z-10">Overview Seluruh Masjid</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-emerald-50 p-2 sm:p-3 rounded-xl border border-emerald-100 text-center flex flex-col justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="mx-auto text-emerald-600 mb-1">
            <path d="M12 2C11.5 2 11 2.5 11 3v2.1A5.002 5.002 0 0 0 7 10v4H5a2 2 0 0 0-2 2v2h18v-2a2 2 0 0 0-2-2h-2v-4a5.002 5.002 0 0 0-4-4.9V3c0-.5-.5-1-1-1zm0 24c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zM9 13v-3c0-1.7 1.3-3 3-3s3 1.3 3 3v3h-6zm-4 7v-2h14v2H5z"/>
          </svg>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">{mosques.length}</p>
          <p className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold uppercase">Total Masjid</p>
        </div>
        <div className="bg-purple-50 p-2 sm:p-3 rounded-xl border border-purple-100 text-center flex flex-col justify-center">
          <Users size={18} className="mx-auto text-purple-600 mb-1" />
          <p className="text-xl sm:text-2xl font-bold text-purple-600">{totalGuru}</p>
          <p className="text-[9px] sm:text-[10px] text-purple-600 font-semibold uppercase">Total Guru</p>
        </div>
        <div className="bg-blue-50 p-2 sm:p-3 rounded-xl border border-blue-100 text-center flex flex-col justify-center">
          <Users size={18} className="mx-auto text-blue-600 mb-1" />
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalSantri}</p>
          <p className="text-[9px] sm:text-[10px] text-blue-600 font-semibold uppercase">Total Santri</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
          <button 
              className={`pb-2 text-sm font-bold border-b-2 transition-colors ${mainTab === 'mosques' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setMainTab('mosques'); setCurrentPage(1); setSearchTerm(''); }}
          >
              Kelola Masjid
          </button>
          <button 
              className={`pb-2 text-sm font-bold border-b-2 transition-colors ${mainTab === 'superadmins' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setMainTab('superadmins'); setCurrentPage(1); setSearchTerm(''); }}
          >
              Kelola Super Admin
          </button>
      </div>

      {/* Content based on Main Tab */}
      {mainTab === 'mosques' ? (
        <div className="mb-4">
          <div className="flex bg-slate-200 p-1 rounded-lg mb-4 w-full sm:w-80">
          <button 
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'approved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
          >
            Sudah Disetujui
          </button>
          <button 
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'pending' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
          >
            Menunggu Persetujuan
          </button>
        </div>

        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="font-bold text-slate-700 text-base leading-tight">
            {activeTab === 'approved' ? 'Daftar Masjid' : 'Menunggu Persetujuan'}
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shrink-0 whitespace-nowrap"
          >
            <Plus size={14} /> Tambah
          </button>
        </div>
        
        <div className="relative w-full mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text"
            placeholder="Cari masjid..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 w-full shadow-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Memuat data masjid...</div>
        ) : (
          <>
            <div className="space-y-2">
              {filteredMosques.length === 0 ? (
                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                  {searchTerm ? (
                    <p className="text-xs">Tidak ada masjid yang cocok dengan pencarian "{searchTerm}"</p>
                  ) : (
                    <>
                      <p className="italic mb-2 text-xs">Belum ada masjid terdaftar.</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="text-emerald-600 font-bold text-xs hover:underline"
                      >
                        + Tambah Masjid Pertama
                      </button>
                    </>
                  )}
                </div>
              ) : (
                paginatedMosques.map(mosque => (
                  <div
                    key={mosque.id}
                    onClick={() => onNavigate(`superadmin-mosque-detail?id=${mosque.id}`)}
                    className="w-full bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-3 text-left relative group cursor-pointer"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMosque(mosque.id, mosque.name);
                      }}
                      className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Hapus Masjid"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C11.5 2 11 2.5 11 3v2.1A5.002 5.002 0 0 0 7 10v4H5a2 2 0 0 0-2 2v2h18v-2a2 2 0 0 0-2-2h-2v-4a5.002 5.002 0 0 0-4-4.9V3c0-.5-.5-1-1-1zm0 24c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zM9 13v-3c0-1.7 1.3-3 3-3s3 1.3 3 3v3h-6zm-4 7v-2h14v2H5z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-sm mb-0.5">{mosque.name}</h4>
                        <p className="text-[10px] text-slate-500 mb-2 truncate max-w-[200px] sm:max-w-md">{mosque.address || 'Alamat belum diisi'}</p>
                        <div className="flex gap-2 items-center flex-wrap mt-2">
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                            Santri: {mosque.santri}
                          </span>
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                            Guru: {mosque.guru}
                          </span>
                          {!mosque.is_approved && (
                            <button
                               onClick={(e) => { e.stopPropagation(); handleApproveMosque(mosque.id, mosque.name); }}
                               className="ml-auto text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold px-3 py-1 rounded transition-colors"
                            >
                               Setujui
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {filteredMosques.length > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-500">
                  {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredMosques.length)} dari {filteredMosques.length}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <div className="flex items-center px-3 bg-slate-50 rounded-md border border-slate-100 text-[10px] font-bold text-slate-600">
                    {currentPage}/{totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      ) : (
      <div className="mb-4">
        {/* Super Admin Content */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="font-bold text-slate-700 text-base leading-tight">
            Daftar Super Admin
          </h3>
          <button
            onClick={() => setShowAddSuperAdmin(true)}
            className="flex items-center justify-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
          >
            <Plus size={14} /> Tambah
          </button>
        </div>

        <div className="relative w-full mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text"
            placeholder="Cari email atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 w-full shadow-sm"
          />
        </div>

        {loadingSuperAdmins ? (
            <div className="text-center py-8 text-slate-400">Memuat super admin...</div>
        ) : (
            <div className="space-y-2">
                {paginatedSuperAdmins.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                        Tidak ada admin yang relevan
                    </div>
                ) : (
                    paginatedSuperAdmins.map(admin => {
                        const isMe = String(admin.id) === String(currentUser?.id);
                        return (
                        <div key={admin.id} className="w-full bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-left relative group">
                            {!isMe && (
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={() => setOpenDropdownId(openDropdownId === admin.id ? null : admin.id)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md"
                                        title="Opsi"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    
                                    {openDropdownId === admin.id && (
                                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 z-10 py-1">
                                            <button
                                                onClick={() => { openEditSuperAdmin(admin); setOpenDropdownId(null); }}
                                                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                            >
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            <button
                                                onClick={() => { handleDeleteSuperAdmin(admin.id, admin.name); setOpenDropdownId(null); }}
                                                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 size={14} /> Hapus
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                {admin.name} {isMe && <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded-sm">Anda</span>}
                            </h4>
                            <p className="text-xs text-slate-500">{admin.email}</p>
                        </div>
                    )})
                )}

                {/* Pagination specific to SA */}
                 {filteredSuperAdmins.length > ITEMS_PER_PAGE && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500">
                      {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredSuperAdmins.length)} dari {filteredSuperAdmins.length}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalSaPages, p + 1))}
                        disabled={currentPage === totalSaPages}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
            </div>
        )}
      </div>
      )}

      {/* Modal Tambah Masjid */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg text-slate-800">Tambah Masjid Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleAddMosque} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">NAMA MASJID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Masjid Al-Ikhlas"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ALAMAT</label>
                <textarea
                  value={addForm.address}
                  onChange={(e) => setAddForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Jl. Contoh No. 1, Kota..."
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">NO. KONTAK</label>
                <input
                  type="text"
                  value={addForm.contact_phone}
                  onChange={(e) => setAddForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="0812xxxxxxxx"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-60 text-sm"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Super Admin */}
      {showAddSuperAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg text-slate-800">Tambah Super Admin</h2>
              <button onClick={() => setShowAddSuperAdmin(false)} className="text-slate-400 hover:text-slate-600">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleAddSuperAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">NAMA LENGKAP <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={addSuperAdminForm.name}
                  onChange={(e) => setAddSuperAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama Admin"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">EMAIL <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={addSuperAdminForm.email}
                  onChange={(e) => setAddSuperAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@contoh.com"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSuperAdmin(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-60 text-sm"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Super Admin */}
      {showEditSuperAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg text-slate-800">Edit Super Admin</h2>
              <button onClick={() => setShowEditSuperAdmin(false)} className="text-slate-400 hover:text-slate-600">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={submitEditSuperAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">NAMA LENGKAP <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editSuperAdminForm.name}
                  onChange={(e) => setEditSuperAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama Admin"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">EMAIL <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={editSuperAdminForm.email}
                  onChange={(e) => setEditSuperAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@contoh.com"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditSuperAdmin(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: 0, name: '', type: 'mosque' })}
        onConfirm={executeDelete}
        title={deleteModal.type === 'mosque' ? "Hapus Masjid?" : "Hapus Super Admin?"}
        message={
          <>
            Anda yakin ingin menghapus <span className="font-bold text-slate-800">"{deleteModal.name}"</span>? 
            Tindakan ini tidak dapat dibatalkan.
          </>
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
