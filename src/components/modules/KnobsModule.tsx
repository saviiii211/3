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
    <div className="recessed-bay p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="crt-amber-glass px-2.5 py-1 flex items-center gap-2">
          <span className="font-tech text-[10px] text-amber-400/75 relative z-10">TIMER</span>
          <span
            data-testid="knobs-timer"
            className={`font-lcd text-xl relative z-10 ${
              state.secondsLeft <= 10 ? 'nixie-tube-red' : 'nixie-tube'
            }`}
          >
            00:{String(state.secondsLeft).padStart(2, '0')}
          </span>
        </div>

        {state.secondsLeft === 0 ? (
          <button
            type="button"
            onClick={onResetTimer}
            className="mech-toggle px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-tech text-amber-300 cursor-pointer"
          >
            <TimerReset className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Resetează 45s</span>
          </button>
        ) : (
          <span className="font-tech text-[10px] text-stone-400">
            Orientare raportată la „UP”
          </span>
        )}
      </div>

      {/* Machined Metal Rotary Dial + Engraved UP Plaque */}
      <div className="flex flex-col items-center gap-3.5">
        <div className="relative w-40 h-40 rounded-full bakelite-surface flex items-center justify-center shadow-[inset_4px_6px_14px_rgba(0,0,0,0.95)]">
          {/* Engraved Tick Marks on Metal Collar */}
          {[0, 90, 180, 270].map((deg) => (
            <span
              key={deg}
              aria-hidden="true"
              className="absolute w-1 h-2.5 bg-stone-500/70"
              style={{
                transform: `rotate(${deg}deg) translateY(-68px)`,
              }}
            />
          ))}

          {/* Engraved Brass UP Marker */}
          <div
            data-testid="knob-up-label"
            className={`brass-plaque absolute px-2 py-0.5 font-tech text-[10px] font-bold tracking-widest text-amber-100 ${upLabelPositionClass(
              state.upSide
            )}`}
          >
            UP
          </div>

          {/* Knurled Brushed-Steel Rotary Dial */}
          <button
            type="button"
            onClick={onRotate}
            aria-label={`Rotește cadranul 90 grade (orientat spre ${state.dialFacing})`}
            className="relative w-24 h-24 rounded-full border-2 border-stone-500 shadow-[6px_10px_18px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.2)] cursor-pointer active:scale-95 transition-transform duration-200 flex items-center justify-center"
            style={{
              background:
                'conic-gradient(from 0deg, #2d3035, #52565e, #1c1e22, #454950, #2d3035)',
              transform: `rotate(${dialDeg}deg)`,
            }}
          >
            <div className="w-2.5 h-8 bg-amber-500 border border-amber-200/50 rounded-[1px] -translate-y-4 shadow-[0_0_8px_rgba(245,158,11,0.75)]" />
            <div className="absolute w-7 h-7 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center">
              <RotateCw className="w-3.5 h-3.5 text-stone-300" aria-hidden="true" />
            </div>
          </button>
        </div>

        {/* 12 Red Warning Bulbs: 2 rows x 6 columns */}
        <div
          aria-label="Configurație 12 LED-uri"
          className="w-full max-w-[260px] bakelite-surface p-2.5 flex flex-col gap-2"
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

        {/* Mechanical Controls */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            type="button"
            onClick={onRotate}
            className="mech-key min-h-[46px] px-3 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-stone-200 cursor-pointer"
          >
            <RotateCw className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>Rotește 90°</span>
          </button>
          <button
            type="button"
            onClick={onValidate}
            className="mech-key-bakelite min-h-[46px] px-3 py-2 font-display text-xs font-bold tracking-wider text-amber-300 cursor-pointer"
          >
            VALIDEAZĂ
          </button>
        </div>
      </div>
    </div>
  );
};
