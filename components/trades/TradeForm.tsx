import React from 'react';
import { useEffect } from 'react';
import { MovedStopResult, Trade } from '@/types/trade';
import { getSession } from '@/utils/getSession';

type ChecklistKey =
  | 'bias'
  | 'timeframeAlignment'
  | 'sessionProfile'
  | 'pdArray'
  | 'cisd'
  | 'strongHL'
  | 'news'
  | 'killzone'
  | 'smt';

type Checklist = Trade['checklist'];

type Props = {
  trade: Trade;
  setTrade: React.Dispatch<React.SetStateAction<Trade>>;
  onSubmit: (e: React.FormEvent) => void;
  isEditMode: boolean;
  inputClass: string;

  pairQuery: string;
  setPairQuery: (v: string) => void;

  showPairDropdown: boolean;
  setShowPairDropdown: (v: boolean) => void;

  filteredPairs: string[];
  pairDropdownRef: React.RefObject<HTMLDivElement | null>;

  onToggleChecklist: (key: ChecklistKey) => void;
};

export function TradeForm({
  trade,
  setTrade,
  onSubmit,
  isEditMode,
  inputClass,

  pairQuery,
  setPairQuery,
  showPairDropdown,
  setShowPairDropdown,
  filteredPairs,
  pairDropdownRef,

  onToggleChecklist,
}: Props) {
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    setTrade((prev) => {
      const updated: Trade = {
        ...prev,
        [name]:
          type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      };

      // 🔥 AUTO SESSION LOGIC
      if (name === 'entryTime') {
        updated.session = getSession(value);
      }

      return updated;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const el = pairDropdownRef?.current;

      if (!el) return;

      // 🔥 IMPORTANT: use composedPath (fixes modal + portal issues)
      const path = event.composedPath?.();

      if (path && path.includes(el)) {
        return; // click INSIDE dropdown → do nothing
      }

      // fallback for older browsers
      if (el.contains(target)) return;

      setShowPairDropdown(false);
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPairDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [setShowPairDropdown]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      {/* PAIR DROPDOWN */}
      <div
        ref={pairDropdownRef}
        className="relative border border-border rounded-lg"
      >
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
          className="p-2 rounded-lg w-full bg-background text-foreground"
        />

        {showPairDropdown && filteredPairs.length > 0 && (
          <div className="absolute z-10 bg-background border w-full mt-1 rounded shadow max-h-40 overflow-auto">
            {filteredPairs.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPairQuery(p);
                  setTrade({ ...trade, pair: p });
                  setShowPairDropdown(false);
                }}
                className="w-full text-left p-2 hover:bg-accent"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SESSION DISPLAY */}
      <div className="border border-border p-2 rounded-lg bg-background flex flex-col justify-center">
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

      {/* STRUCTURE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <select
          name="direction"
          value={trade.direction}
          onChange={handleChange}
          className={inputClass}
        >
          <option>Buy</option>
          <option>Sell</option>
        </select>

        <select
          name="type"
          value={trade.type}
          onChange={handleChange}
          className={inputClass}
        >
          <option>Scalp</option>
          <option>Day Trade</option>
          <option>Swing</option>
        </select>

        <select
          name="result"
          value={trade.result}
          onChange={handleChange}
          className={inputClass}
        >
          <option>Win</option>
          <option>Loss</option>
          <option>Breakeven</option>
        </select>

        <select
          name="feeling"
          value={trade.feeling}
          onChange={handleChange}
          className={inputClass}
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
          onChange={handleChange}
          placeholder="Risk %"
          className={inputClass}
          required
        />
        <input
          name="amount"
          value={trade.amount}
          onChange={handleChange}
          placeholder="PnL"
          className={inputClass}
          required
        />
      </div>

      {/* CHECKLIST */}
      <div>
        <h3 className="font-semibold mb-2">AOC Checklist</h3>

        <div className="flex flex-col gap-2">
          {(
            Object.entries({
              bias: 'Daily bias clear',
              timeframeAlignment: 'Timeframe Alignment',
              sessionProfile: 'Session Profiles',
              pdArray: 'H1 PD Arrays',
              cisd: 'M5 CISD',
              strongHL: 'Strong High/Low',
              news: 'News',
              killzone: 'Killzone',
              smt: 'SMT',
            }) as [ChecklistKey, string][]
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={trade.checklist[key]}
                onChange={() => onToggleChecklist(key)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-2 text-sm">
        Score: {trade.checklistScore}/9 | Suggested Risk:{' '}
        <span className="font-semibold text-blue-600">
          {trade.suggestedRisk}
        </span>
      </div>

      {/* MOVED STOPS */}
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
            className={inputClass}
          >
            <option value="PROTECTED">Protected SL</option>
            <option value="OVERMANAGED">Overmanaged</option>
            <option value="IRRELEVANT">Neutral</option>
          </select>
        )}
      </div>

      {/* REMARKS */}
      <textarea
        name="remarks"
        value={trade.remarks}
        onChange={handleChange}
        placeholder="Trade notes..."
        className="border p-2 rounded-lg w-full"
      />

      {/* SUBMIT */}
      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground py-2 rounded-xl"
      >
        {isEditMode ? 'Update Trade' : 'Add Trade'}
      </button>
    </form>
  );
}
