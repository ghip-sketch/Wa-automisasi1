import { 
  User, 
  Bot, 
  MapPin, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Gem,
  Award,
  Globe
} from 'lucide-react';

interface ProfileViewProps {
  userEmail: string;
}

export default function ProfileView({ userEmail }: ProfileViewProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Akun Profil Saya</h2>
        <p className="text-sm text-slate-500 mt-1">Kelola lisensi keanggotaan, kapasitas layanan, dan kuota pemesanan asisten WAI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Member Card */}
        <div className="bg-gradient-to-b from-[#0a192f] to-[#071120] p-6 rounded-3xl text-slate-300 relative overflow-hidden flex flex-col justify-between h-[360px] shadow-xl">
          {/* Visual element background lines */}
          <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1 rounded-full uppercase">
                Free Developer Quota
              </span>
              <Award size={20} className="text-amber-400" />
            </div>

            <div className="text-center py-6">
              <div className="w-16 h-16 bg-slate-800 text-emerald-400 rounded-full flex items-center justify-center font-extrabold text-2xl mx-auto shadow-inner border border-slate-700">
                {userEmail ? userEmail[0].toUpperCase() : 'U'}
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-4 truncate">{userEmail || 'User Business'}</h3>
              <p className="text-xs text-slate-500">Anggota Terdaftar WAI</p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Sisa Kuota Token AI</p>
              <p className="text-sm font-bold text-white mt-0.5">UNLIMITED</p>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded font-mono">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Right Columns: Membership status cards & limits */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Quotas & Capacity details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center border-b border-slate-50 pb-3">
              <ShieldCheck size={16} className="text-emerald-500 mr-2" />
              Rincian Batasan & Konsumsi Quota (Free Tier)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nomor WA Tersambung</p>
                <p className="text-base font-bold text-slate-800 mt-1">1 / 1 Nomor Maks</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[100%]"></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kapasitas Dokumen RAG</p>
                <p className="text-base font-bold text-slate-800 mt-1">2 / 5 Dokumen Maks</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[40%]"></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jumlah Sesi Live Leads</p>
                <p className="text-base font-bold text-slate-800 mt-1">2 / 100 Kontak</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[2%]"></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Panggilan API Gemini / Hari</p>
                <p className="text-base font-bold text-slate-800 mt-1">Gratis Tanpa Batas (Free Tier)</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[10%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick SaaS Specs list */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Spesifikasi Server Sandbox</h3>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                <CheckCircle2 size={14} className="text-slate-400" />
                <span>Teknologi Web Server: Node.js Express v4.x + Vite Integration</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                <CheckCircle2 size={14} className="text-slate-400" />
                <span>RAG Engine: Local In-Memory Token Keyword Relevance Vectorizer</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                <CheckCircle2 size={14} className="text-slate-400" />
                <span>Model AI: Google Gemini AI (gemini-3.5-flash)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
