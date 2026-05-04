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
import { ChartEmptyState } from '@/components/ui/ChartEmptyState';
import { ChartLoadingState } from '@/components/ui/ChartLoadingState';

import { useTheme } from 'next-themes';

type EquityChartProps = {
  data?: any[];
  isLoading?: boolean;
};

export function EquityChart({
  data = [],
  isLoading = false,
}: EquityChartProps) {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  const colors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#1f2937' : '#e5e7eb',
    tooltipBg: isDark ? '#111827' : '#ffffff',
    tooltipText: isDark ? '#f9fafb' : '#111827',
    line: isDark ? '#60a5fa' : '#2563eb',
    bar: isDark ? '#34d399' : '#10b981',
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartLoadingState />
        </CardContent>
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartEmptyState title="Equity Curve" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>

      <CardContent className="min-w-0 h-[360px]">
        <div className="relative w-full h-[260px] md:h-[320px] lg:h-[360px] min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Tooltip
                content={<TradeTooltip />}
                isAnimationActive={false}
                wrapperStyle={{ zIndex: 50 }}
              />
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
