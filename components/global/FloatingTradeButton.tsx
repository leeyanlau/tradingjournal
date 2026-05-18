'use client';

import { useTradeModal } from './TradeModalProvider';
import { createDefaultTrade } from '@/utils/createDefaultTrade';

export function FloatingTradeButton() {
  const { openModal, setTrade } = useTradeModal();

  return (
    <button
      onClick={openModal}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl shadow-lg hover:scale-105 active:scale-95 transition"
    >
      +
    </button>
  );
}
