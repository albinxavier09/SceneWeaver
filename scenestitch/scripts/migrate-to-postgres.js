#!/usr/bin/env node

/**
 * Migration Script: SQLite to PostgreSQL
 * This script migrates data from SQLite to PostgreSQL for Render deployment
 */

const { Client } = require('pg');
const sqlite3 = require('sqlite3');
const path = require('path');

// Database connections
const sqliteDb = new sqlite3.Database(path.join(process.cwd(), 'data', 'scenestitch.db'));
const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateData() {
  try {
    console.log('🔄 Starting migration from SQLite to PostgreSQL...');
    
    // Connect to PostgreSQL
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if we have data to migrate
    const userCount = await new Promise((resolve, reject) => {
      sqliteDb.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (userCount === 0) {
      console.log('ℹ️  No data to migrate, skipping migration');
      return;
    }

    console.log(`📊 Found ${userCount} users to migrate`);

    // Migrate users
    console.log('👥 Migrating users...');
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const user of users) {
      await pgClient.query(`
        INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [user.id, user.name, user.email, user.password_hash, user.created_at, user.updated_at]);
    }

    // Migrate projects
    console.log('📁 Migrating projects...');
    const projects = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM projects', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const project of projects) {
      await pgClient.query(`
        INSERT INTO projects (id, name, description, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [project.id, project.name, project.description, project.created_by, project.created_at, project.updated_at]);
    }

    // Migrate project members
    console.log('👥 Migrating project members...');
    const members = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM project_members', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const member of members) {
      await pgClient.query(`
        INSERT INTO project_members (id, project_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [member.id, member.project_id, member.user_id, member.role, member.joined_at]);
    }

    // Migrate scenes
    console.log('🎬 Migrating scenes...');
    const scenes = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM scenes', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const scene of scenes) {
      await pgClient.query(`
        INSERT INTO scenes (id, project_id, title, description, image_url, dialogue, technical_details, status, tags, notes, position_x, position_y, width, height, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING
      `, [
        scene.id, scene.project_id, scene.title, scene.description, scene.image_url,
        scene.dialogue, scene.technical_details, scene.status, scene.tags, scene.notes,
        scene.position_x, scene.position_y, scene.width, scene.height,
        scene.created_at, scene.updated_at
      ]);
    }

    // Migrate scene connections
    console.log('🔗 Migrating scene connections...');
    const connections = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM scene_connections', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const connection of connections) {
      await pgClient.query(`
        INSERT INTO scene_connections (id, from_scene_id, to_scene_id, connection_type, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [connection.id, connection.from_scene_id, connection.to_scene_id, connection.connection_type, connection.created_at]);
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pgClient.end();
    sqliteDb.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
