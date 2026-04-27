import { Trade } from '@/types/trade';

const KEY = 'trades_v2';

export const tradeStorage = {
  get(): Trade[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  },

  set(trades: Trade[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(trades));
  },

  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEY);
  },
};
