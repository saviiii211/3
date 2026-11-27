import React, { useEffect } from 'react';

interface ManualModalProps {
  open: boolean;
  onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ open, onClose }) => {
  // Block background scrolling and support Escape key while open
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === 'manual-close') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('message', onMessage);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('message', onMessage);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Manual de dezamorsare"
      data-testid="manual-modal"
      className="manual-modal-enter fixed inset-0 z-[1300] bg-[#050606]/95 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      {/* Top thin hardware bar */}
      <div className="shrink-0 min-h-[52px] px-3 sm:px-5 py-1.5 bg-[#0c0d0e] border-b border-[#e6e1d3]/25 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm sm:text-base font-bold tracking-[0.14em] text-[#ffd9a0] truncate">
          MANUAL DE DEZAMORSARE
        </h2>

        <button
          type="button"
          data-testid="manual-close-btn"
          onClick={onClose}
          aria-label="Închide manualul"
          className="min-w-[44px] min-h-[44px] px-3 py-1.5 bg-[#101a2b] border border-[#e6e1d3]/40 hover:border-[#ffd9a0] text-[#e6e1d3] hover:text-[#ffd9a0] font-tech text-xs font-bold tracking-wider rounded-[2px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#ffd9a0] shrink-0"
        >
          <span aria-hidden="true">✕</span>
          <span>Închide</span>
        </button>
      </div>

      {/* Standalone offline manual iframe */}
      <iframe
        src="/manual.html"
        title="Manual de dezamorsare"
        className="w-full flex-1 border-0 bg-[#050606]"
      />
    </div>
  );
};
