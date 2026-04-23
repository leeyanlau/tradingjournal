import { Trade } from '../types/trade';

export const getTradeStats = (trades: Trade[]) => {
  const validTrades = trades.filter((t) => t.result !== 'Breakeven');

  const pnl = trades.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const wins = trades.filter((t) => t.result === 'Win');
  const losses = trades.filter((t) => t.result === 'Loss');

  const winRate =
    validTrades.length > 0 ? (wins.length / validTrades.length) * 100 : 0;

  const totalWin = wins.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalLoss = losses.reduce(
    (s, t) => s + Math.abs(Number(t.amount || 0)),
    0
  );

  const profitFactor =
    totalLoss === 0 ? (totalWin > 0 ? Infinity : 0) : totalWin / totalLoss;

  const expectancy = trades.length > 0 ? pnl / trades.length : 0;

  return {
    trades: trades.length,
    totalPnL: pnl,
    winRate,
    profitFactor,
    expectancy,
  };
};
