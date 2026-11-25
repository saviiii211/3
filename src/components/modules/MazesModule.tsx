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
    <div className="p-2.5 bg-[#ddd7c7] border border-[#15171a]/20 rounded-[2px]">
      <div className="flex flex-col sm:flex-row items-center gap-3.5">
        {/* 6x6 Physical LED Matrix Well (inspired by Image 1) */}
        <div
          data-testid="maze-grid"
          className={`det-module-well p-2.5 w-full max-w-[224px] aspect-square transition-colors ${
            wallFlash ? 'ring-2 ring-[#ff3b2a]' : ''
          }`}
        >
          <div className="grid grid-cols-6 grid-rows-6 w-full h-full gap-1 bg-[#0b0c0d] p-1 border border-[#2c2f33]">
            {Array.from({ length: 36 }).map((_, idx) => {
              const row = Math.floor(idx / 6) + 1;
              const col = (idx % 6) + 1;
              const hasMarker = isMarker(col, row);
              const isPlayer = state.player.col === col && state.player.row === row;
              const isGoal = state.goal.col === col && state.goal.row === row;

              return (
                <div
                  key={`${col}-${row}`}
                  className="relative flex items-center justify-center bg-[#141718] border border-[#1f2325]"
                >
                  {/* Dim physical unlit LED dome */}
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#2c312e]"
                    aria-hidden="true"
                  />

                  {hasMarker && (
                    <span
                      aria-label={`Marcaj cerc la coloana ${col}, rândul ${row}`}
                      className="absolute inset-0.5 rounded-full border-2 border-[#3ddc84] shadow-[0_0_6px_rgba(61,220,132,0.65)]"
                    />
                  )}

                  {isGoal && (
                    <svg
                      viewBox="0 0 24 24"
                      className="absolute w-4 h-4 text-[#ff3b2a] z-10"
                      aria-label={`Ținta la coloana ${col}, rândul ${row}`}
                    >
                      <polygon points="12,3 22,20 2,20" fill="currentColor" />
                    </svg>
                  )}

                  {isPlayer && (
                    <span
                      aria-label={`Poziția curentă: coloana ${col}, rândul ${row}`}
                      className="absolute w-3.5 h-3.5 rounded-full bg-[#f5f2e8] border border-[#15171a] shadow-[0_0_8px_rgba(255,248,230,0.95)] z-20"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4 Directional Arcade Pushbuttons + Coordinate Window */}
        <div className="flex flex-col items-center gap-2">
          <div className="grid grid-cols-3 gap-1.5 w-[156px]">
            <div />
            <button
              type="button"
              onClick={() => onMove('up')}
              aria-label="Mută sus"
              className="det-arcade-btn min-h-[46px] flex items-center justify-center cursor-pointer"
            >
              <ArrowUp className="w-5 h-5 text-[#eceae2]" aria-hidden="true" />
            </button>
            <div />

            <button
              type="button"
              onClick={() => onMove('left')}
              aria-label="Mută stânga"
              className="det-arcade-btn min-h-[46px] flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-[#eceae2]" aria-hidden="true" />
            </button>
            <div className="det-module-well flex items-center justify-center font-tech text-[11px] font-bold text-[#ffd9a0]">
              <span>
                {state.player.col},{state.player.row}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onMove('right')}
              aria-label="Mută dreapta"
              className="det-arcade-btn min-h-[46px] flex items-center justify-center cursor-pointer"
            >
              <ArrowRight className="w-5 h-5 text-[#eceae2]" aria-hidden="true" />
            </button>

            <div />
            <button
              type="button"
              onClick={() => onMove('down')}
              aria-label="Mută jos"
              className="det-arcade-btn min-h-[46px] flex items-center justify-center cursor-pointer"
            >
              <ArrowDown className="w-5 h-5 text-[#eceae2]" aria-hidden="true" />
            </button>
            <div />
          </div>
          <p className="font-tech text-[10px] font-bold text-[#15171a] text-center">
            Pereții sunt invizibili pe ecran.
          </p>
        </div>
      </div>
    </div>
  );
};
