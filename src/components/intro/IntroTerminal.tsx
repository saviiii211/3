import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  INTRO_HEADER_LINES,
  INTRO_SEEN_KEY,
  INTRO_TEXT,
  INTRO_TYPING_MS,
} from '../../config';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { ambienceAudio } from '../../utils/ambience';

interface IntroTerminalProps {
  phase: 'gate' | 'terminal';
  onUnlockGate: () => void;
  onComplete: () => void;
}

export const IntroTerminal: React.FC<IntroTerminalProps> = ({
  phase,
  onUnlockGate,
  onComplete,
}) => {
  const reducedMotion = usePrefersReducedMotion();

  const fullText = useMemo(() => {
    const header = INTRO_HEADER_LINES.join('\n');
    return `${header}\n\n${INTRO_TEXT}`;
  }, []);

  const headerLength = useMemo(() => {
    return INTRO_HEADER_LINES.join('\n').length + 2; // includes \n\n separator
  }, []);

  const [charIndex, setCharIndex] = useState<number>(() =>
    reducedMotion ? fullText.length : 0
  );
  const [typingDone, setTypingDone] = useState<boolean>(() => reducedMotion);
  const [booting, setBooting] = useState<boolean>(false);
  const [shuttingDown, setShuttingDown] = useState<boolean>(false);
  const [blackOut, setBlackOut] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastIndexRef = useRef<number>(reducedMotion ? fullText.length : 0);

  // Trigger CRT boot animation when transitioning from gate -> terminal
  useEffect(() => {
    if (phase !== 'terminal') return;
    if (reducedMotion) {
      setCharIndex(fullText.length);
      setTypingDone(true);
      setBooting(false);
      return;
    }
    setCharIndex(0);
    lastIndexRef.current = 0;
    setTypingDone(false);
    setBooting(true);
    const tid = window.setTimeout(() => setBooting(false), 360);
    return () => window.clearTimeout(tid);
  }, [phase, reducedMotion, fullText.length]);

  // Accurate requestAnimationFrame time-accumulator typewriter
  useEffect(() => {
    if (phase !== 'terminal' || reducedMotion || typingDone) return;

    let rafId = 0;
    let lastTs = 0;
    let accumulator = 0;
    let current = lastIndexRef.current;
    // Wait until CRT boot flash settles slightly (~180ms)
    let nextDelay = current === 0 ? 220 : INTRO_TYPING_MS;

    const computeNextCharDelay = (idx: number): number => {
      const ch = fullText[idx] ?? '';
      const prev = idx > 0 ? fullText[idx - 1] : '';
      if (idx < headerLength) {
        return ch === '\n' ? 45 : 8;
      }
      if (ch === '\n') {
        return prev === '\n' ? 420 : 220;
      }
      if (ch === '.' || ch === '!' || ch === '?') {
        return 320;
      }
      if (ch === ',' || ch === ';' || ch === ':') {
        return 140;
      }
      const jitter = (Math.random() * 2 - 1) * 12; // +/- 12ms
      return Math.max(16, INTRO_TYPING_MS + jitter);
    };

    const tick = (ts: number) => {
      if (lastTs === 0) {
        lastTs = ts;
      }
      const dt = Math.min(80, ts - lastTs);
      lastTs = ts;
      accumulator += dt;

      while (accumulator >= nextDelay && current < fullText.length) {
        accumulator -= nextDelay;
        const revealedChar = fullText[current];
        current += 1;
        if (revealedChar && !/\s/.test(revealedChar) && current > headerLength) {
          ambienceAudio.playTypeTick();
        }
        nextDelay = computeNextCharDelay(current - 1);
      }

      if (current !== lastIndexRef.current) {
        lastIndexRef.current = current;
        setCharIndex(current);
      }

      if (current >= fullText.length) {
        setTypingDone(true);
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [phase, reducedMotion, typingDone, fullText, headerLength]);

  // Keep terminal scrolled to bottom as lines type
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [charIndex, typingDone]);

  const skipTyping = useCallback(() => {
    if (typingDone) return;
    lastIndexRef.current = fullText.length;
    setCharIndex(fullText.length);
    setTypingDone(true);
  }, [typingDone, fullText.length]);

  const handleConfirm = useCallback(() => {
    if (!typingDone || shuttingDown) return;
    ambienceAudio.playTerminalShutdown();
    try {
      window.localStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // ignore storage errors
    }

    if (reducedMotion) {
      onComplete();
      return;
    }

    setShuttingDown(true);
    window.setTimeout(() => {
      setBlackOut(true);
    }, 450);
    window.setTimeout(() => {
      onComplete();
    }, 750);
  }, [typingDone, shuttingDown, reducedMotion, onComplete]);

  // Space / Enter keyboard shortcut to skip typing or confirm when finished
  useEffect(() => {
    if (phase !== 'terminal') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!typingDone) {
          e.preventDefault();
          skipTyping();
        } else if (e.key === 'Enter' && !shuttingDown) {
          e.preventDefault();
          handleConfirm();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, typingDone, shuttingDown, skipTyping, handleConfirm]);

  const handleGatePress = () => {
    ambienceAudio.playTerminalPowerOn();
    onUnlockGate();
  };

  if (phase === 'gate') {
    return (
      <div
        data-testid="intro-gate"
        className="fixed inset-0 z-[1100] bg-[#050606] flex flex-col items-center justify-center p-6 select-none"
      >
        <div className="flex flex-col items-center gap-6 max-w-lg text-center">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="hw-led-dome w-3.5 h-3.5 hw-led-amber inline-block"
            />
            <span className="font-tech text-xs tracking-[0.2em] text-[#8a8576] uppercase">
              ALIMENTARE TERMINAL · STANDBY
            </span>
          </div>

          <button
            type="button"
            onClick={handleGatePress}
            aria-label="Apasă pentru a porni terminalul"
            className="min-h-[54px] px-5 py-3 border border-[#e89b2d]/45 bg-[#0a0d0c] hover:border-[#ffd9a0] active:scale-[0.99] font-lcd text-[clamp(22px,3vw+14px,32px)] tracking-wider text-[#ffd9a0] focus-visible:outline-2 focus-visible:outline-[#ffd9a0] cursor-pointer transition-colors"
          >
            <span className={reducedMotion ? '' : 'det-cursor-blink'}>
              [ APĂSĂ PENTRU A PORNI TERMINALUL ]
            </span>
          </button>
        </div>
      </div>
    );
  }

  const displayed = fullText.slice(0, charIndex);

  return (
    <div
      data-testid="intro-terminal"
      className="fixed inset-0 z-[1100] bg-[#050606] flex items-center justify-center p-2 sm:p-6 select-none"
    >
      {!blackOut && (
        <div
          className={`det-crt-screen relative w-full max-w-[820px] h-[min(90dvh,740px)] flex flex-col overflow-hidden ${
            booting ? 'det-crt-boot' : ''
          } ${shuttingDown ? 'det-crt-shutdown' : ''}`}
        >
          {/* Scanlines overlay */}
          <div
            aria-hidden="true"
            className="det-crt-scanlines pointer-events-none absolute inset-0 z-20"
          />

          {/* Subtle phosphor flicker (auto-disabled under prefers-reduced-motion) */}
          {!reducedMotion && (
            <div
              aria-hidden="true"
              className="det-crt-flicker pointer-events-none absolute inset-0 z-20 bg-[#6dff8f]"
            />
          )}

          {/* Curved CRT perimeter vignette */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-[22px]"
            style={{
              boxShadow: 'inset 0 0 85px rgba(0, 0, 0, 0.85)',
            }}
          />

          {/* Scrollable Text Area (tapping skips remaining typing) */}
          <div
            ref={scrollRef}
            onClick={skipTyping}
            className="relative z-10 flex-1 overflow-y-auto px-5 sm:px-10 pt-6 sm:pt-10 pb-4 cursor-pointer"
          >
            <div className="max-w-[760px] mx-auto">
              <pre
                className="font-lcd text-[clamp(20px,2.4vw+14px,30px)] leading-[1.25] det-terminal-text whitespace-pre-wrap break-words"
              >
                {displayed}
                <span
                  aria-hidden="true"
                  className={`inline-block ml-0.5 align-baseline ${
                    reducedMotion ? '' : 'det-cursor-blink'
                  }`}
                >
                  █
                </span>
              </pre>
            </div>
          </div>

          {/* Dedicated Fixed Action Zone (never covers typed text) */}
          <div className="relative z-30 shrink-0 min-h-[88px] px-5 sm:px-10 py-4 border-t border-[#6dff8f]/20 bg-[#04130a]/60 flex items-center justify-between gap-3">
            {!typingDone ? (
              <button
                type="button"
                onClick={skipTyping}
                aria-label="Afișează tot textul instantaneu"
                className="ml-auto min-h-[44px] px-3 py-1.5 font-lcd text-lg text-[#6dff8f]/75 hover:text-[#6dff8f] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#6dff8f]"
              >
                Afișează tot ▸
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                aria-label="Am citit mesajul, încep misiunea"
                className="mx-auto min-h-[52px] px-6 py-2.5 border-2 border-[#6dff8f] bg-transparent text-[#6dff8f] hover:bg-[#6dff8f] hover:text-[#04130a] active:bg-[#6dff8f] active:text-[#04130a] font-lcd text-[clamp(20px,2vw+14px,26px)] tracking-wider transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
              >
                [ AM CITIT — ÎNCEP MISIUNEA ]
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
