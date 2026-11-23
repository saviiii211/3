import React, { useEffect, useRef } from 'react';
import { Heart, RotateCcw, Terminal } from 'lucide-react';
import { SlottedScrew } from './ModuleCardShell';

interface VictoryScreenProps {
  strikes: number;
  solvedCount: number;
  elapsedSeconds?: number;
  serialNumber?: string;
  onBackToConsole: () => void;
  onResetGame: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vRot: number;
  color: string;
  alpha: number;
}

const GOLD_PALETTE = ['#fbbf24', '#d97706', '#fde68a', '#f59e0b', '#e7e5e4'];

function formatStoppedTime(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  strikes,
  solvedCount,
  elapsedSeconds = 0,
  serialNumber = 'UNIT-03',
  onBackToConsole,
  onResetGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = Array.from({ length: prefersReducedMotion ? 14 : 65 }).map(
      () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height * 0.25,
        vx: (Math.random() - 0.5) * 1.1,
        vy: 1.0 + Math.random() * 1.8,
        size: 3.5 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.06,
        color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
        alpha: 0.45 + Math.random() * 0.4,
      })
    );

    let rafId = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vRot;
          if (p.y > canvas.height + 20) {
            p.y = -15;
            p.x = Math.random() * canvas.width;
          }
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.55);
        ctx.restore();
      }
      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    tick();
    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      data-testid="victory-screen"
      className="fixed inset-0 z-[1200] overflow-y-auto workbench-bg text-stone-100 flex items-center justify-center p-4 sm:p-6"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 w-full h-full"
        aria-hidden="true"
      />

      <div className="chassis-plate metal-micrograin relative z-10 w-full max-w-xl p-5 sm:p-7">
        <SlottedScrew className="absolute top-2.5 left-2.5" angle={14} />
        <SlottedScrew className="absolute top-2.5 right-2.5" angle={-32} />
        <SlottedScrew className="absolute bottom-2.5 left-2.5" angle={54} />
        <SlottedScrew className="absolute bottom-2.5 right-2.5" angle={-18} />

        {/* Header Strip: Uncoupled Relays & Neutralized Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/80 pb-3 mb-4 px-2">
          <span className="brass-plaque px-2.5 py-0.5 font-tech text-[11px] font-bold text-amber-100">
            DISPOZITIV NEUTRALIZAT · {serialNumber}
          </span>
          <span className="font-tech text-[10px] tracking-widest text-emerald-400">
            RELEE DECUPLATE · CIRCUIT DESCHIS
          </span>
        </div>

        {/* Physical 7-Green-LED Bank + Uncoupled Relay Graphic */}
        <div className="recessed-bay p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2" aria-label="Toate cele 7 module sunt pe verde">
            {[1, 2, 3, 4, 5, 6, 7].map((m) => (
              <div key={m} className="flex flex-col items-center gap-1">
                <span className="hw-led-dome w-3.5 h-3.5 hw-led-green inline-block" />
                <span className="font-tech text-[8px] text-stone-400">M{m}</span>
              </div>
            ))}
          </div>

          {/* Open Physical Relay Switch SVG */}
          <svg viewBox="0 0 110 34" className="w-24 h-8 shrink-0" aria-hidden="true">
            <rect x="4" y="15" width="24" height="6" fill="#7c6335" />
            <circle cx="28" cy="18" r="3.5" fill="#d97706" />
            <line x1="28" y1="18" x2="72" y2="6" stroke="#e5e2dc" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="78" cy="18" r="3.5" fill="#52525b" />
            <rect x="78" y="15" width="28" height="6" fill="#52525b" />
          </svg>
        </div>

        {/* Main Anniversary Message & Brass Heart Emblem */}
        <div className="text-center px-2">
          <div className="mx-auto w-14 h-14 brass-plaque rounded-full flex items-center justify-center mb-3 shadow-lg">
            <Heart className="w-7 h-7 text-amber-100 fill-amber-200" aria-hidden="true" />
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-amber-200 tracking-wide">
            MISIUNE ÎNDEPLINITĂ
          </h1>
          <p className="mt-2 text-base sm:text-lg text-stone-200 font-medium leading-relaxed">
            La mulți ani pentru 3 ani minunați împreună!
          </p>
        </div>

        {/* Clean Technical Report (Stopped Timer, Solved Count, Strikes) */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="crt-phosphor-glass py-2.5 px-2 text-center">
            <span className="font-tech text-[9px] text-emerald-400/75 block relative z-10">
              CRONOMETRU OPRIT
            </span>
            <span className="font-lcd text-2xl phosphor-text relative z-10">
              {formatStoppedTime(elapsedSeconds)}
            </span>
          </div>

          <div className="crt-phosphor-glass py-2.5 px-2 text-center">
            <span className="font-tech text-[9px] text-emerald-400/75 block relative z-10">
              MODULE
            </span>
            <span className="font-lcd text-2xl phosphor-text relative z-10">
              {solvedCount} / 7
            </span>
          </div>

          <div className="crt-amber-glass py-2.5 px-2 text-center">
            <span className="font-tech text-[9px] text-amber-400/75 block relative z-10">
              ERORI
            </span>
            <span className="font-lcd text-2xl nixie-tube relative z-10">{strikes}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onBackToConsole}
            className="mech-key flex-1 min-h-[46px] px-4 py-2.5 flex items-center justify-center gap-2 font-display text-xs font-bold tracking-wider text-amber-200 cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>Înapoi la Consolă</span>
          </button>
          <button
            type="button"
            onClick={onResetGame}
            className="mech-key-bakelite min-h-[46px] px-4 py-2.5 flex items-center justify-center gap-2 font-tech text-xs text-stone-300 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Joacă din nou</span>
          </button>
        </div>
      </div>
    </div>
  );
};
