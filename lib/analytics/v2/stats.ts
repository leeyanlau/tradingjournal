import { EnrichedTrade, TradeStats } from './types';

export const buildStats = (trades: EnrichedTrade[]): TradeStats => {
  const wins = trades.filter((t) => t.result === 'Win');
  const losses = trades.filter((t) => t.result === 'Loss');

  const totalPnL = trades.reduce((s, t) => s + Number(t.amount || 0), 0);

  const winCount = wins.length;
  const lossCount = losses.length;
  const total = trades.length;

  const avgWin = winCount
    ? wins.reduce((s, t) => s + Number(t.amount || 0), 0) / winCount
    : 0;

  const avgLoss = lossCount
    ? losses.reduce((s, t) => s + Number(t.amount || 0), 0) / lossCount
    : 0;

  const grossProfit = wins.reduce((s, t) => s + Number(t.amount || 0), 0);
  const grossLoss = Math.abs(
    losses.reduce((s, t) => s + Number(t.amount || 0), 0)
  );

  return {
    trades: total,
    totalPnL,
    winRate: total ? (winCount / total) * 100 : 0,
    avgWin,
    avgLoss,
    profitFactor: grossLoss ? grossProfit / grossLoss : 0,
    expectancy: total
      ? (winCount / total) * avgWin + (lossCount / total) * avgLoss
      : 0,
  };
};
