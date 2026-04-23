import { useMemo } from 'react';
import { Trade } from '@/types/trade';

export const useTradeStats = (trades: Trade[]) => {
  return useMemo(() => {
    const wins = trades.filter((t) => t.result === 'Win');
    const losses = trades.filter((t) => t.result === 'Loss');

    const winCount = wins.length;
    const lossCount = losses.length;
    const totalTrades = winCount + lossCount;

    const totalPnL = trades.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const avgWin =
      winCount > 0
        ? wins.reduce((sum, t) => sum + Number(t.amount), 0) / winCount
        : 0;

    const avgLoss =
      lossCount > 0
        ? losses.reduce((sum, t) => sum + Number(t.amount), 0) / lossCount
        : 0;

    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    const totalWinsAmount = wins.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const totalLossAmount = Math.abs(
      losses.reduce((sum, t) => sum + Number(t.amount || 0), 0)
    );

    const profitFactor =
      totalLossAmount > 0 ? totalWinsAmount / totalLossAmount : 0;

    const expectancy =
      totalTrades > 0
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
  }, [trades]);
};
