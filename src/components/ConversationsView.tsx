import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  Smartphone, 
  User, 
  CheckCheck,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  RefreshCw,
  Plus,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Lead, Message, AppConfig } from '../types';

interface ConversationsViewProps {
  leads: Lead[];
  config: AppConfig;
  fetchLeads: () => void;
  fetchStats: () => void;
}

export default function ConversationsView({ leads, config, fetchLeads, fetchStats }: ConversationsViewProps) {
  // Simulator State
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [autoReplyLocal, setAutoReplyLocal] = useState(config.autoReplyActive);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // New Chat Dialog Simulation
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+62 8');

  // FAQs templates to allow instant testing
  const faqTemplates = [
    { label: 'Tanya Menu Favorit', prompt: 'Rekomendasikan menu kopi susu terlaris di sini sama harganya dong' },
    { label: 'Tanya Jam Operasional', prompt: 'Halo kafe buka jam berapa ya? Dan lokasinya di mana?' },
    { label: 'Reservasi Coworking', prompt: 'Saya mau sewa ruang rapat privat kapasitas 8 orang untuk besok pagi bisa?' },
    { label: 'Pemesanan Catering', prompt: 'Apakah melayani order katering kopi botol kecil untuk acara kantor?' }
  ];

  // Auto-scroll chat body
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeLead?.chatHistory, isTyping]);

  // Set default active channel
  useEffect(() => {
    if (leads.length > 0 && !activeLead) {
      setActiveLead(leads[0]);
    }
  }, [leads]);

  // Handle local auto reply toggle
  const handleToggleAutoReply = async () => {
    const nextVal = !autoReplyLocal;
    setAutoReplyLocal(nextVal);
    
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoReplyActive: nextVal })
      });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Create a brand new simulated chat
  const handleCreateChat = () => {
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const mockLead: Lead = {
      id: 'l_new_' + Date.now(),
      name: newCustName,
      phone: newCustPhone,
      firstContact: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      chatHistory: [],
      status: 'Baru',
      notes: 'Customer dibuat dari pemicu manual simulator chat.'
    };

    // Pre-hook active lead list locally
    setActiveLead(mockLead);
    setIsCreatingNewChat(false);
    setNewCustName('');
    setNewCustPhone('+62 8');
  };

  // Submit Simulated Client messaging
  const submitMessage = async (alternativeText?: string) => {
    const messageToSend = alternativeText || inputText;
    if (!messageToSend.trim() || !activeLead) return;

    if (!alternativeText) {
      setInputText('');
    }

    // Update frontend immediately with User payload
    const clientMsg: Message = {
      id: 'sim_m_' + Date.now() + '_cust',
      sender: 'customer',
      text: messageToSend,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...activeLead.chatHistory, clientMsg];
    const updatedLeadState = { ...activeLead, chatHistory: updatedHistory };
    setActiveLead(updatedLeadState);

    // Trigger typing state
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: activeLead.name,
          customerPhone: activeLead.phone,
          messageText: messageToSend
        }),
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.success) {
        // Find if this lead exists on global lists or gets created
        fetchLeads();
        fetchStats();

        // Push response conversation directly
        if (data.replyText) {
          const botMsg: Message = {
            id: 'sim_m_' + Date.now() + '_bot',
            sender: 'assistant',
            text: data.replyText,
            timestamp: new Date().toISOString()
          };
          setActiveLead({
            ...data.lead,
            chatHistory: [...data.lead.chatHistory]
          });
        } else {
          // If auto reply skipped
          setActiveLead(data.lead);
        }
      }
    } catch (err: any) {
      setIsTyping(false);
      console.error('Simulated message dispatch error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Simulator Chat & Pengujian Sandbox</h2>
          <p className="text-sm text-slate-500 mt-1">
            Uji interaksi auto-reply AI Anda di sini. Ketik pesan sebagai <strong>pelanggan</strong>, dan saksikan bagaimana asisten AI membalas otomatis.
          </p>
        </div>

        {/* Local Auto-Reply Quick Toggle */}
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
          <span className="text-xs font-bold text-slate-700">Auto Reply AI:</span>
          <button 
            onClick={handleToggleAutoReply}
            className="text-emerald-500 hover:text-emerald-600 cursor-pointer"
          >
            {autoReplyLocal ? <ToggleRight size={38} /> : <ToggleLeft size={38} className="text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Main Sandbox Screen Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[540px]">
        
        {/* Left Side: Mock Customer List */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktif Chatting</h3>
              <button 
                onClick={() => setIsCreatingNewChat(true)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-1.5 rounded-lg border border-emerald-100 cursor-pointer text-[10px] font-bold flex items-center space-x-1"
                title="Simulasikan Customer Baru"
              >
                <Plus size={11} />
                <span>Customer Baru</span>
              </button>
            </div>

            {/* Chat list channel container */}
            <div className="space-y-1.5 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin scrollbar-thumb-slate-155">
              {isCreatingNewChat && (
                <div className="p-3 bg-slate-50 rounded-xl border border-emerald-200 shadow-sm mb-2 space-y-2.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Parameter Customer Baru</p>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    placeholder="Nama lengkap..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    placeholder="No WhatsApp (+62...)"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <div className="flex justify-end space-x-1.5">
                    <button 
                      onClick={() => setIsCreatingNewChat(false)}
                      className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleCreateChat}
                      disabled={!newCustName || !newCustPhone}
                      className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded cursor-pointer disabled:opacity-50"
                    >
                      Buat Chat
                    </button>
                  </div>
                </div>
              )}

              {leads.map((lead) => {
                const isActive = activeLead?.id === lead.id;
                const lastMsg = lead.chatHistory[lead.chatHistory.length - 1];
                return (
                  <div
                    key={lead.id}
                    onClick={() => setActiveLead(lead)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center space-x-3 ${
                      isActive 
                        ? 'bg-[#0a192f] border-slate-800 text-white' 
                        : 'bg-slate-50 hover:bg-slate-100/50 text-slate-800 border-slate-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {lead.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold truncate">{lead.name}</h4>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {lead.status}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 font-normal ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                        {lastMsg ? lastMsg.text : 'Mulai simulasi mengetik di kanan...'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-sky-50 rounded-xl border border-sky-100 text-[10px] text-sky-800 font-medium flex items-center space-x-1.5">
            <Sparkles size={12} className="text-sky-500" />
            <span>AI mengklasifikasi lead otomatis saat chat terkirim.</span>
          </div>
        </div>

        {/* Right Side: High fidelity Simulated WhatsApp interface */}
        <div className="lg:col-span-2 bg-[#efeae2] rounded-2xl shadow-inner border border-slate-200 flex flex-col justify-between overflow-hidden relative h-full">
          {activeLead ? (
            <>
              {/* Phone Simulator Top Bar */}
              <div className="bg-[#075e54] text-white p-4 flex items-center justify-between shadow-md z-10 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-teal-800 font-extrabold flex items-center justify-center text-xs">
                    {activeLead.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-none">{activeLead.name}</h4>
                    <p className="text-[9.5px] text-teal-100 font-medium font-mono mt-1 opacity-90">{activeLead.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[9.5px] font-bold bg-[#128c7e] text-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-mono">
                    ONLINE (SIM)
                  </span>
                </div>
              </div>

              {/* Chat Bubble Scrollable Area */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-black/10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"
                style={{ backgroundColor: '#efeae2', backgroundBlendMode: 'overlay', opacity: 0.96 }}
              >
                {/* Simulated Disclaimer */}
                <div className="mx-auto max-w-xs text-center">
                  <span className="inline-block bg-[#ffeecd] text-[#303030] text-[9.5px] font-semibold px-3 py-1.5 rounded-lg shadow-sm border border-orange-100">
                    🔒 Chat disimulasikan sebagai pelanggan. Pesan yang Anda kirim akan diterima oleh Autoreply AI.
                  </span>
                </div>

                {activeLead.chatHistory.map((msg) => {
                  const isCust = msg.sender === 'customer';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col w-full ${isCust ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`rounded-xl px-3.5 py-2 max-w-[80%] text-xs shadow-sm flex flex-col relative ${
                        isCust 
                          ? 'bg-[#d9fdd3] text-[#303030] rounded-tr-none' 
                          : 'bg-white text-[#303030] rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap font-sans font-medium">{msg.text}</p>
                        
                        <div className="flex items-center justify-end space-x-1 mt-1 shrink-0">
                          <span className="text-[8.5px] text-slate-400 font-semibold font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isCust && <CheckCheck size={11} className="text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Simulated typing state */}
                {isTyping && (
                  <div className="flex items-center space-x-2 p-2 bg-white rounded-xl text-xs font-bold font-sans w-fit shadow-sm border border-slate-100">
                    <Clock size={12} className="text-slate-400 animate-spin" />
                    <span className="text-slate-500 animate-pulse text-[10.5px]">Asisten AI sedang menyusun jawaban sesuai RAG...</span>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Bot template quick click prompts */}
              <div className="p-2 border-t border-slate-200 bg-white/95 shrink-0 z-10">
                <p className="text-[9.5px] text-slate-400 font-bold uppercase mb-1.5 px-1.5">Pertanyaan Pendukung Cepat (Demo RAG)</p>
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 scrollbar-none">
                  {faqTemplates.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(faq.prompt);
                        submitMessage(faq.prompt);
                      }}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-[9.5px] font-extrabold whitespace-nowrap transition-all border border-slate-200/60 flex items-center cursor-pointer select-none"
                    >
                      <Sparkles size={11} className="mr-1 text-emerald-500 shrink-0" />
                      {faq.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Chat sending box */}
              <div className="p-3 bg-[#f0f2f5] border-t border-slate-200 flex items-center space-x-2 shrink-0 z-10">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Ketik pesan dari sisi Pelanggan..."
                  className="flex-1 px-4 py-2.5 bg-white text-slate-800 placeholder-slate-400 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-semibold"
                  onKeyDown={e => e.key === 'Enter' && submitMessage()}
                />
                <button
                  disabled={!inputText.trim() || isTyping}
                  onClick={() => submitMessage()}
                  className="bg-[#00a884] hover:bg-[#008f72] text-white p-2.5 rounded-full shadow-lg shadow-[#00a884]/20 hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer flex items-center justify-center disabled:opacity-50"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white">
              <Smartphone size={42} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Tidak ada Percakapan Aktif</h3>
              <p className="text-xs max-w-xs mt-1 leading-relaxed">
                Silakan pilih salah satu pelanggan di daftar kiri atau buat customer baru untuk mulai mensimulasikan teks WhatsApp.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
