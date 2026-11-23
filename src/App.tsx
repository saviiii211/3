import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Compass, Volume2, VolumeX } from 'lucide-react';
import { AdminModal } from './components/AdminModal';
import { Bomb3DScene } from './components/Bomb3DScene';
import { CasingSpecsView } from './components/CasingSpecsView';
import { GpsRadarView } from './components/GpsRadarView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { VictoryScreen } from './components/VictoryScreen';
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

export default function App() {
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

  const tapCountRef = useRef<number>(0);
  const tapTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Sync audio mute and localStorage persistence
  useEffect(() => {
    soundEngine.setMuted(state.muted);
    saveMissionState(state);
  }, [state]);

  // Mission Nixie telemetry timer (ticks until neutralized)
  useEffect(() => {
    if (state.victory) return;
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
  }, [state.victory]);

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
    triggerHaptic([60, 40, 60, 40, 120]);
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
    setActiveView('console');
    setElapsedSeconds(0);
    try {
      window.localStorage.setItem(TIMER_STORAGE_KEY, '0');
    } catch {
      // ignore
    }
    showToast('Unitate resetată.', 'info');
  };

  const gpsUnlocked = isGpsUnlocked(state);
  const activeDestination = getActiveDestination(state);
  const module2Solved = state.solvedModules.includes(2);
  const module7Solved = state.solvedModules.includes(7);
  const tensionLevel = Math.min(3, state.strikes);

  return (
    <div
      data-tension={tensionLevel}
      className={`workbench-bg min-h-screen flex flex-col text-stone-100 ${
        shaking ? 'animate-hw-shake' : ''
      }`}
    >
      {/* Peripheral Strike Flash Vignette */}
      {strikeFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[1280] border-[8px] border-red-600/80 shadow-[inset_0_0_80px_rgba(220,38,38,0.7)] animate-strike-flash"
        />
      )}

      {/* Minimal Functional Telemetry Top Bar (Zero Titles / Zero Train Routes) */}
      <header className="sticky top-0 z-30 h-14 bg-[#121315]/95 border-b-2 border-black shadow-[0_6px_18px_rgba(0,0,0,0.85)] px-2.5 sm:px-5 flex items-center justify-between gap-2">
        {/* Left: Main Nixie/LED Telemetry Timer (5 quick taps opens Admin) */}
        <button
          type="button"
          onClick={handleTelemetryTap}
          aria-label="Cronometru principal telemetrie"
          className="crt-amber-glass px-2.5 sm:px-3 py-1 flex items-center gap-2 shrink-0 cursor-pointer select-none min-h-[38px]"
        >
          <span
            aria-hidden="true"
            className={`hw-led-dome w-2.5 h-2.5 relative z-10 ${
              state.victory ? 'hw-led-green' : state.strikes > 0 ? 'hw-led-red-pulse' : 'hw-led-amber'
            }`}
          />
          <span
            className={`font-lcd text-lg sm:text-xl tracking-widest relative z-10 ${
              state.strikes >= 2 ? 'nixie-tube-red' : 'nixie-tube'
            }`}
          >
            {formatNixieTimer(elapsedSeconds)}
          </span>
          <span className="hidden md:inline font-tech text-[10px] text-amber-300/70 relative z-10">
            {state.solvedModules.length}/7
          </span>
        </button>

        {/* Center: Physical Strike Indicator Lamps & Console/GPS Switch */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Physical Strike Lamps + Counter */}
          <div
            data-testid="strike-counter"
            aria-label={`Greșeli totale: ${state.strikes}`}
            className="bakelite-surface px-2 py-1 flex items-center gap-1.5 shrink-0"
          >
            <div className="hidden sm:flex items-center gap-1" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`hw-led-dome w-2.5 h-2.5 ${
                    state.strikes >= n ? 'hw-led-red-pulse' : 'hw-led-off'
                  }`}
                />
              ))}
            </div>
            <span className="font-tech text-[10px] text-stone-400">ERR</span>
            <span className="font-lcd text-base leading-none text-red-400">{state.strikes}</span>
          </div>

          {/* 3D Device / GPS Telemetry Switch */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveView('console');
              }}
              className={`mech-toggle min-h-[38px] px-2.5 py-1 flex items-center gap-1.5 font-tech text-[11px] whitespace-nowrap cursor-pointer ${
                activeView === 'console' ? 'text-amber-300 ring-1 ring-amber-500/60' : 'text-stone-400'
              }`}
            >
              <Box className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden xs:inline sm:inline">DISPOZITIV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveView('gps');
              }}
              className={`mech-toggle min-h-[38px] px-2.5 py-1 flex items-center gap-1.5 font-tech text-[11px] whitespace-nowrap cursor-pointer ${
                activeView === 'gps' ? 'text-emerald-300 ring-1 ring-emerald-500/60' : 'text-stone-400'
              }`}
            >
              <span
                aria-hidden="true"
                className={`hw-led-dome w-2 h-2 ${
                  activeDestination ? 'hw-led-green' : gpsUnlocked ? 'hw-led-amber' : 'hw-led-off'
                }`}
              />
              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              <span>GPS</span>
            </button>
          </div>
        </div>

        {/* Right: PWA Install + Discreet Audio Switch */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, muted: !prev.muted }))}
            aria-label={state.muted ? 'Activează sunetul' : 'Dezactivează sunetul'}
            className="mech-toggle min-w-[40px] min-h-[38px] flex items-center justify-center text-stone-300 hover:text-white cursor-pointer"
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
            onFocusModule={(id) => {
              soundEngine.playClick();
              setFocusedModuleId(id);
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

      {state.victory && (
        <VictoryScreen
          strikes={state.strikes}
          solvedCount={state.solvedModules.length}
          elapsedSeconds={elapsedSeconds}
          serialNumber={state.casing.serialNumber}
          onBackToConsole={() => setState((prev) => ({ ...prev, victory: false }))}
          onResetGame={handleAdminReset}
        />
      )}
    </div>
  );
}
