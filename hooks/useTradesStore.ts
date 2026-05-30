import { create } from 'zustand';
import { Trade } from '@/types/trade';
import { tradeStorage } from '@/lib/storage/tradeStorage';
import { dummyTrades } from '@/data/dummyTrades';
import { detectMistakes } from '@/utils/detectMistakes';

type Store = {
  trades: Trade[];
  hydrated: boolean;

  loadTrades: () => Promise<void>;

  addTrade: (trade: Trade) => Promise<void>;
  updateTrade: (id: string, trade: Trade) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
};

export const useTradesStore = create<Store>((set, get) => {
  return {
    trades: [],
    hydrated: false,

    // -------------------------
    // LOAD
    // -------------------------
    loadTrades: async () => {
      if (get().hydrated) return;

      const saved = await tradeStorage.get();

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
    },

    // -------------------------
    // ADD
    // -------------------------
    addTrade: async (trade) => {
      const newTrade: Trade = {
        ...trade,
        behavioralMistakes: detectMistakes(trade),
      };

      await tradeStorage.add(newTrade);

      set((state) => ({
        trades: [newTrade, ...state.trades],
      }));
    },

    // -------------------------
    // UPDATE
    // -------------------------
    updateTrade: async (id, trade) => {
      const updatedTrade: Trade = {
        ...trade,
        id,
        behavioralMistakes: detectMistakes(trade),
      };

      await tradeStorage.update(id, updatedTrade);

      set((state) => ({
        trades: state.trades.map((t) => (t.id === id ? updatedTrade : t)),
      }));
    },

    // -------------------------
    // DELETE
    // -------------------------
    deleteTrade: async (id) => {
      await tradeStorage.remove(id);

      set((state) => ({
        trades: state.trades.filter((t) => t.id !== id),
      }));
    },
  };
});
