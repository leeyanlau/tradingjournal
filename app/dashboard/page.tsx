'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { useBehavioralAnalytics } from '@/hooks/useBehavioralAnalytics';
import { useTradeAnalyticsV2 } from '@/hooks/useTradeAnalyticsV2';

import { tradeStorage } from '@/lib/storage/tradeStorage';
import { dummyTrades } from '@/data/dummyTrades';
import { detectMistakes } from '@/utils/detectMistakes';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import KPICards from '@/components/dashboard/KPICards';
import { MovedStopsCard } from '@/components/dashboard/moved-stops-card';

import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';

import { useTradeCharts } from '@/hooks/useTradeCharts';
import { EquityChart } from '@/components/charts/EquityChart';

export default function DashboardPage() {
  // FILTERS
  const [filters, setFilters] = useState({
    session: [] as string[],
    result: [] as string[],
    pair: [] as string[],
    feeling: [] as string[],
    startDate: '',
    endDate: '',
  });

  const rawTrades = useMemo(() => {
    return tradeStorage.get().map((t) => ({
      ...t,
      behavioralMistakes: detectMistakes(t),
    }));
  }, []);

  const filteredTrades = useMemo(() => {
    return rawTrades.filter((t) => {
      // session
      if (filters.session.length && !filters.session.includes(t.session)) {
        return false;
      }

      // result
      if (filters.result.length && !filters.result.includes(t.result)) {
        return false;
      }

      // pair
      if (filters.pair.length && !filters.pair.includes(t.pair)) {
        return false;
      }

      // feeling
      if (filters.feeling.length && !filters.feeling.includes(t.feeling)) {
        return false;
      }

      // date
      if (filters.startDate) {
        if (new Date(t.date) < new Date(filters.startDate)) return false;
      }

      if (filters.endDate) {
        if (new Date(t.date) > new Date(filters.endDate)) return false;
      }

      return true;
    });
  }, [rawTrades, filters]);

  const analytics = useTradeAnalyticsV2(filteredTrades, {
    session: [],
    result: [],
    pair: [],
    feeling: [],
    startDate: '',
    endDate: '',
  });

  // --------------------
  // STATE
  // --------------------
  const [trades, setTrades] = useState<Trade[]>([]);
  const didLoad = useRef(false);

  // --------------------
  // LOAD TRADES
  // --------------------
  useEffect(() => {
    console.log('LOADING TRADES');
    const saved = tradeStorage.get();
    console.log('SAVED:', saved);

    if (saved.length === 0) {
      const withMistakes = dummyTrades.map((t) => ({
        ...t,
        behavioralMistakes: detectMistakes(t),
      }));
      setTrades(withMistakes);
      didLoad.current = true;
      return;
    }

    try {
      const parsed: Trade[] = saved;

      const normalized = parsed.map((t) => ({
        ...t,
        id: t.id || crypto.randomUUID(),
        movedStopsWorked: t.movedStopsWorked ?? null,
        behavioralMistakes: detectMistakes(t),
      }));

      setTrades(normalized);
    } catch {
      const withMistakes = dummyTrades.map((t) => ({
        ...t,
        behavioralMistakes: detectMistakes(t),
      }));
      setTrades(withMistakes);
    }

    didLoad.current = true;
  }, []);

  const behavioral = useBehavioralAnalytics(analytics.enrichedTrades);

  const charts = useTradeCharts(
    analytics.enrichedTrades,
    analytics.sessionGroups,
    analytics.weekdayGroups,
    analytics.emotionGroups,
    analytics.typeGroups,
    analytics.pairGroups
  );

  // --------------------
  // FILTER TOGGLE HANDLER
  // --------------------
  const toggleFilter = (
    key: 'session' | 'result' | 'pair' | 'feeling',
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

  // --------------------
  // RENDER
  // --------------------
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-10 ">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>

          {/* FILTER BAR (top row) */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <MultiSelectDropdown
                label="Session"
                options={['Asia', 'London', 'NYAM', 'Out of KZ']}
                selected={filters.session}
                onToggle={(v) => toggleFilter('session', v)}
              />

              <MultiSelectDropdown
                label="Result"
                options={['Win', 'Loss', 'Breakeven']}
                selected={filters.result}
                onToggle={(v) => toggleFilter('result', v)}
              />

              <MultiSelectDropdown
                label="Pairs"
                options={analytics.pairSuggestions}
                selected={filters.pair}
                onToggle={(v) => toggleFilter('pair', v)}
              />

              <MultiSelectDropdown
                label="Feeling"
                options={['Calm', 'Anxious']}
                selected={filters.feeling}
                onToggle={(v) => toggleFilter('feeling', v)}
              />

              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="border border-border p-2 rounded"
                />

                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="border border-border p-2 rounded"
                />
              </div>

              <button
                onClick={() =>
                  setFilters({
                    session: [],
                    result: [],
                    pair: [],
                    feeling: [],
                    startDate: '',
                    endDate: '',
                  })
                }
                className="ml-auto bg-primary text-primary-foreground px-3 py-2 rounded-md hover:opacity-90 active:scale-[0.98] transition"
              >
                Reset
              </button>
            </div>
          </div>

          <section className="space-y-6">
            <EquityChart data={charts.equityCurve} />
          </section>

          {/* KPI ROW */}
          <KPICards
            stats={analytics}
            breakdown={{
              winCount: analytics.winCount,
              lossCount: analytics.lossCount,
              breakevenCount: analytics.breakevenCount,
            }}
          />

          {/* MOVED STOPS */}
          <MovedStopsCard stats={behavioral.movedStops} />

          {/* BIGGEST LEAKS */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground mb-2">
                Biggest Checklist Leak
              </p>

              {behavioral.biggestChecklistLeak ? (
                <>
                  <h3 className="text-lg font-semibold">
                    {behavioral.biggestChecklistLeak.type}
                  </h3>

                  <p className="text-3xl font-bold text-red-500 mt-2">
                    ${behavioral.biggestChecklistLeak.totalPnL.toFixed(2)}
                  </p>

                  <p className="text-sm text-muted-foreground mt-2">
                    {behavioral.biggestChecklistLeak.count} occurrences ·{' '}
                    {behavioral.biggestChecklistLeak.frequency.toFixed(1)}%
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No checklist mistakes recorded
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground mb-2">
                Biggest Behavioral Leak
              </p>

              {behavioral.biggestBehavioralLeak ? (
                <>
                  <h3 className="text-lg font-semibold">
                    {behavioral.biggestBehavioralLeak.type}
                  </h3>

                  <p className="text-3xl font-bold text-red-500 mt-2">
                    ${behavioral.biggestBehavioralLeak.totalPnL.toFixed(2)}
                  </p>

                  <p className="text-sm text-muted-foreground mt-2">
                    {behavioral.biggestBehavioralLeak.count} occurrences ·{' '}
                    {behavioral.biggestBehavioralLeak.frequency.toFixed(1)}%
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No behavioral mistakes recorded
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
