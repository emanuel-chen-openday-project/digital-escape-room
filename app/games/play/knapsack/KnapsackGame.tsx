// @ts-nocheck
'use client';

// Knapsack Game - React component converted 1:1 from original HTML
// Features: Babylon.js 3D scene, table, crate, items, arc animations

import { useEffect, useRef, useState, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import {
  ITEMS,
  CAPACITY,
  GameResult,
  KnapsackGameState,
  createInitialGameState,
  calculateWeight,
  calculateValue
} from './types';
import {
  getOptimalSolution,
  isOptimalSelection,
  getCurrentWeight,
  getCurrentValue,
  canAddItem,
  getHint,
  formatValue
} from './gameLogic';
import {
  createKnapsackScene,
  animateItemToCrate,
  animateItemFromCrate,
  resetItems,
  SceneRefs,
  ItemMesh
} from './scene';
import './KnapsackGame.css';

interface KnapsackGameProps {
  onComplete: (result: GameResult) => void;
}

export default function KnapsackGame({ onComplete }: KnapsackGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRefsRef = useRef<SceneRefs | null>(null);
  const gameStateRef = useRef<KnapsackGameState>(createInitialGameState());
  const usedSlotsRef = useRef<Set<number>>(new Set());

  // UI State
  const [showSplash, setShowSplash] = useState(true);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [currentWeight, setCurrentWeight] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ userValue: 0, optimalValue: 0, solved: false });
  const [hintText, setHintText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState('ניתן להקיש על מוצרים להוספה לחבילה');

  // Initialize Babylon.js scene
  useEffect(() => {
    if (!canvasRef.current || showSplash) return;

    const sceneRefs = createKnapsackScene(canvasRef.current);
    sceneRefsRef.current = sceneRefs;

    // Click handler for items
    sceneRefs.scene.onPointerDown = async (evt, pick) => {
      const gs = gameStateRef.current;
      if (!gs.started || gs.isComplete || gs.isAnimating) return;

      if (pick.hit) {
        let mesh = pick.pickedMesh;
        while (mesh && (mesh as any).itemId === undefined) {
          mesh = mesh.parent as BABYLON.AbstractMesh;
        }
        if (mesh && (mesh as any).itemId !== undefined) {
          const itemId = (mesh as any).itemId;
          await handleItemClick(itemId);

          if (!gs.startTime) {
            gs.startTime = Date.now();
          }
        }
      }
    };

    // Render loop
    sceneRefs.engine.runRenderLoop(() => {
      sceneRefs.scene.render();
    });

    // Handle resize
    const handleResize = () => sceneRefs.engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sceneRefs.engine.dispose();
    };
  }, [showSplash]);

  // Handle item click (add or remove from crate)
  const handleItemClick = useCallback(async (itemId: number) => {
    const sceneRefs = sceneRefsRef.current;
    const gs = gameStateRef.current;
    if (!sceneRefs || gs.isAnimating) return;

    const itemMesh = sceneRefs.itemMeshes.find(m => m.itemId === itemId);
    if (!itemMesh) return;

    gs.isAnimating = true;
    setIsAnimating(true);

    if (itemMesh.inCrate) {
      // Remove from crate
      await animateItemFromCrate(itemMesh);

      // Free up the slot
      if (itemMesh.crateSlot !== null) {
        usedSlotsRef.current.delete(itemMesh.crateSlot);
      }

      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        gs.selectedItems = newSet;
        return newSet;
      });

      const item = ITEMS.find(i => i.id === itemId);
      if (item) {
        setMessage(`${item.emoji} ${item.name} הוסר מהחבילה`);
      }
    } else {
      // Check if can add (weight limit)
      const item = ITEMS.find(i => i.id === itemId);
      if (!item) {
        gs.isAnimating = false;
        setIsAnimating(false);
        return;
      }

      const newWeight = getCurrentWeight(gs.selectedItems) + item.weight;
      if (newWeight > CAPACITY) {
        setMessage(`לא ניתן להוסיף - חריגה ממגבלת ${CAPACITY} ק"ג`);
        gs.isAnimating = false;
        setIsAnimating(false);
        return;
      }

      // Find available slot
      let slotIndex = 0;
      while (usedSlotsRef.current.has(slotIndex) && slotIndex < sceneRefs.crateSlots.length) {
        slotIndex++;
      }
      if (slotIndex >= sceneRefs.crateSlots.length) {
        slotIndex = 0; // Fallback to first slot if all used
      }
      usedSlotsRef.current.add(slotIndex);

      // Add to crate
      await animateItemToCrate(itemMesh, sceneRefs.crateBase, sceneRefs.crateSlots, slotIndex);

      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        gs.selectedItems = newSet;
        return newSet;
      });

      setMessage(`${item.emoji} ${item.name} נוסף לחבילה`);
    }

    gs.isAnimating = false;
    setIsAnimating(false);
  }, []);

  // Update weight and value when selection changes
  useEffect(() => {
    const weight = getCurrentWeight(selectedItems);
    const value = getCurrentValue(selectedItems);
    setCurrentWeight(weight);
    setCurrentValue(value);
    gameStateRef.current.currentWeight = weight;
    gameStateRef.current.currentValue = value;
  }, [selectedItems]);

  // Start game
  const handleStartGame = useCallback(() => {
    setShowSplash(false);
    gameStateRef.current.started = true;

    // Request fullscreen on mobile
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  }, []);

  // Close all panels
  const closeAllPanels = useCallback(() => {
    setShowHelpPanel(false);
    setShowInfoPanel(false);
  }, []);

  // Show hint
  const handleShowHint = useCallback(() => {
    gameStateRef.current.hintsUsed++;
    const hint = getHint(gameStateRef.current);
    setHintText(hint);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3500);
  }, []);

  // Check solution
  const handleCheckSolution = useCallback(() => {
    if (isAnimating) return;

    const gs = gameStateRef.current;
    gs.isComplete = true;

    const userValue = getCurrentValue(selectedItems);
    const optimal = getOptimalSolution();
    const solved = isOptimalSelection(selectedItems);

    setCelebrationData({
      userValue,
      optimalValue: optimal.value,
      solved
    });
    setShowCelebration(true);
  }, [selectedItems, isAnimating]);

  // Reset game
  const handleReset = useCallback(() => {
    const sceneRefs = sceneRefsRef.current;
    if (!sceneRefs) return;

    // Reset items
    resetItems(sceneRefs.itemMeshes);

    // Reset state
    setSelectedItems(new Set());
    setCurrentWeight(0);
    setCurrentValue(0);
    usedSlotsRef.current.clear();
    setShowCelebration(false);
    setMessage('ניתן להקיש על מוצרים להוספה לחבילה');
    gameStateRef.current = {
      ...createInitialGameState(),
      started: true,
      hintsUsed: gameStateRef.current.hintsUsed
    };
  }, []);

  // Play again (from celebration)
  const handlePlayAgain = useCallback(() => {
    handleReset();
  }, [handleReset]);

  // Continue to next game
  const handleContinue = useCallback(() => {
    const gs = gameStateRef.current;
    const timeSeconds = gs.startTime ? Math.floor((Date.now() - gs.startTime) / 1000) : 0;

    onComplete({
      solved: celebrationData.solved,
      hintsUsed: gs.hintsUsed,
      timeSeconds
    });
  }, [onComplete, celebrationData.solved]);

  // Get optimal items for display
  const getOptimalItems = () => {
    const optimal = getOptimalSolution();
    return ITEMS.filter(item => optimal.items.has(item.id));
  };

  return (
    <div className="knapsack-game-container">
      {/* Splash Screen */}
      {showSplash && (
        <div className="knapsack-splash">
          <div className="knapsack-splash-content">
            <div className="knapsack-splash-icon">📦</div>
            <h1 className="knapsack-splash-title">חבילה למשלוח</h1>
            <p className="knapsack-splash-subtitle">TechBox - חנות הטכנולוגיה</p>

            <div className="knapsack-splash-section">
              <h3>📦 על המשחק</h3>
              <p>
                ברשותך חנות למוצרי טכנולוגיה. התקבלה הזמנה של מספר מוצרים, אך קיימת מגבלת משלוח של עד <span className="highlight-text">{CAPACITY} ק&quot;ג בלבד</span>, בעוד שמשקל כלל המוצרים גבוה מהמותר. יש לבחור אילו מוצרים ייכללו במשלוח. כל מוצר מניב רווח שונה לחנות.
              </p>
            </div>

            <div className="knapsack-splash-section">
              <h3>🎯 המטרה</h3>
              <p>
                לבחור אילו מוצרים להכניס לחבילה - כאלה שיביאו <span className="highlight-text">את הרווח הכי גדול</span>, בלי לעבור את מגבלת המשקל.
              </p>
              <p style={{ marginTop: 10 }}>
                <span className="highlight-text">💡 טיפ:</span> לפני שבוחרים מוצר, כדאי לשאול: כמה רווח הוא מביא ביחס למשקל שהוא תופס?
              </p>
            </div>

            <div className="knapsack-splash-section">
              <h3>👆 איך משחקים?</h3>
              <ol>
                <li>מקישים על מוצר כדי להוסיף אותו לחבילה</li>
                <li>מקישים על מוצר שנמצא בחבילה כדי להסיר אותו</li>
                <li>מקישים על &quot;בדיקה&quot; כדי לבדוק אם הגעת לפתרון הטוב ביותר</li>
              </ol>
            </div>

            <button className="knapsack-start-btn" onClick={handleStartGame}>
              🎮 יאללה, מתחילים!
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      {!showSplash && <canvas ref={canvasRef} className="knapsack-canvas" />}

      {/* HUD - visible after splash */}
      {!showSplash && (
        <>
          <div className="knapsack-hud">
            <div className="knapsack-hud-stats">
              <div className="knapsack-stat">
                <span className="knapsack-stat-label">מגבלה:</span>
                <span className="knapsack-stat-value">{CAPACITY} ק&quot;ג</span>
              </div>
              <div className="knapsack-stat">
                <span className="knapsack-stat-label">משקל בחבילה:</span>
                <span className={`knapsack-stat-value ${currentWeight > CAPACITY * 0.8 ? 'warning' : ''}`}>
                  {currentWeight} ק&quot;ג
                </span>
              </div>
              <div className="knapsack-stat">
                <span className="knapsack-stat-label">רווח לחנות:</span>
                <span className="knapsack-stat-value success">{formatValue(currentValue)}</span>
              </div>
            </div>
            <button
              className="knapsack-check-btn"
              onClick={handleCheckSolution}
              disabled={isAnimating || selectedItems.size === 0}
            >
              ✓ בדיקה
            </button>
          </div>

          <div className="knapsack-message">{message}</div>

          <div className="knapsack-top-buttons">
            <button
              className="knapsack-top-btn btn-green"
              onClick={() => { closeAllPanels(); setShowInfoPanel(true); }}
              title="מידע"
            >
              🎓
            </button>
            <button
              className="knapsack-top-btn btn-light-blue"
              onClick={() => { closeAllPanels(); setShowHelpPanel(true); }}
              title="עזרה"
            >
              ?
            </button>
            <button
              className="knapsack-top-btn btn-yellow"
              onClick={handleShowHint}
              title="רמז"
            >
              💡
            </button>
          </div>

          <button
            className="knapsack-exit-btn"
            onClick={() => {
              if (confirm('לצאת מהמשחק?')) {
                onComplete({ solved: false, hintsUsed: gameStateRef.current.hintsUsed, timeSeconds: 0 });
              }
            }}
          >
            ✕
          </button>
        </>
      )}

      {/* Overlay for panels */}
      <div
        className={`knapsack-overlay ${showHelpPanel || showInfoPanel ? 'visible' : ''}`}
        onClick={closeAllPanels}
      />

      {/* Hint Toast */}
      <div className={`knapsack-hint-toast ${showHint ? 'visible' : ''}`}>
        {hintText}
      </div>

      {/* Help Panel */}
      <div className={`knapsack-side-panel ${showHelpPanel ? 'open' : ''}`}>
        <button className="knapsack-panel-close" onClick={closeAllPanels}>✕</button>
        <div className="knapsack-panel-title">🎮 איך משחקים?</div>

        <div className="knapsack-panel-section">
          <h3>📦 על המשחק</h3>
          <p>ברשותך חנות למוצרי טכנולוגיה. התקבלה הזמנה של מספר מוצרים, אך קיימת מגבלת משלוח של עד <strong>{CAPACITY} ק&quot;ג בלבד</strong>, בעוד שמשקל כלל המוצרים גבוה מהמותר. יש לבחור אילו מוצרים ייכללו במשלוח. כל מוצר מניב רווח שונה לחנות.</p>
        </div>

        <div className="knapsack-panel-section">
          <h3>🎯 המטרה</h3>
          <p>לבחור אילו מוצרים להכניס לחבילה - כאלה שיביאו <strong>את הרווח הכי גדול</strong>, בלי לעבור את מגבלת המשקל.</p>
          <p style={{ marginTop: 10, color: '#1565C0', fontWeight: 600 }}>💡 טיפ: לפני שבוחרים מוצר, כדאי לשאול: כמה רווח הוא מביא ביחס למשקל שהוא תופס?</p>
        </div>

        <div className="knapsack-panel-section">
          <h3>👆 שלבי המשחק</h3>
          <ol>
            <li>מקישים על מוצר כדי להוסיף אותו לחבילה</li>
            <li>מקישים על מוצר שנמצא בחבילה כדי להסיר אותו</li>
            <li>מקישים על &quot;בדיקה&quot; כדי לבדוק אם הגעת לפתרון הטוב ביותר</li>
          </ol>
        </div>

        <div className="knapsack-tip-box">
          <h4>💡 איך לחשוב נכון?</h4>
          <p>לא מספיק לבחור את הפריטים עם הרווח הגבוה ביותר. צריך לשקול גם את המשקל! פריט קל עם רווח בינוני עשוי להיות עדיף על פריט כבד עם רווח גבוה.</p>
        </div>
      </div>

      {/* Info Panel */}
      <div className={`knapsack-info-panel ${showInfoPanel ? 'open' : ''}`}>
        <button className="knapsack-panel-close" onClick={closeAllPanels}>✕</button>
        <div className="knapsack-edu-icon">🏗️</div>
        <div className="knapsack-edu-title">מה לומדים כאן?</div>

        <div className="knapsack-edu-section">
          <h3>📚 על מה המשחק?</h3>
          <p>המשחק מציג אתגר של קבלת החלטות בתנאים של מגבלות, כמו משקל או מקום. במצבים כאלה לא ניתן לבחור את כל האפשרויות, ולכן יש לחשוב כיצד לבחור את השילוב שיוביל לתוצאה הטובה ביותר.</p>
        </div>

        <div className="knapsack-edu-section">
          <h3>🔧 איפה זה בשימוש?</h3>
          <div className="knapsack-uses-list">
            <span className="knapsack-use-tag">העמסת מטענים</span>
            <span className="knapsack-use-tag">תכנון משלוחים</span>
            <span className="knapsack-use-tag">בניית תקציב</span>
            <span className="knapsack-use-tag">תכנון מחסנים</span>
            <span className="knapsack-use-tag">ניהול פרויקטים</span>
            <span className="knapsack-use-tag">ניהול מלאי</span>
          </div>
        </div>

        <div className="knapsack-edu-section">
          <h3>🎓 למה הנדסת תעשייה וניהול?</h3>
          <p>עקרון זה עומד בבסיס נושאים רבים הנלמדים בהנדסת תעשייה וניהול, כמו אופטימיזציה וקבלת החלטות.</p>
        </div>

        <div className="knapsack-edu-section">
          <div className="knapsack-benefit-box">
            <p>🚀 בהנדסת תעשייה וניהול מפתחים דרך חשיבה שעוזרת להתמודד עם אתגרים!</p>
          </div>
        </div>
      </div>

      {/* Celebration */}
      {showCelebration && (
        <div className="knapsack-celebration">
          <div className="knapsack-celeb-card">
            <div className="knapsack-celeb-icon">
              {celebrationData.solved ? '🎉' : celebrationData.userValue >= celebrationData.optimalValue * 0.9 ? '👏' : '💪'}
            </div>
            <h2 className="knapsack-celeb-title">
              {celebrationData.solved ? 'מעולה!' : celebrationData.userValue >= celebrationData.optimalValue * 0.9 ? 'כמעט מושלם!' : 'סיימת!'}
            </h2>

            <p className="knapsack-celeb-subtitle">
              {celebrationData.solved
                ? 'מצאת את השילוב הכי טוב!'
                : `הרווח האופטימלי הוא ${formatValue(celebrationData.optimalValue)}`}
            </p>

            <div className="knapsack-results-grid">
              <div className="knapsack-result-box user">
                <div className="knapsack-result-label">הרווח שלך</div>
                <div className="knapsack-result-value">{formatValue(celebrationData.userValue)}</div>
              </div>
              <div className="knapsack-result-box optimal">
                <div className="knapsack-result-label">הרווח האופטימלי</div>
                <div className="knapsack-result-value">{formatValue(celebrationData.optimalValue)}</div>
              </div>
            </div>

            <div className="knapsack-optimal-list">
              <h4>🏆 הפריטים הטובים ביותר:</h4>
              <div className="knapsack-optimal-list-content">
                {getOptimalItems().map(item => (
                  <div key={item.id} className="knapsack-optimal-item">
                    {item.emoji} {item.name} - {formatValue(item.value)} ({item.weight} ק&quot;ג)
                  </div>
                ))}
              </div>
            </div>

            <div className="knapsack-celeb-buttons">
              <button className="knapsack-celeb-btn primary" onClick={handleContinue}>
                סיום 🏁
              </button>
              <button className="knapsack-celeb-btn secondary" onClick={handlePlayAgain}>
                🔄 שחק שוב
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
