import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { buildTradeAnalytics } from '@/lib/analytics/v2/pipeline';
import { calculateKPIs } from '@/lib/analytics/calculateKPIs';

export const useTradeAnalyticsV2 = (
  trades: Trade[],
  filters: {
    session: string[];
    result: string[];
    pair: string[];
    feeling: string[];
    startDate: string;
    endDate: string;
  }
) => {
  return useMemo(() => {
    const filteredTrades = trades.filter((t) => {
      const sessionMatch =
        filters.session.length === 0 || filters.session.includes(t.session);

      const resultMatch =
        filters.result.length === 0 || filters.result.includes(t.result);

      const pairMatch =
        filters.pair.length === 0 || filters.pair.includes(t.pair);

      const feelingMatch =
        filters.feeling.length === 0 || filters.feeling.includes(t.feeling);

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

    const rawAnalytics = buildTradeAnalytics(trades, {
      includeSuggestions: true,
    });

    const analytics = buildTradeAnalytics(filteredTrades, {
      includeSuggestions: false,
    });
    const kpis = calculateKPIs(filteredTrades);

    const safeNumber = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

    return {
      ...analytics,

      enrichedTrades: analytics.enrichedTrades ?? [],

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

      largestWin: kpis.largestWin,
      largestLoss: kpis.largestLoss,

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

      mistakeSummary: analytics.mistakeSummary ?? {},
      mistakeCost: analytics.mistakeCost ?? 0,

      equityData: analytics.equityData ?? [],

      sessionGroups: analytics.sessionGroups ?? [],
      typeGroups: analytics.typeGroups ?? [],
      emotionGroups: analytics.emotionGroups ?? [],
      scoreGroups: analytics.scoreGroups ?? [],
      pairGroups: analytics.pairGroups ?? [],
      weekdayGroups: analytics.weekdayGroups ?? [],

      weekdayChartData: analytics.weekdayChartData ?? [],
      typeChartData: analytics.typeChartData ?? [],
      sessionChartData: analytics.sessionChartData ?? [],
      pairChartData: analytics.pairChartData ?? [],
      emotionChartData: analytics.emotionChartData ?? [],

      pairSuggestions: analytics.pairSuggestions ?? [],
    };
  }, [trades, filters]);
};
