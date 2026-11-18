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
    <div className="hw-carbon-bay rounded-lg p-3.5 border border-slate-800/90">
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-tech text-[10px] text-slate-400 tracking-wider">
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

      {/* Upper OLED Display */}
      <div className="hw-lcd-screen rounded-lg py-4 px-3 mb-3 flex items-center justify-center min-h-[68px]">
        <span
          data-testid="wof-display"
          className="font-lcd text-2xl sm:text-3xl tracking-widest text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
        >
          {state.displayWord === '' ? '\u00A0' : state.displayWord}
        </span>
      </div>

      {/* 3 rows x 2 columns backlit mechanical buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {state.buttons.map((label, idx) => (
          <button
            key={`${state.round}-${idx}-${label}`}
            type="button"
            onClick={() => onPressButton(idx)}
            aria-label={`Buton ${idx + 1}: ${label}`}
            className="hw-tactile-btn min-h-[48px] px-2 py-2.5 flex items-center justify-center"
          >
            <span className="font-tech text-sm font-bold tracking-wider text-amber-200 whitespace-nowrap">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
