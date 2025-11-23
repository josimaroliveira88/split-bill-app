// src/services/storage.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BillHistoryEntry, DetailedBill, SimpleBill } from '../types/bill.types';

const STORAGE_KEYS = {
  DETAILED_BILL: '@split_bill:detailed_bill',
  BILL_HISTORY: '@split_bill:history',
};

export class StorageService {
  private static resolveTitle(title: string | undefined, createdAt: string): string {
    if (title && title.trim()) return title.trim();
    const date = new Date(createdAt);
    return date.toLocaleString();
  }

  /**
   * Salvar conta detalhada
   */
  static async saveDetailedBill(bill: DetailedBill): Promise<void> {
    try {
      const jsonValue = JSON.stringify(bill);
      await AsyncStorage.setItem(STORAGE_KEYS.DETAILED_BILL, jsonValue);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      throw error;
    }
  }

  /**
   * Carregar conta detalhada
   */
  static async loadDetailedBill(): Promise<DetailedBill | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.DETAILED_BILL);
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
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.DETAILED_BILL);
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
  static async loadBillHistory(): Promise<BillHistoryEntry[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.BILL_HISTORY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }

  static async saveHistoryEntry(entry: BillHistoryEntry): Promise<void> {
    const history = await this.loadBillHistory();
    const newHistory = [entry, ...history].slice(0, 20);
    await AsyncStorage.setItem(STORAGE_KEYS.BILL_HISTORY, JSON.stringify(newHistory));
  }

  static async deleteHistoryEntry(id: string): Promise<void> {
    const history = await this.loadBillHistory();
    const newHistory = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.BILL_HISTORY, JSON.stringify(newHistory));
  }

  static async updateHistoryEntry(updated: BillHistoryEntry): Promise<void> {
    const history = await this.loadBillHistory();
    const newHistory = history.map(item => (item.id === updated.id ? updated : item));
    await AsyncStorage.setItem(STORAGE_KEYS.BILL_HISTORY, JSON.stringify(newHistory));
  }

  static async saveSimpleBill(
    bill: SimpleBill,
    perPerson: number,
    options?: { title?: string; note?: string }
  ): Promise<void> {
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
}
