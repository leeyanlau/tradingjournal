interface Trade {
  date: string;
  amount: string;
}

export interface KPIStats {
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  avgTradesPerDay: number;
}

export function calculateKPIs(trades: Trade[]): KPIStats {
  if (!trades.length) {
    return {
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      avgTradesPerDay: 0,
    };
  }

  // 🔒 SAFE PARSING (prevents NaN bugs)
  const amounts = trades.map((t) => Number(t.amount)).filter((n) => !isNaN(n));

  const winningTrades = amounts.filter((n) => n > 0);
  const losingTrades = amounts.filter((n) => n < 0);

  const avgWin =
    winningTrades.length > 0
      ? winningTrades.reduce((a, b) => a + b, 0) / winningTrades.length
      : 0;

  const avgLoss =
    losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((a, b) => a + b, 0) / losingTrades.length)
      : 0;

  const largestWin = amounts.length > 0 ? Math.max(...amounts) : 0;

  const largestLoss = amounts.length > 0 ? Math.min(...amounts) : 0;

  // 🧠 SAFE DATE GROUPING
  const validDates = trades
    .map((t) => new Date(t.date))
    .filter((d) => !isNaN(d.getTime()));

  const uniqueDays = new Set(validDates.map((d) => d.toDateString())).size;

  const avgTradesPerDay = uniqueDays > 0 ? trades.length / uniqueDays : 0;

  return {
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    avgTradesPerDay,
  };
}
