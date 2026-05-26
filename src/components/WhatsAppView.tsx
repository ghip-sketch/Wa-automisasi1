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

interface WhatsAppViewProps {
  stats: DashboardStats;
  fetchStats: () => void;
}

export default function WhatsAppView({ stats, fetchStats }: WhatsAppViewProps) {
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
      const response = await fetch('/api/whatsapp/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      
      if (data.success) {
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
      }
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
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Koneksi Layanan WhatsApp Web</h2>
        <p className="text-sm text-slate-500 mt-1">
          Hubungkan WAI Assistant ke nomor WhatsApp Bisnis Anda menggunakan modul Web Multi-Device WhatsApp standar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code / Active Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden h-fit">
          {stats.connectionStatus === 'Connected' ? (
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
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
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
