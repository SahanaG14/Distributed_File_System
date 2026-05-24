import React from 'react';
import { motion } from 'motion/react';
import { 
  Files, 
  Database,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
  Download,
  AlertCircle,
  FileSearch,
  User
} from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Dashboard() {
  const { stats, logs, generateAuditReport } = useData();

  const StatCard = ({ icon: Icon, label, value, subtext, color, delay, percentage }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6 border border-white/5 group hover:border-white/20 transition-all relative overflow-hidden"
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
          <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
          <p className="text-xs text-gray-400 font-medium">{subtext}</p>
        </div>
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 border border-white/5`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      
      {percentage !== undefined && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase">
            <span className="text-gray-500">Utilization</span>
            <span className={color.replace('bg-', 'text-')}>{percentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, delay: delay + 0.3 }}
              className={`h-full ${color}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">System Dashboard</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Overview of the storage network and system activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generateAuditReport}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
            Generate Report
          </button>
        </div>
      </header>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={Files} 
          label="Managed Registry" 
          value={stats.totalFiles} 
          subtext="Active Logical Entities"
          color="bg-sky-500" 
          delay={0}
        />
        <StatCard 
          icon={Database} 
          label="Storage Allocation" 
          value={stats.storageUsed} 
          subtext={`of ${stats.storageCapacity} capacity`}
          color="bg-indigo-500" 
          delay={0.1}
          percentage={Math.round((stats.storageUsedBytes / stats.storageCapacityBytes) * 100)}
        />
      </div>

      <div className="w-full">
        {/* Audit Logs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card border border-white/5 relative overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <FileSearch className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-tight italic">Audit System Logs</h3>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Real-time Transaction History</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Flow</span>
            </div>
          </div>
          
          <div className="overflow-x-auto min-h-[400px]">
             <table className="w-full text-left">
               <thead className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/5">
                 <tr>
                   <th className="px-6 py-4">Timestamp</th>
                   <th className="px-6 py-4">Action Protocol</th>
                   <th className="px-6 py-4">Entity Target</th>
                   <th className="px-6 py-4">Result</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {logs.map((log, idx) => (
                   <motion.tr 
                     key={log.id}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ delay: 0.4 + (idx * 0.05) }}
                     className="hover:bg-white/[0.02] transition-colors group"
                   >
                     <td className="px-6 py-4">
                       <span className="text-xs font-mono text-gray-500">{log.timestamp}</span>
                     </td>
                     <td className="px-6 py-4">
                       <span className="text-xs font-bold text-white uppercase tracking-tighter">{log.action}</span>
                     </td>
                     <td className="px-6 py-4">
                       <span className="text-xs text-gray-400 font-medium italic">{log.target}</span>
                     </td>
                     <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          log.status === 'success' ? 'text-emerald-400 bg-emerald-400/10' :
                          log.status === 'warning' ? 'text-amber-400 bg-amber-400/10' :
                          'text-sky-400 bg-sky-400/10'
                        }`}>
                          {log.status === 'success' && <ShieldCheck className="w-3 h-3" />}
                          {log.status === 'warning' && <AlertCircle className="w-3 h-3" />}
                          {log.status === 'info' && <Zap className="w-3 h-3" />}
                          {log.status}
                        </div>
                     </td>
                   </motion.tr>
                 ))}
               </tbody>
             </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
