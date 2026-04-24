import { useMemo } from 'react';
import { Trade } from '@/types/trade';

import { detectMistakes } from '@/lib/analytics/mistakes';
import { calculateChecklist } from '@/lib/analytics/checklist';

export const useTradeAnalytics = (trades: Trade[]) => {
  /**
   * 1. Enriched trades (core dataset)
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
   * 2. Sorted trades (global order)
   */
  const sortedTrades = useMemo(() => {
    return [...enrichedTrades].sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }, [enrichedTrades]);

  /**
   * 3. Display layer
   */
  const displayTrades = sortedTrades;

  /**
   * 4. Stats layer (merge old useTradeStats here later)
   */
  const stats = useMemo(() => {
    const wins = enrichedTrades.filter((t) => t.result === 'Win');
    const losses = enrichedTrades.filter((t) => t.result === 'Loss');

    const winCount = wins.length;
    const lossCount = losses.length;
    const totalTrades = enrichedTrades.length;

    const totalPnL = enrichedTrades.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const totalWinsAmount = wins.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const totalLossAmount = Math.abs(
      losses.reduce((sum, t) => sum + Number(t.amount || 0), 0)
    );

    const avgWin = winCount ? totalWinsAmount / winCount : 0;
    const avgLoss = lossCount ? totalLossAmount / lossCount : 0;

    const winRate = totalTrades ? (winCount / totalTrades) * 100 : 0;

    const profitFactor =
      totalLossAmount > 0 ? totalWinsAmount / totalLossAmount : 0;

    const expectancy = totalTrades
      ? (winRate / 100) * avgWin + ((100 - winRate) / 100) * avgLoss
      : 0;

    return {
      winRate,
      totalPnL,
      avgWin,
      avgLoss,
      profitFactor,
      expectancy,
      winCount,
      lossCount,
      totalWinsAmount,
      totalLossAmount,
    };
  }, [enrichedTrades]);

  /**
   * 5. Groups layer (merge useTradeGroups later)
   */
  const typeGroups = useMemo(() => {
    return ['Scalp', 'Day Trade', 'Swing'].map((type) => {
      const list = enrichedTrades.filter((t) => t.type === type);

      const wins = list.filter((t) => t.result === 'Win');
      const losses = list.filter((t) => t.result === 'Loss');

      const totalPnL = list.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const winCount = wins.length;
      const lossCount = losses.length;
      const total = list.length;

      const winRate = total ? (winCount / total) * 100 : 0;

      const grossWins = wins.reduce((s, t) => s + Number(t.amount || 0), 0);
      const grossLoss = Math.abs(
        losses.reduce((s, t) => s + Number(t.amount || 0), 0)
      );

      const profitFactor = grossLoss ? grossWins / grossLoss : 0;

      const avgWin = winCount ? grossWins / winCount : 0;
      const avgLoss = lossCount ? grossLoss / lossCount : 0;

      const expectancy = total
        ? (winRate / 100) * avgWin + ((100 - winRate) / 100) * avgLoss
        : 0;

      return {
        label: type,
        stats: {
          totalPnL,
          trades: total,
          winRate,
          profitFactor,
          expectancy,
        },
      };
    });
  }, [enrichedTrades]);

  return {
    enrichedTrades,
    sortedTrades,
    displayTrades,
    stats,
    typeGroups,
  };
};
