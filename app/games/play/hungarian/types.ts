// Hungarian Game Types and Constants

export interface Courier {
  id: number;
  name: string;
  color: string;
  x: number;
  z: number;
}

export interface Order {
  id: number;
  restX: number;
  restZ: number;
  custX: number;
  custZ: number;
  color: string;
  restaurant: string;
  family: string;
}

export interface GameResult {
  solved: boolean | null;  // null = exited/abandoned, false = wrong answer, true = correct
  hintsUsed: number;
  timeSeconds: number;
}

export interface HungarianGameState {
  started: boolean;
  assignments: Record<number, number>; // courierId -> orderId
  selectedCourier: number | null;
  startTime: number | null;
  isComplete: boolean;
  isAnimating: boolean;
  hintsUsed: number;
}

// Configuration from original HTML
export const MINUTES_PER_UNIT = 0.18;
export const IS_MOBILE = typeof window !== 'undefined' ? window.innerWidth < 900 : false;
export const COURIER_SCALE = IS_MOBILE ? 2.5 : 1.7;
export const COURIER_HEIGHT = 0.7;

// Couriers - exact positions from original HTML
export const COURIERS: Courier[] = [
  { id: 4, x: 40, z: 28, color: '#FFA07A', name: 'שרה' },
  { id: 2, x: 40, z: -28, color: '#4ECDC4', name: 'מיכל' },
  { id: 3, x: -38, z: 28, color: '#9B59B6', name: 'דני' },
  { id: 1, x: -38, z: -28, color: '#FF6B6B', name: 'יוסי' }
];

// Orders - exact positions from original HTML
export const ORDERS: Order[] = [
  { id: 1, restX: -5, restZ: 0, custX: 15, custZ: 5, color: '#FFD93D', restaurant: 'פיצה רומא', family: 'משפחת כהן' },
  { id: 2, restX: 24, restZ: 14, custX: -24, custZ: 22, color: '#6BCF7F', restaurant: 'סושי טוקיו', family: 'משפחת לוי' },
  { id: 3, restX: -10, restZ: 22, custX: 28, custZ: 5, color: '#B4A7D6', restaurant: 'בורגר האוס', family: 'משפחת אברהם' },
  { id: 4, restX: 8, restZ: -26, custX: -28, custZ: -10, color: '#FF9FF3', restaurant: 'פלאפל הזהב', family: 'משפחת דוד' }
];

export function createInitialGameState(): HungarianGameState {
  return {
    started: false,
    assignments: {},
    selectedCourier: null,
    startTime: null,
    isComplete: false,
    isAnimating: false,
    hintsUsed: 0
  };
}
