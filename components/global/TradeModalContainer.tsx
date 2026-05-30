'use client';

import { TradeModal } from '@/components/trades/TradeModal';
import { TradeForm } from '@/components/trades/TradeForm';
import { useTradeModal } from './TradeModalProvider';
import { useTradesStore } from '@/hooks/useTradesStore';
import { detectMistakes } from '@/utils/detectMistakes';

export function TradeModalContainer({
  inputClass,
  pairQuery,
  setPairQuery,
  showPairDropdown,
  setShowPairDropdown,
  filteredPairs,
  pairDropdownRef,
}: any) {
  const { open, closeModal, trade, setTrade, toggleChecklist } =
    useTradeModal();

  const { trades } = useTradesStore();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const store = useTradesStore.getState();

      const finalTrade = {
        ...trade,
        behavioralMistakes: detectMistakes(trade),
        id: trade.id || crypto.randomUUID(),
      };

      await store.addTrade(finalTrade);

      closeModal();
    } catch (err) {
      console.error('Failed to add trade:', err);
      alert('Failed to add trade');
    }
  };

  return (
    <TradeModal open={open} onClose={closeModal}>
      <TradeForm
        trade={trade}
        setTrade={setTrade}
        onSubmit={handleSubmit}
        isEditMode={false}
        inputClass={inputClass}
        pairQuery={pairQuery}
        setPairQuery={setPairQuery}
        showPairDropdown={showPairDropdown}
        setShowPairDropdown={setShowPairDropdown}
        filteredPairs={filteredPairs}
        pairDropdownRef={pairDropdownRef}
        onToggleChecklist={toggleChecklist}
      />
    </TradeModal>
  );
}
