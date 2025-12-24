import * as BABYLON from '@babylonjs/core';

export const SCALE = 0.35;

export const GAME_STATIONS: Record<number, { name: string; title: string }> = {
  2: { name: 'TSP', title: 'משחק תכנון מסלולים' },
  4: { name: 'Hungarian', title: 'משחק שיבוץ משימות' },
  8: { name: 'Knapsack', title: 'משחק בחירת פריטים' },
};

export interface Station {
  position: BABYLON.Vector3;
  name: string;
  description: string;
  hasInfo: boolean;
  shouldStop: boolean;
}

export function createStations(): Station[] {
  return [
    {
      position: new BABYLON.Vector3(0, 0, -20 * SCALE),
      name: "🏭 כניסה למפעל",
      description: "ברוכים הבאים למפעל התעשייתי המתקדם",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(0, 0, -12 * SCALE),
      name: "📋 אזור קבלה",
      description: "כאן מתחיל תהליך הייצור",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(-12 * SCALE, 0, -6 * SCALE),
      name: "🔧 מכונת CNC",
      description: "מכונת כרסום ממוחשבת לעיבוד מדויק",
      hasInfo: true,
      shouldStop: true
    },
    {
      position: new BABYLON.Vector3(-12 * SCALE, 0, 3 * SCALE),
      name: "📦 קו ייצור",
      description: "מסוע אוטומטי להעברת מוצרים",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(-12 * SCALE, 5.5 * SCALE, 12 * SCALE),
      name: "🤖 רובוט ריתוך",
      description: "זרוע רובוטית לריתוך מדויק",
      hasInfo: true,
      shouldStop: true
    },
    {
      position: new BABYLON.Vector3(0, 5.5 * SCALE, 14 * SCALE),
      name: "🌉 גשר תצפית",
      description: "נקודת תצפית על רצפת הייצור",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(11 * SCALE, 5.5 * SCALE, 12 * SCALE),
      name: "📦 אריזה אוטומטית",
      description: "מערכת אריזה ממוחשבת",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(12 * SCALE, 0, 3 * SCALE),
      name: "🔍 בקרת איכות",
      description: "בדיקה ומיון מוצרים",
      hasInfo: false,
      shouldStop: false
    },
    {
      position: new BABYLON.Vector3(12 * SCALE, 0, -6 * SCALE),
      name: "📦 מחסן חכם",
      description: "אחסון אוטומטי של מוצרים",
      hasInfo: true,
      shouldStop: true
    },
    {
      position: new BABYLON.Vector3(0, 0, -12 * SCALE),
      name: "🏁 סיום הסיור",
      description: "תודה שביקרתם במפעל שלנו!",
      hasInfo: false,
      shouldStop: false
    }
  ];
}
