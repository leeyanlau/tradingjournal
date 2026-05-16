export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);

  // localStorage load/save

  return {
    trades,
    setTrades,
  };
}
