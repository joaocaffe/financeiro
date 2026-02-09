
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CreditCard as CardIcon,
  Wallet,
  PieChart,
  Plus,
  Filter,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Trash2,
  CheckCircle2,
  Circle,
  UserPlus,
  TrendingUp,
  Calculator,
  TrendingDown,
  DollarSign,
  LayoutDashboard,
  Users,
  Pencil,
  X,
  History,
  Calendar,
  Clock,
  AlertCircle,
  Settings2,
  Copy,
  RefreshCcw,
  Receipt,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Zap,
  Sparkles,

  CreditCard as CardBrandIcon,
  Search,
  MoreVertical,
  CalendarDays,
  ListChecks,
  CheckSquare,
  Square,
  AlertTriangle,
  SlidersHorizontal,
  CalendarRange,
  BarChart3,
  Columns,
  Check,
  BarChart,
  Repeat,
  ArrowUp,
  ArrowDown,
  Printer,
  LogOut
} from 'lucide-react';
import { AppTab, Transaction, User, CreditCard, ColumnVisibility, BalanceRecord } from './types';
import { INITIAL_USERS, INITIAL_CARDS, MONTHS } from './constants';
import { TabButton } from './components/TabButton';

const USER_COLORS = [
  '#f87171', // red-400 (soft)
  '#fb923c', // orange-400
  '#fbbf24', // amber-400
  '#facc15', // yellow-400
  '#a3e635', // lime-400
  '#4ade80', // green-400
  '#34d399', // emerald-400
  '#2dd4bf', // teal-400
  '#22d3ee', // cyan-400
  '#38bdf8', // sky-400
  '#60a5fa', // blue-400
  '#818cf8', // indigo-400
  '#a78bfa', // violet-400
  '#c084fc', // purple-400
  '#e879f9', // fuchsia-400
  '#f472b6', // pink-400
  '#cbd5e1', // slate-300
  '#94a3b8', // slate-400
  '#64748b', // slate-500
  '#475569'  // slate-600
];
import { EmptyState } from './components/EmptyState';
import { DashboardCard } from './components/DashboardCard';
import { TransactionItem } from './components/TransactionItem';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useFinanceData } from './hooks/useFinanceData';
import { useFilters } from './hooks/useFilters';
import { ExpensesPieChart } from './components/ExpensesPieChart';
import { ReportView } from './components/ReportView';
import { CalculatorModal } from './components/CalculatorModal';








// --- Main App Component ---

const Dashboard: React.FC = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('pagamentos');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const contentRef = useRef<HTMLElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const visibilityMenuRef = useRef<HTMLDivElement>(null);

  const {
    transactions,
    users,
    cards,
    addTransaction: hookAddTransaction,
    updateTransaction: hookUpdateTransaction,
    deleteTransaction: hookDeleteTransaction,
    togglePaid: hookTogglePaid,
    toggleHidden: hookToggleHidden,
    addCard: hookAddCard,
    updateCard: hookUpdateCard,
    deleteCard: hookDeleteCard,
    toggleCardHidden: hookToggleCardHidden,
    addUser: hookAddUser,
    updateUser: hookUpdateUser,
    deleteUser: hookDeleteUser,
    toggleUserHidden: hookToggleUserHidden,
    addBalanceRecord: hookAddBalanceRecord,
    deleteBalanceRecord: hookDeleteBalanceRecord,
    transactionTypes,
    addTransactionType: hookAddTransactionType,
    deleteTransactionType: hookDeleteTransactionType,
    moveCard,
    loading
  } = useFinanceData();


  const {
    selectedUserIds, setSelectedUserIds,
    selectedCardIds, setSelectedCardIds,
    isMultiSelectMode, setIsMultiSelectMode,
    projectionRange, setProjectionRange,
    isProjectionCardMenuOpen, setIsProjectionCardMenuOpen,
    showHiddenItems, setShowHiddenItems,
    includeHiddenInStats, setIncludeHiddenInStats,
    showDashboard, setShowDashboard,
    showCardsInDashboard, setShowCardsInDashboard,
    showProjection, setShowProjection,

    showUserSummary, setShowUserSummary,
    showQuickActions, setShowQuickActions,
    currentDate, setCurrentDate,
    periodType, setPeriodType,
    startDate, setStartDate,
    endDate, setEndDate,
    visibility, setVisibility,
    changeMonth,
    handleUserToggle,
    handleCardToggle,
    sortConfig, setSortConfig
  } = useFilters();


  const [isAdding, setIsAdding] = useState(false);
  const [isManagingUsers, setIsManagingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [expandedUserBalances, setExpandedUserBalances] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [copiedTransaction, setCopiedTransaction] = useState<Transaction | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState<'general' | 'cards'>('general');
  const [chartType, setChartType] = useState<'payments' | 'cards'>('cards');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }

      if (visibilityMenuRef.current && !visibilityMenuRef.current.contains(event.target as Node)) {
        setIsVisibilityMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initialTxState: Partial<Transaction> = {
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    paymentStartMonth: new Date().toISOString().slice(0, 7),
    totalValue: 0,
    installments: 1,
    userId: users[0]?.id || '',
    isPaid: false,
    isHidden: false,
    isSubscription: false,
    type: '',
    installmentsPaid: undefined,
    purchaseDate: undefined
  };

  const initialCardState: Partial<CreditCard> = {
    name: '',
    brand: 'Visa',
    dueDay: 10,
    isHidden: false
  };

  const [newTx, setNewTx] = useState<Partial<Transaction>>(initialTxState);
  const [newCard, setNewCard] = useState<Partial<CreditCard>>(initialCardState);
  const [userForm, setUserForm] = useState<{ name: string; color?: string }>({ name: '' });
  const [balanceForm, setBalanceForm] = useState({ amount: 0, date: new Date().toISOString().split('T')[0], referenceMonth: new Date().toISOString().slice(0, 7), description: '' });





  const addTransaction = () => {
    if (!newTx.description || !newTx.totalValue) return;
    if (editingTransactionId) {
      const txToUpdate = transactions.find(t => t.id === editingTransactionId);
      if (txToUpdate) {
        hookUpdateTransaction(editingTransactionId, { ...txToUpdate, ...newTx as Transaction });
      }
      setEditingTransactionId(null);
    } else {
      const tx: Transaction = { ...newTx as Transaction, id: Math.random().toString(36).substr(2, 9) };
      hookAddTransaction(tx);
    }
    setIsAdding(false);
    setNewTx(initialTxState);
  };


  const saveCard = () => {
    if (!newCard.name) return;
    if (editingCardId) {
      const cardToUpdate = cards.find(c => c.id === editingCardId);
      if (cardToUpdate) {
        hookUpdateCard(editingCardId, { ...cardToUpdate, ...newCard as CreditCard });
      }
      setEditingCardId(null);
    } else {
      const card: CreditCard = { ...newCard as CreditCard, id: Math.random().toString(36).substr(2, 9) };
      hookAddCard(card);
    }
    setIsAddingCard(false);
    setNewCard(initialCardState);
  };

  const deleteCard = (id: string) => {
    hookDeleteCard(id);
    if (expandedCardId === id) setExpandedCardId(null);
    setCardToDelete(null);
  };

  const startEditingCard = (card: CreditCard) => {
    setNewCard(card);
    setEditingCardId(card.id);
    setIsAddingCard(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCardHidden = (id: string) => {
    hookToggleCardHidden(id);
  };

  const startEditingTransaction = (tx: Transaction) => {
    setNewTx(tx);
    setEditingTransactionId(tx.id);
    setIsAdding(true);
    setIsManagingUsers(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const duplicateTransaction = (tx: Transaction) => {
    const duplicated: Transaction = { ...tx, id: Math.random().toString(36).substr(2, 9), isPaid: false };
    setNewTx(duplicated);
    setEditingTransactionId(null);
    setIsAdding(true);
    setIsManagingUsers(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const registerCardPayment = (card: CreditCard, amount: number) => {
    const userToSet = selectedUserIds.length > 0 && !selectedUserIds.includes('all') ? selectedUserIds[0] : users[0]?.id;
    setNewTx({
      ...initialTxState,
      description: `Pagam. Fatura ${card.name}`,
      location: 'Banco',
      totalValue: amount,
      userId: userToSet,
      date: new Date().toISOString().split('T')[0],
      paymentStartMonth: currentDate.toISOString().slice(0, 7),
    });
    setEditingTransactionId(null);
    setIsAdding(true);
    setIsManagingUsers(false);
    setShowQuickActions(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setEditingTransactionId(null);
    setNewTx(initialTxState);
  };

  const copyTransaction = (tx: Transaction) => {
    setCopiedTransaction(tx);
  };

  const pasteTransaction = () => {
    if (!copiedTransaction) return;

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Parse original date to get the day
    const [origY, origM, origD] = copiedTransaction.date.split('-').map(Number);

    // Determine the safe day for the new month
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const safeDay = Math.min(origD, lastDayOfMonth);
    const newDateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;

    // Calculate new Payment Start Month if it exists
    let newPaymentStartMonth = undefined;
    if (copiedTransaction.paymentStartMonth) {
      newPaymentStartMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    }

    setNewTx({
      ...copiedTransaction,
      date: newDateString,
      paymentStartMonth: newPaymentStartMonth,
      id: undefined, // Clear ID to create new
      isPaid: false, // Reset paid status
    });

    setEditingTransactionId(null);
    setIsAdding(true);
    setIsManagingUsers(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveUser = () => {
    if (!userForm.name) return;
    if (editingUser) {
      hookUpdateUser(editingUser.id, { ...editingUser, name: userForm.name, color: userForm.color });
      setEditingUser(null);
    } else {
      const user: User = { id: Math.random().toString(36).substr(2, 9), name: userForm.name, color: userForm.color, balances: [] };
      hookAddUser(user);
    }
    setUserForm({ name: '' });
  };

  const addBalanceRecord = (userId: string) => {
    if (!balanceForm.amount) return;
    const record: BalanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      amount: balanceForm.amount,
      date: balanceForm.date,
      referenceMonth: balanceForm.referenceMonth,
      description: balanceForm.description || 'Aporte de Saldo'
    };
    hookAddBalanceRecord(userId, record);
    setBalanceForm({ amount: 0, date: new Date().toISOString().split('T')[0], referenceMonth: new Date().toISOString().slice(0, 7), description: '' });
  };

  const deleteBalanceRecord = (userId: string, recordId: string) => {
    hookDeleteBalanceRecord(userId, recordId);
  };

  const deleteUser = (id: string) => {
    if (hookDeleteUser(id)) {
      setSelectedUserIds(prev => prev.filter(uid => uid !== id));
    }
  };

  const togglePaid = (id: string) => hookTogglePaid(id);
  const toggleHidden = (id: string) => hookToggleHidden(id);
  const deleteTransaction = (id: string) => {
    hookDeleteTransaction(id);
  };

  const periodTransactions = useMemo(() => {
    const isMensal = periodType === 'mensal';
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const startRange = new Date(startDate);
    const endRange = new Date(endDate);
    endRange.setHours(23, 59, 59, 999);
    const currentMonthStart = new Date(year, month, 1);

    return transactions.flatMap(tx => {
      const results = [];

      // Fix: Parse date components manually to avoid UTC conversion shifts and preserve the exact day
      // Handle potential ISO strings by taking only the first 10 chars
      const cleanDate = tx.date.substring(0, 10);
      const [txY, txM, txD] = cleanDate.split('-').map(Number);

      // Universal Base Date Logic
      // Base Date is ALWAYS the original date (for the Day anchor)
      const baseDate = new Date(txY, txM - 1, txD);

      // Start Month Logic
      let startMonthIndex;
      if (tx.paymentStartMonth) {
        const [pmY, pmM] = tx.paymentStartMonth.split('-').map(Number);
        startMonthIndex = pmY * 12 + (pmM - 1);
      } else {
        startMonthIndex = baseDate.getFullYear() * 12 + baseDate.getMonth();
      }

      if (tx.isSubscription) {
        if (isMensal) {
          const currentMonthIndex = year * 12 + month;

          if (currentMonthIndex >= startMonthIndex) {

            // Calculate how many months have passed since the recurrence START
            const monthsSinceStart = currentMonthIndex - startMonthIndex;

            // Project the Base Date forward by that amount
            // This ensures sequence continuity:
            // If Base=Jan, Start=Feb.
            // Feb View (Offset 0) -> Base + 0 = Jan (25/01)
            // Mar View (Offset 1) -> Base + 1 = Feb (25/02)

            // Construct Target Date logic manualy to handle overflow
            // Target Year/Month
            const totalMonths = (baseDate.getFullYear() * 12 + baseDate.getMonth()) + monthsSinceStart;
            const tYear = Math.floor(totalMonths / 12);
            const tMonth = totalMonths % 12;

            const lastDayOfTarget = new Date(tYear, tMonth + 1, 0).getDate();
            const safeDay = Math.min(txD, lastDayOfTarget);

            const dDay = String(safeDay).padStart(2, '0');
            const dMonth = String(tMonth + 1).padStart(2, '0');
            const displayDate = `${tYear}-${dMonth}-${dDay}`;

            results.push({ ...tx, currentInstallment: 'Recorrente', date: displayDate });
          }
        } else {

          const endMonthIndex = endRange.getFullYear() * 12 + endRange.getMonth();
          const viewStartMonthIndex = startRange.getFullYear() * 12 + startRange.getMonth();
          const loopStart = Math.max(startMonthIndex, viewStartMonthIndex);

          for (let idx = loopStart; idx <= endMonthIndex; idx++) {
            const monthsSinceStart = idx - startMonthIndex;

            const totalMonths = (baseDate.getFullYear() * 12 + baseDate.getMonth()) + monthsSinceStart;
            const tYear = Math.floor(totalMonths / 12);
            const tMonth = totalMonths % 12;

            const lastDay = new Date(tYear, tMonth + 1, 0).getDate();
            const safeDay = Math.min(txD, lastDay);

            const dateObj = new Date(tYear, tMonth, safeDay);

            if (dateObj >= startRange && dateObj <= endRange) {
              const dDay = String(safeDay).padStart(2, '0');
              const dMonth = String(tMonth + 1).padStart(2, '0');
              const safeDateStr = `${tYear}-${dMonth}-${dDay}`;
              results.push({
                ...tx,
                currentInstallment: 'Recorrente',
                date: safeDateStr
              });
            }
          }
        }
      } else {
        const paidCount = tx.installmentsPaid || 0;
        const remainingInstallments = tx.installments - paidCount;

        for (let i = 0; i < remainingInstallments; i++) {

          const globalMonthIndex = startMonthIndex + i;

          // Installments also start from the Base Date sequence
          // If Base=Jan, Start=Feb.
          // Installment 1 (Feb, i=0) -> Base + 0 = Jan.

          const monthsDuration = i; // 0, 1, 2...
          const totalMonths = (baseDate.getFullYear() * 12 + baseDate.getMonth()) + monthsDuration;

          const tYear = Math.floor(totalMonths / 12);
          const tMonth = totalMonths % 12;

          const lastDay = new Date(tYear, tMonth + 1, 0).getDate();
          const safeDay = Math.min(txD, lastDay);

          const dDay = String(safeDay).padStart(2, '0');
          const dMonth = String(tMonth + 1).padStart(2, '0');
          const safeDateStr = `${tYear}-${dMonth}-${dDay}`;
          const dateObj = new Date(tYear, tMonth, safeDay);

          // We need to check if this installment Falls in the current View Month (globalMonthIndex)
          // `globalMonthIndex` is the budget slot.
          // `tYear/tMonth` is the display date slot.

          const budgetYear = Math.floor(globalMonthIndex / 12);
          const budgetMonth = globalMonthIndex % 12;

          if (isMensal) {
            // Show if Budget Slot matches View Month
            const isThisMonth = budgetMonth === month && budgetYear === year;
            if (isThisMonth) {
              results.push({ ...tx, currentInstallment: i + 1 + paidCount, isOverdue: false, date: safeDateStr });
            }
          } else {
            // Range View: Check if BUDGET DATE implies visibility?
            // Usually range view checks the DISPLAY DATE.
            // But if I budget for Feb (Start), but date explains Jan (25/01).
            // Does it appear in Jan range or Feb range?
            // User said: "starts appearing in Feb". So it enters the Feb list.
            // So we check `budgetYear/budgetMonth` against range?
            // Actually, usually range view filters by the 'date' property.
            // If valid date is 25/01, it falls in Jan range.
            // If user is viewing "Feb 1 to Feb 28", and date is 25/01... it won't show.
            // UNLESS we are filtering by `paymentStartMonth` logic?
            // Line 391 `periodTransactions` iterates transactions...
            // Logic at 441: `const isThisMonth = instMonth === month && instYear === year;`
            // This checks the BUDGET SLOT.
            // So yes, it will appear in Feb.
            // But it will have `date: '2026-01-25'`.
            // `visibleTransactionsList` sorts by `date`.

            // Range view logic (lines 427-432 in ORIGINAL, or my replacement):
            // I was checking `dateObj >= startRange`.
            // `dateObj` is `safeDateStr` (Jan 25).
            // If Range is Feb 1 - Feb 28. Jan 25 is NOT in range.
            // So it won't appear in Range View if we filter by `date`.
            // But in Monthly View it DOES appear because we filter by `isThisMonth` (Budget Slot).

            // FIX: For Range view, we should probably check if the BUDGET slot is in range?
            // The user mainly uses Monthly view.
            // But for consistency:
            const budgetDate = new Date(budgetYear, budgetMonth, 1);
            const budgetEnd = new Date(budgetYear, budgetMonth + 1, 0);
            // Check intersection? Or just check if budget month starts in range?
            // Simple: check if budgetDate is within [startRange, endRange] (roughly)

            // Actually, let's stick to Date check for Range View for now, as that's standard.
            // The specific user request is about "Repetir para os próximos meses" which usually implies Monthly View.
            // And specifically "starts appearing in Feb". (Monthly View).

            if (dateObj >= startRange && dateObj <= endRange) {
              results.push({ ...tx, currentInstallment: i + 1 + paidCount, date: safeDateStr });
            }
          }
        }
      }
      return results;
    });
  }, [transactions, currentDate, periodType, startDate, endDate]);

  const isUserVisible = (userId: string) => {
    if (selectedUserIds.includes('all')) return true;
    return selectedUserIds.includes(userId);
  };

  const isCardVisible = (cardId?: string) => {
    if (selectedCardIds.includes('all')) return true;
    if (!cardId) return selectedCardIds.includes('direto');
    return selectedCardIds.includes(cardId);
  };

  const visibleTransactionsList = useMemo(() => {
    let list = periodTransactions.filter(tx =>
      isUserVisible(tx.userId) && isCardVisible(tx.cardId) && (showHiddenItems || !tx.isHidden)
    );
    return list.sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const valA = a.totalValue;
        const valB = b.totalValue;
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
    });
  }, [periodTransactions, selectedUserIds, selectedCardIds, showHiddenItems, sortConfig]);

  const dashStats = useMemo(() => {
    const filteredUsers = selectedUserIds.includes('all') ? users : users.filter(u => selectedUserIds.includes(u.id));

    // Calculate formatted current month (YYYY-MM) manually to avoid timezone issues with toISOString()
    const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const saldoInicial = filteredUsers.reduce((acc, u) => {
      const userMonthBalances = (u.balances || []).filter(r => {
        // Use referenceMonth if available, otherwise fallback to record date
        const recordMonth = r.referenceMonth || r.date.slice(0, 7);
        return recordMonth === currentMonthStr;
      });
      return acc + userMonthBalances.reduce((sum, r) => sum + r.amount, 0);
    }, 0);

    const userTxs = periodTransactions.filter(t => isUserVisible(t.userId) && isCardVisible(t.cardId));
    const saldoTotalGasto = userTxs.filter(t => !t.cardId && (includeHiddenInStats || !t.isHidden)).reduce((acc, t) => acc + (t.isSubscription ? t.totalValue : t.totalValue / t.installments), 0);
    const saldoTotalCartao = userTxs.filter(t => t.cardId && (includeHiddenInStats || !t.isHidden)).reduce((acc, t) => acc + (t.isSubscription ? t.totalValue : t.totalValue / t.installments), 0);
    return { saldoInicial, saldoTotalGasto, saldoTotalCartao, saldoRestante: saldoInicial - saldoTotalGasto };
  }, [periodTransactions, users, selectedUserIds, selectedCardIds, includeHiddenInStats, currentDate]);

  const totalsByUser = useMemo(() => {
    const totals: Record<string, { total: number; payments: number; cards: number }> = {};
    users.forEach(u => totals[u.id] = { total: 0, payments: 0, cards: 0 });

    periodTransactions.filter(tx => includeHiddenInStats || !tx.isHidden).forEach(tx => {
      const val = (tx.isSubscription ? tx.totalValue : tx.totalValue / tx.installments);
      if (totals[tx.userId]) {
        totals[tx.userId].total += val;
        if (tx.cardId) {
          totals[tx.userId].cards += val;
        } else {
          totals[tx.userId].payments += val;
        }
      }
    });
    return totals;
  }, [periodTransactions, users, includeHiddenInStats]);

  const cardTotalsForUser = useMemo(() => {
    const totals: Record<string, number> = {};
    cards.forEach(c => totals[c.id] = 0);
    periodTransactions.filter(tx => tx.cardId && isUserVisible(tx.userId)).filter(tx => includeHiddenInStats || !tx.isHidden).forEach(tx => {
      if (tx.cardId) totals[tx.cardId] += (tx.isSubscription ? tx.totalValue : tx.totalValue / tx.installments);
    });
    return totals;
  }, [periodTransactions, cards, selectedUserIds, includeHiddenInStats]);

  const projectionData = useMemo(() => {
    const nextMonths = [];
    const now = new Date();
    for (let i = 0; i < projectionRange; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();

      const total = transactions.flatMap(tx => {
        // First check visibility filters to avoid unnecessary date calculations
        if (!isUserVisible(tx.userId) || !isCardVisible(tx.cardId) || (!includeHiddenInStats && tx.isHidden)) {
          return [];
        }

        const results = [];
        const baseDate = tx.paymentStartMonth ? new Date(tx.paymentStartMonth + '-02') : new Date(tx.date);

        if (tx.isSubscription) {
          // For subscriptions, check if the projection month is after the start date
          const startMonthIndex = baseDate.getFullYear() * 12 + baseDate.getMonth();
          const targetMonthIndex = y * 12 + m;

          if (targetMonthIndex >= startMonthIndex) {
            results.push(tx.totalValue);
          }
        } else {
          // For normal transactions, check specific installment months
          for (let j = 0; j < tx.installments; j++) {
            const instDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + j, 1);
            if (instDate.getMonth() === m && instDate.getFullYear() === y) {
              results.push(tx.totalValue / tx.installments);
            }
          }
        }
        return results;
      }).reduce((acc, val) => acc + val, 0);

      nextMonths.push({
        name: MONTHS[m],
        year: y,
        total,
        isCurrent: i === 0
      });
    }
    return nextMonths;
  }, [transactions, selectedUserIds, selectedCardIds, includeHiddenInStats, projectionRange]);





  const currentMonthName = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;





  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 max-w-md mx-auto bg-white shadow-xl overflow-hidden relative text-slate-900">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Finanças Pro</h1>
          <div className="flex gap-1">
            <button onClick={() => { setIsManagingUsers(!isManagingUsers); cancelAdding(); }} className={`p-2 transition-colors rounded-full ${isManagingUsers ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}><Users size={20} /></button>
            <button onClick={() => { setReportType('general'); setShowReport(true); }} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors" title="Gerar Relatório"><Printer size={20} /></button>
            {copiedTransaction && (
              <button
                onClick={pasteTransaction}
                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors relative"
                title="Colar Registro Copiado"
              >
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-white"></div>
                <Copy size={20} />
              </button>
            )}
            <button onClick={() => { if (isAdding) cancelAdding(); else setIsAdding(true); }} className={`p-2 rounded-full shadow-lg transition-all ${isAdding ? 'bg-slate-800' : 'bg-blue-600'} text-white`}><Plus size={20} /></button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {periodType === 'mensal' ? (
              <div className="flex items-center gap-2">
                <button onClick={() => changeMonth(-1)} className="p-1 text-slate-400"><ChevronLeft size={20} /></button>
                <span className="text-sm font-semibold text-slate-700 min-w-[120px] text-center">{currentMonthName}</span>
                <button onClick={() => changeMonth(1)} className="p-1 text-slate-400"><ChevronRight size={20} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1 animate-in fade-in duration-300">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-[10px] p-1.5 bg-slate-100 rounded-lg outline-none border-none font-bold text-slate-600 w-24"
                />
                <span className="text-slate-300">/</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-[10px] p-1.5 bg-slate-100 rounded-lg outline-none border-none font-bold text-slate-600 w-24"
                />
              </div>
            )}

            <button
              onClick={() => setPeriodType(periodType === 'mensal' ? 'periodo' : 'mensal')}
              className={`p-2 rounded-full transition-all ${periodType === 'periodo' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
              title="Filtrar por Período"
            >
              <CalendarRange size={18} />
            </button>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-full mx-auto">
            <button
              onClick={() => setSortConfig({ key: 'date', direction: sortConfig.key === 'date' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
              className={`p-1.5 rounded-full transition-all flex items-center gap-1 text-[10px] font-bold ${sortConfig.key === 'date' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Ordenar por Data"
            >
              Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
            </button>
            <button
              onClick={() => setSortConfig({ key: 'value', direction: sortConfig.key === 'value' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
              className={`p-1.5 rounded-full transition-all flex items-center gap-1 text-[10px] font-bold ${sortConfig.key === 'value' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Ordenar por Valor"
            >
              Valor {sortConfig.key === 'value' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
            </button>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <div className="relative" ref={visibilityMenuRef}>
              <button
                onClick={() => setIsVisibilityMenuOpen(!isVisibilityMenuOpen)}
                className={`p-2 rounded-full transition-all ${isVisibilityMenuOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
                title="Colunas Visíveis"
              >
                <Eye size={20} />
              </button>
              {isVisibilityMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1.5 border-b border-slate-50 mb-2">Colunas</p>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.keys(visibility).map((key) => (
                      <button
                        key={key}
                        onClick={() => setVisibility(v => ({ ...v, [key]: !v[key as keyof ColumnVisibility] }))}
                        className={`flex items-center justify-between text-[11px] font-bold px-3 py-2 rounded-xl transition-all ${visibility[key as keyof ColumnVisibility] ? 'text-blue-700 bg-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                        <span>{key === 'description' ? 'Descrição' : key === 'location' ? 'Local' : key === 'date' ? 'Data' : key === 'value' ? 'Valor' : key === 'installments' ? 'Parcelas' : 'Usuário'}</span>
                        {visibility[key as keyof ColumnVisibility] ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className={`p-2 rounded-full transition-all ${isFilterMenuOpen || !selectedUserIds.includes('all') || !selectedCardIds.includes('all') ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
                title="Configurar Filtros"
              >
                <SlidersHorizontal size={20} />
              </button>

              {isFilterMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                  <div className="px-2 py-2 mb-2 border-b border-slate-50 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros Avançados</p>
                    <button
                      onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                      className={`p-1.5 rounded-lg transition-all ${isMultiSelectMode ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-50'}`}
                      title="Ativar Multi-seleção"
                    >
                      <ListChecks size={16} />
                    </button>
                  </div>

                  <div className="space-y-4 max-h-80 overflow-y-auto no-scrollbar py-2">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter px-2 mb-2">Usuários</p>
                      <button onClick={() => handleUserToggle('all')} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${selectedUserIds.includes('all') ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <span>Todos</span>
                        {selectedUserIds.includes('all') && <CheckCircle2 size={12} />}
                      </button>
                      {users.map(u => (
                        <button key={u.id} onClick={() => handleUserToggle(u.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${selectedUserIds.includes(u.id) ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <span>{u.name}</span>
                          {selectedUserIds.includes(u.id) && <CheckCircle2 size={12} />}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter px-2 mb-2">Cartões</p>
                      <button onClick={() => handleCardToggle('all')} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${selectedCardIds.includes('all') ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <span>Todos</span>
                        {selectedCardIds.includes('all') && <CheckCircle2 size={12} />}
                      </button>
                      <button onClick={() => handleCardToggle('direto')} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${selectedCardIds.includes('direto') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <span>Dinheiro/Direto</span>
                        {selectedCardIds.includes('direto') && <CheckCircle2 size={12} />}
                      </button>
                      {cards.map(c => (
                        <button key={c.id} onClick={() => handleCardToggle(c.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${selectedCardIds.includes(c.id) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <span>{c.name}</span>
                          {selectedCardIds.includes(c.id) && <CheckCircle2 size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => { setShowHiddenItems(!showHiddenItems); setIsFilterMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold ${showHiddenItems ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      <span>Exibir Itens Ocultos</span>
                      {showHiddenItems ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>


          <div className="relative" ref={settingsRef}>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-full transition-all ${isSettingsOpen ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}>
              <Settings2 size={20} />
            </button>
            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in duration-150 origin-top-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 py-2 mb-1 border-b border-slate-50">Visualização</p>
                <button onClick={() => { setIncludeHiddenInStats(!includeHiddenInStats); setIsSettingsOpen(false); }} className={`w-full flex items-center justify-between text-[11px] font-semibold px-3 py-2.5 rounded-xl ${includeHiddenInStats ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span>Somar Ocultos</span>
                  {includeHiddenInStats ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={() => { setShowDashboard(!showDashboard); setIsSettingsOpen(false); }} className={`w-full flex items-center justify-between text-[11px] font-semibold px-3 py-2.5 rounded-xl ${!showDashboard ? 'bg-slate-100 text-slate-400' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span>Painel de Saldos</span>
                  {showDashboard ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={() => { setShowCardsInDashboard(!showCardsInDashboard); setIsSettingsOpen(false); }} className={`w-full flex items-center justify-between text-[11px] font-semibold px-3 py-2.5 rounded-xl ${!showCardsInDashboard ? 'bg-slate-100 text-slate-400' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span>Ver Cartões (Dashboard)</span>
                  {showCardsInDashboard ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={() => { setShowProjection(!showProjection); setIsSettingsOpen(false); }} className={`w-full flex items-center justify-between text-[11px] font-semibold px-3 py-2.5 rounded-xl ${!showProjection ? 'bg-slate-100 text-slate-400' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span>Ver Projeção</span>
                  {showProjection ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </header >

      {/* Confirmation Overlay for Card Deletion */}
      {
        cardToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Excluir Cartão?</h3>
              <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
                Deseja remover o cartão <b>{cards.find(c => c.id === cardToDelete)?.name}</b>? Os lançamentos associados não serão removidos.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => deleteCard(cardToDelete)}
                  className="w-full py-3.5 bg-red-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-red-200 active:scale-95 transition-all"
                >
                  Confirmar Exclusão
                </button>
                <button
                  onClick={() => setCardToDelete(null)}
                  className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm active:scale-95 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        showReport && (
          <ReportView
            transactions={periodTransactions.filter(tx => isUserVisible(tx.userId) && (reportType === 'cards' ? tx.cardId : !tx.cardId))}
            users={users}
            cards={cards}
            currentDate={currentDate}
            type={reportType}
            onClose={() => setShowReport(false)}
          />
        )
      }

      <main className="flex-1 overflow-y-auto px-4 py-6" ref={contentRef}>
        {isManagingUsers && (
          <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in slide-in-from-top duration-300 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-blue-800"><Users size={16} /> {editingUser ? 'Editar Usuário' : 'Usuários'}</h3>
              {editingUser && <button onClick={() => { setEditingUser(null); setUserForm({ name: '' }); }} className="text-blue-400 hover:bg-blue-100 p-1 rounded-full"><X size={16} /></button>}
            </div>
            <div className="space-y-3 mb-6 pb-6 border-b border-blue-100">
              <input placeholder="Nome do Usuário" className="w-full text-sm p-3 rounded-xl ring-1 ring-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />

              <div className="flex gap-2 flex-wrap justify-between p-2 bg-white rounded-xl ring-1 ring-blue-100">
                {USER_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setUserForm({ ...userForm, color: userForm.color === color ? undefined : color })}
                    className={`w-6 h-6 rounded-full transition-transform ${userForm.color === color ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              <button onClick={saveUser} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md active:bg-blue-700 transition-colors">{editingUser ? 'Salvar Alteração' : 'Adicionar Usuário'}</button>
            </div>
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="bg-white/80 rounded-2xl border border-blue-50 overflow-hidden">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: user.color, color: user.color ? '#fff' : undefined }}>{user.name.charAt(0)}</div>
                      <span className="text-xs font-bold text-slate-700">{user.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setExpandedUserBalances(expandedUserBalances === user.id ? null : user.id)} className={`p-1.5 rounded-lg transition-colors ${expandedUserBalances === user.id ? 'bg-blue-100 text-blue-600' : 'text-blue-400 hover:bg-blue-50'}`} title="Histórico/Saldos"><History size={16} /></button>
                      <button onClick={() => { setEditingUser(user); setUserForm({ name: user.name, color: user.color }); }} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Usuário"><Pencil size={16} /></button>
                      <button onClick={() => deleteUser(user.id)} className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Excluir Usuário"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  {expandedUserBalances === user.id && (
                    <div className="p-3 bg-slate-50 border-t border-blue-50 animate-in slide-in-from-top duration-200">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Gerenciar Saldo Inicial</h4>
                      <div className="space-y-2 mb-4">
                        <input type="number" placeholder="Valor" className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none" value={balanceForm.amount || ''} onChange={(e) => setBalanceForm({ ...balanceForm, amount: Number(e.target.value) })} />
                        <div className="flex gap-2">
                          <input type="date" className="flex-1 text-xs p-2 rounded-lg border border-slate-200 outline-none" value={balanceForm.date} onChange={(e) => setBalanceForm({ ...balanceForm, date: e.target.value })} />
                          <input type="month" className="flex-1 text-xs p-2 rounded-lg border border-slate-200 outline-none" value={balanceForm.referenceMonth} onChange={(e) => setBalanceForm({ ...balanceForm, referenceMonth: e.target.value })} />
                        </div>
                        <input type="text" placeholder="Obs" className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none" value={balanceForm.description} onChange={(e) => setBalanceForm({ ...balanceForm, description: e.target.value })} />
                        <button onClick={() => addBalanceRecord(user.id)} className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors"><Plus size={14} /> Novo Aporte</button>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {(user.balances || []).sort((a, b) => b.date.localeCompare(a.date)).map(record => (
                          <div key={record.id} className="flex items-center justify-between text-[10px] bg-white p-2 rounded-lg border border-slate-100">
                            <div>
                              <div className="flex items-center gap-1 font-bold text-slate-700"><Calendar size={10} className="text-slate-400" /> {new Date(record.date).toLocaleDateString('pt-BR')}</div>
                              <div className="text-slate-400 truncate max-w-[120px]">{record.description}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-600">R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <button onClick={() => deleteBalanceRecord(user.id, record.id)} className="text-slate-200 hover:text-red-400"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdding && (
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top duration-300 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Plus size={16} /> Novo Registro</h3>
              <button onClick={cancelAdding} className="text-slate-400 hover:bg-slate-200 p-1 rounded-full"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Descrição do Gasto</label>
                <input placeholder="Ex: Mercado, Combustível..." className="w-full text-sm p-3 rounded-xl border-none ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={newTx.description} onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Categoria</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 text-sm p-3 rounded-xl border-none ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    value={newTx.type || ''}
                    onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {transactionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      const newType = prompt("Novo Tipo de Gasto:");
                      if (newType) hookAddTransactionType(newType);
                    }}
                    className="p-3 bg-white ring-1 ring-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Adicionar Novo Tipo"
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    onClick={() => {
                      const typeToDelete = prompt("Digite o nome do tipo para excluir:");
                      if (typeToDelete && transactionTypes.includes(typeToDelete)) hookDeleteTransactionType(typeToDelete);
                      else if (typeToDelete) alert("Tipo não encontrado.");
                    }}
                    className="p-3 bg-white ring-1 ring-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Excluir Tipo Existente"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Local / Estabelecimento</label>
                  <input placeholder="Ex: Shell, Extra..." className="w-full text-sm p-3 rounded-xl border-none ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={newTx.location} onChange={(e) => setNewTx({ ...newTx, location: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Data de Referência</label>
                    {newTx.cardId && (
                      <button
                        onClick={() => setNewTx({ ...newTx, purchaseDate: newTx.purchaseDate ? undefined : newTx.date })}
                        className="text-[8px] font-bold text-blue-500 hover:text-blue-700 uppercase"
                      >
                        {newTx.purchaseDate ? '- Remover Data Compra' : '+ Data Compra'}
                      </button>
                    )}
                  </div>
                  <input type="date" className="w-full text-sm p-3 rounded-xl border-none ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} />
                  {newTx.cardId && newTx.purchaseDate !== undefined && (
                    <div className="mt-2 animate-in slide-in-from-top-2 fade-in">
                      <label className="text-[9px] font-bold text-blue-400 uppercase ml-1 mb-1 block">Data Real da Compra</label>
                      <input type="date" className="w-full text-sm p-3 rounded-xl border-none ring-1 ring-blue-200 bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newTx.purchaseDate} onChange={(e) => setNewTx({ ...newTx, purchaseDate: e.target.value })} />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Mês de Lançamento</label>
                  <input type="month" className="w-full text-sm p-3 rounded-xl border-none ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={newTx.paymentStartMonth} onChange={(e) => setNewTx({ ...newTx, paymentStartMonth: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Parcelas</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="1x" className="w-full text-sm p-3 rounded-xl border-none ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={newTx.installments || ''} onChange={(e) => setNewTx({ ...newTx, installments: Number(e.target.value) })} />
                    {(!newTx.isSubscription && (newTx.installments || 0) > 1) && (
                      <input
                        type="number"
                        placeholder="Pagas"
                        title="Quanto já foi pago (entrada de dívida antiga)"
                        className="w-20 text-sm p-3 rounded-xl border-none ring-1 ring-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-600"
                        value={newTx.installmentsPaid || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          // Limit so paid < total
                          const max = (newTx.installments || 1) - 1;
                          const safeVal = Math.min(Math.max(0, val), max);
                          setNewTx({ ...newTx, installmentsPaid: safeVal > 0 ? safeVal : undefined })
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 flex justify-between items-center">
                  <span>Valor da Compra</span>
                  <button
                    onClick={() => setIsCalculatorOpen(true)}
                    className="text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md transition-colors"
                  >
                    <Calculator size={10} /> Calculadora
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                  <input type="number" placeholder="0,00" className="w-full text-sm p-3 pl-8 rounded-xl border-none ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" value={newTx.totalValue || ''} onChange={(e) => setNewTx({ ...newTx, totalValue: Number(e.target.value) })} />
                </div>
              </div>

              <button
                onClick={() => {
                  const isNowSubscription = !newTx.isSubscription;
                  // If turning ON subscription, force paymentStartMonth to be present
                  // Logic: User wants "month of the folder" -> This is likely 'currentDate' of the dashboard
                  // Or from the transaction date itself?
                  // User says: "shown in the month chosen in the Selector".
                  // If we are in Feb (Dashboard), we want it to start in Feb.
                  // The 'paymentStartMonth' input already defaults to current real month or what was typed.
                  // Let's ensure it is synced with the currently viewed month if it was empty or default.

                  const currentViewMonth = new Date(newTx.date || currentDate).toISOString().slice(0, 7);

                  setNewTx({
                    ...newTx,
                    isSubscription: isNowSubscription,
                    // If enabling, ensure we have a start month. Use the one from the date picker or current view.
                    paymentStartMonth: isNowSubscription ? (newTx.paymentStartMonth || currentViewMonth) : newTx.paymentStartMonth
                  });
                }}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border-none ring-1 transition-all ${newTx.isSubscription ? 'bg-indigo-50 ring-indigo-200 text-indigo-700' : 'bg-white ring-slate-200 text-slate-500'}`}
              >
                <div className="flex items-center gap-3">
                  <Repeat size={18} />
                  <span className="text-sm font-semibold">Repetir para os próximos meses</span>
                </div>
                {newTx.isSubscription ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] border-2 border-slate-200 rounded-full" />}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Quem Pagou?</label>
                  <select className="w-full text-sm p-3 rounded-xl ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none" value={newTx.userId} onChange={(e) => setNewTx({ ...newTx, userId: e.target.value })}>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Forma de Pagamento</label>
                  <select className="w-full text-sm p-3 rounded-xl ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none" value={newTx.cardId || ''} onChange={(e) => setNewTx({ ...newTx, cardId: e.target.value || undefined })}>
                    <option value="">Dinheiro / Débito / Pix</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={addTransaction} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98]">Salvar Lançamento</button>
            </div>
          </div>
        )}

        {activeTab === 'pagamentos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1 relative">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><LayoutDashboard size={12} /> Saldos</h3>
              <div className="flex gap-1">
                <button onClick={() => setShowQuickActions(!showQuickActions)} className={`p-2 rounded-full transition-all ${showQuickActions ? 'bg-indigo-100 text-indigo-600' : 'text-indigo-400'}`} title="Pagar Fatura"><Zap size={18} /></button>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 transition-all duration-300 ${showDashboard ? 'h-auto opacity-100 scale-100' : 'h-0 overflow-hidden opacity-0 scale-95 origin-top'}`}>
              <DashboardCard title="Disponível" value={dashStats.saldoInicial} icon={<DollarSign size={14} />} color="text-emerald-600" bgColor="bg-emerald-50" />
              <DashboardCard title="Saídas" value={dashStats.saldoTotalGasto} icon={<TrendingDown size={14} />} color="text-rose-600" bgColor="bg-rose-50" />
              {showCardsInDashboard && <DashboardCard title="Cartões" value={dashStats.saldoTotalCartao} icon={<CardIcon size={14} />} color="text-indigo-600" bgColor="bg-indigo-50" />}
              <DashboardCard title="Final" value={dashStats.saldoRestante} icon={<TrendingUp size={14} />} color="text-blue-600" bgColor="bg-blue-50" />
            </div>

            {showQuickActions && (
              <div className="space-y-3 bg-indigo-50/60 p-5 rounded-3xl border border-indigo-100 shadow-lg animate-in zoom-in-95 duration-200">
                {cards.filter(c => showHiddenItems || !c.isHidden).map(card => {
                  const total = cardTotalsForUser[card.id];
                  return (
                    <div key={card.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-indigo-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${total > 0 ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-300'}`}><CardIcon size={20} /></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase truncate mb-0.5">{card.name}</p>
                          <p className={`text-sm font-black ${total > 0 ? 'text-slate-800' : 'text-slate-300'}`}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <button disabled={total <= 0} onClick={() => registerCardPayment(card, total)} className={`py-2 px-4 rounded-xl text-xs font-black transition-all active:scale-95 ${total > 0 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-300'}`}>Pagar</button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase px-1">Meus Lançamentos</h3>
              {visibleTransactionsList.filter(tx => !tx.cardId).length === 0 ? <EmptyState message="Nenhum item encontrado" /> : visibleTransactionsList.filter(tx => !tx.cardId).map((tx: any) => (
                <TransactionItem key={`${tx.id}-${tx.currentInstallment}`} tx={tx} onDelete={deleteTransaction} onEdit={startEditingTransaction} onDuplicate={duplicateTransaction} onCopy={copyTransaction} onTogglePaid={togglePaid} onToggleHidden={toggleHidden} visibility={visibility} userName={users.find(u => u.id === tx.userId)?.name || ''} userColor={users.find(u => u.id === tx.userId)?.color} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cartoes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CardBrandIcon size={12} /> Meus Cartões</h3>
              </div>
              <div className="flex gap-1 items-center">
                <button onClick={() => { setReportType('cards'); setShowReport(true); }} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors" title="Relatório de Cartões"><Printer size={20} /></button>
                <button onClick={() => { setIsAddingCard(!isAddingCard); if (!isAddingCard) setEditingCardId(null); setNewCard(initialCardState); }} className={`p-2 rounded-full transition-all ${isAddingCard ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`} title="Adicionar Cartão">
                  <PlusCircle size={20} />
                </button>
              </div>
            </div>

            {isAddingCard && (
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top duration-300 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2"><CardBrandIcon size={16} /> {editingCardId ? 'Editar Cartão' : 'Novo Cartão'}</h3>
                  <button onClick={() => { setIsAddingCard(false); setEditingCardId(null); }} className="text-slate-400 hover:bg-slate-200 p-1 rounded-full"><X size={18} /></button>
                </div>
                <div className="space-y-3">
                  <input placeholder="Nome do Cartão" className="w-full text-sm p-3 rounded-xl border-none ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={newCard.name} onChange={(e) => setNewCard({ ...newCard, name: e.target.value })} />
                  <div className="grid grid-cols-1 gap-3">
                    <select className="text-sm p-3 rounded-xl ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={newCard.brand} onChange={(e) => setNewCard({ ...newCard, brand: e.target.value })}>
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Elo">Elo</option>
                      <option value="Amex">American Express</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Dia Vencimento</label>
                      <input type="number" placeholder="Vencimento" className="w-full text-sm p-3 rounded-xl border-none ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={newCard.dueDay || ''} onChange={(e) => setNewCard({ ...newCard, dueDay: Number(e.target.value) })} />
                    </div>
                  </div>
                  <button onClick={saveCard} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all">{editingCardId ? 'Salvar Alterações' : 'Salvar Cartão'}</button>
                </div>
              </div>
            )}

            {cards.filter(c => showHiddenItems || !c.isHidden).map(card => {
              const cardTxs = periodTransactions.filter(t => t.cardId === card.id && isUserVisible(t.userId));
              const cardTotal = cardTxs.filter(t => includeHiddenInStats || !t.isHidden).reduce((acc, t) => acc + (t.isSubscription ? t.totalValue : t.totalValue / t.installments), 0);
              const cardVisibleTxs = cardTxs.filter(t => showHiddenItems || !t.isHidden);
              const isExpanded = expandedCardId === card.id;

              return (
                <div key={card.id} className={`bg-slate-50 rounded-3xl p-4 border border-slate-100 shadow-sm relative group transition-all duration-300 ${card.isHidden ? 'opacity-50 grayscale' : 'opacity-100'} ${isExpanded ? 'ring-2 ring-blue-100 bg-white shadow-lg' : ''}`}>

                  {/* Card Header (Clickable area) */}
                  <div
                    className="flex justify-between items-center px-2 cursor-pointer select-none"
                    onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-slate-50 text-indigo-500 shadow-sm"><CardBrandIcon size={22} /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-800 tracking-tight">{card.name}</h4>
                          <span className="text-[8px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-black uppercase tracking-widest">{card.brand}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter mt-0.5">VENCE DIA {card.dueDay}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-blue-600 leading-none">R$ {cardTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setCardToDelete(card.id); }}
                            className="text-red-400 hover:text-red-600 p-1 transition-colors"
                            title="Excluir Cartão"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex gap-1 justify-end mt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveCard(card.id, 'up'); }}
                            className="p-1 text-slate-300 hover:text-blue-500 hover:bg-slate-100 rounded-full"
                            title="Mover para Cima"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveCard(card.id, 'down'); }}
                            className="p-1 text-slate-300 hover:text-blue-500 hover:bg-slate-100 rounded-full"
                            title="Mover para Baixo"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        <span className="text-[8px] font-bold text-slate-300 uppercase mt-1 tracking-widest leading-none">Fatura Atual</span>
                      </div>
                      <div className={`p-1 rounded-full transition-transform ${isExpanded ? 'rotate-180 bg-blue-50 text-blue-600' : 'text-slate-300'}`}>
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Expansion Area */}
                  {isExpanded && (
                    <div className="mt-8 space-y-5 animate-in slide-in-from-top-4 fade-in duration-300 origin-top">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 px-1">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-slate-400" />
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Fatura de {currentMonthName}
                          </h5>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditingCard(card); }}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar Cartão"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCardHidden(card.id); }}
                            className={`p-2 transition-all rounded-xl ${card.isHidden ? 'bg-orange-50 text-orange-500' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'}`}
                            title={card.isHidden ? "Mostrar Cartão" : "Ocultar Cartão"}
                          >
                            {card.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {cardVisibleTxs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 opacity-30">
                            <Receipt size={28} className="text-slate-300 mb-3" />
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Nenhum gasto registrado</p>
                          </div>
                        ) : (
                          cardVisibleTxs.map((tx: any) => (
                            <TransactionItem
                              key={`${tx.id}-${tx.currentInstallment}`}
                              tx={tx}
                              onDelete={deleteTransaction}
                              onEdit={startEditingTransaction}
                              onDuplicate={duplicateTransaction}
                              onCopy={copyTransaction}
                              onTogglePaid={togglePaid}
                              onToggleHidden={toggleHidden}
                              visibility={visibility}
                              userName={users.find(u => u.id === tx.userId)?.name || ''}
                              userColor={users.find(u => u.id === tx.userId)?.color}
                            />
                          ))
                        )}
                      </div>

                      {/* Footer Actions inside expansion */}
                      <div className="pt-4 flex items-center justify-between px-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Resumo da Fatura</span>
                          <span className="text-xs font-black text-slate-700">R$ {cardTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <button
                          onClick={() => setExpandedCardId(null)}
                          className="text-[9px] font-black uppercase text-slate-500 hover:text-blue-600 transition-colors px-5 py-2.5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm active:scale-95"
                        >
                          Fechar Detalhes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'resumo' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Dashboard Mensal</h3>
              </div>

              {/* DASHBOARD: PAGAMENTOS VS CARTÕES */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <TrendingDown size={64} className="text-rose-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingDown size={10} /> Pagamentos</p>
                    <p className="text-lg font-black text-rose-600 leading-none">R$ {dashStats.saldoTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <CardIcon size={64} className="text-indigo-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1"><CardIcon size={10} /> Cartões</p>
                    <p className="text-lg font-black text-indigo-600 leading-none">R$ {dashStats.saldoTotalCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="col-span-2 bg-slate-100 rounded-2xl p-4 border border-slate-200 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <DollarSign size={64} className="text-slate-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><DollarSign size={10} /> Total Geral</p>
                    <p className="text-2xl font-black text-slate-700 leading-none">R$ {(dashStats.saldoTotalGasto + dashStats.saldoTotalCartao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>

              {/* SEÇÃO DE PROJEÇÃO DE FATURAS */}
              <div className={`transition-all duration-300 overflow-hidden ${showProjection ? 'h-auto opacity-100 mt-2 mb-8' : 'h-0 opacity-0'}`}>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-slate-400" />
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projeção de Gastos</h4>
                  </div>
                  <div className="flex items-center bg-slate-100 rounded-full px-1 py-0.5">
                    {[3, 6, 9, 12].map((num) => (
                      <button
                        key={num}
                        onClick={() => setProjectionRange(num)}
                        className={`text-[9px] font-black px-2.5 py-1 rounded-full transition-all ${projectionRange === num ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        {num}M
                      </button>
                    ))}
                  </div>
                </div>

                {/* NOVO SELETOR DE CARTÕES PARA PROJEÇÃO */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Cartões na Projeção</p>
                    <button
                      onClick={() => setIsProjectionCardMenuOpen(!isProjectionCardMenuOpen)}
                      className="text-[8px] font-black text-blue-600 uppercase flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg"
                    >
                      {isProjectionCardMenuOpen ? 'Fechar' : 'Escolher'} <ChevronDown size={10} className={`transition-transform ${isProjectionCardMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isProjectionCardMenuOpen && (
                    <div className="bg-slate-50 rounded-2xl p-2.5 grid grid-cols-2 gap-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => { setIncludeHiddenInStats(!includeHiddenInStats); }}
                        className={`col-span-2 flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${includeHiddenInStats ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                      >
                        <span className="flex items-center gap-2">
                          {includeHiddenInStats ? <Eye size={12} /> : <EyeOff size={12} />}
                          SOMAR ITENS OCULTOS
                        </span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${includeHiddenInStats ? 'bg-orange-400' : 'bg-slate-200'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${includeHiddenInStats ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </button>

                      <button
                        onClick={() => handleCardToggle('all')}
                        className={`flex items-center gap-2 p-2 rounded-xl text-[10px] font-bold transition-all border ${selectedCardIds.includes('all') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100'}`}
                      >
                        {selectedCardIds.includes('all') ? <CheckSquare size={12} /> : <Square size={12} />}
                        <span>TODOS</span>
                      </button>
                      <button
                        onClick={() => handleCardToggle('direto')}
                        className={`flex items-center gap-2 p-2 rounded-xl text-[10px] font-bold transition-all border ${selectedCardIds.includes('direto') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100'}`}
                      >
                        {selectedCardIds.includes('direto') ? <CheckSquare size={12} /> : <Square size={12} />}
                        <span>DIRETO</span>
                      </button>
                      {cards.map(card => (
                        <button
                          key={card.id}
                          onClick={() => handleCardToggle(card.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-[10px] font-bold transition-all border ${selectedCardIds.includes(card.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100'}`}
                        >
                          {selectedCardIds.includes(card.id) ? <CheckSquare size={12} /> : <Square size={12} />}
                          <span className="truncate">{card.name.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {projectionData.map((month, idx) => (
                    <div key={`${month.name}-${month.year}`} className={`p-3 rounded-2xl border transition-all ${month.isCurrent ? 'bg-blue-50 border-blue-100 ring-1 ring-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{month.name.substring(0, 3)} {month.year}</p>
                      <p className={`text-[11px] font-black ${month.total > 0 ? (month.isCurrent ? 'text-blue-700' : 'text-slate-700') : 'text-slate-300'}`}>
                        R$ {month.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer: Selected Cards Display */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-center">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mr-1">Cartões Considerados:</span>
                  {selectedCardIds.includes('all') ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">Todos os Cartões (+Direto)</span>
                  ) : (
                    <>
                      {selectedCardIds.includes('direto') && (
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">Direto</span>
                      )}
                      {cards.filter(c => selectedCardIds.includes(c.id)).map(c => (
                        <span key={c.id} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">{c.name}</span>
                      ))}
                    </>
                  )}
                </div>
              </div>


              {/* MENSAGEM QUANDO TUDO ESTÁ OCULTO */}
              {!showProjection && !showUserSummary && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                  <PieChart size={48} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest text-center">Dashboards ocultos</p>
                  <p className="text-[10px] text-slate-400 mt-1">Ative-os no menu de configurações</p>
                </div>
              )}
            </div>

            {/* GRÁFICO DE PIZZA - GASTOS POR CATEGORIA */}
            <div className="mt-6">
              <div className="flex justify-center mb-4">
                <div className="bg-slate-100 p-1 rounded-xl flex">
                  <button
                    onClick={() => setChartType('cards')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${chartType === 'cards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Cartões
                  </button>
                  <button
                    onClick={() => setChartType('payments')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${chartType === 'payments' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Pagamentos
                  </button>
                </div>
              </div>
              <ExpensesPieChart
                transactions={periodTransactions.filter(tx =>
                  isUserVisible(tx.userId) &&
                  (includeHiddenInStats || !tx.isHidden) &&
                  (chartType === 'cards'
                    ? (tx.cardId && isCardVisible(tx.cardId))
                    : !tx.cardId
                  )
                )}
              />
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-2 flex justify-between items-center max-w-md mx-auto z-30">
        <TabButton active={activeTab === 'pagamentos'} onClick={() => setActiveTab('pagamentos')} icon={<Wallet size={24} />} label="Pagamentos" />
        <TabButton active={activeTab === 'cartoes'} onClick={() => setActiveTab('cartoes')} icon={<CardIcon size={24} />} label="Cartões" />
        <TabButton active={activeTab === 'resumo'} onClick={() => setActiveTab('resumo')} icon={<PieChart size={24} />} label="Resumo" />
      </nav>
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onConfirm={(total) => {
          setNewTx({ ...newTx, totalValue: total });
          setIsCalculatorOpen(false);
        }}
        initialValue={newTx.totalValue}
      />
    </div >
  );
};







const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <Dashboard />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
