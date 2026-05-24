import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  FolderIcon, 
  FileIcon, 
  MoreVertical, 
  Download, 
  Trash2, 
  Eye, 
  Edit2, 
  FolderPlus,
  ArrowUpDown,
  History,
  FolderInput,
  FolderClosed,
  X as CloseIcon,
  Database,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { FileEntry, Folder } from '../types';

export default function FilesPage() {
  const { 
    files, folders, deletedFiles, deletedFolders, deleteFile, renameFile, 
    createFolder, deleteFolder, renameFolder, moveToFileFolder, restoreFile, restoreFolder
  } = useData();

  const formatFileSize = (bytes: number) => {

  if (!bytes || bytes === 0) return '0 B';

  const k = 1024;

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];

};

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewRecycleBin, setViewRecycleBin] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingEntity, setRenamingEntity] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [newName, setNewName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [moveFileTarget, setMoveFileTarget] = useState<FileEntry | null>(null);
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkMove, setShowBulkMove] = useState(false);

  const currentFolder = folders.find(f => f.id === currentFolderId);
  const getFileLocation = (file: FileEntry) => {
    if (!file.folderId) return 'Registry';
    return folders.find(f => f.id === file.folderId)?.name || 'Registry';
  };

  const filteredFolders = useMemo(() => {
    if (viewRecycleBin) return deletedFolders;
    // Folders are only shown in root or if we want to show nested folders (but here folders are flat)
    // If we are in root, show all folders. If we are inside a folder, usually we don't show other folders unless nested.
    // For now, let's show folders only in root.
    if (currentFolderId) return [];
    
    let result = [...folders];
    if (search) {
      result = result.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    }
    return result;
  }, [folders, deletedFolders, viewRecycleBin, currentFolderId, search]);

  const filteredEntities = useMemo(() => {
    if (viewRecycleBin) return deletedFiles;

    let result = currentFolderId ? files.filter(f => f.folderId === currentFolderId) : files;
    
    if (filter !== 'All') {
      result = result.filter(f => f.type === filter);
    }

    if (search) {
      result = result.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || 
        (f.folderId && folders.find(fol => fol.id === f.folderId)?.name.toLowerCase().includes(search.toLowerCase())));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      if (sortBy === 'date') comparison = a.date.localeCompare(b.date);
      if (sortBy === 'size') comparison = a.sizeBytes - b.sizeBytes;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, folders, deletedFiles, viewRecycleBin, currentFolderId, search, filter, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'date' | 'size') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleEntityRename = () => {
    if (renamingEntity && newName.trim()) {
      if (renamingEntity.type === 'file') {
        renameFile(renamingEntity.id, newName.trim());
      } else {
        renameFolder(renamingEntity.id, newName.trim());
      }
      setRenamingEntity(null);
      setNewName('');
    }
  };

  const handleDownload = (file: FileEntry) => {
    const link = document.createElement('a');
    if (file.url) {
      link.href = file.url;
    } else {
      const blob = new Blob([`DFS Registry Content: ${file.name}\nSize: ${file.size}\nDate: ${file.date}`], { type: 'text/plain' });
      link.href = URL.createObjectURL(blob);
    }
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveMenuId(null);
  };

  const handleFolderDownload = (folder: Folder) => {
    const folderFiles = files.filter(f => f.folderId === folder.id);
    const content = `DFS Recursive Archive: ${folder.name}\n\nContents:\n` + 
      folderFiles.map(f => `- ${f.name} (${f.size})`).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${folder.name}_backup_archive.txt`;
    link.click();
    setActiveMenuId(null);
  };

  const types = ['All', ...new Set(files.map(f => f.type))];

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEntities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEntities.map(f => f.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkMove = (folderId: string | null) => {
    selectedIds.forEach(id => moveToFileFolder(id, folderId));
    setSelectedIds([]);
    setShowBulkMove(false);
  };

  return (
    <div className="space-y-6" onClick={() => setActiveMenuId(null)}>
      {/* Modals ... (Rename, New Folder, Move) */}
      <AnimatePresence>
        {renamingEntity && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRenamingEntity(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass-card w-full max-w-sm p-6 border border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-white uppercase italic mb-4">Rename Resource</h3>
              <input 
                type="text" autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-sky-500/50 outline-none text-white font-medium"
                onKeyDown={e => e.key === 'Enter' && handleEntityRename()}
              />
              <div className="flex gap-3 mt-6">
                <button onClick={() => setRenamingEntity(null)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 font-black uppercase text-[10px] text-gray-400">Cancel</button>
                <button onClick={handleEntityRename} className="flex-1 py-3 rounded-xl bg-sky-600 font-black uppercase text-[10px] text-white">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}

        {showNewFolderModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewFolderModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass-card w-full max-w-sm p-6 border border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-white uppercase italic mb-4">Initialise Folder</h3>
              <input 
                type="text" autoFocus placeholder="Folder Virtual Path..." value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-sky-500/50 outline-none text-white font-medium"
                onKeyDown={e => e.key === 'Enter' && (createFolder(newName), setShowNewFolderModal(false), setNewName(''))}
              />
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowNewFolderModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 font-black uppercase text-[10px] text-gray-400">Cancel</button>
                <button onClick={() => { createFolder(newName); setShowNewFolderModal(false); setNewName(''); }} className="flex-1 py-3 rounded-xl bg-sky-600 font-black uppercase text-[10px] text-white">Initialise</button>
              </div>
            </motion.div>
          </div>
        )}

        {moveFileTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMoveFileTarget(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass-card w-full max-w-md p-6 border border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-white uppercase italic mb-4">Relocate Entity</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Target: {moveFileTarget.name}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                <button onClick={() => { moveToFileFolder(moveFileTarget.id, null); setMoveFileTarget(null); }} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-left flex items-center gap-3 group transition-all">
                  <Database className="w-5 h-5 text-sky-400" />
                  <span className="font-bold text-white">Main Registry</span>
                </button>
                {folders.map(f => (
                  <button key={f.id} onClick={() => { moveToFileFolder(moveFileTarget.id, f.id); setMoveFileTarget(null); }} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-left flex items-center gap-3 group transition-all">
                    <FolderClosed className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-white">{f.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showBulkMove && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBulkMove(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass-card w-full max-w-md p-6 border border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-white uppercase italic mb-4">Relocate {selectedIds.length} Entities</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                <button onClick={() => handleBulkMove(null)} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-left flex items-center gap-3 group transition-all">
                  <Database className="w-5 h-5 text-sky-400" />
                  <span className="font-bold text-white">Main Registry</span>
                </button>
                {folders.map(f => (
                  <button key={f.id} onClick={() => handleBulkMove(f.id)} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-left flex items-center gap-3 group transition-all">
                    <FolderClosed className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-white">{f.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {previewFile && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewFile(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass-card w-full max-w-2xl overflow-hidden border border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                 <div className="flex items-center gap-3">
                    <FileIcon className="w-5 h-5 text-sky-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Entity Preview: {previewFile.name}</h3>
                 </div>
                 <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                    <CloseIcon className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="p-8 flex flex-col items-center">
                 {previewFile.url ? (
                   <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40 mb-8">
                     <img src={previewFile.url} alt="preview" className="w-full h-full object-contain" />
                   </div>
                 ) : (
                   <div className="w-full h-64 rounded-xl border border-white/5 bg-black/20 flex flex-col items-center justify-center mb-8">
                     <Database className="w-16 h-16 text-white/5 mb-4" />
                     <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">Binary Payload Encrypted</p>
                   </div>
                 )}
                 
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                    {[
                      { label: "Type", value: previewFile.type },
                      { label: "Size", value: previewFile.size },
                      { label: "Date", value: previewFile.date },
                      { label: "Status", value: previewFile.status },
                    ].map((info, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                        <p className="text-[9px] text-gray-500 uppercase font-black mb-1">{info.label}</p>
                        <p className="text-xs text-white font-bold">{info.value}</p>
                      </div>
                    ))}
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">
            {viewRecycleBin ? 'Recycle Bin' : currentFolder ? currentFolder.name : 'Registry Hub'}
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">
            {viewRecycleBin ? 'Manage deleted entities and restore resources.' : 'Manage distributed logical entities across the cluster.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setViewRecycleBin(!viewRecycleBin)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 text-xs font-black uppercase tracking-widest transition-all ${viewRecycleBin ? 'text-amber-400 bg-amber-400/10' : 'text-gray-400 hover:text-white'}`}
          >
            <Trash2 className="w-4 h-4" />
            {viewRecycleBin ? 'Exit Recycle Bin' : 'Recycle Bin'}
          </button>
          {!viewRecycleBin && (
            <button 
              onClick={() => setShowNewFolderModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all text-amber-400"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
          )}
        </div>
      </header>

      {currentFolderId && !viewRecycleBin && (
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <button onClick={() => setCurrentFolderId(null)} className="text-sky-400 hover:underline">Root</button>
          <ChevronRight className="w-3 h-3 text-gray-600" />
          <span className="text-gray-400">{currentFolder?.name}</span>
        </div>
      )}

      {/* Folders Section */}
      {filteredFolders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFolders.map(folder => (
            <motion.div 
              key={folder.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              onClick={() => !viewRecycleBin && setCurrentFolderId(folder.id)}
              className={`glass-card p-4 border border-white/5 group hover:border-white/20 transition-all relative ${viewRecycleBin ? '' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20 mb-4 group-hover:scale-110 transition-transform ${viewRecycleBin ? 'grayscale opacity-50' : ''}`}>
                  <FolderIcon className="w-6 h-6 text-amber-400" />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === folder.id ? null : folder.id); }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-white truncate">{folder.name}</h3>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                {viewRecycleBin ? 'DELETED' : `${files.filter(f => f.folderId === folder.id).length} ENTITIES`} • {folder.date}
              </p>
              
              <AnimatePresence>
                {activeMenuId === folder.id && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-4 top-12 z-50 glass-card border border-white/10 shadow-2xl py-1 overflow-hidden" onClick={e => e.stopPropagation()}>
                    {viewRecycleBin ? (
                      <>
                        <button onClick={() => { restoreFolder(folder.id); setActiveMenuId(null); }} className="w-full px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/5 text-left flex items-center gap-2 uppercase italic"><Plus className="w-3.5 h-3.5" /> Restore</button>
                        <button onClick={() => { deleteFolder(folder.id, true); setActiveMenuId(null); }} className="w-full px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/5 text-left flex items-center gap-2 uppercase italic"><Trash2 className="w-3.5 h-3.5" /> Delete Permanently</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { handleFolderDownload(folder); }} className="w-full px-4 py-2 text-xs font-bold text-gray-400 hover:text-sky-400 hover:bg-white/5 text-left flex items-center gap-2 uppercase">
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                        <button onClick={() => { setRenamingEntity({ id: folder.id, name: folder.name, type: 'folder' }); setNewName(folder.name); setActiveMenuId(null); }} className="w-full px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 text-left flex items-center gap-2 uppercase">
                          <Edit2 className="w-3.5 h-3.5" /> Rename
                        </button>
                        <button onClick={() => { deleteFolder(folder.id); setActiveMenuId(null); }} className="w-full px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/5 text-left flex items-center gap-2 uppercase">
                          <Trash2 className="w-3.5 h-3.5" /> Recycle
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Control Bar */}
      <div className="glass-card p-4 border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-sky-500 transition-colors" />
          <input 
            type="text" placeholder="Search registry..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-sky-500/50 outline-none text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto scrollbar-hide">
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 pr-4 border-r border-white/10"
              >
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">{selectedIds.length} Selected</span>
                <button 
                  onClick={() => setShowBulkMove(true)}
                  className="p-2 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all border border-sky-500/20"
                >
                  <FolderInput className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { selectedIds.forEach(id => deleteFile(id)); setSelectedIds([]); }}
                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all border border-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filter === t ? 'bg-sky-500 border-sky-400 text-white shadow-lg' : 'border-white/5 text-gray-500 hover:text-white hover:bg-white/5'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Files List */}
      <div className="glass-card border border-white/5 overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredEntities.length && filteredEntities.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-sky-500 focus:ring-sky-500/50 transition-all"
                  />
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-2">Name {sortBy === 'name' && <ArrowUpDown className="w-3 h-3" />}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => setFilter(filter === 'All' ? 'Database' : 'All')}>Type</th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('size')}>
                  <div className="flex items-center gap-2">Size {sortBy === 'size' && <ArrowUpDown className="w-3 h-3" />}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-2">Date {sortBy === 'date' && <ArrowUpDown className="w-3 h-3" />}</div>
                </th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEntities.map((file, idx) => (
                <motion.tr 
                  key={file.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                  className={`group hover:bg-white/[0.02] transition-colors ${selectedIds.includes(file.id) ? 'bg-sky-500/5' : ''}`}
                >
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(file.id)}
                      onChange={() => toggleSelectOne(file.id)}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-sky-500 focus:ring-sky-500/50 transition-all"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                        <FileIcon className="w-4 h-4 text-sky-400" />
                      </div>
                      <span className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors uppercase tracking-tight">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs text-gray-500 font-medium">{file.type}</span></td>
                  <td className="px-6 py-4"><span className="text-xs text-gray-400 font-mono italic">{formatFileSize(file.sizeBytes)}</span></td>
                  <td className="px-6 py-4"><span className="text-xs text-gray-500">{file.date}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <FolderClosed className="w-3.5 h-3.5 text-amber-400/50" />
                       <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                         {getFileLocation(file)}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"><Eye className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1.5 rounded-lg text-gray-400 hover:text-sky-400 hover:bg-sky-400/10"><Download className="w-4 h-4" /></button>
                      
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === file.id ? null : file.id); }}
                          className={`p-1.5 rounded-lg transition-all ${activeMenuId === file.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {activeMenuId === file.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-2 w-44 glass-card border border-white/10 shadow-2xl z-50 py-1 overflow-hidden">
                              {viewRecycleBin ? (
                                <>
                                  <button onClick={() => { restoreFile(file.id); setActiveMenuId(null); }} className="w-full px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/5 text-left flex items-center gap-2 uppercase italic"><Plus className="w-3.5 h-3.5" /> Restore</button>
                                  <button onClick={() => { deleteFile(file.id, true); setActiveMenuId(null); }} className="w-full px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/5 text-left flex items-center gap-2 uppercase italic"><Trash2 className="w-3.5 h-3.5" /> Delete Permanently</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { setRenamingEntity({ id: file.id, name: file.name, type: 'file' }); setNewName(file.name); setActiveMenuId(null); }} className="w-full px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 text-left flex items-center gap-2 uppercase italic"><Edit2 className="w-3.5 h-3.5 text-sky-400" /> Rename</button>
                                  <button onClick={() => { setMoveFileTarget(file); setActiveMenuId(null); }} className="w-full px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 text-left flex items-center gap-2 uppercase italic"><FolderInput className="w-3.5 h-3.5 text-amber-500" /> Relocate</button>
                                  <div className="h-px bg-white/5 my-1" />
                                  <button onClick={() => { deleteFile(file.id); setActiveMenuId(null); }} className="w-full px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/5 text-left flex items-center gap-2 uppercase italic"><Trash2 className="w-3.5 h-3.5" /> Recycle</button>
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Search Result Empty State */}
      {filteredEntities.length === 0 && (
         <div className="py-20 flex flex-col items-center justify-center text-gray-600">
           <Database className="w-16 h-16 mb-4 opacity-10" />
           <p className="text-xl font-black uppercase italic tracking-widest opacity-40">No logical entities indexed.</p>
         </div>
      )}
    </div>
  );
}
