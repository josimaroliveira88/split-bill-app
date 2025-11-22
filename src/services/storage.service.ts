// src/services/storage.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BillHistoryEntry, DetailedBill, SimpleBill } from '../types/bill.types';

const STORAGE_KEYS = {
  DETAILED_BILL: '@split_bill:detailed_bill',
  BILL_HISTORY: '@split_bill:history',
};

export class StorageService {
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
  static async saveBillToHistory(bill: DetailedBill, results: any[]): Promise<void> {
    try {
      const resultsHistory = Array.isArray(results) ? results : [];
      const entry: BillHistoryEntry = {
        id: Date.now().toString(),
        name: 'Conta Detalhada',
        type: 'detailed',
        createdAt: new Date().toISOString(),
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

  static async saveSimpleBill(bill: SimpleBill, perPerson: number, name?: string): Promise<void> {
    const entry: BillHistoryEntry = {
      id: Date.now().toString(),
      name: name || 'Conta Simples',
      type: 'simple',
      createdAt: new Date().toISOString(),
      bill,
      result: perPerson,
    };

    await this.saveHistoryEntry(entry);
  }
}
