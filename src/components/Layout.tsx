import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Files, 
  UploadCloud, 
  LogOut, 
  Menu, 
  X,
  Search,
  User,
  Database,
  Terminal,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', subLabel: 'Overview' },
  { path: '/files', icon: Files, label: 'File Manager', subLabel: 'Storage' },
  { path: '/upload', icon: UploadCloud, label: 'Upload Files', subLabel: 'Transfer' },
  { path: '/servers', icon: Server, label: 'Servers', subLabel: 'Node Monitor' },
];

export default function Layout() {
  const { stats, currentUser, setCurrentUser } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative glass-card w-full max-w-md overflow-hidden border border-white/20 shadow-2xl p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center border-4 border-white/10 shadow-2xl mb-6">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Admin</h2>
                <p className="text-sky-400 font-medium mb-6">sahanasrikanta14@gmail.com</p>
                
                <div className="w-full space-y-4 text-left">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Storage Status</p>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-white font-bold text-sm italic">{((stats.storageUsedBytes / stats.storageCapacityBytes) * 100).toFixed(2)}% Allocated</span>
                       <span className="text-gray-400 text-xs">{stats.storageUsed} / {stats.storageCapacity}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)] transition-all duration-1000" 
                        style={{ width: `${(stats.storageUsedBytes / stats.storageCapacityBytes) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Authentication</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono text-xs">••••••••••••</span>
                      <button className="text-[10px] text-sky-400 font-bold uppercase hover:text-sky-300 transition-colors">Change Access Key</button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 w-full flex flex-col gap-3">
                  <button 
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full py-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                  >
                    Done
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 glass border-r border-white/10 transition-transform duration-500 ease-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full bg-black/20">
          {/* Logo */}
          <div className="p-8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500 shadow-xl shadow-sky-500/20 flex items-center justify-center">
              <Database className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">
              DFS<span className="text-sky-500">Storage</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                   className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group tracking-tight ${
                    isActive 
                      ? 'bg-sky-500 text-white shadow-[0_10px_20px_rgba(14,165,233,0.15)] border border-sky-400/20 scale-[1.02]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-sky-500/60'}`} />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm uppercase leading-tight">{item.label}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-white/60' : 'text-gray-600'}`}>{item.subLabel}</span>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabDot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Logout - RELOCATED TO BOTTOM */}
          <div className="p-4 border-t border-white/5 space-y-1 bg-black/40">
             <div className="px-4 py-3 mb-2">
               <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Current User</p>
               <p className="text-xs text-gray-400 font-medium truncate italic">{currentUser?.username || 'admin_storage_01'}</p>
             </div>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-sky-500/50 transition-colors">
                <User className="w-4 h-4 text-sky-400" />
              </div>
              <span className="font-black text-xs uppercase tracking-wider">My Profile</span>
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all group"
            >
               <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-rose-500/50 transition-colors">
                <LogOut className="w-4 h-4 text-rose-500" />
              </div>
              <span className="font-black text-xs uppercase tracking-wider">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 glass z-10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-xl lg:hidden text-sky-400"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-sky-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search files and nodes..." 
                className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus:border-sky-500/50 outline-none transition-all placeholder:text-gray-600 text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-10 w-px bg-white/10 mx-2" />
            
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 hover:bg-white/5 p-1.5 px-3 rounded-2xl transition-all border border-transparent hover:border-white/10 group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-white uppercase tracking-tighter">Admin</p>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Active Status</p>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-indigo-700 flex items-center justify-center border-2 border-white/20 shadow-xl group-hover:scale-105 transition-transform relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <User className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
