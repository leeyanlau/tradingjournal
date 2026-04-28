import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsTooltip } from '@/components/charts/AnalyticsTooltip';

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
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<AnalyticsTooltip />} />
              <Bar dataKey="pnl" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
