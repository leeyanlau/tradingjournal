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
  label: string;
  value: string | number;
  tooltip?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
};

export function KpiCard({ label, value, tooltip, trend, size = 'md' }: Props) {
  const trendColor =
    trend === 'up'
      ? 'text-green-500'
      : trend === 'down'
        ? 'text-red-500'
        : 'text-muted-foreground';
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  return (
    <Card className="rounded-2xl">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{label}</CardTitle>

          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-foreground" />
                </TooltipTrigger>

                <TooltipContent className="w-[280px] text-xs leading-relaxed">
                  <div className="flex flex-col gap-1">
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
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-1">
        <p className={`${metricValueClass} ${trendColor}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
