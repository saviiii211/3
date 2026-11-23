import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PasswordsState } from '../../game/types';

interface PasswordsModuleProps {
  state: PasswordsState;
  onStepColumn: (colIndex: number, delta: 1 | -1) => void;
  onSubmit: () => void;
}

export const PasswordsModule: React.FC<PasswordsModuleProps> = ({
  state,
  onStepColumn,
  onSubmit,
}) => {
  return (
    <div className="recessed-bay p-3">
      {/* 5 Heavy Split-Flap Mechanical Letter Drums */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {state.columns.map((letters, colIdx) => {
          const currentLetter = letters[state.indices[colIdx]];
          return (
            <div key={colIdx} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => onStepColumn(colIdx, -1)}
                aria-label={`Coloana ${colIdx + 1} litera anterioară`}
                className="mech-key w-full min-h-[42px] flex items-center justify-center text-stone-300 cursor-pointer"
              >
                <ChevronUp className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Split-flap Bakelite Drum Display */}
              <div
                data-testid={`pwd-col-${colIdx}`}
                className="relative w-full h-14 bakelite-surface flex items-center justify-center overflow-hidden"
              >
                <span className="font-lcd text-3xl font-bold text-amber-200 tracking-wider select-none">
                  {currentLetter}
                </span>
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] bg-black/85 border-b border-white/10" />
              </div>

              <button
                type="button"
                onClick={() => onStepColumn(colIdx, 1)}
                aria-label={`Coloana ${colIdx + 1} litera următoare`}
                className="mech-key w-full min-h-[42px] flex items-center justify-center text-stone-300 cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Guarded Hazard-Striped Mechanical SUBMIT Switch */}
      <div className="mt-4 hw-hazard-stripe p-1.5 shadow-[4px_6px_14px_rgba(0,0,0,0.8)]">
        <button
          type="button"
          onClick={onSubmit}
          className="mech-key-bakelite w-full min-h-[48px] font-display text-sm font-bold tracking-[0.22em] text-amber-300 hover:text-amber-200 cursor-pointer"
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
};
