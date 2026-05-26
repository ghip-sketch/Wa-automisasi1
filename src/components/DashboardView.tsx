import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  Phone,
  Database
} from 'lucide-react';
import { Lead, DashboardStats } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  stats: DashboardStats;
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({ leads, stats, setActiveTab }: DashboardViewProps) {
  // Simple simulated chart rendering statistics for active flow
  const dailyActivity = [
    { day: 'Sen', msgs: 24, leads: 3 },
    { day: 'Sel', msgs: 42, leads: 5 },
    { day: 'Rab', msgs: 35, leads: 2 },
    { day: 'Kam', msgs: 50, leads: 6 },
    { day: 'Jum', msgs: 68, leads: 8 },
    { day: 'Sab', msgs: 48, leads: 4 },
    { day: 'Min', msgs: stats.messagesToday || 12, leads: leads.length }
  ];

  const maxMsgs = Math.max(...dailyActivity.map(d => d.msgs), 80);

  return (
    <div className="space-y-6">
      {/* Upper Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Selamat Datang di WAI Assistant! 👋</h2>
          <p className="text-sm text-slate-500 mt-1">
            Asisten AI cerdas Anda aktif menjaga kelancaran komunikasi pemasaran dan CS 24 jam nonstop.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-semibold animate-pulse border border-emerald-100">
          <Sparkles size={14} />
          <span>Sistem RAG & Gemini AI Siap Membalas</span>
        </div>
      </div>

      {/* Main Stats Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Pelanggan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Pelanggan</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalCustomers}</h3>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center mt-1">
              <TrendingUp size={10} className="mr-0.5" /> +15% minggu ini
            </span>
          </div>
        </div>

        {/* Total Percakapan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-violet-50 text-violet-600 rounded-xl">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Percakapan</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalConversations}</h3>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center mt-1">
              <TrendingUp size={10} className="mr-0.5" /> +100% balasan AI
            </span>
          </div>
        </div>

        {/* Pesan Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Pesan Hari Ini</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.messagesToday}</h3>
            <span className="text-[10px] text-slate-400 font-medium flex items-center mt-1">
              Aktifitas real-time simulator
            </span>
          </div>
        </div>

        {/* Status WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className={`p-3.5 rounded-xl ${
            stats.connectionStatus === 'Connected' 
              ? 'bg-emerald-50 text-emerald-600' 
              : stats.connectionStatus === 'Connecting'
              ? 'bg-amber-50 text-amber-600 animate-pulse'
              : 'bg-rose-50 text-rose-600'
          }`}>
            {stats.connectionStatus === 'Connected' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Status WhatsApp</p>
            <h3 className={`text-base font-bold mt-0.5 ${
              stats.connectionStatus === 'Connected' 
                ? 'text-emerald-600' 
                : stats.connectionStatus === 'Connecting'
                ? 'text-amber-500'
                : 'text-rose-600'
            }`}>
              {stats.connectionStatus === 'Connected' ? 'Terhubung' : stats.connectionStatus === 'Connecting' ? 'Menghubungkan' : 'Terputus'}
            </h3>
            <p className="text-[10px] text-slate-500 truncate max-w-[140px] mt-0.5">
              {stats.connectedNumber || 'Belum dihubungkan'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Chart + Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2 cols wide on large) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Grafik Aktivitas AI & Percakapan</h3>
              <p className="text-xs text-slate-400">Jumlah pesan terkirim otomatis oleh sistem RAG setiap harinya</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">7 Hari Terakhir</span>
          </div>

          {/* Simple Highly Polished SVG Bar/Line graph */}
          <div className="h-60 flex items-end justify-between px-2 pt-4 relative">
            {/* Grid Helper Lines */}
            <div className="absolute inset-x-0 bottom-8 border-b border-dashed border-slate-100 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-24 border-b border-dashed border-slate-100 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-40 border-b border-dashed border-slate-100 pointer-events-none"></div>

            {dailyActivity.map((data, index) => {
              const heightPercent = (data.msgs / maxMsgs) * 80 + 10; // offset
              return (
                <div key={index} className="flex flex-col items-center group relative z-10 flex-1">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-[#0a192f] text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-xl pointer-events-none duration-200 z-50">
                    {data.msgs} pesan
                  </div>
                  
                  {/* Dynamic Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className="w-8 sm:w-10 bg-gradient-to-t from-emerald-500/80 to-emerald-400 rounded-t-lg hover:from-emerald-600 hover:to-emerald-500 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-emerald-500/20 shadow-emerald-500/5 hover:scale-105"
                  ></div>
                  
                  {/* Label */}
                  <span className="text-xs font-semibold text-slate-400 mt-3">{data.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Tips & System Info Sidecard */}
        <div className="bg-gradient-to-b from-[#0a192f] to-[#071120] p-6 rounded-2xl text-slate-300 flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 duration-300"></div>
          
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm tracking-wider uppercase font-mono mb-4">
              <Sparkles size={16} />
              <span>Free Tier Optimization</span>
            </div>
            
            <h4 className="text-lg font-bold text-white tracking-tight leading-snug">
              Hemat Anggaran dengan Dukungan Gemini AI
            </h4>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              WAI Assistant memanfaatkan kekuatan model <strong>gemini-3.5-flash</strong> gratis yang super cepat, dipadukan ke database pengetahuan lokal. Anda tidak membutuhkan biaya bulanan server mahal untuk mendukung operasional Anda!
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>Upload dokumen bisnis (.txt) untuk mengajarkan info menu, harga, & jam buka.</span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>Coba simulator chat untuk mengetes logika Gemini membalas pelanggan secara live.</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('conversations')}
            className="mt-6 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Buka Simulator Pengujian</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Bottom Segment: Leads Terbaru overview list */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Lead Pelanggan Terbaru</h3>
            <p className="text-xs text-slate-400">Daftar pelanggan terbaru yang dihubungi oleh AI maupun admin</p>
          </div>
          <button 
            onClick={() => setActiveTab('leads')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
          >
            <span>Lihat Semua Lead</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {leads.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada lead saat ini. Kirimkan pesan di Simulator Chat untuk menguji!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Nomor WhatsApp</th>
                  <th className="py-3 px-4">Status Lead</th>
                  <th className="py-3 px-4">Kontak Pertama</th>
                  <th className="py-3 px-4">Riwayat Chat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium text-xs">
                {leads.slice(0, 3).map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2.5">
                      <div className="w-7 h-7 bg-slate-100 text-slate-700 font-bold rounded-lg flex items-center justify-center text-[10px]">
                        {lead.name[0]}
                      </div>
                      <span>{lead.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {lead.phone}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        lead.status === 'Baru' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        lead.status === 'Prospek' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        lead.status === 'Follow Up' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(lead.firstContact).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate font-normal italic">
                      {lead.chatHistory.length > 0 
                        ? `"${lead.chatHistory[lead.chatHistory.length - 1].text}"` 
                        : 'Belum ada obrolan'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
