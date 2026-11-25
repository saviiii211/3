import React from 'react';
import { X } from 'lucide-react';
import type { BombCasing, PortType } from '../game/types';
import { SlottedScrew } from './ModuleCardShell';

interface CasingHardwareProps {
  casing: BombCasing;
  compact?: boolean;
  includeTestIds?: boolean;
}

const PORT_LABEL: Record<PortType, string> = {
  parallel: 'PARALEL 25P',
  serial: 'SERIAL 9P',
  dvid: 'DVI-D',
  rj45: 'RJ45',
  ps2: 'PS/2',
  rca: 'RCA AUDIO',
};

export const PortSvg: React.FC<{ type: PortType; compact?: boolean }> = ({
  type,
  compact = false,
}) => {
  const scaleCls = compact ? 'scale-90 origin-center' : '';

  const renderGraphic = () => {
    if (type === 'parallel') {
      // 25-pin pink/violet rectangular connector (2 rows: 13 top, 12 bottom)
      return (
        <svg
          viewBox="0 0 180 54"
          className={`w-40 h-12 ${scaleCls}`}
          role="img"
          aria-label="Conector dreptunghiular roz-violet cu 25 pini pe două rânduri"
        >
          <rect x="2" y="4" width="176" height="46" rx="3" fill="#3a3d42" stroke="#181a1d" strokeWidth="2" />
          <circle cx="14" cy="27" r="4.5" fill="#101214" stroke="#686d73" strokeWidth="1" />
          <line x1="11" y1="27" x2="17" y2="27" stroke="#050506" strokeWidth="1.5" />
          <circle cx="166" cy="27" r="4.5" fill="#101214" stroke="#686d73" strokeWidth="1" />
          <line x1="163" y1="24" x2="169" y2="30" stroke="#050506" strokeWidth="1.5" />
          <polygon points="26,12 154,12 148,42 32,42" fill="#9d1766" stroke="#f0abfc" strokeWidth="1.3" />
          {Array.from({ length: 13 }).map((_, i) => (
            <circle key={`t-${i}`} cx={36 + i * 9} cy={22} r="1.8" fill="#fde047" />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <circle key={`b-${i}`} cx={40.5 + i * 9} cy={32} r="1.8" fill="#fde047" />
          ))}
        </svg>
      );
    }

    if (type === 'serial') {
      return (
        <svg viewBox="0 0 110 50" className={`w-26 h-11 ${scaleCls}`} role="img" aria-label="Conector 9 pini">
          <rect x="2" y="4" width="106" height="42" rx="3" fill="#33363b" stroke="#15171a" strokeWidth="2" />
          <circle cx="12" cy="25" r="3.5" fill="#111315" stroke="#5b6068" strokeWidth="1" />
          <circle cx="98" cy="25" r="3.5" fill="#111315" stroke="#5b6068" strokeWidth="1" />
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
        <svg viewBox="0 0 120 50" className={`w-28 h-11 ${scaleCls}`} role="img" aria-label="Conector video alb cu matrice">
          <rect x="4" y="6" width="112" height="38" rx="2" fill="#23262b" stroke="#0d0e10" strokeWidth="2" />
          <rect x="16" y="12" width="88" height="26" rx="2" fill="#d6d3cd" stroke="#78716c" strokeWidth="1.2" />
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
        <svg viewBox="0 0 64 54" className={`w-14 h-12 ${scaleCls}`} role="img" aria-label="Port rețea modular">
          <rect x="6" y="6" width="52" height="42" rx="2" fill="#1e2024" stroke="#0b0c0e" strokeWidth="2" />
          <path d="M16 14h32v20h-8v6h-16v-6h-8z" fill="#050607" stroke="#475569" />
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={i} x={20 + i * 4.2} y="14" width="2" height="8" fill="#eab308" />
          ))}
        </svg>
      );
    }

    if (type === 'ps2') {
      return (
        <svg viewBox="0 0 54 54" className={`w-12 h-12 ${scaleCls}`} role="img" aria-label="Port circular 6 pini">
          <circle cx="27" cy="27" r="22" fill="#2f3237" stroke="#0d0e10" strokeWidth="2" />
          <circle cx="27" cy="27" r="15" fill="#4c1d95" stroke="#c4b5fd" strokeWidth="1.2" />
          <rect x="24" y="15" width="6" height="4" fill="#020617" />
          <circle cx="20" cy="24" r="1.6" fill="#020617" />
          <circle cx="34" cy="24" r="1.6" fill="#020617" />
          <circle cx="19" cy="31" r="1.6" fill="#020617" />
          <circle cx="35" cy="31" r="1.6" fill="#020617" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 84 48" className={`w-18 h-11 ${scaleCls}`} role="img" aria-label="Mufe RCA audio">
        <rect x="4" y="6" width="76" height="36" rx="2" fill="#1c1e22" stroke="#0b0c0e" strokeWidth="2" />
        <circle cx="26" cy="24" r="11" fill="#d6d3cd" stroke="#78716c" strokeWidth="1.5" />
        <circle cx="26" cy="24" r="5" fill="#050506" />
        <circle cx="58" cy="24" r="11" fill="#b91c1c" stroke="#fca5a5" strokeWidth="1.5" />
        <circle cx="58" cy="24" r="5" fill="#050506" />
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {renderGraphic()}
      <span className="font-tech text-[9px] font-bold tracking-wider text-[#eceae2]">
        {PORT_LABEL[type]}
      </span>
    </div>
  );
};

// Deterministic barcode stripe widths
const BAR_PATTERN = [2, 1, 3, 1, 2, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 2, 1, 2, 3, 1, 2];

export const SerialBrassPlate: React.FC<CasingHardwareProps> = ({
  casing,
  compact = false,
  includeTestIds = false,
}) => (
  <div
    className={`relative bg-[#f3f0e6] text-[#15171a] border border-[#8a8576] shadow-[2px_4px_10px_rgba(0,0,0,0.65)] -rotate-[0.8deg] flex flex-col items-center justify-center ${
      compact ? 'px-3 py-2' : 'px-5 py-4'
    }`}
  >
    {/* Masking tape corners holding paper sticker */}
    <span
      aria-hidden="true"
      className="absolute -top-1.5 left-2 w-6 h-2.5 bg-[#d4c8a1]/85 border border-[#8a8576]/40 -rotate-12"
    />
    <span
      aria-hidden="true"
      className="absolute -bottom-1.5 right-2 w-6 h-2.5 bg-[#d4c8a1]/85 border border-[#8a8576]/40 -rotate-6"
    />

    <span className="font-tech text-[9px] font-bold tracking-[0.22em] text-[#3a382f] uppercase">
      SERIAL NO.
    </span>

    {/* Printed Barcode */}
    <svg
      viewBox="0 0 116 18"
      className={`${compact ? 'w-28 h-3.5' : 'w-44 h-5'} my-1`}
      aria-hidden="true"
    >
      {BAR_PATTERN.reduce<{ x: number; els: React.ReactNode[] }>(
        (acc, w, idx) => {
          const rect =
            idx % 2 === 0 ? (
              <rect key={idx} x={acc.x} y="1" width={w * 2.2} height="16" fill="#15171a" />
            ) : null;
          return { x: acc.x + w * 2.6, els: rect ? [...acc.els, rect] : acc.els };
        },
        { x: 2, els: [] }
      ).els}
    </svg>

    <span
      data-testid={includeTestIds ? 'casing-serial' : undefined}
      className={`font-tech font-bold tracking-[0.22em] text-[#15171a] select-all ${
        compact ? 'text-xl' : 'text-2xl sm:text-3xl'
      }`}
    >
      {casing.serialNumber}
    </span>
  </div>
);

export const BatteryBayHardware: React.FC<CasingHardwareProps> = ({
  casing,
  compact = false,
  includeTestIds = false,
}) => (
  <div
    data-testid={includeTestIds ? 'casing-battery-summary' : undefined}
    className={`bg-[#11151d] border-2 border-[#080b10] shadow-[inset_3px_4px_12px_rgba(0,0,0,0.88)] flex flex-wrap items-center justify-center ${
      compact ? 'gap-2.5 p-2.5 min-h-[76px]' : 'gap-4 p-4 min-h-[118px]'
    }`}
  >
    {casing.aaPairs === 0 && casing.dCells === 0 && (
      <p className="font-tech text-[11px] text-[#bdb6a4] text-center">
        0 CELULE MONTATE · CONDENSATOR INTERN
      </p>
    )}

    {Array.from({ length: casing.aaPairs }).map((_, pairIdx) => (
      <div
        key={`aa-${pairIdx}`}
        aria-label="Pereche 2 baterii AA"
        className="bg-[#1b1d20] border border-[#3a3e44] p-1.5 flex items-center gap-1 shadow"
      >
        {[0, 1].map((cell) => (
          <div key={cell} className="flex flex-col items-center">
            <div className="w-2.5 h-1.5 bg-[#e6e1d3] border-x border-[#8a8576]" />
            <div
              className={`${
                compact ? 'w-4 h-12' : 'w-5 h-16'
              } bg-gradient-to-r from-[#b87b14] via-[#d99d2b] to-[#21190c] border border-[#3d2d11] flex flex-col items-center justify-between py-1 shadow-md`}
            >
              <span className="font-tech text-[8px] font-bold text-[#15171a]">+</span>
              <span className="font-tech text-[8px] font-bold text-[#eceae2]">AA</span>
            </div>
          </div>
        ))}
      </div>
    ))}

    {Array.from({ length: casing.dCells }).map((_, dIdx) => (
      <div
        key={`d-${dIdx}`}
        aria-label="Baterie mare tip D"
        className="bg-[#1b1d20] border border-[#3a3e44] p-1.5 flex items-center justify-center shadow"
      >
        <div className="flex flex-col items-center">
          <div className="w-3.5 h-1.5 bg-[#d6d3c4] border-x border-[#6d6f6b]" />
          <div
            className={`${
              compact ? 'w-8 h-12' : 'w-10 h-16'
            } bg-gradient-to-r from-[#4b4e52] via-[#70747a] to-[#1d1f21] border border-[#2c2f33] flex flex-col items-center justify-between py-1 shadow-md`}
          >
            <span className="font-tech text-[9px] font-bold text-[#ffd9a0]">+</span>
            <span className="font-tech text-[9px] font-bold text-[#eceae2]">1.5V D</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ConnectorPortsHardware: React.FC<CasingHardwareProps> = ({
  casing,
  compact = false,
  includeTestIds = false,
}) => (
  <div
    data-testid={includeTestIds ? 'casing-ports' : undefined}
    data-has-parallel={includeTestIds ? (casing.hasParallelPort ? 'true' : 'false') : undefined}
    className={`bg-[#1a1d1f] border-2 border-[#0b0d0e] shadow-[inset_3px_4px_12px_rgba(0,0,0,0.86)] flex flex-wrap items-center justify-center ${
      compact ? 'gap-2 p-2.5' : 'gap-4 p-4'
    }`}
  >
    {casing.ports.map((p, idx) => (
      <div
        key={`${p}-${idx}`}
        className="bg-[#25282c] border border-[#3e4248] p-2 shadow-inner"
      >
        <PortSvg type={p} compact={compact} />
      </div>
    ))}
  </div>
);

interface CasingLoupeModalProps {
  open: boolean;
  casing: BombCasing;
  onClose: () => void;
}

export const CasingSpecsView: React.FC<CasingLoupeModalProps> = ({ open, casing, onClose }) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lupă Tehnică Carcasă"
      className="fixed inset-0 z-[1250] flex items-center justify-center bg-black/82 p-3 sm:p-5 overflow-y-auto"
    >
      <div className="det-dossier-paper relative w-full max-w-2xl p-4 sm:p-6">
        <SlottedScrew className="absolute top-2.5 left-2.5" angle={14} />
        <SlottedScrew className="absolute top-2.5 right-2.5" angle={-28} />
        <SlottedScrew className="absolute bottom-2.5 left-2.5" angle={52} />
        <SlottedScrew className="absolute bottom-2.5 right-2.5" angle={-18} />

        {/* Evidence Photo Header */}
        <div className="flex items-center justify-between border-b-2 border-[#15171a]/25 pb-3 mb-4 px-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="det-dymo-label px-2 py-0.5 text-[11px] font-bold">
              FOTOGRAFIE DOSAR 03
            </span>
            <h2 className="font-display text-base sm:text-lg font-bold text-[#15171a]">
              Inspecție Carcasă & Conectori
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Închide lupa tehnică a carcasei"
            className="det-arcade-btn min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-[#f3eee2] border border-[#8a8576] p-3">
            <p className="font-tech text-[10px] font-bold tracking-widest text-[#3a382f] mb-2 uppercase">
              Fața Stângă · Autocolant Număr de Serie
            </p>
            <SerialBrassPlate casing={casing} includeTestIds />
          </div>

          <div className="bg-[#f3eee2] border border-[#8a8576] p-3">
            <p className="font-tech text-[10px] font-bold tracking-widest text-[#3a382f] mb-2 uppercase">
              Fața Superioară · Capac Metalic & Celule (AA / 1.5V D)
            </p>
            <BatteryBayHardware casing={casing} includeTestIds />
          </div>

          <div className="bg-[#f3eee2] border border-[#8a8576] p-3">
            <p className="font-tech text-[10px] font-bold tracking-widest text-[#3a382f] mb-2 uppercase">
              Fața Dreaptă · Magistrală I/O Laterală
            </p>
            <ConnectorPortsHardware casing={casing} includeTestIds />
          </div>
        </div>
      </div>
    </div>
  );
};
