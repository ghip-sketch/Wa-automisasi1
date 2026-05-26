import { useState, FormEvent } from 'react';
import { Bot, Key, Mail, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (email: string) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('admin@business.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap masukkan email dan password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Simulate Supabase login/register latency
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(email);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Side: Editorial Banner */}
        <div className="bg-gradient-to-b from-[#0a192f] to-[#071120] p-10 text-slate-300 flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl"></div>

          <div className="flex items-center space-x-3.5 z-10">
            <div className="bg-emerald-500 text-white p-2.5 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">WAI Assistant</h1>
              <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase font-mono">WhatsApp AI Business</p>
            </div>
          </div>

          <div className="z-10 py-10">
            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
              Otomatisasikan Layanan Pelanggan WhatsApp 24 Jam dengan AI Cerdas
            </h2>
            <p className="text-xs text-slate-400 mt-3Leading-relaxed text-left">
              Beri kebebasan bagi diri Anda dari membalas pesan berulang. Hubungkan nomor Anda, unggah brosur, dan biarkan RAG &amp; Gemini AI melayani order pelanggan secara ramah kapan saja.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4 z-10 flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold tracking-wider">
            <span>PLATFORM VERSI V2.5</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
        </div>

        {/* Right Side: Tab Forms */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {isLoginTab ? 'Masuk ke Portal WAI' : 'Daftar Akun Baru'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isLoginTab ? 'Masukkan kredensial Anda untuk membuka modul autopilot.' : 'Daftarkan bisnis Anda dan dapatkan akses gratis.'}
            </p>
          </div>

          {/* Tab Button Toggles */}
          <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-xl mb-6">
            <button
              onClick={() => { setIsLoginTab(true); setErrorMsg(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                isLoginTab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center justify-center space-x-1.5">
                <LogIn size={13} />
                <span>Masuk</span>
              </span>
            </button>
            <button
              onClick={() => { setIsLoginTab(false); setErrorMsg(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                !isLoginTab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center justify-center space-x-1.5">
                <UserPlus size={13} />
                <span>Daftar</span>
              </span>
            </button>
          </div>

          {errorMsg && (
            <p className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold mb-4 leading-relaxed">
              {errorMsg}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginTab && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nama Lengkap / Nama Bisnis</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="cth: Coffee & Co. Jakarta"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Alamat Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@business.com"
                  className="w-full text-xs pl-9 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 font-medium font-sans"
                  required
                />
                <Mail size={13} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 font-sans">Password Sandi</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 font-sans font-medium"
                  required
                />
                <Key size={13} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs tracking-wide shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-6"
            >
              <span>{loading ? 'Sistem Memverifikasi...' : isLoginTab ? 'Masuk Sekarang' : 'Daftarkan Autopilot'}</span>
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed">
            *Menggunakan sandbox Supabase Auth simulasi. Anda dapat memasukkan credentials apapun untuk menguji fitur dengan lancar demi kesederhanaan.
          </p>
        </div>

      </div>
    </div>
  );
}
