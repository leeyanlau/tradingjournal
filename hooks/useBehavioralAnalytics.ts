import { useMemo } from 'react';
import { Trade } from '@/types/trade';

type Tally = Record<string, number>;

export const useBehavioralAnalytics = (trades: Trade[]) => {
  return useMemo(() => {
    const checklistTally: Tally = {};
    const behavioralTally: Tally = {};

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

      for (const m of mistakes) {
        if (m.category === 'checklist') {
          checklistTally[m.type] = (checklistTally[m.type] || 0) + 1;
        }

        if (m.category === 'behavioral') {
          behavioralTally[m.type] = (behavioralTally[m.type] || 0) + 1;
        }
      }
    }

    const evaluatedCount = movedStopsSuccess + movedStopsFail;

    const quality =
      evaluatedCount > 0 ? (movedStopsSuccess / evaluatedCount) * 100 : 0;

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

      checklistTally,
      behavioralTally,
    };
  }, [trades]);
};
