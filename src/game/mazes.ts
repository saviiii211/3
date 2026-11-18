import type { MazeCoord, MazeState } from './types';

export interface MazeMapDef {
  id: number;
  markers: [MazeCoord, MazeCoord];
  /**
   * Blocked passages encoded as "c1,r1-c2,r2" (bidirectional check uses canonical order).
   * Coordinates are 1-based: col (1..6), row (1..6) from top-left.
   */
  walls: Set<string>;
}

function edgeKey(a: MazeCoord, b: MazeCoord): string {
  if (a.row < b.row || (a.row === b.row && a.col < b.col)) {
    return `${a.col},${a.row}-${b.col},${b.row}`;
  }
  return `${b.col},${b.row}-${a.col},${a.row}`;
}

/**
 * Helper to build wall set from right-walls (between (c,r) and (c+1,r))
 * and bottom-walls (between (c,r) and (c,r+1)).
 */
function buildWalls(rightWalls: Array<[number, number]>, bottomWalls: Array<[number, number]>): Set<string> {
  const set = new Set<string>();
  for (const [c, r] of rightWalls) {
    set.add(edgeKey({ col: c, row: r }, { col: c + 1, row: r }));
  }
  for (const [c, r] of bottomWalls) {
    set.add(edgeKey({ col: c, row: r }, { col: c, row: r + 1 }));
  }
  return set;
}

/**
 * All 9 Mazes verified pixel-by-pixel against Manual Page 6 (`page6_mazes.png`).
 */
export const MAZES: MazeMapDef[] = [
  // Harta 1 • ◎ (1,2) & (6,3)
  {
    id: 1,
    markers: [{ col: 1, row: 2 }, { col: 6, row: 3 }],
    walls: buildWalls(
      [
        [3, 1],
        [1, 2], [3, 2],
        [1, 3], [3, 3],
        [1, 4], [4, 4],
        [3, 5], [5, 5],
        [2, 6],
      ],
      [
        [2, 1], [5, 1], [6, 1],
        [3, 2], [4, 2], [5, 2],
        [2, 3], [4, 3],
        [2, 4], [3, 4], [4, 4],
        [2, 5], [4, 5], [5, 5],
      ]
    ),
  },
  // Harta 2 • ◎ (5,2) & (2,4)
  {
    id: 2,
    markers: [{ col: 5, row: 2 }, { col: 2, row: 4 }],
    walls: buildWalls(
      [
        [2, 2], [4, 2],
        [1, 3], [3, 3], [5, 3],
        [1, 4], [2, 4], [4, 4],
        [1, 5], [3, 5],
        [1, 6],
      ],
      [
        [2, 1], [3, 1], [5, 1], [6, 1],
        [2, 2], [4, 2], [5, 2],
        [2, 3], [5, 3],
        [4, 4],
        [5, 5],
      ]
    ),
  },
  // Harta 3 • ◎ (4,4) & (6,4)
  {
    id: 3,
    markers: [{ col: 4, row: 4 }, { col: 6, row: 4 }],
    walls: buildWalls(
      [
        [3, 1], [4, 1],
        [1, 2], [2, 2], [4, 2], [5, 2],
        [2, 3], [3, 3], [5, 3],
        [1, 4], [2, 4], [3, 4], [4, 4], [5, 4],
        [1, 5], [3, 5], [4, 5], [5, 5],
        [4, 6],
      ],
      [
        [2, 1],
        [1, 2], [4, 2], [5, 2],
        [2, 5], [3, 5],
      ]
    ),
  },
  // Harta 4 • ◎ (1,1) & (1,4)
  {
    id: 4,
    markers: [{ col: 1, row: 1 }, { col: 1, row: 4 }],
    walls: buildWalls(
      [
        [2, 1],
        [1, 2], [2, 2],
        [1, 3], [3, 3], [5, 3],
        [1, 4],
        [1, 5], [5, 5],
        [3, 6],
      ],
      [
        [3, 1], [4, 1], [5, 1],
        [4, 2], [5, 2],
        [2, 3], [3, 3], [5, 3],
        [2, 4], [3, 4], [4, 4], [5, 4],
        [2, 5], [3, 5],
      ]
    ),
  },
  // Harta 5 • ◎ (5,3) & (4,6)
  {
    id: 5,
    markers: [{ col: 5, row: 3 }, { col: 4, row: 6 }],
    walls: buildWalls(
      [
        [5, 2],
        [2, 3], [4, 3],
        [1, 4], [4, 4], [5, 4],
        [1, 5], [5, 5],
      ],
      [
        [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [3, 2], [4, 2], [6, 2],
        [3, 3], [5, 3],
        [2, 4], [3, 4], [4, 4], [5, 4],
        [2, 5], [3, 5], [4, 5],
      ]
    ),
  },
  // Harta 6 • ◎ (5,1) & (3,5)
  {
    id: 6,
    markers: [{ col: 5, row: 1 }, { col: 3, row: 5 }],
    walls: buildWalls(
      [
        [1, 1], [3, 1],
        [1, 2], [2, 2], [3, 2], [5, 2],
        [2, 3], [4, 3],
        [2, 4], [4, 4],
        [1, 5], [4, 5],
        [4, 6],
      ],
      [
        [4, 1], [5, 1],
        [5, 2],
        [2, 3], [3, 3], [6, 3],
        [1, 4], [3, 4],
        [5, 5],
      ]
    ),
  },
  // Harta 7 • ◎ (2,1) & (2,6)
  {
    id: 7,
    markers: [{ col: 2, row: 1 }, { col: 2, row: 6 }],
    walls: buildWalls(
      [
        [4, 1],
        [1, 2], [3, 2], [5, 2],
        [2, 3], [4, 3],
        [2, 4], [5, 4],
        [1, 5], [5, 5],
      ],
      [
        [2, 1], [3, 1],
        [3, 2], [4, 2], [5, 2],
        [1, 3], [2, 3], [4, 3], [5, 3],
        [4, 4], [5, 4],
        [2, 5], [3, 5], [4, 5],
      ]
    ),
  },
  // Harta 8 • ◎ (4,1) & (3,4)
  {
    id: 8,
    markers: [{ col: 4, row: 1 }, { col: 3, row: 4 }],
    walls: buildWalls(
      [
        [1, 1], [4, 1],
        [3, 2],
        [1, 3], [5, 3],
        [1, 4], [3, 4],
        [1, 5], [2, 5],
      ],
      [
        [3, 1],
        [2, 2], [3, 2], [4, 2], [5, 2],
        [3, 3], [4, 3],
        [1, 4], [3, 4], [4, 4], [5, 4], [6, 4],
        [3, 5], [4, 5], [5, 5],
      ]
    ),
  },
  // Harta 9 • ◎ (3,2) & (1,5)
  {
    id: 9,
    markers: [{ col: 3, row: 2 }, { col: 1, row: 5 }],
    walls: buildWalls(
      [
        [1, 1],
        [1, 2], [2, 2], [4, 2],
        [3, 3], [5, 3],
        [1, 4], [2, 4], [4, 4],
        [1, 5], [2, 5], [3, 5], [5, 5],
        [2, 6], [4, 6],
      ],
      [
        [3, 1], [4, 1],
        [4, 2], [5, 2],
        [2, 3], [3, 3], [5, 3],
        [4, 4], [5, 4],
        [6, 5],
      ]
    ),
  },
];

export type MazeDirection = 'up' | 'down' | 'left' | 'right';

export function getMazeById(mapId: number): MazeMapDef {
  return MAZES.find((m) => m.id === mapId) ?? MAZES[0];
}

export function canMoveInMaze(mapId: number, from: MazeCoord, dir: MazeDirection): {
  inBounds: boolean;
  hitWall: boolean;
  next: MazeCoord;
} {
  const delta: Record<MazeDirection, { dc: number; dr: number }> = {
    up: { dc: 0, dr: -1 },
    down: { dc: 0, dr: 1 },
    left: { dc: -1, dr: 0 },
    right: { dc: 1, dr: 0 },
  };
  const next: MazeCoord = {
    col: from.col + delta[dir].dc,
    row: from.row + delta[dir].dr,
  };

  if (next.col < 1 || next.col > 6 || next.row < 1 || next.row > 6) {
    return { inBounds: false, hitWall: true, next: from };
  }

  const maze = getMazeById(mapId);
  if (maze.walls.has(edgeKey(from, next))) {
    return { inBounds: true, hitWall: true, next: from };
  }

  return { inBounds: true, hitWall: false, next };
}

export function findMazeShortestPath(mapId: number, start: MazeCoord, goal: MazeCoord): MazeDirection[] | null {
  const queue: Array<{ pos: MazeCoord; path: MazeDirection[] }> = [{ pos: start, path: [] }];
  const visited = new Set<string>([`${start.col},${start.row}`]);
  const dirs: MazeDirection[] = ['up', 'down', 'left', 'right'];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.pos.col === goal.col && current.pos.row === goal.row) {
      return current.path;
    }
    for (const d of dirs) {
      const res = canMoveInMaze(mapId, current.pos, d);
      if (!res.hitWall) {
        const key = `${res.next.col},${res.next.row}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ pos: res.next, path: [...current.path, d] });
        }
      }
    }
  }
  return null;
}

export function createMazeState(rng: () => number = Math.random): MazeState {
  const maze = MAZES[Math.floor(rng() * MAZES.length)];

  for (let attempt = 0; attempt < 200; attempt++) {
    const player: MazeCoord = {
      col: Math.floor(rng() * 6) + 1,
      row: Math.floor(rng() * 6) + 1,
    };
    const goal: MazeCoord = {
      col: Math.floor(rng() * 6) + 1,
      row: Math.floor(rng() * 6) + 1,
    };
    const dist = Math.abs(goal.col - player.col) + Math.abs(goal.row - player.row);
    if (dist < 4) continue;
    const path = findMazeShortestPath(maze.id, player, goal);
    if (path && path.length >= 5) {
      return {
        mapId: maze.id,
        markers: maze.markers,
        player,
        goal,
      };
    }
  }

  // Deterministic guaranteed fallback on Maze 1
  return {
    mapId: 1,
    markers: MAZES[0].markers,
    player: { col: 1, row: 1 },
    goal: { col: 6, row: 6 },
  };
}

export function moveMazePlayer(
  state: MazeState,
  dir: MazeDirection
): { hitWall: boolean; solved: boolean; nextState: MazeState } {
  const res = canMoveInMaze(state.mapId, state.player, dir);
  if (res.hitWall) {
    return { hitWall: true, solved: false, nextState: state };
  }

  const solved = res.next.col === state.goal.col && res.next.row === state.goal.row;
  return {
    hitWall: false,
    solved,
    nextState: {
      ...state,
      player: res.next,
    },
  };
}
