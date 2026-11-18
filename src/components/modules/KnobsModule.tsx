import React, { useEffect } from 'react';
import { RotateCw, TimerReset } from 'lucide-react';
import { directionToDegrees } from '../../game/knobs';
import type { KnobDirection, KnobsState } from '../../game/types';

interface KnobsModuleProps {
  state: KnobsState;
  isActive: boolean;
  onRotate: () => void;
  onValidate: () => void;
  onTickTimer: () => void;
  onResetTimer: () => void;
}

function upLabelPositionClass(upSide: KnobDirection): string {
  switch (upSide) {
    case 'UP':
      return 'top-1 left-1/2 -translate-x-1/2';
    case 'RIGHT':
      return 'right-1 top-1/2 -translate-y-1/2 rotate-90';
    case 'DOWN':
      return 'bottom-1 left-1/2 -translate-x-1/2 rotate-180';
    case 'LEFT':
      return 'left-1 top-1/2 -translate-y-1/2 -rotate-90';
  }
}

export const KnobsModule: React.FC<KnobsModuleProps> = ({
  state,
  isActive,
  onRotate,
  onValidate,
  onTickTimer,
  onResetTimer,
}) => {
  useEffect(() => {
    if (!isActive || state.secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      onTickTimer();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isActive, state.secondsLeft, onTickTimer]);

  const dialDeg = directionToDegrees(state.dialFacing);
  const topRow = state.leds.slice(0, 6);
  const bottomRow = state.leds.slice(6, 12);

  return (
    <div className="hw-carbon-bay rounded-lg p-3.5 border border-slate-800/90">
      <div className="flex items-center justify-between mb-3">
        <div className="hw-lcd-screen rounded px-2.5 py-1 flex items-center gap-2">
          <span className="font-tech text-[10px] text-slate-400">TIMER</span>
          <span
            data-testid="knobs-timer"
            className={`font-lcd text-xl ${
              state.secondsLeft <= 10 ? 'text-red-400' : 'text-amber-300'
            }`}
          >
            00:{String(state.secondsLeft).padStart(2, '0')}
          </span>
        </div>

        {state.secondsLeft === 0 ? (
          <button
            type="button"
            onClick={onResetTimer}
            className="hw-btn-compact px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-tech text-amber-300"
          >
            <TimerReset className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Resetează 45s</span>
          </button>
        ) : (
          <span className="font-tech text-[10px] text-slate-400">
            Orientare raportată la „UP”
          </span>
        )}
      </div>

      {/* Central Brushed-Metal Rotating Dial with Engraved UP Label */}
      <div className="flex flex-col items-center gap-3.5">
        <div className="relative w-40 h-40 rounded-full bg-slate-950/90 border border-slate-800 flex items-center justify-center shadow-inner">
          {/* Engraved UP Marker on 1 of 4 sides */}
          <div
            data-testid="knob-up-label"
            className={`hw-nameplate absolute px-2 py-0.5 rounded font-tech text-[10px] font-bold tracking-widest text-amber-300 ${upLabelPositionClass(
              state.upSide
            )}`}
          >
            UP
          </div>

          {/* Rotating Metallic Dial */}
          <button
            type="button"
            onClick={onRotate}
            aria-label={`Rotește cadranul 90 grade (orientat spre ${state.dialFacing})`}
            className="relative w-24 h-24 rounded-full border-2 border-slate-500 shadow-[0_6px_16px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] cursor-pointer active:scale-95 transition-transform duration-200 flex items-center justify-center"
            style={{
              background:
                'conic-gradient(from 0deg, #334155, #475569, #1e293b, #475569, #334155)',
              transform: `rotate(${dialDeg}deg)`,
            }}
          >
            {/* Pointer Arrow */}
            <div className="w-2.5 h-8 bg-amber-400 rounded-full -translate-y-4 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <div className="absolute w-7 h-7 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center">
              <RotateCw className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </div>
          </button>
        </div>

        {/* 12 LEDs: 2 rows x 6 columns */}
        <div
          aria-label="Configurație 12 LED-uri"
          className="w-full max-w-[260px] rounded-lg bg-slate-950/95 border border-slate-800 p-2.5 flex flex-col gap-2"
        >
          <div className="grid grid-cols-6 gap-2 place-items-center">
            {topRow.map((on, i) => (
              <span
                key={`t-${i}`}
                aria-label={`LED rând 1 col ${i + 1}: ${on ? 'aprins' : 'stins'}`}
                className={`hw-led-dome w-4 h-4 ${on ? 'hw-led-red-pulse' : 'hw-led-off'}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-6 gap-2 place-items-center">
            {bottomRow.map((on, i) => (
              <span
                key={`b-${i}`}
                aria-label={`LED rând 2 col ${i + 1}: ${on ? 'aprins' : 'stins'}`}
                className={`hw-led-dome w-4 h-4 ${on ? 'hw-led-red-pulse' : 'hw-led-off'}`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            type="button"
            onClick={onRotate}
            className="hw-tactile-btn min-h-[46px] px-3 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-200"
          >
            <RotateCw className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <span>Rotește 90°</span>
          </button>
          <button
            type="button"
            onClick={onValidate}
            className="hw-tactile-btn min-h-[46px] px-3 py-2 font-display text-xs font-bold tracking-wider text-amber-300 border-amber-500/40"
          >
            VALIDEAZĂ
          </button>
        </div>
      </div>
    </div>
  );
};
