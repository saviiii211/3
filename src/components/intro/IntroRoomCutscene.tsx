import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { ambienceAudio } from '../../utils/ambience';
import { soundEngine } from '../../utils/sound';

// ============================================================================
// CONSTANTE DE TIMING (în milisecunde) — ușor de ajustat pentru fiecare pas
// ============================================================================
const TIMING = {
  /** 0.0–0.8 s: ecran negru + text VT323 „SINAIA · 03:03” în stânga-jos */
  BLACK_OPEN_MS: 800,
  /** 0.8–2.2 s: lampa clipește de 2–3 ori și se aprinde progresiv */
  LAMP_FLICKER_START_MS: 800,
  LAMP_STEADY_MS: 2200,
  /** 2.2–3.2 s: valiza urcă 7 px cu fade-in, dosarul glisează 20 px din dreapta */
  OBJECTS_REVEAL_MS: 2200,
  FOLDER_SLIDE_MS: 2520,
  /** 3.2–4.2 s: ștampila „STRICT SECRET” lovește dosarul (180 ms) + shake 2 px */
  STAMP_IMPACT_MS: 3200,
  SHAKE_DURATION_MS: 230,
  /** 4.2–6.2 s: panoul cu povestea în Courier Prime (efect typewriter) */
  STORY_START_MS: 4200,
  STORY_TYPE_INTERVAL_MS: 16,
  /** 6.2–7.5 s: LED chihlimbar aprins, LCD „03:03”, LED roșu pulsează încet */
  BRIEFCASE_ARM_MS: 6200,
  /** 7.5 s+: buton central „ÎNCEPE MISIUNEA” + „Citește manualul” */
  BUTTONS_REVEAL_MS: 7500,
  /** Durata fade-out spre negru la pornirea jocului */
  FADE_OUT_MS: 700,
} as const;

const STORY_LINES = [
  'Cineva a lăsat o valiză pe masa din biroul vechi.',
  'Ceasul numără înapoi. Ai nevoie de ajutor ca să o dezamorsezi.',
  'Manualul e singura ta șansă.',
];

const STORY_FULL_TEXT = STORY_LINES.join('\n');

interface DustMote {
  id: number;
  leftPct: number;
  topPct: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  opacity: number;
}

const DUST_MOTES: DustMote[] = [
  { id: 1, leftPct: 36, topPct: 26, sizePx: 2, durationSec: 13, delaySec: -2, opacity: 0.42 },
  { id: 2, leftPct: 44, topPct: 38, sizePx: 3, durationSec: 17, delaySec: -6, opacity: 0.35 },
  { id: 3, leftPct: 52, topPct: 24, sizePx: 2, durationSec: 15, delaySec: -4, opacity: 0.45 },
  { id: 4, leftPct: 60, topPct: 34, sizePx: 2.5, durationSec: 19, delaySec: -9, opacity: 0.32 },
  { id: 5, leftPct: 39, topPct: 48, sizePx: 2, durationSec: 14, delaySec: -11, opacity: 0.38 },
  { id: 6, leftPct: 49, topPct: 42, sizePx: 3, durationSec: 18, delaySec: -3, opacity: 0.44 },
  { id: 7, leftPct: 56, topPct: 50, sizePx: 2, durationSec: 16, delaySec: -7, opacity: 0.34 },
  { id: 8, leftPct: 64, topPct: 44, sizePx: 2, durationSec: 20, delaySec: -12, opacity: 0.3 },
  { id: 9, leftPct: 42, topPct: 56, sizePx: 2.5, durationSec: 15, delaySec: -5, opacity: 0.4 },
  { id: 10, leftPct: 54, topPct: 58, sizePx: 2, durationSec: 12.5, delaySec: -8, opacity: 0.46 },
  { id: 11, leftPct: 47, topPct: 30, sizePx: 2, durationSec: 16.5, delaySec: -1, opacity: 0.36 },
  { id: 12, leftPct: 58, topPct: 28, sizePx: 2.5, durationSec: 14.5, delaySec: -10, opacity: 0.38 },
  { id: 13, leftPct: 34, topPct: 42, sizePx: 2, durationSec: 18.5, delaySec: -14, opacity: 0.28 },
  { id: 14, leftPct: 67, topPct: 54, sizePx: 2, durationSec: 17.5, delaySec: -6, opacity: 0.28 },
  { id: 15, leftPct: 51, topPct: 49, sizePx: 2, durationSec: 13.5, delaySec: -9, opacity: 0.42 },
  { id: 16, leftPct: 45, topPct: 63, sizePx: 2, durationSec: 19.5, delaySec: -4, opacity: 0.32 },
];

function hasUserGesture(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = (navigator as unknown as { userActivation?: { hasBeenActive?: boolean } })
    .userActivation;
  return Boolean(ua?.hasBeenActive);
}

interface IntroRoomCutsceneProps {
  onComplete: () => void;
  onOpenManual?: () => void;
}

export const IntroRoomCutscene: React.FC<IntroRoomCutsceneProps> = ({
  onComplete,
  onOpenManual,
}) => {
  const reducedMotion = usePrefersReducedMotion();

  const [stampIntroVisible, setStampIntroVisible] = useState<boolean>(() => !reducedMotion);
  const [lampPhase, setLampPhase] = useState<'off' | 'flicker' | 'on'>(() =>
    reducedMotion ? 'on' : 'off'
  );
  const [objectsVisible, setObjectsVisible] = useState<boolean>(() => reducedMotion);
  const [folderVisible, setFolderVisible] = useState<boolean>(() => reducedMotion);
  const [stamped, setStamped] = useState<boolean>(() => reducedMotion);
  const [impactShake, setImpactShake] = useState<boolean>(false);
  const [storyVisible, setStoryVisible] = useState<boolean>(() => reducedMotion);
  const [storyChars, setStoryChars] = useState<number>(() =>
    reducedMotion ? STORY_FULL_TEXT.length : 0
  );
  const [briefcaseArmed, setBriefcaseArmed] = useState<boolean>(() => reducedMotion);
  const [buttonsVisible, setButtonsVisible] = useState<boolean>(() => reducedMotion);
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  const timersRef = useRef<number[]>([]);
  const typeIntervalRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);

  const clearSequenceTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
    if (typeIntervalRef.current !== null) {
      window.clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }
  }, []);

  const triggerFinish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearSequenceTimers();
    if (hasUserGesture()) {
      soundEngine.playClick();
    }
    if (reducedMotion) {
      onComplete();
      return;
    }
    setFadingOut(true);
    window.setTimeout(() => {
      onComplete();
    }, TIMING.FADE_OUT_MS);
  }, [clearSequenceTimers, onComplete, reducedMotion]);

  const jumpToFinalState = useCallback(() => {
    clearSequenceTimers();
    if (hasUserGesture()) {
      soundEngine.playClick();
    }
    setStampIntroVisible(false);
    setLampPhase('on');
    setObjectsVisible(true);
    setFolderVisible(true);
    setStamped(true);
    setImpactShake(false);
    setStoryVisible(true);
    setStoryChars(STORY_FULL_TEXT.length);
    setBriefcaseArmed(true);
    setButtonsVisible(true);
  }, [clearSequenceTimers]);

  // If reduced motion becomes active, show final static state with buttons immediately
  useEffect(() => {
    if (!reducedMotion) return;
    jumpToFinalState();
  }, [reducedMotion, jumpToFinalState]);

  // Choreographed ~8 second noir desk reveal sequence
  useEffect(() => {
    if (reducedMotion) return;

    const schedule = (ms: number, fn: () => void) => {
      timersRef.current.push(window.setTimeout(fn, ms));
    };

    // 0.8s: Old lamp flickers 2-3 times and turns on
    schedule(TIMING.LAMP_FLICKER_START_MS, () => {
      setStampIntroVisible(false);
      setLampPhase('flicker');
      if (hasUserGesture()) {
        ambienceAudio.playBulbPowerOn();
      }
    });

    schedule(TIMING.LAMP_STEADY_MS, () => {
      setLampPhase('on');
    });

    // 2.2–3.2s: Briefcase rises 7px + walkie-talkie appears; folder slides 20px from right
    schedule(TIMING.OBJECTS_REVEAL_MS, () => {
      setObjectsVisible(true);
    });
    schedule(TIMING.FOLDER_SLIDE_MS, () => {
      setFolderVisible(true);
    });

    // 3.2–4.2s: "STRICT SECRET" stamp hits folder + 2px scene shake
    schedule(TIMING.STAMP_IMPACT_MS, () => {
      setStamped(true);
      setImpactShake(true);
      if (hasUserGesture()) {
        ambienceAudio.playDoorCloseThud();
      }
      schedule(TIMING.SHAKE_DURATION_MS, () => {
        setImpactShake(false);
      });
    });

    // 4.2–6.2s: Courier Prime story typewriter panel
    schedule(TIMING.STORY_START_MS, () => {
      setStoryVisible(true);
      let count = 0;
      typeIntervalRef.current = window.setInterval(() => {
        count += 1;
        setStoryChars(count);
        if (count >= STORY_FULL_TEXT.length && typeIntervalRef.current !== null) {
          window.clearInterval(typeIntervalRef.current);
          typeIntervalRef.current = null;
        }
      }, TIMING.STORY_TYPE_INTERVAL_MS);
    });

    // 6.2–7.5s: Amber LED on, LCD switches "--:--" -> "03:03", red LED begins slow pulse
    schedule(TIMING.BRIEFCASE_ARM_MS, () => {
      setBriefcaseArmed(true);
      if (hasUserGesture()) {
        soundEngine.playClick();
      }
    });

    // 7.5s+: Central Dymo CTA + secondary "Citește manualul" button
    schedule(TIMING.BUTTONS_REVEAL_MS, () => {
      setButtonsVisible(true);
    });

    return () => {
      clearSequenceTimers();
    };
  }, [reducedMotion, clearSequenceTimers]);

  const handleSkipClick = () => {
    if (buttonsVisible) {
      triggerFinish();
    } else {
      jumpToFinalState();
    }
  };

  const typedLines = useMemo(() => {
    const visibleText = STORY_FULL_TEXT.slice(0, storyChars);
    return visibleText.split('\n');
  }, [storyChars]);

  const lampLit = lampPhase !== 'off';

  return (
    <div
      data-testid="intro-room-cutscene"
      className={`fixed inset-0 z-[1050] bg-[#050606] text-[#e6e1d3] overflow-hidden select-none transition-opacity ease-in-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${TIMING.FADE_OUT_MS}ms` }}
    >
      {/* Shakeable scene container (2px jolt on stamp impact) */}
      <div
        className={`relative w-full h-full flex flex-col justify-between ${
          impactShake && !reducedMotion ? 'intro-scene-shake' : ''
        }`}
      >
        {/* ================= 1. PERETELE & LUMINĂ RECE DE FEREASTRĂ ================= */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: lampLit ? 1 : 0.08,
            background:
              'linear-gradient(180deg, #050606 0%, #141a17 48%, #0d120f 72%, #050606 100%)',
          }}
        >
          {/* Textură subtilă de tapet (linii verticale fine, 3–4% opacitate) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(230, 225, 211, 0.035) 0px, rgba(230, 225, 211, 0.035) 1px, transparent 1px, transparent 22px)',
            }}
          />

          {/* Rază diagonală slabă de lumină rece ca de la o fereastră */}
          <div
            className="absolute -top-12 right-[6%] w-[clamp(160px,34vw,380px)] h-[75vh]"
            style={{
              background:
                'linear-gradient(155deg, rgba(127, 155, 184, 0.08) 0%, rgba(127, 155, 184, 0.035) 48%, transparent 82%)',
              clipPath: 'polygon(30% 0%, 100% 0%, 64% 100%, 0% 100%)',
            }}
          />
        </div>

        {/* ================= 2. PARTICULE DE PRAF ÎN CONUL DE LUMINĂ ================= */}
        {lampLit && !reducedMotion && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            {DUST_MOTES.map((mote) => (
              <span
                key={mote.id}
                className="intro-dust-mote absolute rounded-full bg-[#ffd9a0]"
                style={{
                  left: `${mote.leftPct}%`,
                  top: `${mote.topPct}%`,
                  width: `${mote.sizePx}px`,
                  height: `${mote.sizePx}px`,
                  opacity: mote.opacity,
                  animationDuration: `${mote.durationSec}s`,
                  animationDelay: `${mote.delaySec}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* ================= 3. ZONA PRINCIPALĂ: LAMPA + MASA + CELE 3 OBIECTE ================= */}
        {/* Flex-1 stage sits strictly ABOVE the bottom story+CTA dock so objects are never covered */}
        <div
          aria-hidden="true"
          className="pointer-events-none relative z-10 flex-1 min-h-0 flex flex-col justify-between items-center overflow-hidden"
        >
          {/* LAMPA DE SUS & CONUL DE LUMINĂ CALDĂ */}
          <div
            className={`relative w-full flex-1 min-h-0 flex flex-col items-center ${
              lampPhase === 'off'
                ? 'opacity-0'
                : lampPhase === 'flicker' && !reducedMotion
                  ? 'intro-lamp-ignite'
                  : lampPhase === 'on' && !reducedMotion
                    ? 'intro-lamp-steady'
                    : 'opacity-100'
            }`}
          >
            {/* Fir subțire */}
            <div className="w-[2px] h-[clamp(10px,3.2dvh,42px)] [@media(max-height:460px)]:h-1.5 bg-[#0c0d0d] shrink-0" />

            {/* Abajur conic (verde-închis + alamă) desenat curat în SVG */}
            <svg
              viewBox="0 0 140 54"
              className="w-[clamp(76px,17vw,142px)] [@media(max-height:460px)]:w-[72px] h-auto -mt-0.5 shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]"
            >
              <rect x="63" y="0" width="14" height="10" rx="1" fill="#8b6f3d" stroke="#15171a" strokeWidth="1" />
              <path
                d="M 55 9 L 85 9 L 126 42 L 14 42 Z"
                fill="#17271e"
                stroke="#0a0f0c"
                strokeWidth="1.5"
              />
              <path d="M 14 42 L 126 42" stroke="#9d8049" strokeWidth="1.5" />
              <ellipse
                cx="70"
                cy="42"
                rx="53"
                ry="7"
                fill={lampLit ? '#ffd9a0' : '#242725'}
                fillOpacity={lampLit ? '0.88' : '0.4'}
              />
              <circle
                cx="70"
                cy="44"
                r="7.5"
                fill={lampLit ? '#fff1d4' : '#2a2d2b'}
              />
            </svg>

            {/* Conul de lumină caldă (#ffd9a0 -> transparent) peste masă */}
            <div
              className="w-[min(115vw,840px)] flex-1 min-h-[28px] max-h-[clamp(140px,38dvh,400px)] -mt-2"
              style={{
                clipPath: 'polygon(43% 0%, 57% 0%, 100% 100%, 0% 100%)',
                background:
                  'radial-gradient(ellipse 68% 78% at 50% 16%, rgba(255, 217, 160, 0.34) 0%, rgba(232, 182, 111, 0.14) 52%, transparent 88%)',
                mixBlendMode: 'screen',
              }}
            />
          </div>

          {/* BLATUL MESEI & CELE TREI OBIECTE (în partea de jos a zonei superioare, complet vizibile) */}
          <div
            className={`relative w-full h-[clamp(74px,14dvh,126px)] [@media(max-height:460px)]:h-[70px] shrink-0 transition-opacity duration-700 ${
              lampLit ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Suprafața blatului de lemn luminat cald de lampă */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, #2d2217 0%, #1c150e 58%, #0a0806 100%)',
                borderTop: '1px solid rgba(255, 217, 160, 0.28)',
                boxShadow: 'inset 0 10px 26px rgba(255, 217, 160, 0.08)',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 50% 85% at 48% 10%, rgba(255, 217, 160, 0.18) 0%, rgba(232, 182, 111, 0.06) 46%, transparent 78%)',
                }}
              />
            </div>

            {/* Cele 3 obiecte pe blat (centrate și scalate responsive) */}
            <div className="relative mx-auto w-[min(94vw,680px)] h-full flex items-end justify-center pb-[clamp(8px,2dvh,22px)] [@media(max-height:460px)]:pb-1.5">
              {/* -------- Obiect 1: VALIZA-BOMBĂ (centru, ușor spre stânga) -------- */}
              <div className="relative -translate-x-[clamp(6px,3vw,28px)]">
                <div
                  className="transition-all duration-700 ease-out"
                  style={{
                    opacity: objectsVisible ? 1 : 0,
                    transform: objectsVisible ? 'translateY(0)' : 'translateY(7px)',
                  }}
                >
                  {/* Umbră moale pe masă */}
                  <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[108%] h-3.5 rounded-full blur-[5px]"
                    style={{ background: 'rgba(0, 0, 0, 0.8)' }}
                  />

                  {/* Cutia metalică gri (#c2c4bf, umbre #a9aba6 & #6d6f6b) */}
                  <div
                    className="relative w-[clamp(132px,34vw,224px)] h-[clamp(74px,13dvh,122px)] [@media(max-height:460px)]:w-[144px] [@media(max-height:460px)]:h-[64px] rounded-[3px] border border-[#6d6f6b] p-1.5 sm:p-2.5 [@media(max-height:460px)]:p-1.5 flex flex-col justify-between shadow-[0_8px_18px_rgba(0,0,0,0.75)]"
                    style={{
                      background:
                        'linear-gradient(165deg, #c2c4bf 0%, #a9aba6 62%, #6d6f6b 100%)',
                    }}
                  >
                    {/* Mâner superior discret */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-2 rounded-t-[2px] border-2 border-b-0 border-[#4e504c] bg-[#1a1c1e]" />

                    {/* Rând sus capac: Plăcuță ivoire „OP-3 ANI” + 3 LED-uri */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="bg-[#e6e1d3] border border-[#6d6f6b] px-1.5 py-0.5 shadow-sm">
                        <span className="font-tech text-[clamp(8px,1.8vw,11px)] [@media(max-height:460px)]:text-[8px] font-bold tracking-wider text-[#15171a] block leading-none">
                          OP-3 ANI
                        </span>
                      </div>

                      {/* 3 LED-uri mici: roșu, chihlimbar, verde */}
                      <div className="flex items-center gap-1 sm:gap-1.5 bg-[#1b1d1e] px-1.5 py-0.5 sm:py-1 rounded-[2px] border border-[#595b57]">
                        <span
                          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-black ${
                            briefcaseArmed
                              ? reducedMotion
                                ? 'bg-[#ff3b2a] shadow-[0_0_6px_#ff3b2a]'
                                : 'hw-led-red-pulse'
                              : 'bg-[#2e1514]'
                          }`}
                        />
                        <span
                          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-black transition-all duration-300 ${
                            briefcaseArmed
                              ? 'bg-[#e89b2d] shadow-[0_0_6px_#e89b2d]'
                              : 'bg-[#2c2112]'
                          }`}
                        />
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-black bg-[#13261a]" />
                      </div>
                    </div>

                    {/* Afișaj LCD verde (VT323, #9be15d pe #1b2a12): --:-- -> 03:03 */}
                    <div className="bg-[#1b2a12] border-2 border-[#393b37] px-2 py-0.5 sm:py-1 [@media(max-height:460px)]:py-0.5 flex items-center justify-between shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)]">
                      <span className="font-tech text-[8px] uppercase tracking-widest text-[#9be15d]/60">
                        TMR
                      </span>
                      <span
                        data-testid="cutscene-briefcase-lcd"
                        className="font-lcd text-[clamp(18px,3.2dvh+6px,28px)] [@media(max-height:460px)]:text-[19px] leading-none tracking-[0.12em] text-[#9be15d]"
                        style={{ textShadow: '0 0 8px rgba(155, 225, 93, 0.55)' }}
                      >
                        {briefcaseArmed ? '03:03' : '--:--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* -------- Obiect 2: DOSARUL CU ȘTAMPILA „STRICT SECRET” (dreapta valizei) -------- */}
              <div className="relative translate-y-[2px] rotate-[5deg]">
                <div
                  className="transition-all duration-700 ease-out"
                  style={{
                    opacity: folderVisible ? 1 : 0,
                    transform: folderVisible ? 'translateX(0)' : 'translateX(20px)',
                  }}
                >
                  <div
                    className="relative w-[clamp(78px,20vw,124px)] h-[clamp(52px,9dvh,84px)] [@media(max-height:460px)]:w-[86px] [@media(max-height:460px)]:h-[48px] rounded-[2px] border border-[#8e7f63] shadow-[0_6px_14px_rgba(0,0,0,0.75)] flex flex-col justify-between p-1.5 sm:p-2 [@media(max-height:460px)]:p-1"
                    style={{
                      background: 'linear-gradient(155deg, #d7ccb2 0%, #bfb191 65%, #9f9070 100%)',
                    }}
                  >
                    <div className="absolute -top-1.5 left-2 w-7 sm:w-8 h-1.5 rounded-t-[1px] bg-[#cbbda0] border border-b-0 border-[#8e7f63]" />

                    <div className="space-y-1 opacity-45">
                      <div className="h-[2px] w-3/4 bg-[#15171a]" />
                      <div className="h-[2px] w-1/2 bg-[#15171a]" />
                    </div>

                    {stamped && (
                      <div
                        data-testid="cutscene-secret-stamp"
                        className={`self-center border-2 border-[#c0281c] outline outline-1 outline-[#c0281c] -outline-offset-4 px-1 sm:px-1.5 py-0.5 font-display text-[clamp(7px,1.8vw,11px)] [@media(max-height:460px)]:text-[8px] font-bold tracking-[0.13em] text-[#c0281c] whitespace-nowrap ${
                          reducedMotion ? '' : 'intro-stamp-slam'
                        }`}
                        style={{
                          opacity: 0.85,
                          filter: 'blur(0.25px)',
                          transform: 'rotate(-8deg)',
                        }}
                      >
                        STRICT SECRET
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* -------- Obiect 3: STAȚIA RADIO GALBENĂ (lângă dosar) -------- */}
              <div
                className="relative ml-2 sm:ml-3 -translate-y-[4px] transition-opacity duration-700 ease-out"
                style={{ opacity: objectsVisible ? 1 : 0 }}
              >
                <svg
                  viewBox="0 0 46 84"
                  className="w-[clamp(24px,5.5vw,40px)] [@media(max-height:460px)]:w-[24px] h-auto drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]"
                >
                  <rect x="30" y="2" width="5" height="24" rx="2" fill="#17181a" />
                  <rect
                    x="6"
                    y="23"
                    width="34"
                    height="56"
                    rx="4"
                    fill="#f1c40f"
                    stroke="#17181a"
                    strokeWidth="2.5"
                  />
                  <rect x="11" y="31" width="24" height="16" rx="2" fill="#17181a" />
                  <line x1="14" y1="35" x2="32" y2="35" stroke="#424549" strokeWidth="1.5" />
                  <line x1="14" y1="39" x2="32" y2="39" stroke="#424549" strokeWidth="1.5" />
                  <line x1="14" y1="43" x2="32" y2="43" stroke="#424549" strokeWidth="1.5" />
                  <rect x="12" y="51" width="22" height="10" rx="1" fill="#1b2a12" stroke="#17181a" strokeWidth="1" />
                  <circle
                    cx="15"
                    cy="27"
                    r="2.4"
                    fill="#3ddc84"
                    className={reducedMotion ? '' : 'animate-pulse'}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 4. ZONA INFERIOARĂ: POVESTE + BUTOANE (NU ACOPERĂ MASA) ================= */}
        <div
          className="relative z-30 shrink-0 w-full px-3 sm:px-6 pt-2 [@media(max-height:460px)]:pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] [@media(max-height:460px)]:pb-1.5 bg-gradient-to-b from-[#080705] via-[#050606] to-[#050606] border-t border-black/80 flex flex-col items-center justify-end gap-2 [@media(max-height:460px)]:gap-1.5 min-h-[clamp(142px,30dvh,225px)] [@media(max-height:460px)]:min-h-0"
        >
          {storyVisible && (
            <div
              data-testid="cutscene-story-panel"
              className="w-full max-w-xl bg-[#050606]/85 border border-[#e6e1d3]/35 px-3 sm:px-5 py-2 sm:py-2.5 [@media(max-height:460px)]:py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.85)]"
            >
              <div className="font-tech text-[clamp(11px,1.2dvh+8px,15px)] [@media(max-height:460px)]:text-[11px] leading-snug sm:leading-relaxed text-[#e6e1d3] min-h-[3.6em] [@media(max-height:460px)]:min-h-0">
                {typedLines.map((line, i) => (
                  <p key={i} className="m-0">
                    {line}
                    {i === typedLines.length - 1 &&
                      storyChars < STORY_FULL_TEXT.length &&
                      !reducedMotion && (
                        <span aria-hidden="true" className="det-cursor-blink ml-0.5 text-[#ffd9a0]">
                          _
                        </span>
                      )}
                  </p>
                ))}
              </div>
            </div>
          )}

          {buttonsVisible && (
            <div className="flex flex-col sm:flex-row [@media(max-height:460px)]:flex-row items-center justify-center gap-2 [@media(max-height:460px)]:gap-2 w-full max-w-lg">
              {/* Buton central mare, stil plăcuță dymo */}
              <button
                type="button"
                data-testid="cutscene-start-btn"
                onClick={triggerFinish}
                className={`w-full sm:w-auto min-h-[46px] [@media(max-height:460px)]:min-h-[44px] px-6 py-2 bg-[#101a2b] border border-[#e6e1d3]/65 hover:border-[#ffd9a0] text-[#e6e1d3] hover:text-[#ffd9a0] font-display text-[clamp(14px,1.2vw+10px,17px)] font-bold tracking-[0.16em] uppercase rounded-[2px] cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#ffd9a0] ${
                  reducedMotion ? '' : 'intro-cta-pulse'
                }`}
              >
                ÎNCEPE MISIUNEA
              </button>

              {/* Buton secundar pentru deschiderea manualului */}
              {onOpenManual && (
                <button
                  type="button"
                  data-testid="cutscene-manual-btn"
                  onClick={onOpenManual}
                  className="min-h-[44px] px-4 py-1.5 font-tech text-xs tracking-wide text-[#e6e1d3]/85 hover:text-[#ffd9a0] bg-[#0a0d0c] border border-[#e6e1d3]/25 hover:border-[#ffd9a0]/55 rounded-[2px] cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#ffd9a0]"
                >
                  📖 Citește manualul
                </button>
              )}
            </div>
          )}
        </div>

        {/* ================= 5. EFECTE DE ECRAN: FILM GRAIN, SCANLINES, VIGNETĂ ================= */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {!reducedMotion && <div className="det-film-grain absolute -inset-6" />}
          <div className="absolute inset-x-0 top-[26%] h-px bg-[#9be15d]/[0.04]" />
          <div className="absolute inset-x-0 top-[54%] h-px bg-[#9be15d]/[0.035]" />
          <div className="absolute inset-x-0 top-[81%] h-px bg-[#9be15d]/[0.04]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 74% 70% at 50% 45%, transparent 44%, rgba(5, 6, 6, 0.52) 82%, rgba(5, 6, 6, 0.92) 100%)',
            }}
          />
        </div>

        {/* ================= 6. TEXT DE DESCHIDERE 0.0–0.8s (STÂNGA-JOS) ================= */}
        {stampIntroVisible && (
          <div
            data-testid="cutscene-time-stamp"
            className="pointer-events-none fixed left-[max(1rem,env(safe-area-inset-left))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 transition-opacity duration-500"
          >
            <p
              className="font-lcd text-[clamp(20px,3vw+10px,28px)] tracking-wider text-[#9be15d]"
              style={{ textShadow: '0 0 8px rgba(155, 225, 93, 0.5)' }}
            >
              SINAIA · 03:03
            </p>
          </div>
        )}

        {/* ================= 7. BUTON DISCRET „SARI PESTE ›” (DREAPTA-SUS, >=44×44px) ================= */}
        <button
          type="button"
          data-testid="cutscene-skip-btn"
          onClick={handleSkipClick}
          aria-label="Sari peste secvența de introducere"
          className="fixed top-[max(0.65rem,env(safe-area-inset-top))] right-[max(0.65rem,env(safe-area-inset-right))] z-40 min-w-[44px] min-h-[44px] px-2.5 py-1.5 flex items-center justify-center font-tech text-[11px] tracking-wider text-[#e6e1d3]/75 hover:text-[#ffd9a0] bg-[#050606]/45 border border-[#e6e1d3]/15 hover:border-[#ffd9a0]/50 rounded-[2px] cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#ffd9a0]"
        >
          Sari peste ›
        </button>
      </div>
    </div>
  );
};
