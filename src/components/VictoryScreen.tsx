import React, { useEffect, useRef } from 'react';
import { Heart, RotateCcw, Sparkles } from 'lucide-react';

interface VictoryScreenProps {
  strikes: number;
  solvedCount: number;
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

const GOLD_PALETTE = ['#fbbf24', '#f59e0b', '#fde68a', '#fb7185', '#ffffff'];

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  strikes,
  solvedCount,
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

    const particles: Particle[] = Array.from({ length: prefersReducedMotion ? 16 : 85 }).map(
      () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height * 0.25,
        vx: (Math.random() - 0.5) * 1.4,
        vy: 1.2 + Math.random() * 2.2,
        size: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.08,
        color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
        alpha: 0.6 + Math.random() * 0.4,
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
      className="fixed inset-0 z-[1200] overflow-y-auto bg-gradient-to-b from-[#1f1409] via-[#2b1a0c] to-[#120b05] text-amber-50 flex items-center justify-center p-5"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 w-full h-full"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-amber-400/50 bg-[#1a1108]/90 shadow-[0_24px_80px_rgba(245,158,11,0.28)] p-6 sm:p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-[0_0_32px_rgba(251,191,36,0.65)] mb-5">
          <Heart className="w-8 h-8 text-amber-950 fill-amber-950" aria-hidden="true" />
        </div>

        <p className="font-tech text-xs tracking-[0.26em] text-amber-300 uppercase">
          Operațiunea 3 Ani · Protocol Complet
        </p>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-amber-100 mt-2 leading-tight">
          MISIUNE ÎNDEPLINITĂ
        </h1>
        <p className="mt-3 text-base sm:text-lg text-amber-200/95 font-medium leading-relaxed">
          La mulți ani pentru 3 ani minunați împreună!
        </p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-xl bg-amber-950/50 border border-amber-500/30 py-3 px-3">
            <span className="font-tech text-[10px] text-amber-300/75 block">MODULE REZOLVATE</span>
            <span className="font-lcd text-3xl text-amber-200">{solvedCount} / 7</span>
          </div>
          <div className="rounded-xl bg-amber-950/50 border border-amber-500/30 py-3 px-3">
            <span className="font-tech text-[10px] text-amber-300/75 block">ERORI (STRIKES)</span>
            <span className="font-lcd text-3xl text-amber-200">{strikes}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onBackToConsole}
            className="flex-1 min-h-[46px] rounded-xl bg-amber-500 text-amber-950 font-display text-sm font-bold px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Înapoi la Consolă</span>
          </button>
          <button
            type="button"
            onClick={onResetGame}
            className="min-h-[46px] rounded-xl border border-amber-500/40 bg-amber-950/50 text-amber-200 font-tech text-xs px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-amber-900/50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Joacă din nou</span>
          </button>
        </div>
      </div>
    </div>
  );
};
