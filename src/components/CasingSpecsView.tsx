import React from 'react';
import type { BombCasing, PortType } from '../game/types';

interface CasingSpecsViewProps {
  casing: BombCasing;
}

const PortSvg: React.FC<{ type: PortType }> = ({ type }) => {
  if (type === 'parallel') {
    // 25-pin pink/violet rectangular connector (2 rows: 13 top, 12 bottom)
    return (
      <svg
        viewBox="0 0 180 54"
        className="w-44 h-14"
        role="img"
        aria-label="Conector dreptunghiular roz-violet cu 25 pini pe două rânduri"
      >
        <rect x="2" y="4" width="176" height="46" rx="8" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
        <circle cx="14" cy="27" r="4" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
        <circle cx="166" cy="27" r="4" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
        <polygon points="26,12 154,12 148,42 32,42" fill="#a21caf" stroke="#f0abfc" strokeWidth="1.5" />
        {Array.from({ length: 13 }).map((_, i) => (
          <circle key={`t-${i}`} cx={36 + i * 9} cy={22} r="1.8" fill="#fef08a" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <circle key={`b-${i}`} cx={40.5 + i * 9} cy={32} r="1.8" fill="#fef08a" />
        ))}
      </svg>
    );
  }

  if (type === 'serial') {
    // 9-pin shorter trapezoidal teal/blue port
    return (
      <svg viewBox="0 0 110 50" className="w-28 h-12" role="img" aria-label="Conector 9 pini">
        <rect x="2" y="4" width="106" height="42" rx="7" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
        <polygon points="22,12 88,12 82,38 28,38" fill="#0f766e" stroke="#5eead4" strokeWidth="1.3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <circle key={`st-${i}`} cx={34 + i * 10} cy={20} r="1.8" fill="#fde68a" />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <circle key={`sb-${i}`} cx={39 + i * 10} cy={30} r="1.8" fill="#fde68a" />
        ))}
      </svg>
    );
  }

  if (type === 'dvid') {
    return (
      <svg viewBox="0 0 120 50" className="w-30 h-12" role="img" aria-label="Conector video alb cu matrice">
        <rect x="4" y="6" width="112" height="38" rx="5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
        <rect x="16" y="12" width="88" height="26" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" />
        {Array.from({ length: 8 }).map((_, c) =>
          [0, 1, 2].map((r) => (
            <rect key={`${c}-${r}`} x={24 + c * 8} y={16 + r * 6} width="3" height="3" fill="#0f172a" />
          ))
        )}
        <rect x="92" y="23" width="8" height="3" fill="#0f172a" />
      </svg>
    );
  }

  if (type === 'rj45') {
    return (
      <svg viewBox="0 0 64 54" className="w-16 h-14" role="img" aria-label="Port rețea modular">
        <rect x="6" y="6" width="52" height="42" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
        <path d="M16 14h32v20h-8v6h-16v-6h-8z" fill="#020617" stroke="#475569" />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={20 + i * 4.2} y="14" width="2" height="8" fill="#fbbf24" />
        ))}
      </svg>
    );
  }

  if (type === 'ps2') {
    return (
      <svg viewBox="0 0 54 54" className="w-14 h-14" role="img" aria-label="Port circular 6 pini">
        <circle cx="27" cy="27" r="22" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="27" cy="27" r="15" fill="#4c1d95" stroke="#c4b5fd" strokeWidth="1.2" />
        <rect x="24" y="15" width="6" height="4" fill="#020617" />
        <circle cx="20" cy="24" r="1.6" fill="#020617" />
        <circle cx="34" cy="24" r="1.6" fill="#020617" />
        <circle cx="19" cy="31" r="1.6" fill="#020617" />
        <circle cx="35" cy="31" r="1.6" fill="#020617" />
      </svg>
    );
  }

  // RCA dual jacks
  return (
    <svg viewBox="0 0 84 48" className="w-20 h-12" role="img" aria-label="Mufe RCA audio">
      <rect x="4" y="6" width="76" height="36" rx="5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
      <circle cx="26" cy="24" r="11" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="26" cy="24" r="5" fill="#020617" />
      <circle cx="58" cy="24" r="11" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
      <circle cx="58" cy="24" r="5" fill="#020617" />
    </svg>
  );
};

export const CasingSpecsView: React.FC<CasingSpecsViewProps> = ({ casing }) => {
  return (
    <div className="space-y-4">
      {/* Serial Number Engraved Plate */}
      <section className="hw-chassis rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
          <div>
            <p className="font-tech text-[11px] text-amber-400">ANEXĂ HARDWARE · SERIE</p>
            <h2 className="font-display text-lg font-bold text-slate-100">
              Plăcuță Număr de Serie
            </h2>
          </div>
          <span className="hw-led-dome w-3.5 h-3.5 hw-led-amber" aria-hidden="true" />
        </div>

        <div className="hw-nameplate rounded-lg py-4 px-5 flex flex-col items-center justify-center">
          <span className="font-tech text-[10px] tracking-[0.28em] text-slate-400 mb-1">
            SERIAL NO. / UNITATE TACTICĂ
          </span>
          <span
            data-testid="casing-serial"
            className="font-lcd text-3xl sm:text-4xl tracking-[0.22em] text-amber-200 select-all"
          >
            {casing.serialNumber}
          </span>
        </div>
      </section>

      {/* Visual Battery Bay (AA Pairs & D Cells) */}
      <section className="hw-chassis rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
          <div>
            <p className="font-tech text-[11px] text-amber-400">ALIMENTARE · CELULE</p>
            <h2 className="font-display text-lg font-bold text-slate-100">
              Compartiment Baterii
            </h2>
          </div>
          <span className="font-tech text-xs text-slate-400" data-testid="casing-battery-summary">
            {casing.aaPairs === 0 && casing.dCells === 0
              ? '0 celule montate'
              : 'Inspectează vizual celulele'}
          </span>
        </div>

        <div className="hw-carbon-bay rounded-lg p-4 border border-slate-800 min-h-[112px] flex flex-wrap items-center justify-center gap-4">
          {casing.aaPairs === 0 && casing.dCells === 0 && (
            <p className="font-tech text-xs text-slate-500">
              Compartiment gol — alimentare exclusiv pe condensator intern.
            </p>
          )}

          {/* AA Battery Pairs */}
          {Array.from({ length: casing.aaPairs }).map((_, pairIdx) => (
            <div
              key={`aa-${pairIdx}`}
              aria-label="Pereche 2 baterii AA"
              className="rounded-lg bg-slate-900/90 border border-slate-700 p-2 flex items-center gap-1.5 shadow-inner"
            >
              {[0, 1].map((cell) => (
                <div key={cell} className="flex flex-col items-center">
                  <div className="w-2.5 h-1.5 bg-amber-300 rounded-t-sm" />
                  <div className="w-5 h-16 rounded-b-sm bg-gradient-to-b from-amber-500 via-amber-600 to-zinc-900 border border-amber-400/30 flex flex-col items-center justify-between py-1">
                    <span className="font-tech text-[8px] font-bold text-slate-950">+</span>
                    <span className="font-tech text-[8px] font-bold text-amber-200">AA</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* D Cells */}
          {Array.from({ length: casing.dCells }).map((_, dIdx) => (
            <div
              key={`d-${dIdx}`}
              aria-label="Baterie mare tip D"
              className="rounded-lg bg-slate-900/90 border border-slate-700 p-2 flex items-center justify-center shadow-inner"
            >
              <div className="flex flex-col items-center">
                <div className="w-4 h-2 bg-slate-300 rounded-t-sm" />
                <div className="w-10 h-16 rounded-b-sm bg-gradient-to-b from-sky-600 via-sky-800 to-slate-950 border border-sky-400/40 flex flex-col items-center justify-between py-1">
                  <span className="font-tech text-[10px] font-bold text-white">+</span>
                  <span className="font-tech text-[10px] font-bold text-sky-200">1.5V D</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connector Port Plate */}
      <section className="hw-chassis rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
          <div>
            <p className="font-tech text-[11px] text-amber-400">MAGISTRALĂ I/O · LATERAL</p>
            <h2 className="font-display text-lg font-bold text-slate-100">
              Placă Conectori
            </h2>
          </div>
          <span className="font-tech text-[11px] text-slate-400">
            Compară cu Anexa Tehnică
          </span>
        </div>

        <div
          data-testid="casing-ports"
          data-has-parallel={casing.hasParallelPort ? 'true' : 'false'}
          className="hw-carbon-bay rounded-lg p-4 border border-slate-800 flex flex-wrap items-center justify-center gap-4"
        >
          {casing.ports.map((p, idx) => (
            <div
              key={`${p}-${idx}`}
              className="rounded-lg bg-slate-900/80 border border-slate-800 p-2 shadow-inner"
            >
              <PortSvg type={p} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
