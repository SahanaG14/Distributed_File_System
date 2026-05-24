import { FileEntry, DashboardStats, SystemLog } from './types';

export const mockStats: DashboardStats = {
  totalFiles: 0,
  storageUsed: '0 B',
  storageUsedBytes: 0,
  storageCapacity: '100 TB',
  storageCapacityBytes: 100 * 1024 * 1024 * 1024 * 1024,
};

export const mockFiles: FileEntry[] = [];

export const mockLogs: SystemLog[] = [
  { id: 'l1', action: 'Upload Success', target: 'backup_image_01.img', timestamp: '2024-03-23 14:20:11', status: 'success' },
  { id: 'l2', action: 'File Deleted Permanently', target: 'temp_cache_v2.tmp', timestamp: '2024-03-23 12:05:44', status: 'info' },
  { id: 'l3', action: 'Registry Error', target: 'api_keys.vault', timestamp: '2024-03-23 11:30:02', status: 'warning' },
  { id: 'l4', action: 'Server Sync', target: 'Node-Sirius', timestamp: '2024-03-23 10:15:22', status: 'success' },
  { id: 'l5', action: 'Folder Created', target: 'Deployment Binaries', timestamp: '2024-03-22 09:44:11', status: 'info' },
];

export const chartData = [
  { name: 'Mon', storage: 2.1 },
  { name: 'Tue', storage: 2.3 },
  { name: 'Wed', storage: 2.2 },
  { name: 'Thu', storage: 2.8 },
  { name: 'Fri', storage: 3.0 },
  { name: 'Sat', storage: 3.1 },
  { name: 'Sun', storage: 3.2 },
];
