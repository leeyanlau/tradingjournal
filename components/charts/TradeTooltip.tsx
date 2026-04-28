import { TooltipProps } from 'recharts';

export function TradeTooltip({
  active,
  payload,
  label,
}: TooltipProps<any, any>) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;

  return (
    <div className="rounded-lg bg-black text-white text-xs p-3 shadow-lg space-y-1 min-w-[180px]">
      <p className="font-semibold">Trade #{data.index}</p>
      <p className="font-semibold">
        {data?.date} {data?.time ? `• ${data.time}` : ''}
      </p>

      <p>
        <span className="text-gray-300">PnL:</span>{' '}
        <span className={data?.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
          {data?.pnl}
        </span>
      </p>

      {data?.balance !== undefined && (
        <p>
          <span className="text-gray-300">Equity:</span>{' '}
          <span className="font-bold">{data.balance}</span>
        </p>
      )}

      {data?.pair && (
        <p>
          <span className="text-gray-300">Pair:</span> {data.pair}
        </p>
      )}

      {data?.result && (
        <p>
          <span className="text-gray-300">Result:</span> {data.result}
        </p>
      )}
    </div>
  );
}
