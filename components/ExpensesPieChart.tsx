import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction } from '../types';
import { calculateTransactionValue } from '../utils/transactionUtils';

interface ExpensesPieChartProps {
    transactions: Transaction[];
}

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
];

export const ExpensesPieChart: React.FC<ExpensesPieChartProps> = ({ transactions }) => {
    const data = useMemo(() => {
        const grouped = transactions.reduce((acc: Record<string, number>, tx: Transaction) => {
            const type = tx.type || 'Outros';

            const value = calculateTransactionValue(tx);
            const finalValue = Number.isFinite(value) ? value : 0;

            const currentTotal = acc[type] ?? 0;
            acc[type] = currentTotal + finalValue;

            return acc;
        }, {} as Record<string, number>);

        const totalValue = Object.values(grouped).reduce((sum, val) => sum + val, 0);

        return Object.entries(grouped)
            .map(([name, value]: [string, number]) => ({
                name,
                value,
                percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
            }))
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-3xl border border-slate-100 h-64 text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest text-center">Gráfico Sem dados</p>
                <p className="text-[10px] mt-1 text-slate-300">Nenhum gasto neste período</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 h-96">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">DISTRIBUIÇÃO POR CATEGORIA</h3>
            <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${props.payload.percentage.toFixed(1)}%)`,
                            name
                        ]}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#475569', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value, entry: any) => (
                            <span className="text-[10px] font-bold text-slate-600 ml-1">
                                {value} <span className="text-slate-400 font-normal">({entry.payload.percentage.toFixed(0)}%)</span>
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
