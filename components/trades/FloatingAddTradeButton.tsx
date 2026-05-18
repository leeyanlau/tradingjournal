export function FloatingAddTradeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 rounded-full bg-primary text-white w-14 h-14 shadow-lg hover:scale-105 transition"
    >
      +
    </button>
  );
}
