"use client";

import { useState, useEffect, useRef, useMemo } from "react";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ResponsiveContainer } from "recharts";

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

type Trade = {
  date: string;
  entryTime: string;
  exitTime: string;
  session: string;
  direction: string;
  type: string;
  result: string;
  risk: string;
  amount: string;
  checklist: Checklist;
  checklistScore: number;
  suggestedRisk: string;
  remarks: string;
  feeling: string;
};

type Mistake = {
  type: string;
  severity: "low" | "medium" | "high";
  category: "behavioral" | "checklist";
};

// =====================
// DUMMY DATA (NEWEST FIRST)
// =====================
const dummyTrades: Trade[] = [
  {
    date: "2026-04-03",
    entryTime: "10:00",
    exitTime: "10:30",
    session: "NYAM",
    direction: "Sell",
    type: "Scalp",
    result: "Loss",
    risk: "1%",
    amount: "-300",
    checklist: {} as Checklist,
    checklistScore: 4,
    suggestedRisk: "0%",
    remarks: "Bad trade",
    feeling: "Anxious",
  },
  {
    date: "2026-04-02",
    entryTime: "20:30",
    exitTime: "21:10",
    session: "Asia",
    direction: "Buy",
    type: "Day Trade",
    result: "Win",
    risk: "1%",
    amount: "200",
    checklist: {} as Checklist,
    checklistScore: 8,
    suggestedRisk: "1%",
    remarks: "HTF alignment",
    feeling: "Calm",
  },
  {
    date: "2026-04-01",
    entryTime: "08:15",
    exitTime: "08:45",
    session: "NYAM",
    direction: "Buy",
    type: "Scalp",
    result: "Win",
    risk: "1%",
    amount: "120",
    checklist: {} as Checklist,
    checklistScore: 7,
    suggestedRisk: "1%",
    remarks: "Clean break",
    feeling: "Calm",
  },
  {
    date: "2026-04-01",
    entryTime: "03:10",
    exitTime: "03:30",
    session: "London",
    direction: "Sell",
    type: "Scalp",
    result: "Loss",
    risk: "0.5%",
    amount: "-60",
    checklist: {} as Checklist,
    checklistScore: 5,
    suggestedRisk: "0%",
    remarks: "Chased entry",
    feeling: "Anxious",
  },
];

const createDefaultTrade = (): Trade => ({
  date: "",
  entryTime: "",
  exitTime: "",
  session: "",
  direction: "Buy",
  type: "Scalp",
  result: "Win",
  risk: "",
  amount: "",
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
  suggestedRisk: "0%",
  remarks: "",
  feeling: "Calm",
});

export default function Home() {
  const [trade, setTrade] = useState<Trade>(createDefaultTrade());
  const [trades, setTrades] = useState<Trade[]>([]);

  // FILTERS
  const [filters, setFilters] = useState({
    session: "All",
    result: "All",
    feeling: "All",
    minScore: 0,
    startDate: "",
    endDate: "",
  });

  const didLoad = useRef(false);

  // LOAD DATA (runs once only)
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    const saved = localStorage.getItem("trades");

    if (saved) {
      const parsed: Trade[] = JSON.parse(saved);

      // REMOVE duplicates safely
      const uniqueTrades = Array.from(new Map(parsed.map((t) => [`${t.date}-${t.entryTime}-${t.amount}`, t])).values());

      setTrades(uniqueTrades);
    } else {
      setTrades(dummyTrades);
    }
  }, []);

  // SAVE DATA
  useEffect(() => {
    localStorage.setItem("trades", JSON.stringify(trades));
  }, [trades]);

  // SESSION LOGIC
  const getSession = (time: string) => {
    if (!time) return "";
    const hour = parseInt(time.split(":")[0]);

    if (hour >= 20) return "Asia";
    if (hour >= 2 && hour <= 5) return "London";
    if (hour >= 7 && hour <= 10) return "NYAM";

    return "Out of KZ";
  };

  // CHECKLIST SCORE
  const calculateChecklist = (checklist: Checklist) => {
    const score = Object.values(checklist).filter(Boolean).length;

    let risk = "0%";
    if (score >= 8) risk = "1%";
    else if (score === 7) risk = "0.5%";

    return { score, risk };
  };

  const checklistRules: Record<keyof Checklist, { type: string; severity: Mistake["severity"] }> = {
    bias: { type: "No daily bias", severity: "high" },
    timeframeAlignment: { type: "No timeframe alignment", severity: "high" },
    sessionProfile: { type: "No session profile", severity: "medium" },
    pdArray: { type: "No PD Array context", severity: "medium" },
    cisd: { type: "No CISD confirmation", severity: "medium" },
    strongHL: { type: "Weak high/low", severity: "medium" },
    news: { type: "Ignored news", severity: "medium" },
    killzone: { type: "Outside killzone", severity: "medium" },
    smt: { type: "No SMT confirmation", severity: "low" },
  };

  // DETECT MISTAKES
  const detectMistakes = (t: Trade): Mistake[] => {
    const mistakes: Mistake[] = [];

    // ===== CHECKLIST (ONLY penalize on losses) =====
    if (t.result === "Loss") {
      (Object.keys(checklistRules) as (keyof Checklist)[]).forEach((key) => {
        if (!t.checklist[key]) {
          const rule = checklistRules[key];

          mistakes.push({
            type: rule.type,
            severity: rule.severity,
            category: "checklist",
          });
        }
      });
    }

    // ===== QUALITY =====
    if (t.checklistScore <= 6) {
      mistakes.push({
        type: "Low score trade",
        severity: "high",
        category: "behavioral",
      });
    }

    if (t.result === "Loss" && t.checklistScore <= 7) {
      mistakes.push({
        type: "Low quality loss",
        severity: "medium",
        category: "behavioral",
      });
    }

    // ===== BEHAVIOR =====
    if (t.feeling === "Anxious") {
      mistakes.push({
        type: "Emotional trading (anxious)",
        severity: "medium",
        category: "behavioral",
      });
    }

    const riskValue = Number((t.risk || "").replace("%", ""));

    if (riskValue > 1) {
      mistakes.push({
        type: "Over risk (>1%)",
        severity: "high",
        category: "behavioral",
      });
    }

    if (t.session === "Out of KZ") {
      mistakes.push({
        type: "Outside session",
        severity: "medium",
        category: "behavioral",
      });
    }

    return mistakes;
  };

  // FILTERED DATA
  const processedTrades = useMemo(() => {
    return [...trades].filter((t) => {
      if (filters.session !== "All" && t.session !== filters.session) return false;
      if (filters.result !== "All" && t.result !== filters.result) return false;
      if (filters.feeling !== "All" && t.feeling !== filters.feeling) return false;

      // ✅ DATE FILTER
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;

      return true;
    });
  }, [trades, filters]);

  const sortedTrades = useMemo(() => {
    return [...processedTrades].sort((a, b) => {
      return new Date(`${b.date}T${b.entryTime}`).getTime() - new Date(`${a.date}T${a.entryTime}`).getTime();
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

  const mistakeSummary = useMemo(() => {
    return displayTrades.reduce((acc, t) => {
      t.mistakes.forEach((m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
  }, [displayTrades]);

  const mistakeCost = useMemo(() => {
    return displayTrades.reduce((sum, t) => {
      if (t.result === "Loss" && t.mistakes.length > 0) {
        return sum + Math.abs(Number(t.amount || 0));
      }
      return sum;
    }, 0);
  }, [displayTrades]);

  // =====================
  // REUSABLE STATS FUNCTION
  // =====================
  const getStats = (data: Trade[]) => {
    const wins = data.filter((t) => t.result === "Win");
    const losses = data.filter((t) => t.result === "Loss");

    const winCount = wins.length;
    const lossCount = losses.length;
    const totalTrades = winCount + lossCount;

    const totalPnL = data.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const avgWin = winCount > 0 ? wins.reduce((sum, t) => sum + Number(t.amount), 0) / winCount : 0;

    const avgLoss = lossCount > 0 ? losses.reduce((sum, t) => sum + Number(t.amount), 0) / lossCount : 0;

    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    const totalWinsAmount = wins.reduce((sum, t) => sum + Number(t.amount), 0);

    const totalLossAmount = Math.abs(losses.reduce((sum, t) => sum + Number(t.amount), 0));

    const profitFactor = totalLossAmount > 0 ? totalWinsAmount / totalLossAmount : 0;

    const expectancy = totalTrades > 0 ? (winRate / 100) * avgWin + ((100 - winRate) / 100) * avgLoss : 0;

    return {
      trades: data.length,
      winRate,
      totalPnL,
      profitFactor,
      expectancy,
    };
  };

  // =====================
  // GROUPING
  // =====================

  // By Session
  const sessionGroups = ["Asia", "London", "NYAM", "Out of KZ"].map((session) => ({
    label: session,
    stats: getStats(displayTrades.filter((t) => t.session === session)),
  }));

  // By Emotion
  const emotionGroups = ["Calm", "Anxious"].map((feeling) => ({
    label: feeling,
    stats: getStats(displayTrades.filter((t) => t.feeling === feeling)),
  }));

  // By Checklist Score
  const scoreGroups = [
    {
      label: "High (8-9)",
      stats: getStats(displayTrades.filter((t) => t.checklistScore >= 8)),
    },
    {
      label: "Mid (7)",
      stats: getStats(displayTrades.filter((t) => t.checklistScore === 7)),
    },
    {
      label: "Low (≤6)",
      stats: getStats(displayTrades.filter((t) => t.checklistScore <= 6)),
    },
  ];

  const equitySource = useMemo(() => {
    return [...processedTrades].sort((a, b) => {
      return new Date(`${a.date}T${a.entryTime}`).getTime() - new Date(`${b.date}T${b.entryTime}`).getTime();
    });
  }, [processedTrades]);

  const equityData = equitySource.reduce((acc: any[], t, index) => {
    const prev = acc[index - 1]?.equity ?? 0;
    const pnl = Number(t.amount || 0);

    acc.push({
      index: index + 1,
      equity: prev + pnl,
      pnl,
    });

    return acc;
  }, []);

  const sessionChartData = sessionGroups.map((s) => ({
    name: s.label,
    pnl: s.stats.totalPnL,
  }));

  const emotionChartData = emotionGroups.map((e) => ({
    name: e.label,
    pnl: e.stats.totalPnL,
  }));

  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const getWeekday = (dateStr: string) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    return weekdayNames[date.getDay()];
  };

  const weekdayGroups = weekdayNames.map((day) => ({
    label: day,
    stats: getStats(displayTrades.filter((t) => getWeekday(t.date) === day)),
  }));

  const typeGroups = ["Scalp", "Day Trade", "Swing"].map((type) => ({
    label: type,
    stats: getStats(displayTrades.filter((t) => t.type === type)),
  }));

  // =====================
  // ANALYTICS
  // =====================
  const wins = displayTrades.filter((t) => t.result === "Win");
  const losses = displayTrades.filter((t) => t.result === "Loss");
  const breakevens = displayTrades.filter((t) => t.result === "Breakeven");

  const winCount = wins.length;
  const lossCount = losses.length;
  const totalTrades = winCount + lossCount; // exclude BE

  const totalPnL = displayTrades.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const avgWin = winCount > 0 ? wins.reduce((sum, t) => sum + Number(t.amount), 0) / winCount : 0;

  const avgLoss = lossCount > 0 ? losses.reduce((sum, t) => sum + Number(t.amount), 0) / lossCount : 0;

  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  const weekdayChartData = weekdayGroups.map((d) => ({
    name: d.label,
    pnl: d.stats.totalPnL,
  }));

  const typeChartData = typeGroups.map((t) => ({
    name: t.label,
    pnl: t.stats.totalPnL,
  }));

  // Profit Factor = total wins / total losses (absolute)
  const totalWinsAmount = wins.reduce((sum, t) => sum + Number(t.amount), 0);

  const totalLossAmount = Math.abs(losses.reduce((sum, t) => sum + Number(t.amount), 0));

  const profitFactor = totalLossAmount > 0 ? totalWinsAmount / totalLossAmount : 0;

  // Expectancy
  const expectancy = totalTrades > 0 ? (winRate / 100) * avgWin + ((100 - winRate) / 100) * avgLoss : 0;
  // INPUT HANDLER
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const updated = { ...trade, [e.target.name]: e.target.value };

    if (e.target.name === "entryTime") {
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!trade.date || !trade.entryTime || !trade.exitTime || !trade.amount || !trade.risk) {
      alert("Please fill all required fields");
      return;
    }

    const rawAmount = Number(trade.amount || 0);

    let normalizedAmount = rawAmount;

    if (trade.result === "Loss") {
      normalizedAmount = -Math.abs(rawAmount);
    } else if (trade.result === "Win") {
      normalizedAmount = Math.abs(rawAmount);
    }

    // optional: breakeven = 0
    if (trade.result === "Breakeven") {
      normalizedAmount = 0;
    }

    const finalTrade = {
      ...trade,
      amount: String(normalizedAmount),
    };

    setTrades((prev) => [...prev, finalTrade]);
    setTrade(createDefaultTrade());
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
              <input type="date" name="date" value={trade.date} onChange={handleChange} className="border p-2 rounded-lg" required />

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

            {/* SESSION DISPLAY */}
            <p className="text-sm text-gray-600">
              Session: <span className="font-medium">{trade.session}</span>
            </p>

            {/* TRADE STRUCTURE */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select name="direction" value={trade.direction} onChange={handleChange} className="border p-2 rounded-lg">
                <option>Buy</option>
                <option>Sell</option>
              </select>

              <select name="type" value={trade.type} onChange={handleChange} className="border p-2 rounded-lg">
                <option>Scalp</option>
                <option>Day Trade</option>
                <option>Swing</option>
              </select>

              <select name="result" value={trade.result} onChange={handleChange} className="border p-2 rounded-lg">
                <option>Win</option>
                <option>Loss</option>
                <option>Breakeven</option>
              </select>

              <select name="feeling" value={trade.feeling} onChange={handleChange} className="border p-2 rounded-lg">
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
              <h3 className="font-semibold mb-2">Checklist</h3>

              <div className="flex flex-col gap-2">
                {Object.entries({
                  bias: "Daily bias clear",
                  timeframeAlignment: "Timeframe Alignment",
                  sessionProfile: "Session Profiles",
                  pdArray: "H1 PD Arrays",
                  cisd: "M5 CISD",
                  strongHL: "Strong High/Low",
                  news: "News",
                  killzone: "Killzone",
                  smt: "SMT",
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
                Score: {trade.checklistScore}/9 | Suggested Risk: <span className="font-semibold text-blue-600">{trade.suggestedRisk}</span>
              </div>
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
            <button type="submit" className="w-full bg-black text-white py-2 rounded-xl hover:opacity-90">
              Add Trade
            </button>
          </form>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-2xl shadow flex gap-2 flex-wrap">
          <select onChange={(e) => setFilters({ ...filters, session: e.target.value })}>
            <option value="All">All Sessions</option>
            <option>Asia</option>
            <option>London</option>
            <option>NYAM</option>
            <option>Out of KZ</option>
          </select>

          <select onChange={(e) => setFilters({ ...filters, result: e.target.value })}>
            <option value="All">All Results</option>
            <option>Win</option>
            <option>Loss</option>
            <option>Breakeven</option>
          </select>

          <select onChange={(e) => setFilters({ ...filters, feeling: e.target.value })}>
            <option value="All">All Emotions</option>
            <option>Calm</option>
            <option>Anxious</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="border p-2 rounded"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="border p-2 rounded"
          />

          <button
            onClick={() =>
              setFilters({
                session: "All",
                result: "All",
                feeling: "All",
                minScore: 0,
                startDate: "",
                endDate: "",
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
              <p className={`text-lg font-semibold ${totalPnL > 0 ? "text-green-600" : totalPnL < 0 ? "text-red-600" : ""}`}>{totalPnL}</p>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-gray-500">Avg Win</p>
              <p className="text-lg font-semibold text-green-600">{avgWin.toFixed(2)}</p>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-gray-500">Avg Loss</p>
              <p className="text-lg font-semibold text-red-600">{avgLoss.toFixed(2)}</p>
            </div>

            <div className="p-3 border rounded-lg relative group">
              <p className="text-gray-500 flex items-center gap-1">
                Profit Factor
                {/* INFO ICON */}
                <span className="cursor-pointer text-gray-400 hover:text-black">ℹ️</span>
              </p>

              <p
                className={`text-lg font-semibold ${
                  profitFactor > 1.5 ? "text-green-600" : profitFactor < 1 ? "text-red-600" : "text-yellow-600"
                }`}
              >
                {profitFactor.toFixed(2)}
              </p>

              {/* TOOLTIP */}
              <div className="absolute z-10 hidden group-hover:block w-72 p-3 text-xs text-white bg-black rounded-lg shadow-lg top-full mt-2 left-0">
                <p className="font-semibold mb-1">⚠️ Important</p>

                <p className="mb-2">Profit Factor = Total Wins ÷ Total Losses</p>

                <p className="mb-1">Interpretation:</p>
                <ul className="list-disc ml-4 space-y-1 mb-2">
                  <li>Below 1.0 → Losing system</li>
                  <li>1.0 – 1.5 → Weak edge</li>
                  <li>1.5 – 2.0 → Solid</li>
                  <li>Above 2.0 → Strong edge</li>
                </ul>

                <p className="text-gray-300">⚠️ High profit factor with low sample size can be misleading</p>
              </div>
            </div>

            <div className="p-3 border rounded-lg relative group">
              <p className="text-gray-500 flex items-center gap-1">
                Expectancy
                {/* INFO ICON */}
                <span className="cursor-pointer text-gray-400 hover:text-black">ℹ️</span>
              </p>

              <p className={`text-lg font-semibold ${expectancy > 0 ? "text-green-600" : expectancy < 0 ? "text-red-600" : ""}`}>
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

            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2">Mistake Breakdown</h3>

              {Object.entries(mistakeSummary).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm border-b py-1">
                  <span>{type}</span>
                  <span>{count}</span>
                </div>
              ))}

              <p className="mt-2 text-red-600 font-semibold">Total Mistake Cost: {mistakeCost}</p>
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
                <Tooltip />
                <Line type="monotone" dataKey="equity" stroke="#000" />
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
                <YAxis domain={["auto", "auto"]} />

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
                <th className="border p-2">Direction</th>
                <th className="border p-2">Type</th>
                <th className="border p-2">Result</th>
                <th className="border p-2">Risk %</th>
                <th className="border p-2">PnL</th>
                <th className="border p-2">Score</th>
                <th className="border p-2">Suggested Risk</th>
                <th className="border p-2">Feeling</th>
                <th className="border p-2">Mistakes</th>
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
                  <td className="border p-2">{t.direction}</td>
                  <td className="border p-2">{t.type}</td>

                  <td
                    className={`border p-2 font-medium ${
                      t.result === "Win" ? "text-green-600" : t.result === "Loss" ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {t.result}
                  </td>

                  <td className="border p-2">{t.risk}</td>

                  <td
                    className={`border p-2 ${
                      Number(t.amount) > 0 ? "text-green-600" : Number(t.amount) < 0 ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {t.amount}
                  </td>

                  <td className="border p-2">{t.checklistScore}</td>

                  <td className="border p-2 text-blue-600 font-semibold">{t.suggestedRisk}</td>

                  <td className="border p-2">{t.feeling}</td>
                  <td className="border p-2 text-xs text-left">
                    {t.mistakes.filter((m) => m.category === "behavioral").length > 0 ? (
                      <div className="space-y-1 text-left">
                        {t.mistakes
                          .filter((m) => m.category === "behavioral")
                          .map((m, i) => (
                            <div
                              key={i}
                              className={
                                m.severity === "high" ? "text-red-600" : m.severity === "medium" ? "text-orange-500" : "text-yellow-600"
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
