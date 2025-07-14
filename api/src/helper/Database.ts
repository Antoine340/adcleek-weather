import sqlite3, { Database as SQLiteDatabase } from 'sqlite3';
import { InitDb } from '../setup/InitDb';

export class Database {
  private db: SQLiteDatabase | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Simple database path logic
    const isTest = process.env.NODE_ENV === 'test';
    this.dbPath = dbPath || (isTest ? ':memory:' : './data/weather.db');
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Open database in read-write create mode
      const mode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
      this.db = new sqlite3.Database(this.dbPath, mode, async (err) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          // Initialize database schema and data
          const initDb = new InitDb(this);
          await initDb.initialize();
          resolve();
        } catch (initError) {
          reject(initError);
        }
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.db = null;
          resolve();
        }
      });
    });
  }
}
