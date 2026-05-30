import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { useState, useEffect } from 'react';
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

  const latestPnL = data?.length ? data[data.length - 1].balance : 0;
  const isProfit = latestPnL >= 0;

  const pnlColor = isProfit ? '#22c55e' : '#ef4444';

  const [animatedPnL, setAnimatedPnL] = useState(0);

  useEffect(() => {
    if (!data?.length) return;

    const latest = data[data.length - 1].balance;

    let frame: number;

    const animate = () => {
      setAnimatedPnL((prev) => {
        const diff = latest - prev;
        return prev + diff * 0.15; // easing factor (higher = snappier)
      });

      frame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(frame);
  }, [data]);

  const values = data.map((d) => Number(d.balance));

  const min = Math.min(...values);
  const max = Math.max(...values);

  // padding so line doesn’t hug edges
  const padding = (max - min) * 0.3 || 1;

  const domainMin = Math.min(min, 0) - padding;
  const domainMax = Math.max(max, 0) + padding;

  useEffect(() => {
    console.log(
      'container size check',
      document.querySelector('.recharts-responsive-container')
    );
  }, []);

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
      <CardHeader className="flex flex-col items-start">
        <CardTitle>Equity Curve</CardTitle>

        <p className="text-sm flex gap-2">
          <span className="text-muted-foreground">Current PnL:</span>
          <span className={isProfit ? 'text-green-500' : 'text-red-500'}>
            ${latestPnL.toFixed(2)}
          </span>
        </p>
      </CardHeader>

      <CardContent className="min-w-0 h-[360px]">
        <div className="relative w-full h-[360px]">
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
                stroke={pnlColor}
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, index, payload } = props;
                  const isLast = index === data.length - 1;

                  if (!isLast) return null;

                  return (
                    <g>
                      {/* glow */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill={pnlColor}
                        opacity={0.15}
                      />

                      {/* main dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={pnlColor}
                        stroke={isDark ? '#111827' : '#ffffff'}
                        strokeWidth={2}
                      />
                    </g>
                  );
                }}
              />
              <ReferenceLine
                y={latestPnL}
                stroke={pnlColor}
                strokeDasharray="4 4"
                label={{
                  value: `${animatedPnL.toFixed(0)}`,
                  position: 'left',
                  fill: pnlColor,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              />
              <ReferenceLine
                y={0}
                stroke={isDark ? '#374151' : '#d1d5db'}
                label={{
                  value: `0`,
                  position: 'left',
                  fill: colors.text,
                  fontSize: 12,
                }}
              />
              <ReferenceArea
                y1={0}
                y2={latestPnL}
                fill={isProfit ? '#22c55e' : '#ef4444'}
                fillOpacity={0.08}
              />

              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />

              <XAxis
                dataKey="index"
                tick={{ fill: colors.text, fontSize: 12 }}
              />

              <YAxis
                tick={{ fill: colors.text, fontSize: 12 }}
                domain={[domainMin, domainMax]}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
