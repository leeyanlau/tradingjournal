import { useMemo } from 'react';
import { Trade } from '@/types/trade';

type MistakeStat = {
  count: number;
  totalPnL: number;
  avgPnL: number;
};

type MistakeStats = Record<string, MistakeStat>;

export const useBehavioralAnalytics = (trades: Trade[]) => {
  return useMemo(() => {
    const checklistMistakeStats: MistakeStats = {};
    const behavioralMistakeStats: MistakeStats = {};

    let movedStopsTotal = 0;
    let movedStopsSuccess = 0;
    let movedStopsFail = 0;
    let movedStopsNeutral = 0;
    let pnlImpact = 0;

    for (const t of trades) {
      // -------------------------
      // MOVED STOPS
      // -------------------------
      if (t.movedStops) {
        movedStopsTotal += 1;

        if (t.movedStopsWorked != null) {
          if (t.movedStopsWorked === 'PROTECTED') {
            movedStopsSuccess += 1;
          } else if (t.movedStopsWorked === 'OVERMANAGED') {
            movedStopsFail += 1;
          } else if (t.movedStopsWorked === 'IRRELEVANT') {
            movedStopsNeutral += 1;
          }
        }
      }

      pnlImpact += Number(t.amount) || 0;

      // -------------------------
      // MISTAKES
      // -------------------------
      const mistakes = t.behavioralMistakes || [];

      const tradePnL = Number(t.amount) || 0;

      for (const m of mistakes) {
        const target =
          m.category === 'checklist'
            ? checklistMistakeStats
            : behavioralMistakeStats;

        if (!target[m.type]) {
          target[m.type] = {
            count: 0,
            totalPnL: 0,
            avgPnL: 0,
          };
        }

        target[m.type].count += 1;
        target[m.type].totalPnL += tradePnL;
      }
    }

    const evaluatedCount = movedStopsSuccess + movedStopsFail;

    const quality =
      evaluatedCount > 0 ? (movedStopsSuccess / evaluatedCount) * 100 : 0;

    for (const stats of [checklistMistakeStats, behavioralMistakeStats]) {
      Object.values(stats).forEach((m) => {
        m.avgPnL = m.count > 0 ? m.totalPnL / m.count : 0;
      });
    }

    const getBiggestLeak = (stats: MistakeStats) => {
      const entries = Object.entries(stats);

      if (entries.length === 0) return null;

      const [type, data] = entries.sort(
        (a, b) => a[1].totalPnL - b[1].totalPnL
      )[0];

      return {
        type,
        ...data,
        frequency: trades.length > 0 ? (data.count / trades.length) * 100 : 0,
      };
    };

    return {
      movedStops: {
        total: movedStopsTotal,
        success: movedStopsSuccess,
        fail: movedStopsFail,
        neutral: movedStopsNeutral,
        pnlImpact,
        netImpact: pnlImpact,
        quality,
      },

      checklistMistakeStats,
      behavioralMistakeStats,
      totalTrades: trades.length,
      biggestChecklistLeak: getBiggestLeak(checklistMistakeStats),

      biggestBehavioralLeak: getBiggestLeak(behavioralMistakeStats),
    };
  }, [trades]);
};
