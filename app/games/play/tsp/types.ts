// TSP Game Types and Constants

export interface TSPNode {
  id: number;
  name: string;
  type: 'depot' | 'branch';
  x: number;
  z: number;
}

export interface RoadDefinition {
  a: number;
  b: number;
  d: number; // distance
}

export interface GameResult {
  solved: boolean;
  hintsUsed: number;
  timeSeconds: number;
}

export interface TSPGameState {
  visited: boolean[];
  playerPath: number[];
  totalDistance: number;
  gameOver: boolean;
  isAnimating: boolean;
  hintsUsed: number;
  startTime: number;
}

// Node definitions
export const NODES: TSPNode[] = [
  { id: 0, name: "מרכז ההפצה", type: "depot", x: 0, z: 10 },
  { id: 1, name: "מפעל בטון", type: "branch", x: -95, z: -30 },
  { id: 2, name: "מפעל פלסטיק", type: "branch", x: -25, z: -70 },
  { id: 3, name: "מחסן ברזל", type: "branch", x: 100, z: -55 },
  { id: 4, name: "מפעל שיש", type: "branch", x: -100, z: 60 },
  { id: 5, name: "מחסן עצים", type: "branch", x: 75, z: 80 },
  { id: 6, name: "מחסן טקסטיל", type: "branch", x: 90, z: 5 },
  { id: 7, name: "מפעל זכוכית", type: "branch", x: 0, z: 120 }
];

export const ROAD_DEFINITIONS: RoadDefinition[] = [
  { a: 0, b: 1, d: 4 }, { a: 0, b: 2, d: 5 }, { a: 0, b: 4, d: 5 },
  { a: 0, b: 5, d: 2 }, { a: 0, b: 7, d: 6 },
  { a: 1, b: 2, d: 3 }, { a: 1, b: 4, d: 4 },
  { a: 2, b: 3, d: 4 },
  { a: 3, b: 6, d: 5 },
  { a: 1, b: 3, d: 6 },
  { a: 4, b: 7, d: 4 },
  { a: 2, b: 5, d: 6 },
  { a: 5, b: 6, d: 4 }, { a: 5, b: 7, d: 3 }
];

export const INF = 999999;
export const NODE_COUNT = NODES.length;
