import React from 'react';
import type { MemoryState } from '../../game/types';

interface MemoryModuleProps {
  state: MemoryState;
  onPress: (position: 1 | 2 | 3 | 4) => void;
}

export const MemoryModule: React.FC<MemoryModuleProps> = ({ state, onPress }) => {
  return (
    <div className="recessed-bay p-3">
      <div className="flex items-stretch gap-3">
        {/* Left: Recessed Phosphor CRT Display + 4 Heavy Mechanical Keys */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="crt-amber-glass py-4 px-3 flex flex-col items-center justify-center">
            <span className="font-tech text-[10px] tracking-[0.2em] text-amber-400/80 mb-0.5 relative z-10">
              ETAPA {state.stage} / 5
            </span>
            <div
              data-testid="memory-display"
              className="font-lcd text-6xl leading-none nixie-tube select-none relative z-10"
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
                  className="mech-key min-h-[54px] flex flex-col items-center justify-center py-2 px-1 cursor-pointer"
                >
                  <span className="font-lcd text-2xl font-bold text-amber-200">{label}</span>
                  <span className="font-tech text-[9px] text-stone-400 mt-0.5">P{pos}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Vertical 5-Stage Glass Indicator Rack */}
        <div
          aria-label={`Progres etape Memoria: ${state.stage} din 5`}
          className="w-10 bakelite-surface py-2.5 flex flex-col-reverse items-center justify-between"
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
                <span className="font-tech text-[8px] text-stone-400">{lvl}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
