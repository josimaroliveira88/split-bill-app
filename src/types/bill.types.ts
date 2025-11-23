// src/types/bill.types.ts

export interface Person {
  id: string;
  name: string;
  itemConsumptions: ItemConsumption[];
}

export interface Item {
  id: string;
  name: string;
  price: number;
  totalQuantity: number; // Ex: 10 cervejas
  payerId?: string; // Pessoa responsável pelo pagamento
}

export interface ItemConsumption {
  itemId: string;
  personId: string;
  quantity: number; // Ex: João bebeu 4 cervejas
}

export interface BillResult {
  personId: string;
  personName: string;
  itemsTotal: number;
  serviceFee: number;
  totalToPay: number;
  itemsDetail: {
    itemName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export interface BillSettings {
  serviceFeePercentage: number;
  serviceFeeMode: 'equal' | 'proportional'; // Igualitária ou Proporcional
}

export interface SimpleBill {
  totalAmount: number;
  numberOfPeople: number;
  serviceFeePercentage: number;
  title?: string;
  note?: string;
}

export interface DetailedBill {
  people: Person[];
  items: Item[];
  settings: BillSettings;
  title?: string;
  note?: string;
}

export type BillEntryType = 'simple' | 'detailed';

export interface BillHistoryEntry {
  id: string;
  name: string;
  type: BillEntryType;
  createdAt: string;
  title?: string;
  note?: string;
  bill: SimpleBill | DetailedBill;
  result: number | BillResult[]; // Simple: valor por pessoa; Detailed: resultados calculados
}
