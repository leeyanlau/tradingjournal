import { TooltipProps } from 'recharts';
import { useTheme } from 'next-themes';

type TradePoint = {
  index: number;
  date: string;
  time?: string;
  pnl: number;
  balance: number;
  pair?: string;
  result?: string;
};

export function TradeTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload as TradePoint;

  return (
    <div
      className="rounded-lg text-xs p-3 shadow-lg space-y-1 min-w-[200px]"
      style={{
        backgroundColor: isDark ? '#111827' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
        border: '1px solid',
        borderColor: isDark ? '#374151' : '#e5e7eb',
      }}
    >
      {/* TRADE HEADER */}
      <div className="space-y-2">
        <p className="font-semibold">Trade #{data.index}</p>

        <p className="text-muted-foreground">
          {data.date}
          {data.time && <span> • {data.time}</span>}
        </p>
      </div>

      {/* PNL */}
      <div className="space-y-1 pt-1 border-t border-border">
        <p>
          <span className="text-muted-foreground">PnL:</span>{' '}
          <span className={data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
            {data.pnl > 0 ? '+' : ''}
            {data.pnl.toFixed(2)}
          </span>
        </p>

        {/* EQUITY */}
        <p>
          <span className="text-muted-foreground">Equity:</span>{' '}
          <span
            className={`font-bold text-base ${
              data.balance >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {data.balance > 0 ? '+' : ''}
            {data.balance.toFixed(2)}
          </span>
        </p>

        {/* EXTRA CONTEXT */}
        {data.pair && (
          <p>
            <span className="text-muted-foreground">Pair:</span> {data.pair}
          </p>
        )}

        {data.result && (
          <p>
            <span className="text-muted-foreground">Result:</span>{' '}
            <span
              className={
                data.result === 'Win'
                  ? 'text-green-400'
                  : data.result === 'Loss'
                    ? 'text-red-400'
                    : 'text-gray-400'
              }
            >
              {data.result}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
