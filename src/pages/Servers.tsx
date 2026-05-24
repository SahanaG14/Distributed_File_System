import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Server, 
  Activity, 
  Cpu, 
  HardDrive, 
  Globe, 
  ShieldCheck,
  RefreshCw,
  MoreVertical,
  Database,
  Plus,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';

export default function ServersPage() {
  const { servers, updateServerStatus, files, folders, addServer } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newServer, setNewServer] = useState({
    name: '',
    ip: '',
    storage: '50'
  });

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    await addServer({
      server_name: newServer.name,
      ip_address: newServer.ip,
      total_storage: newServer.storage + ' TB',
      used_storage: '0 TB',
      server_status: 'Online'
    });
    setIsModalOpen(false);
    setNewServer({ name: '', ip: '', storage: '50' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Offline': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'Maintenance': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Server Management</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Monitor and manage storage server infrastructure.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all text-sky-400">
          <RefreshCw className="w-4 h-4" />
          Synchronize All
        </button>
      </header>

      <div className="glass-card border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Server ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Server Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">IP Address</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Storage (Used/Total)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Mapped Entities</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {servers.map((server, i) => {
                const serverFiles = files.filter(f => f.serverId === server.server_id);
                const serverFolders = folders.filter(f => f.serverId === server.server_id);
                const entityCount = serverFiles.length + serverFolders.length;

                return (
                  <motion.tr 
                    key={server.server_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono text-gray-400 group-hover:text-sky-400 transition-colors uppercase font-bold tracking-wider">{server.server_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                          <Server className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-tight">{server.server_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono text-gray-500">{server.ip_address}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-white">{server.used_storage}</span>
                          <span className="text-gray-600">/ {server.total_storage}</span>
                        </div>
                        <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(parseFloat(server.used_storage) || 0) / (parseFloat(server.total_storage) || 1) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Globe className="w-3 h-3 text-amber-500" />
                          </div>
                          <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                            <Activity className="w-3 h-3 text-sky-500" />
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{entityCount} Assets</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${getStatusColor(server.server_status)}`}>
                        {server.server_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => updateServerStatus(server.server_id, 'Online')}
                          title="Online"
                          className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-gray-600 hover:text-emerald-400 transition-all border border-transparent hover:border-emerald-500/20"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => updateServerStatus(server.server_id, 'Maintenance')}
                          title="Maintenance"
                          className="p-1.5 hover:bg-amber-500/10 rounded-lg text-gray-600 hover:text-amber-400 transition-all border border-transparent hover:border-amber-500/20"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => updateServerStatus(server.server_id, 'Offline')}
                          title="Shutdown"
                          className="p-1.5 hover:bg-rose-500/10 rounded-lg text-gray-600 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              
              <tr onClick={() => setIsModalOpen(true)} className="group cursor-pointer hover:bg-sky-500/5 transition-all">
                <td colSpan={7} className="px-6 py-8 text-center border-t border-dashed border-white/10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-500/20 transition-all">
                      <Plus className="w-5 h-5 text-gray-500 group-hover:text-sky-400" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 group-hover:text-sky-400 uppercase tracking-widest transition-colors">Provision New Node</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card border border-white/10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Provision New Node</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleAddServer} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Node identifier</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Storage Node Delta"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-sky-500/50 outline-none transition-all placeholder:text-gray-700 text-sm text-white"
                    value={newServer.name}
                    onChange={e => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Network Address (IP)</label>
                  <input 
                    required
                    type="text" 
                    placeholder="192.168.1.XX"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-sky-500/50 outline-none transition-all placeholder:text-gray-700 text-sm font-mono text-white"
                    value={newServer.ip}
                    onChange={e => setNewServer(prev => ({ ...prev, ip: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Storage Capacity (TB)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="10" 
                      max="500" 
                      step="10"
                      className="flex-1 accent-sky-500"
                      value={newServer.storage}
                      onChange={e => setNewServer(prev => ({ ...prev, storage: e.target.value }))}
                    />
                    <span className="text-xs font-mono text-white w-12 text-right">{newServer.storage}TB</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 mt-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                >
                  Confirm Provisioning
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
