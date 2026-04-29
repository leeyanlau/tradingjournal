import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsTooltip } from '@/components/charts/AnalyticsTooltip';

import { useTheme } from 'next-themes';

type ChartData = {
  name: string;
  pnl: number;
  winRate?: number;
  trades?: number;
};

type Props = {
  title: string;
  data: ChartData[];
};

export function BaseBarChart({ title, data }: Props) {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  const colors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltipBg: isDark ? '#111827' : '#ffffff',
    tooltipText: isDark ? '#f9fafb' : '#111827',
    line: isDark ? '#60a5fa' : '#2563eb',
    bar: isDark ? '#34d399' : '#10b981',
  };
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              barCategoryGap="20%"
            >
              <defs>
                {/* GREEN GRADIENT */}
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                </linearGradient>

                {/* RED GRADIENT */}
                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />

              <XAxis dataKey="name" tick={{ fill: colors.text }} />
              <YAxis tick={{ fill: colors.text }} />
              <Tooltip
                content={<AnalyticsTooltip />}
                isAnimationActive={false}
              />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.pnl >= 0
                        ? 'url(#greenGradient)'
                        : 'url(#redGradient)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
