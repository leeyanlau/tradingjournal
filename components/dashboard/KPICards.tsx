import { KpiCard } from '@/components/ui/kpi-card';

type Props = {
  stats: {
    winRate?: number;
    totalPnL: number;
    profitFactor?: number;
    expectancy?: number;
    avgWin?: number;
    avgLoss?: number;
    largestWin?: number;
    largestLoss?: number;
    avgTradesPerDay?: number;
  };

  breakdown: {
    winCount: number;
    lossCount: number;
    breakevenCount: number;
  };
};

export default function KPICards({ stats, breakdown }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Total PnL"
        value={stats.totalPnL}
        trend={
          stats.totalPnL > 0 ? 'up' : stats.totalPnL < 0 ? 'down' : 'neutral'
        }
      />
      <KpiCard
        label="Win Rate"
        value={stats.winRate != null ? `${stats.winRate.toFixed(1)}%` : '-'}
        tooltip={
          <>
            <p className="font-semibold mb-1">Win Rate Method</p>

            <p>
              Includes <b>breakeven trades</b> in total count.
            </p>

            <p className="mt-2 font-medium">Formula:</p>
            <p>Wins ÷ (Wins + Losses + Breakevens)</p>

            <p className="mt-2 font-medium">Breakdown:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Wins: {breakdown.winCount}</li>
              <li>Losses: {breakdown.lossCount}</li>
              <li>Breakeven: {breakdown.breakevenCount}</li>
            </ul>

            <p className="text-muted-foreground mt-2">
              Some traders exclude breakevens, but this method keeps
              consistency.
            </p>
          </>
        }
        trend={
          stats.winRate != null
            ? stats.winRate >= 50
              ? 'up'
              : 'down'
            : 'neutral'
        }
        size="lg"
      />

      <KpiCard
        label="Profit Factor"
        value={stats.profitFactor != null ? stats.profitFactor.toFixed(2) : '-'}
        tooltip={
          <>
            <p className="font-semibold mb-1">Profit Factor</p>

            <p>Total Wins ÷ Total Losses</p>

            <p className="mt-2 font-medium">Interpretation:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Below 1.0 → Losing system</li>
              <li>1.0 – 1.5 → Weak edge</li>
              <li>1.5 – 2.0 → Solid</li>
              <li>Above 2.0 → Strong edge</li>
            </ul>

            <p className="text-muted-foreground mt-2">
              High PF with low sample size can be misleading.
            </p>
          </>
        }
        trend={
          stats.profitFactor != null
            ? stats.profitFactor > 1.5
              ? 'up'
              : stats.profitFactor < 1
                ? 'down'
                : 'neutral'
            : 'neutral'
        }
        size="lg"
      />
      <KpiCard
        label="Expectancy"
        value={stats.expectancy != null ? stats.expectancy.toFixed(2) : '-'}
        tooltip={
          <>
            <p className="font-semibold mb-1">Expectancy</p>

            <p>Average amount you expect to make or lose per trade.</p>

            <p className="mt-2 font-medium">Formula:</p>
            <p>(Win Rate × Avg Win) + (Loss Rate × Avg Loss)</p>

            <p className="mt-2 font-medium">How to read:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Above 0 → profitable</li>
              <li>Below 0 → losing</li>
              <li>Higher → stronger edge</li>
            </ul>

            <p className="text-muted-foreground mt-2">
              Expectancy matters more than win rate alone.
            </p>
          </>
        }
        trend={
          stats.expectancy != null
            ? stats.expectancy > 0
              ? 'up'
              : 'down'
            : 'neutral'
        }
        size="lg"
      />
      <KpiCard
        label="Avg Win"
        value={stats.avgWin != null ? `$${stats.avgWin.toFixed(2)}` : '-'}
        tooltip={
          <>
            <p className="font-semibold mb-1">Average Winning Trade</p>

            <p>Total profit divided by total winning trades.</p>

            <p className="mt-2 font-medium">Why it matters:</p>

            <ul className="list-disc ml-4 space-y-1">
              <li>Measures reward efficiency</li>
              <li>Improves expectancy analysis</li>
              <li>Helps evaluate trade quality</li>
            </ul>
          </>
        }
        trend={stats.avgWin != null && stats.avgWin > 0 ? 'up' : 'neutral'}
        size="lg"
      />
      <KpiCard
        label="Avg Loss"
        value={stats.avgLoss != null ? `-$${stats.avgLoss.toFixed(2)}` : '-'}
        tooltip={
          <>
            <p className="font-semibold mb-1">Average Losing Trade</p>

            <p>Average amount lost per losing trade.</p>

            <p className="mt-2 font-medium">Less loss is generally better.</p>
          </>
        }
        trend="down"
        size="lg"
      />
      <KpiCard
        label="Largest Win"
        value={
          stats.largestWin != null ? `$${stats.largestWin.toFixed(2)}` : '-'
        }
        tooltip={
          <>
            <p className="font-semibold mb-1">Largest Winning Trade</p>

            <p>Biggest single realized profit.</p>
          </>
        }
        trend="up"
        size="lg"
      />
      <KpiCard
        label="Largest Loss"
        value={
          stats.largestLoss != null ? `$${stats.largestLoss.toFixed(2)}` : '-'
        }
        tooltip={
          <>
            <p className="font-semibold mb-1">Largest Losing Trade</p>

            <p>Biggest single realized loss.</p>
          </>
        }
        trend="down"
        size="lg"
      />
      <KpiCard
        label="Avg Trades / Day"
        value={
          stats.avgTradesPerDay != null ? stats.avgTradesPerDay.toFixed(1) : '-'
        }
        tooltip={
          <>
            <p className="font-semibold mb-1">Average Trades Per Day</p>

            <p>Total trades divided by active trading days.</p>

            <p className="mt-2 font-medium">Used for:</p>

            <ul className="list-disc ml-4 space-y-1">
              <li>Overtrading detection</li>
              <li>Discipline tracking</li>
              <li>Behavioral analytics</li>
            </ul>
          </>
        }
        trend="neutral"
        size="lg"
      />
    </div>
  );
}
