import { Trade } from '@/types/trade';

const splitTrades = (items: Trade[]) => {
  const wins = items.filter((t) => t.result === 'Win');
  const losses = items.filter((t) => t.result === 'Loss');
  return { wins, losses };
};

const computeGroupStats = (items: Trade[]) => {
  const { wins, losses } = splitTrades(items);

  const winCount = wins.length;
  const lossCount = losses.length;

  const winRate = items.length ? (winCount / items.length) * 100 : 0;

  const totalPnL = items.reduce((s, t) => s + Number(t.amount || 0), 0);

  const avgWin =
    winCount > 0
      ? wins.reduce((s, t) => s + Number(t.amount || 0), 0) / winCount
      : 0;

  const avgLoss =
    lossCount > 0
      ? losses.reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0) /
        lossCount
      : 0;

  const grossProfit = wins.reduce((s, t) => s + Number(t.amount || 0), 0);
  const grossLoss = losses.reduce(
    (s, t) => s + Math.abs(Number(t.amount || 0)),
    0
  );

  const profitFactor =
    grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss;

  const expectancy =
    (winRate / 100) * avgWin + ((100 - winRate) / 100) * -Math.abs(avgLoss);

  return {
    trades: items.length,
    winRate,
    totalPnL,
    profitFactor,
    expectancy,
  };
};

const tallyMistakes = (trades: Trade[], checklistRules: any) => {
  const checklistTally: Record<string, number> = {};
  const behavioralTally: Record<string, number> = {};

  Object.keys(checklistRules).forEach((key) => {
    checklistTally[checklistRules[key].type] = 0;
  });

  trades.forEach((t) => {
    const mistakes = (t as any).behavioralMistakes || [];

    mistakes.forEach((m: any) => {
      if (m.category === 'checklist') {
        checklistTally[m.type] = (checklistTally[m.type] || 0) + 1;
      } else if (m.category === 'behavioral') {
        behavioralTally[m.type] = (behavioralTally[m.type] || 0) + 1;
      }
    });
  });

  const sortTally = (tally: Record<string, number>) =>
    Object.fromEntries(Object.entries(tally).sort(([, a], [, b]) => b - a));

  return {
    checklistTally: sortTally(checklistTally),
    behavioralTally: sortTally(behavioralTally),
  };
};

const buildGroup = (label: string, items: Trade[]) => ({
  label,
  stats: computeGroupStats(items),
});

export const applyFilters = (trades: Trade[], filters: any) => {
  return trades.filter((t) => {
    const sessionMatch =
      filters.session?.length === 0 || filters.session?.includes(t.session);

    const resultMatch =
      filters.result?.length === 0 || filters.result?.includes(t.result);

    const pairMatch =
      filters.pair?.length === 0 || filters.pair?.includes(t.pair);

    const feelingMatch =
      filters.feeling?.length === 0 || filters.feeling?.includes(t.feeling);

    const startMatch = filters.startDate
      ? new Date(t.date) >= new Date(filters.startDate)
      : true;

    const endMatch = filters.endDate
      ? new Date(t.date) <= new Date(filters.endDate)
      : true;

    return (
      sessionMatch &&
      resultMatch &&
      pairMatch &&
      feelingMatch &&
      startMatch &&
      endMatch
    );
  });
};

export const buildTradeAnalytics = (trades: Trade[], filters?: any) => {
  const filteredTrades = filters ? applyFilters(trades, filters) : trades;
  // =====================
  // ENRICHED TRADES (basic normalization)
  // =====================
  const enrichedTrades = [...filteredTrades]
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
  const { wins: winTrades, losses: lossTrades } = splitTrades(enrichedTrades);

  const winCount = winTrades.length;
  const lossCount = lossTrades.length;
  const breakevenCount = enrichedTrades.filter(
    (t) => t.result === 'Breakeven'
  ).length;
  const totalTrades = enrichedTrades.length;

  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  const totalPnL = enrichedTrades.reduce(
    (s, t) => s + Number(t.amount || 0),
    0
  );

  const winPnL = winTrades.reduce((s, t) => s + Number(t.amount || 0), 0);
  const lossPnL = lossTrades.reduce(
    (s, t) => s + Math.abs(Number(t.amount || 0)),
    0
  );

  const stats = {
    trades: enrichedTrades.length,
    winRate,
    totalPnL,
    avgWin: winTrades.length ? winPnL / winTrades.length : 0,
    avgLoss: lossTrades.length ? lossPnL / lossTrades.length : 0,
  };

  const profitFactor = stats.avgLoss !== 0 ? Math.abs(winPnL / lossPnL) : 0;

  const expectancy =
    (stats.winRate / 100) * stats.avgWin +
    ((100 - stats.winRate) / 100) * -Math.abs(stats.avgLoss);

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
      const raw = t[key];
      const k =
        raw === null || raw === undefined || raw === ''
          ? 'Unknown'
          : String(raw);
      if (!map[k]) map[k] = [];
      map[k].push(t);
    });

    return Object.entries(map).map(([label, items]) => ({
      label,
      stats: computeGroupStats(items),
    }));
  };

  const sessionOrder = ['Asia', 'London', 'NYAM', 'Out of KZ'];

  const sessionGroupsMap: Record<string, Trade[]> = {};

  enrichedTrades.forEach((t) => {
    const key = String(t.session || 'Unknown');

    if (!sessionGroupsMap[key]) sessionGroupsMap[key] = [];
    sessionGroupsMap[key].push(t);
  });

  const sessionGroups = sessionOrder
    .map((session) => {
      const items = sessionGroupsMap[session] || [];

      return buildGroup(session, items);
    })
    .filter((g) => g.stats.trades > 0);

  const typeGroups = groupBy('type');
  const pairGroups = groupBy('pair');

  const emotionOrder = ['Calm', 'Anxious'];

  const emotionGroupsMap: Record<string, Trade[]> = {};

  enrichedTrades.forEach((t) => {
    const key = String(t.feeling || 'Unknown');

    if (!emotionGroupsMap[key]) emotionGroupsMap[key] = [];
    emotionGroupsMap[key].push(t);
  });

  const emotionGroups = emotionOrder
    .map((emotion) => {
      const items = emotionGroupsMap[emotion] || [];

      return buildGroup(emotion, items);
    })
    .filter((g) => g.stats.trades > 0);

  const weekdayOrder = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const weekdayGroupsMap: Record<string, Trade[]> = {};

  enrichedTrades.forEach((t) => {
    const day = new Date(t.date).toLocaleDateString('en-US', {
      weekday: 'long',
    });

    if (!weekdayGroupsMap[day]) weekdayGroupsMap[day] = [];
    weekdayGroupsMap[day].push(t);
  });

  const weekdayGroups = weekdayOrder
    .map((day) => {
      const items = weekdayGroupsMap[day] || [];

      return buildGroup(day, items);
    })
    .filter((g) => g.stats.trades > 0);

  const scoreGroupsMap: Record<string, Trade[]> = {};

  enrichedTrades.forEach((t) => {
    const key = String(t.checklistScore);

    if (!scoreGroupsMap[key]) scoreGroupsMap[key] = [];
    scoreGroupsMap[key].push(t);
  });

  const scoreGroups = Object.entries(scoreGroupsMap)
    .map(([label, items]) => buildGroup(label, items))
    .sort((a, b) => Number(a.label) - Number(b.label));

  // =====================
  // CHART DATA HELPERS
  // =====================
  const sessionChartData = sessionGroups.map((g) => ({
    name: g.label,
    pnl: g.stats.totalPnL,
    winRate: g.stats.winRate,
    trades: g.stats.trades,
  }));

  const typeChartData = typeGroups.map((g) => ({
    name: g.label,
    pnl: g.stats.totalPnL,
    winRate: g.stats.winRate,
    trades: g.stats.trades,
  }));

  const emotionChartData = emotionGroups.map((g) => ({
    name: g.label,
    pnl: g.stats.totalPnL,
    winRate: g.stats.winRate,
    trades: g.stats.trades,
  }));

  const pairChartData = pairGroups.map((g) => ({
    name: g.label,
    pnl: g.stats.totalPnL,
    winRate: g.stats.winRate,
    trades: g.stats.trades,
  }));

  const weekdayChartData = weekdayGroups.map((g) => ({
    name: g.label,
    pnl: g.stats.totalPnL,
    winRate: g.stats.winRate,
    trades: g.stats.trades,
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

  const decisionTrades = successTrades.length + failTrades.length;

  const movedStopsStats = {
    total: movedStopsTrades.length,
    success: successTrades.length,
    fail: failTrades.length,
    neutral: neutralTrades.length,

    pnlSuccess: successTrades.reduce((s, t) => s + safeAmount(t.amount), 0),
    pnlFail: failTrades.reduce((s, t) => s + safeAmount(t.amount), 0),
    pnlNeutral: neutralTrades.reduce((s, t) => s + safeAmount(t.amount), 0),

    totalPnL: movedStopsTrades.reduce((s, t) => s + safeAmount(t.amount), 0),

    quality: decisionTrades ? (successTrades.length / decisionTrades) * 100 : 0,

    netImpact: successTrades.length - failTrades.length,
    pnlImpact:
      successTrades.reduce((s, t) => s + safeAmount(t.amount), 0) -
      Math.abs(failTrades.reduce((s, t) => s + safeAmount(t.amount), 0)),
  };

  // =====================
  // MISTAKES
  // =====================
  const mistakeSummary: Record<string, number> = {};

  enrichedTrades.forEach((t) => {
    t.behavioralMistakes?.forEach((m) => {
      mistakeSummary[m.type] = (mistakeSummary[m.type] || 0) + 1;
    });
  });

  const mistakeCost = enrichedTrades.reduce((sum, t) => {
    if (t.result === 'Loss' && t.behavioralMistakes?.length) {
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
    winCount,
    lossCount,
    breakevenCount,
    avgWin: stats.avgWin,
    avgLoss: stats.avgLoss,

    pairSuggestions: Array.from(
      new Set(enrichedTrades.map((t) => t.pair).filter(Boolean))
    ),

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
    tallyMistakes,
  };
};
