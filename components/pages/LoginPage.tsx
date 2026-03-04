import { useState, useEffect } from 'react';
import { Landmark, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User, UserRole } from '@/types';

interface LoginPageProps {
  onLogin: (role: UserRole, user?: User) => void;
  initialShowRegister?: boolean;
}

export default function LoginPage({ onLogin, initialShowRegister = false }: LoginPageProps) {
  const [showRegisterModal, setShowRegisterModal] = useState(initialShowRegister);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSuccessRegistration, setIsSuccessRegistration] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      // Small timeout to ensure sonner toaster is mounted
      setTimeout(() => {
        if (error === 'UnverifiedEmail') {
          toast.error('Gagal Masuk: Email Anda belum diverifikasi. Silakan cek link yang diberikan saat pendaftaran.');
        } else if (error === 'MosqueNotApproved') {
          toast.error('Gagal Masuk: Masjid Anda dalam status menunggu persetujuan Super Admin.');
        } else if (error === 'UserNotFound' || error === 'InvalidEmail') {
          toast.error('Gagal Masuk: Email ini tidak terdaftar di sistem kami.');
        } else if (error === 'InvalidPassword') {
          toast.error('Gagal Masuk: Password yang Anda masukkan salah.');
        } else if (error === 'CredentialsSignin') {
           toast.error('Gagal Masuk: Kredensial tidak valid.');
        } else {
          toast.error('Gagal Masuk: Terjadi kesalahan pada proses otentikasi.');
        }
      }, 100);
      
      // Remove error from URL without refreshing the page or triggering a Next.js re-render
      window.history.replaceState(null, '', '/');
    }
  }, [searchParams]);

  
  
  // Registration Form State
  const [regMosqueName, setRegMosqueName] = useState('');
  const [regMosqueAddress, setRegMosqueAddress] = useState('');
  const [regAdminName, setRegAdminName] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const handleRegister = async () => {
    if (!regMosqueName || !regAdminName || !regEmail) {
      toast.error('Mohon lengkapi semua data wajib!');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch('/api/register-mosque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mosque_name: regMosqueName,
          mosque_address: regMosqueAddress,
          admin_name: regAdminName,
          admin_email: regEmail
        })
      });

      const json = await res.json();

      if (json.success) {
        setIsSuccessRegistration(true);
        toast.success(json.message || 'Pendaftaran berhasil! Silakan cek email Anda.');
      } else {
        toast.error('Gagal mendaftar: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan sistem: ' + err.message);
    } finally {
      setIsRegistering(false);
    }
  };
  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#0E945F] text-white relative overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }}
    >
      <div className="text-center mb-8 mt-4 z-10">
        <div className="w-24 h-24 bg-white text-[#0E945F] rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl">
          {/* Custom Mosque Icon to match screenshot */}
          <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C11.5 2 11 2.5 11 3v2.1A5.002 5.002 0 0 0 7 10v4H5a2 2 0 0 0-2 2v2h18v-2a2 2 0 0 0-2-2h-2v-4a5.002 5.002 0 0 0-4-4.9V3c0-.5-.5-1-1-1zm0 24c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zM9 13v-3c0-1.7 1.3-3 3-3s3 1.3 3 3v3h-6zm-4 7v-2h14v2H5z"/>
          </svg>
        </div>
        <h1 className="text-[2.2rem] font-black mb-2 tracking-tight">MagribMengaji</h1>
        <p className="text-white/90 text-sm font-medium">Aplikasi Manajemen Maghrib Mengaji</p>
      </div>

      <div className="w-full bg-white text-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm mb-8 z-10">
        <h3 className="font-bold text-center mb-6 text-[#1E293B] text-[1.1rem]">Masuk Aplikasi</h3>

        <button 
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-[#1E293B] font-bold py-3.5 rounded-2xl shadow-sm transition-all focus:ring-4 focus:ring-slate-100 flex items-center justify-center gap-3 mb-5"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-6 h-6"
            alt="Google Logo"
          />
          Masuk dengan Google
        </button>

        <p className="text-center text-[11px] text-slate-400 font-medium px-2">
          Dengan masuk, Anda menyetujui Ketentuan Layanan kami.
        </p>
      </div>

      <div className="z-10">
        <button 
          onClick={() => {
             setIsSuccessRegistration(false);
             setShowRegisterModal(true);
          }}
          className="border-2 border-white hover:bg-white hover:text-[#0E945F] text-white font-bold py-3 px-7 rounded-[2rem] transition-colors text-sm"
        >
          Daftar Masjid Baru (Admin DKM)
        </button>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-xl mb-1 text-slate-800">Registrasi Masjid Baru</h3>
            
            {isSuccessRegistration ? (
               <div className="py-6 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Shield size={32} />
                  </div>
                  <h4 className="font-bold text-lg text-slate-800 mb-2">Cek Email Anda</h4>
                  <p className="text-sm text-slate-500 mb-6 px-4">
                     Pendaftaran berhasil! Kami telah mengirimkan tautan verifikasi ke email <span className="font-bold text-slate-700">{regEmail}</span>. Silakan klik tautan tersebut sebelum login.
                  </p>
                  <button 
                     onClick={() => setShowRegisterModal(false)}
                     className="block w-full text-center mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                  >
                     Tutup
                  </button>
               </div>
            ) : (
               <>
                  <p className="text-slate-500 text-xs mb-6">Daftarkan masjid Anda untuk mulai menggunakan MagribMengaji.</p>
                  
                  <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto px-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Masjid</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-900"
                  placeholder="Contoh: Masjid Al-Ikhlas"
                  value={regMosqueName}
                  onChange={e => setRegMosqueName(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Masjid</label>
                <textarea 
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 h-20 resize-none text-slate-900"
                  placeholder="Alamat lengkap..."
                  value={regMosqueAddress}
                  onChange={e => setRegMosqueAddress(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <div className="pt-2 border-t border-slate-100"></div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Admin DKM</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-900"
                  placeholder="Nama Anda"
                  value={regAdminName}
                  onChange={e => setRegAdminName(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Login</label>
                <input 
                  type="email" 
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-900"
                  placeholder="email@contoh.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors text-sm"
              >
                Batal
              </button>
              <button 
                onClick={handleRegister}
                disabled={isRegistering}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors text-sm disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isRegistering ? 'Mendaftar...' : 'Daftar Sekarang'}
              </button>
            </div>
            </>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
