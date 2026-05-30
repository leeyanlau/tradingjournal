'use client';

import { useEffect } from 'react';
import { useTradesStore } from '@/hooks/useTradesStore';

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const loadTrades = useTradesStore((s) => s.loadTrades);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  return children;
}
