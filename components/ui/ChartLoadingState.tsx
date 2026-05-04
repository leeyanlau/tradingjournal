export function ChartLoadingState() {
  return (
    <div className="h-[320px] w-full animate-pulse border border-border rounded-xl bg-muted/10">
      <div className="h-full w-full flex flex-col justify-between p-4">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="flex-1 flex items-end gap-2">
          <div className="h-20 w-6 bg-muted rounded" />
          <div className="h-32 w-6 bg-muted rounded" />
          <div className="h-24 w-6 bg-muted rounded" />
          <div className="h-40 w-6 bg-muted rounded" />
          <div className="h-28 w-6 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
