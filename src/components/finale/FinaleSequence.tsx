import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Play, SkipForward } from 'lucide-react';
import { FINALE_VIDEO_POSTER, FINALE_VIDEO_SRC } from '../../config';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { ambienceAudio } from '../../utils/ambience';
import { DetectiveSilhouette, type DetectivePose } from '../room/DetectiveSilhouette';

interface FinaleSequenceProps {
  startAtVideo?: boolean;
  onComplete: () => void;
}

export const FinaleSequence: React.FC<FinaleSequenceProps> = ({
  startAtVideo = false,
  onComplete,
}) => {
  const reducedMotion = usePrefersReducedMotion();

  const [stage, setStage] = useState<'scene' | 'video'>(() =>
    startAtVideo || reducedMotion ? 'video' : 'scene'
  );
  const [pullBackWide, setPullBackWide] = useState(false);
  const [pose, setPose] = useState<DetectivePose>('sit');
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [detectiveX, setDetectiveX] = useState(935);
  const [walkDur, setWalkDur] = useState(0.5);
  const [detectiveOpacity, setDetectiveOpacity] = useState(1);
  const [chairX, setChairX] = useState(995);
  const [showBreathPuffs, setShowBreathPuffs] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [morningBloom, setMorningBloom] = useState(false);

  const [videoStarted, setVideoStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() =>
    typeof window !== 'undefined'
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: 1280, h: 720 }
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const finishFinale = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      videoRef.current?.pause();
    } catch {
      // ignore
    }
    onComplete();
  };

  // 9-second room relief & morning exit choreography
  useEffect(() => {
    if (stage !== 'scene' || startAtVideo || reducedMotion) return;

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    // 0.1s: Pull camera back from table close-up to wide shot with seated detective
    at(120, () => setPullBackWide(true));

    // 3.0s: Stands up, chair scrapes slightly
    at(3000, () => {
      ambienceAudio.playChairScrape();
      setChairX(1018);
      setPose('stand');
    });

    // 3.5s: Long relieved exhale + 3 rising breath mist puffs
    at(3500, () => {
      ambienceAudio.playExhale();
      setPose('exhale');
      setShowBreathPuffs(true);
    });

    // 4.4s: Wipes brow
    at(4450, () => {
      setShowBreathPuffs(false);
      setPose('wipeBrow');
    });

    // 5.2s: Adjusts fedora & nods satisfied
    at(5200, () => setPose('tipHat'));

    // 6.0s: Walks left toward door
    at(6000, () => {
      setFacing('left');
      setWalkDur(1.8);
      setPose('walk');
      setDetectiveX(215);
    });
    [6080, 6450, 6820, 7190].forEach((ms) => {
      at(ms, () => ambienceAudio.playFootstep());
    });

    // 7.3s: Opens door into warm morning daylight (#fff1c9)
    at(7300, () => {
      ambienceAudio.playDoorCreak();
      setDoorOpen(true);
    });

    // 7.9s: Exits through door into expanding golden morning bloom
    at(7900, () => {
      setDetectiveOpacity(0);
      setMorningBloom(true);
    });

    // 9.1s: Cross-fade from golden bloom into Film Projection Screen
    at(9100, () => {
      setStage('video');
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [stage, startAtVideo, reducedMotion]);

  const handlePlayVideo = async () => {
    const el = videoRef.current;
    if (!el) return;
    setVideoError(false);
    try {
      await el.play();
      setVideoStarted(true);
    } catch {
      setVideoError(true);
    }
  };

  const coverScale = Math.max(viewport.w / 1600, viewport.h / 900);
  const isPortrait = viewport.w < viewport.h * 0.95;

  const focusX = pullBackWide
    ? Math.max(300, Math.min(1040, detectiveX + 90))
    : 1110;
  const panOffsetX = isPortrait
    ? Math.max(
        viewport.w - 1600 * coverScale,
        Math.min(0, viewport.w / 2 - focusX * coverScale)
      )
    : (viewport.w - 1600 * coverScale) / 2;

  return (
    <div
      data-testid="finale-sequence"
      className="fixed inset-0 z-[1230] bg-[#050606] overflow-hidden select-none"
    >
      {/* ================= STAGE 1: ROOM RELIEF & MORNING EXIT (0-9s) ================= */}
      {stage === 'scene' && (
        <div className="relative w-full h-full">
          <motion.div
            className="absolute bottom-0 left-0 origin-bottom-left"
            style={{ width: '1600px', height: '900px' }}
            initial={{
              x: panOffsetX - 210 * coverScale,
              y: 110 * coverScale,
              scale: coverScale * 1.56,
            }}
            animate={{
              x: pullBackWide ? panOffsetX : panOffsetX - 210 * coverScale,
              y: pullBackWide ? 0 : 110 * coverScale,
              scale: pullBackWide ? coverScale : coverScale * 1.56,
            }}
            transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Room Wall */}
            <div
              className="absolute inset-x-0 top-0 h-[620px] overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #242e3a 0%, #151b23 48%, #0a0e13 100%)',
              }}
            >
              <div className="absolute inset-x-0 bottom-0 h-[235px] bg-[#10151c] border-t border-[#4b5766]/35" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 35% 44% at 32% 45%, rgba(5, 7, 10, 0.38) 0%, transparent 72%)',
                  mixBlendMode: 'multiply',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-6 bg-[#0a0e13] border-t border-[#4b5766]/30" />
            </div>

            {/* Plank Floor */}
            <div
              className="absolute inset-x-0 bottom-0 h-[280px]"
              style={{
                background:
                  'linear-gradient(180deg, #1b1712 0%, #110e0b 55%, #060606 100%)',
              }}
            />

            {/* Left Door opening to Warm Morning Daylight (#fff1c9) */}
            <div
              className="absolute left-[72px] top-[185px] w-[196px] h-[445px]"
              style={{ perspective: '900px' }}
            >
              {/* Warm Morning Exterior */}
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background:
                    'linear-gradient(180deg, #fff1c9 0%, #ffd9a0 65%, #e8b66f 100%)',
                  opacity: doorOpen ? 1 : 0,
                }}
              />

              {/* Warm Morning Floor Light Trapezoid */}
              <div
                className="pointer-events-none absolute left-[8px] top-[440px] w-[580px] h-[230px] transition-opacity duration-500"
                style={{
                  clipPath: 'polygon(0% 0%, 40% 0%, 100% 100%, 8% 100%)',
                  background:
                    'linear-gradient(125deg, rgba(255, 241, 201, 0.5) 0%, rgba(255, 217, 160, 0.14) 70%, transparent 100%)',
                  opacity: doorOpen ? 1 : 0,
                }}
              />

              {/* Door Panel */}
              <motion.div
                animate={{ rotateY: doorOpen ? -78 : 0 }}
                transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'left center' }}
                className="relative w-full h-full bg-gradient-to-b from-[#2b231b] to-[#1a1510] border-4 border-[#110d0a] shadow-2xl"
              >
                <div className="m-5 h-[170px] border-2 border-[#120e0a] bg-[#211b14]" />
                <div className="mx-5 mt-5 h-[185px] border-2 border-[#120e0a] bg-[#1e1812]" />
                <div className="absolute right-3.5 top-[220px] w-4 h-4 rounded-full bg-[#b59449] border border-[#594418]" />
              </motion.div>
            </div>

            {/* Table + Neutralized Device (All Green LEDs) + Radio ("NEUTRALIZAT") */}
            <div className="absolute left-[960px] top-[465px] w-[420px] h-[240px]">
              <motion.div
                animate={{ x: chairX - 965 }}
                transition={{ duration: 0.45 }}
                className="absolute -left-[35px] top-[20px] w-[76px] h-[165px]"
              >
                <svg viewBox="0 0 80 170" className="w-full h-full">
                  <rect x="6" y="4" width="10" height="160" fill="#2c2117" stroke="#0c0805" strokeWidth="1.5" />
                  <rect x="8" y="84" width="66" height="10" fill="#3a2b1d" stroke="#0c0805" strokeWidth="1.5" />
                  <rect x="62" y="94" width="10" height="72" fill="#251b12" stroke="#0c0805" strokeWidth="1.2" />
                </svg>
              </motion.div>

              <div className="absolute left-[58px] top-[72px] w-4 h-[155px] bg-[#1c150f] border-x border-black" />
              <div className="absolute right-[44px] top-[72px] w-4 h-[155px] bg-[#17110c] border-x border-black" />

              <div
                className="relative w-full h-[88px] rounded-[2px] border border-[#524d40] shadow-2xl overflow-hidden"
                style={{
                  background:
                    'linear-gradient(180deg, #d9d3c4 0%, #8a8576 58%, #3a382f 100%)',
                }}
              />

              {/* Device Silhouette with All Green LEDs */}
              <div className="absolute left-[138px] -top-[42px] w-[148px] h-[54px] bg-[#c2c4bf] border border-[#595b57] shadow-lg">
                <div className="h-2 bg-[#172030]" />
                <div className="p-1.5 grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="relative h-6 bg-[#e6e1d3] border border-[#6d6f6b]">
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#3ddc84] shadow-[0_0_4px_#3ddc84]" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Walkie-Talkie on Table */}
              <div className="absolute left-[298px] -top-[18px] w-[42px] h-[22px] -rotate-12 bg-[#f1c40f] border border-black flex items-center justify-center">
                <div className="w-6 h-3 bg-[#9be15d]" />
              </div>
              <div className="absolute left-[250px] -top-[56px] bg-[#1b2a12] border border-[#9be15d]/60 px-2 py-1 font-lcd text-sm text-[#9be15d] whitespace-nowrap">
                NEUTRALIZAT
              </div>
            </div>

            {/* Detective Silhouette + 3 Exhale Mist Puffs */}
            <motion.div
              animate={{ x: detectiveX, opacity: detectiveOpacity }}
              transition={{
                x: { duration: walkDur, ease: 'linear' },
                opacity: { duration: 0.65 },
              }}
              className="absolute left-0 top-[248px] w-[190px] h-[398px] z-[8]"
            >
              <DetectiveSilhouette
                pose={pose}
                facing={facing}
                rimSide={doorOpen ? 'left' : 'right'}
                className="w-full h-full"
              />

              {/* 3 Soft Rising Breath / Exhale Puffs (transform + opacity only) */}
              {showBreathPuffs &&
                [0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.52, y: 0, x: 0, scale: 0.65 }}
                    animate={{
                      opacity: 0,
                      y: -48 - i * 18,
                      x: 16 + i * 10,
                      scale: 1.45 + i * 0.25,
                    }}
                    transition={{
                      duration: 1.05,
                      delay: i * 0.16,
                      ease: 'easeOut',
                    }}
                    className="pointer-events-none absolute left-[112px] top-[76px] w-7 h-5 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(230, 225, 211, 0.55) 0%, transparent 72%)',
                    }}
                  />
                ))}
            </motion.div>

            {/* Calm Warm Hanging Bulb (Tension 0) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-[1130px] top-0 -translate-x-1/2 flex flex-col items-center z-[12]"
            >
              <div className="w-[3px] h-[160px] bg-[#0c0d0d]" />
              <svg viewBox="0 0 120 48" className="w-28 h-12 -mt-0.5">
                <rect x="54" y="0" width="12" height="9" fill="#181b19" />
                <path d="M 48 8 L 72 8 L 106 38 L 14 38 Z" fill="#16231b" stroke="#0c120e" strokeWidth="1.5" />
                <ellipse cx="60" cy="38" rx="45" ry="6" fill="#d9d3c4" />
                <circle cx="60" cy="40" r="7.5" fill="#ffd9a0" />
              </svg>
              <div
                className="w-[820px] h-[560px] -mt-2"
                style={{
                  clipPath: 'polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)',
                  background:
                    'radial-gradient(ellipse 68% 76% at 50% 24%, rgba(255, 217, 160, 0.95) 0%, rgba(232, 182, 111, 0.45) 52%, transparent 82%)',
                  mixBlendMode: 'screen',
                  opacity: 0.24,
                }}
              />
            </div>
          </motion.div>

          {/* Expanding Golden Morning Bloom transition at 7.9s -> 9.1s */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: morningBloom ? 1 : 0 }}
            transition={{ duration: 1.05, ease: 'easeIn' }}
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              background:
                'radial-gradient(circle at 22% 55%, #fff9e6 0%, #fff1c9 45%, #ffd9a0 100%)',
            }}
          />

          {/* Skip button during 9s finale exit */}
          <button
            type="button"
            onClick={() => setStage('video')}
            aria-label="Sari la clipul final"
            className="fixed bottom-5 right-5 z-30 min-h-[44px] px-3.5 py-2 det-dymo-label text-xs font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd9a0]"
          >
            Sari peste ▸▸
          </button>
        </div>
      )}

      {/* ================= STAGE 2: FILM PROJECTION SCREEN ================= */}
      {stage === 'video' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0.2 : 0.7 }}
          className="relative w-full h-full bg-[#070808] flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          {/* Film-strip Sprocket Frame & Brass Bezel */}
          <div className="relative w-full max-w-3xl bg-[#111314] border-4 border-[#5e4d2d] shadow-[0_24px_60px_rgba(0,0,0,0.95)] p-3 sm:p-5">
            {/* Top Sprocket Film Perforation Strip */}
            <div
              aria-hidden="true"
              className="h-3 mb-2.5 flex items-center justify-between px-2 opacity-60"
            >
              {Array.from({ length: 16 }).map((_, idx) => (
                <span key={idx} className="w-3 h-2 bg-[#050606] border border-[#3a382f] rounded-[1px]" />
              ))}
            </div>

            {/* Frame Header: Brass/Dymo Label + Always-visible Skip Clip button */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="det-dymo-label px-3 py-1 text-xs font-bold">
                PREMIU — DOSAR 03
              </span>
              <button
                type="button"
                onClick={finishFinale}
                aria-label="Sari peste clip și mergi la raportul final"
                className="det-arcade-btn min-h-[44px] px-3.5 py-1.5 flex items-center gap-1.5 font-display text-xs font-bold text-[#ffd9a0] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd9a0]"
              >
                <span>Sari peste clip ▸▸</span>
                <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative w-full aspect-video bg-black border-2 border-[#2a2822] overflow-hidden flex items-center justify-center">
              {/* Recomandat: MP4 H.264 + AAC, 720p, sub 40MB */}
              <video
                ref={videoRef}
                src={FINALE_VIDEO_SRC}
                poster={FINALE_VIDEO_POSTER ?? undefined}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onPlay={() => setVideoStarted(true)}
                onError={() => setVideoError(true)}
                onEnded={finishFinale}
                className="w-full h-full object-contain bg-black"
              />

              {/* Big Play Overlay (required on mobile for audio playback gesture) */}
              {!videoStarted && !videoError && (
                <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center p-4 text-center">
                  <button
                    type="button"
                    onClick={() => void handlePlayVideo()}
                    aria-label="Redare clip final"
                    className="det-arcade-btn min-h-[56px] px-7 py-3.5 flex items-center gap-3 border-2 border-[#ffd9a0] font-display text-lg font-bold text-[#ffd9a0] shadow-2xl cursor-pointer hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <Play className="w-6 h-6 fill-current" aria-hidden="true" />
                    <span>▶ Redare</span>
                  </button>
                </div>
              )}

              {/* Discreet Missing/Error Video Fallback */}
              {videoError && (
                <div className="absolute inset-0 bg-[#0d0e0f]/95 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <p className="font-tech text-sm sm:text-base text-[#e6e1d3]">
                    Clipul nu a putut fi încărcat
                  </p>
                  <button
                    type="button"
                    onClick={finishFinale}
                    aria-label="Continuă către raportul final"
                    className="det-arcade-btn min-h-[46px] px-6 py-2.5 font-display text-sm font-bold text-[#ffd9a0] cursor-pointer"
                  >
                    Continuă
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Sprocket Film Perforation Strip */}
            <div
              aria-hidden="true"
              className="h-3 mt-2.5 flex items-center justify-between px-2 opacity-60"
            >
              {Array.from({ length: 16 }).map((_, idx) => (
                <span key={idx} className="w-3 h-2 bg-[#050606] border border-[#3a382f] rounded-[1px]" />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
