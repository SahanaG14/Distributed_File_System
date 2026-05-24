export interface FileEntry {
  id: string;
  name: string;
  type: string;
  size: string;
  sizeBytes: number;
  date: string;
  status: 'Synced' | 'Pending' | 'Error';
  url?: string;
  location?: string | null;
  folderId?: string | null;
  serverId: string; // From Schema Diagram
  userId: string;   // From Schema Diagram
  isDeleted?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  date: string;
  size: string;      // From Schema Diagram
  no_of_files: number; // From Schema Diagram
  serverId: string;    // From Schema Diagram
  userId: string;      // From Schema Diagram
  isDeleted?: boolean;
}

export interface SystemLog {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

export interface DashboardStats {
  totalFiles: number;
  storageUsed: string;
  storageUsedBytes: number;
  storageCapacity: string;
  storageCapacityBytes: number;
}

export interface StorageServer {
  server_id: string;
  server_name: string;
  ip_address: string;
  total_storage: string;
  used_storage: string;
  server_status: 'Online' | 'Offline' | 'Maintenance';
}
