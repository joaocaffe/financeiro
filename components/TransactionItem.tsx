import React from 'react';
import { Copy, Pencil, Trash2, Eye, EyeOff, Clipboard } from 'lucide-react';
import { Transaction, ColumnVisibility } from '../types';
import { calculateTransactionValue, calculateInstallments, formatDate } from '../utils/transactionUtils';

interface ExtendedTransaction extends Transaction {
    currentInstallment?: number;
}

interface TransactionItemProps {
    tx: ExtendedTransaction;
    onDelete: (id: string) => void;
    onEdit: (tx: Transaction) => void;
    onDuplicate: (tx: Transaction) => void;
    onCopy: (tx: Transaction) => void;
    onTogglePaid: (id: string) => void;
    onToggleHidden: (id: string) => void;
    visibility: ColumnVisibility;
    userName: string;
    userColor?: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
    tx,
    onDelete,
    onEdit,
    onDuplicate,
    onCopy,
    onTogglePaid,
    onToggleHidden,
    visibility,
    userName,
    userColor
}) => {
    const installments = calculateInstallments(tx);
    const installmentValue = calculateTransactionValue(tx);

    const containerStyle = userColor ? {
        background: `linear-gradient(135deg, #ffffff 0%, ${userColor}20 50%, ${userColor}40 100%)`,
        borderColor: `${userColor}40`
    } : {};

    // If has color, we use 'text-slate-900' (Black/Gray) for name as requested.
    // The existing code uses 'text-slate-500' for name background in the tag.
    // User wants "nome do usuario cinza e preto".
    // I will style the tag specifically.

    return (
        <div
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${tx.isHidden ? 'bg-slate-50 border-dashed border-slate-300 opacity-50' : tx.isPaid ? 'bg-white opacity-60 grayscale shadow-none' : 'bg-white shadow-sm border-slate-50'}`}
            style={!tx.isPaid && !tx.isHidden ? containerStyle : undefined}
        >
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-start">
                    <div className="flex-1 overflow-hidden pr-2">
                        {visibility.description && <h5 className={`text-sm font-bold truncate tracking-tight ${tx.isHidden ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{tx.description}</h5>}
                        <div className="flex gap-2 items-center text-[10px] text-slate-400 truncate font-medium">
                            {visibility.location && <span className={userColor ? 'text-slate-700' : ''}>{tx.location}</span>}
                            {visibility.location && visibility.date && <span>•</span>}
                            {visibility.date && (
                                <span className={tx.purchaseDate ? "text-blue-600 font-bold" : (userColor ? 'text-slate-700' : '')}>
                                    {formatDate(tx.purchaseDate || tx.date)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        {visibility.value && <p className="text-sm font-black text-slate-900 leading-none mb-1">R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
                        {visibility.installments && tx.installments > 1 && <p className="text-[9px] font-black text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Parc. {tx.currentInstallment}/{tx.installments}</p>}
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2" style={userColor ? { borderColor: `${userColor}30` } : {}}>
                    {visibility.user && (
                        <span
                            className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${userColor ? 'bg-white/80 text-slate-700 shadow-sm' : 'bg-slate-100 text-slate-500'}`}
                        >
                            {userName}
                        </span>
                    )}
                    <div className="flex gap-2.5">
                        <button onClick={(e) => { e.stopPropagation(); onToggleHidden(tx.id); }} className={`transition-colors ${tx.isHidden ? 'text-orange-500' : (userColor ? 'text-slate-500 hover:text-orange-600' : 'text-slate-300 hover:text-orange-400')}`} title="Ocultar Item">{tx.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                        <button onClick={(e) => { e.stopPropagation(); onCopy(tx); }} className={`${userColor ? 'text-slate-500 hover:text-indigo-600' : 'text-slate-300 hover:text-indigo-500'} transition-colors`} title="Copiar"><Clipboard size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDuplicate(tx); }} className={`${userColor ? 'text-slate-500 hover:text-emerald-600' : 'text-slate-300 hover:text-emerald-500'} transition-colors`} title="Duplicar"><Copy size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(tx); }} className={`${userColor ? 'text-slate-500 hover:text-blue-600' : 'text-slate-300 hover:text-blue-400'} transition-colors`} title="Editar"><Pencil size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }} className={`${userColor ? 'text-slate-500 hover:text-red-600' : 'text-slate-300 hover:text-red-400'} transition-colors`} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
