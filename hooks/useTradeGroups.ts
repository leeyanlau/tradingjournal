import { useMemo } from 'react';

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

    const getStats = (list: Trade[]) => {
      const pnl = list.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const wins = list.filter((t) => t.result === 'Win').length;
      const losses = list.filter((t) => t.result === 'Loss').length;

      const total = wins + losses;

      const totalWinAmount = list
        .filter((t) => t.result === 'Win')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalLossAmount = list
        .filter((t) => t.result === 'Loss')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

      const profitFactor =
        totalLossAmount === 0
          ? totalWinAmount
          : totalWinAmount / totalLossAmount;

      const expectancy = list.length ? pnl / list.length : 0;

      return {
        totalPnL: pnl,
        trades: list.length,
        winRate: total > 0 ? (wins / total) * 100 : 0,
        profitFactor,
        expectancy,
      };
    };

    // =====================
    // SESSION GROUPS
    // =====================
    const sessionGroups = ['Asia', 'London', 'NYAM', 'Out of KZ'].map(
      (session) => ({
        label: session,
        stats: getStats(trades.filter((t) => t.session === session)),
      })
    );

    // =====================
    // WEEKDAY GROUPS
    // =====================
    const weekdayGroups = weekdayNames.map((day) => {
      const list = trades.filter((t) => getWeekday(t.date) === day);

      return {
        label: day,
        stats: getStats(list),
      };
    });

    // =====================
    // EMOTION GROUPS
    // =====================
    const emotionGroups = ['Calm', 'Anxious'].map((feeling) => ({
      label: feeling,
      stats: getStats(trades.filter((t) => t.feeling === feeling)),
    }));

    // =====================
    // SCORE GROUPS
    // =====================
    const scoreGroups = [
      {
        label: 'High (8-9)',
        stats: getStats(trades.filter((t) => t.checklistScore >= 8)),
      },
      {
        label: 'Mid (7)',
        stats: getStats(trades.filter((t) => t.checklistScore === 7)),
      },
      {
        label: 'Low (≤6)',
        stats: getStats(trades.filter((t) => t.checklistScore <= 6)),
      },
    ];

    // =====================
    // TYPE GROUPS
    // =====================
    const typeGroups = ['Scalp', 'Day Trade', 'Swing'].map((type) => {
      const list = trades.filter((t) => t.type === type);

      return {
        label: type,
        stats: getStats(list),
      };
    });

    return {
      sessionGroups,
      weekdayGroups,
      emotionGroups,
      scoreGroups,
      typeGroups,
    };
  }, [trades]);
};
