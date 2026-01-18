// Knapsack Game Types and Constants
// Converted 1:1 from original HTML

import * as BABYLON from '@babylonjs/core';

export interface Item {
  name: string;
  emoji: string;
  weight: number;
  value: number;
  color: BABYLON.Color3;
  type: string;
}

export interface GameResult {
  solved: boolean;
  hintsUsed: number;
  timeSeconds: number;
}

export interface KnapsackGameState {
  started: boolean;
  selectedItems: Set<number>;
  startTime: number | null;
  isComplete: boolean;
  isAnimating: boolean;
  hintsUsed: number;
  currentWeight: number;
  currentValue: number;
}

// Configuration - EXACT values from original HTML
export const IS_MOBILE = typeof window !== 'undefined' ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) : false;
export const SCALE = IS_MOBILE ? 0.55 : 0.6;
export const ITEM_SCALE = 1.25;
export const CAPACITY = 5; // kg

// Items - EXACT values from original HTML
export const ITEMS: Item[] = [
  { name: "מסך מחשב", emoji: "🖥️", weight: 3, value: 800, color: new BABYLON.Color3(0.2, 0.2, 0.22), type: "monitor" },
  { name: "שעון קיר", emoji: "🕐", weight: 0.5, value: 600, color: new BABYLON.Color3(0.95, 0.95, 0.97), type: "wallclock" },
  { name: "אוזניות", emoji: "🎧", weight: 0.3, value: 400, color: new BABYLON.Color3(0.15, 0.15, 0.18), type: "headphones" },
  { name: "ספרים", emoji: "📚", weight: 2, value: 500, color: new BABYLON.Color3(0.6, 0.3, 0.1), type: "books" },
  { name: "רמקול", emoji: "🔊", weight: 0.8, value: 500, color: new BABYLON.Color3(0.1, 0.1, 0.12), type: "speaker" },
  { name: "מקלדת", emoji: "⌨️", weight: 0.4, value: 300, color: new BABYLON.Color3(0.9, 0.9, 0.92), type: "keyboard" }
];

export function createInitialGameState(): KnapsackGameState {
  return {
    started: false,
    selectedItems: new Set(),
    startTime: null,
    isComplete: false,
    isAnimating: false,
    hintsUsed: 0,
    currentWeight: 0,
    currentValue: 0
  };
}

// Calculate current weight from selected items
export function calculateWeight(selectedItems: Set<number>): number {
  let total = 0;
  selectedItems.forEach(idx => {
    if (ITEMS[idx]) total += ITEMS[idx].weight;
  });
  return total;
}

// Calculate current value from selected items
export function calculateValue(selectedItems: Set<number>): number {
  let total = 0;
  selectedItems.forEach(idx => {
    if (ITEMS[idx]) total += ITEMS[idx].value;
  });
  return total;
}
