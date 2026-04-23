import { useMemo } from 'react';
import { getTradeStats } from '@/lib/analytics/tradeAnalytics';
import { buildGroupedStats } from '@/lib/analytics/grouping';

export const useTradeGroups = (trades: Trade[]) => {
  return useMemo(() => {
    const weekdayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const getWeekday = (dateStr: string) => {
      if (!dateStr) return 'Unknown';
      return weekdayNames[new Date(dateStr).getDay()];
    };

    const sessionGroups = buildGroupedStats(trades, 'session');

    const typeGroups = buildGroupedStats(trades, 'type');

    const emotionGroups = buildGroupedStats(trades, 'feeling');

    // =====================
    // WEEKDAY GROUPS
    // =====================
    const weekdayGroups = weekdayNames.map((day) => {
      const list = trades.filter((t) => getWeekday(t.date) === day);

      return {
        label: day,
        stats: getTradeStats(list),
      };
    });

    // =====================
    // SCORE GROUPS
    // =====================
    const scoreGroups = [
      {
        label: 'High (8-9)',
        stats: getTradeStats(trades.filter((t) => t.checklistScore >= 8)),
      },
      {
        label: 'Mid (7)',
        stats: getTradeStats(trades.filter((t) => t.checklistScore === 7)),
      },
      {
        label: 'Low (≤6)',
        stats: getTradeStats(trades.filter((t) => t.checklistScore <= 6)),
      },
    ];

    return {
      sessionGroups,
      weekdayGroups,
      emotionGroups,
      scoreGroups,
      typeGroups,
    };
  }, [trades]);
};
