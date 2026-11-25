import React from 'react';
import type { WhosOnFirstState } from '../../game/types';

interface WhosOnFirstModuleProps {
  state: WhosOnFirstState;
  onPressButton: (index: number) => void;
}

export const WhosOnFirstModule: React.FC<WhosOnFirstModuleProps> = ({
  state,
  onPressButton,
}) => {
  return (
    <div className="p-2 bg-[#ddd7c7] border border-[#15171a]/20 rounded-[2px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-tech text-[10px] font-bold text-[#15171a] tracking-widest">
          RUNDA {state.round} / 3
        </span>
        <div className="flex items-center gap-1.5" aria-label={`Runda ${state.round} din 3`}>
          {[1, 2, 3].map((r) => (
            <span
              key={r}
              className={`hw-led-dome w-3 h-3 inline-block ${
                r < state.round ? 'hw-led-green' : r === state.round ? 'hw-led-amber' : 'hw-led-off'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Backlit Dark-Green LCD Window (#1b2a12 / #9be15d) */}
      <div className="bg-[#1b2a12] border-2 border-[#0e1509] shadow-[inset_2px_4px_10px_rgba(0,0,0,0.85)] py-3 px-3 mb-2.5 flex items-center justify-center min-h-[60px]">
        <span
          data-testid="wof-display"
          className="font-lcd text-3xl tracking-widest text-[#9be15d] select-none"
        >
          {state.displayWord === '' ? '\u00A0' : state.displayWord}
        </span>
      </div>

      {/* 3 rows x 2 columns chunky arcade pushbuttons with engraved cream lettering */}
      <div className="grid grid-cols-2 gap-2">
        {state.buttons.map((label, idx) => (
          <button
            key={`${state.round}-${idx}-${label}`}
            type="button"
            onClick={() => onPressButton(idx)}
            aria-label={`Buton ${idx + 1}: ${label}`}
            className="det-arcade-btn min-h-[44px] px-2 py-2 flex items-center justify-center cursor-pointer"
          >
            <span className="font-tech text-xs sm:text-sm font-bold tracking-wider text-[#eceae2] whitespace-nowrap">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
