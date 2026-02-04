import { useState, useEffect } from 'react';
import { ColumnVisibility } from '../types';

export const useFilters = () => {
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(['all']);
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>(['all']);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [projectionRange, setProjectionRange] = useState<number>(6);
    const [isProjectionCardMenuOpen, setIsProjectionCardMenuOpen] = useState(false);

    const [showHiddenItems, setShowHiddenItems] = useState<boolean>(false);
    const [includeHiddenInStats, setIncludeHiddenInStats] = useState<boolean>(() => {
        const saved = localStorage.getItem('financas_includeHiddenInStats');
        return saved ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('financas_includeHiddenInStats', JSON.stringify(includeHiddenInStats));
    }, [includeHiddenInStats]);

    const [showDashboard, setShowDashboard] = useState<boolean>(true);
    const [showCardsInDashboard, setShowCardsInDashboard] = useState<boolean>(true);
    const [showProjection, setShowProjection] = useState<boolean>(true);
    const [showUserSummary, setShowUserSummary] = useState<boolean>(true);
    const [showQuickActions, setShowQuickActions] = useState<boolean>(false);
    const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'value'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [currentDate, setCurrentDate] = useState(new Date());

    const [periodType, setPeriodType] = useState<'mensal' | 'periodo'>('mensal');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        d.setDate(0);
        return d.toISOString().split('T')[0];
    });

    const [visibility, setVisibility] = useState<ColumnVisibility>(() => {
        const saved = localStorage.getItem('financas_visibility');
        return saved ? JSON.parse(saved) : {
            description: true,
            location: true,
            date: true,
            value: true,
            installments: true,
            user: true
        };
    });

    useEffect(() => {
        localStorage.setItem('financas_visibility', JSON.stringify(visibility));
    }, [visibility]);

    const changeMonth = (offset: number) => {
        const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        setCurrentDate(next);
    };

    const handleUserToggle = (userId: string) => {
        if (userId === 'all') {
            setSelectedUserIds(['all']);
            return;
        }
        setSelectedUserIds(prev => {
            if (prev.includes('all')) return [userId];
            if (isMultiSelectMode) {
                if (prev.includes(userId)) {
                    const next = prev.filter(id => id !== userId);
                    return next.length === 0 ? ['all'] : next;
                }
                return [...prev, userId];
            } else return [userId];
        });
    };

    const handleCardToggle = (cardId: string) => {
        if (cardId === 'all') {
            setSelectedCardIds(['all']);
            return;
        }
        setSelectedCardIds(prev => {
            if (prev.includes('all')) return [cardId];
            if (true) { // No resumo sempre permitimos multi-seleção para a projeção
                if (prev.includes(cardId)) {
                    const next = prev.filter(id => id !== cardId);
                    return next.length === 0 ? ['all'] : next;
                }
                return [...prev, cardId];
            }
        });
    };

    return {
        selectedUserIds, setSelectedUserIds,
        selectedCardIds, setSelectedCardIds,
        isMultiSelectMode, setIsMultiSelectMode,
        projectionRange, setProjectionRange,
        isProjectionCardMenuOpen, setIsProjectionCardMenuOpen,
        showHiddenItems, setShowHiddenItems,
        includeHiddenInStats, setIncludeHiddenInStats,
        showDashboard, setShowDashboard,
        showCardsInDashboard, setShowCardsInDashboard,
        showProjection, setShowProjection,
        showUserSummary, setShowUserSummary,
        showQuickActions, setShowQuickActions,
        sortConfig, setSortConfig,
        currentDate, setCurrentDate,
        periodType, setPeriodType,
        startDate, setStartDate,
        endDate, setEndDate,
        visibility, setVisibility,
        changeMonth,
        handleUserToggle,
        handleCardToggle
    };
};
