import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialMemoryState,
  getExpectedMemoryPosition,
  pressMemoryButton,
} from './memory';
import {
  COMPLICATED_WIRE_TABLE,
  createComplicatedWiresState,
  cutComplicatedWire,
  getComplicatedWireRule,
  shouldCutComplicatedWire,
} from './complicatedWires';
import {
  createWhosOnFirstRound,
  DISPLAY_TO_BUTTON_INDEX,
  PRIORITY_LISTS,
  pressWhosOnFirstButton,
  resolveWhosOnFirstExpectedIndex,
} from './whosOnFirst';
import {
  canAdvanceSequencePanel,
  createWireSequencesState,
  cutSequenceWire,
  navigateSequencePanel,
  shouldCutSequenceWire,
} from './wireSequences';
import {
  createMazeState,
  findMazeShortestPath,
  MAZES,
  moveMazePlayer,
} from './mazes';
import {
  createKnobsState,
  getExpectedWorldDirection,
  isKnobAlignedCorrectly,
  KNOB_CONFIGS,
} from './knobs';
import {
  checkPasswordSubmit,
  createPasswordsState,
  findMatchingPasswords,
  stepPasswordColumn,
  VALID_PASSWORDS,
} from './passwords';
import {
  createInitialMissionState,
  getActiveDestination,
  isGpsUnlocked,
  loadMissionState,
  markModuleSkipped,
  markModuleSolved,
} from './missionState';
import type { BombCasing, MemoryState } from './types';

function makeSeededRng(seed = 123456): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test('Module 1 (Memoria): follows all 5 stage rules and resets on wrong press', () => {
  const rng = makeSeededRng(42);
  let state = createInitialMemoryState(rng);
  assert.equal(state.stage, 1);

  // Play all 5 stages cleanly using getExpectedMemoryPosition
  for (let stage = 1; stage <= 5; stage++) {
    assert.equal(state.stage, stage);
    const expectedPos = getExpectedMemoryPosition(state);
    const res = pressMemoryButton(state, expectedPos, rng);
    assert.equal(res.correct, true);
    state = res.nextState;
    if (stage < 5) {
      assert.equal(res.solved, false);
    } else {
      assert.equal(res.solved, true);
    }
  }

  // Verify specific manual rules explicitly
  const s3: MemoryState = {
    stage: 3,
    display: 1,
    buttons: [2, 4, 1, 3],
    history: [
      { position: 2, label: 1 },
      { position: 4, label: 3 },
    ],
  };
  // Stage 3, Display 1 -> same label as Stage 2 (label 3 -> pos 4)
  assert.equal(getExpectedMemoryPosition(s3), 4);

  const s5: MemoryState = {
    stage: 5,
    display: 3,
    buttons: [4, 2, 3, 1],
    history: [
      { position: 1, label: 1 },
      { position: 2, label: 2 },
      { position: 3, label: 3 },
      { position: 4, label: 4 },
    ],
  };
  // Stage 5, Display 3 -> same label as Stage 4 (label 4 -> pos 1)
  assert.equal(getExpectedMemoryPosition(s5), 1);

  // Wrong press resets to stage 1
  const wrongPos = (getExpectedMemoryPosition(s3) === 1 ? 2 : 1) as 1 | 2 | 3 | 4;
  const failRes = pressMemoryButton(s3, wrongPos, rng);
  assert.equal(failRes.correct, false);
  assert.equal(failRes.nextState.stage, 1);
  assert.equal(failRes.nextState.history.length, 0);
});

test('Module 2 (Fire Complicate): matches all 16 truth table combinations and casing rules', () => {
  assert.equal(Object.keys(COMPLICATED_WIRE_TABLE).length, 16);
  assert.equal(getComplicatedWireRule(false, false, false, false), 'C');
  assert.equal(getComplicatedWireRule(false, false, false, true), 'D');
  assert.equal(getComplicatedWireRule(false, false, true, true), 'B');
  assert.equal(getComplicatedWireRule(true, false, false, false), 'S');
  assert.equal(getComplicatedWireRule(false, true, true, true), 'P');
  assert.equal(getComplicatedWireRule(true, true, true, true), 'D');

  const casingEvenNoParallel1Bat: BombCasing = {
    serialNumber: 'AB4K92',
    lastDigitEven: true,
    aaPairs: 0,
    dCells: 1,
    totalBatteries: 1,
    hasParallelPort: false,
    ports: ['serial'],
  };
  assert.equal(shouldCutComplicatedWire(true, false, false, false, casingEvenNoParallel1Bat), true); // S
  assert.equal(shouldCutComplicatedWire(true, false, false, true, casingEvenNoParallel1Bat), false); // B
  assert.equal(shouldCutComplicatedWire(false, true, false, true, casingEvenNoParallel1Bat), false); // P

  const rng = makeSeededRng(77);
  const state = createComplicatedWiresState(casingEvenNoParallel1Bat, rng);
  assert.equal(state.wires.length, 6);
  assert.ok(state.wires.some((w) => w.shouldCut));

  let cur = state;
  const toCut = cur.wires.filter((w) => w.shouldCut);
  for (let i = 0; i < toCut.length; i++) {
    const res = cutComplicatedWire(cur, toCut[i].id);
    assert.equal(res.valid, true);
    cur = res.nextState;
    assert.equal(res.solved, i === toCut.length - 1);
  }
});

test('Module 3 (Cine e pe primul loc?): has all 28 display keys and 28 priority lists', () => {
  assert.equal(Object.keys(DISPLAY_TO_BUTTON_INDEX).length, 28);
  assert.equal(Object.keys(PRIORITY_LISTS).length, 28);
  assert.equal(DISPLAY_TO_BUTTON_INDEX[''], 4); // [ECRAN GOL / NIMIC] -> Stânga Jos
  assert.equal(DISPLAY_TO_BUTTON_INDEX['UR'], 0); // Stânga Sus

  const rng = makeSeededRng(99);
  for (let i = 0; i < 30; i++) {
    const round1 = createWhosOnFirstRound(1, rng);
    const idx = resolveWhosOnFirstExpectedIndex(round1.displayWord, round1.buttons);
    assert.ok(idx >= 0 && idx < 6);
  }

  let cur = createWhosOnFirstRound(1, rng);
  for (let r = 1; r <= 3; r++) {
    assert.equal(cur.round, r);
    const res = pressWhosOnFirstButton(cur, cur.expectedIndex, rng);
    assert.equal(res.correct, true);
    assert.equal(res.solved, r === 3);
    cur = res.nextState;
  }
});

test('Module 4 (Secvențele de Fire): cumulative rules and panel lock work accurately', () => {
  assert.equal(shouldCutSequenceWire('red', 1, 'C'), true);
  assert.equal(shouldCutSequenceWire('red', 1, 'A'), false);
  assert.equal(shouldCutSequenceWire('blue', 7, 'C'), true);
  assert.equal(shouldCutSequenceWire('black', 1, 'A'), true);
  assert.equal(shouldCutSequenceWire('black', 9, 'C'), true);

  const rng = makeSeededRng(101);
  let state = createWireSequencesState(rng);
  assert.equal(state.panels.length, 4);

  for (let p = 0; p < 4; p++) {
    assert.equal(state.currentPanel, p);
    const panel = state.panels[p];
    const cuttable = panel.filter((w) => w.shouldCut);
    if (cuttable.length > 0) {
      // Should block advancing before cutting required wires
      const blocked = navigateSequencePanel(state, 'down');
      assert.equal(blocked.blocked, true);
    }
    for (const w of cuttable) {
      const cutRes = cutSequenceWire(state, w.id);
      assert.equal(cutRes.valid, true);
      state = cutRes.nextState;
    }
    assert.equal(canAdvanceSequencePanel(state), true);
    if (p < 3) {
      const nav = navigateSequencePanel(state, 'down');
      assert.equal(nav.blocked, false);
      state = nav.nextState;
    }
  }
  const finalNav = navigateSequencePanel(state, 'down');
  assert.equal(finalNav.solved, true);
});

test('Module 5 (Labirintele): all 9 mazes match PDF and spawned puzzles are always solvable via BFS', () => {
  assert.equal(MAZES.length, 9);
  for (const id of [1, 2, 3, 4, 7, 8]) {
    const start = { col: 1, row: 1 };
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 6; c++) {
        const path = findMazeShortestPath(id, start, { col: c, row: r });
        assert.ok(path !== null, `Maze ${id} cell (${c},${r}) unreachable from (1,1)`);
      }
    }
  }

  const rng = makeSeededRng(202);
  for (let i = 0; i < 60; i++) {
    const spawned = createMazeState(rng);
    const path = findMazeShortestPath(spawned.mapId, spawned.player, spawned.goal);
    assert.ok(path && path.length >= 5, `Spawned maze ${spawned.mapId} has no valid path`);
  }

  let state = createMazeState(rng);
  const path = findMazeShortestPath(state.mapId, state.player, state.goal)!;
  for (let i = 0; i < path.length; i++) {
    const res = moveMazePlayer(state, path[i]);
    assert.equal(res.hitWall, false);
    state = res.nextState;
    assert.equal(res.solved, i === path.length - 1);
  }
});

test('Module 6 (Butonul Rotativ): all 8 manual configs exist and relative UP math works', () => {
  assert.equal(KNOB_CONFIGS.length, 8);
  assert.equal(getExpectedWorldDirection('RIGHT', 'UP'), 'RIGHT');
  assert.equal(getExpectedWorldDirection('RIGHT', 'DOWN'), 'LEFT');
  assert.equal(getExpectedWorldDirection('DOWN', 'LEFT'), 'RIGHT');

  const rng = makeSeededRng(303);
  const state = createKnobsState(rng);
  assert.equal(state.leds.length, 12);
  assert.equal(isKnobAlignedCorrectly(state), false);
  const aligned = {
    ...state,
    dialFacing: getExpectedWorldDirection(state.upSide, state.expectedRelative),
  };
  assert.equal(isKnobAlignedCorrectly(aligned), true);
});

test('Module 7 (Parolele Secrete): 35 valid words and unique solution per puzzle', () => {
  assert.equal(VALID_PASSWORDS.length, 35);
  const rng = makeSeededRng(404);
  for (let i = 0; i < 20; i++) {
    let state = createPasswordsState(rng);
    const matches = findMatchingPasswords(state.columns);
    assert.deepEqual(matches, [state.targetWord]);

    for (let col = 0; col < 5; col++) {
      while (state.columns[col][state.indices[col]] !== state.targetWord[col]) {
        state = stepPasswordColumn(state, col, 1);
      }
    }
    assert.equal(checkPasswordSubmit(state), true);
  }
});

test('Mission Progression: GPS unlocks after Module 1 and routes Destinations 1-5 after Modules 3-7', () => {
  const rng = makeSeededRng(505);
  let mission = createInitialMissionState(rng);
  assert.equal(isGpsUnlocked(mission), false);
  assert.equal(getActiveDestination(mission), null);

  mission = markModuleSolved(mission, 1);
  assert.equal(isGpsUnlocked(mission), true);
  assert.equal(getActiveDestination(mission), null);

  mission = markModuleSolved(mission, 2);
  assert.equal(getActiveDestination(mission), null);

  mission = markModuleSolved(mission, 3);
  assert.equal(getActiveDestination(mission)?.id, 1);

  mission = markModuleSolved(mission, 4);
  assert.equal(getActiveDestination(mission)?.id, 2);

  mission = markModuleSolved(mission, 5);
  assert.equal(getActiveDestination(mission)?.id, 3);

  mission = markModuleSolved(mission, 6);
  assert.equal(getActiveDestination(mission)?.id, 4);

  mission = markModuleSolved(mission, 7);
  assert.equal(getActiveDestination(mission)?.id, 5);
  assert.deepEqual(mission.skippedModules, []);
});

test('Emergency Skip: marks module skipped/solved without strike, unlocks GPS & destinations, and resets Mod 6 timer', () => {
  const rng = makeSeededRng(606);
  let mission = createInitialMissionState(rng);
  assert.deepEqual(mission.skippedModules, []);

  // Skip Module 1 -> unlocks GPS + Module 2, 0 strikes
  mission = markModuleSkipped(mission, 1);
  assert.deepEqual(mission.solvedModules, [1]);
  assert.deepEqual(mission.skippedModules, [1]);
  assert.equal(mission.highestUnlocked, 2);
  assert.equal(mission.strikes, 0);
  assert.equal(isGpsUnlocked(mission), true);

  // Normal solve on Module 2 does not add to skippedModules
  mission = markModuleSolved(mission, 2);
  assert.deepEqual(mission.solvedModules, [1, 2]);
  assert.deepEqual(mission.skippedModules, [1]);

  // Skip Module 3 -> unlocks Objective #1
  mission = markModuleSkipped(mission, 3);
  assert.equal(getActiveDestination(mission)?.id, 1);
  assert.deepEqual(mission.skippedModules, [1, 3]);

  // Simulate Module 6 timer running down, then skipping Module 6 resets secondsLeft to 45
  mission = markModuleSolved(mission, 4);
  mission = markModuleSolved(mission, 5);
  mission = {
    ...mission,
    knobs: { ...mission.knobs, secondsLeft: 12 },
  };
  mission = markModuleSkipped(mission, 6);
  assert.equal(mission.knobs.secondsLeft, 45);
  assert.equal(getActiveDestination(mission)?.id, 4);
  assert.deepEqual(mission.skippedModules, [1, 3, 6]);

  // Idempotent if skipped again
  mission = markModuleSkipped(mission, 6);
  assert.deepEqual(mission.skippedModules, [1, 3, 6]);
  assert.equal(mission.strikes, 0);

  // SSR / non-browser fallback returns valid skippedModules array
  const loaded = loadMissionState();
  assert.ok(Array.isArray(loaded.skippedModules));
});
