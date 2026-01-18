// Knapsack Game Logic - Algorithm and Calculations
// Converted 1:1 from original HTML

import { Item, ITEMS, CAPACITY, KnapsackGameState } from './types';

// Brute force to find optimal solution - from original HTML
export function getOptimalSolution(): { items: Set<number>; value: number; weight: number } {
  const n = ITEMS.length;
  let bestMask = 0;
  let bestValue = 0;
  let bestWeight = 0;

  for (let mask = 0; mask < (1 << n); mask++) {
    let w = 0;
    let v = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        w += ITEMS[i].weight;
        v += ITEMS[i].value;
      }
    }
    if (w <= CAPACITY && v > bestValue) {
      bestValue = v;
      bestMask = mask;
      bestWeight = w;
    }
  }

  const items = new Set<number>();
  for (let i = 0; i < n; i++) {
    if (bestMask & (1 << i)) {
      items.add(ITEMS[i].id);
    }
  }

  return { items, value: bestValue, weight: bestWeight };
}

// Check if current selection is optimal
export function isOptimalSelection(selectedItems: Set<number>): boolean {
  const optimal = getOptimalSolution();

  // Check if same items are selected
  if (selectedItems.size !== optimal.items.size) return false;

  for (const id of selectedItems) {
    if (!optimal.items.has(id)) return false;
  }

  return true;
}

// Get current total weight
export function getCurrentWeight(selectedItems: Set<number>): number {
  let total = 0;
  selectedItems.forEach(id => {
    const item = ITEMS.find(i => i.id === id);
    if (item) total += item.weight;
  });
  return total;
}

// Get current total value
export function getCurrentValue(selectedItems: Set<number>): number {
  let total = 0;
  selectedItems.forEach(id => {
    const item = ITEMS.find(i => i.id === id);
    if (item) total += item.value;
  });
  return total;
}

// Check if adding item would exceed capacity
export function canAddItem(selectedItems: Set<number>, itemId: number): boolean {
  if (selectedItems.has(itemId)) return false;

  const item = ITEMS.find(i => i.id === itemId);
  if (!item) return false;

  const currentWeight = getCurrentWeight(selectedItems);
  return currentWeight + item.weight <= CAPACITY;
}

// Get hint based on current selection - from original HTML
export function getHint(gameState: KnapsackGameState): string {
  const optimal = getOptimalSolution();
  const selected = gameState.selectedItems;

  // Check which items should be removed (wrong items in crate)
  for (const id of selected) {
    if (!optimal.items.has(id)) {
      const item = ITEMS.find(i => i.id === id);
      if (item) {
        return `💡 נסה להוציא את ה${item.name} מהחבילה`;
      }
    }
  }

  // Check which items should be added (missing items)
  for (const id of optimal.items) {
    if (!selected.has(id)) {
      const item = ITEMS.find(i => i.id === id);
      if (item) {
        const currentWeight = getCurrentWeight(selected);
        if (currentWeight + item.weight <= CAPACITY) {
          return `💡 נסה להוסיף את ה${item.name} לחבילה`;
        } else {
          return `💡 צריך לפנות מקום כדי להוסיף ${item.name}`;
        }
      }
    }
  }

  return '🎉 מצוין! נראה שזו הדרך הנכונה!';
}

// Format value for display
export function formatValue(value: number): string {
  return `₪${value}`;
}

// Format weight for display
export function formatWeight(weight: number): string {
  return `${weight}`;
}

// Get efficiency (value per kg) for sorting/hints
export function getEfficiency(item: Item): number {
  return item.value / item.weight;
}

// Get steps explanation for educational panel
export function getStepsInfo(): string[] {
  const optimal = getOptimalSolution();
  const steps: string[] = [];

  steps.push('האלגוריתם בודק את כל השילובים האפשריים');

  // Show efficiency of each item
  const sortedByEfficiency = [...ITEMS].sort((a, b) => getEfficiency(b) - getEfficiency(a));
  steps.push('יחס רווח/משקל של כל פריט:');
  sortedByEfficiency.forEach(item => {
    const eff = Math.round(getEfficiency(item));
    steps.push(`  ${item.emoji} ${item.name}: ${eff} ₪/ק"ג`);
  });

  steps.push(`הפתרון האופטימלי: ₪${optimal.value} (${optimal.weight} ק"ג)`);

  return steps;
}
