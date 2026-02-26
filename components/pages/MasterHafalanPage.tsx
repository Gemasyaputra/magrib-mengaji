'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Search, Book, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import DeleteModal from '@/components/DeleteModal';
import { toast } from 'sonner';

interface MasterHafalanPageProps {
  onNavigate: (page: string) => void;
  currentUser?: any;
}

interface MasterData {
  id: number;
  title: string;
  category?: string;
  arabic_text?: string;
  latin_text?: string;
  translation?: string;
  step_order?: number; // Only for prayer readings
}

export default function MasterHafalanPage({ onNavigate, currentUser }: MasterHafalanPageProps) {
  const [activeTab, setActiveTab] = useState<'daily-prayers' | 'prayer-readings'>('daily-prayers');
  const [data, setData] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterData | null>(null);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: 0, title: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
      title: '',
      category: '',
      arabic_text: '',
      latin_text: '', // Only for daily prayers
      translation: '',
      step_order: '' // Only for prayer readings
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'daily-prayers' ? 'daily-prayers' : 'prayer-readings';
      const res = await fetch(`/api/master/${endpoint}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = (id: number, title: string) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
        const endpoint = activeTab === 'daily-prayers' ? 'daily-prayers' : 'prayer-readings';
        const res = await fetch(`/api/master/${endpoint}?id=${deleteModal.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
            fetchData();
            setDeleteModal({ isOpen: false, id: 0, title: '' });
        } else {
            toast.error('Gagal menghapus');
        }
    } catch (err) {
        console.error(err);
        toast.error('Terjadi kesalahan');
    } finally {
        setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const endpoint = activeTab === 'daily-prayers' ? 'daily-prayers' : 'prayer-readings';
        const method = editingItem ? 'PUT' : 'POST';
        const payload: any = { 
            title: formData.title, 
            category: formData.category,
            arabic_text: formData.arabic_text,
            translation: formData.translation
        };
        
        if (activeTab === 'daily-prayers') {
            payload.latin_text = formData.latin_text;
        }

        if (activeTab === 'prayer-readings') {
            payload.step_order = Number(formData.step_order);
        }

        if (editingItem) {
            payload.id = editingItem.id;
        }

        const res = await fetch(`/api/master/${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const json = await res.json();
        if (json.success) {
            setShowModal(false);
            setEditingItem(null);
            resetForm();
            fetchData();
        } else {
            toast.error(json.error || 'Gagal menyimpan');
        }

      } catch (err) {
          console.error(err);
          toast.error('Terjadi kesalahan');
      }
  };

  const resetForm = () => {
      setFormData({ 
          title: '', 
          category: '', 
          arabic_text: '', 
          latin_text: '',
          translation: '',
          step_order: ''
      });
  };

  const openEdit = (item: MasterData) => {
      setEditingItem(item);
      setFormData({
          title: item.title,
          category: item.category || '',
          arabic_text: item.arabic_text || '',
          latin_text: item.latin_text || '',
          translation: item.translation || '',
          step_order: item.step_order ? String(item.step_order) : ''
      });
      setShowModal(true);
  };

  const openAdd = () => {
      setEditingItem(null);
      resetForm();
      setShowModal(true);
  };

  const filteredData = data.filter(item => 
      item.title.toLowerCase().includes(search.toLowerCase()) || 
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex items-center gap-4 p-4">
            <button onClick={() => onNavigate('dashboard')} className="text-slate-500 hover:text-slate-700">
                <ArrowLeft size={24} />
            </button>
            <h1 className="font-bold text-lg text-slate-800">Bank Materi</h1>
        </div>
        <div className="flex border-b border-slate-200 px-4">
            <button 
                onClick={() => setActiveTab('daily-prayers')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'daily-prayers' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
            >
                Doa Harian
            </button>
            <button 
                onClick={() => setActiveTab('prayer-readings')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'prayer-readings' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
            >
                Bacaan Sholat
            </button>
        </div>
      </div>

      <div className="p-4">
          <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
              </div>
              <button 
                onClick={openAdd}
                className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                  <Plus size={24} />
              </button>
          </div>

          {loading ? (
             <div className="text-center py-10 text-slate-400">Memuat data...</div>
          ) : (
              <div className="space-y-3">
                  {filteredData.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 italic">Tidak ada data ditemukan.</div>
                  ) : (
                      filteredData.map(item => (
                          <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group">
                              <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeTab === 'daily-prayers' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                          {activeTab === 'daily-prayers' ? <Sparkles size={18} /> : <Book size={18} />}
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                                           <div className="flex gap-2 mt-1">
                                             {item.category && (
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{item.category}</span>
                                             )}
                                             {item.step_order !== undefined && (
                                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">Urutan: {item.step_order}</span>
                                             )}
                                           </div>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                                          <Edit2 size={16} />
                                      </button>
                                      <button onClick={() => handleDelete(item.id, item.title)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              </div>
                              
                              {/* Preview Text */}
                              {(item.arabic_text || item.translation) && (
                                  <div className="mt-3 pt-3 border-t border-slate-50 text-xs space-y-2">
                                      {item.arabic_text && <p className="font-arabic text-right text-lg leading-loose text-slate-700">{item.arabic_text}</p>}
                                      {item.latin_text && <p className="text-emerald-600 italic">{item.latin_text}</p>}
                                      {item.translation && <p className="text-slate-500">"{item.translation}"</p>}
                                  </div>
                              )}
                          </div>
                      ))
                  )}
              </div>
          )}
      </div>

      {/* Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                  <h2 className="font-bold text-lg mb-4">{editingItem ? 'Edit Data' : 'Tambah Data'}</h2>
                  <form onSubmit={handleSave} className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">JUDUL</label>
                            <input 
                                type="text" 
                                required
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                placeholder="Contoh: Doa Sebelum Tidur"
                            />
                        </div>

                         <div className={activeTab === 'prayer-readings' ? '' : 'col-span-2'}>
                            <label className="block text-xs font-bold text-slate-500 mb-1">KATEGORI</label>
                            <input 
                                type="text" 
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                placeholder={activeTab === 'daily-prayers' ? "Contoh: Adab Makan" : "Contoh: Rukun"}
                            />
                        </div>
                      
                        {activeTab === 'prayer-readings' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">URUTAN</label>
                                <input 
                                    type="number" 
                                    value={formData.step_order}
                                    onChange={(e) => setFormData(prev => ({ ...prev, step_order: e.target.value }))}
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                    placeholder="1"
                                />
                            </div>
                        )}
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">ARAB</label>
                          <textarea 
                            dir="rtl"
                            value={formData.arabic_text}
                            onChange={(e) => setFormData(prev => ({ ...prev, arabic_text: e.target.value }))}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 h-24 resize-none font-arabic text-xl"
                            placeholder="Teks Arab..."
                          />
                      </div>

                      {activeTab === 'daily-prayers' && (
                           <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">LATIN</label>
                            <textarea 
                                value={formData.latin_text}
                                onChange={(e) => setFormData(prev => ({ ...prev, latin_text: e.target.value }))}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 h-16 resize-none"
                                placeholder="Teks Latin..."
                            />
                        </div>
                      )}

                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">TERJEMAHAN</label>
                          <textarea 
                            value={formData.translation}
                            onChange={(e) => setFormData(prev => ({ ...prev, translation: e.target.value }))}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 h-20 resize-none"
                            placeholder="Terjemahan..."
                          />
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
        onClose={() => setDeleteModal({ isOpen: false, id: 0, title: '' })}
        onConfirm={executeDelete}
        title="Hapus Data?"
        message={
          <>
            Anda yakin ingin menghapus data <span className="font-bold text-slate-800">"{deleteModal.title}"</span>? 
            Tindakan ini tidak dapat dibatalkan.
          </>
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
