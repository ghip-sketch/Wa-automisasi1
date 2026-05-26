export interface Message {
  id: string;
  sender: 'customer' | 'assistant';
  text: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  firstContact: string;
  lastContact: string;
  chatHistory: Message[];
  status: 'Baru' | 'Prospek' | 'Follow Up' | 'Closing';
  notes: string;
}

export interface KBDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  chunkCount: number;
}

export interface QnARule {
  id: string;
  keyword: string;
  reply: string;
  matchType: 'exact' | 'contains';
  isActive: boolean;
}

export interface AppConfig {
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
  // Supabase Settings (for real integration fallback)
  supabaseUrl: string;
  supabaseAnonKey: string;
  // Production WhatsApp Gateway Integration (e.g. Fonnte)
  whatsappMode?: 'Simulator' | 'Fonnte';
  whatsappToken?: string;
  whatsappPhone?: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalConversations: number;
  messagesToday: number;
  totalLeads: number;
  connectionStatus: 'Connected' | 'Disconnected' | 'Connecting';
  connectedNumber: string;
  connectedName: string;
  fonnteStatus?: string;
  fonnteReason?: string;
  fonnteQuota?: string;
  fonntePackage?: string;
  fonnteExpired?: string;
}
