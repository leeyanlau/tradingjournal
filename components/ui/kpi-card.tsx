import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

type Props = {
  label: string;
  value: string | number;
  tooltip?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
};

export function KpiCard({ label, value, tooltip, trend }: Props) {
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-muted-foreground';
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-1">
          <p className="text-xs text-muted-foreground">{label}</p>

          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-foreground" />
                </TooltipTrigger>

                <TooltipContent
                  side="top"
                  align="start"
                  className="w-[280px] text-xs leading-relaxed whitespace-normal break-words"
                >
                  <div className="flex flex-col gap-1">{tooltip}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <p className={`text-2xl font-semibold tabular-nums ${trendColor}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
