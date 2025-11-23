// src/context/BillContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DetailedBill, Person, Item, ItemConsumption, BillSettings, BillResult, BillHistoryEntry } from '../types/bill.types';
import { StorageService } from '../services/storage.service';
import { CalculationService } from '../services/calculation.service';

interface BillContextData {
  bill: DetailedBill;
  currentEntryMeta: { id?: string; name?: string; createdAt?: string } | null;
  updateBillInfo: (info: { title?: string; note?: string }) => void;
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  addItem: (name: string, price: number, quantity: number, payerId?: string) => void;
  removeItem: (id: string) => void;
  addItemConsumption: (itemId: string, personId: string, quantity: number) => void;
  distributeItemEqually: (itemId: string, selectedPeopleIds: string[]) => void;
  distributeItemCustom: (itemId: string, consumptions: ItemConsumption[]) => void;
  updateSettings: (settings: Partial<BillSettings>) => void;
  calculateResults: () => BillResult[];
  loadBillFromHistory: (entry: BillHistoryEntry) => void;
  setCurrentEntryMeta: (meta: { id?: string; name?: string; createdAt?: string } | null) => void;
  clearBill: () => void;
  saveBill: () => Promise<void>;
  loadBill: () => Promise<void>;
}

const BillContext = createContext<BillContextData>({} as BillContextData);

const initialBill: DetailedBill = {
  people: [],
  items: [],
  settings: {
    serviceFeePercentage: 10,
    serviceFeeMode: 'proportional',
  },
  title: '',
  note: '',
};

export const BillProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bill, setBill] = useState<DetailedBill>(initialBill);
  const [currentEntryMeta, setCurrentEntryMeta] = useState<{
    id?: string;
    name?: string;
    createdAt?: string;
  } | null>(null);

  // Carregar dados ao iniciar
  useEffect(() => {
    loadBill();
  }, []);

  const updateBillInfo = (info: { title?: string; note?: string }) => {
    setBill(prev => ({
      ...prev,
      title: info.title !== undefined ? info.title : prev.title,
      note: info.note !== undefined ? info.note : prev.note,
    }));
  };

  const addPerson = (name: string) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
      itemConsumptions: [],
    };
    setBill(prev => ({
      ...prev,
      people: [...prev.people, newPerson],
    }));
  };

  const removePerson = (id: string) => {
    setBill(prev => ({
      ...prev,
      people: prev.people.filter(p => p.id !== id),
    }));
  };

  const addItem = (name: string, price: number, quantity: number, payerId?: string) => {
    const itemId = Date.now().toString();
    setBill(prev => {
      const newItem: Item = {
        id: itemId,
        name,
        price,
        totalQuantity: quantity,
        payerId,
      };

      const updatedPeople = payerId
        ? prev.people.map(person => {
            if (person.id !== payerId) return person;

            // Responsável paga o item inteiro por padrão
            const filteredConsumptions = person.itemConsumptions.filter(
              ic => ic.itemId !== itemId
            );
            return {
              ...person,
              itemConsumptions: [
                ...filteredConsumptions,
                { itemId, personId: payerId, quantity },
              ],
            };
          })
        : prev.people;

      return {
        ...prev,
        items: [...prev.items, newItem],
        people: updatedPeople,
      };
    });
  };

  const removeItem = (id: string) => {
    setBill(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id),
      people: prev.people.map(person => ({
        ...person,
        itemConsumptions: person.itemConsumptions.filter(ic => ic.itemId !== id),
      })),
    }));
  };

  const addItemConsumption = (itemId: string, personId: string, quantity: number) => {
    setBill(prev => ({
      ...prev,
      people: prev.people.map(person => {
        if (person.id !== personId) return person;

        const existingConsumption = person.itemConsumptions.find(ic => ic.itemId === itemId);

        if (existingConsumption) {
          // Atualizar quantidade existente
          return {
            ...person,
            itemConsumptions: person.itemConsumptions.map(ic =>
              ic.itemId === itemId ? { ...ic, quantity: ic.quantity + quantity } : ic
            ),
          };
        } else {
          // Adicionar novo consumo
          return {
            ...person,
            itemConsumptions: [
              ...person.itemConsumptions,
              { itemId, personId, quantity },
            ],
          };
        }
      }),
    }));
  };

  const setItemConsumptions = (itemId: string, consumptions: ItemConsumption[]) => {
    setBill(prev => ({
      ...prev,
      people: prev.people.map(person => {
        const filteredConsumptions = person.itemConsumptions.filter(ic => ic.itemId !== itemId);
        const consumption = consumptions.find(c => c.personId === person.id);

        if (!consumption) {
          return { ...person, itemConsumptions: filteredConsumptions };
        }

        return { ...person, itemConsumptions: [...filteredConsumptions, consumption] };
      }),
    }));
  };

  const distributeItemEqually = (itemId: string, selectedPeopleIds: string[]) => {
    const item = bill.items.find(i => i.id === itemId);
    if (!item) return;

    const consumptions = CalculationService.distributeItemEqually(item, selectedPeopleIds);
    setItemConsumptions(itemId, consumptions);
  };

  const distributeItemCustom = (itemId: string, consumptions: ItemConsumption[]) => {
    setItemConsumptions(itemId, consumptions);
  };

  const updateSettings = (settings: Partial<BillSettings>) => {
    setBill(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  const calculateResults = (): BillResult[] => {
    return CalculationService.calculateDetailedSplit(bill);
  };

  const clearBill = () => {
    setBill(initialBill);
    setCurrentEntryMeta(null);
    StorageService.clearCurrentBill();
  };

  const saveBill = async () => {
    await StorageService.saveDetailedBill(bill);
  };

  const loadBill = async () => {
    const savedBill = await StorageService.loadDetailedBill();
    if (savedBill) {
      setBill({
        ...initialBill,
        ...savedBill,
        settings: { ...initialBill.settings, ...savedBill.settings },
        title: savedBill.title || '',
        note: savedBill.note || '',
      });
    }
  };

  const loadBillFromHistory = (entry: BillHistoryEntry) => {
    if (entry.type !== 'detailed') return;
    const detailedBill = entry.bill as DetailedBill;
    const resolvedTitle =
      detailedBill.title ||
      entry.title ||
      entry.name ||
      new Date(entry.createdAt).toLocaleString();
    const mergedBill: DetailedBill = {
      ...initialBill,
      ...detailedBill,
      settings: { ...initialBill.settings, ...detailedBill.settings },
      title: resolvedTitle || '',
      note: detailedBill.note || entry.note || '',
    };
    setBill(mergedBill);
    setCurrentEntryMeta({ id: entry.id, name: resolvedTitle, createdAt: entry.createdAt });
    StorageService.saveDetailedBill(mergedBill);
  };

  // Auto-save quando o bill mudar
  useEffect(() => {
    if (bill.people.length > 0 || bill.items.length > 0) {
      saveBill();
    }
  }, [bill]);

  return (
    <BillContext.Provider
      value={{
        bill,
        currentEntryMeta,
        updateBillInfo,
        addPerson,
        removePerson,
        addItem,
        removeItem,
        addItemConsumption,
        distributeItemEqually,
        distributeItemCustom,
        updateSettings,
        calculateResults,
        loadBillFromHistory,
        setCurrentEntryMeta,
        clearBill,
        saveBill,
        loadBill,
      }}
    >
      {children}
    </BillContext.Provider>
  );
};

export const useBill = () => {
  const context = useContext(BillContext);
  if (!context) {
    throw new Error('useBill deve ser usado dentro de BillProvider');
  }
  return context;
};
