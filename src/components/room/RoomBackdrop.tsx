import React, { useEffect, useId, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

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
  left: `${28 + ((i * 17) % 44)}%`,
  top: `${12 + ((i * 21) % 62)}%`,
  size: 1.4 + (i % 3) * 0.65,
  dur: `${7.5 + (i % 5) * 2.1}s`,
  delay: `${-((i * 1.4) % 8)}s`,
}));

const SCATTERED_PAPERS = [
  { x: 560, y: 518, w: 28, h: 20, rot: -14, op: 0.65 },
  { x: 615, y: 534, w: 24, h: 18, rot: 22, op: 0.68 },
  { x: 668, y: 508, w: 30, h: 22, rot: 8, op: 0.62 },
  { x: 718, y: 540, w: 26, h: 19, rot: -26, op: 0.7 },
  { x: 772, y: 522, w: 29, h: 21, rot: 16, op: 0.66 },
  { x: 825, y: 546, w: 25, h: 18, rot: -9, op: 0.6 },
  { x: 485, y: 542, w: 24, h: 17, rot: 31, op: 0.56 },
  { x: 910, y: 528, w: 26, h: 19, rot: -18, op: 0.58 },
  { x: 642, y: 556, w: 22, h: 16, rot: 12, op: 0.64 },
  { x: 748, y: 562, w: 27, h: 20, rot: -5, op: 0.68 },
];

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
  const dampFilterId = useId();
  const wallGradId = useId();
  const nightGlassId = useId();
  const rugPatId = useId();
  const floorSheenId = useId();
  const [tubeFlickerDim, setTubeFlickerDim] = useState(false);
  const [neonFlickerDim, setNeonFlickerDim] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 760 : true
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 760);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Fluorescent tube flicker driven by tensionLevel
  useEffect(() => {
    if (!lampOn || bulbCalm || reducedMotion) {
      setTubeFlickerDim(false);
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
        tensionLevel >= 3 ? 2200 : tensionLevel === 2 ? 6200 : tensionLevel === 1 ? 14000 : 24000;
      const maxMs =
        tensionLevel >= 3 ? 5200 : tensionLevel === 2 ? 12500 : tensionLevel === 1 ? 24000 : 46000;
      const wait = minMs + Math.random() * (maxMs - minMs);

      outerTimer = window.setTimeout(() => {
        if (stopped) return;
        const flashes = tensionLevel >= 2 ? 4 : 2;
        let offset = 0;
        for (let i = 0; i < flashes; i++) {
          const onDur = 45 + Math.random() * 55;
          const gapDur = 45 + Math.random() * 75;
          innerTimers.push(
            window.setTimeout(() => !stopped && setTubeFlickerDim(true), offset)
          );
          innerTimers.push(
            window.setTimeout(() => !stopped && setTubeFlickerDim(false), offset + onDur)
          );
          offset += onDur + gapDur;
        }
        outerTimer = window.setTimeout(scheduleNext, offset + 220);
      }, wait);
    };

    scheduleNext();
    return () => {
      stopped = true;
      if (outerTimer !== null) window.clearTimeout(outerTimer);
      clearInner();
    };
  }, [lampOn, bulbCalm, tensionLevel, reducedMotion]);

  // Neon sign flicker (rare at tension 0-1, erratic at tension 2-3)
  useEffect(() => {
    if (bulbCalm || reducedMotion) {
      setNeonFlickerDim(false);
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

    const scheduleNeon = () => {
      if (stopped) return;
      const minMs = tensionLevel >= 2 ? 3200 : tensionLevel === 1 ? 8500 : 18000;
      const maxMs = tensionLevel >= 2 ? 7500 : tensionLevel === 1 ? 16000 : 34000;
      const wait = minMs + Math.random() * (maxMs - minMs);

      outerTimer = window.setTimeout(() => {
        if (stopped) return;
        const flashes = tensionLevel >= 2 ? 3 : 2;
        let offset = 0;
        for (let i = 0; i < flashes; i++) {
          const onDur = 40 + Math.random() * 50;
          const gapDur = 55 + Math.random() * 75;
          innerTimers.push(
            window.setTimeout(() => !stopped && setNeonFlickerDim(true), offset)
          );
          innerTimers.push(
            window.setTimeout(() => !stopped && setNeonFlickerDim(false), offset + onDur)
          );
          offset += onDur + gapDur;
        }
        outerTimer = window.setTimeout(scheduleNeon, offset + 300);
      }, wait);
    };

    scheduleNeon();
    return () => {
      stopped = true;
      if (outerTimer !== null) window.clearTimeout(outerTimer);
      clearInner();
    };
  }, [bulbCalm, tensionLevel, reducedMotion]);

  const dustList = useMemo(
    () => (isDesktop ? DESKTOP_DUST : DESKTOP_DUST.slice(0, 8)),
    [isDesktop]
  );

  // Subtle contact shadow offset reacting to bomb 3D angle
  const shadowShiftX = Math.max(-28, Math.min(28, -rotationHint.ry * 0.45));
  const shadowScaleX = Math.max(0.75, 1 - Math.abs(rotationHint.ry) * 0.003);

  const isCritical = !bulbCalm && tensionLevel >= 3;
  const isTense = !bulbCalm && tensionLevel === 2;

  const neonGradient = bulbCalm
    ? 'linear-gradient(165deg, rgba(59,130,246,0.34) 0%, rgba(30,64,175,0.22) 60%, rgba(11,15,20,0.4) 100%)'
    : isCritical
      ? 'linear-gradient(165deg, #ef4444 0%, #f43f5e 48%, #9f1239 100%)'
      : isTense
        ? 'linear-gradient(165deg, #f43f5e 0%, #c026d3 52%, #7c3aed 100%)'
        : 'linear-gradient(165deg, #c026d3 0%, #7c3aed 52%, #2563eb 100%)';

  const neonSpillBg = bulbCalm
    ? 'radial-gradient(ellipse 64% 70% at 100% 34%, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0.06) 45%, transparent 78%)'
    : isCritical
      ? 'radial-gradient(ellipse 70% 74% at 100% 34%, rgba(244, 63, 94, 0.42) 0%, rgba(220, 38, 38, 0.16) 46%, transparent 78%)'
      : isTense
        ? 'radial-gradient(ellipse 68% 72% at 100% 34%, rgba(244, 63, 94, 0.36) 0%, rgba(192, 38, 211, 0.16) 46%, transparent 78%)'
        : 'radial-gradient(ellipse 68% 72% at 100% 34%, rgba(217, 70, 239, 0.34) 0%, rgba(139, 92, 246, 0.16) 44%, rgba(59, 130, 246, 0.06) 62%, transparent 78%)';

  const neonStrokeColor = bulbCalm
    ? '#60a5fa'
    : isCritical
      ? '#fb7185'
      : isTense
        ? '#f472b6'
        : '#f0abfc';

  const tubeVisibleOpacity = !lampOn ? 0.03 : tubeFlickerDim ? 0.08 : bulbCalm ? 0.14 : 0.23;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#05070a] flex flex-col">
      {/* ================= LAYER 1: NOIR-CYBERPUNK DETECTIVE ROOM (TOP ~60%) ================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%] overflow-hidden bg-[#05070a]"
      >
        {/* Single Architectural Room Silhouette SVG with Reused <defs> */}
        <svg
          viewBox="0 0 1440 580"
          preserveAspectRatio="xMidYMin slice"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            {/* Cool blue-gray back wall gradient (dark & neutral behind center bomb) */}
            <linearGradient id={wallGradId} x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor={lampOn ? '#2a3440' : '#11161c'} />
              <stop offset="46%" stopColor="#151b23" />
              <stop offset="100%" stopColor="#0a0e13" />
            </linearGradient>

            {/* Night blue sky outside center-left window */}
            <linearGradient id={nightGlassId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16233a" />
              <stop offset="100%" stopColor="#0b1322" />
            </linearGradient>

            {/* Subtle polished floor reflection under fluorescent tube */}
            <radialGradient id={floorSheenId} cx="0.5" cy="0.35" r="0.5">
              <stop offset="0%" stopColor="rgba(207, 232, 255, 0.12)" />
              <stop offset="60%" stopColor="rgba(148, 178, 210, 0.04)" />
              <stop offset="100%" stopColor="rgba(10, 14, 19, 0)" />
            </radialGradient>

            {/* Worn Persian rug geometric motif */}
            <pattern id={rugPatId} width="32" height="24" patternUnits="userSpaceOnUse">
              <rect width="32" height="24" fill="#2a1f22" />
              <polygon points="16,3 28,12 16,21 4,12" fill="none" stroke="#472d32" strokeWidth="1" />
              <circle cx="16" cy="12" r="2.2" fill="#523338" />
            </pattern>

            {/* Peeling paint & dampness turbulence filter */}
            <filter id={dampFilterId} x="0%" y="0%" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012"
                numOctaves="3"
                seed="7"
                result="noise"
              />
              <feColorMatrix
                type="matrix"
                in="noise"
                values="0 0 0 0 0.04  0 0 0 0 0.07  0 0 0 0 0.1  0 0 0 0.35 -0.14"
              />
            </filter>
          </defs>

          {/* ---- a) BACK WALL & WAINSCOTING (LAMBRIU) ---- */}
          <rect x="0" y="0" width="1440" height="465" fill={`url(#${wallGradId})`} />

          {/* Lower ~38% wall wainscoting (#10151c + thin light trim #4b5766 @ 35%) */}
          <rect x="0" y="290" width="1440" height="175" fill="#10151c" />
          <line
            x1="0"
            y1="290"
            x2="1440"
            y2="290"
            stroke="#4b5766"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />

          {/* Dampness & peeling paint irregular patches (8-12% opacity, corners & near windows) */}
          <g opacity="0.11" filter={`url(#${dampFilterId})`}>
            <rect x="0" y="18" width="420" height="440" fill="#05070a" />
            <rect x="460" y="30" width="440" height="260" fill="#05070a" />
            <rect x="1040" y="20" width="400" height="440" fill="#05070a" />
          </g>

          {/* Subtle peeled paint flakes near corners */}
          <g fill="#0b0f14" opacity="0.55">
            <polygon points="315,72 346,66 336,118 308,105" />
            <polygon points="996,86 1028,94 1018,142 988,128" />
          </g>

          {/* ---- b) CEILING & CONCRETE PERSPECTIVE BEAM ---- */}
          <rect x="0" y="0" width="1440" height="30" fill="#11161c" />
          <polygon points="0,24 1440,24 1390,54 50,54" fill="#1b222a" />
          {/* Rim-light on beam bottom edge from fluorescent tube */}
          <line
            x1="460"
            y1="54"
            x2="980"
            y2="54"
            stroke={lampOn ? '#cfe8ff' : '#2a3440'}
            strokeOpacity={lampOn ? 0.45 : 0.25}
            strokeWidth="1.2"
          />

          {/* ---- e) LEFT SIDE: PANELED WHITE DOOR + CORKBOARD + POSTER + CLIPBOARD ---- */}
          {/* White-ish dingy door in deep penumbra (4 recessed panels + chipped bottom) */}
          <g transform="translate(26, 98)">
            <rect x="0" y="0" width="144" height="366" fill="#1a212b" stroke="#0b0f14" strokeWidth="3" />
            <rect x="6" y="6" width="132" height="354" fill="#232c38" />
            {/* 4 recessed door panels */}
            <rect x="18" y="22" width="46" height="128" fill="#171e27" stroke="#0d1218" strokeWidth="1.5" />
            <rect x="78" y="22" width="46" height="128" fill="#171e27" stroke="#0d1218" strokeWidth="1.5" />
            <rect x="18" y="172" width="46" height="158" fill="#171e27" stroke="#0d1218" strokeWidth="1.5" />
            <rect x="78" y="172" width="46" height="158" fill="#171e27" stroke="#0d1218" strokeWidth="1.5" />
            {/* Warm rim-light from desk lamp hitting right edge of door */}
            <line
              x1="141"
              y1="10"
              x2="141"
              y2="354"
              stroke="#ffb347"
              strokeOpacity={lampOn ? 0.42 : 0.08}
              strokeWidth="1.4"
            />
            {/* Small chipped paint spot */}
            <polygon points="108,302 126,312 120,336 98,328" fill="#0d1218" opacity="0.7" />
          </g>

          {/* Aged Ochre Poster (abstract blocks, NO readable text) */}
          <g transform="translate(192, 108)" opacity="0.65">
            <rect x="0" y="0" width="76" height="104" fill="#6f532c" stroke="#241c12" strokeWidth="1.5" />
            <rect x="10" y="14" width="56" height="22" fill="#3a2b17" />
            <circle cx="28" cy="58" r="14" fill="#2b2114" />
            <rect x="46" y="48" width="18" height="36" fill="#4f3b1f" />
            <rect x="10" y="88" width="54" height="6" fill="#261c10" />
            <line x1="76" y1="2" x2="76" y2="102" stroke="#ffb347" strokeOpacity={lampOn ? 0.35 : 0} strokeWidth="1" />
          </g>

          {/* Small pinned photo + clipboard on left wall */}
          <g opacity="0.6">
            <rect x="200" y="232" width="38" height="44" fill="#3a424d" stroke="#11161c" strokeWidth="1.5" transform="rotate(-3 219 254)" />
            <rect x="206" y="238" width="26" height="28" fill="#151b23" transform="rotate(-3 219 254)" />
            <rect x="252" y="224" width="32" height="46" fill="#2b1e16" stroke="#0d1015" strokeWidth="1.2" transform="rotate(4 268 247)" />
            <rect x="262" y="221" width="12" height="5" fill="#4b5766" transform="rotate(4 268 247)" />
          </g>

          {/* Existing Evidence Corkboard (left side, warm desk-lamp rim) */}
          <g opacity="0.58">
            <rect x="304" y="138" width="178" height="126" fill="#261d15" stroke="#120d0a" strokeWidth="4.5" />
            <rect x="318" y="152" width="36" height="44" fill="#6c6559" transform="rotate(-4 336 174)" />
            <rect x="370" y="148" width="44" height="32" fill="#5d584d" transform="rotate(3 392 164)" />
            <rect x="424" y="164" width="38" height="46" fill="#70695d" transform="rotate(-2 443 187)" />
            <rect x="336" y="206" width="48" height="34" fill="#645e53" transform="rotate(5 360 223)" />
            <rect x="404" y="216" width="38" height="32" fill="#575248" transform="rotate(-5 423 232)" />
            <polyline
              points="336,158 392,154 443,170 360,214 423,222 336,158"
              fill="none"
              stroke="#7f1d1d"
              strokeWidth="1.3"
              opacity="0.85"
            />
            <circle cx="336" cy="158" r="2.2" fill="#991b1b" />
            <circle cx="392" cy="154" r="2.2" fill="#991b1b" />
            <circle cx="443" cy="170" r="2.2" fill="#991b1b" />
            <circle cx="360" cy="214" r="2.2" fill="#991b1b" />
            <circle cx="423" cy="222" r="2.2" fill="#991b1b" />
            <line x1="482" y1="140" x2="482" y2="262" stroke="#ffb347" strokeOpacity={lampOn ? 0.3 : 0} strokeWidth="1" />
          </g>

          {/* ---- c) LARGE BACK WINDOW (CENTER-LEFT, DARK & COOL) + RADIATOR ---- */}
          <g transform="translate(515, 76)">
            {/* Dingy off-white outer frame in penumbra */}
            <rect x="0" y="0" width="290" height="202" fill="#252e38" stroke="#0d1218" strokeWidth="3" />
            <rect x="8" y="8" width="274" height="186" fill={`url(#${nightGlassId})`} />

            {/* Thin distant city light slivers behind blinds (#4f6a9a, 20%) */}
            <g fill="#4f6a9a" opacity="0.2">
              <rect x="24" y="54" width="240" height="3" />
              <rect x="24" y="102" width="240" height="3" />
              <rect x="24" y="144" width="240" height="2.5" />
            </g>

            {/* 3-4 Window frame mullions */}
            <rect x="98" y="8" width="6" height="186" fill="#1e2630" />
            <rect x="190" y="8" width="6" height="186" fill="#1e2630" />
            <rect x="8" y="98" width="274" height="6" fill="#1e2630" />

            {/* Horizontal venetian blind slats (#0b0f14 / #1d2733) + 2-3 crooked slats */}
            {Array.from({ length: 14 }).map((_, i) => {
              const y = 14 + i * 12.5;
              const skewAngle = i === 5 ? 3.2 : i === 9 ? -4.1 : i === 11 ? 2.4 : 0;
              return (
                <g
                  key={i}
                  transform={skewAngle ? `rotate(${skewAngle} 145 ${y})` : undefined}
                >
                  <rect x="10" y={y} width="270" height="4.5" fill="#0b0f14" />
                  <rect x="10" y={y + 4.5} width="270" height="1.5" fill="#1d2733" />
                </g>
              );
            })}
            {/* Sill rim-light */}
            <rect x="-6" y="200" width="302" height="8" fill="#1a222c" />
            <line x1="-6" y1="200" x2="296" y2="200" stroke="#4b5766" strokeOpacity="0.45" strokeWidth="1" />

            {/* Radiator underneath window */}
            <g transform="translate(36, 224)">
              <rect x="0" y="0" width="218" height="132" fill="#0b0f14" stroke="#182029" strokeWidth="1.5" />
              {Array.from({ length: 13 }).map((_, r) => (
                <rect
                  key={r}
                  x={10 + r * 16}
                  y="6"
                  width="9"
                  height="120"
                  rx="2"
                  fill="#131922"
                  stroke="#070a0e"
                  strokeWidth="1"
                />
              ))}
              <line x1="2" y1="2" x2="216" y2="2" stroke="#4b5766" strokeOpacity="0.28" strokeWidth="1" />
            </g>
          </g>

          {/* ---- f) RIGHT SIDE: FILING CABINETS + TALL LOCKER + WOOD CRATE + 2 FRAMES ---- */}
          {/* 2 Small Frames on right-center wall */}
          <g opacity="0.5">
            <rect x="940" y="132" width="44" height="54" fill="#11161c" stroke="#2c3542" strokeWidth="2.5" />
            <rect x="948" y="140" width="28" height="38" fill="#1b222c" />
            <rect x="1002" y="144" width="38" height="44" fill="#11161c" stroke="#2c3542" strokeWidth="2.5" />
            <rect x="1009" y="151" width="24" height="30" fill="#1b222c" />
          </g>

          {/* 3-4 Stacked Filing Cabinets (with subtle violet rim from right neon window) */}
          <g transform="translate(1070, 212)">
            {[0, 1, 2, 3].map((drawer) => (
              <g key={drawer} transform={`translate(0, ${drawer * 62})`}>
                <rect x="0" y="0" width="112" height="58" fill="#141922" stroke="#090c11" strokeWidth="2" />
                <rect x="8" y="7" width="96" height="44" fill="#181f2a" />
                {/* Drawer handle + label slot */}
                <rect x="44" y="16" width="24" height="8" fill="#0c1016" stroke="#3b4454" strokeWidth="0.8" />
                <rect x="42" y="30" width="28" height="5" rx="2" fill="#2c3545" />
                {/* Violet neon rim on right edge */}
                <line
                  x1="111"
                  y1="2"
                  x2="111"
                  y2="56"
                  stroke={isCritical ? '#f43f5e' : '#a855f7'}
                  strokeOpacity={bulbCalm ? 0.1 : 0.42}
                  strokeWidth="1.2"
                />
              </g>
            ))}
          </g>

          {/* Tall dark industrial cabinet with horizontal louvers */}
          <g transform="translate(1194, 152)">
            <rect x="0" y="0" width="98" height="314" fill="#0d1118" stroke="#06080b" strokeWidth="2" />
            {Array.from({ length: 12 }).map((_, v) => (
              <line
                key={v}
                x1="18"
                y1={28 + v * 11}
                x2="80"
                y2={28 + v * 11}
                stroke="#1f2735"
                strokeWidth="2.5"
              />
            ))}
            <line
              x1="97"
              y1="4"
              x2="97"
              y2="310"
              stroke={isCritical ? '#f43f5e' : '#d946ef'}
              strokeOpacity={bulbCalm ? 0.12 : 0.48}
              strokeWidth="1.4"
            />
          </g>

          {/* Wooden crate on sawhorses (right midground, magenta-lit rim) */}
          <g transform="translate(1300, 355)">
            <line x1="12" y1="68" x2="2" y2="118" stroke="#18120e" strokeWidth="6" />
            <line x1="92" y1="68" x2="102" y2="118" stroke="#18120e" strokeWidth="6" />
            <rect x="0" y="0" width="110" height="70" fill="#231914" stroke="#0c0806" strokeWidth="2" />
            <line x1="0" y1="24" x2="110" y2="24" stroke="#120c09" strokeWidth="2" />
            <line x1="0" y1="48" x2="110" y2="48" stroke="#120c09" strokeWidth="2" />
            <line
              x1="1"
              y1="1"
              x2="109"
              y2="1"
              stroke={isCritical ? '#f43f5e' : '#d946ef'}
              strokeOpacity={bulbCalm ? 0.12 : 0.6}
              strokeWidth="1.3"
            />
          </g>

          {/* ---- h) DARK WOOD FLOOR, PERSIAN RUG, PAPERS & CARDBOARD BOX ---- */}
          <rect x="0" y="465" width="1440" height="115" fill="#1b1612" />
          {/* Converging floorboard perspective seams toward center vanishing point */}
          <g stroke="#0b0907" strokeWidth="1.6" opacity="0.85">
            <line x1="120" y1="580" x2="430" y2="465" />
            <line x1="300" y1="580" x2="520" y2="465" />
            <line x1="480" y1="580" x2="610" y2="465" />
            <line x1="650" y1="580" x2="695" y2="465" />
            <line x1="810" y1="580" x2="775" y2="465" />
            <line x1="980" y1="580" x2="860" y2="465" />
            <line x1="1150" y1="580" x2="950" y2="465" />
            <line x1="1330" y1="580" x2="1040" y2="465" />
            <line x1="0" y1="504" x2="1440" y2="504" opacity="0.45" />
            <line x1="0" y1="542" x2="1440" y2="542" opacity="0.45" />
          </g>

          {/* Polished floor sheen under fluorescent tube */}
          {lampOn && (
            <ellipse cx="720" cy="518" rx="340" ry="52" fill={`url(#${floorSheenId})`} />
          )}

          {/* Worn Persian rug trapezoid */}
          <g opacity="0.72">
            <polygon
              points="460,486 980,486 1055,568 385,568"
              fill={`url(#${rugPatId})`}
              stroke="#3b262a"
              strokeWidth="2.5"
            />
            <polygon
              points="484,494 956,494 1018,558 422,558"
              fill="none"
              stroke="#52373c"
              strokeWidth="1.2"
              opacity="0.7"
            />
          </g>

          {/* 10 Scattered blank papers (#d8d4c8, 55-70% opacity, NO text) */}
          {SCATTERED_PAPERS.map((p, idx) => (
            <rect
              key={idx}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill="#d8d4c8"
              fillOpacity={p.op}
              transform={`rotate(${p.rot} ${p.x + p.w / 2} ${p.y + p.h / 2})`}
            />
          ))}

          {/* Cardboard box on floor (left-back) */}
          <g transform="translate(220, 446)">
            <polygon points="0,14 68,6 88,20 20,28" fill="#4f3c28" stroke="#1c140d" strokeWidth="1.2" />
            <polygon points="0,14 20,28 20,66 0,50" fill="#3a2c1d" stroke="#18110b" strokeWidth="1.2" />
            <polygon points="20,28 88,20 88,58 20,66" fill="#2e2216" stroke="#140e09" strokeWidth="1.2" />
          </g>

          {/* ---- g) MIDGROUND BACKGROUND DESK (DARK REDDISH WOOD #2a1714) + CHAIR + LAMP ---- */}
          <g transform="translate(470, 312)">
            {/* Leather desk chair silhouette behind desk */}
            <g transform="translate(215, -24)">
              <rect x="6" y="0" width="64" height="72" rx="18" fill="#13161b" stroke="#080a0d" strokeWidth="1.5" />
              <path
                d="M 14 14 Q 38 6 62 14"
                fill="none"
                stroke="#323b47"
                strokeOpacity="0.45"
                strokeWidth="1.4"
              />
            </g>

            {/* Dark reddish-wood desk body & side panels */}
            <rect x="0" y="34" width="380" height="14" fill="#3b201c" stroke="#140b09" strokeWidth="1.5" />
            <rect x="12" y="48" width="96" height="114" fill="#2a1714" stroke="#120907" strokeWidth="1.5" />
            <rect x="20" y="58" width="80" height="42" fill="#21110f" stroke="#150a08" strokeWidth="1" />
            <rect x="20" y="106" width="80" height="44" fill="#21110f" stroke="#150a08" strokeWidth="1" />
            <rect x="272" y="48" width="96" height="114" fill="#2a1714" stroke="#120907" strokeWidth="1.5" />
            <rect x="280" y="58" width="80" height="42" fill="#21110f" stroke="#150a08" strokeWidth="1" />
            <rect x="280" y="106" width="80" height="44" fill="#21110f" stroke="#150a08" strokeWidth="1" />

            {/* 3 Small stacked books + bottle silhouette on desk */}
            <rect x="268" y="26" width="38" height="8" fill="#3a2822" />
            <rect x="272" y="19" width="32" height="7" fill="#24303c" />
            <rect x="276" y="13" width="26" height="6" fill="#4f3b26" />
            <path d="M 326 34 L 326 16 L 331 11 L 331 4 L 337 4 L 337 11 L 342 16 L 342 34 Z" fill="#182722" stroke="#2d473d" strokeWidth="0.8" />

            {/* Desk lamp (warm light source on left side of background desk) */}
            <g transform="translate(38, -14)">
              <ellipse cx="18" cy="48" rx="14" ry="4" fill="#1c1f24" />
              <polyline points="18,46 12,24 26,8" fill="none" stroke="#2c313a" strokeWidth="3" strokeLinecap="round" />
              <polygon points="18,6 40,6 48,22 10,22" fill="#1f2c24" stroke="#0d1410" strokeWidth="1.2" />
              <ellipse cx="29" cy="22" rx="16" ry="3.5" fill={lampOn ? '#ffd9a0' : '#2a2f36'} />
            </g>
          </g>

          {/* Right-foreground metal chair (clean 4-line silhouette) */}
          <g stroke="#222a34" strokeWidth="4" strokeLinecap="round" fill="none">
            <line x1="948" y1="398" x2="944" y2="518" />
            <line x1="998" y1="458" x2="1002" y2="518" />
            <line x1="945" y1="458" x2="1002" y2="458" />
            <line x1="948" y1="398" x2="968" y2="398" />
          </g>
        </svg>

        {/* Warm Desk Lamp Radial Screen Glow (20% warm source ~160px) */}
        {lampOn && (
          <div
            className="pointer-events-none absolute left-[24%] sm:left-[32%] top-[36%] w-[160px] h-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 217, 160, 0.72) 0%, rgba(255, 179, 71, 0.34) 42%, transparent 74%)',
              mixBlendMode: 'screen',
              opacity: bulbCalm ? 0.55 : 0.72,
            }}
          />
        )}

        {/* ---- d) PINNED RIGHT NEON WINDOW (FLUSH RIGHT, TILTED, ABSTRACT STROKES) ---- */}
        <div
          className={`pointer-events-none absolute -right-3 top-[6%] sm:top-[8%] w-[86px] sm:w-[148px] h-[54%] sm:h-[58%] rotate-[1.8deg] overflow-hidden border-l-[3px] border-y-[3px] border-[#11161c] shadow-[-8px_0_24px_rgba(0,0,0,0.85)] ${
            isCritical && !reducedMotion ? 'det-neon-pulse' : ''
          }`}
          style={{
            opacity: neonFlickerDim ? 0.25 : bulbCalm ? 0.45 : 0.92,
            background: neonGradient,
          }}
        >
          {/* Abstract neon strokes / rounded bars (NO readable text) */}
          <svg viewBox="0 0 120 240" className="absolute inset-0 w-full h-full">
            <rect
              x="20"
              y="32"
              width="58"
              height="12"
              rx="6"
              fill="none"
              stroke={neonStrokeColor}
              strokeWidth="4"
            />
            <line
              x1="28"
              y1="62"
              x2="88"
              y2="62"
              stroke={neonStrokeColor}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <rect
              x="24"
              y="84"
              width="48"
              height="44"
              rx="10"
              fill="none"
              stroke={neonStrokeColor}
              strokeWidth="4.5"
            />
            <line
              x1="20"
              y1="150"
              x2="92"
              y2="150"
              stroke={neonStrokeColor}
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <line
              x1="34"
              y1="176"
              x2="78"
              y2="176"
              stroke={neonStrokeColor}
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>

          {/* Horizontal venetian blind slats across neon window */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(180deg, rgba(5, 7, 10, 0.86) 0px, rgba(5, 7, 10, 0.86) 7px, transparent 7px, transparent 15px)',
            }}
          />

          {/* Rain streaks on neon pane (desktop only & reducedMotion-safe) */}
          {isDesktop && !reducedMotion && (
            <div className="det-neon-rain absolute inset-0 opacity-65" />
          )}

          {/* Rare horizontal colored glitch strips along neon edge */}
          {!reducedMotion && !bulbCalm && (
            <>
              <div className="det-neon-glitch absolute left-0 right-0 top-[28%] h-[2px] bg-[#22d3ee]" />
              <div className="det-neon-glitch absolute left-0 right-0 top-[66%] h-[2px] bg-[#f43f5e]" />
            </>
          )}
        </div>

        {/* Separate Neon-Spill Screen Layer (right -> center violet/magenta tint) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: neonSpillBg,
            mixBlendMode: 'screen',
            opacity: neonFlickerDim ? 0.14 : bulbCalm ? 0.25 : 0.34,
          }}
        />

        {/* Tension level 3 pulsing perimeter alert LED on right */}
        {isCritical && (
          <div className="absolute right-6 top-16 flex items-center gap-1.5 opacity-85">
            <span className="hw-led-dome w-3 h-3 hw-led-red-pulse inline-block" />
          </div>
        )}

        {/* Horizon molding strip */}
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-b from-[#10151c] via-[#0b0f14] to-[#05070a] border-t border-[#4b5766]/25" />
      </div>

      {/* ================= LAYER 2: FLUORESCENT TUBE (CENTER) & DEAD FIXTURE (LEFT) ================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden z-[2]"
      >
        {/* Second unlit dark fixture on left */}
        <div className="hidden sm:flex flex-col items-center absolute left-[18%] -top-1 opacity-75">
          <div className="flex gap-20">
            <span className="w-[2px] h-14 bg-[#0b0f14]" />
            <span className="w-[2px] h-14 bg-[#0b0f14]" />
          </div>
          <div className="w-32 h-2.5 bg-[#151b23] border border-[#05070a] rounded-[1px]" />
          <div className="w-28 h-1.5 bg-[#242e3a] border-b border-[#0b0f14]" />
        </div>

        {/* Center Suspended Fluorescent Tube */}
        <div
          className={`absolute left-1/2 -top-1 -translate-x-1/2 flex flex-col items-center ${
            !bulbCalm && lampOn && !reducedMotion ? 'det-tube-buzz' : ''
          }`}
        >
          {/* Two suspension cables */}
          <div className="flex justify-between w-40 sm:w-56">
            <span className="w-[2px] h-14 sm:h-[58px] bg-[#0b0f14]" />
            <span className="w-[2px] h-14 sm:h-[58px] bg-[#0b0f14]" />
          </div>

          {/* Fixture housing + bright cool #f4fbff tube */}
          <div className="relative flex flex-col items-center">
            <div className="w-48 sm:w-68 h-2.5 bg-[#1b222a] border border-[#05070a] rounded-[1px]" />
            <div
              className="w-48 sm:w-68 h-[7px] rounded-full transition-opacity duration-75"
              style={{
                backgroundColor: lampOn ? '#f4fbff' : '#2a3440',
                boxShadow: lampOn
                  ? '0 0 14px #dff0ff, 0 0 32px rgba(207, 232, 255, 0.7)'
                  : 'none',
                opacity: tubeFlickerDim ? 0.35 : 1,
              }}
            />
          </div>

          {/* Narrow, crisp cool fluorescent beam cone (#dff0ff -> #cfe8ff) */}
          {lampOn && (
            <div
              className="w-[520px] sm:w-[760px] h-[94vh] -mt-1"
              style={{
                clipPath: 'polygon(33% 0%, 67% 0%, 96% 100%, 4% 100%)',
                background:
                  'radial-gradient(ellipse 64% 72% at 50% 18%, rgba(223, 240, 255, 0.92) 0%, rgba(207, 232, 255, 0.34) 45%, transparent 78%)',
                mixBlendMode: 'screen',
                opacity: tubeVisibleOpacity,
              }}
            />
          )}
        </div>
      </div>

      {/* ================= LAYER 3: TREATED WOOD WORKBENCH ON SAWHORSES (~42% BOTTOM) ================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] sm:h-[42%] z-[3]"
        style={{ perspective: '900px' }}
      >
        {/* Treated dark oak plank tabletop */}
        <div
          className="absolute inset-x-[-14%] -top-10 bottom-14 origin-bottom"
          style={{
            transform: 'rotateX(62deg)',
            backgroundColor: '#1b1612',
            backgroundImage: lampOn
              ? 'radial-gradient(ellipse 52% 62% at 50% 42%, rgba(207, 232, 255, 0.14) 0%, rgba(255, 179, 71, 0.05) 36%, transparent 70%), repeating-linear-gradient(180deg, rgba(5, 7, 10, 0.42) 0px, rgba(5, 7, 10, 0.42) 2px, rgba(48, 38, 29, 0.92) 2px, rgba(31, 24, 18, 0.95) 56px)'
              : 'repeating-linear-gradient(180deg, rgba(5, 7, 10, 0.65) 0px, rgba(5, 7, 10, 0.65) 2px, #120e0b 2px, #0d0a08 56px)',
          }}
        >
          {/* Scratches, gouges & cold coffee ring stains */}
          <svg viewBox="0 0 1200 320" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-55">
            <line x1="180" y1="88" x2="310" y2="96" stroke="#3d3228" strokeWidth="1.2" />
            <line x1="210" y1="145" x2="345" y2="138" stroke="#0b0907" strokeWidth="1.4" />
            <line x1="780" y1="112" x2="940" y2="124" stroke="#3c3026" strokeWidth="1.2" />
            <line x1="840" y1="215" x2="975" y2="208" stroke="#090706" strokeWidth="1.3" />
            <circle cx="248" cy="238" r="24" fill="none" stroke="#120b06" strokeWidth="3.5" opacity="0.7" />
            <circle cx="965" cy="176" r="19" fill="none" stroke="#120b06" strokeWidth="3" opacity="0.6" />
          </svg>
        </div>

        {/* Workbench Front Thick Plank Edge (rim-lit by overhead fluorescent tube) + Sawhorse Legs */}
        <div
          className="absolute inset-x-0 bottom-0 h-[62px] border-t-2"
          style={{
            borderColor: lampOn ? 'rgba(207, 232, 255, 0.28)' : 'rgba(75, 87, 102, 0.18)',
            background:
              'linear-gradient(180deg, #272019 0%, #16110d 45%, #05070a 100%)',
          }}
        >
          {/* Sawhorse A-frame strut hints underneath front lip */}
          <div className="hidden sm:block absolute left-[12%] top-4 w-4 h-12 bg-[#140f0c] border-x border-black -skew-x-12" />
          <div className="hidden sm:block absolute right-[12%] top-4 w-4 h-12 bg-[#140f0c] border-x border-black skew-x-12" />
        </div>
      </div>

      {/* ================= LAYER 4: WORKBENCH PROPS ("DOSAR 03" MANILA FOLDER) ================= */}
      {showProps && (
        <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden">
          <div className="hidden sm:flex items-end gap-2 absolute left-[3%] bottom-4">
            <div aria-hidden="true" className="relative select-none">
              <div className="w-32 h-22 bg-gradient-to-br from-[#9e8963] to-[#68573b] border border-[#3d3221] rounded-[1px] shadow-[4px_8px_16px_rgba(0,0,0,0.88)] -rotate-6 p-2">
                <div className="inline-block bg-[#d8d4c8] px-1.5 py-0.5 font-tech text-[9px] font-bold text-[#15171a] border border-[#7c7668]">
                  DOSAR 03
                </div>
                <div className="mt-2 space-y-1 opacity-45">
                  <div className="h-[1px] w-18 bg-[#15171a]" />
                  <div className="h-[1px] w-14 bg-[#15171a]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= LAYER 5: DEVICE CONTACT SHADOW & FOREGROUND SCENE ================= */}
      {showDeviceShadow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[56%] -translate-x-1/2 z-[4] w-[82vw] max-w-[920px] h-24 rounded-full"
          style={{
            transform: `translate3d(${shadowShiftX}px, 0, 0) scaleX(${shadowScaleX})`,
            background:
              'radial-gradient(ellipse at center, rgba(5,7,10,0.88) 0%, rgba(5,7,10,0.48) 55%, transparent 78%)',
          }}
        />
      )}

      {/* Main Content Slot (Game UI, Cutscene, or Finale) */}
      <div className="relative z-[10] flex-1 flex flex-col min-h-0">{children}</div>

      {/* Bottom-left Detective Magnifying Glass Prop (Lupa pentru Serie & Baterii) */}
      {showProps && onOpenLoupe && (
        <button
          type="button"
          onClick={onOpenLoupe}
          aria-label="Inspecție carcasă"
          title="Lupă tehnică — Serie & Baterii"
          className="fixed bottom-[max(0.65rem,env(safe-area-inset-bottom))] left-2.5 sm:left-[12.5rem] z-[24] min-w-[44px] min-h-[44px] px-2.5 py-1.5 det-arcade-btn flex items-center gap-1.5 cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#ffd9a0]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 36 36"
            className="w-6 h-6 shrink-0 transition-transform duration-150 group-hover:scale-105"
          >
            {/* Brass rim + cyan/warm glass lens + bakelite handle */}
            <line
              x1="21"
              y1="21"
              x2="32"
              y2="32"
              stroke="#5c3d22"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <line
              x1="21"
              y1="21"
              x2="32"
              y2="32"
              stroke="#24160a"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx="14"
              cy="14"
              r="10"
              fill="rgba(186, 230, 253, 0.22)"
              stroke="#c99b42"
              strokeWidth="2.6"
            />
            <path
              d="M 9 10 A 6 6 0 0 1 16 8"
              fill="none"
              stroke="rgba(255, 250, 230, 0.72)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="det-dymo-label px-1.5 py-0.5 text-[10px] font-bold">
            LUPĂ
          </span>
        </button>
      )}

      {/* ================= LAYER 6: ATMOSPHERIC HAZE, FILM GRAIN, DUST & VIGNETTE ================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[50] overflow-hidden"
      >
        {/* Fog / smoke layers: 1 on mobile, 2 on desktop; cleared when bulbCalm */}
        {!bulbCalm && (
          <div
            className={`absolute -inset-12 ${!reducedMotion ? 'det-fog-drift-a' : ''}`}
            style={{
              background:
                'radial-gradient(ellipse 52% 42% at 30% 42%, rgba(160, 185, 212, 0.08) 0%, transparent 70%), radial-gradient(ellipse 46% 38% at 78% 36%, rgba(139, 92, 246, 0.07) 0%, transparent 72%)',
              opacity: isCritical ? 1 : 0.85,
            }}
          />
        )}
        {!bulbCalm && isDesktop && (
          <div
            className={`absolute -inset-12 ${!reducedMotion ? 'det-fog-drift-b' : ''}`}
            style={{
              background:
                'radial-gradient(ellipse 48% 36% at 62% 58%, rgba(145, 175, 208, 0.075) 0%, transparent 72%)',
            }}
          />
        )}

        {/* Animated 4-step tiled film grain (stronger at tensionLevel === 3) */}
        <div
          className="det-film-grain absolute -inset-6"
          style={{ opacity: isCritical ? 0.095 : 0.06 }}
        />

        {/* Dust motes inside cool fluorescent cone (max 8 mobile, 20 desktop) */}
        {!reducedMotion &&
          lampOn &&
          dustList.map((d) => (
            <span
              key={d.id}
              className="det-dust-mote absolute rounded-full bg-[#dff0ff]/50"
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

        {/* Deep noir vignette (tighter at tensionLevel 3) */}
        <div
          className="absolute inset-0"
          style={{
            background: isCritical
              ? 'radial-gradient(ellipse 66% 64% at 50% 48%, transparent 40%, rgba(5, 7, 10, 0.65) 75%, rgba(0, 0, 0, 0.9) 100%)'
              : 'radial-gradient(ellipse 74% 72% at 50% 48%, transparent 45%, rgba(5, 7, 10, 0.45) 78%, rgba(0, 0, 0, 0.8) 100%)',
          }}
        />
      </div>
    </div>
  );
};
