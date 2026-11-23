import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
} from 'lucide-react';
import { MISSION_MODULES, getModuleStatus } from '../game/missionState';
import type { ModuleId, PersistedMissionState } from '../game/types';
import {
  BatteryBayHardware,
  ConnectorPortsHardware,
  SerialBrassPlate,
} from './CasingSpecsView';
import { ModuleCardShell, SlottedScrew } from './ModuleCardShell';
import { ComplicatedWiresModule } from './modules/ComplicatedWiresModule';
import { KnobsModule } from './modules/KnobsModule';
import { MazesModule } from './modules/MazesModule';
import { MemoryModule } from './modules/MemoryModule';
import { PasswordsModule } from './modules/PasswordsModule';
import { WhosOnFirstModule } from './modules/WhosOnFirstModule';
import { WireSequencesModule } from './modules/WireSequencesModule';
import type { MazeDirection } from '../game/mazes';

export type CasingAnglePreset = 'front' | 'top' | 'left' | 'right';

interface Bomb3DSceneProps {
  state: PersistedMissionState;
  focusedModuleId: ModuleId | null;
  strikeModuleId: ModuleId | null;
  justSolvedId: ModuleId | null;
  mazeWallFlash: boolean;
  gpsUnlocked: boolean;
  activeDestCode: string | null;
  onFocusModule: (id: ModuleId | null) => void;
  onOpenLoupe: () => void;
  onOpenGps: () => void;
  onMemoryPress: (pos: 1 | 2 | 3 | 4) => void;
  onCutComplicatedWire: (wireId: number) => void;
  onWhosOnFirstPress: (btnIndex: number) => void;
  onCutSeqWire: (wireId: number) => void;
  onSeqNavigate: (dir: 'up' | 'down') => void;
  onMazeMove: (dir: MazeDirection) => void;
  onKnobRotate: () => void;
  onKnobValidate: () => void;
  onKnobTickTimer: () => void;
  onKnobResetTimer: () => void;
  onPasswordStep: (colIndex: number, delta: 1 | -1) => void;
  onPasswordSubmit: () => void;
}

const ANGLE_PRESETS: Record<CasingAnglePreset, { rx: number; ry: number; label: string }> = {
  front: { rx: 9, ry: -7, label: 'Față (Module)' },
  top: { rx: -74, ry: 0, label: 'Sus (Baterii)' },
  left: { rx: 4, ry: 76, label: 'Stânga (Serie)' },
  right: { rx: 4, ry: -76, label: 'Dreapta (Porturi)' },
};

const SideHandle: React.FC<{ side: 'left' | 'right' }> = ({ side }) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none flex flex-col items-center justify-center gap-1 ${
      side === 'left' ? 'mr-1' : 'ml-1'
    }`}
  >
    <div className="w-4 h-5 chassis-plate" />
    <div className="w-3 h-24 rounded-[2px] bg-gradient-to-r from-stone-800 via-stone-600 to-stone-900 border border-stone-600/60 shadow-lg" />
    <div className="w-4 h-5 chassis-plate" />
  </div>
);

export const Bomb3DScene: React.FC<Bomb3DSceneProps> = ({
  state,
  focusedModuleId,
  strikeModuleId,
  justSolvedId,
  mazeWallFlash,
  gpsUnlocked,
  activeDestCode,
  onFocusModule,
  onOpenLoupe,
  onOpenGps,
  onMemoryPress,
  onCutComplicatedWire,
  onWhosOnFirstPress,
  onCutSeqWire,
  onSeqNavigate,
  onMazeMove,
  onKnobRotate,
  onKnobValidate,
  onKnobTickTimer,
  onKnobResetTimer,
  onPasswordStep,
  onPasswordSubmit,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 1200, h: 720 });
  const [rot, setRot] = useState<{ rx: number; ry: number }>({
    rx: ANGLE_PRESETS.front.rx,
    ry: ANGLE_PRESETS.front.ry,
  });
  const [activePreset, setActivePreset] = useState<CasingAnglePreset | null>('front');
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    baseRx: number;
    baseRy: number;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    baseRx: 9,
    baseRy: -7,
  });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ w: rect.width, h: rect.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isDesktopLayout = stageSize.w >= 760;
  // 3D Chassis virtual dimensions: 4x2 briefcase on desktop, 2x4 on portrait phone
  const boxW = isDesktopLayout ? 1260 : 660;
  const boxH = isDesktopLayout ? 740 : 1140;
  const boxD = 220;
  const halfW = boxW / 2;
  const halfH = boxH / 2;
  const halfD = boxD / 2;

  const baseScale = useMemo(() => {
    const padW = isDesktopLayout ? 120 : 48;
    const padH = isDesktopLayout ? 68 : 56;
    const sx = (stageSize.w - padW) / boxW;
    const sy = (stageSize.h - padH) / boxH;
    return Math.max(0.28, Math.min(0.95, Math.min(sx, sy)));
  }, [stageSize.w, stageSize.h, boxW, boxH, isDesktopLayout]);

  // Compute camera pan & zoom offset when a module slot is focused
  const cameraTransform = useMemo(() => {
    if (focusedModuleId === null) {
      return `scale3d(${baseScale}, ${baseScale}, ${baseScale}) rotateX(${rot.rx}deg) rotateY(${rot.ry}deg)`;
    }
    // Map slot index 0..6 onto grid coordinates to pull that exact bay behind the focused panel
    const idx = focusedModuleId - 1;
    const cols = isDesktopLayout ? 4 : 2;
    const rows = isDesktopLayout ? 2 : 4;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const normX = (col + 0.5) / cols - 0.5;
    const normY = (row + 0.5) / rows - 0.5;
    const shiftX = -normX * boxW * 0.72;
    const shiftY = -normY * boxH * 0.72;
    const zoomScale = Math.min(1.18, baseScale * 1.48);
    return `scale3d(${zoomScale}, ${zoomScale}, ${zoomScale}) translate3d(${shiftX}px, ${shiftY}px, 60px) rotateX(0deg) rotateY(0deg)`;
  }, [focusedModuleId, baseScale, rot.rx, rot.ry, isDesktopLayout, boxW, boxH]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (focusedModuleId !== null) return;
    // Ignore drags starting directly on interactive angle buttons
    if ((e.target as HTMLElement).closest('button, a, input')) {
      // Allow drag if started on module click-overlay only after 7px movement
    }
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      baseRx: rot.rx,
      baseRy: rot.ry,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.active || focusedModuleId !== null) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > 7) {
      d.moved = true;
      setIsDragging(true);
      setActivePreset(null);
    }
    if (d.moved) {
      const nextRy = Math.max(-105, Math.min(105, d.baseRy + dx * 0.28));
      const nextRx = Math.max(-85, Math.min(60, d.baseRx - dy * 0.28));
      setRot({ rx: nextRx, ry: nextRy });
    }
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
    setIsDragging(false);
  };

  const selectPreset = (preset: CasingAnglePreset) => {
    setActivePreset(preset);
    setRot({ rx: ANGLE_PRESETS[preset].rx, ry: ANGLE_PRESETS[preset].ry });
  };

  const renderModuleBody = (id: ModuleId) => {
    switch (id) {
      case 1:
        return <MemoryModule state={state.memory} onPress={onMemoryPress} />;
      case 2:
        return (
          <ComplicatedWiresModule
            state={state.complicatedWires}
            onCutWire={onCutComplicatedWire}
          />
        );
      case 3:
        return (
          <WhosOnFirstModule
            state={state.whosOnFirst}
            onPressButton={onWhosOnFirstPress}
          />
        );
      case 4:
        return (
          <WireSequencesModule
            state={state.wireSequences}
            onCutWire={onCutSeqWire}
            onNavigate={onSeqNavigate}
          />
        );
      case 5:
        return (
          <MazesModule
            state={state.maze}
            wallFlash={mazeWallFlash}
            onMove={onMazeMove}
          />
        );
      case 6:
        return (
          <KnobsModule
            state={state.knobs}
            isActive={getModuleStatus(state, 6) === 'active'}
            onRotate={onKnobRotate}
            onValidate={onKnobValidate}
            onTickTimer={onKnobTickTimer}
            onResetTimer={onKnobResetTimer}
          />
        );
      case 7:
        return (
          <PasswordsModule
            state={state.passwords}
            onStepColumn={onPasswordStep}
            onSubmit={onPasswordSubmit}
          />
        );
    }
  };

  const focusedMeta = focusedModuleId
    ? MISSION_MODULES.find((m) => m.id === focusedModuleId) ?? null
    : null;

  // Analog needle angle in Auxiliary Bay (reacts subtly to strikes)
  const stressNeedleDeg = -46 + Math.min(4, state.strikes) * 23;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative select-none">
      {/* 3D Workbench Stage */}
      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        data-testid="bomb-3d-stage"
        className={`relative flex-1 min-h-[420px] sm:min-h-[520px] overflow-hidden bomb-stage-perspective touch-pan-y ${
          focusedModuleId === null ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        {/* Soft depth-of-field dim overlay behind focused module */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 z-10 ${
            focusedModuleId !== null
              ? 'opacity-100 bg-black/65'
              : 'opacity-0'
          }`}
        />

        {/* 3D Bomb Box Assembly — centered around geometric midpoint regardless of scale */}
        <div
          className={`bomb-3d-assembly ${isDragging ? 'is-dragging' : ''} ${
            focusedModuleId !== null ? 'pointer-events-none blur-[2px] brightness-50' : ''
          }`}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${boxW}px`,
            height: `${boxH}px`,
            marginLeft: `${-boxW / 2}px`,
            marginTop: `${-boxH / 2}px`,
            transform: cameraTransform,
          }}
        >
          {/* ================= FRONT FACE (Modules + Telemetry Bay) ================= */}
          <div
            className="bomb-face chassis-plate metal-micrograin absolute inset-0 p-3.5 flex flex-col justify-between overflow-hidden"
            style={{ transform: `translateZ(${halfD}px)` }}
          >
            {/* Outer Chassis Corner Bolts */}
            <SlottedScrew className="absolute top-2.5 left-2.5 scale-125" angle={12} />
            <SlottedScrew className="absolute top-2.5 right-2.5 scale-125" angle={-42} />
            <SlottedScrew className="absolute bottom-2.5 left-2.5 scale-125" angle={58} />
            <SlottedScrew className="absolute bottom-2.5 right-2.5 scale-125" angle={-18} />

            {/* Decorative Braided Umbilical Bus Cables running along chassis frame */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-full h-full opacity-65"
              preserveAspectRatio="none"
            >
              <line x1="20" y1="50%" x2="98%" y2="50%" stroke="#08090b" strokeWidth="6" />
              <line x1="20" y1="50%" x2="98%" y2="50%" stroke="#5c2419" strokeWidth="2.5" strokeDasharray="8 4" />
            </svg>

            {/* 4x2 (Desktop) or 2x4 (Mobile) Recessed Module Matrix */}
            <div
              className={`relative z-10 grid gap-2.5 flex-1 min-h-0 ${
                isDesktopLayout
                  ? 'grid-cols-4 grid-rows-[minmax(0,1fr)_minmax(0,1fr)]'
                  : 'grid-cols-2 grid-rows-[repeat(4,minmax(0,1fr))]'
              }`}
            >
              {MISSION_MODULES.map((meta) => {
                const status = getModuleStatus(state, meta.id);
                return (
                  <div key={meta.id} className="min-w-0 min-h-0 flex flex-col">
                    <ModuleCardShell
                      meta={meta}
                      status={status}
                      strikePulse={strikeModuleId === meta.id}
                      justSolved={justSolvedId === meta.id}
                      isFocused={false}
                      onInspect={() => {
                        if (!dragRef.current.moved) {
                          onFocusModule(meta.id);
                        }
                      }}
                    >
                      {renderModuleBody(meta.id)}
                    </ModuleCardShell>
                  </div>
                );
              })}

              {/* 8th Compartment: Auxiliary Analog Stress Meter, Relay Bank & GPS Port */}
              <div className="chassis-plate metal-micrograin relative p-3 flex flex-col justify-between min-h-0 overflow-hidden">
                <SlottedScrew className="absolute top-2 left-2" angle={32} />
                <SlottedScrew className="absolute top-2 right-2" angle={-22} />
                <SlottedScrew className="absolute bottom-2 left-2" angle={44} />
                <SlottedScrew className="absolute bottom-2 right-2" angle={-8} />

                <div className="flex items-center justify-between border-b border-black/70 pb-2 px-2">
                  <span className="brass-plaque px-2 py-0.5 font-tech text-[10px] font-bold text-amber-100">
                    AUX-08
                  </span>
                  <span className="font-tech text-[10px] text-stone-400">
                    {state.solvedModules.length}/7 DEZ.
                  </span>
                </div>

                {/* Analog Tension Voltmeter */}
                <div className="recessed-bay p-2.5 flex flex-col items-center justify-center my-1.5">
                  <svg viewBox="0 0 140 76" className="w-32 h-16" aria-hidden="true">
                    <path
                      d="M 16 66 A 54 54 0 0 1 124 66"
                      fill="none"
                      stroke="#292c30"
                      strokeWidth="9"
                    />
                    <path
                      d="M 96 22 A 54 54 0 0 1 124 66"
                      fill="none"
                      stroke="#991b1b"
                      strokeWidth="9"
                    />
                    <g transform={`translate(70, 66) rotate(${stressNeedleDeg})`}>
                      <line x1="0" y1="4" x2="0" y2="-46" stroke="#ff9824" strokeWidth="2.4" />
                    </g>
                    <circle cx="70" cy="66" r="5" fill="#4b5563" stroke="#111827" />
                  </svg>
                  <span className="font-tech text-[9px] tracking-widest text-stone-400">
                    TENSIUNE RELEU · {state.strikes} ERR
                  </span>
                </div>

                {/* Direct Actions mounted on Auxiliary Bay */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenGps}
                    className="mech-toggle py-2 px-1.5 flex items-center justify-center gap-1 font-tech text-[10px] text-emerald-300 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {activeDestCode ? 'RUTĂ GPS' : gpsUnlocked ? 'RADAR' : 'GPS SIGILAT'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLoupe}
                    className="mech-toggle py-2 px-1.5 flex items-center justify-center gap-1 font-tech text-[10px] text-amber-300 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">CARCASĂ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ================= BACK FACE ================= */}
          <div
            className="bomb-face chassis-plate metal-micrograin absolute inset-0 p-8 flex flex-col items-center justify-between"
            style={{ transform: `rotateY(180deg) translateZ(${halfD}px)` }}
          >
            <div className="w-full flex items-center justify-between border-b border-black/70 pb-3">
              <span className="brass-plaque px-3 py-1 font-tech text-xs font-bold text-amber-100">
                CAPAC POSTERIOR · VIZITARE TEHNICĂ
              </span>
              <span className="font-tech text-xs text-stone-500">SERIE {state.casing.serialNumber}</span>
            </div>
            <div className="recessed-bay w-full flex-1 my-4 p-6 grid grid-cols-3 gap-3 opacity-75">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-4 bg-black/80 border-b border-white/10" />
              ))}
            </div>
            <div className="hw-hazard-stripe w-full h-4" />
          </div>

          {/* ================= LEFT WALL (Serial Number Plate + Carry Handle) ================= */}
          <div
            className="bomb-face chassis-plate metal-micrograin absolute top-0 flex flex-col items-center justify-center gap-5 p-3"
            style={{
              width: `${boxD}px`,
              height: `${boxH}px`,
              left: `${halfW - halfD}px`,
              transform: `rotateY(-90deg) translateZ(${halfW}px)`,
            }}
          >
            <SideHandle side="left" />
            <div className="w-full">
              <p className="font-tech text-[10px] text-center tracking-widest text-stone-400 mb-1.5">
                IDENTIFICARE ȘASIU
              </p>
              <SerialBrassPlate casing={state.casing} compact />
            </div>
            <div className="hw-hazard-stripe w-full h-3" />
          </div>

          {/* ================= RIGHT WALL (Industrial Ports Bay + Carry Handle) ================= */}
          <div
            className="bomb-face chassis-plate metal-micrograin absolute top-0 flex flex-col items-center justify-center gap-4 p-3"
            style={{
              width: `${boxD}px`,
              height: `${boxH}px`,
              left: `${halfW - halfD}px`,
              transform: `rotateY(90deg) translateZ(${halfW}px)`,
            }}
          >
            <SideHandle side="right" />
            <div className="w-full">
              <p className="font-tech text-[10px] text-center tracking-widest text-stone-400 mb-1.5">
                MAGISTRALĂ I/O
              </p>
              <ConnectorPortsHardware casing={state.casing} compact />
            </div>
          </div>

          {/* ================= TOP WALL (Physical AA / D Battery Bay + Braided Cables) ================= */}
          <div
            className="bomb-face chassis-plate metal-micrograin absolute left-0 flex items-center justify-between gap-4 px-6 py-3"
            style={{
              width: `${boxW}px`,
              height: `${boxD}px`,
              top: `${halfH - halfD}px`,
              transform: `rotateX(90deg) translateZ(${halfH}px)`,
            }}
          >
            <div className="flex flex-col gap-1 shrink-0">
              <span className="brass-plaque px-2.5 py-1 font-tech text-xs font-bold text-amber-100">
                ALIMENTARE CC
              </span>
              <span className="font-tech text-[10px] text-stone-400">
                CELULE AA / 1.5V D
              </span>
            </div>
            <div className="flex-1">
              <BatteryBayHardware casing={state.casing} compact />
            </div>
          </div>

          {/* ================= BOTTOM WALL ================= */}
          <div
            className="bomb-face chassis-plate metal-micrograin absolute left-0 flex items-center justify-between px-8"
            style={{
              width: `${boxW}px`,
              height: `${boxD}px`,
              top: `${halfH - halfD}px`,
              transform: `rotateX(-90deg) translateZ(${halfH}px)`,
            }}
          >
            <div className="w-12 h-12 bakelite-surface" />
            <div className="hw-hazard-stripe flex-1 mx-8 h-5" />
            <div className="w-12 h-12 bakelite-surface" />
          </div>
        </div>

        {/* ================= FOCUSED ISOLATED MODULE WORKBENCH OVERLAY ================= */}
        {focusedModuleId !== null && focusedMeta && (
          <div
            data-testid="focused-module-overlay"
            className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <div className="w-full max-w-xl my-auto flex flex-col gap-2.5">
            {/* Camera Navigation Bar (Zoom Out + Adjacent Module Slide) */}
            <div className="chassis-plate p-1.5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onFocusModule(null)}
                className="mech-toggle min-h-[42px] px-3 py-1.5 flex items-center gap-1.5 font-tech text-xs font-bold text-amber-300 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Zoom Out / Ansamblu</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const prev = (focusedModuleId === 1 ? 7 : focusedModuleId - 1) as ModuleId;
                    onFocusModule(prev);
                  }}
                  aria-label="Modulul anterior"
                  className="mech-toggle min-w-[42px] min-h-[42px] px-2.5 flex items-center justify-center text-stone-200 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = (focusedModuleId === 7 ? 1 : focusedModuleId + 1) as ModuleId;
                    onFocusModule(next);
                  }}
                  aria-label="Modulul următor"
                  className="mech-toggle min-w-[42px] min-h-[42px] px-2.5 flex items-center justify-center text-stone-200 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onOpenLoupe}
                  aria-label="Inspecție carcasă"
                  className="mech-toggle min-h-[42px] px-2.5 flex items-center gap-1 font-tech text-[11px] text-amber-200 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Carcasă</span>
                </button>
              </div>
            </div>

            {/* Active Focused High-Resolution Module Hardware */}
            <ModuleCardShell
              meta={focusedMeta}
              status={getModuleStatus(state, focusedMeta.id)}
              strikePulse={strikeModuleId === focusedMeta.id}
              justSolved={justSolvedId === focusedMeta.id}
              isFocused
            >
              {renderModuleBody(focusedMeta.id)}
            </ModuleCardShell>
            </div>
          </div>
        )}
      </div>

      {/* ================= BOTTOM 3D INSPECTION CONTROL BAR (Overview Mode) ================= */}
      {focusedModuleId === null && (
        <div className="relative z-20 px-2 sm:px-4 pb-3 pt-1 flex flex-wrap items-center justify-center gap-1.5">
          {(Object.keys(ANGLE_PRESETS) as CasingAnglePreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => selectPreset(key)}
              className={`mech-toggle min-h-[42px] px-2.5 sm:px-3 py-1.5 font-tech text-[11px] cursor-pointer whitespace-nowrap ${
                activePreset === key
                  ? 'text-amber-300 ring-1 ring-amber-500/60'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              {ANGLE_PRESETS[key].label}
            </button>
          ))}

          <button
            type="button"
            onClick={onOpenLoupe}
            className="mech-key min-h-[42px] px-3 py-1.5 flex items-center gap-1.5 font-tech text-[11px] font-bold text-amber-200 cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Inspecție Carcasă</span>
          </button>

          <button
            type="button"
            onClick={() => selectPreset('front')}
            aria-label="Resetează unghiul 3D"
            className="mech-toggle min-w-[42px] min-h-[42px] px-2.5 flex items-center justify-center text-stone-400 hover:text-stone-100 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};
