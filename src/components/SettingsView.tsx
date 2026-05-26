import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { 
  Settings, 
  Bot, 
  Clock, 
  ToggleLeft, 
  ToggleRight, 
  Database,
  Save,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Key,
  Share2
} from 'lucide-react';
import { AppConfig } from '../types';
import { dataService, getSavedCredentials } from '../lib/dataService';

interface SettingsViewProps {
  config: AppConfig;
  fetchConfig: () => void;
}

export default function SettingsView({ config, fetchConfig }: SettingsViewProps) {
  const [formData, setFormData] = useState<AppConfig>({ ...config });
  const [geminiKeyLocal, setGeminiKeyLocal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Read local Gemini Key
    const { gemini } = getSavedCredentials();
    setGeminiKeyLocal(gemini);
  }, []);

  // Sync Input Elements
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWorkingHoursToggle = () => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        enabled: !prev.workingHours.enabled
      }
    }));
  };

  const handleWorkingHoursChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [name]: value
      }
    }));
  };

  // Submit Settings Update to Backend Server
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);

    try {
      // Save local Gemini key as client-side fallback (e.g., when deployed on static Vercel)
      if (geminiKeyLocal) {
        localStorage.setItem('gemini_api_key', geminiKeyLocal);
      } else {
        localStorage.removeItem('gemini_api_key');
      }

      const ok = await dataService.saveConfig(formData);
      if (ok) {
        setIsSaving(false);
        setSuccess(true);
        fetchConfig();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setIsSaving(false);
      }
    } catch (err) {
      setIsSaving(false);
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
      {/* Title block */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Asisten AI & Bisnis</h2>
          <p className="text-sm text-slate-500 mt-1">Conformasikan personaliti AI, jam operasional, pesan otomatis dan credentials bisnis Anda.</p>
        </div>
        
        {/* Save Button floating on top right of block */}
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs tracking-wide shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <Save size={14} />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-bold leading-relaxed flex items-center space-x-2 shadow-sm">
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          <span>Pengaturan asisten WAI berhasil disimpan dan disinkronisasikan ke seluruh chat simulator!</span>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Column 1: Core Business config */}
        <div className="space-y-6">
          
          {/* Identity Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center">
              Profil Bisnis Anda
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nama Bisnis / Toko</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 transition-colors bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                placeholder="cth: Coffee & Co. Jakarta"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Ringkasan Profil Bisnis (FAQ RAG Fallback)</label>
              <textarea
                name="businessDesc"
                value={formData.businessDesc}
                onChange={handleChange}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 transition-colors bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 font-semibold leading-relaxed"
                placeholder="Deskripsikan dengan singkat apa yang Anda jual, lokasi toko, dan fokus layanan..."
                required
              />
            </div>
          </div>

          {/* AI Personality Prompt customization */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center">
              Personaliti & Prompt AI
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Gaya Bahasa / Tone AI</label>
              <select
                name="tone"
                value={formData.tone}
                onChange={handleChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 font-semibold cursor-pointer"
              >
                <option value="Professional">Professional (Resmi, Sopan, Bapak/Ibu)</option>
                <option value="Casual">Casual (Friendly, Kak/Kakak, Banyak Emoji)</option>
                <option value="Formal">Formal (Baku, Tata Bahasa Lengkap Terstruktur)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">System Prompt Utama AI</label>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center">
                  <Sparkles size={11} className="mr-0.5" /> Gemini System
                </span>
              </div>
              <textarea
                name="systemPrompt"
                value={formData.systemPrompt}
                onChange={handleChange}
                rows={4}
                className="w-full text-[11.5px] font-mono p-3 bg-slate-950 text-emerald-400 rounded-xl border border-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800"
                placeholder="Tulis instruksi kustom, misal nama agen, deskripsi promosi spesial..."
                required
              />
            </div>
          </div>

        </div>

        {/* Column 2: Operation periods + Supabase credentials */}
        <div className="space-y-6">
          
          {/* Automated Greetings & Working periods */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center">
              Otomatisasi Sapaan & Jam Buka
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pesan Sambutan Otomatis (Saat Pertama Hubungi)</label>
              <input
                type="text"
                name="welcomeMessage"
                value={formData.welcomeMessage}
                onChange={handleChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 transition-colors bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                placeholder="Sapaan default menyambut pelanggan..."
                required
              />
            </div>

            {/* Working Hours Settings */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center">
                    <Clock size={12} className="text-slate-500 mr-1.5" />
                    Batasi Jam Operasional Bisnis
                  </h4>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">Balas dengan pesan di luar jam kerja jika kafe tutup</p>
                </div>
                <button
                  type="button"
                  onClick={handleWorkingHoursToggle}
                  className="text-emerald-500 hover:text-emerald-600 transition-colors"
                >
                  {formData.workingHours.enabled ? <ToggleRight size={34} /> : <ToggleLeft size={34} className="text-slate-400" />}
                </button>
              </div>

              {formData.workingHours.enabled && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Jam Mulai Kerja</label>
                    <input
                      type="time"
                      name="start"
                      value={formData.workingHours.start}
                      onChange={handleWorkingHoursChange}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Jam Tutup Kerja</label>
                    <input
                      type="time"
                      name="end"
                      value={formData.workingHours.end}
                      onChange={handleWorkingHoursChange}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pesan Di Luar Jam Kerja / Kafe Tutup</label>
              <textarea
                name="outOfHoursMessage"
                value={formData.outOfHoursMessage}
                onChange={handleChange}
                rows={2.5}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 transition-colors bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 font-semibold leading-relaxed"
                placeholder="Pesan penolakan otomatis ramah menginformasikan bahwa admin manusia beristirahat..."
                required
              />
            </div>
          </div>

          {/* Database & Cloud API references config */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center">
              <Database size={13} className="text-slate-400 mr-2" />
              Supabase SaaS Integration
            </h3>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-[10.5px] text-sky-800 leading-relaxed font-semibold">
              Aplikasi ini beroperasi menggunakan <strong>Database JSON Lokal persisten</strong> secara default agar langsung siap pakai di sandbox. Anda bisa melampirkan credentials proyek Supabase Anda untuk mencadangkan database secara real-time di produksi masa depan (seperti deployment Vercel)!
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Supabase API URL</label>
              <input
                type="text"
                name="supabaseUrl"
                value={formData.supabaseUrl || ''}
                onChange={handleChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 font-mono bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800"
                placeholder="https://your-project.supabase.co"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Supabase Anon Key</label>
              <input
                type="password"
                name="supabaseAnonKey"
                value={formData.supabaseAnonKey || ''}
                onChange={handleChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 font-mono bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
              />
            </div>
          </div>

          {/* Gemini AI Client integration fallback */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center">
              <Key size={13} className="text-slate-400 mr-2" />
              Google Gemini Client Integration
            </h3>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[10.5px] text-emerald-800 leading-relaxed font-semibold">
              Kunci ini digunakan sebagai <strong>fallback klien langsung</strong> untuk pemrosesan AI Simulator saat dideploy di Vercel/GitHub Pages (tanpa server backend). Disimpan dengan aman secara lokal di peramban (browser) Anda.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Gemini Client API Key (Hanya untuk Vercel)</label>
              <input
                type="password"
                value={geminiKeyLocal}
                onChange={(e) => setGeminiKeyLocal(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 font-mono bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800"
                placeholder="AIzaSy..."
              />
            </div>
          </div>

          {/* WhatsApp Production Integration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center">
              <Share2 size={13} className="text-slate-400 mr-2" />
              WhatsApp Production Integration
            </h3>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-[10.5px] text-indigo-800 leading-relaxed font-semibold">
              Ganti mode ke <strong>Real WhatsApp (Fonnte)</strong> untuk menghubungkan nomor WhatsApp bisnis Anda secara nyata. Semua pesan masuk ke nomor Anda akan dijawab otomatis oleh AI kami menggunakan pengetahuan bisnis!
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Koneksi WhatsApp Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, whatsappMode: 'Simulator' })}
                  className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${
                    (formData.whatsappMode || 'Simulator') === 'Simulator'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Simulator (Demo)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, whatsappMode: 'Fonnte' })}
                  className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${
                    formData.whatsappMode === 'Fonnte'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Real WhatsApp (Fonnte)
                </button>
              </div>
            </div>

            {formData.whatsappMode === 'Fonnte' ? (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Fonnte API Token</label>
                  <input
                    type="password"
                    name="whatsappToken"
                    value={formData.whatsappToken || ''}
                    onChange={handleChange}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 font-mono bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800"
                    placeholder="Contoh: aBcdEfGhIjKlMnOpQrSt"
                  />
                  <p className="text-[9.5px] text-slate-400">
                    Dapatkan token API Anda dengan mendaftarkan nomor Anda di <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-semibold font-sans">fonnte.com</a>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nomor WhatsApp Terhubung</label>
                  <input
                    type="text"
                    name="whatsappPhone"
                    value={formData.whatsappPhone || ''}
                    onChange={handleChange}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 font-mono bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800"
                    placeholder="Contoh: 6281245219988"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10.5px] text-amber-800 leading-relaxed font-semibold">
                  <strong>PENTING (Langkah Berhasil):</strong><br />
                  Agar pesan masuk WhatsApp menuju HP Anda dibaca oleh AI, daftarkan alamat Webhook ini di kolom <strong>Webhook URL</strong> akun Fonnte Anda:<br />
                  <code className="bg-white/80 px-2 py-1 rounded text-[10px] font-mono select-all block mt-1.5 border border-amber-200 break-all select-all font-bold">
                    {window.location.origin}/api/webhook/whatsapp
                  </code>
                </div>
              </div>
            ) : null}
          </div>

        </div>

      </div>
    </form>
  );
}
