// src/services/storage.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { BillHistoryEntry, DetailedBill, SimpleBill } from '../types/bill.types';

const STORAGE_KEYS = {
  DETAILED_BILL: '@split_bill:detailed_bill',
  BILL_HISTORY: '@split_bill:history',
};

const isBillEntryType = (value: any): value is 'simple' | 'detailed' =>
  value === 'simple' || value === 'detailed';

type SQLiteRow = {
  id: string;
  name: string;
  title?: string | null;
  note?: string | null;
  type: 'simple' | 'detailed';
  created_at: string;
  bill_json: string;
  result_json: string;
};

export class StorageService {
  private static dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
  private static initialized = false;
  private static initPromise: Promise<void> | null = null;

  private static resolveTitle(title: string | undefined, createdAt: string): string {
    if (title && title.trim()) return title.trim();
    const date = new Date(createdAt);
    return date.toLocaleString();
  }

  private static getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = SQLite.openDatabaseAsync('split_bill.db');
    }
    return this.dbPromise;
  }

  private static async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      const db = await this.getDb();

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          'CREATE TABLE IF NOT EXISTS bill_history (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, title TEXT, note TEXT, type TEXT NOT NULL, created_at TEXT NOT NULL, bill_json TEXT NOT NULL, result_json TEXT NOT NULL)'
        );
        await db.runAsync(
          'CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY NOT NULL, value TEXT)'
        );
        await db.runAsync(
          'CREATE INDEX IF NOT EXISTS idx_bill_history_created ON bill_history(created_at)'
        );
      });

      await this.migrateFromAsyncStorage(db);
      this.initialized = true;
    })();

    await this.initPromise;
  }

  private static async setKv(key: string, value: string | null): Promise<void> {
    const db = await this.getDb();
    if (value === null) {
      await db.runAsync('DELETE FROM kv_store WHERE key = ?', [key]);
    } else {
      await db.runAsync('REPLACE INTO kv_store (key, value) VALUES (?, ?)', [key, value]);
    }
  }

  private static async getKv(key: string): Promise<string | null> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<{ value: string }>(
      'SELECT value FROM kv_store WHERE key = ?',
      [key]
    );
    if (!rows || rows.length === 0) return null;
    return rows[0].value ?? null;
  }

  private static mapRowToEntry(row: SQLiteRow): BillHistoryEntry {
    return {
      id: row.id,
      name: row.name,
      title: row.title || undefined,
      note: row.note || undefined,
      type: row.type,
      createdAt: row.created_at,
      bill: JSON.parse(row.bill_json),
      result: JSON.parse(row.result_json),
    };
  }

  private static async migrateFromAsyncStorage(db: SQLite.SQLiteDatabase): Promise<void> {
    try {
      const alreadyMigrated = await this.getKv('migration_completed');
      if (alreadyMigrated === '1') return;

      const [historyJson, detailedBillJson, existingCount] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BILL_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.DETAILED_BILL),
        this.countHistory(),
      ]);

      if (existingCount === 0 && historyJson) {
        const parsed = JSON.parse(historyJson);
        const sanitized = this.sanitizeHistoryEntries(parsed);
        if (sanitized.length > 0) {
          await this.replaceHistoryDirect(db, sanitized);
        }
      }

      if (detailedBillJson) {
        await this.setKv(STORAGE_KEYS.DETAILED_BILL, detailedBillJson);
      }

      await this.setKv('migration_completed', '1');
    } catch (error) {
      console.error('Erro ao migrar dados do AsyncStorage:', error);
    }
  }

  private static async enforceHistoryLimit(limit = 20): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `DELETE FROM bill_history WHERE id NOT IN (
        SELECT id FROM bill_history ORDER BY datetime(created_at) DESC LIMIT ?
      )`,
      [limit]
    );
  }

  /**
   * Salvar conta detalhada (rascunho atual)
   */
  static async saveDetailedBill(bill: DetailedBill): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.setKv(STORAGE_KEYS.DETAILED_BILL, JSON.stringify(bill));
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      throw error;
    }
  }

  /**
   * Carregar conta detalhada (rascunho atual)
   */
  static async loadDetailedBill(): Promise<DetailedBill | null> {
    await this.ensureInitialized();
    try {
      const jsonValue = await this.getKv(STORAGE_KEYS.DETAILED_BILL);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Erro ao carregar conta:', error);
      return null;
    }
  }

  /**
   * Limpar conta atual
   */
  static async clearCurrentBill(): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.setKv(STORAGE_KEYS.DETAILED_BILL, null);
    } catch (error) {
      console.error('Erro ao limpar conta:', error);
      throw error;
    }
  }

  /**
   * Salvar no histórico
   */
  static async saveBillToHistory(
    bill: DetailedBill,
    results: any[],
    meta?: { title?: string; note?: string }
  ): Promise<void> {
    await this.ensureInitialized();
    try {
      const resultsHistory = Array.isArray(results) ? results : [];
      const createdAt = new Date().toISOString();
      const resolvedTitle = this.resolveTitle(meta?.title, createdAt);
      const entry: BillHistoryEntry = {
        id: Date.now().toString(),
        name: resolvedTitle,
        title: meta?.title?.trim() || undefined,
        note: meta?.note?.trim() || undefined,
        type: 'detailed',
        createdAt,
        bill,
        result: resultsHistory,
      };

      await this.saveHistoryEntry(entry);
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  /**
   * Carregar histórico
   */
  static async loadBillHistory(limit = 20): Promise<BillHistoryEntry[]> {
    await this.ensureInitialized();
    try {
      const db = await this.getDb();
      const rows = await db.getAllAsync<SQLiteRow>(
        'SELECT * FROM bill_history ORDER BY datetime(created_at) DESC LIMIT ?',
        [limit]
      );
      return rows.map(row => this.mapRowToEntry(row));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }

  static async saveHistoryEntry(entry: BillHistoryEntry): Promise<void> {
    await this.ensureInitialized();
    const db = await this.getDb();
    await db.runAsync(
      'REPLACE INTO bill_history (id, name, title, note, type, created_at, bill_json, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        entry.id,
        entry.name,
        entry.title ?? null,
        entry.note ?? null,
        entry.type,
        entry.createdAt,
        JSON.stringify(entry.bill),
        JSON.stringify(entry.result),
      ]
    );
    await this.enforceHistoryLimit();
  }

  static async deleteHistoryEntry(id: string): Promise<void> {
    await this.ensureInitialized();
    const db = await this.getDb();
    await db.runAsync('DELETE FROM bill_history WHERE id = ?', [id]);
  }

  static async updateHistoryEntry(updated: BillHistoryEntry): Promise<void> {
    await this.ensureInitialized();
    const db = await this.getDb();
    await db.runAsync(
      'UPDATE bill_history SET name = ?, title = ?, note = ?, type = ?, created_at = ?, bill_json = ?, result_json = ? WHERE id = ?',
      [
        updated.name,
        updated.title ?? null,
        updated.note ?? null,
        updated.type,
        updated.createdAt,
        JSON.stringify(updated.bill),
        JSON.stringify(updated.result),
        updated.id,
      ]
    );
    await this.enforceHistoryLimit();
  }

  static sanitizeHistoryEntries(data: unknown): BillHistoryEntry[] {
    if (!Array.isArray(data)) return [];

    return data
      .filter(item => {
        const entry = item as Partial<BillHistoryEntry>;
        return (
          typeof entry.id === 'string' &&
          typeof entry.createdAt === 'string' &&
          typeof entry.name === 'string' &&
          isBillEntryType(entry.type) &&
          entry.bill !== undefined &&
          entry.result !== undefined
        );
      })
      .map(entry => {
        const sanitizedTitle = entry.title?.trim() || undefined;
        const resolvedName = this.resolveTitle(sanitizedTitle ?? entry.name, entry.createdAt);
        return {
          ...entry,
          title: sanitizedTitle,
          name: resolvedName,
          note: entry.note?.trim() || undefined,
        } as BillHistoryEntry;
      });
  }

  static async replaceHistory(entries: BillHistoryEntry[]): Promise<void> {
    await this.ensureInitialized();
    const db = await this.getDb();
    await this.replaceHistoryDirect(db, entries);
    await this.enforceHistoryLimit();
  }

  static async saveSimpleBill(
    bill: SimpleBill,
    perPerson: number,
    options?: { title?: string; note?: string }
  ): Promise<void> {
    await this.ensureInitialized();
    const createdAt = new Date().toISOString();
    const resolvedTitle = this.resolveTitle(options?.title, createdAt);
    const entry: BillHistoryEntry = {
      id: Date.now().toString(),
      name: resolvedTitle,
      title: options?.title?.trim() || undefined,
      note: options?.note?.trim() || undefined,
      type: 'simple',
      createdAt,
      bill,
      result: perPerson,
    };

    await this.saveHistoryEntry(entry);
  }

  private static async countHistory(): Promise<number> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM bill_history');
    if (!rows || rows.length === 0) return 0;
    return rows[0].count ?? 0;
  }

  private static async replaceHistoryDirect(
    db: SQLite.SQLiteDatabase,
    entries: BillHistoryEntry[]
  ): Promise<void> {
    const sanitized = this.sanitizeHistoryEntries(entries);
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM bill_history');
      for (const entry of sanitized) {
        await db.runAsync(
          'INSERT INTO bill_history (id, name, title, note, type, created_at, bill_json, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            entry.id,
            entry.name,
            entry.title ?? null,
            entry.note ?? null,
            entry.type,
            entry.createdAt,
            JSON.stringify(entry.bill),
            JSON.stringify(entry.result),
          ]
        );
      }
    });
  }
}
