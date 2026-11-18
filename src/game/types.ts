export type AppTab = 'console' | 'gps' | 'casing';

export type ModuleId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ModuleStatus = 'locked' | 'active' | 'solved';

export type PortType = 'parallel' | 'serial' | 'dvid' | 'ps2' | 'rj45' | 'rca';

export interface BombCasing {
  serialNumber: string;
  lastDigitEven: boolean;
  aaPairs: number;
  dCells: number;
  totalBatteries: number;
  hasParallelPort: boolean;
  ports: PortType[];
}

export interface MemoryPressRecord {
  position: 1 | 2 | 3 | 4;
  label: 1 | 2 | 3 | 4;
}

export interface MemoryState {
  stage: 1 | 2 | 3 | 4 | 5;
  display: 1 | 2 | 3 | 4;
  buttons: [1 | 2 | 3 | 4, 1 | 2 | 3 | 4, 1 | 2 | 3 | 4, 1 | 2 | 3 | 4];
  history: MemoryPressRecord[];
}

export type WireColorType =
  | 'white'
  | 'red'
  | 'blue'
  | 'red-white'
  | 'blue-white'
  | 'red-blue';

export interface ComplicatedWireItem {
  id: number;
  color: WireColorType;
  hasRed: boolean;
  hasBlue: boolean;
  hasStar: boolean;
  ledOn: boolean;
  shouldCut: boolean;
  cut: boolean;
}

export interface ComplicatedWiresState {
  wires: ComplicatedWireItem[];
}

export interface WhosOnFirstState {
  round: 1 | 2 | 3;
  displayWord: string;
  buttons: [string, string, string, string, string, string];
  expectedIndex: number;
}

export type SeqWireColor = 'red' | 'blue' | 'black';
export type SeqTerminal = 'A' | 'B' | 'C';

export interface SequenceWire {
  id: number;
  panelIndex: number;
  labelNumber: number;
  slotIndex: 1 | 2 | 3;
  color: SeqWireColor;
  target: SeqTerminal;
  occurrence: number;
  shouldCut: boolean;
  cut: boolean;
}

export interface WireSequencesState {
  currentPanel: number;
  panels: SequenceWire[][];
}

export interface MazeCoord {
  col: number; // 1..6
  row: number; // 1..6
}

export interface MazeState {
  mapId: number;
  markers: [MazeCoord, MazeCoord];
  player: MazeCoord;
  goal: MazeCoord;
}

export type KnobDirection = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

export interface KnobsState {
  upSide: KnobDirection; // where the "UP" label sits around the dial
  dialFacing: KnobDirection; // where the dial pointer currently points in world space
  leds: number[]; // 12 bits (row 1: 0..5, row 2: 6..11)
  expectedRelative: KnobDirection;
  secondsLeft: number;
}

export interface PasswordsState {
  targetWord: string;
  columns: [string[], string[], string[], string[], string[]];
  indices: [number, number, number, number, number];
}

export interface MissionMetaItem {
  id: ModuleId;
  code: string;
  stageLabel: string;
  title: string;
  subtitle: string;
  unlockHint: string;
}

export interface PersistedMissionState {
  solvedModules: ModuleId[];
  highestUnlocked: ModuleId;
  strikes: number;
  muted: boolean;
  victory: boolean;
  forcedDestinationId: number | null;
  simulatedGps: boolean;
  casing: BombCasing;
  memory: MemoryState;
  complicatedWires: ComplicatedWiresState;
  whosOnFirst: WhosOnFirstState;
  wireSequences: WireSequencesState;
  maze: MazeState;
  knobs: KnobsState;
  passwords: PasswordsState;
}
