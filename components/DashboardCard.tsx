import React from 'react';

interface DashboardCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    badge?: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color, bgColor, badge }) => (
    <div className={`${bgColor} p-4 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/20 relative overflow-hidden`}>
        <div className={`p-1.5 rounded-lg w-fit ${color} bg-white/50 mb-1`}>
            {icon}
        </div>
        {badge && <div className="absolute top-3 right-3">{badge}</div>}
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{title}</span>
        <span className="text-sm font-black text-slate-800">
            R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
    </div>
);
