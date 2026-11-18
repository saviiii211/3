import type { SeqTerminal, SeqWireColor, SequenceWire, WireSequencesState } from './types';

/**
 * Exact cumulative occurrence tables (1..9) from Manual Page 5.
 */
export const WIRE_SEQUENCE_RULES: Record<SeqWireColor, SeqTerminal[][]> = {
  red: [
    ['C'],           // 1
    ['B'],           // 2
    ['A'],           // 3
    ['A', 'C'],      // 4
    ['B'],           // 5
    ['A', 'C'],      // 6
    ['A', 'B', 'C'], // 7
    ['A', 'B'],      // 8
    ['B'],           // 9
  ],
  blue: [
    ['B'],           // 1
    ['A', 'C'],      // 2
    ['B'],           // 3
    ['A'],           // 4
    ['B'],           // 5
    ['B', 'C'],      // 6
    ['C'],           // 7
    ['A', 'C'],      // 8
    ['A'],           // 9
  ],
  black: [
    ['A', 'B', 'C'], // 1
    ['A', 'C'],      // 2
    ['B'],           // 3
    ['A', 'C'],      // 4
    ['B'],           // 5
    ['B', 'C'],      // 6
    ['A', 'B'],      // 7
    ['C'],           // 8
    ['C'],           // 9
  ],
};

export function shouldCutSequenceWire(
  color: SeqWireColor,
  occurrence: number,
  target: SeqTerminal
): boolean {
  const table = WIRE_SEQUENCE_RULES[color];
  const row = table[occurrence - 1];
  if (!row) return false;
  return row.includes(target);
}

const COLORS: SeqWireColor[] = ['red', 'blue', 'black'];
const TERMINALS: SeqTerminal[] = ['A', 'B', 'C'];

export function createWireSequencesState(rng: () => number = Math.random): WireSequencesState {
  for (let attempt = 0; attempt < 30; attempt++) {
    const counts: Record<SeqWireColor, number> = { red: 0, blue: 0, black: 0 };
    const panels: SequenceWire[][] = [];
    let wireId = 1;
    let labelCounter = 1;

    for (let p = 0; p < 4; p++) {
      const wireCount = Math.floor(rng() * 3) + 1; // 1..3 wires per panel
      const panelWires: SequenceWire[] = [];

      // Choose distinct slot indices from [1, 2, 3]
      const slots: Array<1 | 2 | 3> = [1, 2, 3];
      for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
      }
      const chosenSlots = slots.slice(0, wireCount).sort((a, b) => a - b);

      for (let w = 0; w < wireCount; w++) {
        // Pick a color with occurrence < 9
        const availableColors = COLORS.filter((c) => counts[c] < 9);
        const color = availableColors[Math.floor(rng() * availableColors.length)];
        counts[color] += 1;
        const occurrence = counts[color];
        const target = TERMINALS[Math.floor(rng() * TERMINALS.length)];
        const shouldCut = shouldCutSequenceWire(color, occurrence, target);

        panelWires.push({
          id: wireId++,
          panelIndex: p,
          labelNumber: labelCounter++,
          slotIndex: chosenSlots[w],
          color,
          target,
          occurrence,
          shouldCut,
          cut: false,
        });
      }
      panels.push(panelWires);
    }

    const totalToCut = panels.flat().filter((w) => w.shouldCut).length;
    if (totalToCut >= 2) {
      return {
        currentPanel: 0,
        panels,
      };
    }
  }

  // Deterministic safe fallback
  return {
    currentPanel: 0,
    panels: [
      [
        { id: 1, panelIndex: 0, labelNumber: 1, slotIndex: 1, color: 'red', target: 'C', occurrence: 1, shouldCut: true, cut: false },
        { id: 2, panelIndex: 0, labelNumber: 2, slotIndex: 2, color: 'blue', target: 'A', occurrence: 1, shouldCut: false, cut: false },
      ],
      [
        { id: 3, panelIndex: 1, labelNumber: 3, slotIndex: 1, color: 'black', target: 'B', occurrence: 1, shouldCut: true, cut: false },
      ],
      [
        { id: 4, panelIndex: 2, labelNumber: 4, slotIndex: 2, color: 'red', target: 'B', occurrence: 2, shouldCut: true, cut: false },
      ],
      [
        { id: 5, panelIndex: 3, labelNumber: 5, slotIndex: 3, color: 'blue', target: 'C', occurrence: 2, shouldCut: true, cut: false },
      ],
    ],
  };
}

export function canAdvanceSequencePanel(state: WireSequencesState): boolean {
  const panel = state.panels[state.currentPanel] ?? [];
  return panel.every((w) => !w.shouldCut || w.cut);
}

export function cutSequenceWire(
  state: WireSequencesState,
  wireId: number
): { valid: boolean; solved: boolean; nextState: WireSequencesState } {
  const panel = state.panels[state.currentPanel] ?? [];
  const target = panel.find((w) => w.id === wireId);
  if (!target || target.cut) {
    return { valid: true, solved: false, nextState: state };
  }

  if (!target.shouldCut) {
    return { valid: false, solved: false, nextState: state };
  }

  const nextPanels = state.panels.map((p, idx) =>
    idx === state.currentPanel
      ? p.map((w) => (w.id === wireId ? { ...w, cut: true } : w))
      : p
  );

  const nextState: WireSequencesState = {
    ...state,
    panels: nextPanels,
  };

  // Module solves when all required wires across all 4 panels are cut AND user is on panel 4 (or advances through panel 4)
  const allSolved = nextPanels.flat().every((w) => !w.shouldCut || w.cut);
  const solved = state.currentPanel === 3 && allSolved;

  return {
    valid: true,
    solved,
    nextState,
  };
}

export function navigateSequencePanel(
  state: WireSequencesState,
  direction: 'up' | 'down'
): { blocked: boolean; solved: boolean; nextState: WireSequencesState } {
  if (direction === 'up') {
    if (state.currentPanel === 0) {
      return { blocked: false, solved: false, nextState: state };
    }
    return {
      blocked: false,
      solved: false,
      nextState: { ...state, currentPanel: state.currentPanel - 1 },
    };
  }

  // Moving down (to next panel)
  if (!canAdvanceSequencePanel(state)) {
    return { blocked: true, solved: false, nextState: state };
  }

  if (state.currentPanel === 3) {
    return { blocked: false, solved: true, nextState: state };
  }

  return {
    blocked: false,
    solved: false,
    nextState: { ...state, currentPanel: state.currentPanel + 1 },
  };
}
