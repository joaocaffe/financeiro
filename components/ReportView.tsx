import React, { useMemo } from 'react';
import { Printer, X, Download, TrendingUp, TrendingDown, Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
import { Transaction, User, CreditCard } from '../types';
import { calculateTransactionValue, calculateInstallments, formatDate } from '../utils/transactionUtils';


interface ExtendedTransaction extends Transaction {
    currentInstallment?: string | number;
}

interface ReportViewProps {
    transactions: ExtendedTransaction[];
    users: User[];
    cards: CreditCard[];
    currentDate: Date;
    onClose: () => void;
    type?: 'general' | 'cards';
}

export const ReportView: React.FC<ReportViewProps> = ({ transactions, users, cards, currentDate, onClose, type = 'general' }) => {


    const stats = useMemo(() => {
        // General Stats (Total Spending, Inputs, Result)
        const totalSpending = transactions.reduce((acc, tx) => {
            const val = calculateTransactionValue(tx);
            return acc + val;
        }, 0);

        const hiddenSpending = transactions
            .filter(tx => tx.isHidden)
            .reduce((acc, tx) => {
                const val = calculateTransactionValue(tx);
                return acc + val;
            }, 0);

        const visibleTransactions = transactions.filter(tx => !tx.isHidden).sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        // Calculate Total Inputs (Aportes) - Only relevant for General Report usually, but good to have
        const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const totalInputs = users.reduce((acc, u) => {
            const userInputs = (u.balances || [])
                .filter(b => {
                    const recordMonth = b.referenceMonth || b.date.slice(0, 7);
                    return recordMonth === currentMonthStr;
                })
                .reduce((sum, b) => sum + b.amount, 0);
            return acc + userInputs;
        }, 0);

        const netResult = totalInputs - totalSpending;

        // Card Specific Stats
        const cardGroups = type === 'cards' ? cards.map(card => {
            const cardTxs = transactions.filter(tx => tx.cardId === card.id);
            const total = cardTxs.reduce((acc, tx) => {
                return acc + calculateTransactionValue(tx);
            }, 0);

            const visible = cardTxs.filter(tx => !tx.isHidden).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return {
                card,
                total,
                visible,
                hasHidden: cardTxs.some(tx => tx.isHidden)
            };
        }).filter(g => g.total > 0) : [];

        return { totalSpending, hiddenSpending, visibleTransactions, totalInputs, netResult, cardGroups };
    }, [transactions, users, cards, currentDate, type]);

    const handlePrint = () => {
        window.print();
    };

    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="fixed inset-0 z-[200] bg-white overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* No-Print Header / Controls */}
            <div className="print:hidden flex-none bg-white border-b border-slate-100 p-4 flex flex-col md:flex-row justify-between items-center z-10 gap-3 md:gap-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Printer size={20} className="text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-sm md:text-base">Visualização de Relatório</h2>
                        <p className="text-xs text-slate-500 hidden md:block">Pronto para impressão ou PDF</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handlePrint}
                        className="flex-1 md:flex-none justify-center bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 flex items-center gap-2 active:scale-95"
                    >
                        <Download size={16} /> <span className="hidden sm:inline">Imprimir ou Salvar PDF</span><span className="sm:hidden">PDF</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 md:flex-none justify-center bg-slate-50 text-slate-600 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors flex items-center gap-2 active:scale-95 border border-slate-200"
                    >
                        <X size={16} /> Fechar
                    </button>
                </div>
            </div>

            {/* Printable Content - Scrollable Area */}
            <div className="flex-1 overflow-auto bg-slate-50/50 print:bg-white print:overflow-visible">
                <div className="p-4 md:p-8 max-w-5xl mx-auto print:p-0 print:max-w-none w-full bg-white min-h-full print:min-h-0 md:shadow-md md:my-8 md:rounded-2xl print:shadow-none print:my-0 print:rounded-none">

                    {/* Report Header */}
                    <header className="mb-10 pb-6 border-b border-slate-100">
                        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 uppercase">
                                    {type === 'cards' ? 'Fatura de Cartões' : 'Relatório Financeiro'}
                                </h1>
                                <p className="text-lg md:text-xl font-medium text-slate-400 capitalize">{monthName}</p>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Control Finance App
                            </div>
                        </div>
                    </header>


                    {/* Summary Cards */}
                    {type === 'general' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
                            {/* Inputs Card */}
                            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Total Aportes</p>
                                    <p className="text-2xl font-black text-emerald-600 tracking-tight">
                                        R$ {stats.totalInputs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-100/50 rounded-full text-emerald-500">
                                    <TrendingUp size={24} />
                                </div>
                            </div>

                            {/* Expenses Card */}
                            <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Total Gastos</p>
                                    <p className="text-2xl font-black text-rose-500 tracking-tight">
                                        R$ {stats.totalSpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="p-3 bg-rose-100/50 rounded-full text-rose-500">
                                    <TrendingDown size={24} />
                                </div>
                            </div>

                            {/* Balance Card */}
                            <div className={`p-5 rounded-2xl border flex items-center justify-between ${stats.netResult >= 0 ? 'bg-indigo-50/50 border-indigo-100' : 'bg-orange-50/50 border-orange-100'}`}>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${stats.netResult >= 0 ? 'text-indigo-400' : 'text-orange-400'}`}>Saldo Final</p>
                                    <p className={`text-2xl font-black tracking-tight ${stats.netResult >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                                        R$ {stats.netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${stats.netResult >= 0 ? 'bg-indigo-100/50 text-indigo-500' : 'bg-orange-100/50 text-orange-500'}`}>
                                    <Wallet size={24} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-12">
                            <div className="inline-flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-700">
                                    <CreditCardIcon size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Faturas</p>
                                    <p className="text-3xl font-black text-slate-800 tracking-tight">
                                        R$ {stats.totalSpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Report Content */}
                    <div className="space-y-12">

                        {/* GENERAL REPORT CONTENT */}
                        {type === 'general' && (
                            <>
                                <section>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                                        <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest">Detalhamento de Gastos</h3>
                                    </div>

                                    <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr>
                                                    <th className="pb-4 pl-4 md:pl-2 text-[10px] font-black text-slate-300 uppercase tracking-widest w-24">Data</th>
                                                    <th className="pb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Descrição</th>
                                                    <th className="pb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest w-32">Detalhes</th>
                                                    <th className="pb-4 pr-4 md:pr-2 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right w-28">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {stats.visibleTransactions.map((tx, idx) => {
                                                    const value = calculateTransactionValue(tx);
                                                    const user = users.find(u => u.id === tx.userId);
                                                    const card = cards.find(c => c.id === tx.cardId);

                                                    return (
                                                        <tr key={`${tx.id}-${idx}`} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 border-dashed">
                                                            <td className="py-3 pl-4 md:pl-2 font-medium text-slate-500 text-xs">
                                                                {formatDate(tx.date)}
                                                            </td>
                                                            <td className="py-3 font-semibold text-slate-700">
                                                                <div className="flex items-center gap-2">
                                                                    {tx.description}
                                                                    {tx.installments > 1 && (
                                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-bold">
                                                                            {tx.currentInstallment}/{tx.installments}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3">
                                                                <div className="flex flex-col gap-1 text-xs">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                        <span className="text-slate-500 font-medium">{user?.name}</span>
                                                                    </div>
                                                                    {card && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                            <span className="text-slate-400">{card.name}</span>
                                                                        </div>
                                                                    )}
                                                                    {tx.location && (
                                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                            <span>{tx.location}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 pr-4 md:pr-2 text-right font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                                R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                <section className="break-inside-avoid">
                                    <div className="flex items-center gap-2 mb-6 mt-8 pt-8 border-t border-slate-100">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                        <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Entradas e Aportes</h3>
                                    </div>

                                    <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr>
                                                    <th className="pb-4 pl-4 md:pl-2 text-[10px] font-black text-slate-300 uppercase tracking-widest w-24">Data</th>
                                                    <th className="pb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Descrição</th>
                                                    <th className="pb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest w-32">Responsável</th>
                                                    <th className="pb-4 pr-4 md:pr-2 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right w-28">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {users.flatMap(u =>
                                                    (u.balances || [])
                                                        .filter(b => {
                                                            const recordMonth = b.referenceMonth || b.date.slice(0, 7);
                                                            const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                                                            return recordMonth === currentMonthStr;
                                                        })
                                                        .map(b => ({ ...b, userName: u.name, userId: u.id }))
                                                )
                                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                    .map((balance, idx) => (
                                                        <tr key={`${balance.id}-${idx}`} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 border-dashed">
                                                            <td className="py-3 pl-4 md:pl-2 font-medium text-slate-500 text-xs">
                                                                {formatDate(balance.date)}
                                                            </td>
                                                            <td className="py-3 font-semibold text-slate-700">
                                                                {balance.description}
                                                            </td>
                                                            <td className="py-3 text-slate-500 text-xs font-bold uppercase">
                                                                {balance.userName}
                                                            </td>
                                                            <td className="py-3 pr-4 md:pr-2 text-right font-bold text-emerald-600">
                                                                R$ {balance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {stats.totalInputs === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-8 text-center text-xs text-slate-300 italic">
                                                            Nenhum aporte registrado para este mês
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </>
                        )}


                        {/* CARDS REPORT CONTENT */}
                        {type === 'cards' && (
                            <div className="space-y-12">
                                {stats.cardGroups.map(group => (
                                    <div key={group.card.id} className="break-inside-avoid bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs uppercase shadow-sm">
                                                    {group.card.brand.substring(0, 3)}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{group.card.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vencimento: Dia {group.card.dueDay}</p>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total da Fatura</p>
                                                <p className="text-xl sm:text-2xl font-black text-indigo-600">R$ {group.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto -mx-2">
                                            <table className="w-full text-left border-collapse min-w-[500px]">
                                                <thead>
                                                    <tr>
                                                        <th className="pb-3 pl-2 text-[9px] font-black text-slate-300 uppercase tracking-widest w-20">Data</th>
                                                        <th className="pb-3 text-[9px] font-black text-slate-300 uppercase tracking-widest">Descrição</th>
                                                        <th className="pb-3 text-[9px] font-black text-slate-300 uppercase tracking-widest w-24">Resp.</th>
                                                        <th className="pb-3 pr-2 text-[9px] font-black text-slate-300 uppercase tracking-widest text-right w-24">Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {group.visible.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="py-6 text-center text-xs text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200">
                                                                Nenhum item visível. {group.hasHidden && "Itens ocultos compõem o total."}
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        group.visible.map((tx, idx) => {
                                                            const value = calculateTransactionValue(tx);
                                                            const user = users.find(u => u.id === tx.userId);

                                                            return (
                                                                <tr key={`${tx.id}-${idx}`} className="border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                                                    <td className="py-2.5 pl-2 font-medium text-slate-500 text-xs">
                                                                        {formatDate(tx.date)}
                                                                    </td>
                                                                    <td className="py-2.5 font-semibold text-slate-700">
                                                                        <div className="flex items-center gap-1.5">
                                                                            {tx.description}
                                                                            {tx.installments > 1 && (
                                                                                <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 px-1.5 rounded">
                                                                                    {tx.currentInstallment}/{tx.installments}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2.5 text-slate-500 text-[10px] font-bold uppercase">
                                                                        {user?.name}
                                                                    </td>
                                                                    <td className="py-2.5 pr-2 text-right font-bold text-slate-700">
                                                                        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>

                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-300 font-medium uppercase tracking-widest print:hidden">
                        <span>Control Finance 2026</span>
                        <span>Gerado em {new Date().toLocaleDateString('pt-BR')}</span>
                    </div>

                </div>
            </div>

            {/* Print Styles Injection */}
            <style>{`
        @media print {
          @page { margin: 1cm; size: A4; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
        }
      `}</style>
        </div>
    );
};
