'use client';

import { Plus, Mail, Phone, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';
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
  nik?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  golongan_darah?: string;
  alamat?: string;
  rt_rw?: string;
  kel_desa?: string;
  kecamatan?: string;
  agama?: string;
  status_perkawinan?: string;
  pekerjaan?: string;
  kewarganegaraan?: string;
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
  
  const [formData, setFormData] = useState<Partial<Teacher>>({
    name: '',
    email: '',
    phone: '',
    nik: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    golongan_darah: '',
    alamat: '',
    rt_rw: '',
    kel_desa: '',
    kecamatan: '',
    agama: '',
    status_perkawinan: '',
    pekerjaan: '',
    kewarganegaraan: '',
  });

  const [isExtractingKTP, setIsExtractingKTP] = useState(false);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);

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
      setKtpPreview(null);
      setFormData({ 
        name: '', email: '', phone: '',
        nik: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', golongan_darah: '',
        alamat: '', rt_rw: '', kel_desa: '', kecamatan: '', agama: '', status_perkawinan: '',
        pekerjaan: '', kewarganegaraan: ''
      });
      setShowModal(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
      setIsEditing(true);
      setKtpPreview(null);
      setCurrentTeacherId(teacher.id);
      setFormData({
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone || '',
          nik: teacher.nik || '',
          tempat_lahir: teacher.tempat_lahir || '',
          tanggal_lahir: teacher.tanggal_lahir ? teacher.tanggal_lahir.substring(0, 10) : '',
          jenis_kelamin: teacher.jenis_kelamin || '',
          golongan_darah: teacher.golongan_darah || '',
          alamat: teacher.alamat || '',
          rt_rw: teacher.rt_rw || '',
          kel_desa: teacher.kel_desa || '',
          kecamatan: teacher.kecamatan || '',
          agama: teacher.agama || '',
          status_perkawinan: teacher.status_perkawinan || '',
          pekerjaan: teacher.pekerjaan || '',
          kewarganegaraan: teacher.kewarganegaraan || ''
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
            setKtpPreview(null);
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

  const handleKTPUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Set preview immediately
    const objectUrl = URL.createObjectURL(file);
    setKtpPreview(objectUrl);
    setIsExtractingKTP(true);

    // Give UI time to update by pushing execution to the end of the callback queue
    setTimeout(() => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;

          const res = await fetch('/api/extract-ktp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64data }),
          });

          const json = await res.json();
          if (json.success && json.data) {
            toast.success('Berhasil membaca KTP!', { id: 'ktp-toast' });
            const ktp = json.data;
            setFormData((prev) => ({
              ...prev,
              nik: ktp.nik || prev.nik,
              name: ktp.name || prev.name,
              tempat_lahir: ktp.tempat_lahir || prev.tempat_lahir,
              tanggal_lahir: ktp.tanggal_lahir || prev.tanggal_lahir,
              jenis_kelamin: ktp.jenis_kelamin || prev.jenis_kelamin,
              golongan_darah: ktp.golongan_darah || prev.golongan_darah,
              alamat: ktp.alamat || prev.alamat,
              rt_rw: ktp.rt_rw || prev.rt_rw,
              kel_desa: ktp.kel_desa || prev.kel_desa,
              kecamatan: ktp.kecamatan || prev.kecamatan,
              agama: ktp.agama || prev.agama,
              status_perkawinan: ktp.status_perkawinan || prev.status_perkawinan,
              pekerjaan: ktp.pekerjaan || prev.pekerjaan,
              kewarganegaraan: ktp.kewarganegaraan || prev.kewarganegaraan,
            }));
          } else {
            throw new Error(json.error || 'Gagal mengekstrak data');
          }
        } catch (err: any) {
          toast.error('Error: ' + err.message, { id: 'ktp-toast' });
          console.error(err);
        } finally {
          setIsExtractingKTP(false);
          e.target.value = ''; // Reset input
        }
      };
      reader.readAsDataURL(file);
    }, 100);
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
            <div className="space-y-4 mb-6">
              
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <p className="text-sm font-bold text-emerald-800 mb-1">Pindai KTP (Otomatis Diisi AI)</p>
                <p className="text-xs text-emerald-600 mb-4 px-2">Unggah foto KTP pengajar untuk memproses data NIK, Nama, Tanggal Lahir, dll secara otomatis.</p>
                  
                {ktpPreview ? (
                  <div className="relative w-full max-w-[280px] mx-auto mt-2 rounded-xl overflow-hidden shadow-sm border border-emerald-200 h-[170px] bg-slate-100 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={ktpPreview} 
                      alt="KTP Preview" 
                      className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${isExtractingKTP ? 'blur-md brightness-[0.6] grayscale-[15%] scale-105' : ''}`}
                    />
                    
                    {isExtractingKTP ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/40 backdrop-blur-[2px]">
                         <div className="relative w-20 h-20 flex items-center justify-center mb-3">
                           {/* Outer glowing ring */}
                           <div className="absolute inset-0 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                           
                           {/* Outer spinning dash pattern */}
                           <div className="absolute inset-2 rounded-full border-t-2 border-r-2 border-emerald-400 animate-[spin_1.5s_linear_infinite]"></div>
                           
                           {/* Inner spinning ring (opposite direction) */}
                           <div className="absolute inset-4 rounded-full border-b-2 border-l-2 border-emerald-300 animate-[spin_1s_linear_infinite_reverse]"></div>
                           
                           {/* Center pulsating dot */}
                           <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                         </div>
                         
                         <div className="flex flex-col items-center">
                            <span className="text-emerald-300 font-bold text-sm tracking-widest uppercase animate-pulse drop-shadow-md">
                              AI Scanning
                            </span>
                            <span className="text-white/80 text-[10px] font-medium mt-1">
                              Membaca data KTP...
                            </span>
                         </div>
                       </div>
                    ) : (
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => setKtpPreview(null)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
                          title="Hapus / Ganti KTP"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-700 px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    Pilih Foto KTP
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleKTPUpload} 
                      disabled={isExtractingKTP}
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">NIK</label>
                    <input
                      type="text"
                      value={formData.nik || ''}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formData.tempat_lahir || ''}
                      onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={formData.tanggal_lahir || ''}
                      onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Jenis Kelamin</label>
                    <select
                      value={formData.jenis_kelamin || ''}
                      onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                    >
                      <option value="">Pilih</option>
                      <option value="LAKI-LAKI">LAKI-LAKI</option>
                      <option value="PEREMPUAN">PEREMPUAN</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Gol. Darah</label>
                    <input
                      type="text"
                      value={formData.golongan_darah || ''}
                      onChange={(e) => setFormData({ ...formData, golongan_darah: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Alamat Lengkap</label>
                    <textarea
                      value={formData.alamat || ''}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 h-16 resize-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">RT / RW</label>
                    <input
                      type="text"
                      value={formData.rt_rw || ''}
                      onChange={(e) => setFormData({ ...formData, rt_rw: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Kel / Desa</label>
                    <input
                      type="text"
                      value={formData.kel_desa || ''}
                      onChange={(e) => setFormData({ ...formData, kel_desa: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Kecamatan</label>
                    <input
                      type="text"
                      value={formData.kecamatan || ''}
                      onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Agama</label>
                    <input
                      type="text"
                      value={formData.agama || ''}
                      onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Status Perkawinan</label>
                    <input
                      type="text"
                      value={formData.status_perkawinan || ''}
                      onChange={(e) => setFormData({ ...formData, status_perkawinan: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Pekerjaan</label>
                    <input
                      type="text"
                      value={formData.pekerjaan || ''}
                      onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Kewarganegaraan</label>
                    <input
                      type="text"
                      value={formData.kewarganegaraan || ''}
                      onChange={(e) => setFormData({ ...formData, kewarganegaraan: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                
                <div className="pt-2 pb-1 border-b border-slate-100 md:col-span-2">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Akses Login</p>
                </div>
                
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Email (Wajib untuk Login)</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nomor Telepon / WA</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>
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
