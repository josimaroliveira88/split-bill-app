// src/context/BillContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DetailedBill, Person, Item, ItemConsumption, BillSettings, BillResult } from '../types/bill.types';
import { StorageService } from '../services/storage.service';
import { CalculationService } from '../services/calculation.service';

interface BillContextData {
  bill: DetailedBill;
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  addItem: (name: string, price: number, quantity: number) => void;
  removeItem: (id: string) => void;
  addItemConsumption: (itemId: string, personId: string, quantity: number) => void;
  distributeItemEqually: (itemId: string, selectedPeopleIds: string[]) => void;
  updateSettings: (settings: Partial<BillSettings>) => void;
  calculateResults: () => BillResult[];
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
};

export const BillProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bill, setBill] = useState<DetailedBill>(initialBill);

  // Carregar dados ao iniciar
  useEffect(() => {
    loadBill();
  }, []);

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

  const addItem = (name: string, price: number, quantity: number) => {
    const newItem: Item = {
      id: Date.now().toString(),
      name,
      price,
      totalQuantity: quantity,
    };
    setBill(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
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

  const distributeItemEqually = (itemId: string, selectedPeopleIds: string[]) => {
    const item = bill.items.find(i => i.id === itemId);
    if (!item) return;

    const consumptions = CalculationService.distributeItemEqually(item, selectedPeopleIds);

    setBill(prev => ({
      ...prev,
      people: prev.people.map(person => {
        const consumption = consumptions.find(c => c.personId === person.id);
        if (!consumption) return person;

        // Remover consumo anterior deste item
        const filteredConsumptions = person.itemConsumptions.filter(ic => ic.itemId !== itemId);

        return {
          ...person,
          itemConsumptions: [...filteredConsumptions, consumption],
        };
      }),
    }));
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
    StorageService.clearCurrentBill();
  };

  const saveBill = async () => {
    await StorageService.saveDetailedBill(bill);
  };

  const loadBill = async () => {
    const savedBill = await StorageService.loadDetailedBill();
    if (savedBill) {
      setBill(savedBill);
    }
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
        addPerson,
        removePerson,
        addItem,
        removeItem,
        addItemConsumption,
        distributeItemEqually,
        updateSettings,
        calculateResults,
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