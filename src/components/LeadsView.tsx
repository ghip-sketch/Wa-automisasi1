import { useState } from 'react';
import { 
  Users, 
  Search, 
  ChevronRight, 
  MessageSquare, 
  Calendar, 
  Phone, 
  Edit3, 
  Check, 
  Save, 
  Trash2,
  Lock,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { Lead } from '../types';

interface LeadsViewProps {
  leads: Lead[];
  fetchLeads: () => void;
}

export default function LeadsView({ leads, fetchLeads }: LeadsViewProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Notes / Status temporary edit variables
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [localStatus, setLocalStatus] = useState<Lead['status']>('Baru');

  // Filter and search
  const filteredLeads = leads.filter(l => {
    const statusMatch = filterStatus === 'Semua' || l.status === filterStatus;
    const searchMatch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        l.phone.includes(searchQuery);
    return statusMatch && searchMatch;
  });

  // Handle select Lead and fill temporary edit structures
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditedNotes(lead.notes || '');
    setLocalStatus(lead.status);
    setIsEditingNotes(false);
  };

  // Save Lead Updates
  const handleSaveLeadUpdates = async () => {
    if (!selectedLead) return;

    try {
      // 1. Update Notes
      await fetch(`/api/leads/${selectedLead.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editedNotes })
      });

      // 2. Update Status
      await fetch(`/api/leads/${selectedLead.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: localStatus })
      });

      setIsEditingNotes(false);
      
      // Update local state smoothly
      const updatedLead = { ...selectedLead, notes: editedNotes, status: localStatus };
      setSelectedLead(updatedLead);
      
      fetchLeads();
    } catch (err) {
      console.error('Failed saving lead edits', err);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (id: string, name: string) => {
    if (!window.confirm(`Hapus lead "${name}" dan seluruh riwayat chat obrolannya dari database? Tindakan ini permanen.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSelectedLead(null);
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* List Column (Takes 2 cols of 3 if no lead is selected, or 1 col if lead details are expanded) */}
      <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${selectedLead ? 'xl:col-span-1' : 'xl:col-span-3'} flex flex-col justify-between h-full`}>
        <div>
          {/* Header & CRM Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-50 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Users size={18} className="text-emerald-500 mr-2" />
                Lead Pelanggan CRM
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Daftar kontak potensial yang terhimpun secara otomatis dari WhatsApp</p>
            </div>

            {/* Status Quick Bar Filter */}
            <div className="flex items-center space-x-1 overflow-x-auto py-1">
              {['Semua', 'Baru', 'Prospek', 'Follow Up', 'Closing'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    filterStatus === status 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Search Inputs */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau nomor WhatsApp..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
            />
            <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
          </div>

          {/* Leads Dynamic List */}
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Tidak ada pelanggan yang cocok dengan pencarian Anda.
            </div>
          ) : (
            <div className="space-y-2 h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100 pr-1">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedLead?.id === lead.id
                      ? 'bg-emerald-50/40 border-emerald-200/60 shadow-sm shadow-emerald-500/5'
                      : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/40'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-[10.5px]">
                      {lead.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{lead.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">{lead.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                      lead.status === 'Baru' ? 'bg-blue-50 text-blue-600 border border-blue-100/60' :
                      lead.status === 'Prospek' ? 'bg-amber-50 text-amber-600 border border-amber-100/60' :
                      lead.status === 'Follow Up' ? 'bg-purple-50 text-purple-600 border border-purple-100/60' :
                      'bg-emerald-50 text-emerald-600 border border-emerald-100/60'
                    }`}>
                      {lead.status}
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync Status Info bottom of list */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10.5px] text-slate-500 font-medium flex items-center space-x-2">
          <Calendar size={13} className="text-slate-400" />
          <span>Sistem sinkronisasi CRM WhatsApp berjalan secara real-time.</span>
        </div>
      </div>

      {/* Details & Live Chat History column (Shows only when a lead is selected, takes remaining 2 cols) */}
      {selectedLead ? (
        <div className="xl:col-span-2 space-y-6">
          {/* Top Panel: CRM Lead Actions & Notes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-50 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                  {selectedLead.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedLead.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedLead.phone}</p>
                </div>
              </div>

              {/* CRM Lead Status Option Dropdown/Selector */}
              <div className="flex items-center space-x-2">
                <select
                  value={localStatus}
                  onChange={e => setLocalStatus(e.target.value as Lead['status'])}
                  className="bg-slate-50 select-none text-slate-700 font-bold text-xs rounded-xl px-3 py-2 border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Baru">Baru</option>
                  <option value="Prospek">Prospek</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Closing">Closing</option>
                </select>

                <button
                  onClick={handleSaveLeadUpdates}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-colors border border-emerald-100 cursor-pointer"
                  title="Simpan pembaruan lead"
                >
                  <Check size={16} />
                </button>

                <button
                  onClick={() => handleDeleteLead(selectedLead.id, selectedLead.name)}
                  className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors cursor-pointer"
                  title="Hapus lead"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Catatan Pelanggan / Profiling Admin</label>
              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={editedNotes}
                    onChange={e => setEditedNotes(e.target.value)}
                    rows={2}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Masukkan catatan minat pelanggan..."
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveLeadUpdates}
                      className="px-3 py-1.5 bg-[#0a192f] hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Save size={10} />
                      <span>Simpan Catatan</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingNotes(true)}
                  className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 cursor-pointer text-xs flex items-center justify-between text-slate-600 group"
                >
                  <p className="font-medium italic leading-relaxed flex-1">
                    {selectedLead.notes || 'Belum ada catatan khusus. Klik untuk menambahkan instruksi penting/catatan ketertarikan...'}
                  </p>
                  <Edit3 size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 ml-2 shrink-0 transition-opacity" />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Panel: WhatsApp Live History (Speech Bubble Display) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-[360px]">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-900 flex items-center uppercase tracking-wider">
                <MessageSquare size={13} className="text-emerald-500 mr-1.5" />
                Riwayat Chat WhatsApp Pelanggan
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                {selectedLead.chatHistory.length} Pesan
              </span>
            </div>

            {/* Speec Bubble Area */}
            {selectedLead.chatHistory.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-slate-400 text-xs py-10">
                Belum ada records log percakapan. Mulailah mengetes di Simulator Chat!
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 py-1 scrollbar-thin scrollbar-thumb-slate-100">
                {selectedLead.chatHistory.map((msg) => {
                  const isCust = msg.sender === 'customer';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col w-full ${isCust ? 'items-start' : 'items-end'}`}
                    >
                      <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-xs leading-relaxed font-sans shadow-sm ${
                        isCust 
                          ? 'bg-slate-100 text-slate-800 rounded-tl-none' 
                          : 'bg-emerald-500 text-white rounded-tr-none'
                      }`}>
                        <p className="font-semibold whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold mt-1 tracking-wide font-mono px-1">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty Right Side Panel */
        <div className="xl:col-span-2 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[480px]">
          <MessageCircle size={38} className="text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Pilih Kontak Pelanggan</h3>
          <p className="text-xs max-w-sm leading-relaxed mt-1">
            Klik salah satu nama pelanggan di menu sebelah kiri untuk melakukan profiling leads, memodifikasi catatan administratif, dan membaca lengkap riwayat chat bot AI.
          </p>
        </div>
      )}
    </div>
  );
}
