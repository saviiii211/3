import React from 'react';
import type { MemoryState } from '../../game/types';
import { SevenSegmentDisplay } from '../SevenSegmentDisplay';

interface MemoryModuleProps {
  state: MemoryState;
  onPress: (position: 1 | 2 | 3 | 4) => void;
}

export const MemoryModule: React.FC<MemoryModuleProps> = ({ state, onPress }) => {
  return (
    <div className="p-1.5 bg-[#ddd7c7] border border-[#15171a]/20 rounded-[2px]">
      <div className="flex items-stretch gap-2">
        {/* Left: Dark 7-Segment Window + 4 Black Arcade Buttons with White Label Plaques */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="det-module-well py-1.5 px-2.5 flex flex-col items-center justify-center">
            <span className="font-tech text-[10px] tracking-[0.18em] text-[#bdb6a4] mb-0.5">
              ETAPA {state.stage} / 5
            </span>
            <div
              data-testid="memory-display"
              aria-label={`Afișaj Memoria: ${state.display}`}
              className="bg-[#120807] border border-[#323438] px-3.5 py-1 shadow-inner flex items-center justify-center"
            >
              <SevenSegmentDisplay
                value={String(state.display)}
                color="#ff3b2a"
                height={34}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {state.buttons.map((label, idx) => {
              const pos = (idx + 1) as 1 | 2 | 3 | 4;
              return (
                <button
                  key={`${state.stage}-${pos}-${label}`}
                  type="button"
                  onClick={() => onPress(pos)}
                  aria-label={`Memoria poziția ${pos}, cifra ${label}`}
                  className="min-h-[44px] flex flex-col items-center gap-0.5 cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#101a2b]"
                >
                  {/* Black Arcade Pushbutton */}
                  <span className="det-arcade-btn w-full min-h-[30px] flex items-center justify-center group-hover:brightness-110">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#101214] border border-[#4a4e54] shadow-inner inline-block" />
                  </span>
                  {/* White Printed Digit Plaque Underneath */}
                  <span className="w-full bg-[#f4f0e6] border border-[#8a8576] py-0.5 text-center shadow-sm">
                    <span className="font-display text-base font-bold text-[#15171a] block leading-none">
                      {label}
                    </span>
                    <span className="font-tech text-[8px] font-bold text-[#3a382f] block">
                      P{pos}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Vertical 5-Stage Glass Indicator Rack */}
        <div
          aria-label={`Progres etape Memoria: ${state.stage} din 5`}
          className="w-9 det-module-well py-2 flex flex-col-reverse items-center justify-between"
        >
          {[1, 2, 3, 4, 5].map((lvl) => {
            const passed = lvl < state.stage;
            const current = lvl === state.stage;
            return (
              <div key={lvl} className="flex flex-col items-center gap-0.5">
                <div
                  className={`hw-led-dome w-3 h-3 ${
                    passed ? 'hw-led-green' : current ? 'hw-led-amber' : 'hw-led-off'
                  }`}
                />
                <span className="font-tech text-[8px] text-[#bdb6a4]">{lvl}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
