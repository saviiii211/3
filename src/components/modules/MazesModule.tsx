import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import type { MazeDirection } from '../../game/mazes';
import type { MazeState } from '../../game/types';

interface MazesModuleProps {
  state: MazeState;
  wallFlash: boolean;
  onMove: (dir: MazeDirection) => void;
}

export const MazesModule: React.FC<MazesModuleProps> = ({ state, wallFlash, onMove }) => {
  const isMarker = (col: number, row: number) =>
    state.markers.some((m) => m.col === col && m.row === row);

  return (
    <div className="recessed-bay p-3">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Industrial Phosphor-Green CRT Radar Screen */}
        <div
          data-testid="maze-grid"
          className={`crt-phosphor-glass p-3 w-full max-w-[232px] aspect-square transition-colors ${
            wallFlash ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="relative z-10 grid grid-cols-6 grid-rows-6 w-full h-full border border-emerald-800/75">
            {Array.from({ length: 36 }).map((_, idx) => {
              const row = Math.floor(idx / 6) + 1;
              const col = (idx % 6) + 1;
              const hasMarker = isMarker(col, row);
              const isPlayer = state.player.col === col && state.player.row === row;
              const isGoal = state.goal.col === col && state.goal.row === row;

              return (
                <div
                  key={`${col}-${row}`}
                  className="relative flex items-center justify-center border border-emerald-900/40"
                >
                  <span className="w-1 h-1 rounded-full bg-emerald-600/60" aria-hidden="true" />

                  {hasMarker && (
                    <span
                      aria-label={`Marcaj cerc la coloana ${col}, rândul ${row}`}
                      className="absolute inset-1 rounded-full border-2 border-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.65)] animate-pulse"
                    />
                  )}

                  {isGoal && (
                    <svg
                      viewBox="0 0 24 24"
                      className="absolute w-4 h-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse z-10"
                      aria-label={`Ținta la coloana ${col}, rândul ${row}`}
                    >
                      <polygon points="12,3 22,20 2,20" fill="currentColor" />
                    </svg>
                  )}

                  {isPlayer && (
                    <span
                      aria-label={`Poziția curentă: coloana ${col}, rândul ${row}`}
                      className="absolute w-3.5 h-3.5 rounded-full bg-amber-50 shadow-[0_0_12px_rgba(255,255,255,0.95)] z-20"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Heavy Machined Steel & Bakelite D-Pad */}
        <div className="flex flex-col items-center gap-2">
          <div className="grid grid-cols-3 gap-1.5 w-[156px]">
            <div />
            <button
              type="button"
              onClick={() => onMove('up')}
              aria-label="Mută sus"
              className="mech-key min-h-[48px] flex items-center justify-center text-emerald-300 cursor-pointer"
            >
              <ArrowUp className="w-5 h-5" aria-hidden="true" />
            </button>
            <div />

            <button
              type="button"
              onClick={() => onMove('left')}
              aria-label="Mută stânga"
              className="mech-key min-h-[48px] flex items-center justify-center text-emerald-300 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="crt-phosphor-glass flex items-center justify-center font-tech text-[11px] phosphor-text">
              <span className="relative z-10">
                {state.player.col},{state.player.row}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onMove('right')}
              aria-label="Mută dreapta"
              className="mech-key min-h-[48px] flex items-center justify-center text-emerald-300 cursor-pointer"
            >
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>

            <div />
            <button
              type="button"
              onClick={() => onMove('down')}
              aria-label="Mută jos"
              className="mech-key min-h-[48px] flex items-center justify-center text-emerald-300 cursor-pointer"
            >
              <ArrowDown className="w-5 h-5" aria-hidden="true" />
            </button>
            <div />
          </div>
          <p className="font-tech text-[10px] text-stone-400 text-center">
            Pereții sunt invizibili pe ecran.
          </p>
        </div>
      </div>
    </div>
  );
};
