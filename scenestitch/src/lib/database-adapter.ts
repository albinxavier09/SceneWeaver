/**
 * Database Adapter for SQLite (development) and PostgreSQL (production)
 * This provides a unified interface for both database types
 */

import sqlite3 from 'sqlite3';
import { Client } from 'pg';
import path from 'path';

// Database configuration
const isProduction = process.env.NODE_ENV === 'production';
const isPostgres = !!process.env.DATABASE_URL;

// SQLite setup (development)
let sqliteDb: sqlite3.Database | null = null;
if (!isPostgres) {
  const dbPath = path.join(process.cwd(), 'data', 'scenestitch.db');
  sqliteDb = new sqlite3.Database(dbPath);
}

// PostgreSQL setup (production)
let pgClient: Client | null = null;
if (isPostgres) {
  pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  });
}

// Unified database interface
export class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private isConnected = false;

  static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    if (isPostgres && pgClient) {
      await pgClient.connect();
      console.log('✅ Connected to PostgreSQL database');
    } else if (sqliteDb) {
      console.log('✅ Connected to SQLite database');
    }
    
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    if (isPostgres && pgClient) {
      await pgClient.end();
    }
    this.isConnected = false;
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    await this.connect();

    if (isPostgres && pgClient) {
      const result = await pgClient.query(sql, params);
      return { lastID: result.rows[0]?.id || 0, changes: result.rowCount || 0 };
    } else if (sqliteDb) {
      return new Promise((resolve, reject) => {
        sqliteDb!.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });
          }
        });
      });
    }
    
    throw new Error('No database connection available');
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    await this.connect();

    if (isPostgres && pgClient) {
      const result = await pgClient.query(sql, params);
      return result.rows[0] || null;
    } else if (sqliteDb) {
      return new Promise((resolve, reject) => {
        sqliteDb!.get(sql, params, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        });
      });
    }
    
    throw new Error('No database connection available');
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    await this.connect();

    if (isPostgres && pgClient) {
      const result = await pgClient.query(sql, params);
      return result.rows;
    } else if (sqliteDb) {
      return new Promise((resolve, reject) => {
        sqliteDb!.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        });
      });
    }
    
    throw new Error('No database connection available');
  }

  // Helper method to get the database type
  getDatabaseType(): 'sqlite' | 'postgres' {
    return isPostgres ? 'postgres' : 'sqlite';
  }

  // Helper method to check if we're using PostgreSQL
  isPostgreSQL(): boolean {
    return isPostgres;
  }
}

// Export singleton instance
export const db = DatabaseAdapter.getInstance();
