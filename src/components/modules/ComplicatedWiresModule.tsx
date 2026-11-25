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
      return { base: '#eae6db', shade: '#969186', label: 'Alb simplu' };
    case 'red':
      return { base: '#c0281c', shade: '#660d0d', label: 'Roșu' };
    case 'blue':
      return { base: '#1d4ed8', shade: '#0f2874', label: 'Albastru' };
    case 'red-white':
      return { base: '#c0281c', shade: '#660d0d', stripe: '#f2eee3', label: 'Roșu/Alb' };
    case 'blue-white':
      return { base: '#1d4ed8', shade: '#0f2874', stripe: '#f2eee3', label: 'Albastru/Alb' };
    case 'red-blue':
      return { base: '#c0281c', shade: '#660d0d', stripe: '#1d4ed8', label: 'Roșu/Albastru' };
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
    <svg viewBox="0 0 48 136" className="w-11 h-26 overflow-visible" aria-hidden="true">
      <defs>
        {pal.stripe && (
          <pattern
            id={patternId}
            width="10"
            height="14"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(36)"
          >
            <rect width="10" height="14" fill={pal.base} />
            <rect width="5" height="14" fill={pal.stripe} />
            <rect x="0" y="0" width="10" height="14" fill="rgba(0,0,0,0.08)" />
          </pattern>
        )}
      </defs>

      {/* Top & Bottom Brass Screw-Terminal Blocks */}
      <rect x="11" y="0" width="26" height="12" rx="1.5" fill="#1b1d20" stroke="#484c52" strokeWidth="1.2" />
      <circle cx="24" cy="6" r="3.4" fill="#8f784a" stroke="#181207" strokeWidth="0.9" />
      <line x1="21.5" y1="5" x2="26.5" y2="7" stroke="#090704" strokeWidth="1.2" />

      <rect x="11" y="124" width="26" height="12" rx="1.5" fill="#1b1d20" stroke="#484c52" strokeWidth="1.2" />
      <circle cx="24" cy="130" r="3.4" fill="#8f784a" stroke="#181207" strokeWidth="0.9" />
      <line x1="21.5" y1="131" x2="26.5" y2="129" stroke="#090704" strokeWidth="1.2" />

      {!wire.cut ? (
        <>
          <path
            d={`M 24 11 C ${24 + curveOffset} 46, ${24 - curveOffset} 90, 24 125`}
            fill="none"
            stroke="rgba(0,0,0,0.68)"
            strokeWidth="11.5"
            strokeLinecap="round"
            transform="translate(2.5, 2.5)"
          />
          <path
            d={`M 24 11 C ${24 + curveOffset} 46, ${24 - curveOffset} 90, 24 125`}
            fill="none"
            stroke={pal.shade}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d={`M 24 11 C ${24 + curveOffset} 46, ${24 - curveOffset} 90, 24 125`}
            fill="none"
            stroke={pal.stripe ? `url(#${patternId})` : pal.base}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <path
            d={`M 22.2 12 C ${22.2 + curveOffset} 46, ${22.2 - curveOffset} 90, 22.2 124`}
            fill="none"
            stroke="rgba(255,255,255,0.34)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* Severed Upper End + Exposed Copper Strands */}
          <path
            d={`M 24 11 Q ${22 + curveOffset} 34, 15 52`}
            fill="none"
            stroke="rgba(0,0,0,0.62)"
            strokeWidth="10"
            strokeLinecap="round"
            transform="translate(2, 2)"
          />
          <path
            d={`M 24 11 Q ${22 + curveOffset} 34, 15 52`}
            fill="none"
            stroke={pal.stripe ? `url(#${patternId})` : pal.base}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <circle cx="14.5" cy="53.5" r="3.4" fill="#451a03" />
          <circle cx="14.2" cy="54" r="2.2" fill="#d97706" />
          <line x1="14" y1="54" x2="11.5" y2="59" stroke="#f59e0b" strokeWidth="1.4" />
          <line x1="15" y1="54" x2="16.5" y2="58.5" stroke="#fbbf24" strokeWidth="1.1" />

          {/* Severed Lower End + Exposed Copper Strands */}
          <path
            d={`M 33 82 Q ${26 - curveOffset} 105, 24 125`}
            fill="none"
            stroke="rgba(0,0,0,0.62)"
            strokeWidth="10"
            strokeLinecap="round"
            transform="translate(2, 2)"
          />
          <path
            d={`M 33 82 Q ${26 - curveOffset} 105, 24 125`}
            fill="none"
            stroke={pal.stripe ? `url(#${patternId})` : pal.base}
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <circle cx="33.5" cy="80.5" r="3.4" fill="#451a03" />
          <circle cx="33.8" cy="80" r="2.2" fill="#d97706" />
          <line x1="34" y1="80" x2="36.5" y2="75.5" stroke="#f59e0b" strokeWidth="1.4" />
          <line x1="33" y1="80" x2="31.5" y2="75.5" stroke="#fbbf24" strokeWidth="1.1" />

          {sparking && (
            <g className="animate-ping" style={{ transformOrigin: '24px 67px' }}>
              <path
                d="M24 51 L27 63 L39 67 L27 71 L24 83 L21 71 L9 67 L21 63 Z"
                fill="#ffd9a0"
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
    <div className="p-2 bg-[#ddd7c7] border border-[#15171a]/20 rounded-[2px]">
      <div className="grid grid-cols-6 gap-1">
        {state.wires.map((wire) => {
          const pal = wirePalette(wire.color);
          return (
            <div
              key={wire.id}
              className="flex flex-col items-center py-1.5 px-0.5 bg-[#d5cfbf] border border-[#aba492] rounded-[2px]"
            >
              {/* Top Glass Bulb in Machined Socket */}
              <div
                aria-label={`LED fir ${wire.id}: ${wire.ledOn ? 'aprins' : 'stins'}`}
                className={`hw-led-dome w-4 h-4 mb-1.5 ${
                  wire.ledOn ? 'hw-led-amber' : 'hw-led-off'
                }`}
              />

              {/* Cylindrical Wire Well */}
              <button
                type="button"
                disabled={wire.cut}
                onClick={() => handleCut(wire)}
                aria-label={`Fir ${wire.id}: ${pal.label}, LED ${
                  wire.ledOn ? 'aprins' : 'stins'
                }, stea ${wire.hasStar ? 'da' : 'nu'}${wire.cut ? ' (tăiat)' : ''}`}
                className={`det-module-well min-h-[112px] w-full flex items-center justify-center transition-transform ${
                  wire.cut
                    ? 'cursor-default opacity-90'
                    : 'hover:brightness-110 active:scale-95 cursor-pointer'
                }`}
              >
                <WireGraphic wire={wire} sparking={sparkId === wire.id} />
              </button>

              {/* Stamped Star Mark Below */}
              <div
                className={`mt-1.5 w-7 h-6 flex items-center justify-center font-tech text-sm ${
                  wire.hasStar
                    ? 'bg-[#f4f0e6] border border-[#15171a] text-[#15171a] font-bold shadow-sm'
                    : 'bg-[#cfc9b9] border border-[#9e9786] text-[#8a8576]'
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
