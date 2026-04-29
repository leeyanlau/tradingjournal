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

import { useTheme } from 'next-themes';

export function EquityChart({ data }: { data: any[] }) {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  const colors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltipBg: isDark ? '#111827' : '#ffffff',
    tooltipText: isDark ? '#f9fafb' : '#111827',
    line: isDark ? '#374151' : '#374151',
    bar: isDark ? '#34d399' : '#10b981',
  };
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Tooltip content={<TradeTooltip />} isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="balance"
                stroke={colors.line}
                strokeWidth={1.5}
                dot={false}
              />
              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />

              <XAxis
                dataKey="index"
                tick={{ fill: colors.text, fontSize: 12 }}
              />

              <YAxis tick={{ fill: colors.text, fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
