import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Cpu, Map as MapIcon, ShieldAlert, Terminal, Volume2, VolumeX } from 'lucide-react';
import { AdminModal } from './components/AdminModal';
import { CasingSpecsView } from './components/CasingSpecsView';
import { GpsRadarView } from './components/GpsRadarView';
import { ModuleCardShell } from './components/ModuleCardShell';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { VictoryScreen } from './components/VictoryScreen';
import { KnobsModule } from './components/modules/KnobsModule';
import { MazesModule } from './components/modules/MazesModule';
import { MemoryModule } from './components/modules/MemoryModule';
import { PasswordsModule } from './components/modules/PasswordsModule';
import { WhosOnFirstModule } from './components/modules/WhosOnFirstModule';
import { WireSequencesModule } from './components/modules/WireSequencesModule';
import { ComplicatedWiresModule } from './components/modules/ComplicatedWiresModule';
import { cutComplicatedWire } from './game/complicatedWires';
import { isKnobAlignedCorrectly, rotateClockwise } from './game/knobs';
import { moveMazePlayer, type MazeDirection } from './game/mazes';
import { pressMemoryButton } from './game/memory';
import {
  createInitialMissionState,
  getActiveDestination,
  getModuleStatus,
  isGpsUnlocked,
  loadMissionState,
  markModuleSolved,
  MISSION_MODULES,
  saveMissionState,
} from './game/missionState';
import { checkPasswordSubmit, stepPasswordColumn } from './game/passwords';
import type { AppTab, ModuleId, PersistedMissionState } from './game/types';
import { pressWhosOnFirstButton } from './game/whosOnFirst';
import { cutSequenceWire, navigateSequencePanel } from './game/wireSequences';
import { soundEngine, triggerHaptic } from './utils/sound';

export default function App() {
  const [state, setState] = useState<PersistedMissionState>(() => loadMissionState());
  const [activeTab, setActiveTab] = useState<AppTab>('console');
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

  const showToast = useCallback(
    (text: string, tone: 'info' | 'success' | 'error' = 'info') => {
      setToast({ text, tone });
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 3400);
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
        showToast('MODUL 1 DEZAMORSAT — SEMNAL GPS INIȚIALIZAT!', 'success');
      } else if (moduleId === 2) {
        showToast('MODUL 2 DEZAMORSAT — Unitate pregătită pentru Sinaia!', 'success');
      } else if (moduleId >= 3 && moduleId <= 7) {
        window.setTimeout(() => soundEngine.playRadarPing(), 320);
        const destNum = moduleId - 2;
        showToast(
          `DECRIPTARE REUȘITĂ — Rută trasată către OBIECTIV CRIPTAT #${destNum}`,
          'success'
        );
      }
    },
    [showToast]
  );

  // Secret 5-tap trigger on mission nameplate
  const handleTitleTap = () => {
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
      registerStrike(1, 'Greșeală la Memoria! Resetare la Etapa 1.');
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
      setActiveTab('gps');
      showToast(`ADMIN: Rută forțată către OBIECTIV CRIPTAT #${destId}`, 'info');
    }
  };

  const handleAdminReset = () => {
    const fresh = createInitialMissionState();
    setState(fresh);
    setActiveTab('console');
    showToast('Misiune resetată complet.', 'info');
  };

  const gpsUnlocked = isGpsUnlocked(state);
  const activeDestination = getActiveDestination(state);
  const module2Solved = state.solvedModules.includes(2);
  const module7Solved = state.solvedModules.includes(7);

  return (
    <div
      className={`hw-chassis-bg min-h-screen flex flex-col text-slate-100 pb-20 lg:pb-8 ${
        shaking ? 'animate-hw-shake' : ''
      }`}
    >
      {/* Peripheral Strike Flash Vignette */}
      {strikeFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 border-[8px] border-red-500/80 shadow-[inset_0_0_70px_rgba(239,68,68,0.65)] animate-strike-flash"
        />
      )}

      {/* Compact Sticky Hardware Top Bar */}
      <header className="sticky top-0 z-30 h-14 bg-[#0c1016]/95 border-b border-slate-800 shadow-lg px-3 sm:px-6 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleTitleTap}
          aria-label="Operațiunea 3 Ani — emblemă consolă"
          className="hw-nameplate rounded-md px-2.5 py-1.5 flex items-center gap-2 shrink-0 cursor-pointer select-none"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
          <span className="font-display text-xs sm:text-sm font-bold tracking-wider text-amber-300 whitespace-nowrap">
            OPERAȚIUNEA 3 ANI
          </span>
        </button>

        {/* Desktop Primary Tabs */}
        <nav aria-label="Navigare consolă" className="hidden lg:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('console');
            }}
            className={`px-3.5 py-1.5 rounded-md font-display text-xs font-bold tracking-wider transition-colors whitespace-nowrap ${
              activeTab === 'console'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            CONSOLĂ
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('gps');
            }}
            className={`px-3.5 py-1.5 rounded-md font-display text-xs font-bold tracking-wider transition-colors whitespace-nowrap ${
              activeTab === 'gps'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            RADAR GPS
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('casing');
            }}
            className={`px-3.5 py-1.5 rounded-md font-display text-xs font-bold tracking-wider transition-colors whitespace-nowrap ${
              activeTab === 'casing'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            CARCASĂ / DATE
          </button>
        </nav>

        {/* Right Controls: Strikes, Mute, PWA Install */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            data-testid="strike-counter"
            aria-label={`Greșeli totale: ${state.strikes}`}
            className="hw-lcd-screen rounded px-2 py-1 flex items-center gap-1.5"
          >
            <ShieldAlert
              className={`w-3.5 h-3.5 ${state.strikes > 0 ? 'text-red-400' : 'text-slate-500'}`}
              aria-hidden="true"
            />
            <span className="font-lcd text-sm text-red-400">{state.strikes}</span>
          </div>

          <PWAInstallButton />

          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, muted: !prev.muted }))}
            aria-label={state.muted ? 'Activează sunetul' : 'Dezactivează sunetul'}
            className="hw-btn-compact min-w-[40px] min-h-[36px] flex items-center justify-center text-slate-300 hover:text-white"
          >
            {state.muted ? (
              <VolumeX className="w-4 h-4 text-slate-500" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4 text-sky-300" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Non-blocking Floating Status Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none fixed bottom-20 lg:bottom-5 left-1/2 -translate-x-1/2 z-[1100] w-[92%] max-w-md rounded-lg px-3.5 py-2.5 shadow-xl border font-tech text-xs text-center ${
            toast.tone === 'error'
              ? 'bg-red-950/95 border-red-500 text-red-200'
              : toast.tone === 'success'
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
                : 'bg-slate-900/95 border-sky-500/60 text-sky-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4">
        {activeTab === 'console' && (
          <div className="space-y-4">
            {/* Mission Progress Strip */}
            <div className="hw-chassis rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-tech text-slate-400">
                  <span>PROGRES MISIUNE</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-300 font-bold">
                    {state.solvedModules.length} / 7 MODULE DEZAMORSATE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {activeDestination
                    ? `Rută activă: ${activeDestination.codeName}`
                    : gpsUnlocked
                      ? 'Semnal GPS deblocat · Continuă cu următorul modul.'
                      : 'Dezamorsează Modulul 1 (Memoria) pentru a inițializa radarul GPS.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {MISSION_MODULES.map((m) => {
                    const st = getModuleStatus(state, m.id);
                    return (
                      <div
                        key={m.id}
                        className={`w-6 h-2.5 rounded-sm border ${
                          st === 'solved'
                            ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                            : st === 'active'
                              ? 'bg-amber-400 border-amber-300'
                              : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>
                {gpsUnlocked && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveTab('gps');
                    }}
                    className="hw-btn-compact px-2.5 py-1.5 font-tech text-[11px] text-sky-300 whitespace-nowrap"
                  >
                    Deschide Hartă →
                  </button>
                )}
              </div>
            </div>

            {/* Responsive Multi-Column Hardware Module Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {MISSION_MODULES.map((meta) => {
                const status = getModuleStatus(state, meta.id);
                const isStrike = strikeModuleId === meta.id;
                const isJustSolved = justSolvedId === meta.id;

                return (
                  <ModuleCardShell
                    key={meta.id}
                    meta={meta}
                    status={status}
                    strikePulse={isStrike}
                    justSolved={isJustSolved}
                  >
                    {meta.id === 1 && (
                      <MemoryModule state={state.memory} onPress={handleMemoryPress} />
                    )}
                    {meta.id === 2 && (
                      <ComplicatedWiresModule
                        state={state.complicatedWires}
                        onCutWire={handleCutComplicatedWire}
                      />
                    )}
                    {meta.id === 3 && (
                      <WhosOnFirstModule
                        state={state.whosOnFirst}
                        onPressButton={handleWhosOnFirstPress}
                      />
                    )}
                    {meta.id === 4 && (
                      <WireSequencesModule
                        state={state.wireSequences}
                        onCutWire={handleCutSeqWire}
                        onNavigate={handleSeqNavigate}
                      />
                    )}
                    {meta.id === 5 && (
                      <MazesModule
                        state={state.maze}
                        wallFlash={mazeWallFlash}
                        onMove={handleMazeMove}
                      />
                    )}
                    {meta.id === 6 && (
                      <KnobsModule
                        state={state.knobs}
                        isActive={status === 'active'}
                        onRotate={handleKnobRotate}
                        onValidate={handleKnobValidate}
                        onTickTimer={handleKnobTick}
                        onResetTimer={handleKnobResetTimer}
                      />
                    )}
                    {meta.id === 7 && (
                      <PasswordsModule
                        state={state.passwords}
                        onStepColumn={handlePasswordStep}
                        onSubmit={handlePasswordSubmit}
                      />
                    )}
                  </ModuleCardShell>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'gps' && (
          <div className="max-w-3xl mx-auto">
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

        {activeTab === 'casing' && (
          <div className="max-w-3xl mx-auto">
            <CasingSpecsView casing={state.casing} />
          </div>
        )}
      </main>

      {/* Mobile Bottom Hardware Tab Bar (<= 60px height, fits inside 15% cap with top bar) */}
      <nav
        aria-label="Bară de navigare principală"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-15 bg-[#0c1016]/95 border-t border-slate-800 grid grid-cols-3 items-center px-2"
      >
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('console');
          }}
          className={`flex flex-col items-center justify-center py-1.5 rounded-lg min-h-[44px] ${
            activeTab === 'console' ? 'text-amber-300' : 'text-slate-400'
          }`}
        >
          <Terminal className="w-5 h-5" aria-hidden="true" />
          <span className="font-display text-[10px] font-bold tracking-wider mt-0.5">
            CONSOLĂ
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('gps');
          }}
          className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg min-h-[44px] ${
            activeTab === 'gps' ? 'text-sky-300' : 'text-slate-400'
          }`}
        >
          <MapIcon className="w-5 h-5" aria-hidden="true" />
          <span className="font-display text-[10px] font-bold tracking-wider mt-0.5">
            RADAR GPS
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('casing');
          }}
          className={`flex flex-col items-center justify-center py-1.5 rounded-lg min-h-[44px] ${
            activeTab === 'casing' ? 'text-amber-300' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-5 h-5" aria-hidden="true" />
          <span className="font-display text-[10px] font-bold tracking-wider mt-0.5">
            CARCASĂ / DATE
          </span>
        </button>
      </nav>

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
          onBackToConsole={() => setState((prev) => ({ ...prev, victory: false }))}
          onResetGame={handleAdminReset}
        />
      )}
    </div>
  );
}
