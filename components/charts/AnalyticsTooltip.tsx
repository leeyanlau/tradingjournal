import { TooltipProps } from 'recharts';
import { useTheme } from 'next-themes';

type ValueType = number;
type NameType = string;

type AnalyticsTooltipProps = TooltipProps<ValueType, NameType> & {
  payload?: any[];
  label?: string;
};

export function AnalyticsTooltip({
  active,
  payload,
  label,
}: AnalyticsTooltipProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload as {
    pnl: number;
    winRate?: number;
    trades?: number;
  };

  return (
    <div
      className="rounded-lg text-xs p-3 shadow-lg space-y-1 min-w-[180px]"
      style={{
        backgroundColor: isDark ? '#111827' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
        border: '1px solid',
        borderColor: isDark ? '#374151' : '#e5e7eb',
      }}
    >
      <p className="font-semibold">{label}</p>

      <p>
        <span className="text-muted-foreground">PnL:</span>{' '}
        <span className={data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
          {data.pnl > 0 ? '+' : ''}
          {data.pnl.toFixed(2)}
        </span>
      </p>

      {data.winRate !== undefined && (
        <p>
          <span className="text-muted-foreground">Win Rate:</span>{' '}
          {data.winRate.toFixed(1)}%
        </p>
      )}

      {data.trades !== undefined && (
        <p>
          <span className="text-muted-foreground">Trades:</span> {data.trades}
        </p>
      )}
    </div>
  );
}
