
export interface BalanceRecord {
  id: string;
  amount: number;
  date: string;
  referenceMonth?: string; // Format YYYY-MM
  description: string;
}

export interface User {
  id: string;
  name: string;
  balances: BalanceRecord[];
  isHidden?: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  brand: string; // Ex: Visa, Master, Elo, etc.
  dueDay: number;
  isHidden?: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  location: string;
  type?: string; // e.g. 'Alimentação', 'Transporte', etc.
  date: string; // Purchase date (ISO format)
  paymentStartMonth?: string; // Format YYYY-MM
  totalValue: number;
  installments: number; // 1 for single payment
  userId: string;
  cardId?: string; // If undefined, it's a direct payment
  isPaid: boolean;
  isHidden: boolean;
  isSubscription?: boolean; // If true, totalValue is used for EACH month. If false, totalValue / installments.
}

export type AppTab = 'pagamentos' | 'cartoes' | 'resumo';

export interface ColumnVisibility {
  description: boolean;
  location: boolean;
  date: boolean;
  value: boolean;
  installments: boolean;
  user: boolean;
}
