'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useTradeAnalyticsV2 } from '@/hooks/useTradeAnalyticsV2';
import { useBehavioralAnalytics } from '@/hooks/useBehavioralAnalytics';
import { useTradeCharts } from '@/hooks/useTradeCharts';

import { useTradesStore } from '@/hooks/useTradesStore';
import { useTradeFilters } from '@/hooks/useTradeFilters';

import DashboardCardLayout from '@/components/dashboard/DashboardCardLayout';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { TradeFilterBar } from '@/components/dashboard/TradeFilterBar';
import { BaseBarChart } from '@/components/charts/BaseBarChart';
import { EquityChart } from '@/components/charts/EquityChart';

export default function AnalyticsPage() {
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

  return (
    <DashboardCardLayout>
      <div className="max-w-7xl mx-auto space-y-10 p-6">
        {/* TITLE */}
        <h1 className="text-3xl font-bold">Analytics</h1>

        <TradeFilterBar
          filters={filters}
          setFilters={setFilters}
          toggleFilter={toggleFilter}
          resetFilters={resetFilters}
          pairOptions={analytics.pairSuggestions}
        />

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

        {/* ===================== */}
        {/* CHARTS SECTION */}
        {/* ===================== */}
        <section className="space-y-6">
          <EquityChart data={charts.equityCurve} />

          <div className="grid grid-cols-2 gap-4">
            <BaseBarChart title="By Session" data={charts.sessionChartData} />
            <BaseBarChart title="By Trade Type" data={charts.typeChartData} />
            <BaseBarChart title="By Pair" data={charts.pairChartData} />
            <BaseBarChart title="By Emotion" data={charts.emotionChartData} />
            <BaseBarChart title="By Weekday" data={charts.weekdayChartData} />
          </div>
        </section>

        <section className="space-y-6">
          {/* ===================== */}
          {/* BREAKDOWN SECTION */}
          {/* ===================== */}
          <div className="rounded-xl bg-card text-card-foreground shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold">Breakdown</h2>

            {/* SESSION */}
            <div>
              <h3 className="font-semibold mb-2">By Session</h3>
              <div className="grid md:grid-cols-4 gap-3 text-sm">
                {analytics.sessionGroups.map((g) => (
                  <div
                    key={g.label}
                    className="border border-border p-3 rounded-lg"
                  >
                    <p className="font-medium">{g.label}</p>
                    <p>Trades: {g.stats.trades}</p>
                    <p>Win Rate: {g.stats.winRate.toFixed(1)}%</p>
                    <p>PnL: {g.stats.totalPnL}</p>
                    <p>PF: {g.stats.profitFactor.toFixed(2)}</p>
                    <p>Exp: {g.stats.expectancy.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* TRADE TYPE */}
            <div>
              <h3 className="font-semibold mb-2">By Trade Type</h3>

              <div className="grid md:grid-cols-3 gap-3 text-sm">
                {analytics.typeGroups.map((g) => (
                  <div
                    key={g.label}
                    className="border border-border p-3 rounded-lg"
                  >
                    <p className="font-medium">{g.label}</p>
                    <p>Trades: {g.stats.trades}</p>
                    <p>Win Rate: {g.stats.winRate.toFixed(1)}%</p>
                    <p>PnL: {g.stats.totalPnL}</p>
                    <p>PF: {g.stats.profitFactor.toFixed(2)}</p>
                    <p>Exp: {g.stats.expectancy.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* EMOTION */}
            <div>
              <h3 className="font-semibold mb-2">By Emotion</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                {analytics.emotionGroups.map((g) => (
                  <div
                    key={g.label}
                    className="border border-border p-3 rounded-lg"
                  >
                    <p className="font-medium">{g.label}</p>
                    <p>Trades: {g.stats.trades}</p>
                    <p>Win Rate: {g.stats.winRate.toFixed(1)}%</p>
                    <p>PnL: {g.stats.totalPnL}</p>
                    <p>PF: {g.stats.profitFactor.toFixed(2)}</p>
                    <p>Exp: {g.stats.expectancy.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SCORE */}
            <div>
              <h3 className="font-semibold mb-2">By Checklist Score</h3>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                {analytics.scoreGroups.map((g) => (
                  <div
                    key={g.label}
                    className="border border-border p-3 rounded-lg"
                  >
                    <p className="font-medium">{g.label}</p>
                    <p>Trades: {g.stats.trades}</p>
                    <p>Win Rate: {g.stats.winRate.toFixed(1)}%</p>
                    <p>PnL: {g.stats.totalPnL}</p>
                    <p>PF: {g.stats.profitFactor.toFixed(2)}</p>
                    <p>Exp: {g.stats.expectancy.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* PAIR */}
            <div>
              <h3 className="font-semibold mb-2">By Pair</h3>

              <div className="grid md:grid-cols-4 gap-3 text-sm">
                {analytics.pairGroups.map((g) => (
                  <div
                    key={g.label}
                    className="border border-border p-3 rounded-lg"
                  >
                    <p className="font-medium">{g.label}</p>
                    <p>Trades: {g.stats.trades}</p>
                    <p>Win Rate: {g.stats.winRate.toFixed(1)}%</p>
                    <p>PnL: {g.stats.totalPnL}</p>
                    <p>PF: {g.stats.profitFactor.toFixed(2)}</p>
                    <p>Exp: {g.stats.expectancy.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* WEEKDAY PERFORMANCE */}
            <div>
              <h3 className="font-semibold mb-2">By Day of Week</h3>

              <div className="grid md:grid-cols-4 gap-3 text-sm">
                {analytics.weekdayGroups.map((g) => (
                  <div
                    key={g.label}
                    className="border border-border p-3 rounded-lg"
                  >
                    <p className="font-medium">{g.label}</p>
                    <p>Trades: {g.stats.trades}</p>
                    <p>Win Rate: {g.stats.winRate.toFixed(1)}%</p>
                    <p>PnL: {g.stats.totalPnL}</p>
                    <p>PF: {g.stats.profitFactor.toFixed(2)}</p>
                    <p>Exp: {g.stats.expectancy.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardCardLayout>
  );
}
