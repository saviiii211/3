import { DESTINATIONS, STORAGE_KEY } from '../config';
import { generateBombCasing } from './casing';
import { createComplicatedWiresState } from './complicatedWires';
import { createKnobsState } from './knobs';
import { createMazeState } from './mazes';
import { createInitialMemoryState } from './memory';
import { createPasswordsState } from './passwords';
import type { MissionMetaItem, ModuleId, ModuleStatus, PersistedMissionState } from './types';
import { createWhosOnFirstRound } from './whosOnFirst';
import { createWireSequencesState } from './wireSequences';

export const MISSION_MODULES: MissionMetaItem[] = [
  {
    id: 1,
    code: 'MOD-01',
    stageLabel: 'Tren: Fetești → București',
    title: 'Memoria',
    subtitle: 'Secvență numerică în 5 etape',
    unlockHint: 'Deblochează sistemul de localizare GPS',
  },
  {
    id: 2,
    code: 'MOD-02',
    stageLabel: 'Tren: București → Sinaia',
    title: 'Fire Complicate',
    subtitle: 'Analiză logică & date carcasă',
    unlockHint: 'Validează tranzitul pentru misiunea din Sinaia',
  },
  {
    id: 3,
    code: 'MOD-03',
    stageLabel: 'Sinaia — Destinația 1',
    title: 'Cine e pe primul loc?',
    subtitle: 'Decodare semantică în 3 runde',
    unlockHint: 'Trasează ruta către Obiectiv Criptat #1',
  },
  {
    id: 4,
    code: 'MOD-04',
    stageLabel: 'Sinaia — Destinația 2',
    title: 'Secvențele de Fire',
    subtitle: '4 panouri cu apariții cumulative',
    unlockHint: 'Trasează ruta către Obiectiv Criptat #2',
  },
  {
    id: 5,
    code: 'MOD-05',
    stageLabel: 'Sinaia — Destinația 3',
    title: 'Labirintele',
    subtitle: 'Navigare pe grilă 6×6 cu pereți invizibili',
    unlockHint: 'Trasează ruta către Obiectiv Criptat #3',
  },
  {
    id: 6,
    code: 'MOD-06',
    stageLabel: 'Sinaia — Destinația 4',
    title: 'Butonul Rotativ',
    subtitle: 'Calibrare 12 LED-uri raportat la UP',
    unlockHint: 'Trasează ruta către Obiectiv Criptat #4',
  },
  {
    id: 7,
    code: 'MOD-07',
    stageLabel: 'Sinaia — Destinația 5 (Finală)',
    title: 'Parolele Secrete',
    subtitle: 'Cifru mecanic de 5 litere',
    unlockHint: 'Trasează ruta către Obiectiv Criptat #5 (Finala)',
  },
];

export function createInitialMissionState(rng: () => number = Math.random): PersistedMissionState {
  const casing = generateBombCasing(rng);
  return {
    solvedModules: [],
    highestUnlocked: 1,
    strikes: 0,
    muted: false,
    victory: false,
    forcedDestinationId: null,
    simulatedGps: false,
    casing,
    memory: createInitialMemoryState(rng),
    complicatedWires: createComplicatedWiresState(casing, rng),
    whosOnFirst: createWhosOnFirstRound(1, rng),
    wireSequences: createWireSequencesState(rng),
    maze: createMazeState(rng),
    knobs: createKnobsState(rng),
    passwords: createPasswordsState(rng),
  };
}

export function getModuleStatus(state: PersistedMissionState, moduleId: ModuleId): ModuleStatus {
  if (state.solvedModules.includes(moduleId)) return 'solved';
  if (moduleId <= state.highestUnlocked) return 'active';
  return 'locked';
}

export function isGpsUnlocked(state: PersistedMissionState): boolean {
  return state.solvedModules.includes(1) || state.highestUnlocked > 1 || state.forcedDestinationId !== null;
}

export function getActiveDestination(state: PersistedMissionState) {
  if (state.forcedDestinationId !== null) {
    return DESTINATIONS.find((d) => d.id === state.forcedDestinationId) ?? null;
  }
  // Module 3 -> Dest 1, Module 4 -> Dest 2, Module 5 -> Dest 3, Module 6 -> Dest 4, Module 7 -> Dest 5
  const solved = new Set(state.solvedModules);
  for (let i = DESTINATIONS.length - 1; i >= 0; i--) {
    const dest = DESTINATIONS[i];
    if (solved.has(dest.moduleRequired as ModuleId)) {
      return dest;
    }
  }
  return null;
}

export function markModuleSolved(state: PersistedMissionState, moduleId: ModuleId): PersistedMissionState {
  const solvedSet = new Set<ModuleId>(state.solvedModules);
  solvedSet.add(moduleId);
  const solvedModules = Array.from(solvedSet).sort((a, b) => a - b);
  const nextUnlock = Math.min(7, Math.max(state.highestUnlocked, moduleId + 1)) as ModuleId;
  return {
    ...state,
    solvedModules,
    highestUnlocked: nextUnlock,
    forcedDestinationId: null, // clear manual override when real progress advances
  };
}

export function loadMissionState(): PersistedMissionState {
  if (typeof window === 'undefined') {
    return createInitialMissionState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialMissionState();
    const parsed = JSON.parse(raw) as PersistedMissionState;
    if (!parsed || !parsed.casing || !Array.isArray(parsed.solvedModules)) {
      return createInitialMissionState();
    }
    return parsed;
  } catch {
    return createInitialMissionState();
  }
}

export function saveMissionState(state: PersistedMissionState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
