import { useMemo } from 'react';
import { Trade } from '@/types/trade';

export const useTradeCharts = (
  trades: Trade[],
  sessionGroups: any[],
  weekdayGroups: any[],
  emotionGroups: any[],
  typeGroups: any[],
  pairGroups: any[]
) => {
  return useMemo(() => {
    const safeNumber = (v: any) => Number(v || 0);

    const sessionChartData = sessionGroups.map((s) => ({
      name: s.label,
      pnl: safeNumber(s.stats?.totalPnL),
    }));

    const weekdayChartData = weekdayGroups.map((d) => ({
      name: d.label,
      pnl: safeNumber(d.stats?.totalPnL),
    }));

    const emotionChartData = emotionGroups.map((e) => ({
      name: e.label,
      pnl: safeNumber(e.stats?.totalPnL),
    }));

    const typeChartData = typeGroups.map((t) => ({
      name: t.label,
      pnl: safeNumber(t.stats?.totalPnL ?? t.pnl),
    }));

    const pairChartData = pairGroups.map((p) => ({
      name: p.label,
      winRate: safeNumber(p.stats?.winRate ?? p.winRate),
      pnl: safeNumber(p.stats?.totalPnL ?? p.pnl),
    }));

    return {
      sessionChartData,
      weekdayChartData,
      emotionChartData,
      typeChartData,
      pairChartData,
    };
  }, [
    trades,
    sessionGroups,
    weekdayGroups,
    emotionGroups,
    typeGroups,
    pairGroups,
  ]);
};
