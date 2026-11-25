import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SeqTerminal, SeqWireColor, SequenceWire, WireSequencesState } from '../../game/types';

interface WireSequencesModuleProps {
  state: WireSequencesState;
  onCutWire: (wireId: number) => void;
  onNavigate: (dir: 'up' | 'down') => void;
}

const LEFT_Y: Record<1 | 2 | 3, number> = { 1: 28, 2: 75, 3: 122 };
const RIGHT_Y: Record<SeqTerminal, number> = { A: 28, B: 75, C: 122 };

function seqColorPalette(color: SeqWireColor): { main: string; shade: string; label: string } {
  if (color === 'red') return { main: '#c0281c', shade: '#5c0c0c', label: 'Roșu' };
  if (color === 'blue') return { main: '#1d4ed8', shade: '#0d2363', label: 'Albastru' };
  return { main: '#242629', shade: '#09090b', label: 'Negru' };
}

export const WireSequencesModule: React.FC<WireSequencesModuleProps> = ({
  state,
  onCutWire,
  onNavigate,
}) => {
  const [shutterClosing, setShutterClosing] = useState(false);
  const panelWires = state.panels[state.currentPanel] ?? [];

  const handleNav = (dir: 'up' | 'down') => {
    setShutterClosing(true);
    window.setTimeout(() => {
      onNavigate(dir);
      setShutterClosing(false);
    }, 130);
  };

  const wireAtSlot = (slot: 1 | 2 | 3): SequenceWire | undefined =>
    panelWires.find((w) => w.slotIndex === slot);

  return (
    <div className="p-2 bg-[#ddd7c7] border border-[#15171a]/20 rounded-[2px]">
      <div className="flex items-stretch gap-2">
        {/* Main Brass-Terminal Window with Corrugated Shutter */}
        <div className="relative flex-1 det-module-well overflow-hidden p-2">
          <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-[#2c2f33] mb-1">
            <span className="font-tech text-[10px] font-bold text-[#ffd9a0] tracking-wider">
              PANOU {state.currentPanel + 1} / 4
            </span>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((p) => (
                <span
                  key={p}
                  className={`hw-led-dome w-2.5 h-2.5 inline-block ${
                    p < state.currentPanel
                      ? 'hw-led-green'
                      : p === state.currentPanel
                        ? 'hw-led-amber'
                        : 'hw-led-off'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative h-[142px] w-full bg-[#0e1012] border border-[#2c2f33]">
            <svg viewBox="0 0 240 150" className="w-full h-full">
              {/* Left Brass Screw-Terminal Posts (1-3) */}
              {([1, 2, 3] as const).map((slot) => {
                const w = wireAtSlot(slot);
                const y = LEFT_Y[slot];
                return (
                  <g key={`L-${slot}`}>
                    <rect x="6" y={y - 12} width="32" height="24" rx="1.5" fill="#1e2024" stroke="#484c52" />
                    <circle cx="35" cy={y} r="3.4" fill="#8f784a" stroke="#140e04" strokeWidth="0.9" />
                    <line x1="33.5" y1={y - 1} x2="36.5" y2={y + 1} stroke="#0c0904" strokeWidth="1" />
                    <text
                      x="19"
                      y={y + 4}
                      textAnchor="middle"
                      fill={w ? '#eceae2' : '#6d6f6b'}
                      fontSize="12"
                      fontFamily="Courier Prime, monospace"
                      fontWeight="bold"
                    >
                      {w ? w.labelNumber : '-'}
                    </text>
                  </g>
                );
              })}

              {/* Right Brass Screw-Terminal Posts (A, B, C) */}
              {(['A', 'B', 'C'] as const).map((term) => {
                const y = RIGHT_Y[term];
                return (
                  <g key={`R-${term}`}>
                    <rect x="202" y={y - 12} width="32" height="24" rx="1.5" fill="#1e2024" stroke="#484c52" />
                    <circle cx="205" cy={y} r="3.4" fill="#8f784a" stroke="#140e04" strokeWidth="0.9" />
                    <line x1="203.5" y1={y + 1} x2="206.5" y2={y - 1} stroke="#0c0904" strokeWidth="1" />
                    <text
                      x="221"
                      y={y + 4}
                      textAnchor="middle"
                      fill="#ffd9a0"
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Courier Prime, monospace"
                    >
                      {term}
                    </text>
                  </g>
                );
              })}

              {/* Connected Diagonal Wires */}
              {panelWires.map((w) => {
                const y1 = LEFT_Y[w.slotIndex];
                const y2 = RIGHT_Y[w.target];
                const pal = seqColorPalette(w.color);
                const midX = 120;
                const midY = (y1 + y2) / 2;

                return (
                  <g
                    key={w.id}
                    onClick={() => !w.cut && onCutWire(w.id)}
                    role="button"
                    tabIndex={w.cut ? -1 : 0}
                    aria-label={`Fir ${w.labelNumber} ${pal.label} spre ${w.target}${
                      w.cut ? ' (tăiat)' : ''
                    }`}
                    onKeyDown={(e) => {
                      if (!w.cut && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onCutWire(w.id);
                      }
                    }}
                    className={w.cut ? 'cursor-default opacity-80' : 'cursor-pointer'}
                  >
                    <line x1="38" y1={y1} x2="202" y2={y2} stroke="transparent" strokeWidth="22" />
                    {!w.cut ? (
                      <>
                        <path
                          d={`M 38 ${y1} C 95 ${y1}, 145 ${y2}, 202 ${y2}`}
                          fill="none"
                          stroke="rgba(0,0,0,0.72)"
                          strokeWidth="10.5"
                          transform="translate(2, 3)"
                        />
                        <path
                          d={`M 38 ${y1} C 95 ${y1}, 145 ${y2}, 202 ${y2}`}
                          fill="none"
                          stroke={pal.shade}
                          strokeWidth="9"
                          strokeLinecap="round"
                        />
                        <path
                          d={`M 38 ${y1} C 95 ${y1}, 145 ${y2}, 202 ${y2}`}
                          fill="none"
                          stroke={pal.main}
                          strokeWidth="7.2"
                          strokeLinecap="round"
                        />
                        <path
                          d={`M 38 ${y1 - 1.5} C 95 ${y1 - 1.5}, 145 ${y2 - 1.5}, 202 ${y2 - 1.5}`}
                          fill="none"
                          stroke="rgba(255,255,255,0.28)"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </>
                    ) : (
                      <>
                        <path
                          d={`M 38 ${y1} Q 75 ${y1}, ${midX - 18} ${midY - 7}`}
                          fill="none"
                          stroke={pal.main}
                          strokeWidth="7.5"
                          strokeLinecap="round"
                        />
                        <circle cx={midX - 17} cy={midY - 7} r="2.6" fill="#d97706" />
                        <path
                          d={`M ${midX + 18} ${midY + 7} Q 165 ${y2}, 202 ${y2}`}
                          fill="none"
                          stroke={pal.main}
                          strokeWidth="7.5"
                          strokeLinecap="round"
                        />
                        <circle cx={midX + 17} cy={midY + 7} r="2.6" fill="#d97706" />
                      </>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Sliding Metal Shutter */}
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-[#4c4e52] via-[#27292c] to-[#121415] border-y-2 border-[#6d6f6b] transition-transform duration-150 ${
                shutterClosing ? 'translate-y-0' : '-translate-y-full'
              }`}
            />
          </div>

          {/* Mobile Touch Terminal Cut Buttons */}
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {panelWires.map((w) => (
              <button
                key={`btn-${w.id}`}
                type="button"
                disabled={w.cut}
                onClick={() => onCutWire(w.id)}
                className={`det-arcade-btn min-h-[44px] py-1.5 px-2 font-tech text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  w.cut ? 'opacity-40 line-through cursor-default' : ''
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block border border-white/40 shrink-0"
                  style={{ backgroundColor: seqColorPalette(w.color).main }}
                />
                <span>
                  #{w.labelNumber}→{w.target}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Two Large Up / Down Rocker Buttons */}
        <div className="flex flex-col justify-between gap-2 w-12">
          <button
            type="button"
            onClick={() => handleNav('up')}
            disabled={state.currentPanel === 0}
            aria-label="Panoul anterior"
            className="det-arcade-btn flex-1 min-h-[48px] flex items-center justify-center disabled:opacity-35 cursor-pointer"
          >
            <ChevronUp className="w-6 h-6 text-[#eceae2]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleNav('down')}
            aria-label={state.currentPanel === 3 ? 'Finalizează panoul 4' : 'Panoul următor'}
            className="det-arcade-btn flex-1 min-h-[48px] flex items-center justify-center cursor-pointer"
          >
            <ChevronDown className="w-6 h-6 text-[#ffd9a0]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
