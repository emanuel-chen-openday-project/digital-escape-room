// Hungarian Game Logic - Algorithm and Calculations
// Converted 1:1 from original HTML

import { Courier, Order, COURIERS, ORDERS, MINUTES_PER_UNIT, HungarianGameState } from './types';

// Calculate distance from courier to order (via restaurant to customer)
export function getDistance(courier: Courier, order: Order): number {
  const toRest = Math.sqrt(Math.pow(order.restX - courier.x, 2) + Math.pow(order.restZ - courier.z, 2));
  const toCust = Math.sqrt(Math.pow(order.custX - order.restX, 2) + Math.pow(order.custZ - order.restZ, 2));
  return toRest + toCust;
}

// Get time in minutes for courier to complete order
export function getTimeMinutes(courier: Courier, order: Order): number {
  const dist = getDistance(courier, order);
  return Math.round(dist * MINUTES_PER_UNIT * 10) / 10;
}

// Calculate total time for all assignments
export function getTotalTime(assignments: Record<number, number>): number {
  let total = 0;
  Object.entries(assignments).forEach(([cId, oId]) => {
    const c = COURIERS.find(x => x.id === parseInt(cId));
    const o = ORDERS.find(x => x.id === oId);
    if (c && o) total += getTimeMinutes(c, o);
  });
  return Math.round(total * 10) / 10;
}

// Format minutes for display
export function formatMinutes(mins: number): string {
  return mins + " דק'";
}

// Hungarian Algorithm - exact implementation from original HTML
export function hungarianAlgorithm(cost: number[][]): number[] {
  const n = cost.length;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= n; j++) {
        if (!used[j]) {
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }

  const result: number[] = [];
  for (let j = 1; j <= n; j++) {
    if (p[j] !== 0) {
      result[p[j] - 1] = j - 1;
    }
  }
  return result;
}

// Get the optimal solution using Hungarian algorithm
export function getOptimalSolution(): { assignments: Record<number, number>; total: number } {
  const cost = COURIERS.map(c => ORDERS.map(o => getTimeMinutes(c, o)));
  const assignment = hungarianAlgorithm(cost);
  let total = 0;
  const opt: Record<number, number> = {};

  assignment.forEach((oIdx, cIdx) => {
    opt[COURIERS[cIdx].id] = ORDERS[oIdx].id;
    total += cost[cIdx][oIdx];
  });

  return { assignments: opt, total: Math.round(total * 10) / 10 };
}

// Get hint based on current assignments
export function getHint(gameState: HungarianGameState): string {
  const optimal = getOptimalSolution();
  const current = gameState.assignments;

  // Check if any current assignment is wrong
  for (const [cId, oId] of Object.entries(current)) {
    if (optimal.assignments[parseInt(cId)] !== oId) {
      const courier = COURIERS.find(c => c.id === parseInt(cId));
      const correctOrder = ORDERS.find(o => o.id === optimal.assignments[parseInt(cId)]);
      if (courier && correctOrder) {
        return `💡 נסה לשבץ את ${courier.name} ל${correctOrder.family}`;
      }
    }
  }

  // If no wrong assignments, suggest next unassigned
  if (Object.keys(current).length < 4) {
    const unassigned = COURIERS.find(c => !current[c.id]);
    if (unassigned) {
      const correctOrder = ORDERS.find(o => o.id === optimal.assignments[unassigned.id]);
      if (correctOrder) {
        return `💡 נסה לשבץ את ${unassigned.name} ל${correctOrder.family}`;
      }
    }
  }

  return '🎉 מצוין! נראה שזו הדרך הנכונה!';
}
