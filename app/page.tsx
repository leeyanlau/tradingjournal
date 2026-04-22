'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTradeStats } from '../hooks/useTradeStats';
import { useTradeGroups } from '../hooks/useTradeGroups';
import { useTradeCharts } from '../hooks/useTradeCharts';
import { getStats } from '../utils/getStats';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';

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

type MovedStopResult = 'PROTECTED' | 'OVERMANAGED' | 'IRRELEVANT' | null;

type Trade = {
  id: string;
  date: string;
  entryTime: string;
  exitTime: string;
  session: string;
  direction: string;
  type: string;
  pair: string;
  result: string;
  risk: string;
  amount: string;
  checklist: Checklist;
  checklistScore: number;
  suggestedRisk: string;
  remarks: string;
  feeling: string;
  movedStops: boolean;
  movedStopsWorked: MovedStopResult;
};

type Mistake = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  category: 'behavioral' | 'checklist';
};

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

// =====================
// DUMMY DATA (NEWEST FIRST)
// =====================
const dummyTrades: Trade[] = [
  {
    id: crypto.randomUUID(),
    date: '2026-03-23',
    entryTime: '09:10',
    exitTime: '09:25',
    session: 'London',
    direction: 'Buy',
    type: 'Scalp',
    pair: 'EURUSD',
    result: 'Win',
    risk: '1',
    amount: '45',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: false,
      cisd: true,
      strongHL: true,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 6,
    suggestedRisk: '0.5%',
    remarks: 'Exited early, could have held longer',
    feeling: 'Calm',
    movedStops: true,
    movedStopsWorked: 'PROTECTED',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-23',
    entryTime: '10:40',
    exitTime: '10:55',
    session: 'London',
    direction: 'Sell',
    type: 'Scalp',
    pair: 'GBPUSD',
    result: 'Loss',
    risk: '1',
    amount: '-30',
    checklist: {
      bias: false,
      timeframeAlignment: false,
      sessionProfile: true,
      pdArray: false,
      cisd: false,
      strongHL: false,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 3,
    suggestedRisk: '0.25%',
    remarks: 'Forced trade, no clear setup',
    feeling: 'Anxious',
    movedStops: true,
    movedStopsWorked: 'OVERMANAGED',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-24',
    entryTime: '14:20',
    exitTime: '14:50',
    session: 'NYAM',
    direction: 'Buy',
    type: 'Day Trade',
    pair: 'NQ',
    result: 'Win',
    risk: '1',
    amount: '80',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: true,
      strongHL: true,
      news: true,
      killzone: true,
      smt: true,
    },
    checklistScore: 9,
    suggestedRisk: '1%',
    remarks: 'Clean setup, followed plan',
    feeling: 'Calm',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-24',
    entryTime: '15:10',
    exitTime: '15:25',
    session: 'NYAM',
    direction: 'Sell',
    type: 'Scalp',
    pair: 'NQ',
    result: 'Breakeven',
    risk: '0.5',
    amount: '0',
    checklist: {
      bias: true,
      timeframeAlignment: false,
      sessionProfile: true,
      pdArray: false,
      cisd: true,
      strongHL: false,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 5,
    suggestedRisk: '0.5%',
    remarks: 'Got nervous, closed too early',
    feeling: 'Anxious',
    movedStops: true,
    movedStopsWorked: 'IRRELEVANT',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-25',
    entryTime: '09:30',
    exitTime: '09:50',
    session: 'London',
    direction: 'Buy',
    type: 'Scalp',
    pair: 'EURUSD',
    result: 'Loss',
    risk: '1',
    amount: '-50',
    checklist: {
      bias: false,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: false,
      cisd: false,
      strongHL: true,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 5,
    suggestedRisk: '0.5%',
    remarks: 'Entered against bias',
    feeling: 'Anxious',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-25',
    entryTime: '14:05',
    exitTime: '14:45',
    session: 'NYAM',
    direction: 'Buy',
    type: 'Day Trade',
    pair: 'GBPUSD',
    result: 'Win',
    risk: '1',
    amount: '60',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: true,
      strongHL: true,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 8,
    suggestedRisk: '1%',
    remarks: 'Good patience, followed plan',
    feeling: 'Calm',
    movedStops: true,
    movedStopsWorked: 'PROTECTED',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-04-03',
    entryTime: '14:20',
    exitTime: '15:00',
    session: 'NYAM',
    direction: 'Sell',
    type: 'Day Trade',
    pair: 'NQ',
    result: 'Loss',
    risk: '1',
    amount: '-35',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: false,
      strongHL: true,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 7,
    suggestedRisk: '0.5%',
    remarks: 'Late entry, chased move',
    feeling: 'Anxious',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-26',
    entryTime: '10:00',
    exitTime: '10:20',
    session: 'London',
    direction: 'Sell',
    type: 'Scalp',
    pair: 'EURUSD',
    result: 'Loss',
    risk: '1',
    amount: '-25',
    checklist: {
      bias: false,
      timeframeAlignment: false,
      sessionProfile: true,
      pdArray: false,
      cisd: false,
      strongHL: false,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 2,
    suggestedRisk: '0.25%',
    remarks: 'Overtrading, revenge trade',
    feeling: 'Anxious',
    movedStops: true,
    movedStopsWorked: 'OVERMANAGED',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-26',
    entryTime: '15:30',
    exitTime: '16:10',
    session: 'NYAM',
    direction: 'Buy',
    type: 'Day Trade',
    pair: 'NQ',
    result: 'Win',
    risk: '1',
    amount: '70',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: true,
      strongHL: true,
      news: true,
      killzone: true,
      smt: true,
    },
    checklistScore: 9,
    suggestedRisk: '1%',
    remarks: 'Strong continuation trade',
    feeling: 'Calm',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-27',
    entryTime: '09:15',
    exitTime: '09:35',
    session: 'London',
    direction: 'Buy',
    type: 'Scalp',
    pair: 'GBPUSD',
    result: 'Breakeven',
    risk: '0.5',
    amount: '0',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: false,
      cisd: true,
      strongHL: false,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 6,
    suggestedRisk: '0.5%',
    remarks: 'Moved SL too early',
    feeling: 'Anxious',
    movedStops: true,
    movedStopsWorked: 'OVERMANAGED',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-27',
    entryTime: '14:10',
    exitTime: '14:50',
    session: 'NYAM',
    direction: 'Sell',
    type: 'Day Trade',
    pair: 'NQ',
    result: 'Loss',
    risk: '1',
    amount: '-60',
    checklist: {
      bias: false,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: false,
      strongHL: true,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 6,
    suggestedRisk: '0.5%',
    remarks: 'Entered late, poor timing',
    feeling: 'Anxious',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-30',
    entryTime: '09:05',
    exitTime: '09:30',
    session: 'London',
    direction: 'Buy',
    type: 'Scalp',
    pair: 'EURUSD',
    result: 'Win',
    risk: '1',
    amount: '55',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: true,
      strongHL: true,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 8,
    suggestedRisk: '1%',
    remarks: 'Followed plan, clean entry',
    feeling: 'Calm',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-30',
    entryTime: '10:15',
    exitTime: '10:35',
    session: 'London',
    direction: 'Sell',
    type: 'Scalp',
    pair: 'GBPUSD',
    result: 'Loss',
    risk: '1',
    amount: '-25',
    checklist: {
      bias: true,
      timeframeAlignment: false,
      sessionProfile: true,
      pdArray: false,
      cisd: true,
      strongHL: false,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 6,
    suggestedRisk: '0.5%',
    remarks: 'Decent idea, poor execution',
    feeling: 'Calm',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-31',
    entryTime: '14:00',
    exitTime: '14:40',
    session: 'NYAM',
    direction: 'Buy',
    type: 'Day Trade',
    pair: 'NQ',
    result: 'Win',
    risk: '1',
    amount: '90',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: true,
      strongHL: true,
      news: true,
      killzone: true,
      smt: true,
    },
    checklistScore: 9,
    suggestedRisk: '1%',
    remarks: 'Held full move, strong conviction',
    feeling: 'Calm',
    movedStops: true,
    movedStopsWorked: 'PROTECTED',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-03-31',
    entryTime: '15:10',
    exitTime: '15:25',
    session: 'NYAM',
    direction: 'Sell',
    type: 'Scalp',
    pair: 'NQ',
    result: 'Breakeven',
    risk: '0.5',
    amount: '0',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: false,
      cisd: true,
      strongHL: false,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 7,
    suggestedRisk: '0.5%',
    remarks: 'Moved stop too aggressively',
    feeling: 'Calm',
    movedStops: true,
    movedStopsWorked: 'OVERMANAGED',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-04-01',
    entryTime: '09:20',
    exitTime: '09:45',
    session: 'London',
    direction: 'Buy',
    type: 'Scalp',
    pair: 'EURUSD',
    result: 'Win',
    risk: '1',
    amount: '60',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: true,
      strongHL: true,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 8,
    suggestedRisk: '1%',
    remarks: 'Clean execution',
    feeling: 'Calm',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-04-01',
    entryTime: '14:30',
    exitTime: '15:05',
    session: 'NYAM',
    direction: 'Sell',
    type: 'Day Trade',
    pair: 'GBPUSD',
    result: 'Loss',
    risk: '1',
    amount: '-40',
    checklist: {
      bias: false,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: false,
      strongHL: true,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 6,
    suggestedRisk: '0.5%',
    remarks: 'Bias unclear, should have skipped',
    feeling: 'Anxious',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-04-02',
    entryTime: '09:00',
    exitTime: '09:20',
    session: 'London',
    direction: 'Sell',
    type: 'Scalp',
    pair: 'EURUSD',
    result: 'Win',
    risk: '1',
    amount: '50',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: true,
      strongHL: true,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 8,
    suggestedRisk: '1%',
    remarks: 'Quick and clean',
    feeling: 'Calm',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },

  {
    id: crypto.randomUUID(),
    date: '2026-04-02',
    entryTime: '14:10',
    exitTime: '14:50',
    session: 'NYAM',
    direction: 'Buy',
    type: 'Day Trade',
    pair: 'NQ',
    result: 'Win',
    risk: '1',
    amount: '85',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: true,
      cisd: true,
      strongHL: true,
      news: true,
      killzone: true,
      smt: true,
    },
    checklistScore: 9,
    suggestedRisk: '1%',
    remarks: 'Held runner well',
    feeling: 'Calm',
    movedStops: true,
    movedStopsWorked: 'PROTECTED',
  },
  {
    id: crypto.randomUUID(),
    date: '2026-04-03',
    entryTime: '09:10',
    exitTime: '09:35',
    session: 'London',
    direction: 'Buy',
    type: 'Scalp',
    pair: 'GBPUSD',
    result: 'Win',
    risk: '1',
    amount: '45',
    checklist: {
      bias: true,
      timeframeAlignment: true,
      sessionProfile: true,
      pdArray: false,
      cisd: true,
      strongHL: true,
      news: true,
      killzone: true,
      smt: false,
    },
    checklistScore: 7,
    suggestedRisk: '0.5%',
    remarks: 'Slight hesitation but good trade',
    feeling: 'Calm',
    movedStops: false,
    movedStopsWorked: 'IRRELEVANT',
  },
];

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
  checklist: {
    bias: false,
    timeframeAlignment: false,
    sessionProfile: false,
    pdArray: false,
    cisd: false,
    strongHL: false,
    news: false,
    killzone: false,
    smt: false,
  },
  checklistScore: 0,
  suggestedRisk: '0%',
  remarks: '',
  feeling: 'Calm',
  movedStops: false,
  movedStopsWorked: null,
});

export default function Home() {
  const [trade, setTrade] = useState<Trade>(createDefaultTrade());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletedTrade, setDeletedTrade] = useState<Trade | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  // FILTERS
  const [filters, setFilters] = useState({
    session: [] as string[],
    result: [] as string[],
    pair: [] as string[],
    feeling: [] as string[],
    startDate: '',
    endDate: '',
  });

  const didLoad = useRef(false);

  // LOAD DATA (runs once only)
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    const saved = localStorage.getItem('trades');

    if (!saved) {
      setTrades(dummyTrades);
      return;
    }

    try {
      const parsed: Trade[] = JSON.parse(saved);

      const normalized = parsed.map((t) => ({
        ...createDefaultTrade(),
        ...t,
        id: t.id || crypto.randomUUID(), // 🔥 ensure every trade has id
        movedStopsWorked:
          t.movedStopsWorked === true
            ? 'PROTECTED'
            : t.movedStopsWorked === false
              ? 'OVERMANAGED'
              : (t.movedStopsWorked ?? null),
      }));

      setTrades(normalized);
    } catch {
      setTrades(dummyTrades);
    }
  }, []);

  // SAVE DATA
  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
  }, [trades]);

  // SESSION LOGIC
  const getSession = (time: string) => {
    if (!time) return '';

    const hour = parseInt(time.split(':')[0]);

    // Asia: 8pm - 11:59pm
    if (hour >= 20 && hour <= 23) return 'Asia';

    // London: 2am - 5am
    if (hour >= 2 && hour <= 5) return 'London';

    // NYAM: 7am - 10am
    if (hour >= 7 && hour <= 10) return 'NYAM';

    return 'Out of KZ';
  };

  // CHECKLIST SCORE
  const calculateChecklist = (checklist: Checklist) => {
    const score = Object.values(checklist).filter(Boolean).length;

    let risk = '0%';
    if (score >= 8) risk = '1%';
    else if (score === 7) risk = '0.5%';

    return { score, risk };
  };

  const checklistRules: Record<
    keyof Checklist,
    { type: string; severity: Mistake['severity'] }
  > = {
    bias: { type: 'No daily bias', severity: 'high' },
    timeframeAlignment: { type: 'No timeframe alignment', severity: 'high' },
    sessionProfile: { type: 'No session profile', severity: 'medium' },
    pdArray: { type: 'No PD Array context', severity: 'medium' },
    cisd: { type: 'No CISD confirmation', severity: 'medium' },
    strongHL: { type: 'Weak high/low', severity: 'medium' },
    news: { type: 'Ignored news', severity: 'medium' },
    killzone: { type: 'Outside killzone', severity: 'medium' },
    smt: { type: 'No SMT confirmation', severity: 'low' },
  };

  // DETECT MISTAKES
  const detectMistakes = (t: Trade): Mistake[] => {
    const mistakes: Mistake[] = [];

    // ===== CHECKLIST (ONLY penalize on losses) =====
    if (t.result === 'Loss') {
      (Object.keys(checklistRules) as (keyof Checklist)[]).forEach((key) => {
        if (!t.checklist[key]) {
          const rule = checklistRules[key];

          mistakes.push({
            type: rule.type,
            severity: rule.severity,
            category: 'checklist',
          });
        }
      });
    }

    // ===== QUALITY =====
    if (t.checklistScore <= 6) {
      mistakes.push({
        type: 'Low score trade',
        severity: 'high',
        category: 'behavioral',
      });
    }

    if (t.result === 'Loss' && t.checklistScore <= 7) {
      mistakes.push({
        type: 'Low quality loss',
        severity: 'medium',
        category: 'behavioral',
      });
    }

    // ===== BEHAVIOR =====
    if (t.feeling === 'Anxious') {
      mistakes.push({
        type: 'Emotional trading (anxious)',
        severity: 'medium',
        category: 'behavioral',
      });
    }

    if (t.movedStops && t.movedStopsWorked === 'OVERMANAGED') {
      mistakes.push({
        type: 'Over-tightened stop (missed TP)',
        severity: 'medium',
        category: 'behavioral',
      });
    }

    const riskValue = Number((t.risk || '').replace('%', ''));

    if (riskValue > 1) {
      mistakes.push({
        type: 'Over risk (>1%)',
        severity: 'high',
        category: 'behavioral',
      });
    }

    if (t.session === 'Out of KZ') {
      mistakes.push({
        type: 'Outside session',
        severity: 'medium',
        category: 'behavioral',
      });
    }

    return mistakes;
  };

  // FILTERED DATA
  const processedTrades = useMemo(() => {
    return [...trades].filter((t) => {
      if (filters.session.length && !filters.session.includes(t.session))
        return false;

      if (filters.result.length && !filters.result.includes(t.result))
        return false;

      if (filters.pair.length && !filters.pair.includes(t.pair)) return false;

      if (filters.feeling.length && !filters.feeling.includes(t.feeling))
        return false;

      // ✅ DATE FILTER
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;

      return true;
    });
  }, [trades, filters]);

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

    return (
      <div className="relative w-48">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="border p-2 rounded w-full text-left"
        >
          {label}: {selected.length ? selected.join(', ') : 'All'}
        </button>

        {open && (
          <div className="absolute z-10 bg-white border mt-1 w-full rounded shadow max-h-48 overflow-auto">
            {options.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
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

  const sortedTrades = useMemo(() => {
    return [...processedTrades].sort((a, b) => {
      return (
        new Date(`${b.date}T${b.entryTime}`).getTime() -
        new Date(`${a.date}T${a.entryTime}`).getTime()
      );
    });
  }, [processedTrades]);

  const enrichedTrades = useMemo(() => {
    return sortedTrades.map((t) => ({
      ...t,
      mistakes: detectMistakes(t),
    }));
  }, [sortedTrades]);

  const displayTrades = useMemo(() => {
    return enrichedTrades.map((t, index) => ({
      ...t,
      tradeNo: enrichedTrades.length - index, // newest = highest number
    }));
  }, [enrichedTrades]);

  const pairList = useMemo(() => {
    return Array.from(
      new Set(displayTrades.map((t) => t.pair).filter(Boolean))
    );
  }, [displayTrades]);

  const mistakeSummary = useMemo(() => {
    const acc: Record<string, Set<number>> = {};

    displayTrades.forEach((t, idx) => {
      t.mistakes.forEach((m) => {
        if (!acc[m.type]) acc[m.type] = new Set();
        acc[m.type].add(idx); // prevent duplicate counting per trade
      });
    });

    return Object.fromEntries(
      Object.entries(acc).map(([type, set]) => [type, set.size])
    );
  }, [displayTrades]);

  const mistakeCost = useMemo(() => {
    return displayTrades.reduce((sum, t) => {
      if (t.result === 'Loss' && t.mistakes.length > 0) {
        return sum + Math.abs(Number(t.amount || 0));
      }
      return sum;
    }, 0);
  }, [displayTrades]);

  const pairSuggestions = useMemo(() => {
    return Array.from(new Set(trades.map((t) => t.pair).filter(Boolean)));
  }, [trades]);

  const pairGroups = useMemo(() => {
    return pairList.map((pair) => ({
      label: pair,
      stats: getStats(displayTrades.filter((t) => t.pair === pair)),
    }));
  }, [pairList, displayTrades]);

  const [pairQuery, setPairQuery] = useState('');
  const [showPairDropdown, setShowPairDropdown] = useState(false);

  const filteredPairs = pairSuggestions.filter((p) =>
    p.toLowerCase().includes(pairQuery.toLowerCase())
  );

  const equitySource = useMemo(() => {
    return [...processedTrades].sort((a, b) => {
      return (
        new Date(`${a.date}T${a.entryTime}`).getTime() -
        new Date(`${b.date}T${b.entryTime}`).getTime()
      );
    });
  }, [processedTrades]);

  const equityData = equitySource.reduce((acc: any[], t, index) => {
    const pnl = Number(t.amount || 0);

    const prevEquity = acc[index - 1]?.equity ?? 0;
    const equity = prevEquity + pnl;

    acc.push({
      index: index + 1,
      date: t.date,
      entryTime: t.entryTime,
      exitTime: t.exitTime,
      pnl, // still useful for tooltip
      equity,
      pair: t.pair,
      result: t.result,
    });

    return acc;
  }, []);

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

  // =====================
  // Grouping
  // =====================
  const {
    sessionGroups,
    weekdayGroups,
    emotionGroups,
    scoreGroups,
    typeGroups,
  } = useTradeGroups(displayTrades);

  const {
    sessionChartData,
    weekdayChartData,
    emotionChartData,
    typeChartData,
    pairChartData,
  } = useTradeCharts(
    displayTrades,
    sessionGroups,
    weekdayGroups,
    emotionGroups,
    typeGroups,
    pairGroups
  );

  // =====================
  // ANALYTICS
  // =====================
  const {
    winRate,
    totalPnL,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,

    winCount,
    lossCount,

    totalWinsAmount,
    totalLossAmount,
  } = useTradeStats(displayTrades);

  const breakevens = displayTrades.filter((t) => t.result === 'Breakeven');

  // Profit Factor = total wins / total losses (absolute)
  const movedStopsStats = useMemo(() => {
    const trades = displayTrades.filter((t) => t.movedStops === true);

    const safeAmount = (v: any) => Number(v || 0);

    const successTrades = trades.filter(
      (t) => t.movedStopsWorked === 'PROTECTED'
    );

    const failTrades = trades.filter(
      (t) => t.movedStopsWorked === 'OVERMANAGED'
    );

    const neutralTrades = trades.filter(
      (t) => t.movedStopsWorked === 'IRRELEVANT'
    );

    const success = successTrades.length;
    const fail = failTrades.length;
    const neutral = neutralTrades.length;

    const pnlSuccess = successTrades.reduce(
      (sum, t) => sum + safeAmount(t.amount),
      0
    );

    const pnlFail = failTrades.reduce(
      (sum, t) => sum + safeAmount(t.amount),
      0
    );

    const pnlNeutral = neutralTrades.reduce(
      (sum, t) => sum + safeAmount(t.amount),
      0
    );

    const total = trades.length;

    const totalPnL = pnlSuccess + pnlFail + pnlNeutral;

    return {
      total,
      success,
      fail,
      neutral,
      pnlSuccess,
      pnlFail,
      pnlNeutral,
      totalPnL,
      quality: total ? (success / total) * 100 : 0,
      netImpact: success - fail,
      pnlImpact: totalPnL,
    };
  }, [displayTrades]);

  const tradesPerDayMap = useMemo(() => {
    const map: Record<string, number> = {};

    displayTrades.forEach((t) => {
      if (!t.date) return;
      map[t.date] = (map[t.date] || 0) + 1;
    });

    return map;
  }, [displayTrades]);

  const avgTradesPerDay = useMemo(() => {
    const days = Object.keys(tradesPerDayMap).length;
    const totalTrades = displayTrades.length;

    return days > 0 ? totalTrades / days : 0;
  }, [displayTrades, tradesPerDayMap]);

  // INPUT HANDLER
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
    if (isNaN(riskValue)) {
      return alert('Risk must be a valid percentage (e.g. 0.5, 1)');
    }

    // 🔄 NORMALIZE PnL
    let normalizedAmount = rawAmount;

    if (trade.result === 'Loss') {
      normalizedAmount = -Math.abs(rawAmount);
    } else if (trade.result === 'Win') {
      normalizedAmount = Math.abs(rawAmount);
    } else if (trade.result === 'Breakeven') {
      normalizedAmount = 0;
    }

    // 🆔 FINAL OBJECT
    const finalTrade = {
      ...trade,
      id: editingId || trade.id || crypto.randomUUID(),
      amount: String(normalizedAmount),
    };

    // ➕ ADD OR ✏️ EDIT
    setTrades((prev) => {
      if (editingId) {
        return prev.map((t) => (t.id === editingId ? finalTrade : t));
      }

      return [...prev, finalTrade];
    });

    // 🔄 RESET FORM
    setTrade(createDefaultTrade());
    setPairQuery('');
    setEditingId(null);
  };

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

  // CHECKLIST
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

  // SUBMIT
  const handleEdit = (t: Trade) => {
    setTrade(t);
    setPairQuery(t.pair);
    setEditingId(t.id || null);

    // optional: scroll to form (nice UX)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const handleUndo = () => {
    if (!deletedTrade) return;

    setTrades((prev) => [...prev, deletedTrade]);

    setDeletedTrade(null);
    setShowUndo(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">Trading Journal</h1>

        {/* FORM */}
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Add Trade</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* DATE + TIME */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="date"
                name="date"
                value={trade.date}
                onChange={handleChange}
                className="border p-2 rounded-lg"
                required
              />

              <input
                type="time"
                name="entryTime"
                value={trade.entryTime}
                onChange={handleChange}
                className="border p-2 rounded-lg"
                required
              />

              <input
                type="time"
                name="exitTime"
                value={trade.exitTime}
                onChange={handleChange}
                className="border p-2 rounded-lg"
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
                className="border p-2 rounded-lg w-full"
              />

              {showPairDropdown && filteredPairs.length > 0 && (
                <div className="absolute z-10 bg-white border w-full mt-1 rounded shadow max-h-40 overflow-auto">
                  {filteredPairs.map((p) => (
                    <div
                      key={p}
                      onClick={() => {
                        setPairQuery(p);
                        setTrade({ ...trade, pair: p });
                        setShowPairDropdown(false);
                      }}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SESSION DISPLAY */}
            <p className="text-sm text-gray-600">
              Session: <span className="font-medium">{trade.session}</span>
            </p>

            {/* TRADE STRUCTURE */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                name="direction"
                value={trade.direction}
                onChange={handleChange}
                className="border p-2 rounded-lg"
              >
                <option>Buy</option>
                <option>Sell</option>
              </select>

              <select
                name="type"
                value={trade.type}
                onChange={handleChange}
                className="border p-2 rounded-lg"
              >
                <option>Scalp</option>
                <option>Day Trade</option>
                <option>Swing</option>
              </select>

              <select
                name="result"
                value={trade.result}
                onChange={handleChange}
                className="border p-2 rounded-lg"
              >
                <option>Win</option>
                <option>Loss</option>
                <option>Breakeven</option>
              </select>

              <select
                name="feeling"
                value={trade.feeling}
                onChange={handleChange}
                className="border p-2 rounded-lg"
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
                className="border p-2 rounded-lg"
                required
              />

              <input
                name="amount"
                value={trade.amount}
                placeholder="PnL (auto +/-)"
                onChange={handleChange}
                className="border p-2 rounded-lg"
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
                  className="border p-2 rounded-lg"
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
              className="w-full bg-black text-white py-2 rounded-xl hover:opacity-90"
            >
              Add Trade
            </button>
          </form>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-2xl shadow flex gap-2 flex-wrap">
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
            options={pairSuggestions}
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
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 border rounded-lg">
              <p className="text-gray-500">Win Rate</p>
              <p className="text-lg font-semibold">{winRate.toFixed(1)}%</p>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-gray-500">Total PnL</p>
              <p
                className={`text-lg font-semibold ${totalPnL > 0 ? 'text-green-600' : totalPnL < 0 ? 'text-red-600' : ''}`}
              >
                {totalPnL}
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-gray-500">Avg Win</p>
              <p className="text-lg font-semibold text-green-600">
                {avgWin.toFixed(2)}
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-gray-500">Avg Loss</p>
              <p className="text-lg font-semibold text-red-600">
                {avgLoss.toFixed(2)}
              </p>
            </div>

            <div className="p-3 border rounded-lg relative group">
              <p className="text-gray-500 flex items-center gap-1">
                Profit Factor
                {/* INFO ICON */}
                <span className="cursor-pointer text-gray-400 hover:text-black">
                  ℹ️
                </span>
              </p>

              <p
                className={`text-lg font-semibold ${
                  profitFactor > 1.5
                    ? 'text-green-600'
                    : profitFactor < 1
                      ? 'text-red-600'
                      : 'text-yellow-600'
                }`}
              >
                {profitFactor.toFixed(2)}
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
              <p className="text-gray-500 flex items-center gap-1">
                Expectancy
                {/* INFO ICON */}
                <span className="cursor-pointer text-gray-400 hover:text-black">
                  ℹ️
                </span>
              </p>

              <p
                className={`text-lg font-semibold ${expectancy > 0 ? 'text-green-600' : expectancy < 0 ? 'text-red-600' : ''}`}
              >
                {expectancy.toFixed(2)}
              </p>

              {/* TOOLTIP */}
              <div className="absolute z-10 hidden group-hover:block w-72 p-3 text-xs text-white bg-black rounded-lg shadow-lg top-full mt-2 left-0">
                <p className="font-semibold mb-1">⚠️ Important</p>

                <p>Win rate alone means nothing</p>
                <p className="mb-2">Expectancy is everything</p>

                <p className="mb-1">Examples:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>40% win rate + positive expectancy → profitable</li>
                  <li>70% win rate + negative expectancy → losing</li>
                </ul>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-gray-500">Avg Trades / Day</p>
              <p className="text-lg font-semibold">
                {avgTradesPerDay.toFixed(2)}
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-gray-500">Moved Stops</p>

              <p className="text-lg font-semibold">
                {movedStopsStats.total} trades
              </p>

              <p className="text-sm text-green-600">
                Protected: {movedStopsStats.success} (
                {movedStopsStats.pnlSuccess ?? 0})
              </p>

              <p className="text-sm text-red-600">
                Overmanaged: {movedStopsStats.fail} ({movedStopsStats.pnlFail})
              </p>

              <p className="text-sm text-gray-500">
                Neutral: {movedStopsStats.neutral} ({movedStopsStats.pnlNeutral}
                )
              </p>

              <p className="text-sm">
                Quality: {(movedStopsStats.quality || 0).toFixed(1)}%
              </p>

              <p
                className={`text-sm font-medium ${
                  movedStopsStats.netImpact > 0
                    ? 'text-green-600'
                    : movedStopsStats.netImpact < 0
                      ? 'text-red-600'
                      : 'text-gray-500'
                }`}
              >
                Net Impact: {movedStopsStats.netImpact > 0 ? '+' : ''}
                {movedStopsStats.netImpact}
              </p>

              {/* 🔥 THE REAL TRUTH METRIC */}
              <p
                className={`text-sm font-semibold ${
                  movedStopsStats.pnlImpact > 0
                    ? 'text-green-600'
                    : movedStopsStats.pnlImpact < 0
                      ? 'text-red-600'
                      : 'text-gray-500'
                }`}
              >
                PnL Impact: {movedStopsStats.pnlImpact}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Total (incl. neutral): {movedStopsStats.totalPnL}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2">Mistake Breakdown</h3>

              {Object.entries(mistakeSummary).map(([type, count]) => (
                <div
                  key={type}
                  className="flex justify-between text-sm border-b py-1"
                >
                  <span>{type}</span>
                  <span>{count}</span>
                </div>
              ))}

              <p className="mt-2 text-red-600 font-semibold">
                Total Mistake Cost: {mistakeCost}
              </p>
            </div>
          </div>
        </div>

        {/* ===================== */}
        {/* BREAKDOWN SECTION */}
        {/* ===================== */}

        <div className="bg-white rounded-2xl shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold">Breakdown</h2>

          {/* SESSION */}
          <div>
            <h3 className="font-semibold mb-2">By Session</h3>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              {sessionGroups.map((g) => (
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
              {typeGroups.map((g) => (
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
              {emotionGroups.map((g) => (
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
              {scoreGroups.map((g) => (
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
              {pairGroups.map((g) => (
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
              {weekdayGroups.map((g) => (
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

        <div className="bg-white rounded-2xl shadow p-6 space-y-10">
          <h2 className="text-xl font-semibold">Charts</h2>

          {/* EQUITY CURVE */}
          <div>
            <h3 className="font-semibold mb-2">Equity Curve</h3>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />

                {/* 🔥 CUSTOM TOOLTIP */}
                <Tooltip content={<CustomTooltip />} />

                {/* ONLY equity line */}
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#000"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* WEEKDAY PNL */}
          <div>
            <h3 className="font-semibold mb-2">PnL by Day of Week</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekdayChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />

                {/* 🔥 IMPORTANT FIX FOR NEGATIVE VALUES */}
                <YAxis domain={['auto', 'auto']} />

                <Tooltip />
                <Bar dataKey="pnl" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* TRADE TYPE */}
          <div>
            <h3 className="font-semibold mb-2">PnL by Trade Type</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pnl" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* SESSION */}
          <div>
            <h3 className="font-semibold mb-2">PnL by Session</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sessionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pnl" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* PAIR */}
          <div>
            <h3 className="font-semibold mb-2">PnL by Pair</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pairChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />

                <YAxis domain={[0, 100]} />

                <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                <Bar dataKey="winRate" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* EMOTION */}
          <div>
            <h3 className="font-semibold mb-2">PnL by Emotion</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={emotionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pnl" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white p-6 rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100 text-left">
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
              {displayTrades.map((t, i) => (
                <tr key={i} className="text-center">
                  <td className="border p-2 font-semibold">{t.tradeNo}</td>
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
                          : 'text-gray-500'
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
                          : 'text-gray-500'
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
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="border p-2">
                    {!t.movedStops ? (
                      '-'
                    ) : String(t.movedStopsWorked) === 'PROTECTED' ? (
                      <span className="text-green-600 font-medium">
                        Protected
                      </span>
                    ) : t.movedStopsWorked === 'OVERMANAGED' ? (
                      <span className="text-red-600 font-medium">
                        Overmanaged
                      </span>
                    ) : t.movedStopsWorked === 'IRRELEVANT' ? (
                      <span className="text-gray-500">Neutral</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="border p-2 text-xs text-left">
                    {t.mistakes.filter((m) => m.category === 'behavioral')
                      .length > 0 ? (
                      <div className="space-y-1 text-left">
                        {t.mistakes
                          .filter((m) => m.category === 'behavioral')
                          .map((m, i) => (
                            <div
                              key={i}
                              className={
                                m.severity === 'high'
                                  ? 'text-red-600'
                                  : m.severity === 'medium'
                                    ? 'text-orange-500'
                                    : 'text-yellow-600'
                              }
                            >
                              • {m.type}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
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
                className="text-gray-400 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
