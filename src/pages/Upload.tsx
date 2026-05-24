import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, 
  X, 
  CheckCircle2, 
  File, 
  Loader2
} from 'lucide-react';
import { useData } from '../context/DataContext';

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'processing' | 'done';
  type: string;
  url?: string;
}

export default function UploadPage() {
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFile } = useData();

  const simulateUpload = (fileObj: File) => {
    const id = Math.random().toString(36).substring(7);
    const fileUrl = fileObj.type.startsWith('image/') ? URL.createObjectURL(fileObj) : undefined;
    
    const newFile: UploadingFile = { 
      id, 
      name: fileObj.name, 
      size: fileObj.size, 
      progress: 0, 
      status: 'uploading',
      type: fileObj.type.split('/')[0].charAt(0).toUpperCase() + fileObj.type.split('/')[0].slice(1),
      url: fileUrl
    };
    
    setUploadQueue(prev => [newFile, ...prev]);

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 25;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setUploadQueue(prev => prev.map(f => f.id === id ? { ...f, progress: 100, status: 'processing' } : f));
        
        setTimeout(() => {
          setUploadQueue(prev => prev.map(f => f.id === id ? { ...f, status: 'done' } : f));
          
          // Add to global data context
          addFile({
            name: fileObj.name,
            type: newFile.type === 'Image' ? 'Image' : 'Document',
            size: (fileObj.size / (1024 * 1024)).toFixed(1) + ' MB',
            sizeBytes: fileObj.size,
            date: new Date().toISOString().split('T')[0],
            status: 'Synced',
            url: fileUrl,
            folderId: null
          });
        }, 800);
      } else {
        setUploadQueue(prev => prev.map(f => f.id === id ? { ...f, progress: prog } : f));
      }
    }, 300);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(f => simulateUpload(f as File));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(f => simulateUpload(f as File));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-white uppercase italic tracking-tighter">Upload Manager</h1>
        <p className="text-gray-400 mt-2 font-medium">Select files to be added to the storage system.</p>
      </header>

      {/* Upload Zone */}
      <motion.div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={`glass-card p-12 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragging ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_30px_rgba(14,165,233,0.15)]' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleSelect} />
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
          isDragging ? 'bg-sky-500 scale-110 shadow-lg shadow-sky-500/40' : 'bg-white/5'
        }`}>
          <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-sky-400'}`} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight uppercase italic">Drop Files Here</h3>
        <p className="text-gray-400 max-w-sm mb-6 text-sm">
          Select or drag files for upload. Standard limit: <span className="text-sky-400 font-bold">100TB Max</span>.
        </p>
        <button className="px-8 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-sm">
          Browse Files
        </button>
      </motion.div>

      {/* Upload Queue */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Live Queue ({uploadQueue.length})</h4>
        <AnimatePresence mode="popLayout">
          {uploadQueue.map((file) => (
            <motion.div 
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={file.id}
              className="glass-card p-4 border border-white/5 flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 overflow-hidden">
                {file.url ? (
                  <img src={file.url} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <File className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-bold text-white truncate">{file.name}</p>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                {/* Progress bar */}
                <div className="relative h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${file.progress}%` }}
                    className={`h-full transition-colors duration-500 ${
                      file.status === 'done' ? 'bg-emerald-500' : 'bg-sky-500'
                    } shadow-[0_0_8px_rgba(14,165,233,0.3)]`} 
                  />
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider italic">
                  {file.status === 'uploading' && 'Transferring data to storage cluster...'}
                  {file.status === 'processing' && 'Processing and verifying file integrity...'}
                  {file.status === 'done' && 'File successfully indexed and stored.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {file.status === 'uploading' && (
                  <div className="flex items-center gap-2 text-sky-400 text-[10px] font-black uppercase">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading</span>
                  </div>
                )}
                {file.status === 'processing' && (
                  <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing</span>
                  </div>
                )}
                {file.status === 'done' && (
                  <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </div>
                )}
                <button 
                  onClick={() => setUploadQueue(prev => prev.filter(f => f.id !== file.id))}
                  className="p-1 px-2 rounded-lg text-gray-600 hover:text-rose-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {uploadQueue.length === 0 && (
          <div className="py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01]">
            <UploadCloud className="w-8 h-8 text-white/5 mb-2" />
            <p className="text-gray-600 text-sm font-medium tracking-wide">Transfer queue is empty. Awaiting new entities...</p>
          </div>
        )}
      </div>
    </div>
  );
}
