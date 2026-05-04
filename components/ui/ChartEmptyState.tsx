export function ChartEmptyState({ title }: { title: string }) {
  return (
    <div className="h-[320px] w-full flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl bg-muted/20">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">
        No data available yet
      </p>
    </div>
  );
}
