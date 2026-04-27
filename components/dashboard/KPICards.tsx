import { Card } from '@/components/ui/card';

export default function KPICards({ stats }: any) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Win Rate</p>
        <p className="text-xl font-semibold">{stats.winRate?.toFixed(1)}%</p>
      </Card>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground">PnL</p>
        <p className="text-xl font-semibold">{stats.totalPnL}</p>
      </Card>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Profit Factor</p>
        <p className="text-xl font-semibold">
          {stats.profitFactor?.toFixed(2)}
        </p>
      </Card>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Expectancy</p>
        <p className="text-xl font-semibold">{stats.expectancy?.toFixed(2)}</p>
      </Card>
    </div>
  );
}
