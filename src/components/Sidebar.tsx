import { 
  LayoutDashboard, 
  QrCode, 
  Database, 
  Users, 
  MessageSquare, 
  Settings, 
  User, 
  LogOut, 
  Bot 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  userEmail: string;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, userEmail }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'whatsapp', label: 'Koneksi WhatsApp', icon: QrCode },
    { id: 'knowledge-base', label: 'Knowledge Base', icon: Database },
    { id: 'leads', label: 'Lead Management', icon: Users },
    { id: 'conversations', label: 'Simulator Chat', icon: MessageSquare },
    { id: 'settings', label: 'Pengaturan Ast', icon: Settings },
    { id: 'profile', label: 'Profil Saya', icon: User },
  ];

  return (
    <aside className="w-64 bg-[#0a192f] text-slate-300 flex flex-col h-screen border-r border-slate-800">
      {/* App Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-emerald-500 text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Bot size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">WAI Assistant</h1>
          <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase font-mono">WhatsApp AI Partner</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-500/5 to-transparent'
                  : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout Button */}
      <div className="p-4 border-t border-slate-800 bg-[#071120]/50">
        <div className="flex items-center space-x-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400">
            {userEmail ? userEmail[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userEmail || 'User Business'}</p>
            <p className="text-[10px] text-slate-500 truncate">Free Tier Account</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full mt-3 flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800/30 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 rounded-xl text-xs font-semibold transition-colors duration-200 border border-slate-800/50"
        >
          <LogOut size={14} />
          <span>Keluar Aplikasi</span>
        </button>
      </div>
    </aside>
  );
}
