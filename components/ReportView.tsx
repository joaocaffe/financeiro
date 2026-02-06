import React, { useMemo } from 'react';
import { Printer, X, Download } from 'lucide-react';
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
        <div className="fixed inset-0 z-[200] bg-white overflow-auto animate-in slide-in-from-bottom duration-300">
            {/* No-Print Header / Controls */}
            <div className="print:hidden sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center z-10 shadow-sm gap-4 md:gap-0">
                <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    <Printer size={20} className="text-blue-600" />
                    Visualização de Impressão ({type === 'cards' ? 'Cartões' : 'Geral'})
                </h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handlePrint}
                        className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Download size={16} /> <span className="hidden sm:inline">Imprimir / Salvar PDF</span><span className="sm:hidden">PDF</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 md:flex-none justify-center bg-slate-100 text-slate-500 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                        <X size={16} /> Fechar
                    </button>
                </div>
            </div>

            {/* Printable Content */}
            <div className="py-6 md:p-8 max-w-4xl mx-auto print:p-0 print:max-w-none w-full">

                {/* Report Header */}
                <div className="px-4 md:px-0 mb-8 border-b-2 border-slate-800 pb-4">
                    <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 md:gap-0">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight mb-1">
                                {type === 'cards' ? 'Relatório de Cartões' : 'Relatório Financeiro'}
                            </h1>
                            <p className="text-base md:text-lg font-medium text-slate-500 capitalize">{monthName}</p>
                        </div>

                        {type === 'general' ? (
                            <div className="text-left md:text-right grid grid-cols-2 md:flex md:flex-row md:items-end gap-x-4 gap-y-6 md:gap-8">
                                <div className="col-span-1">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Aportes</p>
                                    <p className="text-lg md:text-xl font-bold text-emerald-600">R$ {stats.totalInputs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="col-span-1">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Gastos</p>
                                    <p className="text-lg md:text-xl font-bold text-red-600">R$ {stats.totalSpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="col-span-2 md:col-span-1 pt-2 md:pt-0 border-t border-dashed border-slate-200 md:border-none">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Saldo Final</p>
                                    <p className={`text-2xl md:text-3xl font-black ${stats.netResult >= 0 ? 'text-blue-600' : 'text-red-600'}`}>R$ {stats.netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-left md:text-right">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Faturas</p>
                                <p className="text-2xl md:text-3xl font-black text-slate-800">R$ {stats.totalSpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* CONTENT FOR GENERAL REPORT */}
                {type === 'general' && (
                    <>
                        {/* Transactions Table */}
                        <div className="bg-white overflow-x-auto print:overflow-visible">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="py-2 pl-4 md:pl-0 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Data</th>
                                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Local</th>
                                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Tipo</th>
                                        <th className="py-2 pr-4 md:pr-0 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-700">
                                    {stats.visibleTransactions.map((tx, idx) => {
                                        const installments = calculateInstallments(tx);
                                        const value = calculateTransactionValue(tx);
                                        const user = users.find(u => u.id === tx.userId);
                                        const card = cards.find(c => c.id === tx.cardId);

                                        return (
                                            <tr key={`${tx.id}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 print:hover:bg-transparent">
                                                <td className="py-2.5 pl-4 md:pl-0 font-medium text-slate-500">
                                                    {formatDate(tx.date)}
                                                </td>
                                                <td className="py-2.5 font-semibold">
                                                    {tx.description}
                                                    {card && (
                                                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold uppercase tracking-wide print:border print:border-slate-200">
                                                            {card.name}
                                                        </span>
                                                    )}
                                                    {tx.installments > 1 && (
                                                        <span className="ml-1 text-[9px] text-blue-600 font-bold">
                                                            ({tx.currentInstallment}/{tx.installments})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 text-slate-500 text-xs">
                                                    {tx.location}
                                                </td>
                                                <td className="py-2.5">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">{user?.name}</span>
                                                        {tx.cardId && <span className="text-[9px] text-slate-400">Cartão</span>}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 pr-4 md:pr-0 text-right font-bold text-slate-800">
                                                    R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Aportes / Balances Section */}
                        <div className="mt-8 bg-white overflow-x-auto print:overflow-visible">
                            <h3 className="px-4 md:px-0 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Aportes / Entradas</h3>
                            <table className="w-full text- left border-collapse mb-6 min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-2 pl-4 md:pl-0 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Data</th>
                                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Usuário</th>
                                        <th className="py-2 pr-4 md:pr-0 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-28">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-700">
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
                                            <tr key={`${balance.id}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 print:hover:bg-transparent">
                                                <td className="py-2 pl-4 md:pl-0 font-medium text-slate-500">
                                                    {formatDate(balance.date)}
                                                </td>
                                                <td className="py-2 font-semibold">
                                                    {balance.description}
                                                </td>
                                                <td className="py-2 text-slate-500 text-xs">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">{balance.userName}</span>
                                                </td>
                                                <td className="py-2 pr-4 md:pr-0 text-right font-bold text-emerald-600">
                                                    R$ {balance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    {stats.totalInputs === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-xs text-slate-300 italic">
                                                Nenhum aporte registrado para este mês
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-slate-100">
                                        <td colSpan={3} className="py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Aportes</td>
                                        <td className="py-3 pr-4 md:pr-0 text-right font-black text-emerald-600 text-lg">
                                            R$ {stats.totalInputs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}

                {/* CONTENT FOR CARDS REPORT */}
                {type === 'cards' && (
                    <div className="space-y-10">
                        {stats.cardGroups.map(group => (
                            <div key={group.card.id} className="break-inside-avoid">
                                <div className="flex items-center justify-between mb-4 border-b-2 border-slate-100 pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500 print:hidden">
                                            {/* Icon could go here */}
                                            <span className="font-bold text-xs">{group.card.brand}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{group.card.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vence dia {group.card.dueDay}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total da Fatura</p>
                                        <p className="text-xl font-black text-indigo-600">R$ {group.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>

                                <div className="bg-white overflow-x-auto print:overflow-visible">
                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="py-2 pl-4 md:pl-0 text-[9px] font-black text-slate-400 uppercase tracking-widest w-20">Data</th>
                                                <th className="py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                                <th className="py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-24">Usuário</th>
                                                <th className="py-2 pr-4 md:pr-0 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm text-slate-700">
                                            {group.visible.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-4 text-center text-xs text-slate-400 italic">
                                                        Nenhum item visível. {group.hasHidden && "Itens ocultos compõem o total."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                group.visible.map((tx, idx) => {
                                                    const installments = calculateInstallments(tx);
                                                    const value = calculateTransactionValue(tx);
                                                    const user = users.find(u => u.id === tx.userId);

                                                    return (
                                                        <tr key={`${tx.id}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 print:hover:bg-transparent">
                                                            <td className="py-2 pl-4 md:pl-0 font-medium text-slate-500 text-xs">
                                                                {formatDate(tx.date)}
                                                            </td>
                                                            <td className="py-2 font-semibold">
                                                                {tx.description}
                                                                {tx.installments > 1 && (
                                                                    <span className="ml-1 text-[9px] text-blue-600 font-bold">
                                                                        ({tx.currentInstallment}/{tx.installments})
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2 text-slate-500 text-xs uppercase font-bold">
                                                                {user?.name}
                                                            </td>
                                                            <td className="py-2 pr-4 md:pr-0 text-right font-bold text-slate-800">
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

            {/* Print Styles Injection */}
            <style>{`
        @media print {
          @page { margin: 1cm; size: A4; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
        </div>
    );
};
