// TSP Game Logic

import { NODES, ROAD_DEFINITIONS, NODE_COUNT, INF, TSPGameState } from './types';

// Distance and adjacency matrices
const distances: number[][] = Array.from({ length: NODE_COUNT }, () => Array(NODE_COUNT).fill(INF));
const adjacency: boolean[][] = Array.from({ length: NODE_COUNT }, () => Array(NODE_COUNT).fill(false));

let graphBuilt = false;

export function buildGraph(): void {
  if (graphBuilt) return;

  for (let i = 0; i < NODE_COUNT; i++) {
    distances[i][i] = 0;
    adjacency[i][i] = false;
  }

  for (const r of ROAD_DEFINITIONS) {
    distances[r.a][r.b] = r.d;
    distances[r.b][r.a] = r.d;
    adjacency[r.a][r.b] = true;
    adjacency[r.b][r.a] = true;
  }

  graphBuilt = true;
}

export function getDistance(from: number, to: number): number {
  return distances[from][to];
}

export function isAdjacent(from: number, to: number): boolean {
  return adjacency[from][to];
}

export function allBranchesVisited(visited: boolean[]): boolean {
  for (let i = 1; i < NODE_COUNT; i++) {
    if (!visited[i]) return false;
  }
  return true;
}

export function computeOptimalRoute(): number {
  buildGraph();

  const branches = [1, 2, 3, 4, 5, 6, 7];
  let bestDist = INF;

  function backtrack(path: number[]): void {
    if (path.length === branches.length) {
      let prev = 0;
      let d = 0;
      for (const idx of path) {
        if (!adjacency[prev][idx]) return;
        d += distances[prev][idx];
        prev = idx;
      }
      if (!adjacency[prev][0]) return;
      d += distances[prev][0];
      if (d < bestDist) bestDist = d;
      return;
    }
    for (const b of branches) {
      if (!path.includes(b)) {
        path.push(b);
        backtrack(path);
        path.pop();
      }
    }
  }

  backtrack([]);
  return bestDist;
}

export function createInitialGameState(): TSPGameState {
  const visited = Array(NODE_COUNT).fill(false);
  visited[0] = true;

  return {
    visited,
    playerPath: [0],
    totalDistance: 0,
    gameOver: false,
    isAnimating: false,
    hintsUsed: 0,
    startTime: Date.now()
  };
}

export function getHint(gameState: TSPGameState): string {
  const { visited, playerPath, gameOver } = gameState;

  if (gameOver) {
    return "המשחק הסתיים - יש להקיש על איפוס להתחלה חדשה";
  }

  const currentNode = playerPath[playerPath.length - 1];

  // If already back at depot
  if (currentNode === 0 && allBranchesVisited(visited)) {
    return "יש להקיש על 'בדיקה' לסיום המשחק!";
  }

  // If at depot but haven't visited all branches
  if (currentNode === 0 && !allBranchesVisited(visited)) {
    let minDist = INF;
    let nextNode = -1;
    for (let i = 1; i < NODE_COUNT; i++) {
      if (!visited[i] && adjacency[0][i] && distances[0][i] < minDist) {
        minDist = distances[0][i];
        nextNode = i;
      }
    }
    if (nextNode !== -1) {
      return `כדאי ללכת ל${NODES[nextNode].name}`;
    }
    return "יש לבחור אתר מחובר למרכז";
  }

  // If all branches visited, go back to depot
  if (allBranchesVisited(visited) && currentNode !== 0) {
    return "יש לחזור למרכז ההפצה!";
  }

  // Find next best move - closest unvisited neighbor
  let minDist = INF;
  let nextNode = -1;

  for (let i = 1; i < NODE_COUNT; i++) {
    if (!visited[i] && adjacency[currentNode][i]) {
      if (distances[currentNode][i] < minDist) {
        minDist = distances[currentNode][i];
        nextNode = i;
      }
    }
  }

  if (nextNode !== -1) {
    return `כדאי ללכת ל${NODES[nextNode].name}`;
  }

  return "יש לבחור אתר מחובר למיקום הנוכחי";
}
