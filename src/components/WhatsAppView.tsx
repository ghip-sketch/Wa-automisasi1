import { useState, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  Wifi, 
  WifiOff, 
  ToggleLeft, 
  ToggleRight,
  Terminal,
  Smartphone,
  Info
} from 'lucide-react';
import { AppConfig, DashboardStats } from '../types';
import { dataService } from '../lib/dataService';

interface WhatsAppViewProps {
  stats: DashboardStats;
  fetchStats: () => void;
  config?: AppConfig;
}

export default function WhatsAppView({ stats, fetchStats, config }: WhatsAppViewProps) {
  const [loading, setLoading] = useState(false);
  const [qrRefreshedCount, setQrRefreshedCount] = useState(0);
  const [activeLogs, setActiveLogs] = useState<string[]>([
    'System initialization successful.',
    'Ready for incoming WhatsApp multi-device connections.',
  ]);

  // Handle QR Refresh Simulate
  const handleQrRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setQrRefreshedCount(prev => prev + 1);
      addLog(`QR Code updated (Version ID: qr_ref_${Date.now().toString().slice(-4)}). Scan within 45 seconds.`);
    }, 600);
  };

  // Add Terminal Log Message
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    setActiveLogs(l => [`[${time}] ${msg}`, ...l.slice(0, 10)]);
  };

  // Simulate Device Connection
  const toggleConnection = async (action: 'connect' | 'disconnect') => {
    setLoading(true);
    addLog(action === 'connect' ? 'Simulating QR code capture via active client device...' : 'Disconnecting current active session...');
    
    try {
      const data = await dataService.toggleWAConnection(action);
      
      setTimeout(() => {
        setLoading(false);
        fetchStats();
        if (action === 'connect') {
          addLog('WhatsApp session linked successfully. Phone: +62 812-4521-9988');
          addLog('State persistence verified: Auto-reconnect active.');
        } else {
          addLog('Session revoked successfully. Connection closed.');
        }
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      addLog(`Error during toggling session: ${err.message}`);
    }
  };

  useEffect(() => {
    if (stats.connectionStatus === 'Connected') {
      addLog('Active session detected. Client status: Online and listening to incoming messages.');
    } else {
      addLog('No active session. Waiting for QR Code scan.');
    }
  }, [stats.connectionStatus]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {config?.whatsappMode === 'Fonnte' ? 'Koneksi WhatsApp Produksi (Fonnte)' : 'Koneksi Layanan WhatsApp Web'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {config?.whatsappMode === 'Fonnte' 
            ? 'Sistem sedang berjalan menggunakan koneksi integrasi API Gateway Cloud WhatsApp resmi Anda.'
            : 'Hubungkan WAI Assistant ke nomor WhatsApp Bisnis Anda menggunakan modul Web Multi-Device WhatsApp standar.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code / Active Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden h-fit">
          {config?.whatsappMode === 'Fonnte' ? (
            <div className="py-6 flex flex-col items-center w-full">
              {stats.connectionStatus === 'Connected' ? (
                <>
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-100 animate-pulse">
                    <Wifi size={28} />
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest font-mono">
                    FONNTE WA ONLINE
                  </span>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-100">
                    <WifiOff size={28} />
                  </div>
                  <span className="bg-rose-50 text-rose-800 text-[10px] font-bold px-3 py-1.5 rounded-full border border-rose-100 uppercase tracking-widest font-mono">
                    WA OFFLINE (DISCONNECTED)
                  </span>
                </>
              )}
              
              <div className="mt-6 space-y-3.5 text-center w-full px-4 text-xs font-semibold">
                {/* Diagnostics and troubleshooting */}
                {stats.fonnteReason && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-left space-y-1">
                    <span className="font-extrabold text-[9px] text-rose-600 uppercase tracking-wider block">KESALAHAN TOKEN API</span>
                    <p className="text-[11px] leading-normal font-sans text-rose-700">{stats.fonnteReason}</p>
                    <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                      Silakan periksa kembali Token Anda di menu <b>Pengaturan</b>. Pastikan tidak ada spasi di awal/akhir kunci.
                    </p>
                  </div>
                )}

                {stats.connectionStatus !== 'Connected' && !stats.fonnteReason && (
                  <div className="bg-amber-50 border border-amber-150 text-amber-800 rounded-xl p-3.5 text-left space-y-1 bg-amber-50/50">
                    <span className="font-extrabold text-[9px] text-amber-600 uppercase tracking-wider block">BELUM SCAN QR DI FONNTE</span>
                    <p className="text-[11px] leading-normal text-amber-900 font-sans">
                      Status device Anda di Fonnte masih <b>disconnect</b> (terputus).
                    </p>
                    <ul className="text-[10px] text-amber-800 font-medium space-y-1.5 list-disc pl-4 mt-2 leading-relaxed">
                      <li>Masuk ke akun <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold">fonnte.com</a>.</li>
                      <li>Pergi ke menu <b>Device</b> di dashboard Fonnte.</li>
                      <li>Di panel Fonnte, silakan klik <b>&quot;Scan QR&quot;</b> atau hubungkan nomor Anda.</li>
                      <li>Gunakan HP Anda (WhatsApp &gt; Linked Devices) untuk memindai QR yang muncul di Fonnte.</li>
                      <li>Setelah status di dashboard Fonnte berubah menjadi <b>connect</b> (online), status di dashboard ini akan otomatis online!</li>
                    </ul>
                  </div>
                )}

                {stats.fonnteQuota && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Sisa Kuota / Paket Fonnte</p>
                    <p className="text-xs font-bold text-slate-800 font-sans mt-0.5">{stats.fonnteQuota} Pesan ({stats.fonntePackage})</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 mt-1">Berlaku sampai: {stats.fonnteExpired}</p>
                  </div>
                )}

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Nomor WhatsApp Bisnis</p>
                  <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">{config?.whatsappPhone || 'Terkonfigurasi'}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Tipe Gateway</p>
                  <p className="text-xs font-bold text-indigo-700 mt-0.5">Cloud Multi-Device API</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[9.5px] text-indigo-800 text-left leading-relaxed font-semibold">
                *Multi-device cloud ditenagai sepenuhnya oleh server Fonnte. HP Anda tidak dituntut berada dekat server hosting agar AI selalu merespons.
              </div>

              <button 
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  addLog('Meminta pembaruan status server dengan Fonnte API...');
                  try {
                    await fetchStats();
                    addLog('Sinkronisasi status selesai.');
                  } catch (e) {
                    addLog('Aksi sinkronisasi gagal.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs tracking-wide shadow-lg shadow-indigo-600/15 flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>{loading ? 'Menyinkronkan...' : 'Cek Status Hubung Sekarang'}</span>
              </button>
            </div>
          ) : stats.connectionStatus === 'Connected' ? (
            <div className="py-6 flex flex-col items-center w-full">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                <Wifi size={28} className="animate-pulse" />
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest font-mono">
                ONLINE & AKTIF
              </span>
              
              <div className="mt-6 space-y-2.5 text-center w-full px-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Nomor Terhubung</p>
                  <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{stats.connectedNumber}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Nama Device</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{stats.connectedName}</p>
                </div>
              </div>

              <div className="mt-8 w-full">
                <button
                  disabled={loading}
                  onClick={() => toggleConnection('disconnect')}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs tracking-wide border border-rose-100 hover:border-rose-200 transition-colors cursor-pointer"
                >
                  {loading ? 'Sistem Memproses...' : 'Disconnect / Putuskan Koneksi'}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center w-full">
              <span className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-full border border-rose-100 uppercase tracking-widest font-mono mb-4">
                TERPUTUS (Offline)
              </span>

              {/* Pseudo QR code block representation */}
              <div className="relative p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl w-52 h-52 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-white/20 divide-y flex flex-col gap-0.5 animate-pulse opacity-40">
                  <div className="bg-black/80 flex-1 w-full"></div>
                  <div className="bg-black/20 flex-1 w-full"></div>
                  <div className="bg-black/90 flex-1 w-full"></div>
                </div>

                <div className="z-10 flex flex-col items-center">
                  <QrCode size={130} className="text-slate-800" />
                  <span className="text-[10px] text-slate-400 font-mono font-semibold mt-2.5">QR_ID: {qrRefreshedCount}</span>
                </div>
              </div>

              <button
                onClick={handleQrRefresh}
                className="mt-4 flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin text-emerald-500' : ''} />
                <span>Segarkan Kode QR</span>
              </button>

              <div className="mt-6 w-full space-y-2">
                <button
                  disabled={loading}
                  onClick={() => toggleConnection('connect')}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
                >
                  {loading ? 'Menghubungkan...' : 'Simulasi Pindai QR Sekarang'}
                </button>
                <p className="text-[10px] text-slate-400 leading-relaxed px-2">
                  *Klik tombol simulasi untuk meniru scan menggunakan HP admin dalam simulasi uji coba ini.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Guided steps + Terminal Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guide Steps */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-fadeIn">
            {config?.whatsappMode === 'Fonnte' ? (
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-50 pb-3 flex items-center justify-between">
                  <span>Informasi Webhook Real WhatsApp</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold font-sans uppercase">SIAP</span>
                </h3>
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Salin alamat URL Webhook di bawah ini, lalu tempelkan ke kolom <strong>Webhook URL</strong> di panel akun Fonnte Anda agar setiap pesan yang dikirim pelanggan ke nomor Anda dijawab secara otomatis dalam 0.5 detik!
                  </p>
                  
                  <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Webhook URL</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/api/webhook/whatsapp`}
                        className="flex-1 text-xs font-mono p-2 bg-white rounded-lg border border-slate-200 outline-none select-all font-bold text-indigo-700 break-all"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/api/webhook/whatsapp`);
                          alert('Alamat webhook berhasil disalin!');
                        }}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                      >
                        Salin
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs">
                      <h4 className="font-bold text-slate-800">Cara Pengaturan Webhook:</h4>
                      <ol className="list-decimal pl-4 mt-2 text-slate-500 space-y-1.5 leading-relaxed font-medium">
                        <li>Masuk ke dashboard panel <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Fonnte</a>.</li>
                        <li>Pilih menu <strong>Device</strong> lalu klik edit device Anda.</li>
                        <li>Isi kolom <strong>Webhook URL</strong> dengan alamat di atas.</li>
                        <li>Simpan perubahan (Klik <strong>Save Webhook</strong>).</li>
                      </ol>
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs">
                      <h4 className="font-bold text-emerald-800">Uji Coba Pengiriman:</h4>
                      <p className="mt-2 text-emerald-700 leading-relaxed font-medium">
                        Coba kirimkan pesan bertuliskan <span className="font-bold bg-white px-1 py-0.5 rounded border border-emerald-200 font-mono text-[10px]">&quot;Halo, minta daftar menu&quot;</span> dari nomor WA pribadimu ke nomor terdaftar Anda sendiri. AI kami akan membalasnya dengan real-time!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-50 pb-3">Cara Menghubungkan Nomor WhatsApp</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-start space-x-3 text-xs text-slate-600 font-medium">
                    <div className="w-5 h-5 bg-slate-100 text-slate-800 font-bold rounded-full flex items-center justify-center shrink-0">1</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Buka Aplikasi WhatsApp di Handphone Anda</h4>
                      <p className="text-slate-500 mt-1">Pastikan handphone terkoneksi internet lancar.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-xs text-slate-600 font-medium">
                    <div className="w-5 h-5 bg-slate-100 text-slate-800 font-bold rounded-full flex items-center justify-center shrink-0">2</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Ketuk Opsi &gt; Perangkat Tertaut (Linked Devices)</h4>
                      <p className="text-slate-500 mt-1">Tekan tombol &quot;Tautkan Perangkat (Link a Device)&quot;.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-xs text-slate-600 font-medium">
                    <div className="w-5 h-5 bg-slate-100 text-slate-800 font-bold rounded-full flex items-center justify-center shrink-0">3</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Arahkan Kamera HP ke QR Code WAI Assistant</h4>
                      <p className="text-slate-500 mt-1">Uji coba instan dengan menekan tombol hijau simulasi untuk mensimulasikan pemindaian berhasil.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live System Terminal Logs */}
          <div className="bg-[#0a192f] p-5 rounded-2xl border border-slate-800 shadow-xl text-slate-300 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2 text-slate-200">
                <Terminal size={14} className="text-emerald-400" />
                <span className="text-xs font-bold tracking-tight">KONSOL REKONSILIASI KONEKSI REAL-TIME</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                <span className="text-[10px] text-slate-400 font-bold">ONLINE</span>
              </div>
            </div>

            <div className="h-32 overflow-y-auto text-[10.5px] space-y-1.5 leading-relaxed flex flex-col scrollbar-thin scrollbar-thumb-slate-800">
              {activeLogs.map((log, index) => (
                <div key={index} className={`truncate ${index === 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
