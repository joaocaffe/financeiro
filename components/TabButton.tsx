import React from 'react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-4 transition-colors ${
      active ? 'text-blue-600' : 'text-slate-400'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">{label}</span>
  </button>
);
