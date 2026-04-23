import { Trade } from '@/types/trade';
import { getTradeStats } from '@/lib/analytics/tradeAnalytics';

export const buildGroupedStats = (trades: Trade[], key: keyof Trade) => {
  const map: Record<string, Trade[]> = {};

  trades.forEach((t) => {
    const value = t[key];
    if (!value) return;

    const label = String(value);

    if (!map[label]) {
      map[label] = [];
    }

    map[label].push(t);
  });

  return Object.entries(map).map(([label, list]) => ({
    label,
    stats: getTradeStats(list),
  }));
};
