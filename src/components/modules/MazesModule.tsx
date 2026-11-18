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
    <div className="hw-carbon-bay rounded-lg p-3.5 border border-slate-800/90">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Phosphor Radar 6x6 Grid */}
        <div
          data-testid="maze-grid"
          className={`hw-phosphor-screen rounded-xl p-3 w-full max-w-[236px] aspect-square transition-colors ${
            wallFlash ? 'ring-2 ring-red-500 bg-red-950/30' : ''
          }`}
        >
          <div className="grid grid-cols-6 grid-rows-6 w-full h-full border border-emerald-900/60">
            {Array.from({ length: 36 }).map((_, idx) => {
              const row = Math.floor(idx / 6) + 1;
              const col = (idx % 6) + 1;
              const hasMarker = isMarker(col, row);
              const isPlayer = state.player.col === col && state.player.row === row;
              const isGoal = state.goal.col === col && state.goal.row === row;

              return (
                <div
                  key={`${col}-${row}`}
                  className="relative flex items-center justify-center border border-emerald-900/25"
                >
                  {/* Tiny Radar Grid Node */}
                  <span className="w-1 h-1 rounded-full bg-emerald-700/50" aria-hidden="true" />

                  {/* Green Sonar Circle Marker */}
                  {hasMarker && (
                    <span
                      aria-label={`Marcaj cerc la coloana ${col}, rândul ${row}`}
                      className="absolute inset-1 rounded-full border-2 border-emerald-400/90 shadow-[0_0_8px_rgba(16,185,129,0.65)] animate-pulse"
                    />
                  )}

                  {/* Pulsing Red Triangle Goal */}
                  {isGoal && (
                    <svg
                      viewBox="0 0 24 24"
                      className="absolute w-4 h-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse z-10"
                      aria-label={`Ținta la coloana ${col}, rândul ${row}`}
                    >
                      <polygon points="12,3 22,20 2,20" fill="currentColor" />
                    </svg>
                  )}

                  {/* Glowing White Player Dot */}
                  {isPlayer && (
                    <span
                      aria-label={`Poziția curentă: coloana ${col}, rândul ${row}`}
                      className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.95)] z-20"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Physical 3D D-Pad */}
        <div className="flex flex-col items-center gap-2">
          <div className="grid grid-cols-3 gap-1.5 w-[156px]">
            <div />
            <button
              type="button"
              onClick={() => onMove('up')}
              aria-label="Mută sus"
              className="hw-tactile-btn min-h-[48px] flex items-center justify-center text-emerald-300"
            >
              <ArrowUp className="w-5 h-5" aria-hidden="true" />
            </button>
            <div />

            <button
              type="button"
              onClick={() => onMove('left')}
              aria-label="Mută stânga"
              className="hw-tactile-btn min-h-[48px] flex items-center justify-center text-emerald-300"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="rounded-lg bg-slate-950/90 border border-slate-800 flex items-center justify-center font-tech text-[10px] text-slate-500">
              {state.player.col},{state.player.row}
            </div>
            <button
              type="button"
              onClick={() => onMove('right')}
              aria-label="Mută dreapta"
              className="hw-tactile-btn min-h-[48px] flex items-center justify-center text-emerald-300"
            >
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>

            <div />
            <button
              type="button"
              onClick={() => onMove('down')}
              aria-label="Mută jos"
              className="hw-tactile-btn min-h-[48px] flex items-center justify-center text-emerald-300"
            >
              <ArrowDown className="w-5 h-5" aria-hidden="true" />
            </button>
            <div />
          </div>
          <p className="font-tech text-[10px] text-slate-400 text-center">
            Pereții sunt invizibili pe radar.
          </p>
        </div>
      </div>
    </div>
  );
};
