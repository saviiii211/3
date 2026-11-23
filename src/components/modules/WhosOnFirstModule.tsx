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
    <div className="recessed-bay p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-tech text-[10px] text-stone-400 tracking-widest">
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

      {/* Industrial Phosphor-Green CRT Screen */}
      <div className="crt-phosphor-glass py-4 px-3 mb-3 flex items-center justify-center min-h-[66px]">
        <span
          data-testid="wof-display"
          className="font-lcd text-2xl sm:text-3xl tracking-widest phosphor-text relative z-10"
        >
          {state.displayWord === '' ? '\u00A0' : state.displayWord}
        </span>
      </div>

      {/* 3 rows x 2 columns bakelite push-buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {state.buttons.map((label, idx) => (
          <button
            key={`${state.round}-${idx}-${label}`}
            type="button"
            onClick={() => onPressButton(idx)}
            aria-label={`Buton ${idx + 1}: ${label}`}
            className="mech-key-bakelite min-h-[46px] px-2 py-2.5 flex items-center justify-center cursor-pointer"
          >
            <span className="font-tech text-sm font-bold tracking-wider text-amber-100 whitespace-nowrap">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
