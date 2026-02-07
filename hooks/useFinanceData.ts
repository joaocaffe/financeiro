import { useState, useEffect, useCallback } from 'react';
import { Transaction, User, CreditCard, BalanceRecord } from '../types';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Mappers to convert between DB snake_case and Frontend camelCase
const mapTransactionFromDB = (tx: any): Transaction => ({
    id: tx.id,
    description: tx.description,
    location: tx.location,
    type: tx.type,
    date: tx.date,
    paymentStartMonth: tx.payment_start_month,
    totalValue: Number(tx.total_value),
    installments: tx.installments,
    userId: tx.app_user_id,
    cardId: tx.card_id,
    isPaid: tx.is_paid,
    isHidden: tx.is_hidden,
    isSubscription: tx.is_subscription,
    installmentsPaid: tx.installments_paid,
    purchaseDate: tx.purchase_date,
});

const mapTransactionToDB = (tx: Partial<Transaction>, ownerId: string) => ({
    owner_id: ownerId,
    description: tx.description,
    location: tx.location,
    type: tx.type,
    date: tx.date,
    payment_start_month: tx.paymentStartMonth,
    total_value: tx.totalValue,
    installments: tx.installments,
    app_user_id: tx.userId,
    card_id: tx.cardId || null,
    is_paid: tx.isPaid,
    is_hidden: tx.isHidden,
    is_subscription: tx.isSubscription,
    installments_paid: tx.installmentsPaid,
    purchase_date: tx.purchaseDate,
});

const mapUserFromDB = (u: any, balances: any[]): User => ({
    id: u.id,
    name: u.name,
    isHidden: u.is_hidden,
    balances: balances.filter(b => b.app_user_id === u.id).map(b => ({
        id: b.id,
        amount: Number(b.amount),
        date: b.date,
        referenceMonth: b.reference_month,
        description: b.description
    }))
});

const mapCardFromDB = (c: any): CreditCard => ({
    id: c.id,
    name: c.name,
    brand: c.brand,
    dueDay: c.due_day,
    isHidden: c.is_hidden,
    position: c.position
});

export const useFinanceData = () => {
    const { user: authUser } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!authUser) return;
        setLoading(true);

        try {
            const { data: usersData } = await supabase.from('finance_users').select('*').order('created_at', { ascending: true });
            const { data: cardsData } = await supabase.from('credit_cards').select('*').order('position', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
            const { data: txData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
            const { data: balancesData } = await supabase.from('balances').select('*');
            const { data: typesData } = await supabase.from('transaction_types').select('*');

            if (usersData) {
                const mappedUsers = usersData.map(u => mapUserFromDB(u, balancesData || []));
                setUsers(mappedUsers);
            }
            if (cardsData) setCards(cardsData.map(mapCardFromDB));
            if (txData) setTransactions(txData.map(mapTransactionFromDB));
            if (typesData && typesData.length > 0) {
                setTransactionTypes(typesData.map((t: any) => t.name));
            } else {
                setTransactionTypes(['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Moradia', 'Outros']);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [authUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Transactions ---

    const addTransaction = async (tx: Transaction) => {
        if (!authUser) return;
        // optimistic update
        const tempId = Math.random().toString(36).substr(2, 9);
        const newTx = { ...tx, id: tempId };
        setTransactions(prev => [newTx, ...prev]);

        const dbPayload = mapTransactionToDB(tx, authUser.id);
        const { data, error } = await supabase.from('transactions').insert(dbPayload).select().single();

        if (data) {
            setTransactions(prev => prev.map(t => t.id === tempId ? mapTransactionFromDB(data) : t));
        } else if (error) {
            console.error('Error adding transaction:', error);
            setTransactions(prev => prev.filter(t => t.id !== tempId)); // Revert
        }
    };

    const updateTransaction = async (id: string, updated: Transaction) => {
        if (!authUser) return;
        setTransactions(prev => prev.map(t => t.id === id ? updated : t));
        const dbPayload = mapTransactionToDB(updated, authUser.id);
        await supabase.from('transactions').update(dbPayload).eq('id', id);
    };

    const deleteTransaction = async (id: string) => {
        if (confirm("Deseja realmente excluir este lançamento?")) {
            setTransactions(prev => prev.filter(t => t.id !== id));
            await supabase.from('transactions').delete().eq('id', id);
        }
    };

    const togglePaid = async (id: string) => {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
            const updated = { ...tx, isPaid: !tx.isPaid };
            updateTransaction(id, updated);
        }
    };

    const toggleHidden = async (id: string) => {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
            const updated = { ...tx, isHidden: !tx.isHidden };
            updateTransaction(id, updated);
        }
    };

    // --- Cards ---

    const addCard = async (card: CreditCard) => {
        if (!authUser) return;
        const tempId = Math.random().toString(36).substr(2, 9);
        setCards(prev => [...prev, { ...card, id: tempId }]);

        const { data, error } = await supabase.from('credit_cards').insert({
            owner_id: authUser.id,
            name: card.name,
            brand: card.brand,
            due_day: card.dueDay,
            is_hidden: card.isHidden,
            position: card.position ?? (cards.length > 0 ? Math.max(...cards.map(c => c.position || 0)) + 1 : 0)
        }).select().single();

        if (data) {
            setCards(prev => prev.map(c => c.id === tempId ? mapCardFromDB(data) : c));
        } else if (error) {
            console.error(error);
            setCards(prev => prev.filter(c => c.id !== tempId));
        }
    };

    const updateCard = async (id: string, updated: CreditCard) => {
        setCards(prev => prev.map(c => c.id === id ? updated : c));
        await supabase.from('credit_cards').update({
            name: updated.name,
            brand: updated.brand,
            due_day: updated.dueDay,
            is_hidden: updated.isHidden
        }).eq('id', id);
    };

    const deleteCard = async (id: string) => {
        setCards(prev => prev.filter(c => c.id !== id));
        await supabase.from('credit_cards').delete().eq('id', id);
    };

    const toggleCardHidden = async (id: string) => {
        const card = cards.find(c => c.id === id);
        if (card) {
            updateCard(id, { ...card, isHidden: !card.isHidden });
        }
    };

    const moveCard = async (id: string, direction: 'up' | 'down') => {
        const index = cards.findIndex(c => c.id === id);
        if (index === -1) return;

        const newCards = [...cards];
        let targetIndex = -1;

        if (direction === 'up') {
            if (index === 0) return;
            targetIndex = index - 1;
        } else {
            if (index === cards.length - 1) return;
            targetIndex = index + 1;
        }

        // Swap locally
        [newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]];

        // Update positions based on new index
        const updatedCards = newCards.map((c, i) => ({ ...c, position: i }));
        setCards(updatedCards);

        // Persist to Supabase
        // We only need to update the two swapped cards to minimize requests, 
        // OR update all if we want to ensure full consistency. 
        // Swapping positions is safer.
        const cardA = updatedCards[index];
        const cardB = updatedCards[targetIndex];

        await Promise.all([
            supabase.from('credit_cards').update({ position: cardA.position }).eq('id', cardA.id),
            supabase.from('credit_cards').update({ position: cardB.position }).eq('id', cardB.id)
        ]);
    };

    // --- Users ---

    const addUser = async (user: User) => {
        if (!authUser) return;
        const tempId = Math.random().toString(36).substr(2, 9);
        setUsers(prev => [...prev, { ...user, id: tempId }]);

        const { data, error } = await supabase.from('finance_users').insert({
            owner_id: authUser.id,
            name: user.name,
            is_hidden: user.isHidden
        }).select().single();

        if (data) {
            setUsers(prev => prev.map(u => u.id === tempId ? { ...u, id: data.id } : u));
        } else if (error) {
            console.error(error);
            setUsers(prev => prev.filter(u => u.id !== tempId));
        }
    };

    const updateUser = async (id: string, updated: User) => {
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
        await supabase.from('finance_users').update({
            name: updated.name,
            is_hidden: updated.isHidden
        }).eq('id', id);
    };

    const deleteUser = async (id: string) => {
        if (users.length <= 1) {
            alert("É necessário ter ao menos um usuário.");
            return false;
        }
        if (confirm("Excluir usuário?")) {
            setUsers(prev => prev.filter(u => u.id !== id));
            await supabase.from('finance_users').delete().eq('id', id);
            return true;
        }
        return false;
    };

    const toggleUserHidden = (id: string) => {
        const user = users.find(u => u.id === id);
        if (user) {
            updateUser(id, { ...user, isHidden: !user.isHidden });
        }
    };

    // --- Balances ---

    const addBalanceRecord = async (userId: string, record: BalanceRecord) => {
        if (!authUser) return;
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, balances: [...(u.balances || []), record] } : u));

        const { data, error } = await supabase.from('balances').insert({
            owner_id: authUser.id,
            app_user_id: userId,
            amount: record.amount,
            date: record.date,
            reference_month: record.referenceMonth,
            description: record.description
        }).select().single();

        // Update the local record ID with the real one from DB
        if (data) {
            setUsers(prev => prev.map(u => u.id === userId ? {
                ...u,
                balances: u.balances.map(b => b === record ? { ...b, id: data.id } : b)
            } : u));
        }
    };

    const deleteBalanceRecord = async (userId: string, recordId: string) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, balances: u.balances.filter(r => r.id !== recordId) } : u));
        await supabase.from('balances').delete().eq('id', recordId);
    };

    // --- Transaction Types ---

    const addTransactionType = async (type: string) => {
        if (!transactionTypes.includes(type) && authUser) {
            setTransactionTypes(prev => [...prev, type]);
            await supabase.from('transaction_types').insert({ owner_id: authUser.id, name: type });
        }
    };

    const deleteTransactionType = async (type: string) => {
        if (confirm(`Deseja excluir o tipo "${type}"?`)) {
            setTransactionTypes(prev => prev.filter(t => t !== type));
            await supabase.from('transaction_types').delete().eq('name', type);
        }
    };

    return {
        transactions,
        users,
        cards,
        transactionTypes,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        togglePaid,
        toggleHidden,
        addCard,
        updateCard,
        deleteCard,
        toggleCardHidden,
        addUser,
        updateUser,
        deleteUser,
        toggleUserHidden,
        addBalanceRecord,
        deleteBalanceRecord,
        addTransactionType,
        deleteTransactionType,
        moveCard
    };
};
