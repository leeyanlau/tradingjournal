import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { metricValueClass } from '@/components/ui/metricStyles';

type Props = {
  stats: {
    total: number;
    success: number;
    fail: number;
    neutral: number;
    quality: number;
    netImpact: number;
    pnlImpact: number;
  };
};

export function MovedStopsCard({ stats }: Props) {
  const impactColor =
    stats.pnlImpact > 0
      ? 'text-green-500'
      : stats.pnlImpact < 0
        ? 'text-red-500'
        : 'text-muted-foreground';

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Moved Stops Analysis</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 🔥 HEADLINE METRIC */}
        <div>
          <p className="text-sm text-muted-foreground">PnL Impact</p>
          <p className={`${metricValueClass} ${impactColor}`}>
            {stats.pnlImpact > 0 ? '+' : ''}
            {stats.pnlImpact}
          </p>
        </div>

        {/* 📊 QUALITY */}
        <TooltipProvider>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm text-muted-foreground">Execution Quality</p>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground" />
                </TooltipTrigger>

                <TooltipContent
                  side="top"
                  align="start"
                  className="w-[280px] text-xs leading-relaxed whitespace-normal break-words flex flex-col gap-1"
                >
                  <div className="flex flex-col">
                    <p className="font-semibold mb-2">Execution Quality</p>

                    <p className="mb-2">
                      Measures how effectively stop adjustments improved trade
                      outcomes.
                    </p>

                    <p className="mb-1 font-medium">Formula:</p>
                    <p className="mb-2">
                      Protected ÷ (Protected + Overmanaged)
                    </p>

                    <p className="mb-1 font-medium">Interpretation:</p>
                    <ul className="list-disc ml-4 space-y-1 mb-2">
                      <li>High % → good risk management</li>
                      <li>Low % → emotional adjustments</li>
                    </ul>

                    <p className="text-muted-foreground">
                      Neutral trades are excluded because they do not reflect
                      decision quality.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            <p className="text-xl font-semibold">{stats.quality.toFixed(1)}%</p>
          </div>
        </TooltipProvider>

        {/* 📉 BREAKDOWN */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-green-600 font-semibold">{stats.success}</p>
            <p className="text-xs text-muted-foreground">Protected</p>
          </div>

          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-red-600 font-semibold">{stats.fail}</p>
            <p className="text-xs text-muted-foreground">Overmanaged</p>
          </div>

          <div className="bg-gray-100 rounded-lg p-2 text-center">
            <p className="font-semibold">{stats.neutral}</p>
            <p className="text-xs text-muted-foreground">Neutral</p>
          </div>
        </div>

        {/* 🧠 CONTEXT */}
        <p className="text-xs text-muted-foreground">
          Based on {stats.total} trades where stops were adjusted
        </p>
      </CardContent>
    </Card>
  );
}
