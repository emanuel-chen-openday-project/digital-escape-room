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
// Also detect modern iPad (iPadOS 13+ reports as Macintosh)
export const IS_MOBILE = typeof window !== 'undefined'
  ? window.innerWidth < 900 ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent))
  : false;
export const COURIER_SCALE = IS_MOBILE ? 2.7 : 2.1;
export const COURIER_HEIGHT = 0.7;

// Couriers - exact positions from original HTML
export const COURIERS: Courier[] = [
  { id: 4, x: 40, z: 28, color: '#FFA07A', name: 'שרה' },
  { id: 2, x: 40, z: -28, color: '#4ECDC4', name: 'מיכל' },
  { id: 3, x: -38, z: 28, color: '#9B59B6', name: 'דני' },
  { id: 1, x: -38, z: -28, color: '#FF6B6B', name: 'יוסי' }
];

// Orders - positions spread out for larger motorcycles
export const ORDERS: Order[] = [
  { id: 1, restX: -7, restZ: -2, custX: 18, custZ: 8, color: '#FFD93D', restaurant: 'פיצה רומא', family: 'משפחת כהן' },
  { id: 2, restX: 26, restZ: 16, custX: -26, custZ: 24, color: '#6BCF7F', restaurant: 'סושי טוקיו', family: 'משפחת לוי' },
  { id: 3, restX: -11, restZ: 22, custX: 30, custZ: -6, color: '#B4A7D6', restaurant: 'בורגר האוס', family: 'משפחת אברהם' },
  { id: 4, restX: 10, restZ: -28, custX: -30, custZ: -14, color: '#FF9FF3', restaurant: 'פלאפל הזהב', family: 'משפחת דוד' }
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
