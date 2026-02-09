import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Calculator, Check, ArrowLeft } from 'lucide-react';

interface CalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (total: number) => void;
    initialValue?: number;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose, onConfirm, initialValue = 0 }) => {
    const [values, setValues] = useState<number[]>([]);
    const [currentInput, setCurrentInput] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValues(initialValue > 0 ? [initialValue] : []);
            setCurrentInput('');
            // Focus input after a short delay to ensure modal is rendered
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialValue]);

    const handleAddValue = () => {
        if (!currentInput) return;
        const num = parseFloat(currentInput.replace(',', '.'));
        if (!isNaN(num)) {
            setValues([...values, num]);
            setCurrentInput('');
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddValue();
        }
    };

    const removeValue = (index: number) => {
        const newValues = [...values];
        newValues.splice(index, 1);
        setValues(newValues);
        inputRef.current?.focus();
    };

    const total = values.reduce((acc, curr) => acc + curr, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <Calculator size={18} className="text-blue-600" />
                        Calculadora de Soma
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Amount Display */}
                <div className="p-6 bg-white text-center border-b border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Calculado</p>
                    <div className="text-4xl font-black text-slate-800 tracking-tight">
                        <span className="text-2xl text-slate-400 mr-1">R$</span>
                        {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                            <input
                                ref={inputRef}
                                type="number"
                                placeholder="0,00"
                                className="w-full pl-8 pr-3 py-3 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                value={currentInput}
                                onChange={(e) => setCurrentInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                step="0.01"
                            />
                        </div>
                        <button
                            onClick={handleAddValue}
                            disabled={!currentInput}
                            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </div>

                {/* List of Values */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/50 min-h-[150px]">
                    {values.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8">
                            <Calculator size={32} className="mb-2 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">Nenhum valor adicionado</p>
                        </div>
                    ) : (
                        values.map((val, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm animate-in slide-in-from-left duration-200">
                                <span className="font-bold text-slate-600">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <button
                                    onClick={() => removeValue(idx)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 text-slate-500 font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(total)}
                        disabled={total === 0 && values.length === 0}
                        className="flex-[2] py-3.5 bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Usar Total
                    </button>
                </div>

            </div>
        </div>
    );
};
