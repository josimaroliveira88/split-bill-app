// src/services/storage.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DetailedBill } from '../types/bill.types';

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
      const history = await this.loadBillHistory();
      const newEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        bill,
        results,
      };

      history.unshift(newEntry);

      // Manter apenas os últimos 10 registros
      const limitedHistory = history.slice(0, 10);

      const jsonValue = JSON.stringify(limitedHistory);
      await AsyncStorage.setItem(STORAGE_KEYS.BILL_HISTORY, jsonValue);
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  /**
   * Carregar histórico
   */
  static async loadBillHistory(): Promise<any[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.BILL_HISTORY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }
}