import type { BombCasing, ComplicatedWireItem, ComplicatedWiresState, WireColorType } from './types';

export type ComplicatedWireRule = 'C' | 'D' | 'S' | 'P' | 'B';

/**
 * Exact 16-row truth table from Manual Pages 2-3:
 * Key format: `${hasRed ? 1 : 0}${hasBlue ? 1 : 0}${hasStar ? 1 : 0}${ledOn ? 1 : 0}`
 */
export const COMPLICATED_WIRE_TABLE: Record<string, ComplicatedWireRule> = {
  '0000': 'C', // Alb simplu, no star, no LED
  '0010': 'C', // Alb simplu, star, no LED
  '0001': 'D', // Alb simplu, no star, LED
  '0011': 'B', // Alb simplu, star, LED
  '1000': 'S', // Roșu (sau Roșu/Alb), no star, no LED
  '1010': 'C', // Roșu (sau Roșu/Alb), star, no LED
  '1001': 'B', // Roșu (sau Roșu/Alb), no star, LED
  '1011': 'B', // Roșu (sau Roșu/Alb), star, LED
  '0100': 'S', // Albastru (sau Albastru/Alb), no star, no LED
  '0110': 'D', // Albastru (sau Albastru/Alb), star, no LED
  '0101': 'P', // Albastru (sau Albastru/Alb), no star, LED
  '0111': 'P', // Albastru (sau Albastru/Alb), star, LED
  '1100': 'S', // Roșu + Albastru, no star, no LED
  '1110': 'P', // Roșu + Albastru, star, no LED
  '1101': 'S', // Roșu + Albastru, no star, LED
  '1111': 'D', // Roșu + Albastru, star, LED
};

export function getComplicatedWireRule(
  hasRed: boolean,
  hasBlue: boolean,
  hasStar: boolean,
  ledOn: boolean
): ComplicatedWireRule {
  const key = `${hasRed ? 1 : 0}${hasBlue ? 1 : 0}${hasStar ? 1 : 0}${ledOn ? 1 : 0}`;
  return COMPLICATED_WIRE_TABLE[key];
}

export function shouldCutComplicatedWire(
  hasRed: boolean,
  hasBlue: boolean,
  hasStar: boolean,
  ledOn: boolean,
  casing: BombCasing
): boolean {
  const rule = getComplicatedWireRule(hasRed, hasBlue, hasStar, ledOn);
  if (rule === 'C') return true;
  if (rule === 'D') return false;
  if (rule === 'S') return casing.lastDigitEven;
  if (rule === 'P') return casing.hasParallelPort;
  return casing.totalBatteries >= 2;
}

const WIRE_COLORS: WireColorType[] = [
  'white',
  'red',
  'blue',
  'red-white',
  'blue-white',
  'red-blue',
];

function colorFlags(color: WireColorType): { hasRed: boolean; hasBlue: boolean } {
  return {
    hasRed: color === 'red' || color === 'red-white' || color === 'red-blue',
    hasBlue: color === 'blue' || color === 'blue-white' || color === 'red-blue',
  };
}

export function createComplicatedWiresState(
  casing: BombCasing,
  rng: () => number = Math.random
): ComplicatedWiresState {
  for (let attempt = 0; attempt < 40; attempt++) {
    const wires: ComplicatedWireItem[] = [];
    for (let i = 0; i < 6; i++) {
      const color = WIRE_COLORS[Math.floor(rng() * WIRE_COLORS.length)];
      const { hasRed, hasBlue } = colorFlags(color);
      const hasStar = rng() < 0.5;
      const ledOn = rng() < 0.5;
      const shouldCut = shouldCutComplicatedWire(hasRed, hasBlue, hasStar, ledOn, casing);
      wires.push({
        id: i + 1,
        color,
        hasRed,
        hasBlue,
        hasStar,
        ledOn,
        shouldCut,
        cut: false,
      });
    }
    if (wires.some((w) => w.shouldCut)) {
      return { wires };
    }
  }

  // Fallback guaranteed cuttable wire (Alb simplu, no star, no LED -> C)
  return {
    wires: [
      { id: 1, color: 'white', hasRed: false, hasBlue: false, hasStar: false, ledOn: false, shouldCut: true, cut: false },
      { id: 2, color: 'red', hasRed: true, hasBlue: false, hasStar: true, ledOn: false, shouldCut: true, cut: false },
      { id: 3, color: 'blue', hasRed: false, hasBlue: true, hasStar: true, ledOn: false, shouldCut: false, cut: false },
      { id: 4, color: 'red-blue', hasRed: true, hasBlue: true, hasStar: true, ledOn: true, shouldCut: false, cut: false },
      { id: 5, color: 'white', hasRed: false, hasBlue: false, hasStar: false, ledOn: true, shouldCut: false, cut: false },
      { id: 6, color: 'red-white', hasRed: true, hasBlue: false, hasStar: false, ledOn: false, shouldCut: casing.lastDigitEven, cut: false },
    ],
  };
}

export function cutComplicatedWire(
  state: ComplicatedWiresState,
  wireId: number
): { valid: boolean; solved: boolean; nextState: ComplicatedWiresState } {
  const target = state.wires.find((w) => w.id === wireId);
  if (!target || target.cut) {
    return { valid: true, solved: false, nextState: state };
  }

  if (!target.shouldCut) {
    return {
      valid: false,
      solved: false,
      nextState: state,
    };
  }

  const nextWires = state.wires.map((w) => (w.id === wireId ? { ...w, cut: true } : w));
  const solved = nextWires.every((w) => !w.shouldCut || w.cut);

  return {
    valid: true,
    solved,
    nextState: { wires: nextWires },
  };
}
