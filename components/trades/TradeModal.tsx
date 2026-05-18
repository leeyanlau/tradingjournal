import { ReactNode } from 'react';

export function TradeModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* MODAL BOX */}
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-card rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* SCROLLABLE CONTENT AREA */}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
