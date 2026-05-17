import { useMemo, useState } from 'react';
import { Trade } from '@/types/trade';

type Filters = {
  session: string[];
  result: string[];
  pair: string[];
  feeling: string[];
  startDate: string;
  endDate: string;
};

const defaultFilters: Filters = {
  session: [],
  result: [],
  pair: [],
  feeling: [],
  startDate: '',
  endDate: '',
};

export function useTradeFilters(trades: Trade[]) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (filters.session.length && !filters.session.includes(t.session))
        return false;

      if (filters.result.length && !filters.result.includes(t.result))
        return false;

      if (filters.pair.length && !filters.pair.includes(t.pair)) return false;

      if (filters.feeling.length && !filters.feeling.includes(t.feeling))
        return false;

      if (filters.startDate && new Date(t.date) < new Date(filters.startDate))
        return false;

      if (filters.endDate && new Date(t.date) > new Date(filters.endDate))
        return false;

      return true;
    });
  }, [trades, filters]);

  const toggleFilter = (
    key: keyof Omit<Filters, 'startDate' | 'endDate'>,
    value: string
  ) => {
    setFilters((prev) => {
      const exists = prev[key].includes(value);

      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      };
    });
  };

  const resetFilters = () => setFilters(defaultFilters);

  return {
    filters,
    setFilters,
    filteredTrades,
    toggleFilter,
    resetFilters,
  };
}
