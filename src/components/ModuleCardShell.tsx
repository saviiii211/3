import React, { useEffect, useRef, useState } from 'react';
import type { MissionMetaItem, ModuleStatus } from '../game/types';

interface ModuleCardShellProps {
  meta: MissionMetaItem;
  status: ModuleStatus;
  strikePulse: boolean;
  justSolved: boolean;
  isFocused?: boolean;
  onInspect?: () => void;
  children: React.ReactNode;
}

/**
 * Phillips cross-head machined screw (kept exported as SlottedScrew for VictoryScreen/AdminModal compatibility).
 */
export const SlottedScrew: React.FC<{ className?: string; angle?: number }> = ({
  className = '',
  angle = 22,
}) => (
  <svg
    viewBox="0 0 18 18"
    className={`w-3.5 h-3.5 pointer-events-none select-none ${className}`}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="phillipsHead" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#949691" />
        <stop offset="58%" stopColor="#4f524e" />
        <stop offset="100%" stopColor="#1b1d1c" />
      </radialGradient>
    </defs>
    <circle cx="9.6" cy="9.8" r="7.3" fill="rgba(0,0,0,0.52)" />
    <circle cx="9" cy="9" r="7" fill="url(#phillipsHead)" stroke="#242625" strokeWidth="0.9" />
    <circle cx="9" cy="9" r="5.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />
    <g transform={`rotate(${angle} 9 9)`}>
      <rect x="4.1" y="7.9" width="9.8" height="2.2" rx="0.4" fill="#111314" />
      <rect x="7.9" y="4.1" width="2.2" height="9.8" rx="0.4" fill="#111314" />
    </g>
  </svg>
);

const TILT_DEG = [-1.1, 0.9, -0.7, 1.2, -0.9, 0.8, -1.0];

export const ModuleCardShell: React.FC<ModuleCardShellProps> = ({
  meta,
  status,
  strikePulse,
  justSolved,
  isFocused = false,
  onInspect,
  children,
}) => {
  const prevStatusRef = useRef<ModuleStatus>(status);
  const [rippingSeal, setRippingSeal] = useState(false);

  // Trigger 600ms seal-tearing animation whenever module transitions from locked -> active
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev === 'locked' && status !== 'locked') {
      setRippingSeal(true);
      const t = window.setTimeout(() => setRippingSeal(false), 620);
      return () => window.clearTimeout(t);
    }
  }, [status]);

  const ledClass =
    status === 'solved'
      ? 'hw-led-green'
      : strikePulse
        ? 'hw-led-red-pulse'
        : status === 'active'
          ? 'hw-led-amber'
          : 'hw-led-off';

  const statusText =
    status === 'solved' ? 'DEZAMORSAT' : status === 'active' ? 'ACTIV' : 'SIGILAT';

  const dymoTilt = TILT_DEG[(meta.id - 1) % TILT_DEG.length];

  return (
    <section
      data-testid={`module-card-${meta.id}`}
      data-status={status}
      className={`det-ivory-plate relative transition-all duration-200 ${
        isFocused
          ? 'p-3.5 sm:p-4 brightness-[1.03]'
          : 'p-2.5 sm:p-3 h-full flex flex-col overflow-hidden'
      } ${
        status === 'active'
          ? 'ring-2 ring-[#e89b2d]/45 brightness-[1.03]'
          : status === 'solved'
            ? 'ring-2 ring-[#166534]/55'
            : strikePulse
              ? 'ring-2 ring-[#c0281c]'
              : ''
      }`}
    >
      {/* Subtle engraved border & physical wear scratches */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-1.5 border border-[#15171a]/15"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 240 160"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-20"
      >
        <line x1="16" y1="26" x2="38" y2="29" stroke="#15171a" strokeWidth="0.6" />
        <line x1="185" y1="138" x2="218" y2="132" stroke="#15171a" strokeWidth="0.5" />
      </svg>

      {/* 4 Worn Phillips Screws in Corners at varied angles */}
      <SlottedScrew className="absolute top-1.5 left-1.5" angle={14 + meta.id * 11} />
      <SlottedScrew className="absolute top-1.5 right-1.5" angle={-36 - meta.id * 9} />
      <SlottedScrew className="absolute bottom-1.5 left-1.5" angle={62 + meta.id * 7} />
      <SlottedScrew className="absolute bottom-1.5 right-1.5" angle={-18 + meta.id * 13} />

      {/* Top Silkscreen Header: Slightly Crooked Navy Dymo Label + Metal-Ring Status Lamp */}
      <div
        className={`relative z-10 shrink-0 border-b border-[#15171a]/25 ${
          isFocused ? 'px-2.5 pt-0.5 pb-2' : 'px-2 pt-0.5 pb-1.5'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="det-dymo-label px-2 py-0.5 text-[10px] font-bold shrink-0"
            style={{ transform: `rotate(${dymoTilt}deg)` }}
          >
            {meta.code}
          </span>

          {/* Physical Glass Lamp in Metal Collar */}
          <div className="flex items-center gap-1.5 pr-2 shrink-0">
            <span
              className={`font-tech text-[10px] font-bold tracking-wider ${
                status === 'solved'
                  ? 'text-[#166534]'
                  : strikePulse
                    ? 'text-[#c0281c]'
                    : status === 'active'
                      ? 'text-[#8c4f08]'
                      : 'text-[#525458]'
              }`}
            >
              {statusText}
            </span>
            <div
              aria-label={`Stare modul ${meta.id}: ${statusText}`}
              className={`hw-led-dome w-3.5 h-3.5 ${ledClass}`}
            />
          </div>
        </div>

        <h2
          className={`font-display font-bold text-[#15171a] mt-1 ${
            isFocused
              ? 'text-base sm:text-lg truncate'
              : 'text-[12.5px] sm:text-[13px] leading-tight whitespace-nowrap'
          }`}
        >
          {meta.title}
        </h2>
      </div>

      {/* Recessed Module Compartment */}
      <div
        className={`relative z-10 ${
          isFocused ? 'mt-2.5' : 'mt-2 flex-1 min-h-0 flex flex-col overflow-hidden'
        }`}
      >
        {status === 'locked' ? (
          <div
            className={`relative overflow-hidden bg-gradient-to-b from-[#2f3337] via-[#222528] to-[#17191b] border-2 border-[#0e1011] shadow-[inset_2px_3px_10px_rgba(0,0,0,0.72)] px-3 flex flex-col items-center justify-center text-center ${
              isFocused ? 'py-10' : 'flex-1 py-4'
            }`}
          >
            {/* 2 Steel Cover Bolts */}
            <SlottedScrew className="absolute top-2 left-2.5 scale-90" angle={42} />
            <SlottedScrew className="absolute bottom-2 right-2.5 scale-90" angle={-28} />

            {/* Diagonal White Paper Seal Tape ("SIGILAT · NU DESCHIDE") */}
            <div
              aria-hidden="true"
              className="det-seal-tape pointer-events-none px-8 py-0.5 font-display text-[10px] font-bold tracking-[0.14em] -rotate-6 mb-2 select-none"
            >
              SIGILAT · NU DESCHIDE
            </div>

            <p className="relative z-10 font-tech text-[11px] font-bold tracking-wider text-[#eceae2] uppercase">
              Compartiment Sigilat
            </p>
            <p className="relative z-10 font-tech text-[10px] text-[#bdb6a4] mt-1 max-w-[230px] leading-snug">
              Rezolvă modulul anterior pentru a decupla zăvorul.
            </p>
          </div>
        ) : (
          <div
            className={`relative ${isFocused ? '' : 'flex-1 min-h-0 overflow-hidden'} ${
              status === 'solved' ? 'opacity-85 pointer-events-none select-none' : ''
            }`}
          >
            {children}

            {/* 600ms Seal Rip Overlay on Unlock Transition */}
            {rippingSeal && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
              >
                <div className="det-seal-tape det-seal-ripping px-8 py-1 font-display text-xs font-bold tracking-[0.16em]">
                  SIGILAT · RUPT
                </div>
              </div>
            )}

            {/* Green Rubber Stamp "DEZAMORSAT" on Solved Plate */}
            {status === 'solved' && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
              >
                <div className="det-rubber-stamp bg-[#e6e1d3]/65 text-xs sm:text-sm">
                  DEZAMORSAT
                </div>
              </div>
            )}
          </div>
        )}

        {/* Typed Evidence Note taped below plate when Solved */}
        {status === 'solved' && (
          <div
            className={`${
              isFocused ? 'mt-2.5 px-3 py-1.5' : 'mt-1.5 px-2 py-1 shrink-0'
            } relative bg-[#f3eedf] border border-[#8a8576] shadow-sm flex items-center gap-1.5 ${
              justSolved ? 'ring-2 ring-[#3ddc84]' : ''
            }`}
          >
            {/* Tiny adhesive tape accent */}
            <span
              aria-hidden="true"
              className="w-2.5 h-3.5 bg-[#d9cfab]/80 border border-[#8a8576]/40 shrink-0 -rotate-6"
            />
            <p className="font-tech text-[10px] font-bold text-[#166534] tracking-wide truncate">
              {isFocused ? 'DECRIPTARE REUȘITĂ — COORDONATE ACTUALIZATE' : 'DECRIPTAT ✓'}
            </p>
          </div>
        )}

        {/* Overview Mode Click-to-Zoom Overlay */}
        {!isFocused && onInspect && (
          <button
            type="button"
            onClick={onInspect}
            aria-label={`Deschide și focalizează modulul ${meta.code}: ${meta.title}`}
            className="group absolute inset-0 z-20 cursor-pointer rounded-[2px] bg-transparent hover:bg-[#ffd9a0]/[0.08] focus-visible:outline-2 focus-visible:outline-[#ffd9a0] transition-colors flex items-end justify-end p-2"
          >
            <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity det-dymo-label px-2 py-0.5 text-[10px] font-bold">
              {status === 'locked' ? 'INSPECTEAZĂ' : 'FOCALIZEAZĂ'}
            </span>
          </button>
        )}
      </div>
    </section>
  );
};
