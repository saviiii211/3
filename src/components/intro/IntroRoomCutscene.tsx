import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { ambienceAudio } from '../../utils/ambience';
import { DetectiveSilhouette, type DetectivePose } from '../room/DetectiveSilhouette';

interface IntroRoomCutsceneProps {
  onComplete: () => void;
}

export const IntroRoomCutscene: React.FC<IntroRoomCutsceneProps> = ({
  onComplete,
}) => {
  const reducedMotion = usePrefersReducedMotion();

  const [doorOpen, setDoorOpen] = useState(false);
  const [detectiveVisible, setDetectiveVisible] = useState(false);
  const [detectiveX, setDetectiveX] = useState(145);
  const [walkDur, setWalkDur] = useState(2.2);
  const [pose, setPose] = useState<DetectivePose>('stand');
  const [bulbOn, setBulbOn] = useState(false);
  const [bulbFlicker, setBulbFlicker] = useState(false);
  const [chairX, setChairX] = useState(965);
  const [radioActive, setRadioActive] = useState(false);
  const [zoomToTable, setZoomToTable] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() =>
    typeof window !== 'undefined'
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: 1280, h: 720 }
  );

  const completedRef = useRef(false);

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const finishOnce = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  // Reduced motion: short calm fade directly into live game
  useEffect(() => {
    if (!reducedMotion) return;
    setBulbOn(true);
    setFadingOut(true);
    const tid = window.setTimeout(finishOnce, 320);
    return () => window.clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // 14-second noir entry & seating choreography
  useEffect(() => {
    if (reducedMotion) return;

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    // Show skip button subtly after 1.5s
    at(1500, () => setShowSkip(true));

    // 0.8s: door creaks & opens, cold doorway beam falls across floor
    at(800, () => {
      ambienceAudio.playDoorCreak();
      setDoorOpen(true);
    });

    // 1.8s: backlit silhouette appears at threshold
    at(1800, () => {
      setDetectiveVisible(true);
      setPose('stand');
    });

    // 2.6-5.0s: enters room (6 steps synced with muffled footsteps)
    at(2600, () => {
      setWalkDur(2.25);
      setPose('walk');
      setDetectiveX(630);
    });
    [2650, 3040, 3430, 3820, 4210, 4600].forEach((ms) => {
      at(ms, () => ambienceAudio.playFootstep());
    });

    // 5.0-7.0s: stops center, looks left, pauses, looks right, tips hat
    at(5000, () => setPose('lookLeft'));
    at(5750, () => setPose('lookRight'));
    at(6500, () => setPose('tipHat'));

    // 7.0-7.8s: door closes with muffled thud, overhead lamp clicks on with 2 flickers
    at(7000, () => {
      setDoorOpen(false);
      ambienceAudio.playDoorCloseThud();
    });
    at(7250, () => {
      ambienceAudio.playBulbPowerOn();
      setBulbOn(true);
      setBulbFlicker(true);
    });
    at(7380, () => setBulbFlicker(false));
    at(7520, () => setBulbFlicker(true));
    at(7640, () => setBulbFlicker(false));

    // 7.8-10.5s: walks toward table chair, pulls chair, sits down
    at(7850, () => {
      setWalkDur(1.3);
      setPose('walk');
      setDetectiveX(935);
    });
    [7950, 8350, 8750].forEach((ms) => {
      at(ms, () => ambienceAudio.playFootstep());
    });
    at(9150, () => {
      ambienceAudio.playChairScrape();
      setChairX(985);
    });
    at(9550, () => {
      setWalkDur(0.4);
      setPose('sit');
      setChairX(995);
    });

    // 10.5-11.5s: walkie-talkie on table crackles & lights up "CH 03 · SEMNAL SLAB"
    at(10500, () => {
      ambienceAudio.playRadioCrackle();
      setRadioActive(true);
    });

    // 11.5-13.5s: camera zooms toward table, silhouette exits frame, cross-fade to live game
    at(11500, () => {
      setZoomToTable(true);
    });
    at(12900, () => {
      setFadingOut(true);
    });
    at(13650, finishOnce);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Camera scale & horizontal pan so portrait phones follow detective smoothly (Door -> Center -> Table)
  const coverScale = Math.max(viewport.w / 1600, viewport.h / 900);
  const isPortrait = viewport.w < viewport.h * 0.95;

  // Center of attention shifts horizontally along the 1600px scene
  const focusX = zoomToTable
    ? 1110
    : detectiveVisible
      ? Math.max(360, Math.min(1080, detectiveX + 120))
      : 320;
  const panOffsetX = isPortrait
    ? Math.max(
        viewport.w - 1600 * coverScale,
        Math.min(0, viewport.w / 2 - focusX * coverScale)
      )
    : (viewport.w - 1600 * coverScale) / 2;

  return (
    <motion.div
      data-testid="intro-room-cutscene"
      initial={{ opacity: 1 }}
      animate={{ opacity: fadingOut ? 0 : 1 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
      className="fixed inset-0 z-[1050] bg-[#050606] overflow-hidden select-none"
    >
      {/* Cross-Section Virtual 1600x900 Room Camera Stage */}
      <motion.div
        className="absolute bottom-0 left-0 origin-bottom-left"
        style={{
          width: '1600px',
          height: '900px',
        }}
        animate={{
          x: zoomToTable ? panOffsetX - 210 * coverScale : panOffsetX,
          y: zoomToTable ? 110 * coverScale : 0,
          scale: zoomToTable ? coverScale * 1.58 : coverScale,
        }}
        transition={{
          duration: zoomToTable ? 1.8 : 1.1,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* ================= BACK WALL + PEELING WALLPAPER + COBWEB + PLASTER ================= */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[620px] det-wallpaper overflow-hidden"
        >
          {/* Damp stain */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 35% 44% at 32% 45%, rgba(56, 38, 22, 0.55) 0%, transparent 72%), radial-gradient(ellipse 30% 40% at 76% 32%, rgba(44, 34, 24, 0.45) 0%, transparent 72%)',
              mixBlendMode: 'multiply',
            }}
          />

          <svg viewBox="0 0 1600 620" className="w-full h-full">
            {/* Corner cobweb top-left */}
            <g stroke="#6d726c" strokeWidth="1" strokeOpacity="0.32" fill="none">
              <line x1="0" y1="0" x2="185" y2="35" />
              <line x1="0" y1="0" x2="155" y2="105" />
              <line x1="0" y1="0" x2="105" y2="165" />
              <line x1="0" y1="0" x2="45" y2="195" />
              <path d="M 45 8 Q 40 34 14 44" />
              <path d="M 92 17 Q 76 62 28 96" />
              <path d="M 142 26 Q 112 94 40 152" />
            </g>

            {/* Ceiling dangling cables */}
            <path d="M 460 0 Q 478 88 455 154" fill="none" stroke="#0c0d0d" strokeWidth="4" />
            <path d="M 476 0 Q 468 65 490 120" fill="none" stroke="#181b1a" strokeWidth="2.5" />
            <path d="M 1410 0 Q 1392 75 1418 148" fill="none" stroke="#0c0d0d" strokeWidth="3.5" />

            {/* Peeling wallpaper strips & plaster cracks */}
            <polygon points="360,88 430,72 412,174 352,150" fill="#101311" />
            <polyline points="430,72 412,174 422,164" fill="none" stroke="#2c342e" strokeWidth="2" />
            <polygon points="1290,120 1365,134 1344,218 1280,192" fill="#0f1210" />
            <path d="M 650 140 L 675 198 L 658 260 L 682 315" fill="none" stroke="#090b0a" strokeWidth="2" />

            {/* Corkboard in deep shadow behind table */}
            <g opacity={bulbOn ? 0.52 : 0.14}>
              <rect x="640" y="190" width="240" height="165" fill="#231c15" stroke="#110e0b" strokeWidth="5" />
              <rect x="665" y="212" width="46" height="54" fill="#6f6a5f" transform="rotate(-4 688 239)" />
              <rect x="735" y="206" width="58" height="42" fill="#635e54" transform="rotate(3 764 227)" />
              <rect x="810" y="226" width="48" height="58" fill="#757065" transform="rotate(-2 834 255)" />
              <polyline
                points="688,218 764,214 834,234 712,298 815,310 688,218"
                fill="none"
                stroke="#7f1d1d"
                strokeWidth="1.5"
              />
            </g>

            {/* Venetian window light slats (upper right) */}
            <g transform="rotate(-14 1320 150)" opacity="0.08">
              {[0, 1, 2, 3, 4, 5].map((b) => (
                <rect key={b} x="1180" y={65 + b * 48} width="380" height="22" fill="#7f9bb8" />
              ))}
            </g>

            {/* Overturned wooden chair in shadowed background */}
            <g transform="translate(495, 535) rotate(-68)" opacity={bulbOn ? 0.65 : 0.25}>
              <rect x="0" y="0" width="66" height="10" fill="#1b1510" stroke="#0a0806" strokeWidth="1.5" />
              <rect x="4" y="10" width="8" height="62" fill="#14100c" />
              <rect x="52" y="10" width="8" height="62" fill="#14100c" />
              <rect x="2" y="-68" width="8" height="68" fill="#17120e" />
            </g>
          </svg>

          {/* Baseboard */}
          <div className="absolute inset-x-0 bottom-0 h-6 bg-[#0d0f0e] border-t border-[#262b26]/50" />
        </div>

        {/* ================= WOODEN PLANK FLOOR ================= */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[280px]"
          style={{
            background:
              'linear-gradient(180deg, #1b1712 0%, #110e0b 55%, #060606 100%)',
          }}
        >
          {/* Wood plank joints + fallen plaster rubble bits */}
          <svg viewBox="0 0 1600 280" className="w-full h-full">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <line
                key={row}
                x1="0"
                y1={24 + row * 44}
                x2="1600"
                y2={24 + row * 44}
                stroke="#070605"
                strokeWidth="2"
              />
            ))}
            {[220, 510, 780, 1080, 1340].map((vx, i) => (
              <line
                key={vx}
                x1={vx}
                y1={(i % 2) * 44 + 24}
                x2={vx - 35}
                y2={(i % 2) * 44 + 68}
                stroke="#070605"
                strokeWidth="1.8"
              />
            ))}
            {/* Fallen plaster fragments */}
            <polygon points="355,48 370,44 374,56 359,58" fill="#4f4d44" />
            <polygon points="384,60 392,58 395,66 382,66" fill="#3d3b34" />
            <polygon points="1282,52 1296,49 1300,59 1285,61" fill="#4b4941" />
          </svg>
        </div>

        {/* ================= LEFT DOORFRAME & COLD HALLWAY LIGHT ================= */}
        <div
          aria-hidden="true"
          className="absolute left-[72px] top-[185px] w-[196px] h-[445px]"
          style={{ perspective: '900px' }}
        >
          {/* Open doorway cold blue interior */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(180deg, #7f9bb8 0%, #486079 68%, #222e3c 100%)',
              opacity: doorOpen ? 0.92 : 0,
            }}
          />

          {/* Thin cold light crack under closed door */}
          <div
            className="absolute inset-x-1 -bottom-1 h-2 bg-[#7f9bb8] blur-[1px] transition-opacity duration-300"
            style={{ opacity: doorOpen ? 0 : 0.4 }}
          />

          {/* Cold Trapezoidal Light Beam Cast Across Floor when Door Opens */}
          <div
            className="pointer-events-none absolute left-[8px] top-[440px] w-[520px] h-[220px] transition-opacity duration-500"
            style={{
              clipPath: 'polygon(0% 0%, 36% 0%, 100% 100%, 8% 100%)',
              background:
                'linear-gradient(125deg, rgba(127, 155, 184, 0.34) 0%, rgba(127, 155, 184, 0.08) 68%, transparent 100%)',
              opacity: doorOpen ? 1 : 0,
            }}
          />

          {/* Wooden Door Panel rotating in rotateY */}
          <motion.div
            animate={{ rotateY: doorOpen ? -76 : 0 }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'left center' }}
            className="relative w-full h-full bg-gradient-to-b from-[#2b231b] to-[#1a1510] border-4 border-[#110d0a] shadow-[12px_10px_28px_rgba(0,0,0,0.88)]"
          >
            {/* Peeling dark paint recessed panels */}
            <div className="m-5 h-[170px] border-2 border-[#120e0a] bg-[#211b14]" />
            <div className="mx-5 mt-5 h-[185px] border-2 border-[#120e0a] bg-[#1e1812]" />
            {/* Brass doorknob */}
            <div className="absolute right-3.5 top-[220px] w-4 h-4 rounded-full bg-[#b59449] border border-[#594418] shadow" />
          </motion.div>
        </div>

        {/* ================= TABLE, LACE CLOTH, DEVICE & WALKIE-TALKIE (Right-Center) ================= */}
        <div aria-hidden="true" className="absolute left-[960px] top-[465px] w-[420px] h-[240px]">
          {/* Wooden Chair (slides slightly as detective approaches & sits) */}
          <motion.div
            animate={{ x: chairX - 965 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute -left-[35px] top-[20px] w-[76px] h-[165px]"
          >
            <svg viewBox="0 0 80 170" className="w-full h-full">
              {/* Backrest */}
              <rect x="6" y="4" width="10" height="160" fill="#2c2117" stroke="#0c0805" strokeWidth="1.5" />
              <rect x="6" y="18" width="14" height="38" fill="#3a2b1d" />
              {/* Seat */}
              <rect x="8" y="84" width="66" height="10" fill="#3a2b1d" stroke="#0c0805" strokeWidth="1.5" />
              {/* Front leg */}
              <rect x="62" y="94" width="10" height="72" fill="#251b12" stroke="#0c0805" strokeWidth="1.2" />
            </svg>
          </motion.div>

          {/* Table Legs */}
          <div className="absolute left-[58px] top-[72px] w-4 h-[155px] bg-[#1c150f] border-x border-black" />
          <div className="absolute right-[44px] top-[72px] w-4 h-[155px] bg-[#17110c] border-x border-black" />

          {/* Table Top & Embroidered Lace Cloth Drape */}
          <div
            className="relative w-full h-[88px] rounded-[2px] border border-[#524d40] shadow-[0_18px_36px_rgba(0,0,0,0.92)] overflow-hidden transition-all duration-300"
            style={{
              background: bulbOn && !bulbFlicker
                ? 'linear-gradient(180deg, #d9d3c4 0%, #8a8576 58%, #3a382f 100%)'
                : 'linear-gradient(180deg, #2b2924 0%, #171612 65%, #080807 100%)',
            }}
          >
            {/* Subtle scalloped lace edge overhang */}
            <div className="absolute inset-x-0 bottom-0 h-5 border-t border-dashed border-[#bdb6a4]/45 bg-black/25" />
          </div>

          {/* 3D Matte Gray Device Silhouette on Table */}
          <div
            className="absolute left-[138px] -top-[42px] w-[148px] h-[54px] border border-[#595b57] shadow-lg transition-colors duration-300"
            style={{
              background: bulbOn && !bulbFlicker ? '#c2c4bf' : '#1e201e',
            }}
          >
            <div className="h-2 bg-[#172030]" />
            <div className="p-1.5 grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-6 border ${
                    bulbOn && !bulbFlicker
                      ? 'bg-[#e6e1d3] border-[#6d6f6b]'
                      : 'bg-[#15171a] border-black'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Yellow/Black Walkie-Talkie on Table Edge */}
          <div
            className="absolute left-[298px] -top-[18px] w-[42px] h-[22px] -rotate-12 border border-black shadow-md transition-colors duration-300 flex items-center justify-center"
            style={{
              background: bulbOn && !bulbFlicker ? '#f1c40f' : '#2f2708',
            }}
          >
            <div
              className={`w-6 h-3 transition-all duration-200 ${
                radioActive
                  ? 'bg-[#9be15d] shadow-[0_0_8px_#9be15d]'
                  : 'bg-[#1b2a12]'
              }`}
            />
          </div>

          {/* Radio Status Slip at 10.5s */}
          {radioActive && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-[255px] -top-[58px] bg-[#1b2a12] border border-[#9be15d]/60 px-2 py-1 font-lcd text-sm text-[#9be15d] whitespace-nowrap shadow-[0_0_12px_rgba(155,225,93,0.3)]"
            >
              CH 03 · SEMNAL SLAB
            </motion.div>
          )}
        </div>

        {/* ================= DETECTIVE SILHOUETTE ================= */}
        {detectiveVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: detectiveX }}
            transition={{
              opacity: { duration: 0.45 },
              x: { duration: walkDur, ease: 'linear' },
            }}
            className="absolute left-0 top-[248px] w-[190px] h-[398px] z-[8]"
          >
            <DetectiveSilhouette
              pose={pose}
              facing="right"
              rimSide={bulbOn ? 'right' : 'left'}
              showDoorShadow={doorOpen && !bulbOn}
              className="w-full h-full"
            />
          </motion.div>
        )}

        {/* ================= HANGING OVERHEAD LAMP & WARM LIGHT CONE ================= */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[1130px] top-0 -translate-x-1/2 flex flex-col items-center z-[12]"
        >
          <div className="w-[3px] h-[160px] bg-[#0c0d0d]" />
          <svg viewBox="0 0 120 48" className="w-28 h-12 -mt-0.5">
            <rect x="54" y="0" width="12" height="9" fill="#181b19" />
            <path d="M 48 8 L 72 8 L 106 38 L 14 38 Z" fill="#16231b" stroke="#0c120e" strokeWidth="1.5" />
            <ellipse
              cx="60"
              cy="38"
              rx="45"
              ry="6"
              fill={bulbOn && !bulbFlicker ? '#d9d3c4' : '#2a2c29'}
            />
            <circle
              cx="60"
              cy="40"
              r="7.5"
              fill={bulbOn && !bulbFlicker ? '#ffd9a0' : '#2a2d2b'}
            />
          </svg>

          {bulbOn && !bulbFlicker && (
            <div
              className="w-[780px] h-[540px] -mt-2"
              style={{
                clipPath: 'polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)',
                background:
                  'radial-gradient(ellipse 68% 76% at 50% 24%, rgba(255, 217, 160, 0.92) 0%, rgba(232, 182, 111, 0.42) 52%, transparent 82%)',
                mixBlendMode: 'screen',
                opacity: 0.25,
              }}
            />
          )}
        </div>
      </motion.div>

      {/* Dark ambient veil before bulb turns on */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#050606] transition-opacity duration-500"
        style={{
          opacity: doorOpen && !bulbOn ? 0.28 : !doorOpen && !bulbOn ? 0.85 : 0,
        }}
      />

      {/* Film grain & perimeter vignette over cutscene */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        <div className="det-film-grain absolute -inset-6" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 74% 72% at 50% 48%, transparent 50%, rgba(5, 6, 6, 0.58) 84%, rgba(5, 6, 6, 0.92) 100%)',
          }}
        />
      </div>

      {/* Discreet Skip Button (bottom-right after 1.5s) */}
      {showSkip && !reducedMotion && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          whileHover={{ opacity: 1 }}
          onClick={finishOnce}
          aria-label="Sari peste animația de introducere"
          className="fixed bottom-5 right-5 z-30 min-h-[44px] px-3.5 py-2 det-dymo-label text-xs font-bold tracking-wider cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd9a0]"
        >
          Sari peste ▸▸
        </motion.button>
      )}
    </motion.div>
  );
};
