import React, { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { FINALE_VIDEO_POSTER, FINALE_VIDEO_SRC } from '../../config';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface FinaleSequenceProps {
  startAtVideo?: boolean;
  onComplete: () => void;
}

export const FinaleSequence: React.FC<FinaleSequenceProps> = ({ onComplete }) => {
  const reducedMotion = usePrefersReducedMotion();

  const [videoStarted, setVideoStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);

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

  return (
    <div
      data-testid="finale-sequence"
      className={`fixed inset-0 z-[1230] bg-[#070808] overflow-y-auto select-none flex flex-col items-center justify-center p-3 sm:p-6 pt-[max(3.75rem,calc(env(safe-area-inset-top)+3rem))] pb-[max(1rem,env(safe-area-inset-bottom))] ${
        reducedMotion ? '' : 'finale-video-enter'
      }`}
    >
      {/* Top-right Close/Skip button visible at all times including during playback */}
      <button
        type="button"
        data-testid="finale-close-btn"
        onClick={finishFinale}
        aria-label="Închide clipul și continuă către raportul final"
        className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-30 min-w-[44px] min-h-[44px] px-3.5 py-1.5 det-arcade-btn flex items-center justify-center gap-1.5 font-display text-xs font-bold tracking-wider text-[#ffd9a0] cursor-pointer hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[#ffd9a0]"
      >
        <span aria-hidden="true">✕</span>
        <span>Închide</span>
      </button>

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

        {/* Frame Header: Brass/Dymo Label */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="det-dymo-label px-3 py-1 text-xs font-bold">
            PREMIU — DOSAR 03
          </span>
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
                data-testid="finale-play-btn"
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
                data-testid="finale-continue-btn"
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
    </div>
  );
};
