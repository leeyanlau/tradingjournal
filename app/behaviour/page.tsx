'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useTradeAnalyticsV2 } from '@/hooks/useTradeAnalyticsV2';
import { useBehavioralAnalytics } from '@/hooks/useBehavioralAnalytics';

import { tradeStorage } from '@/lib/storage/tradeStorage';
import { detectMistakes } from '@/utils/detectMistakes';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { MovedStopsCard } from '@/components/dashboard/moved-stops-card';

export default function BehavioursPage() {
  const [filters, setFilters] = useState({
    session: [] as string[],
    result: [] as string[],
    pair: [] as string[],
    feeling: [] as string[],
    startDate: '',
    endDate: '',
  });

  // -----------------------------
  // DATA SOURCE
  // -----------------------------
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

  const behavioral = useBehavioralAnalytics(analytics.enrichedTrades);

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

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-10">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Behaviour Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Your recurring execution & psychological leaks
          </p>
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

        {/* ===================== */}
        {/* MOVED STOPS */}
        {/* ===================== */}
        <section className="space-y-4">
          <MovedStopsCard stats={behavioral.movedStops} />
        </section>

        {/* ===================== */}
        {/* MISTAKES SECTION */}
        {/* ===================== */}
        <section className="space-y-6">
          <div className="rounded-xl bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Mistakes Breakdown</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
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
                      frequency
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
                      frequency
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No Behavioral mistakes recorded
                  </p>
                )}
              </div>
            </div>
            <div className="bg-card  p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2">Checklist Mistakes</h3>
              <table className="w-full text-sm border-collapse table-fixed">
                <thead>
                  <tr className="border-b">
                    <th className="w-[40%] p-2 text-left">Mistake</th>
                    <th className="w-[15%] p-2 text-right">Count</th>
                    <th className="w-[22%] p-2 text-right">Total PnL</th>
                    <th className="w-[23%] p-2 text-right">Avg Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(behavioral.checklistMistakeStats)
                    .sort((a, b) => a[1].totalPnL - b[1].totalPnL)
                    .map(([type, stats]) => (
                      <tr key={type} className="border-b text-muted-foreground">
                        <td className="p-2 font-medium">{type}</td>

                        <td className="p-2 text-right">{stats.count}</td>

                        <td
                          className={`p-2 text-right font-semibold ${
                            stats.totalPnL < 0
                              ? 'text-red-500'
                              : 'text-green-500'
                          }`}
                        >
                          ${stats.totalPnL.toFixed(2)}
                        </td>

                        <td
                          className={`p-2 text-right ${
                            stats.avgPnL < 0 ? 'text-red-500' : 'text-green-500'
                          }`}
                        >
                          ${stats.avgPnL.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="bg-card  p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2">Behavioral Mistakes</h3>
              <table className="w-full text-sm border-collapse table-fixed">
                <thead>
                  <tr className="border-b">
                    <th className="w-[40%] p-2 text-left">Mistake</th>
                    <th className="w-[15%] p-2 text-right">Count</th>
                    <th className="w-[22%] p-2 text-right">Total PnL</th>
                    <th className="w-[23%] p-2 text-right">Avg Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(behavioral.behavioralMistakeStats)
                    .sort((a, b) => a[1].totalPnL - b[1].totalPnL)
                    .map(([type, stats]) => (
                      <tr key={type} className="border-b text-muted-foreground">
                        <td className="p-2 font-medium">{type}</td>

                        <td className="p-2 text-right">{stats.count}</td>

                        <td
                          className={`p-2 text-right font-semibold ${
                            stats.totalPnL < 0
                              ? 'text-red-500'
                              : 'text-green-500'
                          }`}
                        >
                          ${stats.totalPnL.toFixed(2)}
                        </td>

                        <td
                          className={`p-2 text-right ${
                            stats.avgPnL < 0 ? 'text-red-500' : 'text-green-500'
                          }`}
                        >
                          ${stats.avgPnL.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
