import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { FileEntry, Folder, DashboardStats, SystemLog, StorageServer } from '../types';
import axios from 'axios';

interface DataContextType {
  currentUser: { user_id: string | number; username: string; email: string } | null;
  setCurrentUser: (user: { user_id: string | number; username: string; email: string } | null) => void;
  files: FileEntry[];
  folders: Folder[];
  deletedFiles: FileEntry[];
  deletedFolders: Folder[];
  logs: SystemLog[];
  stats: DashboardStats;
  servers: StorageServer[];
  addFile: (file: Omit<FileEntry, 'id' | 'serverId' | 'userId'>) => Promise<void>;
  deleteFile: (id: string, permanent?: boolean) => Promise<void>;
  renameFile: (id: string, newName: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string, permanent?: boolean) => Promise<void>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  moveToFileFolder: (fileId: string, folderId: string | null) => Promise<void>;
  restoreFile: (id: string) => Promise<void>;
  restoreFolder: (id: string) => Promise<void>;
  addLog: (action: string, target: string, status: 'success' | 'warning' | 'info') => void;
  refreshData: () => Promise<void>;
  generateAuditReport: () => void;
  updateServerStatus: (serverId: string, status: 'Online' | 'Offline' | 'Maintenance') => Promise<void>;
  addServer: (server: Omit<StorageServer, 'server_id'>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // Session handling with localStorage
  const [currentUser, setCurrentUserState] = useState<{ user_id: string | number; username: string; email: string } | null>(() => {
    const saved = localStorage.getItem('dfs_user');
    return saved ? JSON.parse(saved) : null;
  });

  const setCurrentUser = (user: { user_id: string | number; username: string; email: string } | null) => {
    if (user) {
      localStorage.setItem('dfs_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dfs_user');
    }
    setCurrentUserState(user);
  };

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<FileEntry[]>([]);
  const [deletedFolders, setDeletedFolders] = useState<Folder[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [servers, setServers] = useState<StorageServer[]>([]);

  // Loading data from MySQL database endpoints using Axios
  const refreshData = useCallback(async () => {
    try {
      const uId = currentUser?.user_id || '';
      const userParams = uId ? { userId: uId } : {};
      const [filesRes, deletedFilesRes, foldersRes, deletedFoldersRes, logsRes, serversRes] = await Promise.all([
  axios.get('/api/files', { params: userParams }),
  axios.get('/api/files', { params: { ...userParams, deleted: true } }),
  axios.get('/api/folders'),
  axios.get('/api/folders', { params: { deleted: true } }),
  axios.get('/api/logs'),
  axios.get('/api/storage-server')
]);

setFiles(filesRes.data);
setDeletedFiles(deletedFilesRes.data);
setFolders(foldersRes.data);
setDeletedFolders(deletedFoldersRes.data);
setLogs(logsRes.data);
setServers(serversRes.data);
    } catch (error) {
      console.warn('MySQL refresh of files/folders failed, continuing on fallback simulation:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real-time updates for numbers (fluctuations)
  useEffect(() => {
    const interval = setInterval(() => {
      setServers(prev => prev.map(srv => {
        if (srv.server_status !== 'Online') return srv;
        const currentUsed = parseFloat(srv.used_storage.split(' ')[0]);
        const fluctuation = (Math.random() - 0.4) * 0.01; 
        const newUsed = Math.max(0, currentUsed + fluctuation);
        return {
          ...srv,
          used_storage: newUsed.toFixed(3) + ' TB'
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const totalUsedBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const capacityBytes = 100 * 1024 * 1024 * 1024 * 1024; // 100 TB

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats: DashboardStats = {
    totalFiles: files.length,
    storageUsed: formatSize(totalUsedBytes),
    storageUsedBytes: totalUsedBytes,
    storageCapacity: '100 TB',
    storageCapacityBytes: capacityBytes,
  };

  const addLog = useCallback((action: string, target: string, status: 'success' | 'warning' | 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substring(7),
      action,
      target,
      timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
      status
    };
    setLogs(prev => [newLog, ...prev]);
  }, []);

  const addFile = async (file: Omit<FileEntry, 'id' | 'serverId' | 'userId'>) => {
    const newFile: FileEntry = {
      ...file,
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString().split('T')[0],
      serverId: servers[0]?.server_id || 1,
      userId: String(currentUser?.user_id || '1')
    };

    try {
      const response = await axios.post('/api/upload', {

  file_name: newFile.name,

  file_type: newFile.type,

  file_size: newFile.size,

  location: newFile.folderId || 'Root',

  user_id: Number(newFile.userId) || 1,

  folder_id: newFile.folderId || null,

  server_id: 1

});
      if (response.data?.file_id) {
        newFile.id = String(response.data.file_id);
      }
    } catch (e) {
      console.warn('API /api/upload failed, executing local fallback saving:', e);
    }

    setFiles(prev => [newFile, ...prev]);
    addLog('File Uploaded', newFile.name, 'success');
    await refreshData();
  };

  const deleteFile = async (id: string, permanent: boolean = false) => {

  const file = files.find(f => f.id === id);
  const recycledFile = deletedFiles.find(f => f.id === id);

  if (!file && !recycledFile) return;

  try {

    if (permanent) {
      await axios.delete(`/api/files/${id}`);
    } else {
      await axios.patch(`/api/files/${id}`, {
        isDeleted: true,
        deletedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }

  } catch (err) {

    console.warn('DELETE file failed:', err);

  }

  if (permanent) {
    setDeletedFiles(prev => prev.filter(f => f.id !== id));
    setFiles(prev => prev.filter(f => f.id !== id));
    addLog('File Deleted Permanently', (file || recycledFile)!.name, 'warning');
  } else if (file) {
    setFiles(prev => prev.filter(f => f.id !== id));
    setDeletedFiles(prev => [{ ...file, isDeleted: true }, ...prev]);
    addLog('File Recycled', file.name, 'warning');
  }

  await refreshData();

};

  const restoreFile = async (id: string) => {
    const file = deletedFiles.find(f => f.id === id);
    if (file) {
      try {
        await axios.patch(`/api/files/${id}`, {
          isDeleted: false,
          deletedAt: null
        });
      } catch (err) {
        console.warn('PATCH restore file failed:', err);
      }
      setDeletedFiles(prev => prev.filter(f => f.id !== id));
      setFiles(prev => [{ ...file, isDeleted: false }, ...prev]);
      addLog('File Restored', file.name, 'success');
      await refreshData();
    }
  };

  const renameFile = async (id: string, newName: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      try {
        await axios.patch(`/api/files/${id}`, {

  file_name: newName

});
      } catch (err) {
        console.warn('PATCH rename file from backend failed, continuing locally:', err);
      }
      setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
      addLog('File Renamed', `${file.name} -> ${newName}`, 'info');
    }
  };

  const createFolder = async (name: string) => {
    const newFolder: Folder = {
      id: Math.random().toString(36).substring(7),
      name,
      date: new Date().toISOString().split('T')[0],
      size: '0 MB',
      no_of_files: 0,
      serverId: servers[0]?.server_id || 1,
      userId: String(currentUser?.user_id || '1')
    };

    try {
      const response = await axios.post('/api/folders', {

  name: newFolder.name,

  userId: Number(newFolder.userId) || 1,

  serverId: 1

});
      if (response.data?.folder_id) {
        newFolder.id = String(response.data.folder_id);
      }
    } catch (e) {
      console.warn('POST create folder to backend failed, continuing locally:', e);
    }

    setFolders(prev => [...prev, newFolder]);
    addLog('Folder Created', name, 'info');
    await refreshData();
  };

  const deleteFolder = async (id: string, permanent: boolean = false) => {
    const folder = folders.find(f => f.id === id);
    const recycledFolder = deletedFolders.find(f => f.id === id);

    if (permanent) {
      try {
        await axios.delete(`/api/folders/${id}`);
      } catch (err) {
        console.warn('DELETE folder failed in backend:', err);
      }

      if (folder) {
        setFolders(prev => prev.filter(f => f.id !== id));
        addLog('Folder Deleted Permanently', folder.name, 'warning');
      } else if (recycledFolder) {
        setDeletedFolders(prev => prev.filter(f => f.id !== id));
        addLog('Folder Deleted Permanently', recycledFolder.name, 'warning');
      }
    } else {
      if (folder) {
        try {
          await axios.patch(`/api/folders/${id}`, {
            isDeleted: true,
            deletedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
          });
        } catch (err) {
          console.warn('PATCH recycle folder failed:', err);
        }
        setFolders(prev => prev.filter(f => f.id !== id));
        setDeletedFolders(prev => [{ ...folder, isDeleted: true }, ...prev]);
        addLog('Folder Recycled', folder.name, 'info');
        await refreshData();
      }
    }
  };

  const restoreFolder = async (id: string) => {
    const folder = deletedFolders.find(f => f.id === id);
    if (folder) {
      try {
        await axios.patch(`/api/folders/${id}`, {
          isDeleted: false,
          deletedAt: null
        });
      } catch (err) {
        console.warn('PATCH restore folder failed:', err);
      }
      setDeletedFolders(prev => prev.filter(f => f.id !== id));
      setFolders(prev => [{ ...folder, isDeleted: false }, ...prev]);
      addLog('Folder Restored', folder.name, 'success');
      await refreshData();
    }
  };

  const renameFolder = async (id: string, newName: string) => {
    const folder = folders.find(f => f.id === id);
    if (folder) {
      try {
        await axios.patch(`/api/folders/${id}`, {

  folder_name: newName

});
      } catch (err) {
        console.warn('PATCH rename folder failed, continuing locally:', err);
      }
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
      addLog('Folder Renamed', `${folder.name} -> ${newName}`, 'info');
    }
  };

  const moveToFileFolder = async (fileId: string, folderId: string | null) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      try {
        await axios.patch(`/api/files/${fileId}`, { folderId });
      } catch (err) {
        console.warn('PATCH move file failed:', err);
      }
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, folderId } : f));
      const folderName = folderId ? folders.find(f => f.id === folderId)?.name : 'Root';
      addLog('File Relocated', `${file.name} moved to ${folderName}`, 'info');
      await refreshData();
    }
  };

  const generateAuditReport = () => {
    const reportContent = `DFS Audit Report\nGenerated: ${new Date().toLocaleString()}\n\nLogs:\n` + 
      logs.map(l => `${l.timestamp} | ${l.action} | ${l.target} | ${l.status}`).join('\n');
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DFS_Audit_Report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    addLog('Audit Report Generated', 'System Wide', 'success');
  };

  const updateServerStatus = async (serverId: string, status: 'Online' | 'Offline' | 'Maintenance') => {
    try {
      await axios.patch(`/api/storage-server/${serverId}`, {
        server_status: status
      });
    } catch (err) {
      console.warn('PATCH server status failed:', err);
    }

    setServers(prev => prev.map(s => s.server_id === serverId ? { ...s, server_status: status } : s));
    addLog('Server Status Changed', `${serverId} -> ${status}`, 'info');
    await refreshData();
  };

  const addServer = async (server: Omit<StorageServer, 'server_id'>) => {
    try {
      const response = await axios.post('/api/storage-server', server);
      const newServer: StorageServer = response.data?.server || {
        ...server,
        server_id: `srv-${Math.floor(Math.random() * 900) + 100}`
      };

      setServers(prev => [...prev, newServer]);
      addLog('Server Provisioned', newServer.server_name, 'success');
      await refreshData();
    } catch (err) {
      console.warn('POST storage server failed:', err);

      const fallbackServer: StorageServer = {
        ...server,
        server_id: `srv-${Math.floor(Math.random() * 900) + 100}`
      };
      setServers(prev => [...prev, fallbackServer]);
      addLog('Server Provisioned Locally', fallbackServer.server_name, 'warning');
    }
  };

  return (
    <DataContext.Provider value={{ 
      currentUser, setCurrentUser,
      files, folders, deletedFiles, deletedFolders, logs, stats, servers,
      addFile, deleteFile, renameFile, 
      createFolder, deleteFolder, renameFolder, moveToFileFolder,
      restoreFile, restoreFolder,
      addLog, refreshData, generateAuditReport, updateServerStatus, addServer
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
