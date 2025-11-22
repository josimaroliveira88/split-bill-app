// src/utils/formatters.ts

export const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace('.', ',');
};

export const formatCurrencyWithSymbol = (value: number): string => {
  return `R$ ${formatCurrency(value)}`;
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(',', '.')) || 0;
};