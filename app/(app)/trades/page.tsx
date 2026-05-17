'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { MovedStopResult } from '@/types/trade';
import { useTradeAnalyticsV2 } from '@/hooks/useTradeAnalyticsV2';

import { useTradesStore } from '@/hooks/useTradesStore';

import DashboardCardLayout from '@/components/dashboard/DashboardCardLayout';
import { inputClass } from '@/components/ui/inputStyles';

import { detectMistakes } from '@/utils/detectMistakes';
import { getSession } from '@/utils/getSession';
import { calculateChecklist } from '@/utils/checklist';

type Checklist = Trade['checklist'];

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

export default function TradesPage() {
  // --------------------
  // STORE
  // --------------------
  const { trades, loadTrades } = useTradesStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [trade, setTrade] = useState<Trade>(createDefaultTrade());

  const [deletedTrade, setDeletedTrade] = useState<Trade | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  const [pairQuery, setPairQuery] = useState('');
  const [showPairDropdown, setShowPairDropdown] = useState(false);

  const didLoad = useRef(false);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  // --------------------
  // HELPERS
  // --------------------
  const updateTradeInStore = (updated: Trade) => {
    const updatedTrades = trades.map((t) =>
      t.id === updated.id ? updated : t
    );
    useTradesStore.setState({ trades: updatedTrades });
  };

  const addTradeToStore = (newTrade: Trade) => {
    useTradesStore.setState({ trades: [...trades, newTrade] });
  };

  const deleteTradeFromStore = (id: string) => {
    useTradesStore.setState({
      trades: trades.filter((t) => t.id !== id),
    });
  };

  // --------------------
  // HANDLERS
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rawAmount = Number(trade.amount);

    if (isNaN(rawAmount)) return alert('Invalid PnL');

    let normalizedAmount = rawAmount;
    if (trade.result === 'Loss') normalizedAmount = -Math.abs(rawAmount);
    if (trade.result === 'Breakeven') normalizedAmount = 0;

    const finalTrade: Trade = {
      ...trade,
      id: editingId || trade.id,
      amount: String(normalizedAmount),
      behavioralMistakes: detectMistakes({
        ...trade,
        amount: String(normalizedAmount),
      }),
    };

    if (editingId) {
      updateTradeInStore(finalTrade);
    } else {
      addTradeToStore(finalTrade);
    }

    setTrade(createDefaultTrade());
    setEditingId(null);
    setPairQuery('');
  };

  const handleEdit = (t: Trade) => {
    setTrade(t);
    setEditingId(t.id);
    setPairQuery(t.pair);
  };

  const handleDelete = (id: string) => {
    const t = trades.find((x) => x.id === id);
    if (!t) return;

    setDeletedTrade(t);
    deleteTradeFromStore(id);
    setShowUndo(true);

    setTimeout(() => {
      setShowUndo(false);
      setDeletedTrade(null);
    }, 5000);
  };

  const handleUndo = () => {
    if (!deletedTrade) return;
    addTradeToStore(deletedTrade);
    setDeletedTrade(null);
    setShowUndo(false);
  };

  // --------------------
  // PAIRS
  // --------------------
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

  // --------------------
  // ANALYTICS
  // --------------------
  const analytics = useTradeAnalyticsV2(trades);

  // --------------------
  // UI
  // --------------------
  return (
    <DashboardCardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        <h1 className="text-3xl font-bold">Trades</h1>

        {/* ================= FORM ================= */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
          <div className=" px-6 py-4">
            <h2 className="text-lg font-semibold">Add Trade</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* DATE + TIME */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
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

            <div className="relative">
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
                className="p-2 rounded-lg w-full bg-background text-foreground"
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
            <div className="p-2 rounded-lg bg-background flex flex-col justify-center">
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
                  <label key={key} className="flex items-center gap-2 text-sm">
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
                  <option value="OVERMANAGED">Interfered with TP (bad)</option>
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
              className="w-full bg-primary text-primary-foreground py-2 rounded-xl hover:opacity-90 active:scale-[0.99] transition font-medium shadow-sm"
            >
              Add Trade
            </button>
          </form>
        </div>

        {/* ================= TABLE ================= */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h2 className="text-lg font-semibold">Trade History</h2>

            <div className="text-xs text-muted-foreground">
              {analytics.enrichedTrades.length} trades
            </div>
          </div>
          <div className="w-full max-w-full overflow-x-auto overflow-y-hidden border rounded-xl">
            <div className="w-full overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-muted text-left sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      No.
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Entry
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Exit
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Session
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Pair
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Direction
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Risk %
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Result
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      PnL
                    </th>

                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Score
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Suggested Risk
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Feeling
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Moved Stops
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Stop Worked
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Mistakes
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Remarks
                    </th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium text-muted-foreground">
                      Actions
                    </th>
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
                      <tr
                        key={t.id || i}
                        className="border-t hover:bg-muted/40 transition"
                      >
                        <td className="px-4 py-2 whitespace-nowrap">
                          {arr.length - i}
                        </td>
                        <td className="px-4 py-2">{t.date}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {t.entryTime}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {t.exitTime}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {t.session}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {t.pair || '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {t.direction}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {t.type}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {t.risk}
                        </td>
                        <td
                          className={`px-4 py-2 whitespace-nowrap font-medium ${
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
                          className={`px-4 py-2 whitespace-nowrap ${
                            Number(t.amount) > 0
                              ? 'text-green-600'
                              : Number(t.amount) < 0
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {t.amount}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          {t.checklistScore}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {t.suggestedRisk}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {t.feeling}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {t.movedStops ? (
                            <span className="text-blue-600 font-medium">
                              Adjusted
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
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
                            <span className="text-muted-foreground">
                              Neutral
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-left text-xs">
                          <ul className="list-disc list-inside">
                            {t.behavioralMistakes
                              .filter((m) => m.category === 'behavioral')
                              .map((m, idx) => (
                                <li key={idx}>{m.type}</li>
                              ))}
                          </ul>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-left text-xs">
                          {t.remarks || '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap space-x-2">
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
            </div>
          </div>
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
    </DashboardCardLayout>
  );
}
