import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { Lead, KBDocument, AppConfig, DashboardStats, Message, QnARule } from '../types';

// Helper to determine if we should call the backend API or use direct client-side fallback
let useClientFallbackCached: boolean | null = null;

async function checkBackendAvailable(): Promise<boolean> {
  return true;
}

function extractSupabaseUrl(url: string, key: string): string {
  const cleanUrl = url?.trim() || '';
  const cleanKey = key?.trim() || '';

  // Try to decode JWT payload from api key to obtain project reference
  let jwtRef = '';
  if (cleanKey) {
    const parts = cleanKey.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (payload && payload.ref) {
          jwtRef = payload.ref.trim();
        }
      } catch (e) {
        try {
          const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1]))));
          if (payload && payload.ref) {
            jwtRef = payload.ref.trim();
          }
        } catch (err2) {}
      }
    }
  }

  if (jwtRef) {
    return `https://${jwtRef}.supabase.co`;
  }

  if (!cleanUrl) return '';

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  if (/^[a-z0-9]{20}$/i.test(cleanUrl)) {
    return `https://${cleanUrl}.supabase.co`;
  }

  return cleanUrl;
}

// Client-side credentials getters
export function getSavedCredentials() {
  const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '';
  const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key') || '';
  const gemini = (import.meta as any).env?.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
  const url = extractSupabaseUrl(rawUrl, key);
  return { url, key, gemini };
}

// Retrieve direct Supabase instance if configured
let supabaseInstance: SupabaseClient | null = null;
export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSavedCredentials();
  if (!url || !key) return null;
  if (!supabaseInstance || (supabaseInstance as any).supabaseUrl !== url) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: true }
      });
    } catch (e) {
      console.error('Failed to create Supabase client instance:', e);
      return null;
    }
  }
  return supabaseInstance;
}

// Helper to check if Supabase is fully reachable and loaded
export async function isSupabaseConnected(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('config').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ---------------- LOCAL STORAGE FALLBACK SEED DATA ----------------
const LOCAL_LEADS_KEY = 'wai_local_leads';
const LOCAL_DOCS_KEY = 'wai_local_docs';
const LOCAL_CONFIG_KEY = 'wai_local_config';
const LOCAL_WA_KEY = 'wai_local_wa';
const LOCAL_QNA_KEY = 'wai_local_qna';

const defaultLocalQnaRules: QnARule[] = [
  {
    id: 'qna_1',
    keyword: 'Halo',
    reply: 'Halo! Terima kasih telah menghubungi kami. Kami merasa gembira menyapa Anda. Ada yang bisa kami bantu seputar menu kafe atau pemesanan hari ini? 😊☕',
    matchType: 'contains',
    isActive: true
  },
  {
    id: 'qna_2',
    keyword: 'Alamat',
    reply: 'Alamat Coffee & Co. Jakarta berlokasi di Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan. Kami sedia lahan parkir luas, colokan di tiap meja, serta Wi-Fi 100 Mbps! 🗺️✨',
    matchType: 'contains',
    isActive: true
  },
  {
    id: 'qna_3',
    keyword: 'Jam buka',
    reply: 'Coffee & Co. Jakarta buka setiap hari mulai pukul 09:00 - 21:00 WIB. Pilihan pas untuk sarapan, makan siang, atau coworking produktif! ☀️🌙',
    matchType: 'contains',
    isActive: true
  }
];

const defaultLocalConfig: AppConfig = {
  businessName: 'Coffee & Co. Jakarta',
  businessDesc: 'Kafe premium di Jakarta Selatan yang menjual kopi artisan, roti panggang segar, dan area coworking yang nyaman.',
  autoReplyActive: true,
  systemPrompt: 'Anda adalah Asisten Virtual WhatsApp resmi Kafe Coffee & Co. Jakarta. Jawab pelanggan dengan sopan, ramah, dan berikan informasi akurat sesuai Pengetahuan Bisnis kami. Jika pertanyaan di luar jangkauan, tawarkan untuk diteruskan ke tim manusia.',
  tone: 'Casual',
  welcomeMessage: 'Halo! Terima kasih telah menghubungi Coffee & Co. Jakarta. Ada yang bisa kami bantu hari ini? ☕✨',
  workingHours: {
    start: '09:00',
    end: '21:00',
    enabled: true,
  },
  outOfHoursMessage: 'Terima kasih telah menghubungi kami. Saat ini kafe kami sedang tutup (Jam Operasional: 09:00 - 21:00 WIB). AI kami masih dapat menjawab beberapa FAQ umum, namun admin manusia akan membalas pesan Anda besok pagi! Kopi segar menunggu Anda besok! ☕',
  supabaseUrl: '',
  supabaseAnonKey: '',
  whatsappMode: 'Simulator',
  whatsappToken: '',
  whatsappPhone: ''
};

const defaultLocalLeads: Lead[] = [
  {
    id: 'l1',
    name: 'Budi Santoso',
    phone: '+6281234567890',
    firstContact: '2026-05-25T10:30:00Z',
    lastContact: '2026-05-25T11:15:00Z',
    status: 'Prospek',
    notes: 'Tertarik memesan katering kopi susu untuk acara kantor 50 porsi hari Jumat.',
    chatHistory: [
      { id: 'm1', sender: 'customer', text: 'Halo, apakah melayani pemesanan kopi botol besar untuk katering?', timestamp: '2026-05-25T10:30:00Z' },
      { id: 'm2', sender: 'assistant', text: 'Halo Budi! Ya, di Coffee & Co. Jakarta kami menyediakan paket Katering Kopi 1 Liter dan botol personal (250ml) untuk acara spesial Anda. Kami memiliki diskon khusus untuk pembelian di atas 20 botol!', timestamp: '2026-05-25T10:31:00Z' },
      { id: 'm3', sender: 'customer', text: 'Boleh minta daftar harganya? Saya butuh sekitar 50 porsi untuk Jumat ini.', timestamp: '2026-05-25T11:12:00Z' },
      { id: 'm4', sender: 'assistant', text: 'Baik Budi, daftar harga paket event kami kirimkan. Untuk 50 porsi, kami berikan diskon 15% gratis ongkir Jakarta Selatan. Mau kami bantu buatkan penawaran resminya?', timestamp: '2026-05-25T11:15:00Z' }
    ]
  },
  {
    id: 'l2',
    name: 'Siti Rahma',
    phone: '+6281987654321',
    firstContact: '2026-05-25T14:05:00Z',
    lastContact: '2026-05-25T14:10:00Z',
    status: 'Baru',
    notes: 'Bertanya tentang menu vegan/non-dairy milk.',
    chatHistory: [
      { id: 'm5', sender: 'customer', text: 'Apakah kopi susu pandannya bisa pakai oat milk?', timestamp: '2026-05-25T14:05:00Z' },
      { id: 'm6', sender: 'assistant', text: 'Halo Siti! Tentu bisa, di Coffee & Co. Jakarta semua menu kopi susu kami bisa diganti ke Oat Milk atau Almond Milk dengan tambahan biaya Rp 8.000 saja. Rasanya tetap creamy dan ramah vegan!', timestamp: '2026-05-25T14:10:00Z' }
    ]
  }
];

const defaultLocalDocs: KBDocument[] = [
  {
    id: 'doc1',
    name: 'Daftar Menu & Harga 2026.txt',
    type: 'text/plain',
    size: 450,
    uploadDate: '2026-05-25T01:00:00Z',
    chunkCount: 3,
    content: `DAFTAR MENU COFFEE & CO. JAKARTA:
1. Espresso: Single (Rp 20.000), Double (Rp 25.000)
2. Americano / Long Black: Panas (Rp 28.000), Dingin (Rp 30.000)
3. Cappuccino / Cafe Latte: Panas (Rp 35.000), Dingin (Rp 38.000)
4. Kopi Susu Pandan Wangi (Best Seller): Dingin (Rp 35.000) - Espresso blend, susu segar, sirup pandan buatan rumah asli.
5. Matcha Latte Premium: Dingin (Rp 38.000)
6. Roti bakar Srikaya & Butter: Rp 28.000
7. Croissant Almond: Rp 32.000

Pilihan Susu Alternatif: Oat Milk / Almond Milk (+ Rp 8.000)`
  } as any,
  {
    id: 'doc2',
    name: 'Kebijakan Reservasi & Coworking.txt',
    type: 'text/plain',
    size: 610,
    uploadDate: '2026-05-25T02:00:00Z',
    chunkCount: 2,
    content: `KEBIJAKAN RESERVASI AREA COWORKING COFFEE & CO.:
- Area umum kafe bebas digunakan tanpa charge minimum, cukup memesan menu kafe. Sedia stopkontak melimpah dan Wi-Fi kecepatan tinggi (100 Mbps).
- Ruang Rapat Privat: Kapasitas sampai 8 orang. Biaya sewa Rp 150.000/jam (termasuk air mineral, proyektor, dan papan tulis). Dapatkan diskon sewa sebesar 50% jika memesan makanan/minuman kafe minimal Rp 300.000.
- Jam Operasional Coworking Area mengikuti jam operasional utama kafe: buka dari jam 09:00 - 21:00 WIB.`
  } as any
];

const defaultLocalWA = {
  isConnected: true,
  connectedNumber: '+62 812-4521-9988',
  deviceName: 'iPhone 15 Pro - WAI Production',
  status: 'Connected' as const
};

// Local storage access utilities
const getLocalData = <T>(key: string, backup: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(backup));
    return backup;
  }
  try {
    return JSON.parse(data);
  } catch {
    return backup;
  }
};

const setLocalData = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// ---------------- LOCAL RAG INDEX HELPER ----------------
function localRetrieveContext(query: string, documents: any[]): string {
  if (!documents || documents.length === 0) return '';
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let scoredChunks: Array<{ text: string; score: number }> = [];

  for (const doc of documents) {
    const rawContent = doc.content || '';
    const paragraphs = rawContent.split(/\n{2,}|\n(?=[A-Z0-9]\.)/);
    for (const para of paragraphs) {
      if (!para.trim()) continue;
      let score = 0;
      const paraLower = para.toLowerCase();
      for (const word of queryWords) {
        if (paraLower.includes(word)) score += 1;
      }
      if (score > 0) scoredChunks.push({ text: para, score });
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, 3).map(c => c.text);
  if (topChunks.length > 0) {
    return `\n=== INFORMASI BISNIS DARI KNOWLEDGE BASE ===\n${topChunks.join('\n\n')}\n============================================\n`;
  }
  return `\n=== INFORMASI BISNIS DARI KNOWLEDGE BASE ===\n${documents.map(d => d.content || d.name).join('\n\n')}\n============================================\n`;
}

// ---------------- CORE EXPORTED ARCHITECTURAL DATA SERVICES ----------------
export const dataService = {
  // CONFIG & PROFILE
  getConfig: async (): Promise<{ config: AppConfig; whatsapp: typeof defaultLocalWA }> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/config');
      const data = await res.json();
      return { config: data.config, whatsapp: data.whatsapp };
    }

    // Direct Supabase fetch option (if available client side)
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: configData, error: configErr } = await client.from('config').select('*').eq('id', 'default').single();
        const { data: waData, error: waErr } = await client.from('whatsapp').select('*').eq('id', 'default').single();
        
        if (!configErr && configData) {
          // Sync changes back to local storage configured credentials
          if (configData.supabaseUrl) {
            localStorage.setItem('supabase_url', configData.supabaseUrl);
          }
          if (configData.supabaseAnonKey) {
            localStorage.setItem('supabase_anon_key', configData.supabaseAnonKey);
          }
          return {
            config: configData as AppConfig,
            whatsapp: (waData || defaultLocalWA) as typeof defaultLocalWA
          };
        }
      } catch (e) {
        console.error('Supabase config fetch failed, playing localStorage fallback', e);
      }
    }

    const config = getLocalData(LOCAL_CONFIG_KEY, defaultLocalConfig);
    const whatsapp = getLocalData(LOCAL_WA_KEY, defaultLocalWA);
    return { config, whatsapp };
  },

  saveConfig: async (config: AppConfig): Promise<boolean> => {
    // Sync keys in localStorage instantly to prevent disconnects on cold builds
    if (config.supabaseUrl) localStorage.setItem('supabase_url', config.supabaseUrl);
    if (config.supabaseAnonKey) localStorage.setItem('supabase_anon_key', config.supabaseAnonKey);

    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return res.ok;
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('config').upsert({ id: 'default', ...config });
        if (!error) return true;
      } catch (e) {
        console.error('Supabase saveConfig failed, fallback to local', e);
      }
    }

    setLocalData(LOCAL_CONFIG_KEY, config);
    return true;
  },

  // LEADS CRM
  getLeads: async (): Promise<Lead[]> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/leads');
      return await res.json();
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('leads').select('*').order('lastContact', { ascending: false });
        if (!error && data) {
          // Map database JSON strings if any database parser issues occur
          return data.map(item => ({
            ...item,
            chatHistory: typeof item.chatHistory === 'string' ? JSON.parse(item.chatHistory) : (item.chatHistory || [])
          })) as Lead[];
        }
      } catch (e) {
        console.error('Supabase getLeads error:', e);
      }
    }

    return getLocalData(LOCAL_LEADS_KEY, defaultLocalLeads);
  },

  saveLead: async (lead: Lead): Promise<boolean> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      return res.ok;
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const payload = {
          ...lead,
          chatHistory: typeof lead.chatHistory === 'object' ? lead.chatHistory : []
        };
        const { error } = await client.from('leads').upsert(payload);
        if (!error) return true;
      } catch (e) {
        console.error('Supabase saveLead error:', e);
      }
    }

    const leads = getLocalData(LOCAL_LEADS_KEY, defaultLocalLeads);
    const index = leads.findIndex(l => l.id === lead.id || l.phone === lead.phone);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...lead, lastContact: new Date().toISOString() };
    } else {
      leads.push(lead);
    }
    setLocalData(LOCAL_LEADS_KEY, leads);
    return true;
  },

  deleteLead: async (id: string): Promise<boolean> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      return res.ok;
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('leads').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        console.error('Supabase deleteLead error:', e);
      }
    }

    const leads = getLocalData(LOCAL_LEADS_KEY, defaultLocalLeads);
    const filtered = leads.filter(l => l.id !== id);
    setLocalData(LOCAL_LEADS_KEY, filtered);
    return true;
  },

  // KNOWLEDGE BASE DOCUMENTS
  getDocuments: async (): Promise<KBDocument[]> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/documents');
      return await res.json();
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('documents').select('*');
        if (!error && data) return data as KBDocument[];
      } catch (e) {
        console.error('Supabase getDocuments error:', e);
      }
    }

    return getLocalData(LOCAL_DOCS_KEY, defaultLocalDocs);
  },

  uploadDocument: async (docPayload: { name: string; type: string; size: number; content: string }): Promise<boolean> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docPayload)
      });
      return res.ok;
    }

    const paragraphCount = docPayload.content.split('\n').filter(l => l.trim().length > 0).length;
    const chunkCount = Math.max(1, Math.ceil(paragraphCount / 4));

    const newDoc = {
      id: 'doc_' + Date.now(),
      name: docPayload.name,
      type: docPayload.type,
      size: docPayload.size,
      uploadDate: new Date().toISOString(),
      content: docPayload.content,
      chunkCount
    };

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('documents').insert(newDoc);
        if (!error) return true;
      } catch (e) {
        console.error('Supabase uploadDocument error:', e);
      }
    }

    const docs = getLocalData(LOCAL_DOCS_KEY, defaultLocalDocs);
    docs.push(newDoc as any);
    setLocalData(LOCAL_DOCS_KEY, docs);
    return true;
  },

  deleteDocument: async (id: string): Promise<boolean> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      return res.ok;
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('documents').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        console.error('Supabase deleteDocument error:', e);
      }
    }

    const docs = getLocalData(LOCAL_DOCS_KEY, defaultLocalDocs);
    const filtered = docs.filter(d => d.id !== id);
    setLocalData(LOCAL_DOCS_KEY, filtered);
    return true;
  },

  getQnARules: async (): Promise<QnARule[]> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/qna');
      return await res.json();
    }
    return getLocalData(LOCAL_QNA_KEY, defaultLocalQnaRules);
  },

  saveQnARule: async (rule: QnARule): Promise<boolean> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });
      return res.ok;
    }

    const rules = getLocalData(LOCAL_QNA_KEY, defaultLocalQnaRules);
    const existingIndex = rules.findIndex(r => r.id === r.id && r.id === rule.id);
    if (existingIndex !== -1) {
      rules[existingIndex] = rule;
    } else {
      rules.push(rule);
    }
    setLocalData(LOCAL_QNA_KEY, rules);
    return true;
  },

  deleteQnARule: async (id: string): Promise<boolean> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch(`/api/qna/${id}`, { method: 'DELETE' });
      return res.ok;
    }

    const rules = getLocalData(LOCAL_QNA_KEY, defaultLocalQnaRules);
    const filtered = rules.filter(r => r.id !== id);
    setLocalData(LOCAL_QNA_KEY, filtered);
    return true;
  },

  // HARDWARE TELEMETRY / STATS
  getStats: async (leadsList: Lead[], appConfig: AppConfig | null): Promise<DashboardStats> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/dashboard/stats');
      return await res.json();
    }

    const activeLeads = leadsList.filter(l => l.status !== 'Baru').length;
    const messageTodayCount = leadsList.reduce((acc, lead) => acc + lead.chatHistory.length, 0);
    const waState = getLocalData(LOCAL_WA_KEY, defaultLocalWA);

    return {
      totalCustomers: leadsList.length,
      totalConversations: leadsList.length,
      messagesToday: messageTodayCount,
      totalLeads: activeLeads,
      connectionStatus: waState.status,
      connectedNumber: waState.connectedNumber,
      connectedName: waState.deviceName
    };
  },

  toggleWAConnection: async (action: 'connect' | 'disconnect'): Promise<any> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/whatsapp/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      return data.whatsapp;
    }

    const nextState = action === 'connect' ? {
      isConnected: true,
      connectedNumber: '+62 812-4521-9988',
      deviceName: 'iPhone 15 Pro - WAI Production',
      status: 'Connected' as const
    } : {
      isConnected: false,
      connectedNumber: '',
      deviceName: '',
      status: 'Disconnected' as const
    };

    setLocalData(LOCAL_WA_KEY, nextState);
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('whatsapp').upsert({ id: 'default', ...nextState });
      } catch (e) {
        console.error('Supabase toggleWA error:', e);
      }
    }
    return nextState;
  },

  // AUTOPILOT AI CORE CHAT COMPLETIONS (Dual-system)
  simulateReply: async (
    customerName: string, 
    customerPhone: string, 
    messageText: string,
    currentLeads: Lead[],
    currentConfig: AppConfig
  ): Promise<{ success: boolean; lead: Lead; replyText: string }> => {
    const hasBackend = await checkBackendAvailable();
    if (hasBackend) {
      const res = await fetch('/api/chat/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, customerPhone, messageText })
      });
      return await res.json();
    }

    // ---------------- CLIENT-SIDE SERVERLESS AUTO-REPLY ENGINE ----------------
    // 1. Get/Create local state representation of this customer
    let lead = currentLeads.find(l => l.phone === customerPhone);
    const isNew = !lead;

    if (isNew) {
      lead = {
        id: 'l_' + Date.now(),
        name: customerName || 'Pelanggan Baru',
        phone: customerPhone,
        firstContact: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        chatHistory: [],
        status: 'Baru',
        notes: 'Terbuat otomatis dari chat masuk simulator static.'
      };
    } else {
      lead = {
        ...lead,
        lastContact: new Date().toISOString()
      };
      if (customerName && lead.name === 'Pelanggan Baru') {
        lead.name = customerName;
      }
    }

    // Append incoming user chat
    const customerMsg: Message = {
      id: 'm_' + Date.now() + '_cust',
      sender: 'customer',
      text: messageText,
      timestamp: new Date().toISOString()
    };
    lead.chatHistory = [...lead.chatHistory, customerMsg];

    // Determine config status & auto reply
    const config = currentConfig || getLocalData(LOCAL_CONFIG_KEY, defaultLocalConfig);
    const waStatusState = getLocalData(LOCAL_WA_KEY, defaultLocalWA);

    // If auto reply is turned off
    if (!config.autoReplyActive || waStatusState.status !== 'Connected') {
      await dataService.saveLead(lead);
      return { success: true, lead, replyText: '' };
    }

    // Check operating schedule
    let isTutup = false;
    if (config.workingHours && config.workingHours.enabled) {
      const now = new Date();
      const clientTime = now.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      const [currentHour, currentMinute] = clientTime.split(':').map(Number);
      const [startHour, startMinute] = config.workingHours.start.split(':').map(Number);
      const [endHour, endMinute] = config.workingHours.end.split(':').map(Number);

      const nowInMin = currentHour * 60 + currentMinute;
      const startInMin = startHour * 60 + startMinute;
      const endInMin = endHour * 60 + endMinute;

      if (nowInMin < startInMin || nowInMin > endInMin) {
        isTutup = true;
      }
    }

    let replyText = '';

    if (isTutup) {
      replyText = config.outOfHoursMessage;
    } else {
      // Load current documents in cache
      const docs = getLocalData(LOCAL_DOCS_KEY, defaultLocalDocs);
      const matchedContext = localRetrieveContext(messageText, docs);

      // Try client-side Gemini execution
      const { gemini: geminiKey } = getSavedCredentials();
      if (geminiKey) {
        try {
          const aiEngine = new GoogleGenAI({ apiKey: geminiKey });
          const toneInstruction = {
            Professional: 'Ketik balasan Anda dengan bahasa Indonesia yang sangat sopan, profesional, jelas, menggunakan kata sapaan resmi (Bapak/Ibu/Anda) tanpa singkatan kasar.',
            Casual: 'Ketik balasan Anda dengan gaya kasual, ramah, bersahabat, menggunakan sapaan hangat seperti Kak, Kakak, atau nama mereka secara santai, dan boleh menggunakan beberapa emoji pendukung.',
            Formal: 'Ketik balasan Anda dengan gaya bahasa formal, tata bahasa baku sesuai kamus bahasa Indonesia, terstruktur, sopan, dan langsung pada sasaran.'
          }[config.tone] || 'Gunakan gaya bahasa profesional.';

          const systemPromptInstruction = `
${config.systemPrompt}

DETAIL KORPORASI:
- Nama Bisnis: ${config.businessName}
- Deskripsi Bisnis: ${config.businessDesc}
- Nada bicara: ${config.tone} - ${toneInstruction}

KONTEN PENGETAHUAN PENDUKUNG (RAG):
${matchedContext}

SIAPA YANG DIAJAK BICARA:
- Nama Pelanggan: ${lead.name}
- Hubungi nomor: ${lead.phone}

TUGAS UTAMA:
Jawablah pelanggan dengan ramah sesuai informasi pangkalan pengetahuan kami. Berikan respons ringkas, bersahabat, tanpa menulis label "Jawaban:" atau metadata internal lainnya.
          `;

          const completion = await aiEngine.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: messageText,
            config: {
              systemInstruction: systemPromptInstruction,
              temperature: 0.7
            }
          });

          replyText = completion.text || '';
        } catch (gemError) {
          console.error('Client-side Gemini execution error:', gemError);
          replyText = `Maaf, saya (Asisten Virtual) mengalami kesulitan sementara memproses ini langsung dari browser. ${config.welcomeMessage}`;
        }
      } else {
        // High quality local heuristic mock responses if no key is supplied yet
        const textWords = messageText.toLowerCase();
        if (textWords.includes('menu') || textWords.includes('harga') || textWords.includes('makan') || textWords.includes('kopi')) {
          replyText = `Halo Kak ${lead.name}! Menu andalan terlaris kami di ${config.businessName} adalah:\n- Kopi Susu Pandan Wangi (Best Seller): Dingin (Rp 35.000) - Espresso pandan alami.\n- Cafe Latte / Cappuccino: Rp 38.000\n- Croissant Almond: Rp 32.000.\n\nApakah Kakak ingin kami bantu buatkan pesanan untuk diantarkan hari ini? 😊🧁`;
        } else if (textWords.includes('reservasi') || textWords.includes('coworking') || textWords.includes('sewa') || textWords.includes('ruang')) {
          replyText = `Halo Kak ${lead.name}! Ruang rapat privat di ${config.businessName} berdaya tampung hingga 8 orang dengan fasilitas proyektor & wifi kencang dapat disewa seharga Rp 150.000 per jam.\n\nMau disewakan untuk jam berapa dan hari apa Kak? Silakan kabari kami ya!`;
        } else {
          replyText = `${config.welcomeMessage.replace('Halo!', `Halo Kak ${lead.name}!`)}\n\nSaya adalah asisten AI otomatis. Kakak dapat bertanya mengenai menu kami, promo sewa meeting room, atau letak parkir kafe kami.`;
        }
      }
    }

    // Append AI response to client history
    const assistantMsg: Message = {
      id: 'm_' + Date.now() + '_asst',
      sender: 'assistant',
      text: replyText,
      timestamp: new Date().toISOString()
    };
    lead.chatHistory = [...lead.chatHistory, assistantMsg];

    // Auto-categorize status
    const txt = messageText.toLowerCase();
    if (lead.status === 'Baru') lead.status = 'Prospek';
    if (txt.includes('pesan') || txt.includes('order') || txt.includes('booking') || txt.includes('sewa') || txt.includes('reservasi')) {
      lead.status = 'Follow Up';
    }
    if (txt.includes('sudah bayar') || txt.includes('transfer') || txt.includes('lunas') || txt.includes('closing')) {
      lead.status = 'Closing';
    }

    // Save lead back
    await dataService.saveLead(lead);

    return { success: true, lead, replyText };
  }
};
