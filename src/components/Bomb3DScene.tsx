import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
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
  onRotationChange?: (rot: { rx: number; ry: number }) => void;
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

/** Decorative twisted color wire pairs tucked along interior 3D chassis channels (Image 2) */
const TwistedHarnessSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 800 32"
    preserveAspectRatio="none"
    className={`pointer-events-none ${className}`}
  >
    {/* Red + Yellow twisted pair */}
    <path
      d="M 10 14 Q 60 6, 110 14 T 210 14 T 310 14 T 410 14 T 510 14 T 610 14 T 710 14 L 790 14"
      fill="none"
      stroke="#c0281c"
      strokeWidth="3.2"
    />
    <path
      d="M 10 14 Q 60 22, 110 14 T 210 14 T 310 14 T 410 14 T 510 14 T 610 14 T 710 14 L 790 14"
      fill="none"
      stroke="#f1c40f"
      strokeWidth="2.8"
    />
    {/* Blue + White + Green secondary bundle */}
    <path
      d="M 20 20 Q 75 27, 130 20 T 250 20 T 370 20 T 490 20 T 610 20 T 730 20 L 790 20"
      fill="none"
      stroke="#1d4ed8"
      strokeWidth="2.8"
    />
    <path
      d="M 20 20 Q 75 13, 130 20 T 250 20 T 370 20 T 490 20 T 610 20 T 730 20 L 790 20"
      fill="none"
      stroke="#e6e1d3"
      strokeWidth="2.4"
    />
    <path
      d="M 30 24 Q 90 16, 150 24 T 270 24 T 390 24 T 510 24 T 630 24 L 785 24"
      fill="none"
      stroke="#166534"
      strokeWidth="2.5"
    />
  </svg>
);

export const Bomb3DScene: React.FC<Bomb3DSceneProps> = ({
  state,
  focusedModuleId,
  strikeModuleId,
  justSolvedId,
  mazeWallFlash,
  gpsUnlocked,
  activeDestCode,
  onRotationChange,
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
    baseRx: ANGLE_PRESETS.front.rx,
    baseRy: ANGLE_PRESETS.front.ry,
  });

  useEffect(() => {
    onRotationChange?.(rot);
  }, [rot, onRotationChange]);

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
  // Exact 3D virtual chassis dimensions: 4x2 desktop, 2x4 mobile
  const boxW = isDesktopLayout ? 1260 : 660;
  const boxH = isDesktopLayout ? 740 : 1140;
  const boxD = 220;
  const halfW = boxW / 2;
  const halfH = boxH / 2;
  const halfD = boxD / 2;

  const baseScale = useMemo(() => {
    const padW = isDesktopLayout ? 260 : 72;
    const padH = isDesktopLayout ? 104 : 180;
    const sx = (stageSize.w - padW) / boxW;
    const sy = (stageSize.h - padH) / boxH;
    return Math.max(0.28, Math.min(0.88, Math.min(sx, sy)));
  }, [stageSize.w, stageSize.h, boxW, boxH, isDesktopLayout]);

  const cameraTransform = useMemo(() => {
    if (focusedModuleId === null) {
      return `scale3d(${baseScale}, ${baseScale}, ${baseScale}) rotateX(${rot.rx}deg) rotateY(${rot.ry}deg)`;
    }
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

  // Analog voltmeter needle angle reacting to strikes
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
        {/* Dim backdrop behind focused module (opacity only — zero blur in 3D context) */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 z-10 bg-black/75 ${
            focusedModuleId !== null ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* 3D Bomb Box Assembly — centered around geometric midpoint */}
        <div
          className={`bomb-3d-assembly ${isDragging ? 'is-dragging' : ''} ${
            focusedModuleId !== null ? 'pointer-events-none opacity-45' : ''
          }`}
          style={{
            position: 'absolute',
            left: '50%',
            top: isDesktopLayout ? '50%' : '41%',
            width: `${boxW}px`,
            height: `${boxH}px`,
            marginLeft: `${-boxW / 2}px`,
            marginTop: `${-boxH / 2}px`,
            transform: cameraTransform,
          }}
        >
          {/* ================= FRONT FACE (Matte 3D-Printed Light Gray Enclosure) ================= */}
          <div
            className="bomb-face det-3d-shell-front absolute inset-0 p-5 flex flex-col justify-between overflow-hidden"
            style={{ transform: `translateZ(${halfD}px)` }}
          >
            {/* Outer Shell Frame Corner Bolts */}
            <SlottedScrew className="absolute top-2 left-2 scale-110" angle={12} />
            <SlottedScrew className="absolute top-2 right-2 scale-110" angle={-42} />
            <SlottedScrew className="absolute bottom-2 left-2 scale-110" angle={58} />
            <SlottedScrew className="absolute bottom-2 right-2 scale-110" angle={-18} />

            {/* Twisted colored jumper wire bundle running inside horizontal channel */}
            <TwistedHarnessSvg className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-8 opacity-85" />

            {/* 4x2 (Desktop) or 2x4 (Mobile) Deep Recessed Module Compartments */}
            <div
              className={`relative z-10 grid gap-4 flex-1 min-h-0 ${
                isDesktopLayout
                  ? 'grid-cols-4 grid-rows-[minmax(0,1fr)_minmax(0,1fr)]'
                  : 'grid-cols-2 grid-rows-[repeat(4,minmax(0,1fr))]'
              }`}
            >
              {MISSION_MODULES.map((meta) => {
                const status = getModuleStatus(state, meta.id);
                const isLowerRow = isDesktopLayout ? meta.id >= 5 : meta.id >= 3;
                return (
                  <div
                    key={meta.id}
                    className="det-3d-pocket relative min-w-0 min-h-0 p-2 flex flex-col"
                  >
                    {/* Arch cutout along lower-row compartment divider rib (as in Image 2) */}
                    {isLowerRow && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-3 rounded-t-full bg-[#747671] border-t border-x border-[#595b57]"
                      />
                    )}
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

              {/* 8th Compartment: AUX-08 Analog Cream-Face Meter & Dymo GPS/Casing Switches */}
              <div className="det-3d-pocket relative min-w-0 min-h-0 p-2 flex flex-col">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-3 rounded-t-full bg-[#747671] border-t border-x border-[#595b57]"
                />
                <div className="det-ivory-plate relative p-2.5 flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
                  <SlottedScrew className="absolute top-1.5 left-1.5" angle={32} />
                  <SlottedScrew className="absolute top-1.5 right-1.5" angle={-22} />
                  <SlottedScrew className="absolute bottom-1.5 left-1.5" angle={44} />
                  <SlottedScrew className="absolute bottom-1.5 right-1.5" angle={-8} />

                  <div className="flex items-center justify-between border-b border-[#15171a]/25 pb-1.5 px-2">
                    <span className="det-dymo-label px-2 py-0.5 text-[10px] font-bold">
                      AUX-08
                    </span>
                    <span className="font-tech text-[10px] font-bold text-[#15171a]">
                      {state.solvedModules.length}/7 DEZ.
                    </span>
                  </div>

                  {/* Round Cream-Face Analog Voltmeter (Image 2 style) */}
                  <div className="det-module-well p-2 flex flex-col items-center justify-center my-1">
                    <div className="w-32 h-[70px] bg-[#f3eedf] border border-[#525048] rounded-t-md flex items-center justify-center shadow-inner">
                      <svg viewBox="0 0 140 76" className="w-28 h-16" aria-hidden="true">
                        <path
                          d="M 16 64 A 54 54 0 0 1 124 64"
                          fill="none"
                          stroke="#8a8576"
                          strokeWidth="7"
                        />
                        <path
                          d="M 96 20 A 54 54 0 0 1 124 64"
                          fill="none"
                          stroke="#c0281c"
                          strokeWidth="7"
                        />
                        {/* Tick marks */}
                        {[-45, -22, 0, 22, 45].map((a) => (
                          <line
                            key={a}
                            x1="70"
                            y1="14"
                            x2="70"
                            y2="20"
                            stroke="#15171a"
                            strokeWidth="1.5"
                            transform={`rotate(${a} 70 64)`}
                          />
                        ))}
                        <g transform={`translate(70, 64) rotate(${stressNeedleDeg})`}>
                          <line x1="0" y1="4" x2="0" y2="-45" stroke="#15171a" strokeWidth="2.5" />
                        </g>
                        <circle cx="70" cy="64" r="5" fill="#15171a" />
                      </svg>
                    </div>
                    <span className="font-tech text-[9px] tracking-widest text-[#eceae2] mt-1">
                      TENSIUNE RELEU · {state.strikes} ERR
                    </span>
                  </div>

                  {/* Dymo-labeled GPS & Casing Switches */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={onOpenGps}
                      className="det-arcade-btn py-2 px-1.5 flex items-center justify-center cursor-pointer"
                    >
                      <span className="det-dymo-label px-1.5 py-0.5 text-[10px] font-bold truncate">
                        {activeDestCode ? 'RUTĂ GPS' : gpsUnlocked ? 'RADAR' : 'GPS SIGILAT'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onOpenLoupe}
                      className="det-arcade-btn py-2 px-1.5 flex items-center justify-center cursor-pointer"
                    >
                      <span className="det-dymo-label px-1.5 py-0.5 text-[10px] font-bold truncate">
                        CARCASĂ
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= BACK FACE ================= */}
          <div
            className="bomb-face det-3d-shell-back absolute inset-0 p-8 flex flex-col items-center justify-between"
            style={{ transform: `rotateY(180deg) translateZ(${halfD}px)` }}
          >
            <div className="w-full flex items-center justify-between border-b border-[#4c4e4a] pb-3">
              <span className="det-dymo-label px-3 py-1 text-xs font-bold">
                CAPAC POSTERIOR · VIZITARE TEHNICĂ
              </span>
              <span className="font-tech text-xs font-bold text-[#15171a]">
                SERIE {state.casing.serialNumber}
              </span>
            </div>
            <div className="det-3d-pocket w-full flex-1 my-4 p-6 grid grid-cols-3 gap-3 opacity-80">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-4 bg-[#2e302e] border-b border-white/15" />
              ))}
            </div>
            <div className="hw-hazard-stripe w-full h-4" />
          </div>

          {/* ================= LEFT WALL (Printed White Paper Serial Sticker) ================= */}
          <div
            className="bomb-face det-3d-shell-left absolute top-0 flex flex-col items-center justify-center gap-5 p-4"
            style={{
              width: `${boxD}px`,
              height: `${boxH}px`,
              left: `${halfW - halfD}px`,
              transform: `rotateY(-90deg) translateZ(${halfW}px)`,
            }}
          >
            <SlottedScrew className="absolute top-3 left-3" angle={16} />
            <SlottedScrew className="absolute top-3 right-3" angle={-42} />
            <SlottedScrew className="absolute bottom-3 left-3" angle={55} />
            <SlottedScrew className="absolute bottom-3 right-3" angle={-12} />

            <div className="w-full">
              <p className="font-tech text-[10px] font-bold text-center tracking-widest text-[#15171a] mb-2 uppercase">
                IDENTIFICARE ȘASIU
              </p>
              <SerialBrassPlate casing={state.casing} compact />
            </div>
            <div className="hw-hazard-stripe w-full h-3" />
          </div>

          {/* ================= RIGHT WALL (Ports + 2 Manila Evidence Tags + Black PSU Cable) ================= */}
          <div
            className="bomb-face det-3d-shell-right absolute top-0 flex flex-col items-center justify-center gap-4 p-3 overflow-visible"
            style={{
              width: `${boxD}px`,
              height: `${boxH}px`,
              left: `${halfW - halfD}px`,
              transform: `rotateY(90deg) translateZ(${halfW}px)`,
            }}
          >
            <SlottedScrew className="absolute top-3 left-3" angle={24} />
            <SlottedScrew className="absolute bottom-3 right-3" angle={-31} />

            <div className="w-full">
              <p className="font-tech text-[10px] font-bold text-center tracking-widest text-[#15171a] mb-1.5 uppercase">
                MAGISTRALĂ I/O
              </p>
              <ConnectorPortsHardware casing={state.casing} compact />
            </div>

            {/* 2 Hanging Manila Evidence Tags on Twine + Black Power Cable to PSU */}
            <div className="w-full flex items-start justify-around pt-1">
              {[
                { id: 'P-01', label: 'PROBĂ A' },
                { id: 'P-02', label: 'PROBĂ B' },
              ].map((tag, idx) => (
                <div
                  key={tag.id}
                  aria-hidden="true"
                  className={`flex flex-col items-center ${idx === 0 ? '-rotate-6' : 'rotate-3'}`}
                >
                  <div className="w-[1px] h-5 bg-[#8a8576]" />
                  <div className="bg-[#cbb88c] border border-[#6e5d3b] px-2 py-1.5 shadow-md text-center">
                    <span className="block font-tech text-[8px] font-bold text-[#c0281c]">
                      {tag.id}
                    </span>
                    <span className="block font-tech text-[8px] text-[#15171a]">
                      {tag.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Static SVG Black Cable exiting right casing side toward lab PSU */}
            <svg
              aria-hidden="true"
              viewBox="0 0 120 70"
              className="w-28 h-16 -mr-14 overflow-visible pointer-events-none"
            >
              <circle cx="10" cy="18" r="6" fill="#17181a" stroke="#484c52" strokeWidth="2" />
              <path d="M 10 18 C 52 24, 72 48, 120 62" fill="none" stroke="#15171a" strokeWidth="5.5" />
            </svg>
          </div>

          {/* ================= TOP WALL (Dark Blue-Black Brushed Metal Lid #172030->#0f1620 + Batteries) ================= */}
          <div
            className="bomb-face det-3d-lid-top absolute left-0 flex items-center justify-between gap-4 px-6 py-3"
            style={{
              width: `${boxW}px`,
              height: `${boxD}px`,
              top: `${halfH - halfD}px`,
              transform: `rotateX(90deg) translateZ(${halfH}px)`,
            }}
          >
            {/* 2 Hexagonal Metal Bolts */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-5 h-5 shrink-0 opacity-85"
            >
              <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="#4f545c" stroke="#141820" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="4" fill="#232830" />
            </svg>

            <div className="flex flex-col gap-1 shrink-0">
              <span className="det-dymo-label px-2.5 py-1 text-xs font-bold">
                ALIMENTARE CC
              </span>
              <span className="font-tech text-[10px] text-[#bdb6a4]">
                CELULE AA / 1.5V D
              </span>
            </div>

            <div className="flex-1">
              <BatteryBayHardware casing={state.casing} compact />
            </div>

            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-5 h-5 shrink-0 opacity-85"
            >
              <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="#4f545c" stroke="#141820" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="4" fill="#232830" />
            </svg>
          </div>

          {/* ================= BOTTOM WALL (4 Rubber Feet) ================= */}
          <div
            className="bomb-face det-3d-shell-bottom absolute left-0 flex items-center justify-between px-8"
            style={{
              width: `${boxW}px`,
              height: `${boxD}px`,
              top: `${halfH - halfD}px`,
              transform: `rotateX(-90deg) translateZ(${halfH}px)`,
            }}
          >
            <div className="w-11 h-11 rounded-full bg-[#15171a] border-2 border-[#2c2f33]" />
            <div className="w-11 h-11 rounded-full bg-[#15171a] border-2 border-[#2c2f33]" />
            <div className="hw-hazard-stripe flex-1 mx-6 h-4" />
            <div className="w-11 h-11 rounded-full bg-[#15171a] border-2 border-[#2c2f33]" />
            <div className="w-11 h-11 rounded-full bg-[#15171a] border-2 border-[#2c2f33]" />
          </div>
        </div>

        {/* ================= FOCUSED ISOLATED MODULE WORKBENCH OVERLAY ================= */}
        {focusedModuleId !== null && focusedMeta && (
          <div
            data-testid="focused-module-overlay"
            className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <div className="w-full max-w-xl my-auto flex flex-col gap-2.5">
              {/* Camera Navigation Bar */}
              <div className="det-3d-shell-front p-1.5 flex items-center justify-between gap-2 rounded-[2px]">
                <button
                  type="button"
                  onClick={() => onFocusModule(null)}
                  className="det-arcade-btn min-h-[44px] px-3 py-1.5 flex items-center gap-1.5 font-display text-xs font-bold cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-[#ffd9a0]" aria-hidden="true" />
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
                    className="det-arcade-btn min-w-[44px] min-h-[44px] px-2.5 flex items-center justify-center cursor-pointer"
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
                    className="det-arcade-btn min-w-[44px] min-h-[44px] px-2.5 flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLoupe}
                    aria-label="Inspecție carcasă"
                    className="det-arcade-btn min-h-[44px] px-2.5 flex items-center gap-1 font-display text-[11px] cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-[#ffd9a0]" aria-hidden="true" />
                    <span className="hidden sm:inline">Carcasă</span>
                  </button>
                </div>
              </div>

              {/* Active Focused High-Resolution Ivory Module Plate */}
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

      {/* ================= BOTTOM 3D INSPECTION CONTROL BAR (Dymo Labels on Table Edge) ================= */}
      {focusedModuleId === null && (
        <div className="pointer-events-none relative z-20 px-2 sm:px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-1 flex flex-wrap items-center justify-center gap-1.5">
          {(Object.keys(ANGLE_PRESETS) as CasingAnglePreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => selectPreset(key)}
              className={`pointer-events-auto det-arcade-btn min-h-[44px] px-2.5 sm:px-3 py-1.5 cursor-pointer whitespace-nowrap flex items-center ${
                activePreset === key ? 'ring-2 ring-[#ffd9a0]' : ''
              }`}
            >
              <span className="det-dymo-label px-1.5 py-0.5 text-[10px] font-bold">
                {ANGLE_PRESETS[key].label}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={onOpenLoupe}
            className="pointer-events-auto det-arcade-btn min-h-[44px] px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5 text-[#ffd9a0]" aria-hidden="true" />
            <span className="det-dymo-label px-1.5 py-0.5 text-[10px] font-bold">
              Inspecție Carcasă
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectPreset('front')}
            aria-label="Resetează unghiul 3D"
            className="pointer-events-auto det-arcade-btn min-w-[44px] min-h-[44px] px-2.5 flex items-center justify-center cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#eceae2]" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};
