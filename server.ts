import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY) {
    if (!ai) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return ai;
  }

  // Fallback to reading saved geminiApiKey from config db.json
  try {
    const db = readDB();
    if (db.config && db.config.geminiApiKey) {
      return new GoogleGenAI({
        apiKey: db.config.geminiApiKey.trim(),
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  } catch (err) {
    console.error('[Gemini Client Dynamic Resolve Error]', err);
  }

  return null;
}

// Interceptor to parse JSON and urlencoded bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Local database default structures
interface LocalDB {
  config: {
    businessName: string;
    businessDesc: string;
    autoReplyActive: boolean;
    systemPrompt: string;
    tone: 'Professional' | 'Casual' | 'Formal';
    welcomeMessage: string;
    workingHours: {
      start: string;
      end: string;
      enabled: boolean;
    };
    outOfHoursMessage: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    whatsappMode?: 'Simulator' | 'Fonnte';
    whatsappToken?: string;
    whatsappPhone?: string;
    geminiApiKey?: string;
  };
  leads: Array<{
    id: string;
    name: string;
    phone: string;
    firstContact: string;
    lastContact: string;
    chatHistory: Array<{
      id: string;
      sender: 'customer' | 'assistant';
      text: string;
      timestamp: string;
    }>;
    status: 'Baru' | 'Prospek' | 'Follow Up' | 'Closing';
    notes: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadDate: string;
    content: string; // Plain text stored for RAG chunks
    chunkCount: number;
  }>;
  whatsapp: {
    isConnected: boolean;
    connectedNumber: string;
    deviceName: string;
    status: 'Connected' | 'Disconnected' | 'Connecting';
  };
  qnaRules: Array<{
    id: string;
    keyword: string;
    reply: string;
    matchType: 'exact' | 'contains';
    isActive: boolean;
  }>;
}

const defaultDB: LocalDB = {
  config: {
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
    whatsappPhone: '',
  },
  leads: [
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
  ],
  documents: [
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
    },
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
    }
  ],
  whatsapp: {
    isConnected: true,
    connectedNumber: '+62 812-4521-9988',
    deviceName: 'iPhone 15 Pro - WAI Production',
    status: 'Connected'
  },
  qnaRules: [
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
  ]
};

// Ensure database load/store functions are safe
function readDBQuiet(): LocalDB {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return defaultDB;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.qnaRules) {
      parsed.qnaRules = defaultDB.qnaRules || [];
    }
    return parsed;
  } catch (error) {
    return defaultDB;
  }
}

function readDB(): LocalDB {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
      return defaultDB;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.qnaRules) {
      parsed.qnaRules = defaultDB.qnaRules || [];
    }
    return parsed;
  } catch (error) {
    console.error('Failed reading DB, falling back to local memory', error);
    return defaultDB;
  }
}

// Supabase synchronization engine
let cachedSupabase: any = null;
let lastSupabaseUrl = '';
let lastSupabaseKey = '';

function extractSupabaseUrl(url: string, key: string): string | null {
  const cleanUrl = url?.trim() || '';
  const cleanKey = key?.trim() || '';

  // 1. Try to decode the JWT key to find the real project reference
  let jwtRef = '';
  if (cleanKey) {
    const parts = cleanKey.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload && payload.ref) {
          jwtRef = payload.ref.trim();
          console.log('[Supabase Url Extractor] Extracted project Reference from API Key JWT:', jwtRef);
        }
      } catch (e) {
        try {
          // Fallback parsing
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('binary'));
          if (payload && payload.ref) {
            jwtRef = payload.ref.trim();
          }
        } catch (err2) {}
      }
    }
  }

  // 2. If we found a JWT reference, always construct a valid URL!
  if (jwtRef) {
    const constructedUrl = `https://${jwtRef}.supabase.co`;
    console.log('[Supabase Url Extractor] Resolved correct URL from JWT payload:', constructedUrl);
    return constructedUrl;
  }

  // 3. If no JWT ref was found, validate and format the provided URL
  if (!cleanUrl) return null;

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  if (/^[a-z0-9]{20}$/i.test(cleanUrl)) {
    return `https://${cleanUrl}.supabase.co`;
  }

  return null;
}

function getSupabase(): any {
  try {
    const db = readDBQuiet();
    const cleanUrlRaw = db.config?.supabaseUrl || '';
    const key = db.config?.supabaseAnonKey?.trim() || '';
    
    if (!key) {
      cachedSupabase = null;
      lastSupabaseUrl = '';
      lastSupabaseKey = '';
      return null;
    }

    const url = extractSupabaseUrl(cleanUrlRaw, key);
    if (!url) {
      cachedSupabase = null;
      lastSupabaseUrl = '';
      lastSupabaseKey = '';
      return null;
    }
    
    if (cachedSupabase && url === lastSupabaseUrl && key === lastSupabaseKey) {
      return cachedSupabase;
    }
    
    console.log('[Supabase Server Init] Creating Supabase client with URL:', url);
    cachedSupabase = createClient(url, key);
    lastSupabaseUrl = url;
    lastSupabaseKey = key;
    return cachedSupabase;
  } catch (e) {
    console.error('[Supabase Server Init Exception]', e);
    return null;
  }
}

async function syncToSupabase(data: LocalDB) {
  const supabase = getSupabase();
  if (!supabase) return;

  console.log('[Supabase Async Sync] Synchronizing changes to Supabase tables in real-time...');

  // 1. Sync config
  try {
    const { error } = await supabase.from('config').upsert({ id: 'default', ...data.config });
    if (error) console.error('[Supabase Sync Warn] config:', error.message);
  } catch (e) {
    console.error('[Supabase Sync Err] config table:', e);
  }

  // 2. Sync whatsapp status
  if (data.whatsapp) {
    try {
      const { error } = await supabase.from('whatsapp').upsert({ id: 'default', ...data.whatsapp });
      if (error) console.error('[Supabase Sync Warn] whatsapp:', error.message);
    } catch (e) {
      console.error('[Supabase Sync Err] whatsapp table:', e);
    }
  }

  // 3. Sync leads
  if (data.leads && Array.isArray(data.leads)) {
    try {
      for (const lead of data.leads) {
        const payload = {
          ...lead,
          chatHistory: typeof lead.chatHistory === 'object' ? lead.chatHistory : []
        };
        const { error } = await supabase.from('leads').upsert(payload);
        if (error) console.error('[Supabase Sync Warn] lead:', lead.id, error.message);
      }
    } catch (e) {
      console.error('[Supabase Sync Err] leads table:', e);
    }
  }

  // 4. Sync documents
  if (data.documents && Array.isArray(data.documents)) {
    try {
      for (const doc of data.documents) {
        const { error } = await supabase.from('documents').upsert(doc);
        if (error) console.error('[Supabase Sync Warn] document:', doc.id, error.message);
      }
    } catch (e) {
      console.error('[Supabase Sync Err] documents table:', e);
    }
  }

  // 5. Sync QnA rules
  if (data.qnaRules && Array.isArray(data.qnaRules)) {
    try {
      for (const rule of data.qnaRules) {
        const { error } = await supabase.from('qna_rules').upsert(rule);
        if (error) {
          const { error: errorAlt } = await supabase.from('qna').upsert(rule);
          if (errorAlt) {
            console.error('[Supabase Sync Warn] qna_rules / qna:', error.message, errorAlt.message);
          }
        }
      }
    } catch (e) {
      console.error('[Supabase Sync Err] qna_rules table:', e);
    }
  }

  console.log('[Supabase Async Sync] Synchronization finished.');
}

async function syncFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) {
    console.log('[Supabase Startup Pull] Supabase parameters not fully configured yet. Running with db.json.');
    return;
  }

  console.log('[Supabase Startup Pull] Pulling data to initialize local Cache/db.json...');
  const db = readDBQuiet();

  // 1. Pull config
  try {
    const { data, error } = await supabase.from('config').select('*').eq('id', 'default').single();
    if (!error && data) {
      db.config = { ...db.config, ...data };
      console.log('[Supabase Startup Pull] Config loaded successfully.');
    }
  } catch (e) {
    console.error('[Supabase Startup Pull] Config table fetch error:', e);
  }

  // 2. Pull whatsapp
  try {
    const { data, error } = await supabase.from('whatsapp').select('*').eq('id', 'default').single();
    if (!error && data) {
      db.whatsapp = { ...db.whatsapp, ...data };
      console.log('[Supabase Startup Pull] WhatsApp status loaded successfully.');
    }
  } catch (e) {
    console.error('[Supabase Startup Pull] WhatsApp table fetch error:', e);
  }

  // 3. Pull leads
  try {
    const { data, error } = await supabase.from('leads').select('*');
    if (!error && data && data.length > 0) {
      db.leads = data.map((item: any) => ({
        ...item,
        chatHistory: typeof item.chatHistory === 'string' ? JSON.parse(item.chatHistory) : (item.chatHistory || [])
      }));
      console.log(`[Supabase Startup Pull] Loaded ${data.length} leads.`);
    }
  } catch (e) {
    console.error('[Supabase Startup Pull] Leads table fetch error:', e);
  }

  // 4. Pull documents
  try {
    const { data, error } = await supabase.from('documents').select('*');
    if (!error && data && data.length > 0) {
      db.documents = data;
      console.log(`[Supabase Startup Pull] Loaded ${data.length} documents.`);
    }
  } catch (e) {
    console.error('[Supabase Startup Pull] Documents table fetch error:', e);
  }

  // 5. Pull qna rules
  try {
    const { data, error } = await supabase.from('qna_rules').select('*');
    if (!error && data && data.length > 0) {
      db.qnaRules = data;
      console.log(`[Supabase Startup Pull] Loaded ${data.length} qna_rules.`);
    } else {
      const { data: dataAlt, error: errorAlt } = await supabase.from('qna').select('*');
      if (!errorAlt && dataAlt && dataAlt.length > 0) {
        db.qnaRules = dataAlt;
        console.log(`[Supabase Startup Pull] Loaded ${dataAlt.length} qna rules.`);
      }
    }
  } catch (e) {
    console.error('[Supabase Startup Pull] QnA rules table fetch error:', e);
  }

  // Write content back
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log('[Supabase Startup Pull] Local database db.json synchronisation finished.');
}

function writeDB(data: LocalDB) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    
    // Run background push to Supabase as fire-and-forget
    syncToSupabase(data).catch(err => {
      console.error('[Background Supabase Sync Failed]', err);
    });
  } catch (error) {
    console.error('Failed writing DB to disk', error);
  }
}

// Simple RAG retrieval helper
function retrieveContext(query: string, documents: Array<{ content: string }>): string {
  if (!documents || documents.length === 0) return '';
  
  // Clean tokens from query
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let scoredChunks: Array<{ text: string; score: number }> = [];

  for (const doc of documents) {
    // Split into smaller chunks by paragraphs
    const paragraphs = doc.content.split(/\n{2,}|\n(?=[A-Z0-9]\.)/);
    for (const para of paragraphs) {
      if (!para.trim()) continue;
      let score = 0;
      const paraLower = para.toLowerCase();
      
      // Rank based on query keyword matches
      for (const word of queryWords) {
        if (paraLower.includes(word)) {
          score += 1;
        }
      }
      
      if (score > 0) {
        scoredChunks.push({ text: para, score });
      }
    }
  }

  // Sort by score
  scoredChunks.sort((a, b) => b.score - a.score);
  
  // Return top 3 chunks concatenated
  const topChunks = scoredChunks.slice(0, 3).map(c => c.text);
  if (topChunks.length > 0) {
    return `\n=== INFORMASI BISNIS DARI KNOWLEDGE BASE ===\n${topChunks.join('\n\n')}\n============================================\n`;
  }

  // Fallback to general documents summaries
  return `\n=== INFORMASI BISNIS DARI KNOWLEDGE BASE ===\n${documents.map(d => d.content).join('\n\n')}\n============================================\n`;
}

// Search for matching manual Q&A rule
function findMatchingQnaRule(text: string, rules: any[]): any | null {
  if (!rules || rules.length === 0) return null;
  const cleanText = text.trim().toLowerCase();
  for (const rule of rules) {
    if (!rule.isActive) continue;
    const cleanKeyword = rule.keyword.trim().toLowerCase();
    if (rule.matchType === 'exact') {
      if (cleanText === cleanKeyword) {
        return rule;
      }
    } else { // contains
      if (cleanText.includes(cleanKeyword)) {
        return rule;
      }
    }
  }
  return null;
}

// Helper to call real Fonnte WhatsApp API
async function sendWhatsAppReal(to: string, text: string, config: any): Promise<boolean> {
  if (config.whatsappMode === 'Fonnte' && config.whatsappToken) {
    try {
      console.log(`[Fonnte Outbound] Sending message to ${to}`);
      // Remove any non-numeric symbols like +, -, spaces
      const cleanPhone = to.replace(/\D/g, ''); 
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': config.whatsappToken.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: cleanPhone,
          message: text
        })
      });
      const resJson: any = await response.json();
      console.log('[Fonnte Outbound Response]', resJson);
      return resJson.status === true;
    } catch (err) {
      console.error('[Fonnte Outbound Error] Failed to send real message:', err);
      return false;
    }
  }
  return false;
}

// API: Get app current settings & stats
app.get('/api/config', (req, res) => {
  const db = readDB();
  res.json({ config: db.config, whatsapp: db.whatsapp });
});

// API: Update app config
app.post('/api/config', (req, res) => {
  const db = readDB();
  db.config = { ...db.config, ...req.body };
  writeDB(db);
  res.json({ success: true, config: db.config });
});

// API: Simulated WhatsApp connection trigger and status toggle
app.post('/api/whatsapp/toggle', (req, res) => {
  const db = readDB();
  const { action } = req.body; // 'connect', 'disconnect'
  
  if (action === 'connect') {
    db.whatsapp.status = 'Connected';
    db.whatsapp.isConnected = true;
    db.whatsapp.connectedNumber = '+62 812-4521-9988';
    db.whatsapp.deviceName = 'iPhone 15 Pro - WAI Production';
  } else {
    db.whatsapp.status = 'Disconnected';
    db.whatsapp.isConnected = false;
    db.whatsapp.connectedNumber = '';
    db.whatsapp.deviceName = '';
  }
  
  writeDB(db);
  res.json({ success: true, whatsapp: db.whatsapp });
});

// API: Get KB documents
app.get('/api/documents', (req, res) => {
  const db = readDB();
  res.json(db.documents);
});

// API: Upload KB documents
app.post('/api/documents/upload', (req, res) => {
  const db = readDB();
  const { name, type, size, content } = req.body;

  if (!name || !content) {
    return res.status(400).json({ error: 'Name and content are required' });
  }

  // Rough estimation of chunks based on line breaks
  const paragraphCount = content.split('\n').filter((l: string) => l.trim().length > 0).length;
  const chunkCount = Math.max(1, Math.ceil(paragraphCount / 4));

  const newDoc = {
    id: 'doc_' + Date.now(),
    name,
    type: type || 'text/plain',
    size: size || content.length,
    uploadDate: new Date().toISOString(),
    content,
    chunkCount,
  };

  db.documents.push(newDoc);
  writeDB(db);
  res.json({ success: true, document: newDoc });
});

// API: Delete KB document
app.delete('/api/documents/:id', (req, res) => {
  const db = readDB();
  const index = db.documents.findIndex(d => d.id === req.params.id);
  if (index !== -1) {
    const deleted = db.documents.splice(index, 1);
    writeDB(db);
    return res.json({ success: true, deleted: deleted[0] });
  }
  res.status(404).json({ error: 'Document not found' });
});

// API: Get Q&A Rules
app.get('/api/qna', (req, res) => {
  const db = readDB();
  res.json(db.qnaRules || []);
});

// API: Save/Update Q&A Rule
app.post('/api/qna', (req, res) => {
  const db = readDB();
  const rule = req.body;
  
  if (!rule.keyword || !rule.reply) {
    return res.status(400).json({ error: 'Keyword and reply are required' });
  }

  if (!db.qnaRules) {
    db.qnaRules = [];
  }

  const existingIndex = db.qnaRules.findIndex(r => r.id === rule.id);
  if (existingIndex !== -1) {
    db.qnaRules[existingIndex] = {
      ...db.qnaRules[existingIndex],
      ...rule,
      id: rule.id // preserve id
    };
  } else {
    const newRule = {
      id: rule.id || 'qna_' + Date.now(),
      keyword: rule.keyword,
      reply: rule.reply,
      matchType: rule.matchType || 'contains',
      isActive: rule.isActive !== undefined ? rule.isActive : true
    };
    db.qnaRules.push(newRule);
  }

  writeDB(db);
  res.json({ success: true });
});

// API: Delete Q&A Rule
app.delete('/api/qna/:id', (req, res) => {
  const db = readDB();
  if (!db.qnaRules) {
    db.qnaRules = [];
  }
  const index = db.qnaRules.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    const deleted = db.qnaRules.splice(index, 1);
    writeDB(db);
    return res.json({ success: true, deleted: deleted[0] });
  }
  res.status(404).json({ error: 'Q&A Rule not found' });
});

// API: Get Leads list
app.get('/api/leads', (req, res) => {
  const db = readDB();
  res.json(db.leads);
});

// API: Add/Update Lead directly
app.post('/api/leads', (req, res) => {
  const db = readDB();
  const leadData = req.body;
  if (!leadData.name || !leadData.phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const existingIndex = db.leads.findIndex(l => l.phone === leadData.phone || l.id === leadData.id);
  if (existingIndex !== -1) {
    const oldLead = db.leads[existingIndex];
    const newHistory = leadData.chatHistory || [];
    const oldHistory = oldLead.chatHistory || [];
    
    // Check if new history has an assistant message that wasn't in the old one
    if (newHistory.length > oldHistory.length) {
      const lastMsg = newHistory[newHistory.length - 1];
      if (lastMsg && lastMsg.sender === 'assistant') {
        const alreadyExists = oldHistory.some((m: any) => m.id === lastMsg.id);
        if (!alreadyExists) {
          // Send manual chat outwards to actual WhatsApp device
          sendWhatsAppReal(leadData.phone, lastMsg.text, db.config);
        }
      }
    }

    db.leads[existingIndex] = { ...db.leads[existingIndex], ...leadData, lastContact: new Date().toISOString() };
    writeDB(db);
    res.json({ success: true, lead: db.leads[existingIndex] });
  } else {
    const newLead = {
      id: 'l_' + Date.now(),
      name: leadData.name,
      phone: leadData.phone,
      firstContact: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      chatHistory: leadData.chatHistory || [],
      status: leadData.status || 'Baru',
      notes: leadData.notes || '',
    };
    db.leads.push(newLead);
    writeDB(db);
    res.json({ success: true, lead: newLead });
  }
});

// API: Update Lead status
app.post('/api/leads/:id/status', (req, res) => {
  const db = readDB();
  const lead = db.leads.find(l => l.id === req.params.id);
  if (lead) {
    lead.status = req.body.status;
    writeDB(db);
    return res.json({ success: true, lead });
  }
  res.status(404).json({ error: 'Lead not found' });
});

// API: Update Lead notes
app.post('/api/leads/:id/notes', (req, res) => {
  const db = readDB();
  const lead = db.leads.find(l => l.id === req.params.id);
  if (lead) {
    lead.notes = req.body.notes;
    writeDB(db);
    return res.json({ success: true, lead });
  }
  res.status(404).json({ error: 'Lead not found' });
});

// API: Delete Lead
app.delete('/api/leads/:id', (req, res) => {
  const db = readDB();
  const index = db.leads.findIndex(l => l.id === req.params.id);
  if (index !== -1) {
    db.leads.splice(index, 1);
    writeDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Lead not found' });
});

// API: Get app dashboard metrics
app.get('/api/dashboard/stats', async (req, res) => {
  const db = readDB();
  const messageCount = db.leads.reduce((acc, lead) => acc + lead.chatHistory.length, 0);
  const leadsCount = db.leads.filter(l => l.status !== 'Baru').length;
  
  let connectionStatus = db.whatsapp.status;
  let connectedNumber = db.whatsapp.connectedNumber;
  let connectedName = db.whatsapp.deviceName;

  let fonnteStatus = '';
  let fonnteReason = '';
  let fonnteQuota = '';
  let fonntePackage = '';
  let fonnteExpired = '';

  if (db.config.whatsappMode === 'Fonnte' && db.config.whatsappToken) {
    try {
      console.log('[Fonnte Status Check] Checking device status with Fonnte API...');
      const response = await fetch('https://api.fonnte.com/device', {
        method: 'POST',
        headers: {
          'Authorization': db.config.whatsappToken.trim()
        }
      });
      const data = await response.json();
      console.log('[Fonnte Status Response]', data);
      
      if (data) {
        if (data.status === true) {
          fonnteStatus = data.device_status || '';
          fonnteQuota = data.quota || '';
          fonntePackage = data.package || '';
          fonnteExpired = data.expired || '';
          
          if (data.device_status === 'connect') {
            connectionStatus = 'Connected';
            connectedNumber = data.device || db.config.whatsappPhone || '';
            connectedName = data.name || db.config.businessName || 'Fonnte Connected Device';
            
            db.whatsapp.status = 'Connected';
            db.whatsapp.isConnected = true;
            db.whatsapp.connectedNumber = connectedNumber;
            db.whatsapp.deviceName = connectedName;
            writeDB(db);
          } else {
            connectionStatus = 'Disconnected';
            connectedNumber = '';
            connectedName = '';
            db.whatsapp.status = 'Disconnected';
            db.whatsapp.isConnected = false;
            db.whatsapp.connectedNumber = '';
            db.whatsapp.deviceName = '';
            writeDB(db);
          }
        } else {
          connectionStatus = 'Disconnected';
          connectedNumber = '';
          connectedName = '';
          db.whatsapp.status = 'Disconnected';
          db.whatsapp.isConnected = false;
          db.whatsapp.connectedNumber = '';
          db.whatsapp.deviceName = '';
          fonnteReason = data.reason || 'Token tidak valid/tidak ditemukan';
          writeDB(db);
        }
      }
    } catch (err) {
      console.error('[Fonnte Status API Error]', err);
      connectionStatus = 'Disconnected';
      connectedNumber = '';
      connectedName = '';
      db.whatsapp.status = 'Disconnected';
      db.whatsapp.isConnected = false;
      db.whatsapp.connectedNumber = '';
      db.whatsapp.deviceName = '';
      fonnteReason = 'Koneksi API Gagal / Timeout';
      writeDB(db);
    }
  }
  
  res.json({
    totalCustomers: db.leads.length,
    totalConversations: db.leads.length,
    messagesToday: messageCount + 4, // Simulated active count + history
    totalLeads: leadsCount,
    connectionStatus,
    connectedNumber,
    connectedName,
    fonnteStatus,
    fonnteReason,
    fonnteQuota,
    fonntePackage,
    fonnteExpired,
  });
});

// API: Simulate checking operational hours
function isWithinWorkingHours(config: LocalDB['config']): { within: boolean; feedback: string } {
  if (!config.workingHours.enabled) {
    return { within: true, feedback: '' };
  }

  const now = new Date();
  const formattedTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  });

  const [currentHour, currentMinute] = formattedTime.split(':').map(Number);
  const [startHour, startMinute] = config.workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = config.workingHours.end.split(':').map(Number);

  const currentMinutes = currentHour * 60 + currentMinute;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  const liesBetween = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  return {
    within: liesBetween,
    feedback: liesBetween ? '' : config.outOfHoursMessage,
  };
}

// API: WHATSAPP AUTO-REPLY CHAT SIMULATOR (using Gemini & RAG)
app.post('/api/chat/simulate', async (req, res) => {
  const db = readDB();
  const { customerName, customerPhone, messageText } = req.body;

  if (!customerPhone || !messageText) {
    return res.status(400).json({ error: 'customerPhone and messageText are required' });
  }

  // Find or Create Lead
  let lead = db.leads.find(l => l.phone === customerPhone);
  const isNewLead = !lead;

  if (isNewLead) {
    lead = {
      id: 'l_' + Date.now(),
      name: customerName || 'Pelanggan Baru',
      phone: customerPhone,
      firstContact: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      chatHistory: [],
      status: 'Baru',
      notes: 'Terbuat otomatis dari chat masuk simulator.',
    };
    db.leads.push(lead);
  } else {
    lead.lastContact = new Date().toISOString();
    if (customerName && lead.name === 'Pelanggan Baru') {
      lead.name = customerName;
    }
  }

  // Push user message to history
  const customerMsg = {
    id: 'm_' + Date.now() + '_cust',
    sender: 'customer' as const,
    text: messageText,
    timestamp: new Date().toISOString()
  };
  lead.chatHistory.push(customerMsg);

  // Check if auto-reply is active globally
  if (!db.config.autoReplyActive) {
    writeDB(db);
    return res.json({
      success: true,
      lead,
      replyText: '',
      skipped: 'Auto reply is currently turned OFF. Admin must reply manually.'
    });
  }

  // Verify connection status
  if (!db.whatsapp.isConnected) {
    writeDB(db);
    return res.json({
      success: true,
      lead,
      replyText: '',
      skipped: 'WhatsApp is currently disconnected. Connection required to auto-reply.'
    });
  }

  // Check Operational Hours & handle out-of-hours automatic greetings
  const hoursCheck = isWithinWorkingHours(db.config);
  
  // Decide AI prompt & prompt tone instructions
  const toneInstruction = {
    Professional: 'Ketik balasan Anda dengan bahasa Indonesia yang sangat sopan, profesional, jelas, menggunakan kata sapaan resmi (Bapak/Ibu/Anda) tanpa singkatan kasar.',
    Casual: 'Ketik balasan Anda dengan gaya kasual, ramah, bersahabat, menggunakan sapaan hangat seperti Kak, Kakak, atau nama mereka secara santai, dan boleh menggunakan beberapa emoji pendukung.',
    Formal: 'Ketik balasan Anda dengan gaya bahasa formal, tata bahasa baku sesuai kamus bahasa Indonesia, terstruktur, sopan, dan langsung pada sasaran.'
  }[db.config.tone] || 'Gunakan gaya bahasa profesional.';

  // Build RAG prompt
  const kbContext = retrieveContext(messageText, db.documents);
  const chatHistoryContext = lead.chatHistory
    .slice(-6, -1) // Grab last few messages as trailing context excluding the current new message
    .map(msg => `${msg.sender === 'customer' ? 'Pelanggan' : 'Anda (Asisten WAI)'}: ${msg.text}`)
    .join('\n');

  const finalSystemInstruction = `
${db.config.systemPrompt}

GAYA BAHASA & NADA BICARA KORPORAT:
- Nama Bisnis: ${db.config.businessName}
- Deskripsi Bisnis: ${db.config.businessDesc}
- Nada bicara wajib: ${db.config.tone}
- Aturan Nada: ${toneInstruction}

KONTEN PENGETAHUAN PENDUKUNG (RAG):
${kbContext}

RIWAYAT PERCAKAPAN SINGKAT SEBELUMNYA:
${chatHistoryContext}

TUGAS UTAMA:
1. Jalin komunikasi ramah dengan pelanggan yang mengirimkan pesan berikut: "${messageText}"
2. Berikan informasi seakurat mungkin hanya berdasarkan informasi bisnis di atas. Jika tidak ada informasinya di pengetahuan bisnis, jawab dengan ramah bahwa Anda belum mengetahuinya dan tawarkan untuk menghubungkan ke admin manusia.
3. Selalu dorong pelanggan ke arah pembelian atau reservasi dengan ramah.
4. Jawablah langsung sebagai asisten profesional tanpa mencantumkan label "Jawaban:" atau Metadata lainnya.
`;

  let responseText = '';

  // Check manual Q&A keyword match first (highest priority override)
  const matchedRule = findMatchingQnaRule(messageText, db.qnaRules);

  const activeAi = getGeminiClient();

  if (matchedRule) {
    responseText = matchedRule.reply;
  } else if (!hoursCheck.within) {
    // Return out-of-hours reply directly
    responseText = hoursCheck.feedback;
  } else if (!activeAi) {
    // If Gemini key is not configured, generate a high-quality mock response
    const lowercaseMsg = messageText.toLowerCase();
    if (lowercaseMsg.includes('menu') || lowercaseMsg.includes('harga') || lowercaseMsg.includes('makan') || lowercaseMsg.includes('kopi')) {
      responseText = `Halo ${lead.name}! Tentu, berikut menu andalan kami di ${db.config.businessName}:\n1. Kopi Susu Pandan Wangi (Rp 35.000) - Espresso, susu segar & sirup pandan khas.\n2. Latte / Cappuccino (Rp 38.000)\n3. Americano (Rp 30.000)\n4. Roti Bakar Srikaya Butter (Rp 28.000).\n\nApakah ada menu tertentu yang ingin Kakak pesan melalui WhatsApp? Kami siap mencatat pesanan Anda! ☕🥐`;
    } else if (lowercaseMsg.includes('reservasi') || lowercaseMsg.includes('coworking') || lowercaseMsg.includes('sewa') || lowercaseMsg.includes('ruang')) {
      responseText = `Halo ${lead.name}! Untuk reservasi area di ${db.config.businessName}, kami menyediakan:\n- Area umum coworking: Bebas charge minimum (Wi-Fi 100 Mbps & banyak colokan).\n- Ruang Rapat Privat: Kapasitas 8 orang seharga Rp 150.000/jam (dilengkapi papan tulis & proyektor). Sewa diskon 50% jika memesan konsumsi min. Rp 300.000.\n\nMau kami bantu jadwalkan ruang rapat untuk hari apa dan jam berapa, Kak? 😊`;
    } else {
      responseText = `${db.config.welcomeMessage.replace('Halo!', `Halo ${lead.name}!`)}\n\nSaya adalah asisten AI dari ${db.config.businessName}. Ada yang ingin Anda tanyakan seputar menu, reservasi, atau jam buka kafe kami?`;
    }
  } else {
    try {
      // Call Gemini API server-side
      const response = await activeAi.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: messageText,
        config: {
          systemInstruction: finalSystemInstruction,
          temperature: 0.7,
        },
      });

      responseText = response.text || 'Maaf, saya sedang mengalami kendala teknis singkat. Mohon tunggu beberapa saat.';
    } catch (err: any) {
      console.error('Gemini API call failed:', err);
      responseText = `Halo ${lead.name}! Maaf sekali terjadi gangguan pada sistem AI saya (Error: ${err.message || 'API Issues'}).\n\nUntuk kenyamanan, kami kirimkan teks sambutan standar: ${db.config.welcomeMessage}`;
    }
  }

  // Auto Reply logic: AI categorizes lead based on context
  // Let's perform simple heuristic categorization
  const textMatches = messageText.toLowerCase();
  
  if (lead.status === 'Baru') {
    lead.status = 'Prospek'; // Immediately classify as Prospect since they asked a question
  }
  
  if (textMatches.includes('order') || textMatches.includes('pesan') || textMatches.includes('beli') || textMatches.includes('booking') || textMatches.includes('reservasi') || textMatches.includes('bayar')) {
    lead.status = 'Follow Up';
  }
  
  if (textMatches.includes('deal') || textMatches.includes('transfer') || textMatches.includes('sudah bayar') || textMatches.includes('selesai') || textMatches.includes('closing')) {
    lead.status = 'Closing';
  }

  // Push response message to history
  const assistantMsg = {
    id: 'm_' + Date.now() + '_asst',
    sender: 'assistant' as const,
    text: responseText,
    timestamp: new Date().toISOString()
  };
  lead.chatHistory.push(assistantMsg);

  writeDB(db);

  // Send real message out if configured in production Fonnte mode
  if (responseText && db.config.whatsappMode === 'Fonnte') {
    sendWhatsAppReal(customerPhone, responseText, db.config);
  }

  res.json({
    success: true,
    lead,
    replyText: responseText,
  });
});

// API: REAL WHATSAPP WEBHOOK (Fonnte & general standard)
app.post('/api/webhook/whatsapp', async (req, res) => {
  const db = readDB();

  // Fonnte sends POST parameters: sender, message, and name
  const customerPhone = req.body.sender || req.body.phone;
  const messageText = req.body.message || req.body.text;
  const customerName = req.body.name || 'Pelanggan WhatsApp';

  if (!customerPhone || !messageText) {
    console.log('[Webhook Skip] Missing sender/phone or message/text in body:', req.body);
    return res.status(200).json({ success: false, info: 'Missing sender or message content' });
  }

  console.log(`[Webhook Message] From ${customerPhone}: "${messageText}" (Name: ${customerName})`);

  // Normalize phone digits
  let phoneStr = customerPhone.toString().trim();
  if (!phoneStr.startsWith('+') && !phoneStr.startsWith('0') && !phoneStr.startsWith('62')) {
    phoneStr = '+' + phoneStr;
  } else if (phoneStr.startsWith('0')) {
    phoneStr = '+62' + phoneStr.slice(1);
  } else if (phoneStr.startsWith('62')) {
    phoneStr = '+' + phoneStr;
  }

  // Find or Create Lead
  let lead = db.leads.find(l => {
    const cleanL = l.phone.replace(/\D/g, '');
    const cleanIn = phoneStr.replace(/\D/g, '');
    return cleanL === cleanIn || cleanL.endsWith(cleanIn) || cleanIn.endsWith(cleanL);
  });

  const isNewLead = !lead;

  if (isNewLead) {
    lead = {
      id: 'l_' + Date.now(),
      name: customerName,
      phone: phoneStr,
      firstContact: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      chatHistory: [],
      status: 'Baru',
      notes: 'Terbuat otomatis via Webhook WhatsApp asli.',
    };
    db.leads.push(lead);
  } else {
    lead.lastContact = new Date().toISOString();
    if (lead.name === 'Pelanggan Baru' && customerName && customerName !== 'Pelanggan WhatsApp') {
      lead.name = customerName;
    }
  }

  // Push customer message to history
  const customerMsg = {
    id: 'm_' + Date.now() + '_cust',
    sender: 'customer' as const,
    text: messageText,
    timestamp: new Date().toISOString()
  };
  lead.chatHistory.push(customerMsg);

  // If auto-reply is currently disabled, save chat and exit
  if (!db.config.autoReplyActive) {
    writeDB(db);
    return res.json({ success: true, info: 'Auto reply is turned off.' });
  }

  // Check working hours
  const hoursCheck = isWithinWorkingHours(db.config);
  
  // Choose model tone instruction
  const toneInstruction = {
    Professional: 'Ketik balasan Anda dengan bahasa Indonesia yang sangat sopan, profesional, jelas, menggunakan kata sapaan resmi (Bapak/Ibu/Anda) tanpa singkatan kasar.',
    Casual: 'Ketik balasan Anda dengan gaya kasual, ramah, bersahabat, menggunakan sapaan hangat seperti Kak, Kakak, atau nama mereka secara santai, dan boleh menggunakan beberapa emoji pendukung.',
    Formal: 'Ketik balasan Anda dengan gaya bahasa formal, tata bahasa baku sesuai kamus bahasa Indonesia, terstruktur, sopan, dan langsung pada sasaran.'
  }[db.config.tone] || 'Gunakan gaya bahasa profesional.';

  // Retrieve RAG context
  const kbContext = retrieveContext(messageText, db.documents);
  const chatHistoryContext = lead.chatHistory
    .slice(-6, -1)
    .map(msg => `${msg.sender === 'customer' ? 'Pelanggan' : 'Anda (Asisten WAI)'}: ${msg.text}`)
    .join('\n');

  const finalSystemInstruction = `
${db.config.systemPrompt}

GAYA BAHASA & NADA BICARA KORPORAT:
- Nama Bisnis: ${db.config.businessName}
- Deskripsi Bisnis: ${db.config.businessDesc}
- Nada bicara wajib: ${db.config.tone}
- Aturan Nada: ${toneInstruction}

KONTEN PENGETAHUAN PENDUKUNG (RAG):
${kbContext}

RIWAYAT PERCAKAPAN SINGKAT SEBELUMNYA:
${chatHistoryContext}

TUGAS UTAMA:
1. Jalin komunikasi ramah dengan pelanggan yang mengirimkan pesan berikut: "${messageText}"
2. Berikan informasi seakurat mungkin hanya berdasarkan informasi bisnis di atas. Jika tidak ada informasinya di pengetahuan bisnis, jawab dengan ramah bahwa Anda belum mengetahuinya dan tawarkan untuk menghubungkan ke admin manusia.
3. Selalu dorong pelanggan ke arah pembelian atau reservasi dengan ramah.
4. Jawablah langsung sebagai asisten profesional tanpa mencantumkan label "Jawaban:" atau Metadata lainnya.
`;

  let responseText = '';

  // Check manual Q&A keyword match first (highest priority override)
  const matchedRule = findMatchingQnaRule(messageText, db.qnaRules);

  const activeAi = getGeminiClient();

  if (matchedRule) {
    responseText = matchedRule.reply;
  } else if (!hoursCheck.within) {
    responseText = hoursCheck.feedback;
  } else if (!activeAi) {
    // Basic AI fallback
    const lowercaseMsg = messageText.toLowerCase();
    if (lowercaseMsg.includes('menu') || lowercaseMsg.includes('harga') || lowercaseMsg.includes('makan') || lowercaseMsg.includes('kopi')) {
      responseText = `Halo ${lead.name}! Menu andalan kami di ${db.config.businessName} adalah:\n1. Kopi Susu Pandan Wangi (Rp 35.000)\n2. Cafe Latte / Cappuccino (Rp 38.000)\n\nAda yang ingin Kakak pesan hari ini? 😊`;
    } else {
      responseText = `${db.config.welcomeMessage.replace('Halo!', `Halo ${lead.name}!`)}`;
    }
  } else {
    try {
      const response = await activeAi.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: messageText,
        config: {
          systemInstruction: finalSystemInstruction,
          temperature: 0.7,
        },
      });
      responseText = response.text || '';
    } catch (err: any) {
      console.error('Gemini API call failed during webhook processing:', err);
      responseText = `Halo ${lead.name}! Terima kasih atas pesan Anda. Kami akan segera merespons.`;
    }
  }

  // Push reply message to history
  if (responseText) {
    const assistantMsg = {
      id: 'm_' + Date.now() + '_asst',
      sender: 'assistant' as const,
      text: responseText,
      timestamp: new Date().toISOString()
    };
    lead.chatHistory.push(assistantMsg);

    // Heuristics for status update
    const textMatches = messageText.toLowerCase();
    if (lead.status === 'Baru') lead.status = 'Prospek';
    if (textMatches.includes('order') || textMatches.includes('pesan') || textMatches.includes('booking') || textMatches.includes('reservasi')) {
      lead.status = 'Follow Up';
    }
    if (textMatches.includes('sudah bayar') || textMatches.includes('transfer') || textMatches.includes('closing')) {
      lead.status = 'Closing';
    }

    writeDB(db);

    // Send real response outwards to Fonnte
    await sendWhatsAppReal(phoneStr, responseText, db.config);
  }

  res.json({ success: true, replyText: responseText });
});

// Serve Vite files or static build depending on production env
if (process.env.NODE_ENV !== 'production') {
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Fallback everything else to SPA HTML via Vite
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.listen(PORT, '0.0.0.0', async () => {
      console.log(`Development custom fullstack server active on port ${PORT}`);
      try {
        await syncFromSupabase();
      } catch (err) {
        console.error('Failed to sync from Supabase at startup:', err);
      }
    });
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Production custom fullstack server active on port ${PORT}`);
    try {
      await syncFromSupabase();
    } catch (err) {
      console.error('Failed to sync from Supabase at startup:', err);
    }
  });
}
