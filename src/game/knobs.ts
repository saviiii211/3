import type { KnobDirection, KnobsState } from './types';

export interface KnobConfigPattern {
  id: string;
  direction: KnobDirection;
  variant: 'A' | 'B';
  leds: number[]; // 12 bits (row 1: 0..5, row 2: 6..11)
}

/**
 * Exact LED configurations from Manual Page 7.
 * Configurația A patterns are 100% crisp and unambiguous in the printed manual.
 * Configurația B entries are also included for completeness.
 */
export const KNOB_CONFIGS: KnobConfigPattern[] = [
  // Configurația A (6 stânga / 6 dreapta -> Row 1 + Row 2)
  { id: 'UP_A', direction: 'UP', variant: 'A', leds: [0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1] },
  { id: 'DOWN_A', direction: 'DOWN', variant: 'A', leds: [0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1] },
  { id: 'LEFT_A', direction: 'LEFT', variant: 'A', leds: [0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0] },
  { id: 'RIGHT_A', direction: 'RIGHT', variant: 'A', leds: [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0] },
  // Configurația B
  { id: 'UP_B', direction: 'UP', variant: 'B', leds: [1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1] },
  { id: 'DOWN_B', direction: 'DOWN', variant: 'B', leds: [1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1] },
  { id: 'LEFT_B', direction: 'LEFT', variant: 'B', leds: [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0] },
  { id: 'RIGHT_B', direction: 'RIGHT', variant: 'B', leds: [1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0] },
];

export const DIRECTIONS_CW: KnobDirection[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

export function directionToDegrees(dir: KnobDirection): number {
  switch (dir) {
    case 'UP':
      return 0;
    case 'RIGHT':
      return 90;
    case 'DOWN':
      return 180;
    case 'LEFT':
      return 270;
  }
}

export function rotateClockwise(dir: KnobDirection): KnobDirection {
  const idx = DIRECTIONS_CW.indexOf(dir);
  return DIRECTIONS_CW[(idx + 1) % 4];
}

/**
 * Given where the "UP" label sits (`upSide`) and the relative target direction (`expectedRelative`),
 * computes which world direction the dial pointer must face.
 */
export function getExpectedWorldDirection(
  upSide: KnobDirection,
  expectedRelative: KnobDirection
): KnobDirection {
  const upIdx = DIRECTIONS_CW.indexOf(upSide);
  const relIdx = DIRECTIONS_CW.indexOf(expectedRelative);
  return DIRECTIONS_CW[(upIdx + relIdx) % 4];
}

export function isKnobAlignedCorrectly(state: KnobsState): boolean {
  const expectedWorld = getExpectedWorldDirection(state.upSide, state.expectedRelative);
  return state.dialFacing === expectedWorld;
}

export function createKnobsState(rng: () => number = Math.random): KnobsState {
  // Use Config A patterns so the printed PDF manual is 100% unambiguous on all 12 LEDs
  const pool = KNOB_CONFIGS.filter((c) => c.variant === 'A');
  const chosen = pool[Math.floor(rng() * pool.length)];
  const upSide = DIRECTIONS_CW[Math.floor(rng() * DIRECTIONS_CW.length)];
  const expectedWorld = getExpectedWorldDirection(upSide, chosen.direction);

  // Start dial facing a wrong direction so user must actually rotate it
  const wrongChoices = DIRECTIONS_CW.filter((d) => d !== expectedWorld);
  const dialFacing = wrongChoices[Math.floor(rng() * wrongChoices.length)];

  return {
    upSide,
    dialFacing,
    leds: [...chosen.leds],
    expectedRelative: chosen.direction,
    secondsLeft: 45,
  };
}
