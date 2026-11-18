import React from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import type { MissionMetaItem, ModuleStatus } from '../game/types';

interface ModuleCardShellProps {
  meta: MissionMetaItem;
  status: ModuleStatus;
  strikePulse: boolean;
  justSolved: boolean;
  children: React.ReactNode;
}

const HexScrew: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 16 16"
    className={`w-3.5 h-3.5 text-slate-500 pointer-events-none ${className}`}
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="7" fill="#1e2530" stroke="#475569" strokeWidth="1" />
    <circle cx="8" cy="8" r="5" fill="#2d3748" />
    <path d="M5 8h6M8 5v6" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const ModuleCardShell: React.FC<ModuleCardShellProps> = ({
  meta,
  status,
  strikePulse,
  justSolved,
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
    status === 'solved' ? 'DEZAMORSAT' : status === 'active' ? 'ACTIV' : 'BLOCAT';

  return (
    <section
      data-testid={`module-card-${meta.id}`}
      data-status={status}
      className={`hw-chassis relative rounded-xl p-4 sm:p-5 transition-all duration-200 ${
        status === 'solved'
          ? 'border-emerald-500/45'
          : status === 'active'
            ? 'border-amber-500/35'
            : 'opacity-75 border-slate-800'
      }`}
    >
      {/* Corner Hex Screws */}
      <HexScrew className="absolute top-2 left-2" />
      <HexScrew className="absolute top-2 right-2" />
      <HexScrew className="absolute bottom-2 left-2" />
      <HexScrew className="absolute bottom-2 right-2" />

      {/* Header Strip */}
      <div className="flex items-start justify-between gap-3 px-2 pt-0.5 pb-3 border-b border-slate-800/90">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-tech text-slate-400">
            <span className="text-amber-400 font-bold">{meta.code}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{meta.stageLabel}</span>
          </div>
          <h2 className="font-display text-lg font-bold tracking-wide text-slate-100 mt-0.5">
            {meta.title}
          </h2>
          <p className="text-xs text-slate-400">{meta.subtitle}</p>
        </div>

        {/* Physical Glass Status LED */}
        <div className="flex flex-col items-end gap-1 pr-2 shrink-0">
          <div
            aria-label={`Stare modul ${meta.id}: ${statusText}`}
            className={`hw-led-dome w-5 h-5 ${ledClass}`}
          />
          <span
            className={`font-tech text-[10px] tracking-wider ${
              status === 'solved'
                ? 'text-emerald-400'
                : strikePulse
                  ? 'text-red-400'
                  : status === 'active'
                    ? 'text-amber-400'
                    : 'text-slate-500'
            }`}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Module Body */}
      <div className="mt-3 relative">
        {status === 'locked' ? (
          <div className="hw-carbon-bay rounded-lg px-4 py-7 flex flex-col items-center justify-center text-center border border-slate-800/80">
            <div className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700 flex items-center justify-center mb-2.5">
              <Lock className="w-5 h-5 text-slate-500" aria-hidden="true" />
            </div>
            <p className="font-display text-sm font-semibold text-slate-300">
              Compartiment Sigilat
            </p>
            <p className="font-tech text-xs text-slate-500 mt-1">
              Rezolvă modulul anterior pentru a debloca acest panou.
            </p>
          </div>
        ) : (
          <div className={status === 'solved' ? 'opacity-80 pointer-events-none select-none' : ''}>
            {children}
          </div>
        )}

        {/* Solved Decryption Banner */}
        {status === 'solved' && (
          <div
            className={`mt-3 rounded-lg border border-emerald-500/50 bg-emerald-950/75 px-3 py-2 flex items-center justify-between gap-2 ${
              justSolved ? 'ring-2 ring-emerald-400/60' : ''
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-tech text-[11px] font-bold text-emerald-300 tracking-wide">
                  DECRIPTARE REUȘITĂ — COORDONATE ACTUALIZATE
                </p>
                <p className="text-[11px] text-emerald-200/80 truncate">{meta.unlockHint}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
