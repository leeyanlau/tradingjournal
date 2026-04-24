import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { detectMistakes } from '@/lib/analytics/mistakes';
import { calculateChecklist } from '@/lib/analytics/checklist';

export const useTradePipeline = (trades: Trade[]) => {
  /**
   * 1. Enrichment layer (analytics added per trade)
   */
  const enrichedTrades = useMemo(() => {
    return trades.map((trade) => {
      const checklist = calculateChecklist(trade.checklist);

      return {
        ...trade,
        mistakes: detectMistakes(trade),
        checklistScore: checklist.score,
        checklistPercentage: checklist.percentage,
      };
    });
  }, [trades]);

  /**
   * 2. Sorting layer (latest first)
   */
  const sortedTrades = useMemo(() => {
    return [...enrichedTrades].sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }, [enrichedTrades]);

  /**
   * 3. Display layer (future filter point)
   */
  const displayTrades = useMemo(() => {
    return sortedTrades;
  }, [sortedTrades]);

  return {
    enrichedTrades,
    sortedTrades,
    displayTrades,
  };
};
