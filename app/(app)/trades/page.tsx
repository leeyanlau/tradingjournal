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

import { TradeForm } from '@/components/trades/TradeForm';
import { TradeModal } from '@/components/trades/TradeModal';

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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const didLoad = useRef(false);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const pairDropdownRef = useRef<HTMLDivElement | null>(null);

  // mouse click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pairDropdownRef.current &&
        !pairDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPairDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // press esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPairDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const formRef = useRef<HTMLDivElement | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [highlightForm, setHighlightForm] = useState(false);

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
    setIsEditMode(false);
  };

  const handleEdit = (t: Trade) => {
    setTrade(t);
    setEditingId(t.id);
    setPairQuery(t.pair);

    setIsEditMode(true);
    setIsModalOpen(true);
    setHighlightForm(true);

    formRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    setTimeout(() => {
      setHighlightForm(false);
    }, 2000);
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

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
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
      {/* FLOATING ADD BUTTON */}
      <button
        onClick={() => {
          setIsModalOpen(true);
          setTrade(createDefaultTrade());
          setEditingId(null);
          setIsEditMode(false);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center justify-center"
      >
        +
      </button>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        <h1 className="text-3xl font-bold">Trades</h1>

        {/* ================= FORM ================= */}
        <TradeModal open={isModalOpen} onClose={closeModal}>
          {/* Header (optional but recommended since your modal is "blank") */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {isEditMode ? 'Edit Trade' : 'Add Trade'}
            </h2>

            <button
              onClick={() => setIsModalOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <TradeForm
            trade={trade}
            setTrade={setTrade}
            onSubmit={(e: any) => {
              handleSubmit(e);
              setIsModalOpen(false); // close after submit
            }}
            isEditMode={isEditMode}
            inputClass={inputClass}
            pairQuery={pairQuery}
            setPairQuery={setPairQuery}
            showPairDropdown={showPairDropdown}
            setShowPairDropdown={setShowPairDropdown}
            filteredPairs={filteredPairs}
            pairDropdownRef={pairDropdownRef}
            onToggleChecklist={handleChecklist}
          />
        </TradeModal>

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
