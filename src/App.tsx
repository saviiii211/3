import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Compass, Volume2, VolumeX } from 'lucide-react';
import { AdminModal } from './components/AdminModal';
import { Bomb3DScene } from './components/Bomb3DScene';
import { CasingSpecsView } from './components/CasingSpecsView';
import { FinaleSequence } from './components/finale/FinaleSequence';
import { GpsRadarView } from './components/GpsRadarView';
import { IntroRoomCutscene } from './components/intro/IntroRoomCutscene';
import { IntroTerminal } from './components/intro/IntroTerminal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { RadioHandset } from './components/RadioHandset';
import { RoomBackdrop } from './components/room/RoomBackdrop';
import { SevenSegmentDisplay } from './components/SevenSegmentDisplay';
import { VictoryScreen } from './components/VictoryScreen';
import { INTRO_SEEN_KEY } from './config';
import { cutComplicatedWire } from './game/complicatedWires';
import { isKnobAlignedCorrectly, rotateClockwise } from './game/knobs';
import { moveMazePlayer, type MazeDirection } from './game/mazes';
import { pressMemoryButton } from './game/memory';
import {
  createInitialMissionState,
  getActiveDestination,
  isGpsUnlocked,
  loadMissionState,
  markModuleSolved,
  saveMissionState,
} from './game/missionState';
import { checkPasswordSubmit, stepPasswordColumn } from './game/passwords';
import type { ModuleId, PersistedMissionState } from './game/types';
import { pressWhosOnFirstButton } from './game/whosOnFirst';
import { cutSequenceWire, navigateSequencePanel } from './game/wireSequences';
import { ambienceAudio } from './utils/ambience';
import { radioEngine } from './utils/radio';
import { soundEngine, triggerHaptic } from './utils/sound';

const TIMER_STORAGE_KEY = 'op3ani_elapsed_seconds_v1';

function loadElapsedSeconds(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(TIMER_STORAGE_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function formatNixieTimer(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

type AppPhase = 'gate' | 'terminal' | 'cutscene' | 'game';

function getInitialAppPhase(): AppPhase {
  if (typeof window === 'undefined') return 'game';
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('intro');
    if (q === '0') return 'game';
    if (q === '1') return 'gate';
    return window.localStorage.getItem(INTRO_SEEN_KEY) === '1' ? 'game' : 'gate';
  } catch {
    return 'gate';
  }
}

export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>(() => getInitialAppPhase());
  const [state, setState] = useState<PersistedMissionState>(() => loadMissionState());
  const [activeView, setActiveView] = useState<'console' | 'gps'>('console');
  const [focusedModuleId, setFocusedModuleId] = useState<ModuleId | null>(null);
  const [loupeOpen, setLoupeOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => loadElapsedSeconds());
  const [shaking, setShaking] = useState(false);
  const [strikeFlash, setStrikeFlash] = useState(false);
  const [strikeModuleId, setStrikeModuleId] = useState<ModuleId | null>(null);
  const [justSolvedId, setJustSolvedId] = useState<ModuleId | null>(null);
  const [mazeWallFlash, setMazeWallFlash] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: 'info' | 'success' | 'error' } | null>(
    null
  );
  const [adminOpen, setAdminOpen] = useState(false);
  const [bombRot, setBombRot] = useState<{ rx: number; ry: number }>({ rx: 9, ry: -7 });
  const [finaleOpen, setFinaleOpen] = useState(false);
  const [finaleStartAtVideo, setFinaleStartAtVideo] = useState(false);

  const tapCountRef = useRef<number>(0);
  const tapTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const strikesRef = useRef<number>(state.strikes);
  strikesRef.current = state.strikes;

  const tensionLevel = Math.min(3, state.strikes);

  // Sync audio mute, radio strikes, ambience hum, and localStorage persistence
  useEffect(() => {
    soundEngine.setMuted(state.muted);
    saveMissionState(state);
    radioEngine.setStrikes(state.strikes);
    if (state.muted) {
      radioEngine.cancel();
    }
    const audioActive = appPhase === 'game' && !state.muted && !state.victory;
    ambienceAudio.setTensionHum(tensionLevel, audioActive);
  }, [appPhase, state, tensionLevel]);

  // Ambient radio static loop + cleanup + visibilitychange pause
  useEffect(() => {
    if (appPhase === 'game' && !state.victory) {
      radioEngine.startAmbientLoop();
    } else {
      radioEngine.stopAmbientLoop();
    }
    const onVisChange = () => {
      if (document.hidden) {
        ambienceAudio.stopTensionHum();
        radioEngine.cancel();
      } else if (appPhase === 'game' && !state.muted && !state.victory) {
        ambienceAudio.setTensionHum(tensionLevel, true);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      radioEngine.stopAmbientLoop();
    };
  }, [appPhase, state.muted, state.victory, tensionLevel]);

  useEffect(() => {
    return () => {
      radioEngine.dispose();
      ambienceAudio.dispose();
    };
  }, []);

  // Mission Nixie telemetry timer (ticks ONLY during active 'game' phase until neutralized)
  useEffect(() => {
    if (appPhase !== 'game' || state.victory) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        try {
          window.localStorage.setItem(TIMER_STORAGE_KEY, String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [appPhase, state.victory]);

  const showToast = useCallback(
    (text: string, tone: 'info' | 'success' | 'error' = 'info') => {
      setToast({ text, tone });
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 3200);
    },
    []
  );

  const registerStrike = useCallback(
    (moduleId: ModuleId, message: string) => {
      soundEngine.playStrike();
      radioEngine.announceStrike(strikesRef.current + 1);
      triggerHaptic([85, 45, 95]);
      setShaking(true);
      setStrikeFlash(true);
      setStrikeModuleId(moduleId);
      showToast(message, 'error');
      window.setTimeout(() => setShaking(false), 380);
      window.setTimeout(() => setStrikeFlash(false), 560);
      window.setTimeout(() => setStrikeModuleId((cur) => (cur === moduleId ? null : cur)), 1300);
    },
    [showToast]
  );

  const handleModuleSolved = useCallback(
    (moduleId: ModuleId) => {
      soundEngine.playModuleSolved();
      radioEngine.announceModuleSolved(moduleId);
      triggerHaptic([45, 35, 75]);
      setJustSolvedId(moduleId);
      window.setTimeout(() => setJustSolvedId((cur) => (cur === moduleId ? null : cur)), 2500);

      if (moduleId === 1) {
        window.setTimeout(() => soundEngine.playRadarPing(), 320);
        showToast('MOD-01 DEZAMORSAT — SEMNAL GPS INIȚIALIZAT', 'success');
      } else if (moduleId === 2) {
        showToast('MOD-02 DEZAMORSAT — TRANZIT VALIDAT', 'success');
      } else if (moduleId >= 3 && moduleId <= 7) {
        window.setTimeout(() => soundEngine.playRadarPing(), 320);
        const destNum = moduleId - 2;
        showToast(
          `DECRIPTARE REUȘITĂ — OBIECTIV CRIPTAT #${destNum}`,
          'success'
        );
      }
    },
    [showToast]
  );

  // Secret 5-tap trigger on the main Nixie telemetry timer housing
  const handleTelemetryTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) {
      window.clearTimeout(tapTimerRef.current);
    }
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      soundEngine.playClick();
      setAdminOpen(true);
      return;
    }
    tapTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
    }, 2200);
  };

  // Module 1: Memory
  const handleMemoryPress = (pos: 1 | 2 | 3 | 4) => {
    const res = pressMemoryButton(state.memory, pos);
    if (!res.correct) {
      setState((prev) => ({
        ...prev,
        strikes: prev.strikes + 1,
        memory: res.nextState,
      }));
      registerStrike(1, 'Eroare la Memoria! Resetare la Etapa 1.');
      return;
    }
    soundEngine.playClick();
    triggerHaptic(20);
    setState((prev) => {
      const updated = { ...prev, memory: res.nextState };
      return res.solved ? markModuleSolved(updated, 1) : updated;
    });
    if (res.solved) handleModuleSolved(1);
  };

  // Module 2: Complicated Wires
  const handleCutComplicatedWire = (wireId: number) => {
    const res = cutComplicatedWire(state.complicatedWires, wireId);
    if (!res.valid) {
      setState((prev) => ({ ...prev, strikes: prev.strikes + 1 }));
      registerStrike(2, 'Fir greșit! Verifică datele carcasei.');
      return;
    }
    soundEngine.playWireCut();
    triggerHaptic(30);
    setState((prev) => {
      const updated = { ...prev, complicatedWires: res.nextState };
      return res.solved ? markModuleSolved(updated, 2) : updated;
    });
    if (res.solved) handleModuleSolved(2);
  };

  // Module 3: Who's on First
  const handleWhosOnFirstPress = (btnIndex: number) => {
    const res = pressWhosOnFirstButton(state.whosOnFirst, btnIndex);
    if (!res.correct) {
      setState((prev) => ({
        ...prev,
        strikes: prev.strikes + 1,
        whosOnFirst: res.nextState,
      }));
      registerStrike(3, 'Buton greșit la „Cine e pe primul loc?”!');
      return;
    }
    soundEngine.playClick();
    triggerHaptic(20);
    setState((prev) => {
      const updated = { ...prev, whosOnFirst: res.nextState };
      return res.solved ? markModuleSolved(updated, 3) : updated;
    });
    if (res.solved) handleModuleSolved(3);
  };

  // Module 4: Wire Sequences
  const handleCutSeqWire = (wireId: number) => {
    const res = cutSequenceWire(state.wireSequences, wireId);
    if (!res.valid) {
      setState((prev) => ({ ...prev, strikes: prev.strikes + 1 }));
      registerStrike(4, 'Secvență incorectă! Verifică apariția cumulativă.');
      return;
    }
    soundEngine.playWireCut();
    triggerHaptic(30);
    setState((prev) => {
      const updated = { ...prev, wireSequences: res.nextState };
      return res.solved ? markModuleSolved(updated, 4) : updated;
    });
    if (res.solved) handleModuleSolved(4);
  };

  const handleSeqNavigate = (dir: 'up' | 'down') => {
    const res = navigateSequencePanel(state.wireSequences, dir);
    if (res.blocked) {
      setState((prev) => ({ ...prev, strikes: prev.strikes + 1 }));
      registerStrike(4, 'Mai ai fire de tăiat pe panoul curent!');
      return;
    }
    soundEngine.playClick();
    triggerHaptic(18);
    setState((prev) => {
      const updated = { ...prev, wireSequences: res.nextState };
      return res.solved ? markModuleSolved(updated, 4) : updated;
    });
    if (res.solved) handleModuleSolved(4);
  };

  // Module 5: Mazes
  const handleMazeMove = (dir: MazeDirection) => {
    const res = moveMazePlayer(state.maze, dir);
    if (res.hitWall) {
      setMazeWallFlash(true);
      window.setTimeout(() => setMazeWallFlash(false), 380);
      setState((prev) => ({ ...prev, strikes: prev.strikes + 1 }));
      registerStrike(5, 'Ai lovit un perete invizibil!');
      return;
    }
    soundEngine.playClick();
    triggerHaptic(16);
    setState((prev) => {
      const updated = { ...prev, maze: res.nextState };
      return res.solved ? markModuleSolved(updated, 5) : updated;
    });
    if (res.solved) handleModuleSolved(5);
  };

  // Module 6: Knobs
  const handleKnobRotate = () => {
    soundEngine.playClick();
    triggerHaptic(18);
    setState((prev) => ({
      ...prev,
      knobs: {
        ...prev.knobs,
        dialFacing: rotateClockwise(prev.knobs.dialFacing),
      },
    }));
  };

  const handleKnobTick = useCallback(() => {
    setState((prev) => {
      if (prev.solvedModules.includes(6) || prev.knobs.secondsLeft <= 0) return prev;
      return {
        ...prev,
        knobs: {
          ...prev.knobs,
          secondsLeft: Math.max(0, prev.knobs.secondsLeft - 1),
        },
      };
    });
  }, []);

  const handleKnobResetTimer = () => {
    soundEngine.playClick();
    setState((prev) => ({
      ...prev,
      knobs: { ...prev.knobs, secondsLeft: 45 },
    }));
  };

  const handleKnobValidate = () => {
    if (!isKnobAlignedCorrectly(state.knobs)) {
      setState((prev) => ({ ...prev, strikes: prev.strikes + 1 }));
      registerStrike(6, 'Orientare greșită raportată la „UP”!');
      return;
    }
    setState((prev) => markModuleSolved(prev, 6));
    handleModuleSolved(6);
  };

  // Module 7: Passwords
  const handlePasswordStep = (colIndex: number, delta: 1 | -1) => {
    soundEngine.playClick();
    triggerHaptic(15);
    setState((prev) => ({
      ...prev,
      passwords: stepPasswordColumn(prev.passwords, colIndex, delta),
    }));
  };

  const handlePasswordSubmit = () => {
    if (!checkPasswordSubmit(state.passwords)) {
      setState((prev) => ({ ...prev, strikes: prev.strikes + 1 }));
      registerStrike(7, 'Parolă invalidă! Verifică literele din Coloana 1 și 2.');
      return;
    }
    setState((prev) => markModuleSolved(prev, 7));
    handleModuleSolved(7);
  };

  const handleConfirmFinalArrival = () => {
    soundEngine.playVictoryFanfare();
    radioEngine.announceVictory();
    triggerHaptic([60, 40, 60, 40, 120]);
    setFinaleStartAtVideo(false);
    setFinaleOpen(true);
    setState((prev) => ({ ...prev, victory: true }));
  };

  // Admin handlers
  const handleAdminUnlockModule = (id: ModuleId) => {
    setState((prev) => markModuleSolved(prev, id));
    handleModuleSolved(id);
  };

  const handleAdminForceDestination = (destId: number | null) => {
    setState((prev) => ({
      ...prev,
      highestUnlocked: destId ? (Math.max(prev.highestUnlocked, 2) as ModuleId) : prev.highestUnlocked,
      forcedDestinationId: destId,
    }));
    if (destId !== null) {
      setActiveView('gps');
      setFocusedModuleId(null);
      showToast(`ADMIN: Rută forțată către OBIECTIV CRIPTAT #${destId}`, 'info');
    }
  };

  const handleAdminReset = () => {
    const fresh = createInitialMissionState();
    setState(fresh);
    setFocusedModuleId(null);
    setLoupeOpen(false);
    setFinaleOpen(false);
    setFinaleStartAtVideo(false);
    setActiveView('console');
    setElapsedSeconds(0);
    radioEngine.cancel();
    try {
      window.localStorage.setItem(TIMER_STORAGE_KEY, '0');
      window.localStorage.removeItem(INTRO_SEEN_KEY);
    } catch {
      // ignore
    }
    setAppPhase('gate');
    showToast('Unitate resetată.', 'info');
  };

  const gpsUnlocked = isGpsUnlocked(state);
  const activeDestination = getActiveDestination(state);
  const module2Solved = state.solvedModules.includes(2);
  const module7Solved = state.solvedModules.includes(7);

  return (
    <div
      data-tension={tensionLevel}
      className={`min-h-[100dvh] flex flex-col text-[#e6e1d3] ${
        shaking ? 'animate-hw-shake' : ''
      }`}
    >
      {/* Phase 1: CRT Gate & Green Terminal Intro */}
      {(appPhase === 'gate' || appPhase === 'terminal') && (
        <IntroTerminal
          phase={appPhase}
          onUnlockGate={() => setAppPhase('terminal')}
          onComplete={() => setAppPhase('cutscene')}
        />
      )}

      {/* Phase 2: Abandoned Room Entry Cutscene (over live mounted game scene) */}
      {appPhase === 'cutscene' && (
        <IntroRoomCutscene onComplete={() => setAppPhase('game')} />
      )}

      {/* Main Game Scene (mounted from cutscene onwards for seamless fade-in) */}
      {(appPhase === 'cutscene' || appPhase === 'game') && (
        <RoomBackdrop
          tensionLevel={state.victory ? 0 : tensionLevel}
          strikes={state.strikes}
          bulbCalm={state.victory}
          showProps={activeView === 'console'}
          showDeviceShadow={activeView === 'console'}
          rotationHint={bombRot}
          onOpenLoupe={() => {
            soundEngine.playClick();
            setLoupeOpen(true);
          }}
        >
      {/* Peripheral Strike Flash Vignette */}
      {strikeFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[1280] border-[8px] border-[#c0281c]/85 shadow-[inset_0_0_80px_rgba(192,40,28,0.72)] animate-strike-flash"
        />
      )}

      {/* Narrow Noir Top Hardware Strip (#0c0d0e) */}
      <header className="sticky top-0 z-30 min-h-[56px] bg-[#0c0d0e]/95 border-b-2 border-black shadow-[0_6px_18px_rgba(0,0,0,0.88)] px-2 sm:px-4 py-1 flex items-center justify-between gap-2">
        {/* Left: Image 2 Ivory Timer Plate (3 strike lamp holes, speaker hole, SVG red 7-seg MM:SS, 5-tap admin trigger) */}
        <button
          type="button"
          onClick={handleTelemetryTap}
          aria-label="Cronometru principal telemetrie"
          className="det-ivory-plate relative px-2.5 sm:px-3 py-1 flex items-center gap-2 sm:gap-2.5 shrink-0 cursor-pointer select-none min-h-[44px]"
        >
          {/* Red 7-Segment LED Module Window */}
          <div className="bg-[#120807] border border-[#3a382f] px-2 py-0.5 flex items-center gap-1.5 shadow-inner">
            <SevenSegmentDisplay
              value={formatNixieTimer(elapsedSeconds)}
              color="#ff3b2a"
              height={22}
              blinkColon={!state.victory && appPhase === 'game'}
              colonVisible={elapsedSeconds % 2 === 0}
            />
          </div>

          {/* 3 Round Strike Lamp Holes + ERR counter + Tiny Speaker Cutout */}
          <div
            data-testid="strike-counter"
            aria-label={`Greșeli totale: ${state.strikes}`}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="flex items-center gap-1" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`w-2.5 h-2.5 rounded-full border border-[#3a382f] ${
                    state.strikes >= n ? 'bg-[#ff3b2a] shadow-[0_0_6px_#ff3b2a]' : 'bg-[#2a2c29]'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-tech text-[10px] font-bold leading-none text-[#c0281c]">
                ERR {state.strikes}
              </span>
              <span className="hidden sm:inline font-tech text-[9px] text-[#3a382f]">
                · {state.solvedModules.length}/7
              </span>
            </div>
          </div>

          {/* Small Speaker Cutout Circle */}
          <span
            aria-hidden="true"
            className="hidden sm:inline-block w-4 h-4 rounded-full bg-[#15171a] border border-[#6d6f6b] shadow-inner"
          />
        </button>

        {/* Center: DISPOZITIV / GPS as Dymo-labeled pushbuttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveView('console');
            }}
            className={`det-arcade-btn min-h-[44px] px-2 sm:px-2.5 py-1 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeView === 'console' ? 'ring-2 ring-[#ffd9a0]' : 'opacity-80'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-[#ffd9a0]" aria-hidden="true" />
            <span className="det-dymo-label hidden sm:inline px-1.5 py-0.5 text-[10px] font-bold">
              DISPOZITIV
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveView('gps');
            }}
            className={`det-arcade-btn min-h-[44px] px-2 sm:px-2.5 py-1 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeView === 'gps' ? 'ring-2 ring-[#3ddc84]' : 'opacity-80'
            }`}
          >
            <span
              aria-hidden="true"
              className={`hw-led-dome w-2 h-2 ${
                activeDestination ? 'hw-led-green' : gpsUnlocked ? 'hw-led-amber' : 'hw-led-off'
              }`}
            />
            <Compass className="w-3.5 h-3.5 text-[#eceae2]" aria-hidden="true" />
            <span className="det-dymo-label px-1.5 py-0.5 text-[10px] font-bold">
              GPS
            </span>
          </button>
        </div>

        {/* Right: PWA Install + Discreet Audio Switch */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, muted: !prev.muted }))}
            aria-label={state.muted ? 'Activează sunetul' : 'Dezactivează sunetul'}
            className="mech-toggle min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-300 hover:text-white cursor-pointer"
          >
            {state.muted ? (
              <VolumeX className="w-4 h-4 text-stone-500" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-300" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Non-blocking Bottom Hardware Status Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-[1100] w-[92%] max-w-md px-3.5 py-2.5 shadow-2xl border-2 font-tech text-xs text-center ${
            toast.tone === 'error'
              ? 'bg-red-950/95 border-red-600 text-red-100'
              : toast.tone === 'success'
                ? 'bg-emerald-950/95 border-emerald-600 text-emerald-100'
                : 'bakelite-surface border-amber-500/70 text-amber-100'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Main Workbench Stage */}
      <main className="flex-1 flex flex-col min-h-0">
        {activeView === 'console' ? (
          <Bomb3DScene
            state={state}
            focusedModuleId={focusedModuleId}
            strikeModuleId={strikeModuleId}
            justSolvedId={justSolvedId}
            mazeWallFlash={mazeWallFlash}
            gpsUnlocked={gpsUnlocked}
            activeDestCode={activeDestination?.codeName ?? null}
            onRotationChange={setBombRot}
            onFocusModule={(id) => {
              soundEngine.playClick();
              setFocusedModuleId(id);
              if (id !== null) {
                radioEngine.announceModule(id);
              } else {
                radioEngine.cancel();
              }
            }}
            onOpenLoupe={() => {
              soundEngine.playClick();
              setLoupeOpen(true);
            }}
            onOpenGps={() => {
              soundEngine.playClick();
              setActiveView('gps');
            }}
            onMemoryPress={handleMemoryPress}
            onCutComplicatedWire={handleCutComplicatedWire}
            onWhosOnFirstPress={handleWhosOnFirstPress}
            onCutSeqWire={handleCutSeqWire}
            onSeqNavigate={handleSeqNavigate}
            onMazeMove={handleMazeMove}
            onKnobRotate={handleKnobRotate}
            onKnobValidate={handleKnobValidate}
            onKnobTickTimer={handleKnobTick}
            onKnobResetTimer={handleKnobResetTimer}
            onPasswordStep={handlePasswordStep}
            onPasswordSubmit={handlePasswordSubmit}
          />
        ) : (
          <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4">
            <GpsRadarView
              unlocked={gpsUnlocked}
              module2Solved={module2Solved}
              module7Solved={module7Solved}
              activeDestination={activeDestination}
              simulatedGps={state.simulatedGps}
              onConfirmFinalArrival={handleConfirmFinalArrival}
            />
          </div>
        )}
      </main>

      {/* In-Scene Technical Loupe for Casing Serial / Batteries / Ports */}
      <CasingSpecsView
        open={loupeOpen}
        casing={state.casing}
        onClose={() => setLoupeOpen(false)}
      />

      {/* Walkie-Talkie Handheld Radio (Console View Only) */}
      <RadioHandset visible={activeView === 'console'} />

      <OfflineIndicator />

      <AdminModal
        open={adminOpen}
        state={state}
        onClose={() => setAdminOpen(false)}
        onUnlockModule={handleAdminUnlockModule}
        onForceDestination={handleAdminForceDestination}
        onToggleSimulatedGps={() =>
          setState((prev) => ({ ...prev, simulatedGps: !prev.simulatedGps }))
        }
        onTriggerVictory={() => {
          setAdminOpen(false);
          handleConfirmFinalArrival();
        }}
        onResetAll={handleAdminReset}
      />

      {state.victory && finaleOpen && (
        <FinaleSequence
          startAtVideo={finaleStartAtVideo}
          onComplete={() => setFinaleOpen(false)}
        />
      )}

      {state.victory && !finaleOpen && (
        <>
          <VictoryScreen
            strikes={state.strikes}
            solvedCount={state.solvedModules.length}
            elapsedSeconds={elapsedSeconds}
            serialNumber={state.casing.serialNumber}
            onBackToConsole={() => setState((prev) => ({ ...prev, victory: false }))}
            onResetGame={handleAdminReset}
          />
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setFinaleStartAtVideo(true);
              setFinaleOpen(true);
            }}
            aria-label="Revezi clipul premiu"
            className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-[1220] min-h-[44px] px-3.5 py-2 det-dymo-label text-xs font-bold shadow-[0_6px_18px_rgba(0,0,0,0.85)] cursor-pointer hover:brightness-125 focus-visible:outline-2 focus-visible:outline-[#ffd9a0]"
          >
            ▶ Revezi clipul
          </button>
        </>
      )}
        </RoomBackdrop>
      )}
    </div>
  );
}
