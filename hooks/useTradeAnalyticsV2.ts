import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { buildTradeAnalytics } from '@/lib/analytics/v2/pipeline';

export const useTradeAnalyticsV2 = (trades: Trade[]) => {
  return useMemo(() => {
    const analytics = buildTradeAnalytics(trades);

    return {
      ...analytics,

      // HARD GUARANTEE: prevent undefined crash cascade
      enrichedTrades: analytics.enrichedTrades ?? [],

      winRate: analytics.winRate ?? 0,
      totalPnL: analytics.totalPnL ?? 0,
      avgWin: analytics.avgWin ?? 0,
      avgLoss: analytics.avgLoss ?? 0,
      profitFactor: analytics.profitFactor ?? 0,
      expectancy: analytics.expectancy ?? 0,
      avgTradesPerDay: analytics.avgTradesPerDay ?? 0,

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

      pairSuggestions: Array.from(
        new Set(analytics.enrichedTrades.map((t) => t.pair).filter(Boolean))
      ),
    };
  }, [trades]);
};
