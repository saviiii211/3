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
    <div className="p-2.5 bg-[#ddd7c7] border border-[#15171a]/20 rounded-[2px]">
      {/* 5 Mechanical Split-Flap Letter Drums */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {state.columns.map((letters, colIdx) => {
          const currentLetter = letters[state.indices[colIdx]];
          return (
            <div key={colIdx} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => onStepColumn(colIdx, -1)}
                aria-label={`Coloana ${colIdx + 1} litera anterioară`}
                className="det-arcade-btn w-full min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                <ChevronUp className="w-5 h-5 text-[#eceae2]" aria-hidden="true" />
              </button>

              {/* Split-flap Bakelite Drum Housing Cream Tile */}
              <div
                data-testid={`pwd-col-${colIdx}`}
                className="relative w-full h-13 det-module-well flex items-center justify-center overflow-hidden p-1"
              >
                <div className="w-full h-full bg-[#f4f0e6] border border-[#8a8576] flex items-center justify-center relative">
                  <span className="font-display text-2xl sm:text-3xl font-bold text-[#15171a] select-none">
                    {currentLetter}
                  </span>
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] bg-[#15171a]/75" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStepColumn(colIdx, 1)}
                aria-label={`Coloana ${colIdx + 1} litera următoare`}
                className="det-arcade-btn w-full min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                <ChevronDown className="w-5 h-5 text-[#eceae2]" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Existing Yellow-Black Hazard-Guarded SUBMIT Switch */}
      <div className="mt-3.5 hw-hazard-stripe p-1.5 shadow-[3px_5px_12px_rgba(0,0,0,0.65)]">
        <button
          type="button"
          onClick={onSubmit}
          className="det-arcade-btn w-full min-h-[46px] font-display text-sm font-bold tracking-[0.22em] text-[#ffd9a0] hover:text-white cursor-pointer"
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
};
