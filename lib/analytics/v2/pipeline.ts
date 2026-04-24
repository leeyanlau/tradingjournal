import { Trade } from '@/types/trade';

export const buildTradeAnalytics = (trades: Trade[]) => {
  // =====================
  // ENRICHED TRADES (basic normalization)
  // =====================
  const enrichedTrades = [...trades]
    .sort(
      (a, b) =>
        new Date(`${b.date}T${b.entryTime}`).getTime() -
        new Date(`${a.date}T${a.entryTime}`).getTime()
    )
    .map((t, idx) => ({
      ...t,
      tradeNo: idx + 1,
    }));

  // =====================
  // BASIC STATS (placeholder if you already have custom stats logic)
  // =====================
  const winTrades = enrichedTrades.filter((t) => t.result === 'Win');
  const lossTrades = enrichedTrades.filter((t) => t.result === 'Loss');

  const totalPnL = enrichedTrades.reduce(
    (s, t) => s + Number(t.amount || 0),
    0
  );

  const stats = {
    trades: enrichedTrades.length,
    winRate: enrichedTrades.length
      ? (winTrades.length / enrichedTrades.length) * 100
      : 0,
    totalPnL,
    avgWin:
      winTrades.length > 0
        ? winTrades.reduce((s, t) => s + Number(t.amount || 0), 0) /
          winTrades.length
        : 0,
    avgLoss:
      lossTrades.length > 0
        ? lossTrades.reduce((s, t) => s + Number(t.amount || 0), 0) /
          lossTrades.length
        : 0,
  };

  const profitFactor =
    stats.avgLoss !== 0
      ? Math.abs(
          winTrades.reduce((s, t) => s + Number(t.amount || 0), 0) /
            lossTrades.reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0)
        )
      : 0;

  const expectancy =
    (stats.winRate / 100) * stats.avgWin +
    ((100 - stats.winRate) / 100) * stats.avgLoss;

  const tradesPerDayMap: Record<string, number> = {};
  enrichedTrades.forEach((t) => {
    tradesPerDayMap[t.date] = (tradesPerDayMap[t.date] || 0) + 1;
  });

  const avgTradesPerDay =
    Object.keys(tradesPerDayMap).length > 0
      ? enrichedTrades.length / Object.keys(tradesPerDayMap).length
      : 0;

  // =====================
  // GROUP HELPERS
  // =====================
  const groupBy = (key: keyof Trade) => {
    const map: Record<string, Trade[]> = {};

    enrichedTrades.forEach((t) => {
      const k = String(t[key] || 'Unknown');
      if (!map[k]) map[k] = [];
      map[k].push(t);
    });

    return Object.entries(map).map(([label, items]) => ({
      label,
      stats: {
        trades: items.length,
        winRate:
          (items.filter((t) => t.result === 'Win').length / items.length) * 100,
        totalPnL: items.reduce((s, t) => s + Number(t.amount || 0), 0),
        profitFactor: 1, // placeholder (safe default)
        expectancy: 0, // placeholder
      },
    }));
  };

  const sessionGroups = groupBy('session');
  const typeGroups = groupBy('type');
  const emotionGroups = groupBy('feeling');
  const pairGroups = groupBy('pair');

  const weekdayGroups = (() => {
    const map: Record<string, Trade[]> = {};

    enrichedTrades.forEach((t) => {
      const day = new Date(t.date).toLocaleDateString('en-US', {
        weekday: 'long',
      });

      if (!map[day]) map[day] = [];
      map[day].push(t);
    });

    return Object.entries(map).map(([label, items]) => ({
      label,
      stats: {
        trades: items.length,
        winRate:
          (items.filter((t) => t.result === 'Win').length / items.length) * 100,
        totalPnL: items.reduce((s, t) => s + Number(t.amount || 0), 0),
        profitFactor: 1,
        expectancy: 0,
      },
    }));
  })();

  const scoreGroups = groupBy('checklistScore' as any);

  // =====================
  // CHART DATA HELPERS
  // =====================
  const sessionChartData = sessionGroups.map((g) => ({
    name: g.label,
    pnl: g.stats.totalPnL,
  }));

  const typeChartData = typeGroups.map((g) => ({
    name: g.label,
    pnl: g.stats.totalPnL,
  }));

  const emotionChartData = emotionGroups.map((g) => ({
    name: g.label,
    pnl: g.stats.totalPnL,
  }));

  const pairChartData = pairGroups.map((g) => ({
    name: g.label,
    winRate: g.stats.winRate,
  }));

  const weekdayChartData = weekdayGroups.map((g) => ({
    name: g.label,
    pnl: g.stats.totalPnL,
  }));

  // =====================
  // MOVED STOPS STATS
  // =====================
  const movedStopsTrades = enrichedTrades.filter((t) => t.movedStops);

  const successTrades = movedStopsTrades.filter(
    (t) => t.movedStopsWorked === 'PROTECTED'
  );

  const failTrades = movedStopsTrades.filter(
    (t) => t.movedStopsWorked === 'OVERMANAGED'
  );

  const neutralTrades = movedStopsTrades.filter(
    (t) => t.movedStopsWorked === 'IRRELEVANT'
  );

  const safeAmount = (v: any) => Number(v || 0);

  const movedStopsStats = {
    total: movedStopsTrades.length,
    success: successTrades.length,
    fail: failTrades.length,
    neutral: neutralTrades.length,

    pnlSuccess: successTrades.reduce((s, t) => s + safeAmount(t.amount), 0),
    pnlFail: failTrades.reduce((s, t) => s + safeAmount(t.amount), 0),
    pnlNeutral: neutralTrades.reduce((s, t) => s + safeAmount(t.amount), 0),

    totalPnL: movedStopsTrades.reduce((s, t) => s + safeAmount(t.amount), 0),

    quality: movedStopsTrades.length
      ? (successTrades.length / movedStopsTrades.length) * 100
      : 0,

    netImpact: successTrades.length - failTrades.length,
    pnlImpact:
      successTrades.reduce((s, t) => s + safeAmount(t.amount), 0) -
      failTrades.reduce((s, t) => s + safeAmount(t.amount), 0),
  };

  // =====================
  // MISTAKES
  // =====================
  const mistakeSummary: Record<string, number> = {};

  enrichedTrades.forEach((t) => {
    t.mistakes?.forEach((m) => {
      mistakeSummary[m.type] = (mistakeSummary[m.type] || 0) + 1;
    });
  });

  const mistakeCost = enrichedTrades.reduce((sum, t) => {
    if (t.result === 'Loss' && t.mistakes?.length) {
      return sum + Math.abs(Number(t.amount || 0));
    }
    return sum;
  }, 0);

  // =====================
  // EQUITY CURVE
  // =====================
  const sorted = [...enrichedTrades].sort(
    (a, b) =>
      new Date(`${a.date}T${a.entryTime}`).getTime() -
      new Date(`${b.date}T${b.entryTime}`).getTime()
  );

  let equity = 0;

  const equityData = sorted.map((t, index) => {
    const pnl = Number(t.amount || 0);
    equity += pnl;

    return {
      index: index + 1,
      date: t.date,
      entryTime: t.entryTime,
      exitTime: t.exitTime,
      pnl,
      equity,
      pair: t.pair,
      result: t.result,
    };
  });

  // =====================
  // RETURN EVERYTHING
  // =====================
  return {
    enrichedTrades,
    winRate: stats.winRate,
    totalPnL: stats.totalPnL,
    avgWin: stats.avgWin,
    avgLoss: stats.avgLoss,

    profitFactor,
    expectancy,
    avgTradesPerDay,

    sessionGroups,
    weekdayGroups,
    emotionGroups,
    scoreGroups,
    typeGroups,
    pairGroups,

    sessionChartData,
    weekdayChartData,
    emotionChartData,
    typeChartData,
    pairChartData,

    movedStopsStats,
    mistakeSummary,
    mistakeCost,
    equityData,
  };
};
