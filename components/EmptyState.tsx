import React from 'react';
import { Wallet } from 'lucide-react';

interface EmptyStateProps {
    message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
            <Wallet size={32} />
        </div>
        <p className="text-sm font-medium">{message}</p>
    </div>
);
