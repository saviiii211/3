import React, { useEffect, useState } from 'react';
import { radioEngine, type RadioUiSnapshot } from '../utils/radio';

interface RadioHandsetProps {
  visible?: boolean;
  onReplay?: () => void;
}

export const RadioHandset: React.FC<RadioHandsetProps> = ({
  visible = true,
  onReplay,
}) => {
  const [snap, setSnap] = useState<RadioUiSnapshot>({
    channel: 'CH 03',
    lcdLine: 'STANDBY',
    subtitle: null,
    transmitting: false,
    errorFlash: false,
    weakBlink: false,
    signalBars: 2,
    jolting: false,
  });

  useEffect(() => {
    return radioEngine.subscribe(setSnap);
  }, []);

  if (!visible) return null;

  const handleTap = () => {
    if (onReplay) {
      onReplay();
    } else {
      radioEngine.replayLast();
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-[104px] sm:bottom-4 right-1.5 sm:right-3.5 z-[35] flex items-end gap-2">
      {/* 3-second Typed Paper Subtitle Slip beside Walkie-Talkie */}
      {snap.subtitle && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 max-w-[180px] sm:max-w-[220px] bg-[#e6e1d3] text-[#15171a] border border-[#8a8576] px-2.5 py-1.5 shadow-[3px_6px_14px_rgba(0,0,0,0.75)] -rotate-1 font-tech text-xs leading-snug"
        >
          {snap.subtitle}
        </div>
      )}

      {/* Yellow/Black Walkie-Talkie (Image 1) tilted -12deg */}
      <button
        type="button"
        onClick={handleTap}
        aria-label="Stație radio portabilă: repetă ultimul mesaj"
        className="pointer-events-auto relative w-[82px] sm:w-[132px] min-h-[44px] cursor-pointer select-none transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[#ffd9a0]"
        style={{ transform: `rotate(-12deg) ${snap.jolting ? 'translateY(-6px)' : ''}` }}
      >
        {/* Stubby Black Antenna */}
        <div
          aria-hidden="true"
          className="ml-3 w-2.5 sm:w-4 h-4 sm:h-9 bg-gradient-to-r from-[#232527] via-[#17181a] to-[#0a0b0c] border-x border-[#3a3c3e] rounded-t-sm shadow-md"
        />

        {/* Rugged Yellow + Black Rubberized Body */}
        <div className="relative bg-[#17181a] border-2 border-[#08090a] rounded-[6px] p-1 sm:p-1.5 shadow-[8px_14px_24px_rgba(0,0,0,0.88)]">
          {/* Side PTT Grip Bump */}
          <span
            aria-hidden="true"
            className="absolute -left-1.5 top-8 w-1.5 h-7 bg-[#c0281c] border border-black rounded-l-sm"
          />

          {/* Top Status LED (Red when transmitting or error, Green standby) */}
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="font-tech text-[9px] text-[#bdb6a4]">UHF</span>
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full border border-black ${
                snap.errorFlash || snap.transmitting
                  ? 'bg-[#ff3b2a] shadow-[0_0_6px_#ff3b2a]'
                  : 'bg-[#3ddc84] shadow-[0_0_5px_#3ddc84]'
              }`}
            />
          </div>

          {/* Yellow Faceplate (#f1c40f) with subtle top-left warm rim & scuffs */}
          <div
            className="relative bg-[#f1c40f] border border-[#9c7d08] rounded-[3px] p-1.5 sm:p-2"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(255, 244, 198, 0.35) 0%, transparent 45%, rgba(0, 0, 0, 0.16) 100%)',
            }}
          >
            {/* Green Backlit Pixel LCD (#1b2a12 / #9be15d) */}
            <div
              className="bg-[#1b2a12] border border-[#0c1408] px-1.5 py-1 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.85)] text-left"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 2px), repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 2px)',
              }}
            >
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-lcd leading-none text-[#9be15d]">
                <span>{snap.channel}</span>
                {/* Signal Bars */}
                <span className="flex items-end gap-[2px] h-2.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((b) => (
                    <span
                      key={b}
                      className={`w-[2px] ${
                        b <= snap.signalBars ? 'bg-[#9be15d]' : 'bg-[#2a3f1d]'
                      }`}
                      style={{ height: `${b * 2.2 + 1.5}px` }}
                    />
                  ))}
                </span>
              </div>
              <p
                className={`mt-0.5 font-lcd text-[13px] sm:text-sm leading-none truncate ${
                  snap.errorFlash ? 'text-[#ff3b2a]' : 'text-[#9be15d]'
                }`}
              >
                {snap.lcdLine || '\u00A0'}
              </p>
              {snap.weakBlink && (
                <p className="mt-0.5 font-lcd text-[11px] leading-none text-[#9be15d] det-cursor-blink">
                  SEMNAL SLAB
                </p>
              )}
            </div>

            {/* 3x4 Gray Rubber Keypad */}
            <div aria-hidden="true" className="grid grid-cols-3 gap-0.5 sm:gap-1 mt-1 sm:mt-1.5 px-0.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="h-1 sm:h-2 bg-[#5c6066] border-b border-[#25272a] rounded-[1px]"
                />
              ))}
            </div>

            {/* Speaker Louver Slots */}
            <div aria-hidden="true" className="mt-1 sm:mt-1.5 space-y-[2px] px-1">
              <div className="h-[2px] bg-[#17181a]/75 rounded-full" />
              <div className="h-[2px] bg-[#17181a]/75 rounded-full" />
              <div className="h-[2px] bg-[#17181a]/75 rounded-full" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};
