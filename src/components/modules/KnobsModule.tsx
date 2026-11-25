import React, { useEffect } from 'react';
import { RotateCw, TimerReset } from 'lucide-react';
import { directionToDegrees } from '../../game/knobs';
import type { KnobDirection, KnobsState } from '../../game/types';
import { SevenSegmentDisplay } from '../SevenSegmentDisplay';

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
  const timeText = `00:${String(state.secondsLeft).padStart(2, '0')}`;

  return (
    <div className="p-2.5 bg-[#ddd7c7] border border-[#15171a]/20 rounded-[2px]">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="bg-[#120807] border border-[#323438] px-2.5 py-1 flex items-center gap-2 shadow-inner">
          <span className="font-tech text-[9px] text-[#bdb6a4]">TIMER</span>
          <div data-testid="knobs-timer" aria-label={`Timer buton rotativ: ${timeText}`}>
            <SevenSegmentDisplay
              value={timeText}
              color={state.secondsLeft <= 10 ? '#ff3b2a' : '#e89b2d'}
              height={19}
            />
          </div>
        </div>

        {state.secondsLeft === 0 ? (
          <button
            type="button"
            onClick={onResetTimer}
            className="det-arcade-btn px-2.5 py-1.5 min-h-[44px] flex items-center gap-1.5 text-xs font-tech text-[#ffd9a0] cursor-pointer"
          >
            <TimerReset className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Resetează 45s</span>
          </button>
        ) : (
          <span className="font-tech text-[10px] font-bold text-[#15171a]">
            Orientare raportată la „UP”
          </span>
        )}
      </div>

      {/* Knurled Metal Rotary Dial + Navy Dymo UP Plaque */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-36 h-36 rounded-full det-module-well flex items-center justify-center">
          {[0, 90, 180, 270].map((deg) => (
            <span
              key={deg}
              aria-hidden="true"
              className="absolute w-1 h-2.5 bg-[#8a8576]"
              style={{
                transform: `rotate(${deg}deg) translateY(-62px)`,
              }}
            />
          ))}

          {/* Navy Dymo UP Label */}
          <div
            data-testid="knob-up-label"
            className={`det-dymo-label absolute px-2 py-0.5 text-[10px] font-bold ${upLabelPositionClass(
              state.upSide
            )}`}
          >
            UP
          </div>

          {/* Knurled Brushed-Metal Rotary Dial */}
          <button
            type="button"
            onClick={onRotate}
            aria-label={`Rotește cadranul 90 grade (orientat spre ${state.dialFacing})`}
            className="relative w-22 h-22 rounded-full border-2 border-[#6d6f6b] shadow-[4px_8px_16px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.22)] cursor-pointer active:scale-95 transition-transform duration-200 flex items-center justify-center"
            style={{
              background:
                'conic-gradient(from 0deg, #323539, #5a5e66, #1f2124, #4b4f56, #323539)',
              transform: `rotate(${dialDeg}deg)`,
            }}
          >
            <div className="w-2.5 h-7 bg-[#eceae2] border border-[#15171a] rounded-[1px] -translate-y-4 shadow" />
            <div className="absolute w-7 h-7 rounded-full bg-[#15171a] border border-[#6d6f6b] flex items-center justify-center">
              <RotateCw className="w-3.5 h-3.5 text-[#eceae2]" aria-hidden="true" />
            </div>
          </button>
        </div>

        {/* 12 Warning LEDs: 2 rows x 6 columns */}
        <div
          aria-label="Configurație 12 LED-uri"
          className="w-full max-w-[250px] det-module-well p-2 flex flex-col gap-1.5"
        >
          <div className="grid grid-cols-6 gap-2 place-items-center">
            {topRow.map((on, i) => (
              <span
                key={`t-${i}`}
                aria-label={`LED rând 1 col ${i + 1}: ${on ? 'aprins' : 'stins'}`}
                className={`hw-led-dome w-3.5 h-3.5 ${on ? 'hw-led-red-pulse' : 'hw-led-off'}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-6 gap-2 place-items-center">
            {bottomRow.map((on, i) => (
              <span
                key={`b-${i}`}
                aria-label={`LED rând 2 col ${i + 1}: ${on ? 'aprins' : 'stins'}`}
                className={`hw-led-dome w-3.5 h-3.5 ${on ? 'hw-led-red-pulse' : 'hw-led-off'}`}
              />
            ))}
          </div>
        </div>

        {/* Mechanical Controls */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            type="button"
            onClick={onRotate}
            className="det-arcade-btn min-h-[44px] px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-tech font-bold cursor-pointer"
          >
            <RotateCw className="w-4 h-4 text-[#ffd9a0]" aria-hidden="true" />
            <span>Rotește 90°</span>
          </button>
          <button
            type="button"
            onClick={onValidate}
            className="det-arcade-btn min-h-[44px] px-3 py-2 flex items-center justify-center cursor-pointer"
          >
            <span className="det-dymo-label px-2 py-0.5 text-[11px] font-bold">
              VALIDEAZĂ
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
