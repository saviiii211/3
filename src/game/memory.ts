import type { MemoryPressRecord, MemoryState } from './types';

function shuffleButtons(rng: () => number): [1 | 2 | 3 | 4, 1 | 2 | 3 | 4, 1 | 2 | 3 | 4, 1 | 2 | 3 | 4] {
  const arr: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return [arr[0], arr[1], arr[2], arr[3]];
}

export function createMemoryStage(
  stage: 1 | 2 | 3 | 4 | 5,
  history: MemoryPressRecord[],
  rng: () => number = Math.random
): MemoryState {
  const display = (Math.floor(rng() * 4) + 1) as 1 | 2 | 3 | 4;
  return {
    stage,
    display,
    buttons: shuffleButtons(rng),
    history,
  };
}

export function createInitialMemoryState(rng: () => number = Math.random): MemoryState {
  return createMemoryStage(1, [], rng);
}

/**
 * Exact Memory rules from Manual Page 2.
 * Returns the 1-based position (1..4) of the button that MUST be pressed.
 */
export function getExpectedMemoryPosition(state: MemoryState): 1 | 2 | 3 | 4 {
  const { stage, display, buttons, history } = state;

  const positionOfLabel = (label: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 => {
    const idx = buttons.indexOf(label);
    return ((idx >= 0 ? idx : 0) + 1) as 1 | 2 | 3 | 4;
  };

  if (stage === 1) {
    if (display === 1) return 2;
    if (display === 2) return 2;
    if (display === 3) return 3;
    return 4;
  }

  if (stage === 2) {
    if (display === 1) return positionOfLabel(4);
    if (display === 2) return history[0].position;
    if (display === 3) return 1;
    return history[0].position;
  }

  if (stage === 3) {
    if (display === 1) return positionOfLabel(history[1].label);
    if (display === 2) return positionOfLabel(history[0].label);
    if (display === 3) return 3;
    return positionOfLabel(4);
  }

  if (stage === 4) {
    if (display === 1) return history[0].position;
    if (display === 2) return 1;
    if (display === 3) return history[1].position;
    return history[1].position;
  }

  // stage === 5
  if (display === 1) return positionOfLabel(history[0].label);
  if (display === 2) return positionOfLabel(history[1].label);
  if (display === 3) return positionOfLabel(history[3].label);
  return positionOfLabel(history[2].label);
}

export function pressMemoryButton(
  state: MemoryState,
  position: 1 | 2 | 3 | 4,
  rng: () => number = Math.random
): { correct: boolean; solved: boolean; nextState: MemoryState } {
  const expectedPos = getExpectedMemoryPosition(state);
  if (position !== expectedPos) {
    return {
      correct: false,
      solved: false,
      nextState: createInitialMemoryState(rng),
    };
  }

  const label = state.buttons[position - 1];
  const nextHistory: MemoryPressRecord[] = [...state.history, { position, label }];

  if (state.stage === 5) {
    return {
      correct: true,
      solved: true,
      nextState: {
        ...state,
        history: nextHistory,
      },
    };
  }

  const nextStage = (state.stage + 1) as 2 | 3 | 4 | 5;
  return {
    correct: true,
    solved: false,
    nextState: createMemoryStage(nextStage, nextHistory, rng),
  };
}
