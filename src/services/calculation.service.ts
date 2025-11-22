// src/services/calculation.service.ts

import { SimpleBill, DetailedBill, BillResult, Item, Person, ItemConsumption } from '../types/bill.types';

export class CalculationService {
  /**
   * Divisão Simples
   */
  static calculateSimpleSplit(bill: SimpleBill): number {
    const serviceFee = bill.totalAmount * (bill.serviceFeePercentage / 100);
    const totalWithFee = bill.totalAmount + serviceFee;
    return totalWithFee / bill.numberOfPeople;
  }

  /**
   * Divisão Detalhada (Itemizada)
   */
  static calculateDetailedSplit(bill: DetailedBill): BillResult[] {
    const { people, items, settings } = bill;

    // 1. Calcular o consumo de cada pessoa
    const results: BillResult[] = people.map(person => {
      const itemsDetail = this.calculatePersonItems(person, items);
      const itemsTotal = itemsDetail.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        personId: person.id,
        personName: person.name,
        itemsTotal,
        serviceFee: 0, // Será calculado depois
        totalToPay: 0, // Será calculado depois
        itemsDetail,
      };
    });

    // 2. Calcular taxa de serviço
    const totalBillAmount = results.reduce((sum, r) => sum + r.itemsTotal, 0);
    const totalServiceFee = totalBillAmount * (settings.serviceFeePercentage / 100);

    if (settings.serviceFeeMode === 'equal') {
      // Divisão igualitária da gorjeta
      const serviceFeePerPerson = totalServiceFee / people.length;
      results.forEach(result => {
        result.serviceFee = serviceFeePerPerson;
        result.totalToPay = result.itemsTotal + result.serviceFee;
      });
    } else {
      // Divisão proporcional ao consumo
      results.forEach(result => {
        const proportion = result.itemsTotal / totalBillAmount;
        result.serviceFee = totalServiceFee * proportion;
        result.totalToPay = result.itemsTotal + result.serviceFee;
      });
    }

    return results;
  }

  /**
   * Calcula os itens consumidos por uma pessoa
   */
  private static calculatePersonItems(
    person: Person,
    items: Item[]
  ): BillResult['itemsDetail'] {
    const itemsDetail: BillResult['itemsDetail'] = [];

    person.itemConsumptions.forEach(consumption => {
      const item = items.find(i => i.id === consumption.itemId);
      if (!item) return;

      const unitPrice = item.price / item.totalQuantity;
      const subtotal = unitPrice * consumption.quantity;

      itemsDetail.push({
        itemName: item.name,
        quantity: consumption.quantity,
        unitPrice,
        subtotal,
      });
    });

    return itemsDetail;
  }

  /**
   * Distribuir item igualmente entre pessoas selecionadas
   */
  static distributeItemEqually(
    item: Item,
    selectedPeopleIds: string[]
  ): ItemConsumption[] {
    const quantityPerPerson = item.totalQuantity / selectedPeopleIds.length;

    return selectedPeopleIds.map(personId => ({
      itemId: item.id,
      personId,
      quantity: quantityPerPerson,
    }));
  }
}