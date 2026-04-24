import { Trade } from '@/types/trade';
import { detectMistakes } from '../mistakes';
import { calculateChecklist } from '../checklist';
import { EnrichedTrade } from './types';

export const enrichTrades = (trades: Trade[]): EnrichedTrade[] => {
  return trades.map((trade) => {
    const checklist = calculateChecklist(trade.checklist);

    return {
      ...trade,
      mistakes: detectMistakes(trade),
      checklistScore: checklist.score,
      checklistPercentage: checklist.percentage,
    };
  });
};
