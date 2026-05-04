'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Trade, MovedStopResult } from '@/types/trade';
import { useTradeAnalyticsV2 } from '@/hooks/useTradeAnalyticsV2';
import { useTradeCharts } from '@/hooks/useTradeCharts';
import { tradeStorage } from '@/lib/storage/tradeStorage';

import { getSession } from '@/utils/getSession';
import { calculateChecklist } from '@/utils/checklist';
import { dummyTrades } from '@/data/dummyTrades';
import { detectMistakes } from '../utils/detectMistakes';
import { checklistRules } from '@/utils/checklistRules';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import KPICards from '@/components/dashboard/KPICards';
import { MovedStopsCard } from '@/components/dashboard/moved-stops-card';
import { BaseBarChart } from '@/components/charts/BaseBarChart';
import { EquityChart } from '@/components/charts/EquityChart';
import { ThemeToggle } from '@/components/theme-toggle';
import { inputClass } from '@/components/ui/inputStyles';

// --------------------
// TYPES
// --------------------
type Checklist = {
  bias: boolean;
  timeframeAlignment: boolean;
  sessionProfile: boolean;
  pdArray: boolean;
  cisd: boolean;
  strongHL: boolean;
  news: boolean;
  killzone: boolean;
  smt: boolean;
};

// --------------------
// CONSTANTS
// --------------------
const emptyChecklist: Checklist = {
  bias: false,
  timeframeAlignment: false,
  sessionProfile: false,
  pdArray: false,
  cisd: false,
  strongHL: false,
  news: false,
  killzone: false,
  smt: false,
};

const createDefaultTrade = (): Trade => ({
  id: crypto.randomUUID(),
  date: '',
  entryTime: '',
  exitTime: '',
  session: '',
  direction: 'Buy',
  type: 'Scalp',
  pair: '',
  result: 'Win',
  risk: '',
  amount: '',
  checklist: { ...emptyChecklist },
  checklistScore: 0,
  suggestedRisk: '0%',
  remarks: '',
  feeling: 'Calm',
  movedStops: false,
  movedStopsWorked: null,
  behavioralMistakes: [],
});

type Mistake = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  category: 'behavioral' | 'checklist';
};

export default function Home() {
  const pairInputRef = useRef<HTMLDivElement>(null);
  // --------------------
  // STATE
  // --------------------
  const [trade, setTrade] = useState<Trade>(createDefaultTrade());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletedTrade, setDeletedTrade] = useState<Trade | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const didLoad = useRef(false);

  // FILTERS
  const [filters, setFilters] = useState({
    session: [] as string[],
    result: [] as string[],
    pair: [] as string[],
    feeling: [] as string[],
    startDate: '',
    endDate: '',
  });

  // PAIR SEARCH
  const [pairQuery, setPairQuery] = useState('');
  const [showPairDropdown, setShowPairDropdown] = useState(false);

  // --------------------
  // EFFECT: LOAD TRADES
  // --------------------
  useEffect(() => {
    const saved = tradeStorage.get();

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
        ...createDefaultTrade(),
        ...t,
        id: t.id || crypto.randomUUID(),
        movedStopsWorked: t.movedStopsWorked ?? null,
        behavioralMistakes: detectMistakes(t), // <-- add this
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

  // --------------------
  // EFFECT: SAVE TRADES
  // --------------------
  useEffect(() => {
    if (!didLoad.current) return;
    tradeStorage.set(trades);
  }, [trades]);

  // --------------------
  // HANDLER: FORM INPUT CHANGE
  // --------------------
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const updated = { ...trade, [e.target.name]: e.target.value };

    if (e.target.name === 'entryTime') {
      updated.session = getSession(e.target.value);
    }

    setTrade(updated);
  };

  // --------------------
  // HANDLER: CHECKLIST TOGGLE
  // --------------------
  const handleChecklist = (key: keyof Checklist) => {
    const updatedChecklist = {
      ...trade.checklist,
      [key]: !trade.checklist[key],
    };
    const { score, risk } = calculateChecklist(updatedChecklist);

    setTrade({
      ...trade,
      checklist: updatedChecklist,
      checklistScore: score,
      suggestedRisk: risk,
    });
  };

  // --------------------
  // HANDLE FORM SUBMIT: ADD OR EDIT TRADE
  // --------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔒 REQUIRED VALIDATION
    if (!trade.date) return alert('Date is required');
    if (!trade.entryTime) return alert('Entry time is required');
    if (!trade.exitTime) return alert('Exit time is required');
    if (!trade.pair) return alert('Pair is required');
    if (!trade.risk) return alert('Risk % is required');
    if (!trade.amount) return alert('PnL is required');
    if (!trade.session) return alert('Session not detected');

    if (trade.movedStops && !trade.movedStopsWorked) {
      return alert('Please specify how your stop adjustment performed');
    }

    // 🔢 VALIDATE NUMBERS
    const rawAmount = Number(trade.amount);
    if (isNaN(rawAmount)) return alert('PnL must be a valid number');

    const riskValue = Number((trade.risk || '').replace('%', ''));
    if (isNaN(riskValue))
      return alert('Risk must be a valid percentage (e.g. 0.5, 1)');

    // 🔄 NORMALIZE PnL
    let normalizedAmount = rawAmount;
    if (trade.result === 'Loss') normalizedAmount = -Math.abs(rawAmount);
    if (trade.result === 'Win') normalizedAmount = Math.abs(rawAmount);
    if (trade.result === 'Breakeven') normalizedAmount = 0;

    // 📝 BUILD FINAL TRADE OBJECT
    const finalTrade: Trade = {
      ...trade,
      id: editingId || trade.id || crypto.randomUUID(),
      amount: String(normalizedAmount),
      // ✅ Compute mistakes automatically
      behavioralMistakes: detectMistakes({
        ...trade,
        amount: String(normalizedAmount),
      }),
    };

    // ➕ ADD OR ✏️ EDIT
    setTrades((prev) =>
      editingId
        ? prev.map((t) => (t.id === editingId ? finalTrade : t))
        : [...prev, finalTrade]
    );

    // 🔄 RESET FORM
    setTrade(createDefaultTrade());
    setPairQuery('');
    setEditingId(null);
  };

  // --------------------
  // HANDLE EDIT TRADE
  // --------------------
  const handleEdit = (t: Trade) => {
    setTrade({ ...t, behavioralMistakes: detectMistakes(t) });
    setPairQuery(t.pair);
    setEditingId(t.id || null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --------------------
  // HANDLE DELETE TRADE
  // --------------------
  const handleDelete = (id: string) => {
    const tradeToDelete = trades.find((t) => t.id === id);
    if (!tradeToDelete) return;

    // store for undo
    setDeletedTrade(tradeToDelete);
    setShowUndo(true);

    // remove from list
    setTrades((prev) => prev.filter((t) => t.id !== id));

    // auto-hide undo after 5 seconds
    setTimeout(() => {
      setShowUndo(false);
      setDeletedTrade(null);
    }, 5000);
  };

  // --------------------
  // HANDLE UNDO DELETE
  // --------------------
  const handleUndo = () => {
    if (!deletedTrade) return;

    setTrades((prev) => {
      const restored = [...prev, deletedTrade];
      // keep newest-first order
      return restored.sort(
        (a, b) =>
          new Date(`${b.date}T${b.entryTime}`).getTime() -
          new Date(`${a.date}T${a.entryTime}`).getTime()
      );
    });

    setDeletedTrade(null);
    setShowUndo(false);
  };

  // --------------------
  // ANALYTICS HOOK
  // --------------------
  const analytics = useTradeAnalyticsV2(trades, filters);

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
  // MULTISELECT DROPDOWN COMPONENT
  // --------------------
  const MultiSelectDropdown = ({
    label,
    options,
    selected,
    onToggle,
  }: {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      }

      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    useEffect(() => {
      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false);
      }

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
      <div ref={containerRef} className="relative w-48">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="border p-2 rounded w-full text-left"
        >
          {label}: {selected.length ? selected.join(', ') : 'All'}
        </button>

        {open && (
          <div className="absolute z-10 bg-card border mt-1 w-full rounded shadow max-h-48 overflow-auto">
            {options.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 p-2 cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => onToggle(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const allPairs = useMemo(() => {
    return Array.from(
      new Set(analytics.enrichedTrades.map((t) => t.pair).filter(Boolean))
    );
  }, [analytics.enrichedTrades]);

  const filteredPairs = useMemo(() => {
    const base = allPairs || [];

    return pairQuery
      ? base.filter((p) => p.toLowerCase().includes(pairQuery.toLowerCase()))
      : base;
  }, [allPairs, pairQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pairInputRef.current &&
        !pairInputRef.current.contains(e.target as Node)
      ) {
        setShowPairDropdown(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPairDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --------------------
  // CHART TOOLTIP COMPONENTS
  // --------------------
  const AnalyticsTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-black text-white p-3 rounded-lg text-xs space-y-1">
        <p className="font-semibold">{label}</p>
        <p>PnL: {data.pnl}</p>
        <p>Win Rate: {data.winRate?.toFixed(1)}%</p>
        <p>Trades: {data.trades}</p>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-black text-white p-3 rounded-lg text-xs space-y-1">
        <p>
          <b>Trade #{data.index}</b>
        </p>
        <p>Date: {data.date}</p>
        <p>Pair: {data.pair}</p>
        <p>Result: {data.result}</p>
        <p className={data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
          PnL: {data.pnl}
        </p>
        <p>Equity: {data.equity}</p>
      </div>
    );
  };

  // --------------------
  // TRADES PER DAY MAP
  // --------------------
  const tradesPerDayMap = useMemo(() => {
    const map: Record<string, number> = {};
    analytics.enrichedTrades.forEach((t) => {
      if (!t.date) return;
      map[t.date] = (map[t.date] || 0) + 1;
    });
    return map;
  }, [analytics.enrichedTrades]);

  const tallyMistakes = (trades: Trade[], rules: typeof checklistRules) => {
    // Initialize all checklist mistakes to 0
    const checklistTally: Record<string, number> = {};
    Object.keys(rules).forEach((key) => {
      checklistTally[rules[key as keyof typeof checklistRules].type] = 0;
    });

    const behavioralTally: Record<string, number> = {};

    trades.forEach((t) => {
      const mistakes = t.behavioralMistakes || [];
      mistakes.forEach((m) => {
        if (m.category === 'checklist') {
          checklistTally[m.type] = (checklistTally[m.type] || 0) + 1;
        } else if (m.category === 'behavioral') {
          behavioralTally[m.type] = (behavioralTally[m.type] || 0) + 1;
        }
      });
    });

    // Sort each tally by frequency (descending)
    const sortTally = (tally: Record<string, number>) =>
      Object.fromEntries(Object.entries(tally).sort(([, a], [, b]) => b - a));

    return {
      checklistTally: sortTally(checklistTally),
      behavioralTally: sortTally(behavioralTally),
    };
  };

  const { checklistTally, behavioralTally } = tallyMistakes(
    analytics.enrichedTrades,
    checklistRules
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-center">Trading Journal</h1>
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>

          {/* FORM */}
          <div className="bg-card p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-xl font-semibold">Add Trade</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* DATE + TIME */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="date"
                  name="date"
                  value={trade.date}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />

                <input
                  type="time"
                  name="entryTime"
                  value={trade.entryTime}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />

                <input
                  type="time"
                  name="exitTime"
                  value={trade.exitTime}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div className="relative" ref={pairInputRef}>
                <input
                  name="pair"
                  value={pairQuery}
                  placeholder="Pair (e.g. NQ, EURUSD)"
                  onChange={(e) => {
                    setPairQuery(e.target.value);
                    setTrade({ ...trade, pair: e.target.value });
                    setShowPairDropdown(true);
                  }}
                  onFocus={() => setShowPairDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowPairDropdown(false);
                    }
                  }}
                  className="border p-2 rounded-lg w-full bg-background text-foreground"
                />

                {showPairDropdown && filteredPairs.length > 0 && (
                  <div className="absolute z-10 bg-background border w-full mt-1 rounded shadow max-h-40 overflow-auto">
                    {filteredPairs.map((p) => (
                      <div
                        key={p}
                        onClick={() => {
                          setPairQuery(p);
                          setTrade({ ...trade, pair: p });
                          setShowPairDropdown(false);
                        }}
                        className="p-2 cursor-pointer text-foreground rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SESSION DISPLAY */}
              <div className="border p-2 rounded-lg bg-background flex flex-col justify-center">
                <label className="text-xs text-muted-foreground mb-1">
                  Session (auto-detected)
                </label>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {trade.session || '-'}
                  </span>

                  <span className="text-xs text-muted-foreground">🔒</span>
                </div>
              </div>

              {/* TRADE STRUCTURE */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select
                  name="direction"
                  value={trade.direction}
                  onChange={handleChange}
                  className="border border-border bg-background p-2 rounded-lg"
                >
                  <option>Buy</option>
                  <option>Sell</option>
                </select>

                <select
                  name="type"
                  value={trade.type}
                  onChange={handleChange}
                  className="border border-border bg-background p-2 rounded-lg"
                >
                  <option>Scalp</option>
                  <option>Day Trade</option>
                  <option>Swing</option>
                </select>

                <select
                  name="result"
                  value={trade.result}
                  onChange={handleChange}
                  className="border border-border bg-background p-2 rounded-lg"
                >
                  <option>Win</option>
                  <option>Loss</option>
                  <option>Breakeven</option>
                </select>

                <select
                  name="feeling"
                  value={trade.feeling}
                  onChange={handleChange}
                  className="border border-border bg-background p-2 rounded-lg"
                >
                  <option>Calm</option>
                  <option>Anxious</option>
                </select>
              </div>

              {/* RISK */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="risk"
                  value={trade.risk}
                  placeholder="Risk %"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />

                <input
                  name="amount"
                  value={trade.amount}
                  placeholder="PnL (auto +/-)"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              {/* CHECKLIST */}
              <div>
                <h3 className="font-semibold mb-2">AOC Checklist</h3>

                <div className="flex flex-col gap-2">
                  {Object.entries({
                    bias: 'Daily bias clear',
                    timeframeAlignment: 'Timeframe Alignment',
                    sessionProfile: 'Session Profiles',
                    pdArray: 'H1 PD Arrays',
                    cisd: 'M5 CISD',
                    strongHL: 'Strong High/Low',
                    news: 'News',
                    killzone: 'Killzone',
                    smt: 'SMT',
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={trade.checklist[key as keyof Checklist]}
                        onChange={() => handleChecklist(key as keyof Checklist)}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="mt-2 text-sm">
                  Score: {trade.checklistScore}/9 | Suggested Risk:{' '}
                  <span className="font-semibold text-blue-600">
                    {trade.suggestedRisk}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="movedStops"
                    checked={trade.movedStops}
                    onChange={(e) =>
                      setTrade({
                        ...trade,
                        movedStops: e.target.checked,
                        movedStopsWorked: e.target.checked
                          ? trade.movedStopsWorked
                          : null,
                      })
                    }
                  />
                  Moved stops?
                </label>

                {trade.movedStops && (
                  <select
                    name="movedStopsWorked"
                    value={trade.movedStopsWorked ?? ''}
                    onChange={(e) =>
                      setTrade({
                        ...trade,
                        movedStopsWorked: e.target.value
                          ? (e.target.value as MovedStopResult)
                          : null,
                      })
                    }
                    className="border border-border bg-background p-2 rounded-lg"
                  >
                    <option value="PROTECTED">Protected SL (good)</option>
                    <option value="OVERMANAGED">
                      Interfered with TP (bad)
                    </option>
                    <option value="IRRELEVANT">No impact (neutral)</option>
                  </select>
                )}
              </div>

              {/* REMARKS */}
              <textarea
                name="remarks"
                value={trade.remarks}
                placeholder="Trade notes / execution thoughts..."
                onChange={handleChange}
                className="border p-2 rounded-lg w-full"
              />

              {/* SUBMIT */}
              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded-xl hover:opacity-90"
              >
                Add Trade
              </button>
            </form>
          </div>

          {/* FILTERS */}
          <div className="bg-card p-4 rounded-2xl shadow flex gap-2 flex-wrap">
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
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="border p-2 rounded"
              />

              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="border p-2 rounded"
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
              className="ml-auto bg-black text-white px-3 py-2 rounded"
            >
              Reset
            </button>
          </div>

          {/* ANALYTICS DASHBOARD */}
          <KPICards
            stats={analytics}
            breakdown={{
              winCount: analytics.winCount,
              lossCount: analytics.lossCount,
              breakevenCount: analytics.breakevenCount,
            }}
          />
          <MovedStopsCard stats={analytics.movedStopsStats} />

          <div className="bg-card rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 border rounded-lg relative group">
                <p className="text-muted-foreground flex items-center gap-1">
                  Win Rate
                  <span className="cursor-pointer text-muted-foreground hover:text-black">
                    ℹ️
                  </span>
                </p>

                <p className="text-lg font-semibold text-blue-600">
                  {analytics.winRate.toFixed(2)}%
                </p>

                {/* TOOLTIP */}
                <div className="absolute z-10 hidden group-hover:block w-72 p-3 text-xs text-white bg-black rounded-lg shadow-lg top-full mt-2 left-0">
                  <p className="font-semibold mb-2">📊 Win Rate Method</p>

                  <p className="mb-2">
                    This win rate{' '}
                    <b>includes breakeven trades in the total count</b>.
                  </p>

                  <p className="mb-2">
                    Formula:
                    <br />
                    Wins ÷ (Wins + Losses + Breakevens)
                  </p>

                  <p className="mb-2">Breakdown:</p>

                  <ul className="list-disc ml-4 space-y-1 mb-2">
                    <li>Wins: {analytics.winCount}</li>
                    <li>Losses: {analytics.lossCount}</li>
                    <li>Breakeven: {analytics.breakevenCount}</li>
                  </ul>

                  <p className="text-gray-300">
                    ⚠️ Some traders exclude breakevens to measure execution
                    quality separately. This dashboard uses the inclusive method
                    for consistency.
                  </p>
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground">Total PnL</p>
                <p
                  className={`text-lg font-semibold ${analytics.totalPnL > 0 ? 'text-green-600' : analytics.totalPnL < 0 ? 'text-red-600' : ''}`}
                >
                  {analytics.totalPnL}
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground">Avg Win</p>
                <p className="text-lg font-semibold text-green-600">
                  {analytics.avgWin.toFixed(2)}
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground">Avg Loss</p>
                <p className="text-lg font-semibold text-red-600">
                  {analytics.avgLoss.toFixed(2)}
                </p>
              </div>

              <div className="p-3 border rounded-lg relative group">
                <p className="text-muted-foreground flex items-center gap-1">
                  Profit Factor
                  {/* INFO ICON */}
                  <span className="cursor-pointer text-muted-foreground hover:text-black">
                    ℹ️
                  </span>
                </p>

                <p
                  className={`text-lg font-semibold ${
                    analytics.profitFactor > 1.5
                      ? 'text-green-600'
                      : analytics.profitFactor < 1
                        ? 'text-red-600'
                        : 'text-yellow-600'
                  }`}
                >
                  {analytics.profitFactor.toFixed(2)}
                </p>

                {/* TOOLTIP */}
                <div className="absolute z-10 hidden group-hover:block w-72 p-3 text-xs text-white bg-black rounded-lg shadow-lg top-full mt-2 left-0">
                  <p className="font-semibold mb-1">⚠️ Important</p>

                  <p className="mb-2">
                    Profit Factor = Total Wins ÷ Total Losses
                  </p>

                  <p className="mb-1">Interpretation:</p>
                  <ul className="list-disc ml-4 space-y-1 mb-2">
                    <li>Below 1.0 → Losing system</li>
                    <li>1.0 – 1.5 → Weak edge</li>
                    <li>1.5 – 2.0 → Solid</li>
                    <li>Above 2.0 → Strong edge</li>
                  </ul>

                  <p className="text-gray-300">
                    ⚠️ High profit factor with low sample size can be misleading
                  </p>
                </div>
              </div>

              <div className="p-3 border rounded-lg relative group">
                <p className="text-muted-foreground flex items-center gap-1">
                  Expectancy
                  {/* INFO ICON */}
                  <span className="cursor-pointer text-muted-foreground hover:text-black">
                    ℹ️
                  </span>
                </p>

                <p
                  className={`text-lg font-semibold ${analytics.expectancy > 0 ? 'text-green-600' : analytics.expectancy < 0 ? 'text-red-600' : ''}`}
                >
                  {analytics.expectancy.toFixed(2)}
                </p>

                {/* TOOLTIP */}
                <div className="absolute z-10 hidden group-hover:block w-72 p-3 text-xs text-white bg-black rounded-lg shadow-lg top-full mt-2 left-0">
                  <p className="font-semibold mb-2">📊 Expectancy Explained</p>

                  <p className="mb-2">
                    Expectancy measures how much you expect to{' '}
                    <b>make or lose per trade on average</b>.
                  </p>

                  <p className="mb-2">
                    It tells you whether your strategy is profitable over time,
                    not just how often you win.
                  </p>

                  <p className="mb-2 font-semibold">Formula:</p>
                  <p className="mb-2">
                    Expectancy = (Win Rate × Avg Win) + (Loss Rate × Avg Loss)
                  </p>

                  <p className="mb-2 font-semibold">How to read it:</p>
                  <ul className="list-disc ml-4 space-y-1 mb-2">
                    <li>Above 0 → profitable strategy</li>
                    <li>Below 0 → losing strategy</li>
                    <li>Higher value → stronger edge per trade</li>
                  </ul>

                  <p className="text-gray-300">
                    ⚠️ Expectancy is more important than win rate because it
                    factors in both probability and payoff size.
                  </p>
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground">Avg Trades / Day</p>
                <p className="text-lg font-semibold">
                  {analytics.avgTradesPerDay.toFixed(2)}
                </p>
              </div>

              <div className="bg-card border p-4 rounded-xl shadow">
                <h3 className="font-semibold mb-2">Checklist Mistakes</h3>
                <table className="w-full text-sm border-collapse mb-4">
                  <tbody>
                    {Object.entries(checklistTally).map(([type, count]) => (
                      <tr key={type} className="border-b">
                        <td className="p-2">{type}</td>
                        <td className="p-2 text-right">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="font-semibold mb-2">Behavioral Mistakes</h3>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {Object.entries(behavioralTally).map(([type, count]) => (
                      <tr key={type} className="border-b">
                        <td className="p-2">{type}</td>
                        <td className="p-2 text-right">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ===================== */}
          {/* BREAKDOWN SECTION */}
          {/* ===================== */}

          <div className="bg-card rounded-2xl shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold">Breakdown</h2>

            {/* SESSION */}
            <div>
              <h3 className="font-semibold mb-2">By Session</h3>
              <div className="grid md:grid-cols-4 gap-3 text-sm">
                {analytics.sessionGroups.map((g) => (
                  <div key={g.label} className="border p-3 rounded-lg">
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
                  <div key={g.label} className="border p-3 rounded-lg">
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
                  <div key={g.label} className="border p-3 rounded-lg">
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
                  <div key={g.label} className="border p-3 rounded-lg">
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
                  <div key={g.label} className="border p-3 rounded-lg">
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
                  <div key={g.label} className="border p-3 rounded-lg">
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

          {/* ===================== */}
          {/* CHARTS */}
          {/* ===================== */}

          <div className="bg-card rounded-2xl shadow p-6 space-y-10">
            <h2 className="text-xl font-semibold">Charts</h2>

            {/* EQUITY CURVE */}
            <div className="w-full">
              <EquityChart data={charts.equityCurve} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <BaseBarChart
                title="Analytics by Day of Week"
                data={charts.weekdayChartData}
              />
              <BaseBarChart
                title="Analytics by Trade Type"
                data={charts.typeChartData}
              />
              <BaseBarChart
                title="Analytics by Session"
                data={charts.sessionChartData}
              />
              <BaseBarChart
                title="Analytics by Pair"
                data={charts.pairChartData}
              />
              <BaseBarChart
                title="Analytics by Emotion"
                data={charts.emotionChartData}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-card p-6 rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="border p-2">No.</th>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Entry</th>
                  <th className="border p-2">Exit</th>
                  <th className="border p-2">Session</th>
                  <th className="border p-2">Pair</th>
                  <th className="border p-2">Direction</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Risk %</th>
                  <th className="border p-2">Result</th>
                  <th className="border p-2">PnL</th>

                  <th className="border p-2">Score</th>
                  <th className="border p-2">Suggested Risk</th>
                  <th className="border p-2">Feeling</th>
                  <th className="border p-2">Moved Stops</th>
                  <th className="border p-2">Stop Worked</th>
                  <th className="border p-2">Mistakes</th>
                  <th className="border p-2">Remarks</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {[...analytics.enrichedTrades]
                  .sort(
                    (a, b) =>
                      new Date(b.date + 'T' + b.entryTime).getTime() -
                      new Date(a.date + 'T' + a.entryTime).getTime()
                  )
                  .map((t, i, arr) => (
                    <tr key={t.id || i} className="text-center">
                      <td className="border p-2 font-semibold">
                        {arr.length - i}
                      </td>
                      <td className="border p-2">{t.date}</td>
                      <td className="border p-2">{t.entryTime}</td>
                      <td className="border p-2">{t.exitTime}</td>
                      <td className="border p-2">{t.session}</td>
                      <td className="border p-2 font-mono text-blue-600">
                        {t.pair || '-'}
                      </td>
                      <td className="border p-2">{t.direction}</td>
                      <td className="border p-2">{t.type}</td>
                      <td className="border p-2">{t.risk}</td>
                      <td
                        className={`border p-2 font-medium ${
                          t.result === 'Win'
                            ? 'text-green-600'
                            : t.result === 'Loss'
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {t.result}
                      </td>
                      <td
                        className={`border p-2 ${
                          Number(t.amount) > 0
                            ? 'text-green-600'
                            : Number(t.amount) < 0
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {t.amount}
                      </td>
                      <td className="border p-2">{t.checklistScore}</td>
                      <td className="border p-2 text-blue-600 font-semibold">
                        {t.suggestedRisk}
                      </td>
                      <td className="border p-2">{t.feeling}</td>
                      <td className="border p-2">
                        {t.movedStops ? (
                          <span className="text-blue-600 font-medium">
                            Adjusted
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="border p-2">
                        {!t.movedStops ? (
                          '-'
                        ) : t.movedStopsWorked === 'PROTECTED' ? (
                          <span className="text-green-600 font-medium">
                            Protected
                          </span>
                        ) : t.movedStopsWorked === 'OVERMANAGED' ? (
                          <span className="text-red-600 font-medium">
                            Overmanaged
                          </span>
                        ) : t.movedStopsWorked === 'IRRELEVANT' ? (
                          <span className="text-muted-foreground">Neutral</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="border p-2 text-left text-xs">
                        <ul className="list-disc list-inside">
                          {t.behavioralMistakes
                            .filter((m) => m.category === 'behavioral')
                            .map((m, idx) => (
                              <li key={idx}>{m.type}</li>
                            ))}
                        </ul>
                      </td>
                      <td className="border p-2 text-left text-xs">
                        {t.remarks || '-'}
                      </td>
                      <td className="border p-2 space-x-2">
                        <button
                          onClick={() => handleEdit(t)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {showUndo && deletedTrade && (
              <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl shadow flex items-center gap-4 z-50">
                <span>Trade deleted</span>

                <button
                  onClick={handleUndo}
                  className="text-green-400 font-semibold hover:underline"
                >
                  Undo
                </button>

                <button
                  onClick={() => {
                    setShowUndo(false);
                    setDeletedTrade(null);
                  }}
                  className="text-muted-foreground hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
