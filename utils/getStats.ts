// utils/getStats.ts

export const getStats = (list: Trade[]) => {
  const pnl = list.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const wins = list.filter((t) => t.result === 'Win').length;
  const losses = list.filter((t) => t.result === 'Loss').length;
  const total = list.length;

  const winRate = total > 0 ? (wins / total) * 100 : 0;

  const totalWin = list
    .filter((t) => t.result === 'Win')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalLoss = list
    .filter((t) => t.result === 'Loss')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

  const profitFactor =
    totalLoss === 0 ? (totalWin > 0 ? Infinity : 0) : totalWin / totalLoss;

  const expectancy = total > 0 ? pnl / total : 0;

  return {
    totalPnL: pnl,
    trades: total,
    winRate,
    profitFactor,
    expectancy,
  };
};
