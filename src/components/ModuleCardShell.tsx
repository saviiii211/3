import React from 'react';
import { Check, Lock } from 'lucide-react';
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
      <radialGradient id="screwHead" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#6b7075" />
        <stop offset="55%" stopColor="#35383c" />
        <stop offset="100%" stopColor="#141618" />
      </radialGradient>
    </defs>
    <circle cx="9.6" cy="9.8" r="7.4" fill="rgba(0,0,0,0.68)" />
    <circle cx="9" cy="9" r="7.2" fill="url(#screwHead)" stroke="#1b1d20" strokeWidth="1" />
    <circle cx="9" cy="9" r="5.6" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" />
    <g transform={`rotate(${angle} 9 9)`}>
      <rect x="2.6" y="7.9" width="12.8" height="2.2" rx="0.5" fill="#090a0b" />
      <line x1="3" y1="7.8" x2="15" y2="7.8" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" />
    </g>
  </svg>
);

export const ModuleCardShell: React.FC<ModuleCardShellProps> = ({
  meta,
  status,
  strikePulse,
  justSolved,
  isFocused = false,
  onInspect,
  children,
}) => {
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

  return (
    <section
      data-testid={`module-card-${meta.id}`}
      data-status={status}
      className={`chassis-plate metal-micrograin relative transition-colors duration-200 ${
        isFocused
          ? 'p-3.5 sm:p-4'
          : 'p-2.5 sm:p-3 h-full flex flex-col overflow-hidden'
      } ${
        status === 'solved'
          ? 'ring-1 ring-emerald-700/60'
          : strikePulse
            ? 'ring-1 ring-red-600/80'
            : status === 'active'
              ? 'ring-1 ring-amber-700/45'
              : 'opacity-85'
      }`}
    >
      {/* 4 Worn Slotted Screws in Corners */}
      <SlottedScrew className="absolute top-2 left-2" angle={18} />
      <SlottedScrew className="absolute top-2 right-2" angle={-34} />
      <SlottedScrew className="absolute bottom-2 left-2" angle={64} />
      <SlottedScrew className="absolute bottom-2 right-2" angle={-14} />

      {/* Top Metal Header Strip: Riveted Brass Code Plaque + Physical Status LED + Title */}
      <div
        className={`shrink-0 border-b border-black/70 shadow-[0_1px_0_rgba(255,255,255,0.06)] ${
          isFocused ? 'px-2.5 pt-0.5 pb-2' : 'px-2 pt-0.5 pb-1.5'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="brass-plaque px-2 py-0.5 font-tech text-[10px] font-bold tracking-wider text-amber-100 shrink-0">
            {meta.code}
          </span>

          {/* Machined Collar Glass Status LED */}
          <div className="flex items-center gap-1.5 pr-2 shrink-0">
            <span
              className={`font-tech text-[9px] tracking-wider ${
                status === 'solved'
                  ? 'text-emerald-400'
                  : strikePulse
                    ? 'text-red-400'
                    : status === 'active'
                      ? 'text-amber-400'
                      : 'text-stone-500'
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
          className={`font-display font-bold tracking-wide text-stone-200 mt-1 ${
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
        className={`relative ${
          isFocused ? 'mt-2.5' : 'mt-2 flex-1 min-h-0 flex flex-col overflow-hidden'
        }`}
      >
        {status === 'locked' ? (
          <div
            className={`recessed-bay px-3 flex flex-col items-center justify-center text-center relative overflow-hidden ${
              isFocused ? 'py-8' : 'flex-1 py-4'
            }`}
          >
            {/* Riveted steel blast-hatch crossbars */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-gradient-to-b from-stone-800/40 to-black/60 border-y border-stone-700/30"
            />
            <div className="relative z-10 w-9 h-9 rounded-[2px] bakelite-surface flex items-center justify-center mb-1.5">
              <Lock className="w-4 h-4 text-stone-400" aria-hidden="true" />
            </div>
            <p className="relative z-10 font-tech text-[11px] font-bold tracking-widest text-stone-300 uppercase">
              Compartiment Sigilat
            </p>
            <p className="relative z-10 font-tech text-[10px] text-stone-500 mt-1 max-w-[230px] leading-snug">
              Rezolvă modulul anterior pentru a decupla zăvorul.
            </p>
          </div>
        ) : (
          <div
            className={`${isFocused ? '' : 'flex-1 min-h-0 overflow-hidden'} ${
              status === 'solved' ? 'opacity-80 pointer-events-none select-none' : ''
            }`}
          >
            {children}
          </div>
        )}

        {/* Solved Phosphor Strip */}
        {status === 'solved' && (
          <div
            className={`${
              isFocused ? 'mt-2.5 px-3 py-1.5' : 'mt-1.5 px-2 py-1 shrink-0'
            } rounded-[2px] border border-emerald-700/70 bg-emerald-950/90 flex items-center gap-1.5 shadow-inner ${
              justSolved ? 'ring-1 ring-emerald-400' : ''
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <p className="font-tech text-[10px] font-bold text-emerald-300 tracking-wide truncate">
              {isFocused ? 'DECRIPTARE REUȘITĂ — COORDONATE ACTUALIZATE' : 'DECRIPTAT ✓'}
            </p>
          </div>
        )}

        {/* Overview Mode Click-to-Zoom Overlay (prevents accidental tiny misclicks while zoomed out) */}
        {!isFocused && onInspect && (
          <button
            type="button"
            onClick={onInspect}
            aria-label={`Deschide și focalizează modulul ${meta.code}: ${meta.title}`}
            className="group absolute inset-0 z-20 cursor-pointer rounded-[2px] bg-transparent hover:bg-amber-500/[0.06] focus-visible:outline-2 focus-visible:outline-amber-400 transition-colors flex items-end justify-end p-2"
          >
            <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity brass-plaque px-2 py-0.5 font-tech text-[10px] font-bold text-amber-100 tracking-wider">
              {status === 'locked' ? 'INSPECTEAZĂ' : 'FOCALIZEAZĂ'}
            </span>
          </button>
        )}
      </div>
    </section>
  );
};
