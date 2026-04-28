import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeTooltip } from './TradeTooltip';

export function EquityChart({ data }: { data: any[] }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Tooltip content={<TradeTooltip />} />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#0f172a"
                strokeWidth={0.5}
                dot={false}
                activeDot={{ r: 2, stroke: '#0f172a', strokeWidth: 1 }}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickFormatter={(v) => `$${v}`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
