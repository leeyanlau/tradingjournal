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
      winRate: safeNumber(s.stats?.winRate),
      trades: safeNumber(s.stats?.trades),
    }));

    const weekdayChartData = weekdayGroups.map((d) => ({
      name: d.label,
      pnl: safeNumber(d.stats?.totalPnL),
      winRate: safeNumber(d.stats?.winRate),
      trades: safeNumber(d.stats?.trades),
    }));

    const emotionChartData = emotionGroups.map((e) => ({
      name: e.label,
      pnl: safeNumber(e.stats?.totalPnL),
      winRate: safeNumber(e.stats?.winRate),
      trades: safeNumber(e.stats?.trades),
    }));

    const typeChartData = typeGroups.map((t) => ({
      name: t.label,
      pnl: safeNumber(t.stats?.totalPnL ?? t.pnl),
      winRate: safeNumber(t.stats?.winRate),
      trades: safeNumber(t.stats?.trades),
    }));

    const pairChartData = pairGroups.map((p) => ({
      name: p.label,
      winRate: safeNumber(p.stats?.winRate ?? p.winRate),
      pnl: safeNumber(p.stats?.totalPnL ?? p.pnl),
      trades: safeNumber(p.stats?.trades),
    }));

    const equityCurve = (() => {
      const sorted = [...trades].sort(
        (a, b) =>
          new Date(`${a.date}T${a.entryTime || '00:00'}`).getTime() -
          new Date(`${b.date}T${b.entryTime || '00:00'}`).getTime()
      );

      let balance = 0;

      return sorted.map((t, index) => {
        const pnl = Number(t.amount || 0);
        balance += pnl;

        return {
          index: index + 1,
          date: t.date,
          time: t.entryTime,
          uniqueKey: `${t.date} ${t.entryTime} ${index}`, // 🔥 important
          pnl,
          balance,
          pair: t.pair,
          result: t.result,
        };
      });
    })();

    return {
      sessionChartData,
      weekdayChartData,
      emotionChartData,
      typeChartData,
      pairChartData,
      equityCurve,
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
