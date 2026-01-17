// Hungarian Game Types and Constants

export interface GameResult {
  solved: boolean;
  hintsUsed: number;
  timeSeconds: number;
}

export interface Courier {
  id: number;
  name: string;
  color: string;
  x: number;
  z: number;
}

export interface Order {
  id: number;
  restaurant: string;
  family: string;
  color: string;
  restX: number;
  restZ: number;
  custX: number;
  custZ: number;
}

export interface HungarianGameState {
  started: boolean;
  assignments: Record<number, number>; // courierId -> orderId
  selectedCourier: number | null;
  startTime: number;
  isComplete: boolean;
  isAnimating: boolean;
  hintsUsed: number;
}

// Courier definitions
export const COURIERS: Courier[] = [
  { id: 1, name: 'יוסי', color: '#FF6B6B', x: -38, z: -28 },
  { id: 2, name: 'מיכל', color: '#4ECDC4', x: 40, z: -28 },
  { id: 3, name: 'דני', color: '#9B59B6', x: -38, z: 28 },
  { id: 4, name: 'שרה', color: '#FFA07A', x: 40, z: 28 },
];

// Order definitions
export const ORDERS: Order[] = [
  { id: 1, restaurant: 'פיצה רומא', family: 'משפחת כהן', color: '#FFD93D', restX: -5, restZ: 0, custX: 15, custZ: 5 },
  { id: 2, restaurant: 'סושי טוקיו', family: 'משפחת לוי', color: '#6BCF7F', restX: 24, restZ: 14, custX: -24, custZ: 22 },
  { id: 3, restaurant: 'בורגר האוס', family: 'משפחת אברהם', color: '#B4A7D6', restX: -10, restZ: 22, custX: 28, custZ: 5 },
  { id: 4, restaurant: 'פלאפל הזהב', family: 'משפחת דוד', color: '#FF9FF3', restX: 8, restZ: -26, custX: -28, custZ: -10 },
];

export const MINUTES_PER_UNIT = 0.18;

export function createInitialGameState(): HungarianGameState {
  return {
    started: false,
    assignments: {},
    selectedCourier: null,
    startTime: Date.now(),
    isComplete: false,
    isAnimating: false,
    hintsUsed: 0,
  };
}
