import type { WhosOnFirstState } from './types';

/**
 * Step 1: Display word -> 0-based button index in the 3x2 grid:
 * 0: Stânga - Sus, 1: Dreapta - Sus
 * 2: Stânga - Mijloc, 3: Dreapta - Mijloc
 * 4: Stânga - Jos, 5: Dreapta - Jos
 * All 28 variants from Manual Page 3.
 */
export const DISPLAY_TO_BUTTON_INDEX: Record<string, number> = {
  UR: 0,
  FIRST: 1,
  OKAY: 1,
  C: 1,
  YES: 2,
  NOTHING: 2,
  LED: 2,
  'THEY ARE': 2,
  BLANK: 3,
  READ: 3,
  RED: 3,
  YOU: 3,
  YOUR: 3,
  "YOU'RE": 3,
  THEIR: 3,
  '': 4, // [ECRAN GOL / NIMIC]
  REED: 4,
  LEED: 4,
  "THEY'RE": 4,
  DISPLAY: 5,
  SAYS: 5,
  NO: 5,
  LEAD: 5,
  'HOLD ON': 5,
  'YOU ARE': 5,
  THERE: 5,
  SEE: 5,
  CEE: 5,
};

/**
 * Step 2: All 28 priority lists from Manual Pages 3-5.
 */
export const PRIORITY_LISTS: Record<string, string[]> = {
  READY: ['YES', 'OKAY', 'WHAT', 'MIDDLE', 'LEFT', 'PRESS', 'RIGHT', 'BLANK', 'READY', 'NO', 'FIRST', 'UHHH', 'NOTHING', 'WAIT'],
  FIRST: ['LEFT', 'OKAY', 'YES', 'MIDDLE', 'NO', 'RIGHT', 'NOTHING', 'UHHH', 'WAIT', 'READY', 'BLANK', 'WHAT', 'PRESS', 'FIRST'],
  NO: ['BLANK', 'UHHH', 'WAIT', 'FIRST', 'WHAT', 'READY', 'RIGHT', 'YES', 'NOTHING', 'LEFT', 'PRESS', 'OKAY', 'NO', 'MIDDLE'],
  BLANK: ['WAIT', 'RIGHT', 'OKAY', 'MIDDLE', 'BLANK', 'PRESS', 'READY', 'NOTHING', 'NO', 'WHAT', 'LEFT', 'UHHH', 'YES', 'FIRST'],
  NOTHING: ['UHHH', 'RIGHT', 'OKAY', 'MIDDLE', 'YES', 'BLANK', 'NO', 'PRESS', 'LEFT', 'WHAT', 'WAIT', 'FIRST', 'NOTHING', 'READY'],
  YES: ['OKAY', 'RIGHT', 'UHHH', 'MIDDLE', 'FIRST', 'WHAT', 'PRESS', 'READY', 'NOTHING', 'YES', 'LEFT', 'BLANK', 'NO', 'WAIT'],
  WHAT: ['UHHH', 'WHAT', 'LEFT', 'NOTHING', 'READY', 'BLANK', 'MIDDLE', 'NO', 'OKAY', 'FIRST', 'WAIT', 'YES', 'PRESS', 'RIGHT'],
  UHHH: ['READY', 'NOTHING', 'LEFT', 'WHAT', 'OKAY', 'YES', 'RIGHT', 'NO', 'PRESS', 'BLANK', 'UHHH', 'MIDDLE', 'WAIT', 'FIRST'],
  LEFT: ['RIGHT', 'LEFT', 'FIRST', 'NO', 'MIDDLE', 'YES', 'BLANK', 'WHAT', 'UHHH', 'WAIT', 'PRESS', 'READY', 'OKAY', 'NOTHING'],
  RIGHT: ['YES', 'NOTHING', 'READY', 'PRESS', 'NO', 'WAIT', 'WHAT', 'RIGHT', 'MIDDLE', 'LEFT', 'UHHH', 'BLANK', 'OKAY', 'FIRST'],
  MIDDLE: ['BLANK', 'READY', 'OKAY', 'WHAT', 'NOTHING', 'PRESS', 'NO', 'WAIT', 'LEFT', 'MIDDLE', 'RIGHT', 'FIRST', 'UHHH', 'YES'],
  OKAY: ['MIDDLE', 'NO', 'FIRST', 'YES', 'UHHH', 'NOTHING', 'WAIT', 'OKAY', 'LEFT', 'READY', 'BLANK', 'PRESS', 'WHAT', 'RIGHT'],
  WAIT: ['UHHH', 'NO', 'BLANK', 'OKAY', 'YES', 'LEFT', 'FIRST', 'PRESS', 'WHAT', 'WAIT', 'NOTHING', 'READY', 'RIGHT', 'MIDDLE'],
  PRESS: ['RIGHT', 'MIDDLE', 'YES', 'READY', 'PRESS', 'OKAY', 'NOTHING', 'UHHH', 'BLANK', 'LEFT', 'FIRST', 'WHAT', 'NO', 'WAIT'],
  YOU: ['SURE', 'YOU ARE', 'YOUR', "YOU'RE", 'NEXT', 'UH HUH', 'UR', 'HOLD', 'WHAT?', 'YOU', 'UH UH', 'LIKE', 'DONE', 'U'],
  'YOU ARE': ['YOUR', 'NEXT', 'LIKE', 'UH HUH', 'WHAT?', 'DONE', 'UH UH', 'HOLD', 'YOU', 'U', "YOU'RE", 'SURE', 'UR', 'YOU ARE'],
  YOUR: ['UH UH', 'YOU ARE', 'UH HUH', 'YOUR', 'NEXT', 'UR', 'SURE', 'U', "YOU'RE", 'YOU', 'WHAT?', 'HOLD', 'LIKE', 'DONE'],
  "YOU'RE": ['YOU', "YOU'RE", 'UR', 'NEXT', 'UH UH', 'YOU ARE', 'U', 'YOUR', 'WHAT?', 'UH HUH', 'SURE', 'DONE', 'LIKE', 'HOLD'],
  UR: ['DONE', 'U', 'UR', 'UH HUH', 'WHAT?', 'SURE', 'YOUR', 'HOLD', "YOU'RE", 'LIKE', 'NEXT', 'UH UH', 'YOU ARE', 'YOU'],
  U: ['UH HUH', 'SURE', 'NEXT', 'WHAT?', "YOU'RE", 'UR', 'UH UH', 'DONE', 'U', 'YOU', 'LIKE', 'HOLD', 'YOU ARE', 'YOUR'],
  'UH HUH': ['UH HUH', 'YOUR', 'YOU ARE', 'YOU', 'DONE', 'HOLD', 'UH UH', 'NEXT', 'SURE', 'LIKE', "YOU'RE", 'UR', 'U', 'WHAT?'],
  'UH UH': ['UR', 'U', 'YOU ARE', "YOU'RE", 'NEXT', 'UH UH', 'DONE', 'YOU', 'UH HUH', 'LIKE', 'YOUR', 'SURE', 'HOLD', 'WHAT?'],
  'WHAT?': ['YOU', 'HOLD', "YOU'RE", 'YOUR', 'U', 'DONE', 'UH UH', 'LIKE', 'YOU ARE', 'UH HUH', 'UR', 'NEXT', 'WHAT?', 'SURE'],
  DONE: ['SURE', 'UH HUH', 'NEXT', 'WHAT?', 'YOUR', 'UR', "YOU'RE", 'HOLD', 'LIKE', 'YOU', 'U', 'YOU ARE', 'UH UH', 'DONE'],
  NEXT: ['WHAT?', 'UH HUH', 'UH UH', 'YOUR', 'HOLD', 'SURE', 'NEXT', 'LIKE', 'DONE', 'YOU ARE', 'UR', "YOU'RE", 'U', 'YOU'],
  HOLD: ['YOU ARE', 'U', 'DONE', 'UH UH', 'YOU', 'UR', 'SURE', 'WHAT?', "YOU'RE", 'NEXT', 'HOLD', 'UH HUH', 'YOUR', 'LIKE'],
  SURE: ['YOU ARE', 'DONE', 'LIKE', "YOU'RE", 'YOU', 'HOLD', 'UH HUH', 'UR', 'SURE', 'U', 'WHAT?', 'NEXT', 'YOUR', 'UH UH'],
  LIKE: ["YOU'RE", 'NEXT', 'U', 'UR', 'HOLD', 'DONE', 'UH UH', 'WHAT?', 'UH HUH', 'YOU', 'LIKE', 'SURE', 'YOU ARE', 'YOUR'],
};

const DISPLAY_WORDS = Object.keys(DISPLAY_TO_BUTTON_INDEX);
const BUTTON_LABELS = Object.keys(PRIORITY_LISTS);
const GROUP_A = ['READY', 'FIRST', 'NO', 'BLANK', 'NOTHING', 'YES', 'WHAT', 'UHHH', 'LEFT', 'RIGHT', 'MIDDLE', 'OKAY', 'WAIT', 'PRESS'];
const GROUP_B = ['YOU', 'YOU ARE', 'YOUR', "YOU'RE", 'UR', 'U', 'UH HUH', 'UH UH', 'WHAT?', 'DONE', 'NEXT', 'HOLD', 'SURE', 'LIKE'];

function pickShuffled<T>(arr: T[], count: number, rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export function resolveWhosOnFirstExpectedIndex(
  displayWord: string,
  buttons: [string, string, string, string, string, string]
): number {
  const readIdx = DISPLAY_TO_BUTTON_INDEX[displayWord];
  if (readIdx === undefined) return -1;
  const readLabel = buttons[readIdx];
  const priority = PRIORITY_LISTS[readLabel];
  if (!priority) return -1;
  for (const candidate of priority) {
    const found = buttons.indexOf(candidate);
    if (found !== -1) return found;
  }
  return -1;
}

export function createWhosOnFirstRound(
  round: 1 | 2 | 3,
  rng: () => number = Math.random
): WhosOnFirstState {
  for (let attempt = 0; attempt < 50; attempt++) {
    const displayWord = DISPLAY_WORDS[Math.floor(rng() * DISPLAY_WORDS.length)];
    // Choose buttons mostly from same group (or mixed) so a valid priority match always exists
    const useGroupA = rng() < 0.5;
    const pool = useGroupA ? GROUP_A : GROUP_B;
    const picked = pickShuffled(pool, 6, rng);
    const buttons: [string, string, string, string, string, string] = [
      picked[0],
      picked[1],
      picked[2],
      picked[3],
      picked[4],
      picked[5],
    ];
    const expectedIndex = resolveWhosOnFirstExpectedIndex(displayWord, buttons);
    if (expectedIndex !== -1) {
      return {
        round,
        displayWord,
        buttons,
        expectedIndex,
      };
    }
  }

  // Deterministic fallback
  const buttons: [string, string, string, string, string, string] = [
    BUTTON_LABELS[0],
    BUTTON_LABELS[1],
    BUTTON_LABELS[2],
    BUTTON_LABELS[3],
    BUTTON_LABELS[4],
    BUTTON_LABELS[5],
  ];
  return {
    round,
    displayWord: 'YES',
    buttons,
    expectedIndex: resolveWhosOnFirstExpectedIndex('YES', buttons),
  };
}

export function pressWhosOnFirstButton(
  state: WhosOnFirstState,
  buttonIndex: number,
  rng: () => number = Math.random
): { correct: boolean; solved: boolean; nextState: WhosOnFirstState } {
  const expected = resolveWhosOnFirstExpectedIndex(state.displayWord, state.buttons);
  if (buttonIndex !== expected) {
    return {
      correct: false,
      solved: false,
      nextState: createWhosOnFirstRound(state.round, rng),
    };
  }

  if (state.round === 3) {
    return {
      correct: true,
      solved: true,
      nextState: state,
    };
  }

  return {
    correct: true,
    solved: false,
    nextState: createWhosOnFirstRound((state.round + 1) as 2 | 3, rng),
  };
}
