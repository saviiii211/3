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
    <div className="hw-carbon-bay rounded-lg p-3.5 border border-slate-800/90">
      {/* 5 Split-Flap Mechanical Letter Drums */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {state.columns.map((letters, colIdx) => {
          const currentLetter = letters[state.indices[colIdx]];
          return (
            <div key={colIdx} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => onStepColumn(colIdx, -1)}
                aria-label={`Coloana ${colIdx + 1} litera anterioară`}
                className="hw-tactile-btn w-full min-h-[40px] flex items-center justify-center text-slate-300"
              >
                <ChevronUp className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Split-flap Drum Display */}
              <div
                data-testid={`pwd-col-${colIdx}`}
                className="relative w-full h-14 rounded-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center overflow-hidden"
              >
                <span className="font-lcd text-3xl font-bold text-amber-300 tracking-wider select-none">
                  {currentLetter}
                </span>
                {/* Center split-flap hinge line */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/75" />
              </div>

              <button
                type="button"
                onClick={() => onStepColumn(colIdx, 1)}
                aria-label={`Coloana ${colIdx + 1} litera următoare`}
                className="hw-tactile-btn w-full min-h-[40px] flex items-center justify-center text-slate-300"
              >
                <ChevronDown className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Massive SUBMIT Button with Hazard Stripes */}
      <div className="mt-4 hw-hazard-stripe p-1.5 rounded-lg shadow-lg">
        <button
          type="button"
          onClick={onSubmit}
          className="w-full min-h-[48px] rounded-md bg-gradient-to-b from-slate-800 to-slate-950 border border-amber-500/60 font-display text-sm font-bold tracking-[0.22em] text-amber-300 hover:text-amber-200 active:translate-y-0.5 transition-transform"
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
};
