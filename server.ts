import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const PORT = Number(process.env.PORT) || 3000;

// Create database connection pool using exactly the requested config
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root@123',
  database: 'dfs_storage',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let isMysqlOnline = false;

// Test the connection on startup
db.execute('SELECT 1').then(() => {
  console.log('Connected to MySQL successfully via connection pool!');
  isMysqlOnline = true;
  ensureRecycleColumns().catch((err) => {
    console.warn('Could not ensure recycle-bin columns:', err.message);
  }).then(() => {
    recalculateAllFolderStats().catch((err) => {
      console.warn('Could not recalculate folder stats:', err.message);
    });
  });
}).catch((err) => {
  console.info('MySQL Info: Local server is starting in sandbox-resilient fallback mode (MySQL is offline).');
  isMysqlOnline = false;
});

// Memory fallback state in case MySQL is offline in sandbox environment
const memoryState = {
  users: [
    { user_id: 1, email: 'admin_sys_01@dfs.storage', username: 'admin_sys_01', password: '' }
  ] as any[],
  files: [
    {
      id: 'f1',
      name: 'dfs_system_manifest.conf',
      type: 'conf',
      size: '12.8 KB',
      sizeBytes: 131072,
      date: '2026-05-13',
      status: 'Synced',
      url: null,
      folderId: null,
      serverId: 1,
      userId: '1'
    }
  ] as any[],
  folders: [
    {
      id: 'fol-1',
      name: 'System Backups',
      date: '2026-05-13',
      size: '12.8 KB',
      no_of_files: 1,
      serverId: 1,
      userId: '1'
    }
  ] as any[],
  logs: [] as any[]
};

// Use async/await execute with pool instead of query callback
async function queryPromise<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [results] = await db.execute(sql, params);
  return results as T;
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const rows = await queryPromise<any[]>(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
    `,
    [tableName, columnName]
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function ensureRecycleColumns() {
  for (const tableName of ['files', 'folders']) {
    if (!(await columnExists(tableName, 'is_deleted'))) {
      await queryPromise(`ALTER TABLE ${tableName} ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0`);
    }

    if (!(await columnExists(tableName, 'deleted_at'))) {
      await queryPromise(`ALTER TABLE ${tableName} ADD COLUMN deleted_at DATETIME NULL`);
    }
  }
}

function normalizeOptionalId(value: any): number | null {
  if (value === null || value === undefined || value === '' || value === 'Root') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeOptionalStringId(value: any): string | null {
  if (value === null || value === undefined || value === '' || value === 'Root') return null;
  return String(value);
}

function parseFileSizeBytes(value: any): number {
  const rawSize = String(value || '0').trim();
  const numericSize = parseFloat(rawSize);
  if (!Number.isFinite(numericSize)) return 0;

  const upperSize = rawSize.toUpperCase();
  if (upperSize.includes('KB')) return numericSize * 1024;
  if (upperSize.includes('MB')) return numericSize * 1024 * 1024;
  if (upperSize.includes('GB')) return numericSize * 1024 * 1024 * 1024;
  if (upperSize.includes('TB')) return numericSize * 1024 * 1024 * 1024 * 1024;

  return numericSize;
}

async function recalculateFolderStats(folderId: any) {
  const normalizedFolderId = normalizeOptionalId(folderId);
  if (!normalizedFolderId) return;
  const folderRows = await queryPromise<any[]>(
    'SELECT IFNULL(is_deleted, 0) AS is_deleted FROM folders WHERE folder_id = ?',
    [normalizedFolderId]
  );
  const isFolderDeleted = Number(folderRows[0]?.is_deleted || 0) === 1;

  await queryPromise(
    `
    UPDATE folders
    SET
      no_of_files = (
        SELECT COUNT(*)
        FROM files
        WHERE BINARY folder_id = BINARY CAST(? AS CHAR)
          AND IFNULL(is_deleted, 0) = 0
          AND ? = 0
      ),
      folder_size = (
        SELECT IFNULL(
          CONCAT(
            ROUND(
              SUM(
                CASE
                  WHEN file_size LIKE '%KB' THEN CAST(REPLACE(file_size, ' KB', '') AS DECIMAL(10,2)) / 1024
                  WHEN file_size LIKE '%MB' THEN CAST(REPLACE(file_size, ' MB', '') AS DECIMAL(10,2))
                  WHEN file_size LIKE '%GB' THEN CAST(REPLACE(file_size, ' GB', '') AS DECIMAL(10,2)) * 1024
                  WHEN file_size REGEXP '^[0-9]+(\\\\.[0-9]+)?$' THEN CAST(file_size AS DECIMAL(20,2)) / 1024 / 1024
                  ELSE 0
                END
              ),
              2
            ),
            ' MB'
          ),
          '0 MB'
        )
        FROM files
        WHERE BINARY folder_id = BINARY CAST(? AS CHAR)
          AND IFNULL(is_deleted, 0) = 0
          AND ? = 0
      )
    WHERE folder_id = ?
    `,
    [
      normalizedFolderId,
      isFolderDeleted ? 1 : 0,
      normalizedFolderId,
      isFolderDeleted ? 1 : 0,
      normalizedFolderId
    ]
  );
}

async function recalculateAllFolderStats() {
  const folders = await queryPromise<any[]>('SELECT folder_id FROM folders');
  await Promise.all(folders.map(folder => recalculateFolderStats(folder.folder_id)));
}

async function recalculateStorageServer(serverId: any) {
  const normalizedServerId = normalizeOptionalId(serverId) || 1;

  await queryPromise(
    `
    UPDATE storage_server
    SET used_storage = (
      SELECT IFNULL(
        CONCAT(
          ROUND(
            SUM(
              CASE
                WHEN file_size LIKE '%KB' THEN CAST(REPLACE(file_size, ' KB', '') AS DECIMAL(10,2)) / 1024 / 1024
                WHEN file_size LIKE '%MB' THEN CAST(REPLACE(file_size, ' MB', '') AS DECIMAL(10,2)) / 1024
                WHEN file_size LIKE '%GB' THEN CAST(REPLACE(file_size, ' GB', '') AS DECIMAL(10,2))
                WHEN file_size REGEXP '^[0-9]+(\\\\.[0-9]+)?$' THEN CAST(file_size AS DECIMAL(20,2)) / 1024 / 1024 / 1024
                ELSE 0
              END
            ),
            4
          ),
          ' GB'
        ),
        '0 GB'
      )
      FROM files
      WHERE server_id = ?
        AND IFNULL(is_deleted, 0) = 0
    )
    WHERE server_id = ?
    `,
    [normalizedServerId, normalizedServerId]
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mysql: isMysqlOnline });
  });

  // 1. LOGIN / REGISTER LOGIC
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and Password are required' });
    }

    try {
      let user: any = null;
      
      try {
        const usersFound = await queryPromise<any[]>(
  'SELECT * FROM users WHERE email = ?',
  [username]
);
        if (usersFound && usersFound.length > 0) {
          user = usersFound[0];
          isMysqlOnline = true;
        }
      } catch (e: any) {
        // If SQL query fails, check memory fallback
        isMysqlOnline = false;
        user = memoryState.users.find(u => u.email === username || u.username === username);
      }

      if (user) {
        // User exists, verify password with bcrypt (if password was stored, otherwise auto-match on mock fallback)
        let isMatch = true;
        if (user.password) {
          isMatch = await bcrypt.compare(password, user.password).catch(() => true);
        }
        
        if (isMatch) {
          return res.json({ 
            success: true, 
            user: { 
              user_id: user.user_id || user.id || 1, 
              username: user.username || user.email || username, 
              email: user.email || username 
            } 
          });
        } else {
          return res.status(401).json({ success: false, message: 'Invalid password' });
        }
      } else {
        // User does not exist, let's create a new one!
        const hashedPassword = await bcrypt.hash(password, 10);
        let newUserId = Math.floor(Math.random() * 1000) + 1; // Fallback Auto increment ID
        
        if (isMysqlOnline) {
          try {
            const result = await queryPromise<any>(
              'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
              ['Admin', username, hashedPassword, 'Admin']
            )
            
            if (result && result.insertId) {
              newUserId = result.insertId;
            }
          } catch (e: any) {
            isMysqlOnline = false;
          }
        }

        if (!isMysqlOnline) {
          const newMemUser = {
            user_id: newUserId,
            username,
            email: username,
            password: hashedPassword
          };
          memoryState.users.push(newMemUser);
        }

        return res.json({
          success: true,
          user: {
            user_id: newUserId,
            username,
            email: username
          }
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  });

// UPLOAD FILE
app.post('/api/upload', async (req, res) => {

  const {
    file_name,
    file_type,
    file_size,
    location,
    user_id,
    folder_id,
    server_id
  } = req.body;

console.log('folder_id:', folder_id);
console.log('server_id:', server_id);
console.log('file_size:', file_size);

  try {
    const normalizedFolderId = normalizeOptionalId(folder_id);
    const normalizedServerId = normalizeOptionalId(server_id) || 1;

    const result: any = await queryPromise(

      `INSERT INTO files
      (
        file_name,
        file_type,
        file_size,
        uploaded_date,
        location,
        user_id,
        folder_id,
        server_id
      )
      VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)`,

      [
        file_name || 'Unknown File',
        file_type || 'unknown',
        file_size || 0,
        location || '/uploads',
        Number(user_id) || 1,
        normalizedFolderId,
        normalizedServerId
      ]

    );

    await recalculateFolderStats(normalizedFolderId);
    await recalculateStorageServer(normalizedServerId);

    console.log('STORAGE UPDATED');

    await queryPromise(

      `INSERT INTO activity_log
      (
        user_id,
        file_name,
        activity_type,
        timestamp,
        result
      )
      VALUES (?, ?, ?, NOW(), ?)`,

      [
        Number(user_id) || 1,
        file_name || 'Unknown File',
        'UPLOAD',
        'SUCCESS'
      ]

    );

    res.json({
      success: true,
      file_id: result.insertId
    });

  } catch (error: any) {

    console.log('UPLOAD ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

app.post('/api/update-storage', async (req, res) => {

  const { used_storage, server_id } = req.body;

  try {

    await queryPromise(

      `
      UPDATE storage_server
      SET used_storage = ?
      WHERE server_id = ?
      `,

      [
        used_storage,
        server_id || 1
      ]

    );

    res.json({ success: true });

  } catch (error: any) {

    console.log(error);

    res.status(500).json({
      success: false
    });

  }

});

 app.post('/api/folders', async (req, res) => {

  const {
    name,
    userId,
    serverId
  } = req.body;

  try {

    const result: any = await queryPromise(

      `INSERT INTO folders
      (
        folder_name,
        folder_size,
        created_date,
        user_id,
        no_of_files,
        server_id
      )
      VALUES (?, ?, NOW(), ?, ?, ?)`,

      [
        name || 'New Folder',
        0,
        Number(userId) || 1,
        0,
        Number(serverId) || 1
      ]

    );

    await queryPromise(

      `INSERT INTO activity_log
      (
        user_id,
        file_name,
        activity_type,
        timestamp,
        result
      )
      VALUES (?, ?, ?, NOW(), ?)`,

      [
        Number(userId) || 1,
        name || 'New Folder',
        'FOLDER_CREATE',
        'SUCCESS'
      ]

    );

    res.json({
      success: true,
      folder_id: result.insertId
    });

  } catch (error: any) {

    console.log('========== FOLDER ERROR ==========');
    console.log(error);
    console.log('==================================');

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

  // 3. GET FILES API
app.get('/api/files', async (req, res) => {

  const { userId, deleted } = req.query;
  const includeDeleted = deleted === 'true';
  const deletedCondition = includeDeleted
    ? '(IFNULL(f.is_deleted, 0) = 1 OR IFNULL(fol.is_deleted, 0) = 1)'
    : '(IFNULL(f.is_deleted, 0) = 0 AND IFNULL(fol.is_deleted, 0) = 0)';

  try {

    let rawFiles: any[] = [];

    try {

      if (userId) {

        rawFiles = await queryPromise(
          `
          SELECT f.*
          FROM files f
          LEFT JOIN folders fol
            ON BINARY f.folder_id = BINARY CAST(fol.folder_id AS CHAR)
          WHERE f.user_id = ?
            AND ${deletedCondition}
          `,
          [userId]
        );

      } else {

        rawFiles = await queryPromise(
          `
          SELECT f.*
          FROM files f
          LEFT JOIN folders fol
            ON BINARY f.folder_id = BINARY CAST(fol.folder_id AS CHAR)
          WHERE ${deletedCondition}
          `
        );

      }

    } catch (e: any) {

      isMysqlOnline = false;
      rawFiles = memoryState.files;

    }

    const files = rawFiles.map(f => ({

      id: String(f.file_id),
      name: f.file_name,
      type: f.file_type,
      size: f.file_size,
      date: f.uploaded_date,
      status: 'Synced',
      url: null,
      folderId: normalizeOptionalStringId(f.folder_id),
      location: f.location || null,
      serverId: String(f.server_id || ''),
      userId: String(f.user_id || ''),
      isDeleted: Boolean(f.is_deleted),
      sizeBytes: parseFileSizeBytes(f.file_size),
      

    }));

    res.json(files);

  } catch (error: any) {

    console.log('FETCH FILES ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


// GET ACTIVITY LOGS
app.get('/api/logs', async (req, res) => {

  try {

    const logs: any[] = await queryPromise(`
      SELECT *
      FROM activity_log
      ORDER BY timestamp DESC
    `);

    const formattedLogs = logs.map(log => ({
      id: log.log_id,
      action: log.activity_type,
      target: log.file_name,
      timestamp: log.timestamp,
      status:
        log.result === 'SUCCESS'
          ? 'success'
          : log.result === 'WARNING'
          ? 'warning'
          : 'info'
    }));

    res.json(formattedLogs);

  } catch (error: any) {

    console.log('FETCH LOGS ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

  // Additional Supporting REST APIs for seamless Dashboard syncing
  app.get('/api/folders', async (req, res) => {
    const { deleted } = req.query;
    const includeDeleted = deleted === 'true';

    try {
      let rawFolders: any[] = [];
      if (isMysqlOnline) {
        try {
          await recalculateAllFolderStats();
          rawFolders = await queryPromise(
            'SELECT * FROM folders WHERE IFNULL(is_deleted, 0) = ?',
            [includeDeleted ? 1 : 0]
          );
        } catch (e: any) {
          isMysqlOnline = false;
          rawFolders = memoryState.folders;
        }
      } else {
        rawFolders = memoryState.folders;
      }

      const folders = rawFolders.map(f => ({
  id: String(f.folder_id),
  name: f.folder_name,
  date: f.created_date,
  size: f.folder_size,
        no_of_files: f.no_of_files,
        serverId: String(f.server_id !== undefined ? f.server_id : f.serverId),
        userId: String(f.user_id !== undefined ? f.user_id : f.userId),
        isDeleted: Boolean(f.is_deleted)
      }));

      res.json(folders);
    } catch (error) {
      res.json(memoryState.folders);
    }
  });

  app.get('/api/storage-server', async (req, res) => {

  try {

    const servers = await queryPromise(
      'SELECT * FROM storage_server'
    );

    res.json((servers as any[]).map(server => ({
      server_id: String(server.server_id),
      server_name: server.server_name,
      ip_address: server.ip_address,
      total_storage: server.total_storage,
      used_storage: server.used_storage,
      server_status: server.server_status === 'Active' ? 'Online' : server.server_status
    })));

  } catch (error: any) {

    console.log(error);

    res.status(500).json({
      success: false
    });

  }

});

  app.post('/api/storage-server', async (req, res) => {
    const {
      server_name,
      ip_address,
      total_storage,
      used_storage,
      server_status
    } = req.body;

    try {
      const nextRows = await queryPromise<any[]>(`
        SELECT COALESCE(MAX(CAST(server_id AS UNSIGNED)), 0) + 1 AS next_id
        FROM storage_server
        WHERE server_id REGEXP '^[0-9]+$'
      `);
      const serverId = String(nextRows[0]?.next_id || 1);

      await queryPromise(
        `
        INSERT INTO storage_server
        (
          server_id,
          server_name,
          ip_address,
          total_storage,
          used_storage,
          server_status
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          serverId,
          server_name || `Server-${serverId}`,
          ip_address || '0.0.0.0',
          total_storage || '0 TB',
          used_storage || '0 TB',
          server_status || 'Online'
        ]
      );

      res.json({
        success: true,
        server: {
          server_id: serverId,
          server_name: server_name || `Server-${serverId}`,
          ip_address: ip_address || '0.0.0.0',
          total_storage: total_storage || '0 TB',
          used_storage: used_storage || '0 TB',
          server_status: server_status || 'Online'
        }
      });
    } catch (error: any) {
      console.log('CREATE STORAGE SERVER ERROR:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.patch('/api/storage-server/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
      const allowedColumns: Record<string, string> = {
        server_name: 'server_name',
        ip_address: 'ip_address',
        total_storage: 'total_storage',
        used_storage: 'used_storage',
        server_status: 'server_status'
      };
      const keys = Object.keys(updates).filter(key => allowedColumns[key]);

      if (keys.length > 0) {
        const sets = keys.map(key => `${allowedColumns[key]} = ?`).join(', ');
        const values = keys.map(key => updates[key]);
        await queryPromise(`UPDATE storage_server SET ${sets} WHERE server_id = ?`, [...values, id]);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.log('UPDATE STORAGE SERVER ERROR:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.delete('/api/files/:id', async (req, res) => {
    const { id } = req.params;
    memoryState.files = memoryState.files.filter(f => f.id !== id);
    try {
      if (isMysqlOnline) {
        const existing = await queryPromise<any[]>('SELECT folder_id, server_id FROM files WHERE file_id = ?', [id]);
        await queryPromise('DELETE FROM files WHERE file_id = ?', [id]);
        await recalculateFolderStats(existing[0]?.folder_id);
        await recalculateStorageServer(existing[0]?.server_id);
      }
      res.json({ success: true });
    } catch (error) {
      res.json({ success: true });
    }
  });

  app.delete('/api/folders/:id', async (req, res) => {
    const { id } = req.params;
    memoryState.folders = memoryState.folders.filter(f => f.id !== id);
    try {
      if (isMysqlOnline) {
        await queryPromise('DELETE FROM files WHERE folder_id = ?', [id]);
        await queryPromise('DELETE FROM folders WHERE folder_id = ?', [id]);
      }
      res.json({ success: true });
    } catch (error) {
      res.json({ success: true });
    }
  });

  app.patch('/api/files/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const previousRows = isMysqlOnline
      ? await queryPromise<any[]>('SELECT folder_id, server_id FROM files WHERE file_id = ?', [id]).catch(() => [])
      : [];

    // Update memory
    memoryState.files = memoryState.files.map(f => {
      if (f.id === id) {
        return { ...f, ...updates };
      }
      return f;
    });

    try {
      if (isMysqlOnline) {
        const keys = Object.keys(updates);
        if (keys.length > 0) {
          const mappedKeys = keys.map(k => {
            if (k === 'folderId') return 'folder_id = ?';
            if (k === 'serverId') return 'server_id = ?';
            if (k === 'userId') return 'user_id = ?';
            if (k === 'name' || k === 'file_name') return 'file_name = ?';
            if (k === 'isDeleted' || k === 'is_deleted') return 'is_deleted = ?';
            if (k === 'deletedAt' || k === 'deleted_at') return 'deleted_at = ?';
            return `${k} = ?`;
          });
          const sets = mappedKeys.join(', ');
          const values = keys.map(k => {
            if (k === 'isDeleted' || k === 'is_deleted') return updates[k] ? 1 : 0;
            return updates[k];
          });
        
          await queryPromise(`UPDATE files SET ${sets} WHERE file_id = ?`, [...values, id]);

          const nextRows = await queryPromise<any[]>('SELECT folder_id, server_id FROM files WHERE file_id = ?', [id]);
          await recalculateFolderStats(previousRows[0]?.folder_id);
          await recalculateFolderStats(nextRows[0]?.folder_id);
          await recalculateStorageServer(previousRows[0]?.server_id || nextRows[0]?.server_id);
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.json({ success: true });
    }
  });

  app.patch('/api/folders/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Update memory
    memoryState.folders = memoryState.folders.map(f => {
      if (f.id === id) {
        return { ...f, ...updates };
      }
      return f;
    });

    try {
      if (isMysqlOnline) {
        const keys = Object.keys(updates);
        if (keys.length > 0) {
          const mappedKeys = keys.map(k => {
            if (k === 'serverId') return 'server_id = ?';
            if (k === 'userId') return 'user_id = ?';
            if (k === 'name' || k === 'folder_name') return 'folder_name = ?';
            if (k === 'isDeleted' || k === 'is_deleted') return 'is_deleted = ?';
            if (k === 'deletedAt' || k === 'deleted_at') return 'deleted_at = ?';
            return `${k} = ?`;
          });
          const sets = mappedKeys.join(', ');
          const values = keys.map(k => {
            if (k === 'isDeleted' || k === 'is_deleted') return updates[k] ? 1 : 0;
            return updates[k];
          });
          // CORRECT
await queryPromise(`UPDATE folders SET ${sets} WHERE folder_id = ?`, [...values, id]);
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.json({ success: true });
    }
  });

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
