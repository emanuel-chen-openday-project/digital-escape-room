// @ts-nocheck
'use client';

// Knapsack Game - React component converted 1:1 from original HTML

import { useEffect, useRef, useState, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import { ITEMS, CAPACITY, GameResult, IS_MOBILE } from './types';
import {
  createKnapsackScene,
  moveNodeTo,
  playMoveSfx,
  SceneRefs,
  ItemRoot
} from './scene';
import './KnapsackGame.css';

interface KnapsackGameProps {
  onComplete: (result: GameResult) => void;
}

export default function KnapsackGame({ onComplete }: KnapsackGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRefsRef = useRef<SceneRefs | null>(null);

  // UI State
  const [showSplash, setShowSplash] = useState(true);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showExitBtn, setShowExitBtn] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [message, setMessage] = useState('ניתן להקיש על מוצרים להוספה לחבילה 📦');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Result popup state
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [resultPopupData, setResultPopupData] = useState({
    icon: '🎉',
    title: 'מעולה!',
    message: '',
    type: 'success' as 'success' | 'failure'
  });

  // Compute optimal value
  const bestPossibleValue = useRef(0);
  useEffect(() => {
    let best = 0;
    const n = ITEMS.length;
    for (let mask = 0; mask < (1 << n); mask++) {
      let w = 0, v = 0;
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) { w += ITEMS[i].weight; v += ITEMS[i].value; }
      }
      if (w <= CAPACITY && v > best) best = v;
    }
    bestPossibleValue.current = best;
  }, []);

  // Fullscreen
  const goFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
    }
    setTimeout(() => window.scrollTo(0, 1), 100);
  }, []);

  // Start game
  const handleStart = useCallback(() => {
    setShowSplash(false);
    goFullscreen();
  }, [goFullscreen]);

  // Initialize Babylon.js scene
  useEffect(() => {
    if (!canvasRef.current || showSplash) return;

    const sceneRefs = createKnapsackScene(canvasRef.current);
    sceneRefsRef.current = sceneRefs;

    // Click handler for items
    sceneRefs.scene.onPointerDown = (evt, pickResult) => {
      if (!pickResult || !pickResult.hit || !pickResult.pickedMesh) return;

      // Show exit button on first interaction
      setShowExitBtn(true);

      let node = pickResult.pickedMesh as BABYLON.Node;
      while (node && (!node.metadata || node.metadata.type !== "itemRoot")) {
        node = node.parent as BABYLON.Node;
      }
      if (!node || !node.metadata) return;

      toggleItem(node as ItemRoot);
    };

    // Render loop
    sceneRefs.engine.runRenderLoop(() => {
      sceneRefs.scene.render();
    });

    // Handle resize
    const handleResize = () => sceneRefs.engine.resize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(() => sceneRefs.engine.resize(), 300);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      sceneRefs.engine.dispose();
    };
  }, [showSplash]);

  // Toggle item selection
  const toggleItem = useCallback((root: ItemRoot) => {
    const sceneRefs = sceneRefsRef.current;
    if (!sceneRefs) return;

    const idx = root.metadata.index;
    const item = ITEMS[idx];

    if (!startTime) {
      setStartTime(Date.now());
    }

    if (!root.metadata.selected) {
      // Try to add to crate
      let freeSlot: number | null = null;
      for (let i = 0; i < sceneRefs.crateSlots.length; i++) {
        const taken = sceneRefs.itemRoots.some(r => r.metadata.selected && r.metadata.slotIndex === i);
        if (!taken) { freeSlot = i; break; }
      }

      if (freeSlot === null) {
        setMessage("⚠️ החבילה מלאה! יש להסיר מוצר קודם");
        return;
      }

      root.metadata.selected = true;
      root.metadata.slotIndex = freeSlot;
      moveNodeTo(root, sceneRefs.crateSlots[freeSlot], sceneRefs.scene);
      playMoveSfx();

      // Update monitor label offset
      if (idx === 0 && root.metadata.labelRect) {
        root.metadata.labelRect.linkOffsetX = 0;
      }

      setCurrentWeight(prev => {
        const newWeight = prev + item.weight;
        if (newWeight > CAPACITY) {
          setMessage("⚠️ החבילה כבדה מדי! יש להסיר מוצר");
        } else {
          setMessage("ניתן להקיש על מוצרים להוספה או להסרה 📦");
        }
        return newWeight;
      });
      setCurrentValue(prev => prev + item.value);

    } else {
      // Remove from crate
      root.metadata.selected = false;
      root.metadata.slotIndex = null;
      moveNodeTo(root, root.metadata.basePosition.clone(), sceneRefs.scene);
      playMoveSfx();

      // Restore monitor label offset
      if (idx === 0 && root.metadata.labelRect) {
        root.metadata.labelRect.linkOffsetX = 40;
      }

      setCurrentWeight(prev => {
        const newWeight = prev - item.weight;
        if (newWeight <= CAPACITY) {
          setMessage("ניתן להקיש על מוצרים להוספה או להסרה 📦");
        }
        return newWeight;
      });
      setCurrentValue(prev => prev - item.value);
    }
  }, [startTime]);

  // Check solution
  const handleCheck = useCallback(() => {
    if (currentWeight > CAPACITY) {
      setResultPopupData({
        icon: '⚠️',
        title: 'משקל יתר!',
        message: 'החבילה כבדה מדי! יש להסיר מוצר קודם.',
        type: 'failure'
      });
      setShowResultPopup(true);
      return;
    }

    const diff = bestPossibleValue.current - currentValue;

    if (diff === 0) {
      setResultPopupData({
        icon: '🎉',
        title: 'מעולה!',
        message: `זה השילוב הטוב ביותר! הרווח המקסימלי הוא ₪${bestPossibleValue.current}`,
        type: 'success'
      });
      setShowResultPopup(true);
    } else if (diff <= 200) {
      setResultPopupData({
        icon: '👏',
        title: 'כמעט!',
        message: `קרוב מאוד! כדאי לנסות להחליף מוצרים - אפשר להרוויח עוד ₪${diff}`,
        type: 'failure'
      });
      setShowResultPopup(true);
    } else {
      setResultPopupData({
        icon: '💡',
        title: 'כדאי לנסות שוב!',
        message: `כדאי לנסות שילוב אחר של מוצרים. הרווח המקסימלי האפשרי הוא ₪${bestPossibleValue.current}`,
        type: 'failure'
      });
      setShowResultPopup(true);
    }
  }, [currentWeight, currentValue]);

  // Close result popup
  const handleClosePopup = useCallback(() => {
    setShowResultPopup(false);
    if (resultPopupData.type === 'success') {
      const timeSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      onComplete({
        solved: true,
        hintsUsed,
        timeSeconds
      });
    }
  }, [resultPopupData.type, startTime, hintsUsed, onComplete]);

  // Hint system
  const handleHint = useCallback(() => {
    const sceneRefs = sceneRefsRef.current;
    if (!sceneRefs) return;

    setHintsUsed(prev => prev + 1);

    const n = ITEMS.length;
    let bestMask = 0, bestVal = 0;

    for (let mask = 0; mask < (1 << n); mask++) {
      let w = 0, v = 0;
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) { w += ITEMS[i].weight; v += ITEMS[i].value; }
      }
      if (w <= CAPACITY && v > bestVal) { bestVal = v; bestMask = mask; }
    }

    const toAdd: string[] = [];
    const toRemove: string[] = [];
    for (let i = 0; i < n; i++) {
      const should = (bestMask & (1 << i)) !== 0;
      const is = sceneRefs.itemRoots[i].metadata.selected;
      if (should && !is) toAdd.push(ITEMS[i].emoji + " " + ITEMS[i].name);
      if (!should && is) toRemove.push(ITEMS[i].emoji + " " + ITEMS[i].name);
    }

    if (toRemove.length > 0 && toAdd.length > 0) {
      setMessage(`💡 הוצא/י ${toRemove[0]} ← הוסיפ/י ${toAdd[0]}`);
    } else if (toRemove.length > 0) {
      setMessage(`💡 כדאי להוציא: ${toRemove[0]}`);
    } else if (toAdd.length > 0) {
      setMessage(`💡 כדאי להוסיף: ${toAdd[0]}`);
    } else {
      setMessage("🎉 מעולה! זה השילוב הכי טוב!");
    }
  }, []);

  // Panel controls
  const openHelpPanel = useCallback(() => {
    setShowInfoPanel(false);
    setShowHelpPanel(true);
    setShowOverlay(true);
  }, []);

  const openInfoPanel = useCallback(() => {
    setShowHelpPanel(false);
    setShowInfoPanel(true);
    setShowOverlay(true);
  }, []);

  const closeAllPanels = useCallback(() => {
    setShowHelpPanel(false);
    setShowInfoPanel(false);
    setShowOverlay(false);
  }, []);

  // Exit
  const handleExit = useCallback(() => {
    if (confirm("לצאת מהמשחק?")) {
      window.history.back();
    }
  }, []);

  const displayWeight = Math.round(currentWeight * 100) / 100;
  const isOverweight = currentWeight > CAPACITY;

  return (
    <div className="knapsack-game">
      {/* Splash Screen */}
      {showSplash && (
        <div id="splashScreen">
          <div className="splash-content">
            <div className="splash-icon">📦</div>
            <h1 className="splash-title">חבילה למשלוח</h1>
            <p className="splash-subtitle">TechBox - חנות הטכנולוגיה</p>

            <div className="splash-section">
              <h3>📦 על המשחק</h3>
              <p>
                ברשותך חנות למוצרי טכנולוגיה. התקבלה הזמנה של מספר מוצרים, אך קיימת מגבלת משלוח של עד <span className="highlight-text">5 ק"ג בלבד</span>, בעוד שמשקל כלל המוצרים גבוה מהמותר. יש לבחור אילו מוצרים ייכללו במשלוח. כל מוצר מניב רווח שונה לחנות.
              </p>
            </div>

            <div className="splash-section">
              <h3>🎯 המטרה</h3>
              <p>
                לבחור אילו מוצרים להכניס לחבילה - כאלה שיביאו <span className="highlight-text">את הרווח הכי גדול</span>, בלי לעבור את מגבלת המשקל.
              </p>
              <p style={{ marginTop: '10px' }}>
                <span className="highlight-text">💡 טיפ:</span> לפני שבוחרים מוצר, כדאי לשאול: כמה רווח הוא מביא ביחס למשקל שהוא תופס?
              </p>
            </div>

            <div className="splash-section">
              <h3>👆 איך משחקים?</h3>
              <ol>
                <li>מקישים על מוצר כדי להוסיף אותו לחבילה</li>
                <li>מקישים על מוצר שנמצא בחבילה כדי להסיר אותו</li>
                <li>מקישים על "בדיקה" כדי לבדוק אם הגעת לפתרון הטוב ביותר</li>
              </ol>
            </div>

            <button id="startBtn" onClick={handleStart}>🎮 יאללה, מתחילים!</button>
          </div>
        </div>
      )}

      {/* Rotate Device */}
      <div id="rotateDevice">
        <div className="icon">📱</div>
        <h2>סובב את המכשיר</h2>
        <p>המשחק עובד במצב שוכב (Landscape)</p>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} id="renderCanvas" />

      {/* HUD */}
      {!showSplash && (
        <div id="hud">
          <div id="hudStats">
            <div className="stat">
              <span className="stat-label">מגבלה:</span>
              <span className="stat-value">{CAPACITY} ק"ג</span>
            </div>
            <div className={`stat ${isOverweight ? 'warning' : ''}`}>
              <span className="stat-label">משקל בחבילה:</span>
              <span className={`stat-value ${isOverweight ? 'warning' : ''}`}>{displayWeight} ק"ג</span>
            </div>
            <div className="stat">
              <span className="stat-label">רווח לחנות:</span>
              <span className={`stat-value ${currentValue === bestPossibleValue.current && !isOverweight ? 'success' : ''}`}>₪{currentValue}</span>
            </div>
          </div>
          <button id="checkBtn" onClick={handleCheck}>✓ בדיקה</button>
        </div>
      )}

      {/* Message */}
      {!showSplash && (
        <div id="message">{message}</div>
      )}

      {/* Top Buttons */}
      {!showSplash && (
        <div id="topButtons">
          <button id="infoBtn" className="topBtn" onClick={openInfoPanel}>🎓</button>
          <button id="helpBtn" className="topBtn" onClick={openHelpPanel}>?</button>
          <button id="hintBtn" className="topBtn" onClick={handleHint}>💡</button>
        </div>
      )}

      {/* Exit Button */}
      {!showSplash && (
        <button id="exitBtn" className={showExitBtn ? 'visible' : ''} onClick={handleExit}>✕</button>
      )}

      {/* Overlay */}
      <div id="overlay" className={showOverlay ? 'visible' : ''} onClick={closeAllPanels} />

      {/* Help Panel */}
      <div id="sidePanel" className={showHelpPanel ? 'open' : ''}>
        <div className="panel-title">
          <span>🎮</span>
          <span>איך משחקים?</span>
        </div>

        <div className="panel-section">
          <h3>📦 על המשחק</h3>
          <p>ברשותך חנות למוצרי טכנולוגיה. התקבלה הזמנה של מספר מוצרים, אך קיימת מגבלת משלוח של עד <strong>5 ק"ג בלבד</strong>, בעוד שמשקל כלל המוצרים גבוה מהמותר. יש לבחור אילו מוצרים ייכללו במשלוח. כל מוצר מניב רווח שונה לחנות.</p>
        </div>

        <div className="panel-section">
          <h3>🎯 המטרה</h3>
          <p>לבחור אילו מוצרים להכניס לחבילה - כאלה שיביאו <strong>את הרווח הכי גדול</strong>, בלי לעבור את מגבלת המשקל.</p>
          <p style={{ marginTop: '10px' }}><strong style={{ color: '#1565C0' }}>💡 טיפ:</strong> לפני שבוחרים מוצר, כדאי לשאול: כמה רווח הוא מביא ביחס למשקל שהוא תופס?</p>
        </div>

        <div className="panel-section">
          <h3>👆 איך משחקים?</h3>
          <ol>
            <li>מקישים על מוצר כדי להוסיף אותו לחבילה</li>
            <li>מקישים על מוצר שנמצא בחבילה כדי להסיר אותו</li>
            <li>מקישים על "בדיקה" כדי לבדוק אם הגעת לפתרון הטוב ביותר</li>
          </ol>
        </div>
      </div>
      <button id="sidePanelClose" className={showHelpPanel ? 'visible' : ''} onClick={closeAllPanels}>✕</button>

      {/* Info Panel */}
      <div id="infoPanel" className={showInfoPanel ? 'open' : ''}>
        <div className="edu-icon">🏗️</div>
        <div className="edu-title">מה לומדים כאן?</div>

        <div className="edu-section">
          <h3>📚 על מה המשחק?</h3>
          <p>המשחק מציג אתגר של קבלת החלטות בתנאים של מגבלות, כמו משקל או מקום. במצבים כאלה לא ניתן לבחור את כל האפשרויות, ולכן יש לחשוב כיצד לבחור את השילוב שיוביל לתוצאה הטובה ביותר.</p>
        </div>

        <div className="edu-section">
          <h3>🔧 איפה זה בשימוש?</h3>
          <div className="uses-list">
            <span className="use-tag">העמסת מטענים</span>
            <span className="use-tag">תכנון משלוחים</span>
            <span className="use-tag">בניית תקציב</span>
            <span className="use-tag">תכנון מחסנים</span>
            <span className="use-tag">ניהול פרויקטים</span>
            <span className="use-tag">ניהול מלאי</span>
          </div>
        </div>

        <div className="edu-section">
          <h3>🎓 למה הנדסת תעשייה וניהול?</h3>
          <p>עקרון זה עומד בבסיס נושאים רבים הנלמדים בהנדסת תעשייה וניהול, כמו אופטימיזציה וקבלת החלטות.</p>
        </div>

        <div className="edu-section">
          <div className="benefit-box">
            <p>🚀 בהנדסת תעשייה וניהול מפתחים דרך חשיבה שעוזרת להתמודד עם אתגרים!</p>
          </div>
        </div>
      </div>
      <button id="infoPanelClose" className={showInfoPanel ? 'visible' : ''} onClick={closeAllPanels}>✕</button>

      {/* Result Popup Overlay */}
      <div id="popupOverlay" className={showResultPopup ? 'visible' : ''} onClick={handleClosePopup} />

      {/* Result Popup */}
      <div id="resultPopup" className={`${showResultPopup ? 'visible' : ''} ${resultPopupData.type}`}>
        <div className="popup-icon">{resultPopupData.icon}</div>
        <div className="popup-title">{resultPopupData.title}</div>
        <div className="popup-message">{resultPopupData.message}</div>
        <button className="popup-btn" onClick={handleClosePopup}>המשך</button>
      </div>
    </div>
  );
}
