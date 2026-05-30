'use client';

import { ThemeProvider } from 'next-themes';

import { TradeModalProvider } from '@/components/global/TradeModalProvider';
import { FloatingTradeButton } from '@/components/global/FloatingTradeButton';
import { TradeModalContainer } from '@/components/global/TradeModalContainer';

import { useMemo, useState, useRef } from 'react';
import { useTradesStore } from '@/hooks/useTradesStore';

export function Providers({ children }: { children: React.ReactNode }) {
  // ----------------------------
  // GLOBAL STATE (for dropdown etc.)
  // ----------------------------
  const [pairQuery, setPairQuery] = useState('');
  const [showPairDropdown, setShowPairDropdown] = useState(false);

  const trades = useTradesStore((s) => s.trades);

  const allPairs = useMemo(() => {
    return Array.from(new Set(trades.map((t) => t.pair).filter(Boolean)));
  }, [trades]);

  const filteredPairs = useMemo(() => {
    return pairQuery
      ? allPairs.filter((p) =>
          p.toLowerCase().includes(pairQuery.toLowerCase())
        )
      : allPairs;
  }, [allPairs, pairQuery]);

  const pairDropdownRef = useRef<HTMLDivElement | null>(null);

  const inputClass = 'border border-border bg-background p-2 rounded-lg w-full';

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TradeModalProvider>
        {children}

        {/* GLOBAL FLOATING BUTTON */}
        <FloatingTradeButton />

        {/* GLOBAL MODAL */}
        <TradeModalContainer
          inputClass={inputClass}
          pairQuery={pairQuery}
          setPairQuery={setPairQuery}
          showPairDropdown={showPairDropdown}
          setShowPairDropdown={setShowPairDropdown}
          filteredPairs={filteredPairs}
          pairDropdownRef={pairDropdownRef}
        />
      </TradeModalProvider>
    </ThemeProvider>
  );
}
