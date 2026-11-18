import type { PasswordsState } from './types';

/**
 * All 35 official passwords from Manual Page 7.
 */
export const VALID_PASSWORDS: string[] = [
  'ABOUT', 'AFTER', 'AGAIN', 'BELOW', 'COULD',
  'EVERY', 'FIRST', 'FOUND', 'GREAT', 'HOUSE',
  'LARGE', 'LEARN', 'NEVER', 'OTHER', 'PLACE',
  'PLANT', 'POINT', 'RIGHT', 'SMALL', 'SOUND',
  'SPELL', 'STILL', 'STUDY', 'THEIR', 'THERE',
  'THESE', 'THING', 'THINK', 'THREE', 'WATER',
  'WHERE', 'WHICH', 'WORLD', 'WOULD', 'WRITE',
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function findMatchingPasswords(columns: [string[], string[], string[], string[], string[]]): string[] {
  return VALID_PASSWORDS.filter((word) => {
    for (let i = 0; i < 5; i++) {
      if (!columns[i].includes(word[i])) return false;
    }
    return true;
  });
}

export function createPasswordsState(rng: () => number = Math.random): PasswordsState {
  for (let attempt = 0; attempt < 200; attempt++) {
    const targetWord = VALID_PASSWORDS[Math.floor(rng() * VALID_PASSWORDS.length)];
    const cols: string[][] = [];

    for (let i = 0; i < 5; i++) {
      const requiredLetter = targetWord[i];
      const others = shuffle(
        ALPHABET.filter((ch) => ch !== requiredLetter),
        rng
      ).slice(0, 5);
      cols.push(shuffle([requiredLetter, ...others], rng));
    }

    const columns: [string[], string[], string[], string[], string[]] = [
      cols[0],
      cols[1],
      cols[2],
      cols[3],
      cols[4],
    ];

    const matches = findMatchingPasswords(columns);
    if (matches.length === 1 && matches[0] === targetWord) {
      // Ensure initial displayed word is NOT already the target word
      const indices: [number, number, number, number, number] = [0, 0, 0, 0, 0];
      const initialWord = columns.map((col, idx) => col[indices[idx]]).join('');
      if (initialWord === targetWord) {
        indices[0] = (indices[0] + 1) % 6;
      }
      return {
        targetWord,
        columns,
        indices,
      };
    }
  }

  // Deterministic fallback guaranteed unique ("HOUSE")
  const fallbackCols: [string[], string[], string[], string[], string[]] = [
    ['H', 'J', 'K', 'M', 'Q', 'Z'],
    ['O', 'A', 'I', 'U', 'Y', 'E'],
    ['U', 'B', 'C', 'D', 'F', 'G'],
    ['S', 'K', 'M', 'P', 'V', 'X'],
    ['E', 'B', 'C', 'F', 'G', 'J'],
  ];
  return {
    targetWord: 'HOUSE',
    columns: fallbackCols,
    indices: [1, 2, 1, 2, 1],
  };
}

export function stepPasswordColumn(
  state: PasswordsState,
  colIndex: number,
  delta: 1 | -1
): PasswordsState {
  const nextIndices = [...state.indices] as [number, number, number, number, number];
  nextIndices[colIndex] = (nextIndices[colIndex] + delta + 6) % 6;
  return {
    ...state,
    indices: nextIndices,
  };
}

export function getSelectedPassword(state: PasswordsState): string {
  return state.columns.map((col, idx) => col[state.indices[idx]]).join('');
}

export function checkPasswordSubmit(state: PasswordsState): boolean {
  return getSelectedPassword(state) === state.targetWord;
}
