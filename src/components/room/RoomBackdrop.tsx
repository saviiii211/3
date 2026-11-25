import React, { useEffect, useId, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { SevenSegmentDisplay } from '../SevenSegmentDisplay';

interface RoomBackdropProps {
  tensionLevel?: number;
  strikes?: number;
  lampOn?: boolean;
  bulbCalm?: boolean;
  showProps?: boolean;
  showDeviceShadow?: boolean;
  rotationHint?: { rx: number; ry: number };
  onOpenLoupe?: () => void;
  children?: React.ReactNode;
}

interface DustSpec {
  id: number;
  left: string;
  top: string;
  size: number;
  dur: string;
  delay: string;
}

const DESKTOP_DUST: DustSpec[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${24 + ((i * 19) % 52)}%`,
  top: `${16 + ((i * 23) % 64)}%`,
  size: 1.5 + (i % 3) * 0.7,
  dur: `${7 + (i % 5) * 2.1}s`,
  delay: `${-((i * 1.3) % 8)}s`,
}));

export const RoomBackdrop: React.FC<RoomBackdropProps> = ({
  tensionLevel = 0,
  strikes = 0,
  lampOn = true,
  bulbCalm = false,
  showProps = true,
  showDeviceShadow = true,
  rotationHint = { rx: 9, ry: -7 },
  onOpenLoupe,
  children,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const lacePatternId = useId();
  const [flickerDim, setFlickerDim] = useState(false);
  const [psuJitter, setPsuJitter] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 760 : true
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 760);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Periodic lamp filament flicker (every 25-50s normally; more frequent under tension)
  useEffect(() => {
    if (!lampOn || bulbCalm || reducedMotion) {
      setFlickerDim(false);
      return;
    }

    let stopped = false;
    let outerTimer: number | null = null;
    const innerTimers: number[] = [];

    const clearInner = () => {
      while (innerTimers.length) {
        const id = innerTimers.pop();
        if (id !== undefined) window.clearTimeout(id);
      }
    };

    const scheduleNext = () => {
      if (stopped) return;
      const minMs =
        tensionLevel >= 3 ? 2800 : tensionLevel === 2 ? 9000 : tensionLevel === 1 ? 15000 : 25000;
      const maxMs =
        tensionLevel >= 3 ? 6500 : tensionLevel === 2 ? 18000 : tensionLevel === 1 ? 26000 : 50000;
      const wait = minMs + Math.random() * (maxMs - minMs);

      outerTimer = window.setTimeout(() => {
        if (stopped) return;
        const flashes = tensionLevel >= 3 ? 4 : 3;
        let offset = 0;
        for (let i = 0; i < flashes; i++) {
          const onDur = 60 + Math.random() * 60;
          const gapDur = 55 + Math.random() * 80;
          innerTimers.push(
            window.setTimeout(() => !stopped && setFlickerDim(true), offset)
          );
          innerTimers.push(
            window.setTimeout(() => !stopped && setFlickerDim(false), offset + onDur)
          );
          offset += onDur + gapDur;
        }
        outerTimer = window.setTimeout(scheduleNext, offset + 200);
      }, wait);
    };

    scheduleNext();
    return () => {
      stopped = true;
      if (outerTimer !== null) window.clearTimeout(outerTimer);
      clearInner();
    };
  }, [lampOn, bulbCalm, tensionLevel, reducedMotion]);

  // Subtle PSU voltage readout jitter when strikes >= 1
  useEffect(() => {
    if (strikes === 0 || reducedMotion) {
      setPsuJitter(false);
      return;
    }
    const id = window.setInterval(() => {
      setPsuJitter((v) => !v);
    }, Math.max(450, 1400 - strikes * 250));
    return () => window.clearInterval(id);
  }, [strikes, reducedMotion]);

  const dustList = useMemo(
    () => (isDesktop ? DESKTOP_DUST : DESKTOP_DUST.slice(0, 8)),
    [isDesktop]
  );

  // Subtle contact shadow offset reacting to bomb 3D angle
  const shadowShiftX = Math.max(-28, Math.min(28, -rotationHint.ry * 0.45));
  const shadowScaleX = Math.max(0.75, 1 - Math.abs(rotationHint.ry) * 0.003);

  const coneShiftTint =
    !bulbCalm && tensionLevel >= 2
      ? 'rgba(255, 152, 112, 0.92)'
      : 'rgba(255, 217, 160, 1)';

  const coneVisibility = !lampOn ? 0 : flickerDim ? 0.07 : bulbCalm ? 0.22 : undefined;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#050606] flex flex-col">
      {/* ================= LAYER 1 & 2: ABANDONED ROOM WALL (~59% TOP) ================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%] det-wallpaper overflow-hidden"
      >
        {/* Damp brown moisture stain */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 36% 48% at 24% 48%, rgba(56, 38, 22, 0.52) 0%, transparent 72%), radial-gradient(ellipse 28% 36% at 78% 26%, rgba(44, 34, 24, 0.42) 0%, transparent 70%)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Peeling wallpaper patches & hairline cracks + Shadowed Corkboard + Window Blinds */}
        <svg
          viewBox="0 0 1200 540"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          {/* Peeling wallpaper shapes */}
          <polygon points="95,48 165,36 144,126 88,108" fill="#101311" />
          <polyline points="165,36 144,126 154,118" fill="none" stroke="#2c342e" strokeWidth="2" />
          <polygon points="880,96 942,110 924,185 872,162" fill="#0f1210" />
          <polyline points="880,96 872,162 882,154" fill="none" stroke="#29312b" strokeWidth="2" />
          <polygon points="340,390 405,375 390,468 332,455" fill="#101311" />
          <polyline points="340,390 390,468" fill="none" stroke="#2b332d" strokeWidth="1.8" />

          {/* Fine plaster cracks */}
          <path d="M 210 140 L 235 190 L 222 238 L 245 275" fill="none" stroke="#090b0a" strokeWidth="1.6" />
          <path d="M 960 220 L 932 268 L 948 310" fill="none" stroke="#090b0a" strokeWidth="1.4" />
          <path d="M 520 80 L 538 118 L 528 148" fill="none" stroke="#090b0a" strokeWidth="1.2" opacity="0.7" />

          {/* Evidence Corkboard in deep wall shadow (left side, edge of cone) */}
          <g opacity="0.48">
            <rect x="74" y="135" width="215" height="150" fill="#231c15" stroke="#110e0b" strokeWidth="5" />
            <rect x="92" y="154" width="44" height="52" fill="#706b60" transform="rotate(-4 114 180)" />
            <rect x="155" y="148" width="54" height="38" fill="#635e54" transform="rotate(3 182 167)" />
            <rect x="218" y="168" width="48" height="56" fill="#757065" transform="rotate(-2 242 196)" />
            <rect x="115" y="218" width="60" height="42" fill="#6b655a" transform="rotate(5 145 239)" />
            <rect x="195" y="232" width="46" height="38" fill="#5e594f" transform="rotate(-6 218 251)" />
            {/* Red investigation thread */}
            <polyline
              points="114,160 182,155 242,175 145,226 218,238 114,160"
              fill="none"
              stroke="#7f1d1d"
              strokeWidth="1.4"
              opacity="0.85"
            />
            <circle cx="114" cy="160" r="2.6" fill="#991b1b" />
            <circle cx="182" cy="155" r="2.6" fill="#991b1b" />
            <circle cx="242" cy="175" r="2.6" fill="#991b1b" />
            <circle cx="145" cy="226" r="2.6" fill="#991b1b" />
            <circle cx="218" cy="238" r="2.6" fill="#991b1b" />
          </g>

          {/* Cold Secondary Window Light Slats from Venetian Blinds (upper right, 7% opacity) */}
          <g transform="rotate(-16 980 120)" opacity="0.08">
            {[0, 1, 2, 3, 4, 5].map((band) => (
              <rect
                key={band}
                x="840"
                y={40 + band * 44}
                width="340"
                height="20"
                fill="#7f9bb8"
              />
            ))}
          </g>
        </svg>

        {/* Tension level 3 emergency wall red LED */}
        {!bulbCalm && tensionLevel >= 3 && (
          <div className="absolute right-7 top-16 flex items-center gap-1.5 opacity-80">
            <span className="hw-led-dome w-3 h-3 hw-led-red-pulse inline-block" />
          </div>
        )}

        {/* Baseboard molding (plintă) at horizon */}
        <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-b from-[#161816] via-[#0e100f] to-[#060706] border-t border-[#242824]/45" />
      </div>

      {/* ================= LAYER 3: HANGING ENAMELED LAMP & WARM CONE ================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden z-[2]"
      >
        <div
          className={`absolute left-[46%] -top-2 flex flex-col items-center ${
            bulbCalm || reducedMotion ? '' : 'det-lamp-pendulum'
          }`}
          style={{ marginLeft: '-260px', width: '520px' }}
        >
          {/* Cord */}
          <div className="w-[3px] h-10 sm:h-14 bg-[#0b0c0c]" />
          {/* Enameled conical shade + bare filament */}
          <svg viewBox="0 0 120 48" className="w-24 sm:w-28 h-10 sm:h-12 -mt-0.5 drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]">
            <rect x="54" y="0" width="12" height="9" fill="#181b19" />
            <path d="M 48 8 L 72 8 L 106 38 L 14 38 Z" fill="#16231b" stroke="#0c120e" strokeWidth="1.5" />
            <ellipse cx="60" cy="38" rx="45" ry="6" fill={lampOn ? '#d9d3c4' : '#2a2c29'} />
            <circle
              cx="60"
              cy="40"
              r="7.5"
              fill={lampOn ? (flickerDim ? '#8a6c40' : '#ffd9a0') : '#2a2d2b'}
            />
          </svg>

          {/* Warm bulb halo + trapezoidal beam cone */}
          {lampOn && (
            <>
              <div
                className="w-24 h-12 -mt-6 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${coneShiftTint} 0%, transparent 72%)`,
                  opacity: flickerDim ? 0.16 : 0.45,
                  mixBlendMode: 'screen',
                }}
              />
              <div
                className="w-[720px] sm:w-[980px] h-[95vh] -mt-6"
                style={{
                  clipPath: 'polygon(43% 0%, 57% 0%, 100% 100%, 0% 100%)',
                  background:
                    tensionLevel >= 2 && !bulbCalm
                      ? 'radial-gradient(ellipse 68% 72% at 50% 24%, rgba(255, 200, 146, 0.92) 0%, rgba(232, 134, 92, 0.42) 48%, transparent 80%)'
                      : 'radial-gradient(ellipse 68% 72% at 50% 24%, rgba(255, 217, 160, 0.95) 0%, rgba(232, 182, 111, 0.45) 48%, transparent 80%)',
                  mixBlendMode: 'screen',
                  opacity: coneVisibility ?? 'var(--cone-opacity)',
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* ================= LAYER 4: PERSPECTIVE TABLE WITH EMBROIDERED LACE CLOTH ================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] sm:h-[42%] z-[3]"
        style={{ perspective: '900px' }}
      >
        {/* Tilted Tablecloth Surface */}
        <div
          className="absolute inset-x-[-14%] -top-10 bottom-14 origin-bottom"
          style={{
            transform: 'rotateX(62deg)',
            backgroundColor: '#8a8576',
            backgroundImage: lampOn
              ? 'radial-gradient(ellipse 56% 64% at 48% 52%, #d9d3c4 0%, #8a8576 54%, #3a382f 94%)'
              : 'radial-gradient(ellipse 56% 64% at 48% 52%, #3a382f 0%, #1d1c17 64%, #090908 98%)',
          }}
        >
          {/* Embroidered floral / lace SVG tile pattern (120px) */}
          <svg className="absolute inset-0 w-full h-full opacity-75">
            <defs>
              <pattern id={lacePatternId} width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="60" cy="60" r="26" fill="none" stroke="#bdb6a4" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="60" cy="60" r="10" fill="none" stroke="#bdb6a4" strokeWidth="1" />
                <path
                  d="M60 28 C66 42, 66 46, 60 50 C54 46, 54 42, 60 28 Z M60 92 C66 78, 66 74, 60 70 C54 74, 54 78, 60 92 Z M28 60 C42 66, 46 66, 50 60 C46 54, 42 54, 28 60 Z M92 60 C78 66, 74 66, 70 60 C74 54, 78 54, 92 60 Z"
                  fill="none"
                  stroke="#bdb6a4"
                  strokeWidth="1"
                />
                <circle cx="0" cy="0" r="16" fill="none" stroke="#bdb6a4" strokeWidth="0.9" strokeDasharray="2 3" />
                <circle cx="120" cy="0" r="16" fill="none" stroke="#bdb6a4" strokeWidth="0.9" strokeDasharray="2 3" />
                <circle cx="0" cy="120" r="16" fill="none" stroke="#bdb6a4" strokeWidth="0.9" strokeDasharray="2 3" />
                <circle cx="120" cy="120" r="16" fill="none" stroke="#bdb6a4" strokeWidth="0.9" strokeDasharray="2 3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${lacePatternId})`} />
          </svg>

          {/* 3-4 Diagonal Cloth Creases + Faint Tea Stain */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(148deg, transparent 22%, rgba(28, 25, 19, 0.14) 24%, transparent 27%, transparent 56%, rgba(255, 252, 240, 0.16) 57%, transparent 60%, transparent 74%, rgba(28, 25, 19, 0.16) 76%, transparent 79%), radial-gradient(circle at 26% 72%, rgba(92, 64, 34, 0.18) 0%, transparent 9%)',
            }}
          />
        </div>

        {/* Front 60px Scalloped Lace & Tablecloth Edge Drape fading to black */}
        <div
          className="absolute inset-x-0 bottom-0 h-[62px] border-t border-[#bdb6a4]/35"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 14px, rgba(217,211,196,0.06) 24px, rgba(0,0,0,0.28) 38px), linear-gradient(180deg, #5d594c 0%, #24221d 55%, #050606 100%)',
          }}
        />
      </div>

      {/* ================= LAYER 5: DESK / TABLE PROPS ================= */}
      {showProps && (
        <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden">
          {/* Top/Back-Left: Open Kraft Cardboard Box with Dark Acoustic Foam */}
          <div
            aria-hidden="true"
            className="hidden sm:block absolute left-[1.5%] lg:left-[2.5%] top-[36%] w-32 lg:w-36 h-24 opacity-80"
          >
            <svg viewBox="0 0 150 100" className="w-full h-full drop-shadow-[0_8px_14px_rgba(0,0,0,0.85)]">
              <polygon points="18,34 110,18 140,42 46,60" fill="#6b5136" stroke="#3d2d1d" strokeWidth="1.5" />
              <polygon points="18,34 46,60 46,92 18,64" fill="#523d28" stroke="#2f2216" strokeWidth="1.5" />
              <polygon points="46,60 140,42 140,74 46,92" fill="#433220" stroke="#281d12" strokeWidth="1.5" />
              {/* Black textured acoustic foam inside */}
              <polygon points="28,37 104,24 126,42 48,55" fill="#17191a" />
              {/* Left open flap */}
              <polygon points="18,34 2,20 90,6 110,18" fill="#7c5e3f" stroke="#42301f" strokeWidth="1.2" />
            </svg>
          </div>

          {/* Back-Right: Gray Lab Power Supply Unit ("03.03") + Red/Black Alligator Clip Leads */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute right-[1.5%] lg:right-[2.5%] top-[24%] w-44 lg:w-48 opacity-85"
          >
            <div className="relative p-2.5 bg-gradient-to-b from-[#6e7173] to-[#424547] border-t border-[#919496] border-r-2 border-b-2 border-[#1f2122] rounded-[2px] shadow-[6px_12px_20px_rgba(0,0,0,0.85)]">
              <div className="flex items-center justify-between gap-2">
                <div className="bg-[#0d0706] border border-[#242628] px-2 py-1">
                  <SevenSegmentDisplay
                    value={psuJitter && strikes > 0 ? '02.98' : '03.03'}
                    color="#ff3b2a"
                    height={19}
                  />
                </div>
                <div className="flex gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#24272a] border border-[#72767a] inline-block" />
                  <span className="w-4 h-4 rounded-full bg-[#24272a] border border-[#72767a] inline-block" />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[8px] font-tech text-[#15171a] font-bold">
                <span>ALIM. CC</span>
                <div className="flex gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c0281c] border border-black inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15171a] border border-black inline-block" />
                </div>
              </div>
            </div>
            {/* Alligator-clip jumper wires leading left toward device */}
            <svg viewBox="0 0 220 90" className="w-52 h-20 -ml-28 -mt-4 overflow-visible">
              <path d="M 190 8 C 120 42, 60 28, 8 62" fill="none" stroke="#991b1b" strokeWidth="2.5" />
              <path d="M 205 12 C 132 58, 70 42, 16 74" fill="none" stroke="#15171a" strokeWidth="2.5" />
              {/* Small alligator clip metal tips */}
              <polygon points="8,62 0,58 2,66" fill="#9ca3af" />
              <polygon points="16,74 8,70 10,78" fill="#9ca3af" />
            </svg>
          </div>

          {/* Front-Left: Manila Dossier ("DOSAR 03"), Pencil, Coffee Cup + Ring Stain */}
          <div className="absolute left-2 sm:left-[4%] bottom-[62px] sm:bottom-5 flex items-end gap-2">
            {/* Manila Dossier + Pencil + Mug (decorative) */}
            <div aria-hidden="true" className="relative select-none hidden sm:block">
              <div className="w-36 h-24 bg-gradient-to-br from-[#baa47a] to-[#877351] border border-[#52452f] rounded-[1px] shadow-[4px_8px_16px_rgba(0,0,0,0.8)] -rotate-6 p-2">
                <div className="inline-block bg-[#e6e1d3] px-1.5 py-0.5 font-tech text-[9px] font-bold text-[#15171a] border border-[#8a8576]">
                  DOSAR 03
                </div>
                <div className="mt-2 space-y-1 opacity-55">
                  <div className="h-[1px] w-20 bg-[#15171a]" />
                  <div className="h-[1px] w-16 bg-[#15171a]" />
                </div>
              </div>
              {/* Wooden Pencil */}
              <div className="absolute -right-4 bottom-3 w-20 h-2 bg-gradient-to-r from-[#d4a449] via-[#c79334] to-[#2e241b] border-y border-black/50 rotate-[18deg] shadow" />
              {/* Cold Coffee Mug with dark ring stain */}
              <div className="absolute -left-2 -top-9 w-11 h-11 rounded-full bg-[#3e2a17]/35 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#6e6b62] to-[#3f3d37] border-2 border-[#9e998c] flex items-center justify-center shadow-md">
                  <div className="w-5 h-5 rounded-full bg-[#1f130a]" />
                </div>
              </div>
            </div>

            <div className="hidden sm:block w-14 h-12" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* Interactive Magnifying Glass ("Lupa") -> Opens Casing Loupe Modal (above scene bars so never blocked) */}
      {showProps && onOpenLoupe && (
        <button
          type="button"
          onClick={onOpenLoupe}
          aria-label="Inspecție carcasă"
          title="Inspecție carcasă (Lupă)"
          className="pointer-events-auto fixed bottom-[114px] sm:bottom-5 left-1.5 sm:left-[14.5rem] z-[24] min-w-[52px] min-h-[52px] p-1 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#ffd9a0] group"
        >
          <svg
            viewBox="0 0 64 64"
            className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-[0_6px_12px_rgba(0,0,0,0.88)] -rotate-12 group-hover:rotate-0 transition-transform"
            aria-hidden="true"
          >
            {/* Wooden / Bakelite Handle */}
            <rect x="37" y="38" width="21" height="7" rx="2.5" transform="rotate(42 37 38)" fill="#241c15" stroke="#0d0a07" strokeWidth="1.2" />
            {/* Brass Collar Rim */}
            <circle cx="24" cy="24" r="16" fill="rgba(217, 211, 196, 0.14)" stroke="#8f784a" strokeWidth="3.5" />
            {/* Glint on glass lens */}
            <path d="M 14 19 A 11 11 0 0 1 26 12" fill="none" stroke="rgba(255, 244, 214, 0.52)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* ================= LAYER 6: DEVICE CONTACT SHADOW & FOREGROUND SCENE ================= */}
      {showDeviceShadow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[56%] -translate-x-1/2 z-[4] w-[82vw] max-w-[920px] h-24 rounded-full"
          style={{
            transform: `translate3d(${shadowShiftX}px, 0, 0) scaleX(${shadowScaleX})`,
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.45) 55%, transparent 78%)',
          }}
        />
      )}

      {/* Main Content Slot (Game UI, Cutscene, or Finale) */}
      <div className="relative z-[10] flex-1 flex flex-col min-h-0">{children}</div>

      {/* ================= LAYER 7: FILM GRAIN, DUST PARTICLES & PERIMETER VIGNETTE ================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[50] overflow-hidden"
      >
        {/* Animated 4-step tiled film grain */}
        <div className="det-film-grain absolute -inset-6" />

        {/* Subtle dust specks drifting inside light cone */}
        {!reducedMotion &&
          lampOn &&
          dustList.map((d) => (
            <span
              key={d.id}
              className="det-dust-mote absolute rounded-full bg-[#ffd9a0]/55"
              style={{
                left: d.left,
                top: d.top,
                width: `${d.size}px`,
                height: `${d.size}px`,
                animationDuration: d.dur,
                animationDelay: d.delay,
              }}
            />
          ))}

        {/* Deep perimeter noir vignette (never occludes central puzzle area) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              tensionLevel >= 3 && !bulbCalm
                ? 'radial-gradient(ellipse 68% 66% at 50% 48%, transparent 48%, rgba(5, 6, 6, 0.62) 78%, rgba(5, 6, 6, 0.92) 100%)'
                : 'radial-gradient(ellipse 74% 72% at 50% 48%, transparent 52%, rgba(5, 6, 6, 0.5) 82%, rgba(5, 6, 6, 0.88) 100%)',
          }}
        />
      </div>
    </div>
  );
};
