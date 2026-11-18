import React from 'react';
import type { MemoryState } from '../../game/types';

interface MemoryModuleProps {
  state: MemoryState;
  onPress: (position: 1 | 2 | 3 | 4) => void;
}

export const MemoryModule: React.FC<MemoryModuleProps> = ({ state, onPress }) => {
  return (
    <div className="hw-carbon-bay rounded-lg p-3.5 border border-slate-800/90">
      <div className="flex items-stretch gap-3">
        {/* Left: LCD Display + 4 Physical Tactile Keys */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="hw-lcd-screen rounded-lg py-4 px-3 flex flex-col items-center justify-center">
            <span className="font-tech text-[10px] tracking-widest text-sky-400/70 mb-0.5">
              ETAPA {state.stage} / 5
            </span>
            <div
              data-testid="memory-display"
              className="font-lcd text-6xl leading-none text-sky-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)] select-none"
            >
              {state.display}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {state.buttons.map((label, idx) => {
              const pos = (idx + 1) as 1 | 2 | 3 | 4;
              return (
                <button
                  key={`${state.stage}-${pos}-${label}`}
                  type="button"
                  onClick={() => onPress(pos)}
                  aria-label={`Memoria poziția ${pos}, cifra ${label}`}
                  className="hw-tactile-btn min-h-[56px] flex flex-col items-center justify-center py-2 px-1"
                >
                  <span className="font-lcd text-2xl font-bold text-amber-300">{label}</span>
                  <span className="font-tech text-[9px] text-slate-400 mt-0.5">P{pos}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Vertical 5-Stage Progress LED Column */}
        <div
          aria-label={`Progres etape Memoria: ${state.stage} din 5`}
          className="w-10 rounded-lg bg-slate-950/90 border border-slate-800 py-2.5 flex flex-col-reverse items-center justify-between"
        >
          {[1, 2, 3, 4, 5].map((lvl) => {
            const passed = lvl < state.stage;
            const current = lvl === state.stage;
            return (
              <div key={lvl} className="flex flex-col items-center gap-0.5">
                <div
                  className={`hw-led-dome w-3.5 h-3.5 ${
                    passed ? 'hw-led-green' : current ? 'hw-led-amber' : 'hw-led-off'
                  }`}
                />
                <span className="font-tech text-[8px] text-slate-500">{lvl}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
