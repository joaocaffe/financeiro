import React from 'react';
import { Copy, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Transaction, ColumnVisibility } from '../types';

interface ExtendedTransaction extends Transaction {
    currentInstallment?: number;
}

interface TransactionItemProps {
    tx: ExtendedTransaction;
    onDelete: (id: string) => void;
    onEdit: (tx: Transaction) => void;
    onDuplicate: (tx: Transaction) => void;
    onTogglePaid: (id: string) => void;
    onToggleHidden: (id: string) => void;
    visibility: ColumnVisibility;
    userName: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
    tx,
    onDelete,
    onEdit,
    onDuplicate,
    onTogglePaid,
    onToggleHidden,
    visibility,
    userName
}) => {
    const installments = tx.installments && tx.installments > 0 ? tx.installments : 1;
    const installmentValue = tx.isSubscription ? tx.totalValue : tx.totalValue / installments;

    return (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${tx.isHidden ? 'bg-slate-50 border-dashed border-slate-300 opacity-50' : tx.isPaid ? 'bg-white opacity-60 grayscale shadow-none' : 'bg-white shadow-sm border-slate-50'}`}>
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-start">
                    <div className="flex-1 overflow-hidden pr-2">
                        {visibility.description && <h5 className={`text-sm font-bold truncate tracking-tight ${tx.isHidden ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{tx.description}</h5>}
                        <div className="flex gap-2 items-center text-[10px] text-slate-400 truncate font-medium">
                            {visibility.location && <span>{tx.location}</span>}
                            {visibility.location && visibility.date && <span>•</span>}
                            {visibility.date && <span>{new Date(tx.date).toLocaleDateString('pt-BR')}</span>}
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        {visibility.value && <p className="text-sm font-black text-slate-900 leading-none mb-1">R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
                        {visibility.installments && tx.installments > 1 && <p className="text-[9px] font-black text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Parc. {tx.currentInstallment}/{tx.installments}</p>}
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2">
                    {visibility.user && <span className="text-[8px] px-2 py-0.5 rounded-lg font-black bg-slate-100 text-slate-500 uppercase tracking-widest">{userName}</span>}
                    <div className="flex gap-2.5">
                        <button onClick={(e) => { e.stopPropagation(); onToggleHidden(tx.id); }} className={`transition-colors ${tx.isHidden ? 'text-orange-500' : 'text-slate-300 hover:text-orange-400'}`} title="Ocultar Item">{tx.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                        <button onClick={(e) => { e.stopPropagation(); onDuplicate(tx); }} className="text-slate-300 hover:text-emerald-500 transition-colors" title="Duplicar"><Copy size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(tx); }} className="text-slate-300 hover:text-blue-400 transition-colors" title="Editar"><Pencil size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }} className="text-slate-300 hover:text-red-400 transition-colors" title="Excluir"><Trash2 size={14} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
