import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'scenestitch.db');

// Create database connection
const db = new sqlite3.Database(dbPath);

// Helper functions for async/await with SQLite
function runQuery(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create users table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create projects table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create scenes table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        dialogue TEXT,
        technical_details TEXT,
        status TEXT DEFAULT 'Draft',
        tags TEXT,
        notes TEXT,
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0,
        width REAL DEFAULT 300,
        height REAL DEFAULT 400,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);

    // Create scene_connections table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS scene_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_scene_id INTEGER NOT NULL,
        to_scene_id INTEGER NOT NULL,
        connection_type TEXT DEFAULT 'default',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_scene_id) REFERENCES scenes (id) ON DELETE CASCADE,
        FOREIGN KEY (to_scene_id) REFERENCES scenes (id) ON DELETE CASCADE,
        UNIQUE(from_scene_id, to_scene_id)
      )
    `);

    // Create project_members table for collaboration
    await runQuery(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'editor',
        invited_by INTEGER,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE SET NULL,
        UNIQUE(project_id, user_id)
      )
    `);

    // Create project_invitations table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS project_invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'editor',
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create activity_log table for collaboration tracking
    await runQuery(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create notifications table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        project_id INTEGER,
        entity_id INTEGER,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);

    // Add width and height columns to existing scenes table if they don't exist
    try {
      await runQuery(`ALTER TABLE scenes ADD COLUMN width REAL DEFAULT 300`);
    } catch (error) {
      // Column already exists, ignore error
    }
    
    try {
      await runQuery(`ALTER TABLE scenes ADD COLUMN height REAL DEFAULT 400`);
    } catch (error) {
      // Column already exists, ignore error
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User operations
export async function createUser(email: string, passwordHash: string, name: string) {
  const result = await runQuery(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    [email, passwordHash, name]
  );
  return result.lastID;
}

export async function getUserByEmail(email: string) {
  return await getQuery('SELECT * FROM users WHERE email = ?', [email]);
}

export async function getUserById(id: number) {
  return await getQuery('SELECT * FROM users WHERE id = ?', [id]);
}

// Project operations
export async function createProject(userId: number, name: string, description?: string) {
  const result = await runQuery(
    'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
    [userId, name, description]
  );
  return result.lastID;
}

export async function getProjectsByUserId(userId: number) {
  return await allQuery(
    `SELECT p.*, 
     COUNT(s.id) as scene_count,
     COUNT(CASE WHEN s.status = 'Approved' THEN 1 END) as approved_scenes
     FROM projects p 
     LEFT JOIN scenes s ON p.id = s.project_id 
     WHERE p.user_id = ? 
     GROUP BY p.id 
     ORDER BY p.updated_at DESC`,
    [userId]
  );
}

export async function getProjectById(projectId: number, userId: number) {
  return await getQuery(
    'SELECT * FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId]
  );
}

export async function updateProject(projectId: number, userId: number, name: string, description?: string) {
  return await runQuery(
    'UPDATE projects SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [name, description, projectId, userId]
  );
}

export async function deleteProject(projectId: number, userId: number) {
  return await runQuery(
    'DELETE FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId]
  );
}

// Scene operations
export async function createScene(projectId: number, title: string, description?: string) {
  const result = await runQuery(
    'INSERT INTO scenes (project_id, title, description) VALUES (?, ?, ?)',
    [projectId, title, description]
  );
  return result.lastID;
}

export async function getScenesByProjectId(projectId: number) {
  return await allQuery(
    'SELECT * FROM scenes WHERE project_id = ? ORDER BY created_at ASC',
    [projectId]
  );
}

export async function getSceneById(sceneId: number, projectId: number) {
  return await getQuery(
    'SELECT * FROM scenes WHERE id = ? AND project_id = ?',
    [sceneId, projectId]
  );
}

export async function updateScene(sceneId: number, projectId: number, updates: Partial<{
  title: string;
  description: string;
  image_url: string;
  dialogue: string;
  technical_details: string;
  status: string;
  tags: string;
  notes: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}>) {
  console.log('🗄️ updateScene called with:', { sceneId, projectId, updates });
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(sceneId, projectId);
  
  const sql = `UPDATE scenes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND project_id = ?`;
  console.log('📝 SQL:', sql);
  console.log('📊 Values:', values);
  
  const result = await runQuery(sql, values);
  console.log('✅ Update result:', result);
  return result;
}

export async function deleteScene(sceneId: number, projectId: number) {
  return await runQuery(
    'DELETE FROM scenes WHERE id = ? AND project_id = ?',
    [sceneId, projectId]
  );
}

// Scene connection operations
export async function createSceneConnection(fromSceneId: number, toSceneId: number, connectionType: string = 'default') {
  const result = await runQuery(
    'INSERT INTO scene_connections (from_scene_id, to_scene_id, connection_type) VALUES (?, ?, ?)',
    [fromSceneId, toSceneId, connectionType]
  );
  return result.lastID;
}

export async function getSceneConnections(projectId: number) {
  return await allQuery(
    `SELECT sc.*, 
     s1.title as from_title, s1.position_x as from_x, s1.position_y as from_y,
     s2.title as to_title, s2.position_x as to_x, s2.position_y as to_y
     FROM scene_connections sc
     JOIN scenes s1 ON sc.from_scene_id = s1.id
     JOIN scenes s2 ON sc.to_scene_id = s2.id
     WHERE s1.project_id = ? AND s2.project_id = ?`,
    [projectId, projectId]
  );
}

// Debug function to check scene data
export async function debugScenes(projectId: number) {
  const scenes = await allQuery(
    'SELECT id, title, image_url, description FROM scenes WHERE project_id = ?',
    [projectId]
  );
  console.log('Debug - Current scenes in database:', scenes);
  return scenes;
}

export async function deleteSceneConnection(connectionId: number) {
  return await runQuery(
    'DELETE FROM scene_connections WHERE id = ?',
    [connectionId]
  );
}

export async function updateScenePosition(sceneId: number, projectId: number, positionX: number, positionY: number) {
  return await runQuery(
    'UPDATE scenes SET position_x = ?, position_y = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND project_id = ?',
    [positionX, positionY, sceneId, projectId]
  );
}

export async function saveSceneConnection(fromSceneId: number, toSceneId: number, projectId: number, connectionType: string = 'default') {
  // First check if connection already exists
  const existing = await getQuery(
    'SELECT id FROM scene_connections WHERE from_scene_id = ? AND to_scene_id = ?',
    [fromSceneId, toSceneId]
  );
  
  if (existing) {
    return existing.id;
  }
  
  const result = await runQuery(
    'INSERT INTO scene_connections (from_scene_id, to_scene_id, connection_type) VALUES (?, ?, ?)',
    [fromSceneId, toSceneId, connectionType]
  );
  return result.lastID;
}

export async function deleteSceneConnectionByScenes(fromSceneId: number, toSceneId: number) {
  return await runQuery(
    'DELETE FROM scene_connections WHERE from_scene_id = ? AND to_scene_id = ?',
    [fromSceneId, toSceneId]
  );
}

// Collaboration functions

// Project members
export async function addProjectMember(projectId: number, userId: number, role: string, invitedBy?: number) {
  return await runQuery(
    'INSERT INTO project_members (project_id, user_id, role, invited_by) VALUES (?, ?, ?, ?)',
    [projectId, userId, role, invitedBy || null]
  );
}

export async function getProjectMembers(projectId: number) {
  return await allQuery(`
    SELECT pm.*, u.name, u.email 
    FROM project_members pm 
    JOIN users u ON pm.user_id = u.id 
    WHERE pm.project_id = ?
    ORDER BY pm.joined_at ASC
  `, [projectId]);
}

export async function getProjectMember(projectId: number, userId: number) {
  return await getQuery(
    'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
}

export async function updateProjectMemberRole(projectId: number, userId: number, role: string) {
  return await runQuery(
    'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
    [role, projectId, userId]
  );
}

export async function removeProjectMember(projectId: number, userId: number) {
  return await runQuery(
    'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
}

// Project invitations
export async function createProjectInvitation(projectId: number, email: string, role: string, token: string, expiresAt: string, createdBy: number) {
  return await runQuery(
    'INSERT INTO project_invitations (project_id, email, role, token, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [projectId, email, role, token, expiresAt, createdBy]
  );
}

export async function getProjectInvitationByToken(token: string) {
  return await getQuery(
    'SELECT * FROM project_invitations WHERE token = ? AND status = "pending" AND expires_at > datetime("now")',
    [token]
  );
}

export async function getProjectInvitations(projectId: number) {
  return await allQuery(
    'SELECT * FROM project_invitations WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
}

export async function updateInvitationStatus(token: string, status: string) {
  return await runQuery(
    'UPDATE project_invitations SET status = ? WHERE token = ?',
    [status, token]
  );
}

export async function deleteProjectInvitation(invitationId: number) {
  return await runQuery('DELETE FROM project_invitations WHERE id = ?', [invitationId]);
}

// Activity logging
export async function logActivity(projectId: number, userId: number, actionType: string, entityType: string, entityId?: number, details?: string) {
  return await runQuery(
    'INSERT INTO activity_log (project_id, user_id, action_type, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
    [projectId, userId, actionType, entityType, entityId || null, details || null]
  );
}

export async function getProjectActivity(projectId: number, limit: number = 50) {
  return await allQuery(`
    SELECT al.*, u.name as user_name, u.email as user_email
    FROM activity_log al
    JOIN users u ON al.user_id = u.id
    WHERE al.project_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `, [projectId, limit]);
}

// Permission checking
export async function hasProjectAccess(projectId: number, userId: number): Promise<boolean> {
  // Check if user is the project owner
  const project = await getQuery('SELECT user_id FROM projects WHERE id = ?', [projectId]);
  if (project && project.user_id === userId) {
    return true;
  }
  
  // Check if user is a project member
  const member = await getProjectMember(projectId, userId);
  return !!member;
}

export async function getProjectRole(projectId: number, userId: number): Promise<string | null> {
  // Check if user is the project owner
  const project = await getQuery('SELECT user_id FROM projects WHERE id = ?', [projectId]);
  if (project && project.user_id === userId) {
    return 'owner';
  }
  
  // Check if user is a project member
  const member = await getProjectMember(projectId, userId);
  return member ? member.role : null;
}

export async function canEditProject(projectId: number, userId: number): Promise<boolean> {
  const role = await getProjectRole(projectId, userId);
  return role === 'owner' || role === 'editor';
}

export async function canViewProject(projectId: number, userId: number): Promise<boolean> {
  const role = await getProjectRole(projectId, userId);
  return role === 'owner' || role === 'editor' || role === 'viewer';
}

// User search
export async function searchUsers(query: string) {
  return await allQuery(
    'SELECT id, name, email, created_at FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY name ASC LIMIT 20',
    [`%${query}%`, `%${query}%`]
  );
}

// Notifications
export async function createNotification(userId: number, type: string, title: string, message: string, projectId?: number, entityId?: number) {
  return await runQuery(
    'INSERT INTO notifications (user_id, type, title, message, project_id, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    [userId, type, title, message, projectId || null, entityId || null]
  );
}

export async function getNotifications(userId: number, limit: number = 50) {
  return await allQuery(`
    SELECT n.*, p.name as project_name
    FROM notifications n
    LEFT JOIN projects p ON n.project_id = p.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT ?
  `, [userId, limit]);
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  return await runQuery(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
}

export async function markAllNotificationsAsRead(userId: number) {
  return await runQuery(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
    [userId]
  );
}

export async function getUnreadNotificationCount(userId: number) {
  const result = await getQuery(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return result?.count || 0;
}

export { db };
