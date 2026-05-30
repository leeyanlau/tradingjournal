'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { useBehavioralAnalytics } from '@/hooks/useBehavioralAnalytics';
import { useTradeAnalyticsV2 } from '@/hooks/useTradeAnalyticsV2';

import { useTradesStore } from '@/hooks/useTradesStore';

import DashboardCardLayout from '@/components/dashboard/DashboardCardLayout';
import KPICards from '@/components/dashboard/KPICards';
import { MovedStopsCard } from '@/components/dashboard/moved-stops-card';

import { useTradeFilters } from '@/hooks/useTradeFilters';
import { TradeFilterBar } from '@/components/dashboard/TradeFilterBar';
import { useTradeCharts } from '@/hooks/useTradeCharts';
import { EquityChart } from '@/components/charts/EquityChart';
import TradingCalendar from '@/components/dashboard/trading-calendar';

export default function DashboardPage() {
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

  const charts = useTradeCharts(
    analytics.enrichedTrades,
    analytics.sessionGroups,
    analytics.weekdayGroups,
    analytics.emotionGroups,
    analytics.typeGroups,
    analytics.pairGroups
  );

  // --------------------
  // RENDER
  // --------------------
  return (
    <DashboardCardLayout>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-10 ">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>

          <TradeFilterBar
            filters={filters}
            setFilters={setFilters}
            toggleFilter={toggleFilter}
            resetFilters={resetFilters}
            pairOptions={analytics.pairSuggestions}
          />

          <section className="space-y-6">
            <div className="h-[360px] w-full">
              <EquityChart data={charts.equityCurve} />
            </div>
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

          <div className="rounded-xl bg-card text-card-foreground shadow-sm">
            <div className="trade-calendar">
              <TradingCalendar trades={analytics.enrichedTrades} />
            </div>
          </div>

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
    </DashboardCardLayout>
  );
}
