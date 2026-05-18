'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useTradeAnalyticsV2 } from '@/hooks/useTradeAnalyticsV2';
import { useBehavioralAnalytics } from '@/hooks/useBehavioralAnalytics';

import { useTradesStore } from '@/hooks/useTradesStore';

import DashboardCardLayout from '@/components/dashboard/DashboardCardLayout';
import { MovedStopsCard } from '@/components/dashboard/moved-stops-card';
import { useTradeFilters } from '@/hooks/useTradeFilters';
import { TradeFilterBar } from '@/components/dashboard/TradeFilterBar';

export default function BehavioursPage() {
  // 1. LOAD GLOBAL TRADES
  const { trades, loadTrades } = useTradesStore();

  useEffect(() => {
    loadTrades();
  }, []);

  // 2. FILTERS
  const { filters, setFilters, filteredTrades, toggleFilter, resetFilters } =
    useTradeFilters(trades);

  // 3. ANALYTICS
  const analytics = useTradeAnalyticsV2(filteredTrades);

  const behavioral = useBehavioralAnalytics(analytics.enrichedTrades);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <DashboardCardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-10">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Behaviour Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Your recurring execution & psychological leaks
          </p>
        </div>

        <TradeFilterBar
          filters={filters}
          setFilters={setFilters}
          toggleFilter={toggleFilter}
          resetFilters={resetFilters}
          pairOptions={analytics.pairSuggestions}
        />

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
    </DashboardCardLayout>
  );
}
