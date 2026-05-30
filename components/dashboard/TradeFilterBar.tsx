'use client';

import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';

type Filters = {
  session: string[];
  result: string[];
  pair: string[];
  feeling: string[];
  startDate: string;
  endDate: string;
};

type Props = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  toggleFilter: (
    key: 'session' | 'result' | 'pair' | 'feeling',
    value: string
  ) => void;
  resetFilters: () => void;
  pairOptions: string[];
};

export function TradeFilterBar({
  filters,
  setFilters,
  toggleFilter,
  resetFilters,
  pairOptions,
}: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Filters:</h1>
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
          options={pairOptions}
          selected={filters.pair}
          onToggle={(v) => toggleFilter('pair', v)}
        />

        <MultiSelectDropdown
          label="Feeling"
          options={['Calm', 'Anxious']}
          selected={filters.feeling}
          onToggle={(v) => toggleFilter('feeling', v)}
        />

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                startDate: e.target.value,
              }))
            }
            className="border border-border p-2 rounded w-full"
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
            className="border border-border p-2 rounded w-full"
          />
        </div>

        <button
          onClick={resetFilters}
          className="ml-auto bg-primary text-primary-foreground px-3 py-2 rounded-md hover:opacity-90 active:scale-[0.98] transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
