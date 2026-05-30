import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { buildTradeAnalytics } from '@/lib/analytics/v2/pipeline';
import { calculateKPIs } from '@/lib/analytics/calculateKPIs';

export const useTradeAnalyticsV2 = (trades: Trade[]) => {
  return useMemo(() => {
    // -----------------------------
    // CORE ANALYTICS (NO FILTERING HERE)
    // -----------------------------
    const analytics = buildTradeAnalytics(trades);

    const kpis = calculateKPIs(trades);

    const safeNumber = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

    return {
      ...analytics,

      enrichedTrades: analytics.enrichedTrades ?? [],

      // -----------------------------
      // CORE METRICS
      // -----------------------------
      winRate: safeNumber(analytics.winRate),
      totalPnL: safeNumber(analytics.totalPnL),
      avgWin: safeNumber(analytics.avgWin),
      avgLoss: safeNumber(analytics.avgLoss),
      profitFactor: safeNumber(analytics.profitFactor),
      expectancy: safeNumber(analytics.expectancy),
      avgTradesPerDay: safeNumber(analytics.avgTradesPerDay),

      winCount: analytics.winCount,
      lossCount: analytics.lossCount,
      breakevenCount: analytics.breakevenCount,

      // -----------------------------
      // KPI EXTENSIONS
      // -----------------------------
      largestWin: kpis.largestWin,
      largestLoss: kpis.largestLoss,

      // -----------------------------
      // MOVED STOPS
      // -----------------------------
      movedStopsStats: analytics.movedStopsStats ?? {
        total: 0,
        success: 0,
        fail: 0,
        neutral: 0,
        pnlSuccess: 0,
        pnlFail: 0,
        pnlNeutral: 0,
        totalPnL: 0,
        quality: 0,
        netImpact: 0,
        pnlImpact: 0,
      },

      // -----------------------------
      // BEHAVIOR / MISTAKES
      // -----------------------------
      mistakeSummary: analytics.mistakeSummary ?? {},
      mistakeCost: analytics.mistakeCost ?? 0,

      // -----------------------------
      // CHART DATA
      // -----------------------------
      equityData: analytics.equityData ?? [],
      weekdayChartData: analytics.weekdayChartData ?? [],
      typeChartData: analytics.typeChartData ?? [],
      sessionChartData: analytics.sessionChartData ?? [],
      pairChartData: analytics.pairChartData ?? [],
      emotionChartData: analytics.emotionChartData ?? [],

      // -----------------------------
      // GROUPS
      // -----------------------------
      sessionGroups: analytics.sessionGroups ?? [],
      typeGroups: analytics.typeGroups ?? [],
      emotionGroups: analytics.emotionGroups ?? [],
      scoreGroups: analytics.scoreGroups ?? [],
      pairGroups: analytics.pairGroups ?? [],
      weekdayGroups: analytics.weekdayGroups ?? [],

      // -----------------------------
      // UI SUGGESTIONS
      // -----------------------------
      pairSuggestions: analytics.pairSuggestions ?? [],
    };
  }, [trades]);
};
