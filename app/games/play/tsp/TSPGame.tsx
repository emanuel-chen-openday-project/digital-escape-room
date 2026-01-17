'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { NODES, NODE_COUNT, GameResult, TSPGameState } from './types';
import {
  buildGraph,
  computeOptimalRoute,
  createInitialGameState,
  isAdjacent,
  getDistance,
  allBranchesVisited,
  getHint
} from './gameLogic';
import { createTSPScene, setTruckToNode, animateTruck, SceneRefs } from './scene';
import './TSPGame.css';

interface TSPGameProps {
  onComplete: (result: GameResult) => void;
  onUseHint?: () => void;
}

export default function TSPGame({ onComplete, onUseHint }: TSPGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRefsRef = useRef<SceneRefs | null>(null);
  const gameStateRef = useRef<TSPGameState>(createInitialGameState());
  const optimalDistanceRef = useRef<number>(0);

  const [currentDistance, setCurrentDistance] = useState(0);
  const [optimalDistance, setOptimalDistance] = useState(0);
  const [message, setMessage] = useState('');
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState({ playerDistance: 0, solved: false });
  const [checkDisabled, setCheckDisabled] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize game after splash screen
  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    buildGraph();
    const optimal = computeOptimalRoute();
    optimalDistanceRef.current = optimal;
    setOptimalDistance(optimal);

    const sceneRefs = createTSPScene(canvasRef.current);
    sceneRefsRef.current = sceneRefs;

    // Reset game state
    const gameState = createInitialGameState();
    gameStateRef.current = gameState;
    setMessage('יש להקיש על האתר הראשון כדי להתחיל');

    // Handle click events
    sceneRefs.scene.onPointerDown = (evt, pickResult) => {
      if (!pickResult.hit || gameStateRef.current.isAnimating || gameStateRef.current.gameOver) return;

      let mesh = pickResult.pickedMesh;
      while (mesh && (mesh as any).nodeId === undefined) {
        mesh = mesh.parent as any;
      }

      if (mesh && typeof (mesh as any).nodeId === "number") {
        handleNodeClick((mesh as any).nodeId);
      }
    };

    // Render loop
    sceneRefs.engine.runRenderLoop(() => sceneRefs.scene.render());

    // Handle resize
    const handleResize = () => {
      sceneRefs.engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
      sceneRefs.engine.resize();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 300));

    return () => {
      window.removeEventListener('resize', handleResize);
      sceneRefs.engine.dispose();
    };
  }, [gameStarted]);

  const handleStartGame = useCallback(() => {
    setShowSplash(false);
    setGameStarted(true);
  }, []);

  const handleNodeClick = useCallback((nodeId: number) => {
    const gameState = gameStateRef.current;
    const sceneRefs = sceneRefsRef.current;
    if (!sceneRefs || gameState.isAnimating || gameState.gameOver) return;

    const last = gameState.playerPath[gameState.playerPath.length - 1];
    if (!isAdjacent(last, nodeId)) return;

    // Return to depot
    if (nodeId === 0) {
      if (!allBranchesVisited(gameState.visited)) {
        setMessage('לא ניתן לחזור למרכז לפני ביקור בכל האתרים');
        return;
      }
      gameState.totalDistance += getDistance(last, 0);
      gameState.playerPath.push(0);
      setCurrentDistance(gameState.totalDistance);
      setMessage('חזרת למרכז ההפצה! יש להקיש על "בדיקה" לסיום');

      gameState.isAnimating = true;
      animateTruck(
        sceneRefs.scene,
        sceneRefs.truckParent,
        sceneRefs.nodeTransforms,
        sceneRefs.playerSegments,
        last,
        0,
        () => { gameState.isAnimating = false; }
      );
      return;
    }

    // Already visited
    if (gameState.visited[nodeId]) {
      setMessage('כבר היה ביקור באתר הזה');
      return;
    }

    // Move to new node
    gameState.visited[nodeId] = true;
    gameState.playerPath.push(nodeId);
    gameState.totalDistance += getDistance(last, nodeId);
    setCurrentDistance(gameState.totalDistance);
    setMessage('בדרך ל' + NODES[nodeId].name);

    gameState.isAnimating = true;
    animateTruck(
      sceneRefs.scene,
      sceneRefs.truckParent,
      sceneRefs.nodeTransforms,
      sceneRefs.playerSegments,
      last,
      nodeId,
      () => { gameState.isAnimating = false; }
    );
  }, []);

  const handleCheck = useCallback(() => {
    const gameState = gameStateRef.current;
    const currentNode = gameState.playerPath[gameState.playerPath.length - 1];

    if (currentNode !== 0) {
      setMessage('יש לחזור למרכז ההפצה לפני הבדיקה!');
      return;
    }

    if (!allBranchesVisited(gameState.visited)) {
      setMessage('יש לבקר בכל האתרים לפני הבדיקה!');
      return;
    }

    gameState.gameOver = true;
    setCheckDisabled(true);
    const solved = gameState.totalDistance === optimalDistanceRef.current;
    setResultData({ playerDistance: gameState.totalDistance, solved });
    setShowResult(true);
  }, []);

  const handleHint = useCallback(() => {
    const gameState = gameStateRef.current;
    gameState.hintsUsed++;
    const hint = getHint(gameState);
    setMessage('רמז: ' + hint);
    // Track hint usage for realtime leaderboard
    if (onUseHint) {
      onUseHint();
    }
  }, [onUseHint]);

  const handleUndo = useCallback(() => {
    const gameState = gameStateRef.current;
    const sceneRefs = sceneRefsRef.current;
    if (!sceneRefs || gameState.isAnimating || gameState.playerPath.length <= 1) return;

    const last = gameState.playerPath.pop()!;
    const prev = gameState.playerPath[gameState.playerPath.length - 1];

    if (last !== 0) gameState.visited[last] = false;
    gameState.totalDistance -= getDistance(prev, last);
    if (gameState.totalDistance < 0) gameState.totalDistance = 0;

    const seg = sceneRefs.playerSegments.pop();
    if (seg) seg.dispose();

    setTruckToNode(sceneRefs.truckParent, sceneRefs.nodeTransforms, prev);
    setCurrentDistance(gameState.totalDistance);
    gameState.gameOver = false;
    setMessage('הצעד האחרון הוסר');
  }, []);

  const handleReset = useCallback(() => {
    const sceneRefs = sceneRefsRef.current;
    if (!sceneRefs) return;

    // Clear path segments
    sceneRefs.playerSegments.forEach(m => m.dispose());
    sceneRefs.playerSegments.length = 0;

    // Reset game state
    const gameState = createInitialGameState();
    gameStateRef.current = gameState;

    setTruckToNode(sceneRefs.truckParent, sceneRefs.nodeTransforms, 0);
    setCurrentDistance(0);
    setCheckDisabled(false);
    setShowResult(false);
    setMessage('יש להקיש על האתר הראשון כדי להתחיל');
  }, []);

  const handleExit = useCallback(() => {
    const gameState = gameStateRef.current;
    const timeSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);

    onComplete({
      solved: false,
      hintsUsed: gameState.hintsUsed,
      timeSeconds
    });
  }, [onComplete]);

  const handlePlayAgain = useCallback(() => {
    handleReset();
  }, [handleReset]);

  const handleFinish = useCallback(() => {
    const gameState = gameStateRef.current;
    const timeSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);

    onComplete({
      solved: resultData.solved,
      hintsUsed: gameState.hintsUsed,
      timeSeconds
    });
  }, [onComplete, resultData.solved]);

  const closeAllPanels = () => {
    setShowHelpPanel(false);
    setShowInfoPanel(false);
  };

  return (
    <div className="tsp-container">
      {/* Splash Screen */}
      {showSplash && (
        <div className="tsp-splash">
          <div className="tsp-splash-content">
            <div className="tsp-splash-icon">🚚</div>
            <h1 className="tsp-splash-title">מאסטר המסלולים</h1>
            <p className="tsp-splash-subtitle">מצא את הדרך הקצרה!</p>

            <div className="tsp-splash-section">
              <h3>📦 על המשחק</h3>
              <p>
                יש <span className="tsp-highlight">משאית הובלות</span> שצריכה לאסוף חומרי גלם מכל <span className="tsp-highlight">7 המפעלים והמחסנים</span> ולחזור למרכז ההפצה.
                <br /><br />
                לכל מסלול יש <span className="tsp-highlight">מרחק שונה</span> - המטרה היא למצוא את המסלול הקצר ביותר!
              </p>
            </div>

            <div className="tsp-splash-section">
              <h3>🎯 המטרה</h3>
              <p>
                לבחור אילו מפעלים ומחסנים לבקר ובאיזה סדר - כאלה שייתנו את <span className="tsp-highlight">המסלול הקצר ביותר</span>, שעובר בכל האתרים וחוזר למרכז ההפצה.
              </p>
              <p className="tsp-tip">
                <strong>💡 טיפ:</strong> לפני שבוחרים את הצעד הבא, כדאי לשאול: האם זה יעזור לי להגיע לכל שאר האתרים בדרך הקצרה ביותר?
              </p>
            </div>

            <div className="tsp-splash-section">
              <h3>👆 איך משחקים?</h3>
              <ol>
                <li>מקישים על מפעל או מחסן כדי לנסוע אליו</li>
                <li>מקישים על מפעל נוסף כדי להמשיך במסלול</li>
                <li>מקישים על &quot;בדיקה&quot; כדי לבדוק אם הגעת לפתרון הטוב ביותר</li>
              </ol>
            </div>

            <button className="tsp-start-btn" onClick={handleStartGame}>
              🎮 יאללה, מתחילים!
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="tsp-canvas" style={{ display: gameStarted ? 'block' : 'none' }} />

      {/* HUD */}
      {gameStarted && <div className="tsp-hud">
        <div className="tsp-hud-stats">
          <div className="tsp-stat">
            <span className="tsp-stat-label">מרחק נוכחי:</span>
            <span className="tsp-stat-value">{currentDistance} ק&quot;מ</span>
          </div>
          <div className="tsp-stat">
            <span className="tsp-stat-label">מטרה:</span>
            <span className="tsp-stat-value">{optimalDistance} ק&quot;מ</span>
          </div>
        </div>
        <button className="tsp-check-btn" onClick={handleCheck} disabled={checkDisabled}>
          בדיקה
        </button>
      </div>}

      {/* Message */}
      {gameStarted && <div className="tsp-message">{message}</div>}

      {/* Top Buttons */}
      {gameStarted && <div className="tsp-top-buttons">
        <button className="tsp-top-btn tsp-info-btn" onClick={() => { closeAllPanels(); setShowInfoPanel(true); }}>
          <span role="img" aria-label="info">&#x1F393;</span>
        </button>
        <button className="tsp-top-btn tsp-help-btn" onClick={() => { closeAllPanels(); setShowHelpPanel(true); }}>
          ?
        </button>
        <button className="tsp-top-btn tsp-hint-btn" onClick={handleHint}>
          <span role="img" aria-label="hint">&#x1F4A1;</span>
        </button>
      </div>}

      {/* Left Buttons */}
      {gameStarted && <div className="tsp-left-buttons">
        <button className="tsp-left-btn tsp-undo-btn" onClick={handleUndo}>
          <span role="img" aria-label="undo">&#x21A9;&#xFE0F;</span>
        </button>
        <button className="tsp-left-btn tsp-reset-btn" onClick={handleReset}>
          <span role="img" aria-label="reset">&#x1F504;</span>
        </button>
        <button className="tsp-left-btn tsp-exit-btn" onClick={handleExit}>
          <span role="img" aria-label="exit">&#x2715;</span>
        </button>
      </div>}

      {/* Overlay */}
      {gameStarted && <div
        className={`tsp-overlay ${showHelpPanel || showInfoPanel ? 'visible' : ''}`}
        onClick={closeAllPanels}
      />}

      {/* Help Panel */}
      {gameStarted && <div className={`tsp-side-panel ${showHelpPanel ? 'open' : ''}`}>
        <div className="tsp-panel-title">
          <span>&#x1F3AE;</span>
          <span>איך משחקים?</span>
        </div>

        <div className="tsp-panel-section">
          <h3>&#x1F4E6; על המשחק</h3>
          <p>יש משאית שצריכה לאסוף חומרים מכל <strong>7 המפעלים והמחסנים</strong> ולחזור למרכז ההפצה. המטרה היא למצוא את המסלול הקצר ביותר.</p>
        </div>

        <div className="tsp-panel-section">
          <h3>&#x1F3AF; המטרה</h3>
          <p>לבחור אילו מפעלים ומחסנים לבקר ובאיזה סדר - כך שייתן את <strong>המסלול הקצר ביותר</strong>, שעובר בכל האתרים וחוזר למרכז ההפצה.</p>
          <p style={{ marginTop: 10 }}><strong>&#x1F4A1; טיפ:</strong> לפני שבוחרים את הצעד הבא, כדאי לשאול: האם זה יעזור לי להגיע לכל שאר האתרים בדרך הקצרה ביותר?</p>
        </div>

        <div className="tsp-panel-section">
          <h3>&#x1F446; פעולות</h3>
          <ol>
            <li>מקישים על אתר כדי לנסוע אליו</li>
            <li>&#x21A9;&#xFE0F; ביטול - לחזור צעד אחורה</li>
            <li>&#x1F504; איפוס - להתחיל מחדש</li>
          </ol>
        </div>
      </div>}
      {gameStarted && <button
        className={`tsp-panel-close ${showHelpPanel ? '' : 'hidden'}`}
        onClick={closeAllPanels}
        style={{ opacity: showHelpPanel ? 1 : 0, pointerEvents: showHelpPanel ? 'auto' : 'none' }}
      >
        &#x2715;
      </button>}

      {/* Info Panel */}
      {gameStarted && <div className={`tsp-info-panel ${showInfoPanel ? 'open' : ''}`}>
        <div className="tsp-edu-icon">&#x1F69A;</div>
        <div className="tsp-edu-title">מה לומדים כאן?</div>

        <div className="tsp-edu-section">
          <h3>&#x1F4DA; על מה המשחק?</h3>
          <p>המשחק מציג אתגר של תכנון מסלול: איך למצוא את הדרך הקצרה ביותר שעוברת בכל הנקודות בדיוק פעם אחת וחוזרת לנקודת ההתחלה. זו בעיה קלאסית בעולם התכנון והלוגיסטיקה.</p>
        </div>

        <div className="tsp-edu-section">
          <h3>&#x1F527; איפה זה בשימוש?</h3>
          <div className="tsp-uses-list">
            <span className="tsp-use-tag">תכנון משלוחים</span>
            <span className="tsp-use-tag">ניתוב רכבים</span>
            <span className="tsp-use-tag">מסלולי טיסה</span>
            <span className="tsp-use-tag">תכנון ייצור</span>
          </div>
        </div>

        <div className="tsp-edu-section">
          <h3>&#x1F393; למה הנדסת תעשייה וניהול?</h3>
          <p>התואר בהנדסת תעשייה וניהול מלמד בדיוק את זה - <strong>לקבל החלטות חכמות כשהמשאבים מוגבלים</strong>. חיסכון בקילומטרים = חיסכון בזמן, דלק וכסף!</p>
        </div>

        <div className="tsp-edu-section">
          <div className="tsp-benefit-box">
            <p>בהנדסת תעשייה וניהול מפתחים דרך חשיבה שעוזרת להתמודד עם אתגרים כאלה.</p>
          </div>
        </div>
      </div>}
      {gameStarted && <button
        className={`tsp-info-panel-close ${showInfoPanel ? '' : 'hidden'}`}
        onClick={closeAllPanels}
        style={{ opacity: showInfoPanel ? 1 : 0, pointerEvents: showInfoPanel ? 'auto' : 'none' }}
      >
        &#x2715;
      </button>}

      {/* Result Overlay */}
      {gameStarted && <div className={`tsp-result-overlay ${showResult ? 'show' : ''}`}>
        {/* Confetti animation for success */}
        {resultData.solved && showResult && (
          <div className="tsp-confetti">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="tsp-confetti-piece" style={{ '--delay': `${i * 0.1}s`, '--x': `${Math.random() * 100}%` } as React.CSSProperties} />
            ))}
          </div>
        )}
        <div className={`tsp-result-card ${resultData.solved ? 'success-card' : ''}`}>
          <div className="tsp-result-icon">{resultData.solved ? '🏆' : '📊'}</div>
          <div className="tsp-result-title">{resultData.solved ? 'מעולה!' : 'סיום המסלול'}</div>
          <div className="tsp-result-subtitle">{resultData.solved ? 'פתרת את החידה בצורה מושלמת!' : 'תוצאות'}</div>

          <div className="tsp-results-box">
            <div className="tsp-results-row">
              <span className="tsp-results-label">שלך:</span>
              <span className="tsp-results-value">{resultData.playerDistance} ק&quot;מ</span>
            </div>
            <div className="tsp-results-row">
              <span className="tsp-results-label">הטוב ביותר:</span>
              <span className="tsp-results-value">{optimalDistance} ק&quot;מ</span>
            </div>
            <div className={`tsp-result-message ${resultData.solved ? 'success' : 'fail'}`}>
              {resultData.solved
                ? '⭐ המסלול הקצר ביותר האפשרי!'
                : `🤏 המסלול ארוך ב-${resultData.playerDistance - optimalDistance} ק"מ מהטוב ביותר`}
            </div>
          </div>

          <div className="tsp-modal-buttons">
            <button className="tsp-modal-btn main" onClick={handleFinish}>
              קדימה לחידה הבאה! 🚀
            </button>
            <button className="tsp-modal-btn ghost" onClick={handlePlayAgain}>
              🔁 שחק שוב
            </button>
          </div>
        </div>
      </div>}
    </div>
  );
}
