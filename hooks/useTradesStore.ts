import { create } from 'zustand';
import { Trade } from '@/types/trade';
import { tradeStorage } from '@/lib/storage/tradeStorage';
import { dummyTrades } from '@/data/dummyTrades';
import { detectMistakes } from '@/utils/detectMistakes';

type Store = {
  trades: Trade[];
  hydrated: boolean;
  loadTrades: () => void;

  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, trade: Trade) => void;
  deleteTrade: (id: string) => void;
};

export const useTradesStore = create<Store>((set, get) => {
  const persist = (trades: Trade[]) => {
    tradeStorage.set(trades);
  };

  return {
    trades: [],
    hydrated: false,

    loadTrades: () => {
      if (get().hydrated) return;

      const saved = tradeStorage.get();

      const final =
        saved.length === 0
          ? dummyTrades.map((t) => ({
              ...t,
              behavioralMistakes: detectMistakes(t),
            }))
          : saved.map((t) => ({
              ...t,
              behavioralMistakes: detectMistakes(t),
            }));

      set({ trades: final, hydrated: true });
      persist(final);
    },

    addTrade: (trade) => {
      set((state) => {
        const updated = [
          ...state.trades,
          {
            ...trade,
            behavioralMistakes: detectMistakes(trade),
          },
        ];

        persist(updated);
        return { trades: updated };
      });
    },

    updateTrade: (id, trade) => {
      set((state) => {
        const updated = state.trades.map((t) =>
          t.id === id
            ? {
                ...trade,
                id,
                behavioralMistakes: detectMistakes(trade),
              }
            : t
        );

        persist(updated);
        return { trades: updated };
      });
    },

    deleteTrade: (id) => {
      set((state) => {
        const updated = state.trades.filter((t) => t.id !== id);

        persist(updated);
        return { trades: updated };
      });
    },
  };
});
