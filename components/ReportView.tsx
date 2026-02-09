import React, { useMemo, useRef, useState } from 'react';
import { Printer, X, Download, TrendingUp, TrendingDown, Wallet, CreditCard as CreditCardIcon, FileImage } from 'lucide-react';
import { Transaction, User, CreditCard } from '../types';
import { calculateTransactionValue, formatDate } from '../utils/transactionUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

const ITEMS_PER_PAGE = 25;

export const ReportView: React.FC<ReportViewProps> = ({ transactions, users, cards, currentDate, onClose, type = 'general' }) => {
    // printContainerRef for PDF generation
    const printContainerRef = useRef<HTMLDivElement>(null);
    // screenRef for JPG generation
    const screenRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const stats = useMemo(() => {
        // 1. Calculate Total Expenses
        const totalSpending = transactions.reduce((acc, tx) => acc + calculateTransactionValue(tx), 0);

        // 2. Filter and Sort Visible Transactions
        const visibleTransactions = transactions.filter(tx => !tx.isHidden).sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        // 3. Calculate Total Inputs (Aportes)
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

        // 4. Calculate Net Result (Final Balance)
        const netResult = totalInputs - totalSpending;

        // 5. Card Specific Stats
        const cardGroups = type === 'cards' ? cards.map(card => {
            const cardTxs = transactions.filter(tx => tx.cardId === card.id);
            const total = cardTxs.reduce((acc, tx) => acc + calculateTransactionValue(tx), 0);
            const visible = cardTxs.filter(tx => !tx.isHidden).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            return { card, total, visible, hasHidden: cardTxs.some(tx => tx.isHidden) };
        }).filter(g => g.total > 0) : [];

        return { totalSpending, visibleTransactions, totalInputs, netResult, cardGroups };
    }, [transactions, users, cards, currentDate, type]);

    // Pre-calculate pages for PDF generation
    const pages = useMemo(() => {
        const _pages: { items: ExtendedTransaction[], type: 'transactions' | 'inputs' | 'cards', cardGroup?: any }[] = [];

        if (type === 'general') {
            // Expenses Pages
            const txs = [...stats.visibleTransactions];
            if (txs.length === 0) {
                _pages.push({ items: [], type: 'transactions' });
            } else {
                for (let i = 0; i < txs.length; i += ITEMS_PER_PAGE) {
                    _pages.push({ items: txs.slice(i, i + ITEMS_PER_PAGE), type: 'transactions' });
                }
            }

            // Inputs can be a separate page or appended. Let's make it a separate page type for safety/clarity in print
            _pages.push({ items: [], type: 'inputs' });
        } else {
            // Cards Pages
            stats.cardGroups.forEach(group => {
                const txs = [...group.visible];
                if (txs.length === 0) {
                    _pages.push({ items: [], type: 'cards', cardGroup: group });
                } else {
                    for (let i = 0; i < txs.length; i += ITEMS_PER_PAGE) {
                        _pages.push({ items: txs.slice(i, i + ITEMS_PER_PAGE), type: 'cards', cardGroup: group });
                    }
                }
            });
        }
        return _pages;
    }, [stats, type]);

    const handleDownload = async (format: 'pdf' | 'jpg') => {
        setIsGenerating(true);

        try {
            if (format === 'jpg') {
                if (!screenRef.current) return;
                const canvas = await html2canvas(screenRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                const link = document.createElement('a');
                link.download = `Relatorio_${type === 'cards' ? 'Fatura' : 'Geral'}_${currentDate.toISOString().slice(0, 7)}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.click();
            } else {
                if (!printContainerRef.current) return;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pageElements = printContainerRef.current.querySelectorAll('.print-page');

                for (let i = 0; i < pageElements.length; i++) {
                    const element = pageElements[i] as HTMLElement;
                    const canvas = await html2canvas(element, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        windowWidth: 794,
                        windowHeight: 1123
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.9);
                    const imgWidth = 210;
                    const imgHeight = 297;

                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
                }

                const fileName = `Relatorio_${type === 'cards' ? 'Fatura' : 'Geral'}_${currentDate.toISOString().slice(0, 7)}`;
                pdf.save(`${fileName}.pdf`);
            }
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Erro ao gerar relatório. Tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Helper for rendering rows
    const renderTransactionRow = (tx: ExtendedTransaction, idx: number) => {
        const value = calculateTransactionValue(tx);
        const user = users.find(u => u.id === tx.userId);
        const card = cards.find(c => c.id === tx.cardId);

        return (
            <tr key={`${tx.id}-${idx}`} className="border-b border-slate-100 last:border-0 border-dashed hover:bg-slate-50 transition-colors">
                <td className="py-2.5 pl-2 font-medium text-slate-500 text-[10px] md:text-xs">
                    {formatDate(tx.date)}
                </td>
                <td className="py-2.5 font-semibold text-slate-700 text-[10px] md:text-xs">
                    <div className="flex items-center gap-2">
                        {tx.description}
                        {tx.installments > 1 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-bold">
                                {tx.currentInstallment}/{tx.installments}
                            </span>
                        )}
                    </div>
                </td>
                <td className="py-2.5 text-[10px] md:text-xs text-slate-500">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user?.color || '#cbd5e1' }}></span>
                            <span className="font-bold whitespace-nowrap" style={{ color: user?.color || '#64748b' }}>{user?.name}</span>
                        </div>
                        {card && (
                            <div className="flex items-center gap-1.5 pl-0.5">
                                <CreditCardIcon size={10} className="text-slate-300" />
                                <span className="text-slate-400 text-[9px]">{card.name}</span>
                            </div>
                        )}
                    </div>
                </td>
                <td className="py-2.5 pr-2 text-right font-bold text-slate-700 text-[10px] md:text-xs">
                    R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
            </tr>
        );
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Control Bar */}
            <div className="print:hidden flex-none bg-white border-b border-slate-100 p-4 flex flex-col md:flex-row justify-between items-center z-10 gap-3 md:gap-0 shadow-sm relative">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Printer size={20} className="text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-sm md:text-base">Relatório Mensal</h2>
                        <p className="text-xs text-slate-500 hidden md:block">Visualização e Exportação</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => handleDownload('jpg')}
                        disabled={isGenerating}
                        className="flex-1 md:flex-none justify-center bg-white text-slate-600 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm hover:bg-slate-50 transition-all border border-slate-200 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        <FileImage size={16} /> <span className="hidden sm:inline">Salvar JPG</span><span className="sm:hidden">JPG</span>
                    </button>
                    <button
                        onClick={() => handleDownload('pdf')}
                        disabled={isGenerating}
                        className="flex-1 md:flex-none justify-center bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        <span className="hidden sm:inline">Salvar PDF</span><span className="sm:hidden">PDF</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 md:flex-none justify-center bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm hover:bg-slate-100 transition-colors flex items-center gap-2 active:scale-95 border border-slate-200"
                    >
                        <X size={16} /> Fechar
                    </button>
                </div>
            </div>

            {/* SCREEN PREVIEW Content - RESPONSIVE (Used for Screen View & JPG Export) */}
            <div className="flex-1 overflow-auto bg-slate-100/50 p-4 md:p-8 flex justify-center">
                <div ref={screenRef} className="w-full max-w-2xl bg-white shadow-sm md:shadow-xl rounded-xl p-6 md:p-10 min-h-[50vh] animate-in slide-in-from-bottom-2 duration-500">
                    {/* 1. Header & Summary Dashboard */}
                    <header className="mb-8 pb-6 border-b border-slate-100">
                        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">
                                    {type === 'cards' ? 'Fatura de Cartões' : 'Relatório Financeiro'}
                                </h1>
                                <p className="text-lg font-medium text-slate-400 capitalize">{monthName}</p>
                            </div>
                            <div className="text-xs font-bold text-slate-300 uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-full border border-slate-100">Control Finance</div>
                        </div>

                        {type === 'general' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Summary Cards */}
                                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col justify-between h-32 md:h-36 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 -mr-2 -mt-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingUp size={64} className="text-emerald-600" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={16} /></div>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Aportes</p>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-black text-emerald-600 tracking-tight">R$ {stats.totalInputs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>

                                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col justify-between h-32 md:h-36 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 -mr-2 -mt-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingDown size={64} className="text-rose-600" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600"><TrendingDown size={16} /></div>
                                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Total Saídas</p>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-black text-rose-600 tracking-tight">R$ {stats.totalSpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>

                                <div className={`p-5 rounded-2xl border flex flex-col justify-between h-32 md:h-36 relative overflow-hidden group ${stats.netResult >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
                                    <div className={`absolute top-0 right-0 p-4 -mr-2 -mt-2 opacity-10 group-hover:opacity-20 transition-opacity`}>
                                        <Wallet size={64} className={stats.netResult >= 0 ? 'text-indigo-600' : 'text-orange-600'} />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-1.5 rounded-lg ${stats.netResult >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}><Wallet size={16} /></div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${stats.netResult >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>Saldo Final</p>
                                    </div>
                                    <p className={`text-2xl md:text-3xl font-black tracking-tight ${stats.netResult >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>R$ {stats.netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        )}
                    </header>

                    {/* Content List */}
                    <div className="space-y-12">
                        {type === 'general' ? (
                            <>
                                {/* 2. Dashboard Inputs (Aportes) */}
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                                        <h3 className="text-base md:text-lg font-black text-emerald-600 uppercase tracking-wide">Aportes e Entradas</h3>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="py-3 pl-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                                                    <th className="py-3 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                                                    <th className="py-3 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Responsável</th>
                                                    <th className="py-3 pr-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {users.flatMap(u => (u.balances || [])
                                                    .filter(b => (b.referenceMonth || b.date.slice(0, 7)) === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)
                                                    .map(b => ({ ...b, userName: u.name, userId: u.id, userColor: u.color }))
                                                ).length === 0 ? (
                                                    <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-xs italic">Nenhum aporte registrado.</td></tr>
                                                ) : (
                                                    users.flatMap(u => (u.balances || [])
                                                        .filter(b => (b.referenceMonth || b.date.slice(0, 7)) === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)
                                                        .map(b => ({ ...b, userName: u.name, userId: u.id, userColor: u.color }))
                                                    ).map((balance, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="py-3 pl-4 text-slate-500 text-[10px] md:text-xs font-medium">{formatDate(balance.date)}</td>
                                                            <td className="py-3 text-slate-700 text-[10px] md:text-xs font-semibold">{balance.description}</td>
                                                            <td className="py-3 text-[10px] md:text-xs"><span style={{ color: balance.userColor }} className="font-bold">{balance.userName}</span></td>
                                                            <td className="py-3 pr-4 text-right text-emerald-600 font-bold text-[10px] md:text-xs">R$ {balance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* 3. Dashboard Transactions (Lançamentos) */}
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                                        <h3 className="text-base md:text-lg font-black text-indigo-600 uppercase tracking-wide">Saídas e Gastos</h3>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="py-3 pl-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Data</th>
                                                    <th className="py-3 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                                                    <th className="py-3 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Detalhes</th>
                                                    <th className="py-3 pr-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-24">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {stats.visibleTransactions.length === 0 ? (
                                                    <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-xs italic">Nenhum gasto registrado.</td></tr>
                                                ) : (
                                                    stats.visibleTransactions.map((tx, idx) => renderTransactionRow(tx, idx))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </>
                        ) : (
                            stats.cardGroups.map(group => (
                                <div key={group.card.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                    <div className="flex justify-between items-center p-4 bg-slate-50/50 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                <CreditCardIcon size={16} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-700 text-sm">{group.card.name}</h3>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vencimento Dia {group.card.dueDay}</p>
                                            </div>
                                        </div>
                                        <span className="font-black text-indigo-600 text-lg">R$ {group.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                        <tbody className="divide-y divide-slate-50">
                                            {group.visible.map((tx, idx) => renderTransactionRow(tx, idx))}
                                        </tbody>
                                    </table>
                                </div>
                            ))
                        )}
                    </div>

                    <footer className="mt-12 pt-8 border-t border-slate-100 text-center">
                        <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">Gerado via Control Finance App</p>
                    </footer>
                </div>
            </div>

            {/* HIDDEN PRINT CONTAINER - Strictly A4 sized pages (Used for PDF Export) */}
            <div className="fixed top-0 left-0 w-full h-0 overflow-hidden opacity-0 pointer-events-none">
                <div ref={printContainerRef}>
                    {pages.map((page, pageIdx) => (
                        <div
                            key={pageIdx}
                            className="print-page bg-white relative mx-auto"
                            style={{ width: '794px', height: '1123px', padding: '40px', pageBreakAfter: 'always' }}
                        >
                            {/* Page Header */}
                            <div className="flex justify-between items-end border-b border-slate-200 pb-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                        {type === 'cards' ? 'Fatura de Cartões' : 'Relatório Financeiro'}
                                    </h1>
                                    <p className="text-sm font-medium text-slate-400 capitalize">{monthName} - Página {pageIdx + 1}/{pages.length}</p>
                                </div>
                                <div className="text-[10px] font-bold text-slate-300 uppercase">Control Finance App</div>
                            </div>

                            {/* Page Content */}
                            <div>
                                {page.type === 'transactions' && (
                                    <>
                                        {pageIdx === 0 && ( /* Only on first page of transactions show summary */
                                            <div className="mb-8 grid grid-cols-3 gap-4">
                                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Aportes</p>
                                                    <p className="text-xl font-black text-emerald-600">R$ {stats.totalInputs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                                                    <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mb-1">Total Gastos</p>
                                                    <p className="text-xl font-black text-rose-600">R$ {stats.totalSpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <div className={`p-4 rounded-xl border ${stats.netResult >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${stats.netResult >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>Saldo Final</p>
                                                    <p className={`text-xl font-black ${stats.netResult >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>R$ {stats.netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            </div>
                                        )}
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="pb-3 pl-2 text-[9px] font-black text-slate-300 uppercase tracking-widest w-20">Data</th>
                                                    <th className="pb-3 text-[9px] font-black text-slate-300 uppercase tracking-widest">Descrição</th>
                                                    <th className="pb-3 text-[9px] font-black text-slate-300 uppercase tracking-widest w-28">Detalhes</th>
                                                    <th className="pb-3 pr-2 text-[9px] font-black text-slate-300 uppercase tracking-widest text-right w-24">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs">
                                                {page.items.map((tx, idx) => renderTransactionRow(tx, idx))}
                                            </tbody>
                                        </table>
                                    </>
                                )}

                                {page.type === 'inputs' && (
                                    <div className="mt-4">
                                        <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4 border-b border-emerald-100 pb-2">Entradas e Aportes</h3>
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="pb-3 pl-2 text-[9px] font-black text-slate-300 uppercase tracking-widest w-20">Data</th>
                                                    <th className="pb-3 text-[9px] font-black text-slate-300 uppercase tracking-widest">Descrição</th>
                                                    <th className="pb-3 text-[9px] font-black text-slate-300 uppercase tracking-widest w-28">Responsável</th>
                                                    <th className="pb-3 pr-2 text-[9px] font-black text-slate-300 uppercase tracking-widest text-right w-24">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs">
                                                {users.flatMap(u => (u.balances || [])
                                                    .filter(b => (b.referenceMonth || b.date.slice(0, 7)) === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)
                                                    .map(b => ({ ...b, userName: u.name, userId: u.id, userColor: u.color }))
                                                ).map((balance, idx) => (
                                                    <tr key={idx} className="border-b border-slate-50 last:border-0 border-dashed">
                                                        <td className="py-2.5 pl-2 font-medium text-slate-500 text-[10px]">{formatDate(balance.date)}</td>
                                                        <td className="py-2.5 font-semibold text-slate-700 text-[10px]">{balance.description}</td>
                                                        <td className="py-2.5 text-[10px]"><span style={{ color: balance.userColor }} className="font-bold">{balance.userName}</span></td>
                                                        <td className="py-2.5 pr-2 text-right font-bold text-emerald-600 text-[10px]">R$ {balance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {page.type === 'cards' && page.cardGroup && (
                                    <div>
                                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2 bg-slate-50 p-2 rounded">
                                            <h3 className="font-bold text-slate-700">{page.cardGroup.card.name}</h3>
                                            <span className="font-black text-indigo-600">Total: R$ {page.cardGroup.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="pb-2 pl-2 text-[9px] font-black text-slate-300 uppercase w-20">Data</th>
                                                    <th className="pb-2 text-[9px] font-black text-slate-300 uppercase">Descrição</th>
                                                    <th className="pb-2 text-[9px] font-black text-slate-300 uppercase w-28">Detalhes</th>
                                                    <th className="pb-2 pr-2 text-[9px] font-black text-slate-300 uppercase text-right w-24">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {page.items.map((tx, idx) => renderTransactionRow(tx, idx))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Page Footer */}
                            <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center text-[9px] text-slate-300 uppercase font-medium border-t border-slate-100 pt-4">
                                <span>Control Finance • {currentDate.getFullYear()}</span>
                                <span>Página {pageIdx + 1} de {pages.length}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
