// /lib/analytics/v2/types.ts

import { Trade } from '@/types/trade';

export type EnrichedTrade = Trade & {
  mistakes: string[];
  checklistScore: number;
  checklistPercentage: number;
};

export type TradeStats = {
  winRate: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  totalPnL: number;
  trades: number;
};

export type TradeGroup = {
  label: string;
  stats: {
    totalPnL: number;
    trades: number;
    winRate?: number;
  };
};

export type TradeAnalyticsV2 = {
  enrichedTrades: EnrichedTrade[];
  stats: TradeStats;
  typeGroups: TradeGroup[];
};
