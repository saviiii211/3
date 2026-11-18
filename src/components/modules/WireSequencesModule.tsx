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

function seqColorHex(color: SeqWireColor): string {
  if (color === 'red') return '#dc2626';
  if (color === 'blue') return '#2563eb';
  return '#1f2937';
}

function seqColorLabel(color: SeqWireColor): string {
  if (color === 'red') return 'Roșu';
  if (color === 'blue') return 'Albastru';
  return 'Negru';
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
    <div className="hw-carbon-bay rounded-lg p-3.5 border border-slate-800/90">
      <div className="flex items-stretch gap-3">
        {/* Main Panel Window with Metal Shutter Effect */}
        <div className="relative flex-1 rounded-lg bg-slate-950 border-2 border-slate-700 overflow-hidden p-2">
          <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-slate-800 mb-1">
            <span className="font-tech text-[10px] text-amber-400">
              PANOU {state.currentPanel + 1} / 4
            </span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((p) => (
                <span
                  key={p}
                  className={`w-2.5 h-1.5 rounded-sm ${
                    p < state.currentPanel
                      ? 'bg-emerald-400'
                      : p === state.currentPanel
                        ? 'bg-amber-400'
                        : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative h-[150px] w-full">
            <svg viewBox="0 0 240 150" className="w-full h-full">
              {/* Left Terminals (1-3 slot labels) */}
              {([1, 2, 3] as const).map((slot) => {
                const w = wireAtSlot(slot);
                const y = LEFT_Y[slot];
                return (
                  <g key={`L-${slot}`}>
                    <rect x="8" y={y - 12} width="28" height="24" rx="4" fill="#1e293b" stroke="#475569" />
                    <text
                      x="22"
                      y={y + 4}
                      textAnchor="middle"
                      fill={w ? '#f8fafc' : '#475569'}
                      fontSize="12"
                      fontFamily="Share Tech Mono, monospace"
                    >
                      {w ? w.labelNumber : '-'}
                    </text>
                  </g>
                );
              })}

              {/* Right Terminals (A, B, C) */}
              {(['A', 'B', 'C'] as const).map((term) => {
                const y = RIGHT_Y[term];
                return (
                  <g key={`R-${term}`}>
                    <rect x="204" y={y - 12} width="28" height="24" rx="4" fill="#1e293b" stroke="#475569" />
                    <text
                      x="218"
                      y={y + 4}
                      textAnchor="middle"
                      fill="#fbbf24"
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Share Tech Mono, monospace"
                    >
                      {term}
                    </text>
                  </g>
                );
              })}

              {/* Connected Diagonal SVG Wires */}
              {panelWires.map((w) => {
                const y1 = LEFT_Y[w.slotIndex];
                const y2 = RIGHT_Y[w.target];
                const strokeColor = seqColorHex(w.color);
                const midX = 120;
                const midY = (y1 + y2) / 2;

                return (
                  <g
                    key={w.id}
                    onClick={() => !w.cut && onCutWire(w.id)}
                    role="button"
                    tabIndex={w.cut ? -1 : 0}
                    aria-label={`Fir ${w.labelNumber} ${seqColorLabel(w.color)} spre ${w.target}${
                      w.cut ? ' (tăiat)' : ''
                    }`}
                    onKeyDown={(e) => {
                      if (!w.cut && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onCutWire(w.id);
                      }
                    }}
                    className={w.cut ? 'cursor-default opacity-75' : 'cursor-pointer'}
                  >
                    {/* Wide invisible hit target */}
                    <line x1="36" y1={y1} x2="204" y2={y2} stroke="transparent" strokeWidth="22" />
                    {!w.cut ? (
                      <>
                        <path
                          d={`M 36 ${y1} C 95 ${y1}, 145 ${y2}, 204 ${y2}`}
                          fill="none"
                          stroke="#000000"
                          strokeWidth="10"
                          strokeOpacity="0.45"
                        />
                        <path
                          d={`M 36 ${y1} C 95 ${y1}, 145 ${y2}, 204 ${y2}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="7.5"
                          strokeLinecap="round"
                        />
                        {w.color === 'black' && (
                          <path
                            d={`M 36 ${y1} C 95 ${y1}, 145 ${y2}, 204 ${y2}`}
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="1.4"
                            strokeDasharray="6 6"
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <path
                          d={`M 36 ${y1} Q 75 ${y1}, ${midX - 18} ${midY - 6}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="7"
                          strokeLinecap="round"
                        />
                        <path
                          d={`M ${midX + 18} ${midY + 6} Q 165 ${y2}, 204 ${y2}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="7"
                          strokeLinecap="round"
                        />
                      </>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Sliding Metallic Shutter Overlay */}
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-y-2 border-slate-500 transition-transform duration-150 ${
                shutterClosing ? 'translate-y-0' : '-translate-y-full'
              }`}
            />
          </div>

          {/* Explicit Accessible Wire Cut Buttons for Easy Touch on Mobile */}
          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            {panelWires.map((w) => (
              <button
                key={`btn-${w.id}`}
                type="button"
                disabled={w.cut}
                onClick={() => onCutWire(w.id)}
                className={`hw-btn-compact py-1.5 px-2 font-tech text-[11px] flex items-center justify-center gap-1 ${
                  w.cut ? 'opacity-40 line-through text-slate-500' : 'text-slate-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block border border-white/30"
                  style={{ backgroundColor: seqColorHex(w.color) }}
                />
                <span>
                  #{w.labelNumber}→{w.target}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Up / Down Panel Navigation */}
        <div className="flex flex-col justify-between gap-2 w-12">
          <button
            type="button"
            onClick={() => handleNav('up')}
            disabled={state.currentPanel === 0}
            aria-label="Panoul anterior"
            className="hw-tactile-btn flex-1 min-h-[48px] flex items-center justify-center text-slate-200 disabled:opacity-35"
          >
            <ChevronUp className="w-6 h-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleNav('down')}
            aria-label={state.currentPanel === 3 ? 'Finalizează panoul 4' : 'Panoul următor'}
            className="hw-tactile-btn flex-1 min-h-[48px] flex items-center justify-center text-amber-300"
          >
            <ChevronDown className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
