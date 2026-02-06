import { Transaction } from '../types';

export const calculateTransactionValue = (tx: Transaction): number => {
    if (tx.isSubscription) {
        return tx.totalValue;
    }
    const installments = (tx.installments && tx.installments > 0) ? tx.installments : 1;
    return tx.totalValue / installments;
};

export const calculateInstallments = (tx: Transaction): number => {
    return (tx.installments && tx.installments > 0) ? tx.installments : 1;
};

export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    // Ensure we only look at the YYYY-MM-DD part, even if it's an ISO string
    const cleanDate = dateString.substring(0, 10);
    const [year, month, day] = cleanDate.split('-');
    return `${day}/${month}/${year}`;
};
