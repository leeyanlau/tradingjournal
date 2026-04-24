import { Trade } from '@/types/trade';

export type Mistake = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
};

export const detectMistakes = (trade: Trade): Mistake[] => {
  const mistakes: Mistake[] = [];

  // Example baseline rules (safe defaults)

  if (!trade.entryPrice) {
    mistakes.push({
      type: 'missing_entry',
      severity: 'high',
      message: 'Missing entry price',
    });
  }

  if (!trade.stopLoss) {
    mistakes.push({
      type: 'missing_stop',
      severity: 'high',
      message: 'Missing stop loss',
    });
  }

  if (trade.result === 'Loss' && Number(trade.amount) > 0) {
    mistakes.push({
      type: 'pnl_inconsistency',
      severity: 'medium',
      message: 'Loss trade has positive PnL',
    });
  }

  return mistakes;
};
