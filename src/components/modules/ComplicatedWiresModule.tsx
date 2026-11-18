import React, { useState } from 'react';
import type { ComplicatedWireItem, ComplicatedWiresState, WireColorType } from '../../game/types';

interface ComplicatedWiresModuleProps {
  state: ComplicatedWiresState;
  onCutWire: (wireId: number) => void;
}

function wirePalette(color: WireColorType): { base: string; stripe?: string; label: string } {
  switch (color) {
    case 'white':
      return { base: '#e2e8f0', label: 'Alb simplu' };
    case 'red':
      return { base: '#dc2626', label: 'Roșu' };
    case 'blue':
      return { base: '#2563eb', label: 'Albastru' };
    case 'red-white':
      return { base: '#dc2626', stripe: '#f8fafc', label: 'Roșu/Alb' };
    case 'blue-white':
      return { base: '#2563eb', stripe: '#f8fafc', label: 'Albastru/Alb' };
    case 'red-blue':
      return { base: '#dc2626', stripe: '#2563eb', label: 'Roșu/Albastru' };
  }
}

const WireGraphic: React.FC<{ wire: ComplicatedWireItem; sparking: boolean }> = ({
  wire,
  sparking,
}) => {
  const pal = wirePalette(wire.color);
  const patternId = `stripe-${wire.id}-${wire.color}`;
  const curveOffset = (wire.id % 2 === 0 ? 1 : -1) * 5;

  return (
    <svg viewBox="0 0 44 132" className="w-10 h-28 overflow-visible" aria-hidden="true">
      <defs>
        {pal.stripe && (
          <pattern
            id={patternId}
            width="10"
            height="14"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(32)"
          >
            <rect width="10" height="14" fill={pal.base} />
            <rect width="5" height="14" fill={pal.stripe} />
          </pattern>
        )}
      </defs>

      {/* Top and Bottom Metal Sockets */}
      <rect x="13" y="0" width="18" height="9" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="1" />
      <rect x="13" y="123" width="18" height="9" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="1" />

      {!wire.cut ? (
        <>
          {/* Shadow */}
          <path
            d={`M 22 8 C ${22 + curveOffset} 44, ${22 - curveOffset} 88, 22 124`}
            fill="none"
            stroke="rgba(0,0,0,0.65)"
            strokeWidth="10"
            strokeLinecap="round"
            transform="translate(2,2)"
          />
          {/* Main insulated wire */}
          <path
            d={`M 22 8 C ${22 + curveOffset} 44, ${22 - curveOffset} 88, 22 124`}
            fill="none"
            stroke={pal.stripe ? `url(#${patternId})` : pal.base}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          {/* Specular highlight */}
          <path
            d={`M 20.5 10 C ${20.5 + curveOffset} 44, ${20.5 - curveOffset} 88, 20.5 122`}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* Upper severed wire end */}
          <path
            d={`M 22 8 Q ${20 + curveOffset} 34, 15 54`}
            fill="none"
            stroke={pal.stripe ? `url(#${patternId})` : pal.base}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="15" cy="54" r="3" fill="#d97706" />
          {/* Lower severed wire end */}
          <path
            d={`M 29 78 Q ${24 - curveOffset} 102, 22 124`}
            fill="none"
            stroke={pal.stripe ? `url(#${patternId})` : pal.base}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="29" cy="78" r="3" fill="#d97706" />
          {sparking && (
            <g className="animate-ping" style={{ transformOrigin: '22px 66px' }}>
              <path
                d="M22 52 L25 63 L36 66 L25 69 L22 80 L19 69 L8 66 L19 63 Z"
                fill="#fbbf24"
              />
            </g>
          )}
        </>
      )}
    </svg>
  );
};

export const ComplicatedWiresModule: React.FC<ComplicatedWiresModuleProps> = ({
  state,
  onCutWire,
}) => {
  const [sparkId, setSparkId] = useState<number | null>(null);

  const handleCut = (wire: ComplicatedWireItem) => {
    if (wire.cut) return;
    if (wire.shouldCut) {
      setSparkId(wire.id);
      window.setTimeout(() => setSparkId((cur) => (cur === wire.id ? null : cur)), 450);
    }
    onCutWire(wire.id);
  };

  return (
    <div className="hw-carbon-bay rounded-lg p-3 border border-slate-800/90">
      <div className="grid grid-cols-6 gap-1.5">
        {state.wires.map((wire) => {
          const pal = wirePalette(wire.color);
          return (
            <div
              key={wire.id}
              className="flex flex-col items-center bg-slate-950/60 rounded-lg py-2 px-1 border border-slate-800/70"
            >
              {/* Top Glass LED */}
              <div
                aria-label={`LED fir ${wire.id}: ${wire.ledOn ? 'aprins' : 'stins'}`}
                className={`hw-led-dome w-4 h-4 mb-2 ${
                  wire.ledOn ? 'hw-led-amber' : 'hw-led-off'
                }`}
              />

              {/* Clickable Wire Hitbox */}
              <button
                type="button"
                disabled={wire.cut}
                onClick={() => handleCut(wire)}
                aria-label={`Fir ${wire.id}: ${pal.label}, LED ${
                  wire.ledOn ? 'aprins' : 'stins'
                }, stea ${wire.hasStar ? 'da' : 'nu'}${wire.cut ? ' (tăiat)' : ''}`}
                className={`min-h-[112px] w-full flex items-center justify-center rounded transition-transform ${
                  wire.cut
                    ? 'cursor-default opacity-80'
                    : 'hover:bg-slate-800/40 active:scale-95 cursor-pointer'
                }`}
              >
                <WireGraphic wire={wire} sparking={sparkId === wire.id} />
              </button>

              {/* Engraved Star Plate Below */}
              <div
                className={`mt-2 w-7 h-6 rounded border flex items-center justify-center font-tech text-xs ${
                  wire.hasStar
                    ? 'bg-amber-950/50 border-amber-600/60 text-amber-300 font-bold'
                    : 'bg-slate-900/80 border-slate-800 text-slate-600'
                }`}
                aria-hidden="true"
              >
                {wire.hasStar ? '★' : '·'}
              </div>
            </div>
          );
        })}
      </div>
      <p className="font-tech text-[10px] text-slate-400 text-center mt-2.5">
        Verifică Datele Carcasei (Serie, Baterii, Port Paralel) înainte de a tăia.
      </p>
    </div>
  );
};
