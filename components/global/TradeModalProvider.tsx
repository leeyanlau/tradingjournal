'use client';

import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from 'react';

import { Trade } from '@/types/trade';
import { createDefaultTrade } from '@/utils/createDefaultTrade';
import { calculateChecklist } from '@/utils/checklist';

type TradeModalContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;

  trade: Trade;
  setTrade: Dispatch<SetStateAction<Trade>>;

  openModal: () => void;
  closeModal: () => void;

  toggleChecklist: (key: keyof Trade['checklist']) => void;
};

const TradeModalContext = createContext<TradeModalContextType | null>(null);

export function TradeModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [trade, setTrade] = useState<Trade>(createDefaultTrade());

  const openModal = () => {
    setTrade(createDefaultTrade());
    setOpen(true);
  };
  const closeModal = () => setOpen(false);

  const toggleChecklist = (key: keyof Trade['checklist']) => {
    setTrade((prev) => {
      const updatedChecklist = {
        ...prev.checklist,
        [key]: !prev.checklist[key],
      };

      const { score, risk } = calculateChecklist(updatedChecklist);

      return {
        ...prev,
        checklist: updatedChecklist,
        checklistScore: score,
        suggestedRisk: risk,
      };
    });
  };

  return (
    <TradeModalContext.Provider
      value={{
        open,
        setOpen,
        trade,
        setTrade,
        openModal,
        closeModal,
        toggleChecklist,
      }}
    >
      {children}
    </TradeModalContext.Provider>
  );
}

export function useTradeModal() {
  const ctx = useContext(TradeModalContext);
  if (!ctx) throw new Error('useTradeModal must be used inside provider');
  return ctx;
}
