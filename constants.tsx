
import React from 'react';
import { CreditCard } from './types';

export const INITIAL_USERS = [
  { id: '1', name: 'Usuário 1' },
  { id: '2', name: 'Usuário 2' }
];

export const INITIAL_CARDS: CreditCard[] = [
  { id: 'c1', name: 'Visa Platinum', brand: 'Visa', dueDay: 12 },
  { id: 'c2', name: 'Mastercard Black', brand: 'Mastercard', dueDay: 28 }
];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
