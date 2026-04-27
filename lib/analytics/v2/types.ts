// /lib/analytics/v2/types.ts

import { Trade } from '@/types/trade';
import { Mistake } from '@/types/mistakes';

export type EnrichedTrade = Trade & {
  behavioralMistakes: Mistake[];
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
