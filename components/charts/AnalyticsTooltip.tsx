import { TooltipProps } from 'recharts';

export function AnalyticsTooltip(props: any) {
  const { active, payload, label } = props;

  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;

  return (
    <div className="bg-black text-white p-3 rounded-lg text-xs space-y-1 min-w-[180px]">
      <p className="font-semibold">{label}</p>

      <p>
        PnL:{' '}
        <span className={data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
          {data.pnl}
        </span>
      </p>

      {data.winRate !== undefined && (
        <p>Win Rate: {data.winRate.toFixed(1)}%</p>
      )}

      {data.trades !== undefined && <p>Trades: {data.trades}</p>}
    </div>
  );
}
