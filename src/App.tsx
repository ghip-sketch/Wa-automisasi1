import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import WhatsAppView from './components/WhatsAppView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import LeadsView from './components/LeadsView';
import ConversationsView from './components/ConversationsView';
import SettingsView from './components/SettingsView';
import ProfileView from './components/ProfileView';
import AuthView from './components/AuthView';
import { Lead, KBDocument, AppConfig, DashboardStats } from './types';
import { Sparkles, Menu, X, Bot } from 'lucide-react';
import { dataService } from './lib/dataService';

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('wai_user_email') || null;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core App states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch all backend state concurrently Use unified dataService
  const fetchAllState = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const { config: configData, whatsapp } = await dataService.getConfig();
      const leadsData = await dataService.getLeads();
      const docsData = await dataService.getDocuments();
      const statsData = await dataService.getStats(leadsData, configData);

      setLeads(leadsData);
      setDocuments(docsData);
      setConfig(configData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed fetching core backend state via dataService', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllState();
  }, [userEmail]);

  // Handle successful login
  const handleLoginSuccess = (email: string) => {
    localStorage.setItem('wai_user_email', email);
    setUserEmail(email);
    setActiveTab('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('wai_user_email');
    setUserEmail(null);
  };

  if (!userEmail) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // Loading indicator for start transition
  if (loading && !config) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center animate-bounce shadow-lg shadow-emerald-500/20">
          <Bot size={24} />
        </div>
        <p className="text-xs font-bold text-slate-500 mt-4 tracking-wide animate-pulse uppercase">Inisialisasi Autopilot WA Assistant...</p>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 h-screen overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSidebarOpen(false);
          }} 
          onLogout={handleLogout}
          userEmail={userEmail}
        />
      </div>

      {/* Mobile Sidebar drawers */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex flex-col w-64 bg-[#0a192f] h-full animate-slide-in">
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setSidebarOpen(false);
              }} 
              onLogout={handleLogout}
              userEmail={userEmail}
            />
          </div>
        </div>
      )}

      {/* Primary content area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top bar header */}
        <header className="bg-white border-b border-slate-100 flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center space-x-3 lg:space-x-0">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 lg:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                {activeTab === 'dashboard' && 'Dashboard Analitik'}
                {activeTab === 'whatsapp' && 'Gatway WhatsApp'}
                {activeTab === 'knowledge-base' && 'Data Pangkalan RAG'}
                {activeTab === 'leads' && 'Pipeline Leads CRM'}
                {activeTab === 'conversations' && 'Simulator WhatsApp Sandbox'}
                {activeTab === 'settings' && 'Pengaturan Model & Jam Kerja'}
                {activeTab === 'profile' && 'Lisensi Akun'}
              </h1>
              <p className="text-[10.5px] text-slate-400 font-semibold tracking-wide mt-0.5">WAI Assistant Panel</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick stats label */}
            {stats && (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100">
                <span className={`w-2 h-2 rounded-full ${stats.connectionStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="text-[10px] font-bold text-slate-500 font-mono tracking-tight uppercase">
                  WA: {stats.connectionStatus === 'Connected' ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            )}
            
            <div className="text-[10.5px] text-slate-500 font-bold bg-slate-100 border border-slate-200/50 rounded-xl px-3.5 py-1.5 flex items-center space-x-1">
              <Sparkles size={11} className="text-emerald-500" />
              <span>ID: {userEmail ? userEmail.split('@')[0] : 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic viewport renderer scroll body */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
          {activeTab === 'dashboard' && stats && (
            <DashboardView 
              leads={leads} 
              stats={stats} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'whatsapp' && stats && (
            <WhatsAppView 
              stats={stats} 
              fetchStats={fetchAllState}
              config={config}
            />
          )}

          {activeTab === 'knowledge-base' && (
            <KnowledgeBaseView 
              documents={documents} 
              fetchDocuments={fetchAllState}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView 
              leads={leads} 
              fetchLeads={fetchAllState}
            />
          )}

          {activeTab === 'conversations' && config && (
            <ConversationsView 
              leads={leads} 
              config={config} 
              fetchLeads={fetchAllState}
              fetchStats={fetchAllState}
            />
          )}

          {activeTab === 'settings' && config && (
            <SettingsView 
              config={config} 
              fetchConfig={fetchAllState}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView userEmail={userEmail} />
          )}
        </main>
      </div>
    </div>
  );
}
