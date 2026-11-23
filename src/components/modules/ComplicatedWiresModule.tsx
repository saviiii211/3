import React, { useState } from 'react';
import type { ComplicatedWireItem, ComplicatedWiresState, WireColorType } from '../../game/types';

interface ComplicatedWiresModuleProps {
  state: ComplicatedWiresState;
  onCutWire: (wireId: number) => void;
}

function wirePalette(color: WireColorType): {
  base: string;
  shade: string;
  stripe?: string;
  label: string;
} {
  switch (color) {
    case 'white':
      return { base: '#d6d3cd', shade: '#8a867f', label: 'Alb simplu' };
    case 'red':
      return { base: '#b91c1c', shade: '#660d0d', label: 'Roșu' };
    case 'blue':
      return { base: '#1d4ed8', shade: '#0f2874', label: 'Albastru' };
    case 'red-white':
      return { base: '#b91c1c', shade: '#660d0d', stripe: '#e7e5e4', label: 'Roșu/Alb' };
    case 'blue-white':
      return { base: '#1d4ed8', shade: '#0f2874', stripe: '#e7e5e4', label: 'Albastru/Alb' };
    case 'red-blue':
      return { base: '#b91c1c', shade: '#660d0d', stripe: '#1d4ed8', label: 'Roșu/Albastru' };
  }
}

const WireGraphic: React.FC<{ wire: ComplicatedWireItem; sparking: boolean }> = ({
  wire,
  sparking,
}) => {
  const pal = wirePalette(wire.color);
  const patternId = `spiral-${wire.id}-${wire.color}`;
  const curveOffset = (wire.id % 2 === 0 ? 1 : -1) * 5.5;

  return (
    <svg viewBox="0 0 48 138" className="w-11 h-28 overflow-visible" aria-hidden="true">
      <defs>
        {pal.stripe && (
          <pattern
            id={patternId}
            width="10"
            height="14"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(34)"
          >
            <rect width="10" height="14" fill={pal.base} />
            <rect width="5" height="14" fill={pal.stripe} />
            <rect x="0" y="0" width="10" height="14" fill="rgba(0,0,0,0.08)" />
          </pattern>
        )}
      </defs>

      {/* Top & Bottom Bakelite Screw-Terminal Blocks */}
      <rect x="11" y="0" width="26" height="12" rx="1.5" fill="#17181b" stroke="#3c4047" strokeWidth="1.2" />
      <circle cx="24" cy="6" r="3.4" fill="#7c6335" stroke="#181207" strokeWidth="0.9" />
      <line x1="21.5" y1="5" x2="26.5" y2="7" stroke="#090704" strokeWidth="1.2" />

      <rect x="11" y="126" width="26" height="12" rx="1.5" fill="#17181b" stroke="#3c4047" strokeWidth="1.2" />
      <circle cx="24" cy="132" r="3.4" fill="#7c6335" stroke="#181207" strokeWidth="0.9" />
      <line x1="21.5" y1="133" x2="26.5" y2="131" stroke="#090704" strokeWidth="1.2" />

      {!wire.cut ? (
        <>
          {/* Directional Cast Shadow (top-left light -> bottom-right shadow) */}
          <path
            d={`M 24 11 C ${24 + curveOffset} 46, ${24 - curveOffset} 90, 24 127`}
            fill="none"
            stroke="rgba(0,0,0,0.78)"
            strokeWidth="11.5"
            strokeLinecap="round"
            transform="translate(3, 3)"
          />
          {/* Cylindrical Base Shading */}
          <path
            d={`M 24 11 C ${24 + curveOffset} 46, ${24 - curveOffset} 90, 24 127`}
            fill="none"
            stroke={pal.shade}
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Main Insulated / Spiral-Striped PVC Body */}
          <path
            d={`M 24 11 C ${24 + curveOffset} 46, ${24 - curveOffset} 90, 24 127`}
            fill="none"
            stroke={pal.stripe ? `url(#${patternId})` : pal.base}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          {/* Cylindrical Specular Ridge */}
          <path
            d={`M 22.2 12 C ${22.2 + curveOffset} 46, ${22.2 - curveOffset} 90, 22.2 126`}
            fill="none"
            stroke="rgba(255,255,255,0.34)"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* Severed Upper End + Exposed Copper Core */}
          <path
            d={`M 24 11 Q ${22 + curveOffset} 34, 15 53`}
            fill="none"
            stroke="rgba(0,0,0,0.72)"
            strokeWidth="10"
            strokeLinecap="round"
            transform="translate(2, 2)"
          />
          <path
            d={`M 24 11 Q ${22 + curveOffset} 34, 15 53`}
            fill="none"
            stroke={pal.stripe ? `url(#${patternId})` : pal.base}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <circle cx="14.5" cy="54.5" r="3.4" fill="#451a03" />
          <circle cx="14.2" cy="55" r="2.2" fill="#f59e0b" />
          <line x1="14" y1="55" x2="12" y2="59" stroke="#fbbf24" strokeWidth="1.4" />

          {/* Severed Lower End + Exposed Copper Core */}
          <path
            d={`M 33 83 Q ${26 - curveOffset} 106, 24 127`}
            fill="none"
            stroke="rgba(0,0,0,0.72)"
            strokeWidth="10"
            strokeLinecap="round"
            transform="translate(2, 2)"
          />
          <path
            d={`M 33 83 Q ${26 - curveOffset} 106, 24 127`}
            fill="none"
            stroke={pal.stripe ? `url(#${patternId})` : pal.base}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <circle cx="33.5" cy="81.5" r="3.4" fill="#451a03" />
          <circle cx="33.8" cy="81" r="2.2" fill="#f59e0b" />
          <line x1="34" y1="81" x2="36" y2="77" stroke="#fbbf24" strokeWidth="1.4" />

          {sparking && (
            <g className="animate-ping" style={{ transformOrigin: '24px 68px' }}>
              <path
                d="M24 52 L27 64 L39 68 L27 72 L24 84 L21 72 L9 68 L21 64 Z"
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
    <div className="recessed-bay p-2.5 sm:p-3">
      <div className="grid grid-cols-6 gap-1.5">
        {state.wires.map((wire) => {
          const pal = wirePalette(wire.color);
          return (
            <div
              key={wire.id}
              className="flex flex-col items-center bakelite-surface py-2 px-0.5"
            >
              {/* Top Glass Bulb in Machined Socket */}
              <div
                aria-label={`LED fir ${wire.id}: ${wire.ledOn ? 'aprins' : 'stins'}`}
                className={`hw-led-dome w-4 h-4 mb-2 ${
                  wire.ledOn ? 'hw-led-amber' : 'hw-led-off'
                }`}
              />

              {/* Cylindrical Wire Hitbox */}
              <button
                type="button"
                disabled={wire.cut}
                onClick={() => handleCut(wire)}
                aria-label={`Fir ${wire.id}: ${pal.label}, LED ${
                  wire.ledOn ? 'aprins' : 'stins'
                }, stea ${wire.hasStar ? 'da' : 'nu'}${wire.cut ? ' (tăiat)' : ''}`}
                className={`min-h-[114px] w-full flex items-center justify-center transition-transform ${
                  wire.cut
                    ? 'cursor-default opacity-85'
                    : 'hover:bg-white/[0.04] active:scale-95 cursor-pointer'
                }`}
              >
                <WireGraphic wire={wire} sparking={sparkId === wire.id} />
              </button>

              {/* Stamped Brass Star Plate Below */}
              <div
                className={`mt-2 w-7 h-6 flex items-center justify-center font-tech text-xs ${
                  wire.hasStar
                    ? 'brass-plaque text-amber-100 font-bold'
                    : 'bg-black/60 border border-stone-800 text-stone-600'
                }`}
                aria-hidden="true"
              >
                {wire.hasStar ? '★' : '·'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
