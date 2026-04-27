import { EnrichedTrade, TradeGroup } from './types';

export const buildTypeGroups = (trades: EnrichedTrade[]): TradeGroup[] => {
  const types = ['Scalp', 'Day Trade', 'Swing'];

  return types.map((type) => {
    const list = trades.filter((t) => t.type === type);

    const pnl = list.reduce((s, t) => s + Number(t.amount || 0), 0);

    return {
      label: type,
      stats: {
        totalPnL: pnl,
        trades: list.length,
      },
    };
  });
};
