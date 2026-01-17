// @ts-nocheck
'use client';

// Hungarian Game - React component converted 1:1 from original HTML
// Features: Babylon.js 3D scene, motorcycles, restaurants, houses, route lines, animations

import { useEffect, useRef, useState, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import {
  COURIERS,
  ORDERS,
  GameResult,
  HungarianGameState,
  createInitialGameState
} from './types';
import {
  getTimeMinutes,
  getTotalTime,
  getOptimalSolution,
  getHint
} from './gameLogic';
import {
  createHungarianScene,
  updateAssignmentLines,
  animateCouriersDelivery,
  resetCourierPositions,
  SceneRefs,
  CourierMesh
} from './scene';
import './HungarianGame.css';

interface HungarianGameProps {
  onComplete: (result: GameResult) => void;
}

export default function HungarianGame({ onComplete }: HungarianGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRefsRef = useRef<SceneRefs | null>(null);
  const gameStateRef = useRef<HungarianGameState>(createInitialGameState());
  const hornSoundRef = useRef<HTMLAudioElement | null>(null);
  const ridingSoundRef = useRef<HTMLAudioElement | null>(null);

  // UI State
  const [showSplash, setShowSplash] = useState(true);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Record<number, number>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ userTime: 0, optimalTime: 0, solved: false });
  const [hintText, setHintText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize audio
  useEffect(() => {
    hornSoundRef.current = new Audio('/audio/Motorcycle_horn.mp3');
    hornSoundRef.current.volume = 0.7;

    ridingSoundRef.current = new Audio('/audio/Motorcycle_riding_noise.mp3');
    ridingSoundRef.current.volume = 0.5;
    ridingSoundRef.current.loop = true;

    return () => {
      if (ridingSoundRef.current) {
        ridingSoundRef.current.pause();
      }
    };
  }, []);

  // Play horn sound
  const playHorn = useCallback(() => {
    if (hornSoundRef.current) {
      hornSoundRef.current.currentTime = 0;
      hornSoundRef.current.play().catch(() => {});
      // Stop after 1 second to not play second honk
      setTimeout(() => {
        if (hornSoundRef.current) {
          hornSoundRef.current.pause();
          hornSoundRef.current.currentTime = 0;
        }
      }, 1000);
    }
  }, []);

  // Start/stop riding sound
  const startRidingSound = useCallback(() => {
    if (ridingSoundRef.current) {
      ridingSoundRef.current.currentTime = 0;
      ridingSoundRef.current.play().catch(() => {});
    }
  }, []);

  const stopRidingSound = useCallback(() => {
    if (ridingSoundRef.current) {
      ridingSoundRef.current.pause();
      ridingSoundRef.current.currentTime = 0;
    }
  }, []);

  // Initialize Babylon.js scene
  useEffect(() => {
    if (!canvasRef.current || showSplash) return;

    const sceneRefs = createHungarianScene(canvasRef.current);
    sceneRefsRef.current = sceneRefs;

    // Click handler for couriers
    sceneRefs.scene.onPointerDown = (evt, pick) => {
      const gs = gameStateRef.current;
      if (!gs.started || gs.isComplete || gs.isAnimating) return;

      if (pick.hit) {
        let mesh = pick.pickedMesh;
        while (mesh && !(mesh as any).courierId) {
          mesh = mesh.parent as BABYLON.AbstractMesh;
        }
        if (mesh && (mesh as any).courierId) {
          const courierId = (mesh as any).courierId;
          playHorn();
          setSelectedCourier(courierId);
          setShowCourierModal(true);

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
  }, [showSplash, playHorn]);

  // Update assignment lines when assignments change
  useEffect(() => {
    if (!sceneRefsRef.current || showSplash) return;

    const sceneRefs = sceneRefsRef.current;
    sceneRefs.assignmentLines = updateAssignmentLines(
      sceneRefs.scene,
      sceneRefs.courierMeshes,
      sceneRefs.assignmentLines,
      assignments
    );
  }, [assignments, showSplash]);

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

  // Open courier modal
  const handleOpenCourierModal = useCallback((courierId: number) => {
    playHorn();
    setSelectedCourier(courierId);
    setShowCourierModal(true);
  }, [playHorn]);

  // Assign order to courier
  const handleAssignOrder = useCallback((orderId: number) => {
    if (selectedCourier === null) return;

    setAssignments(prev => {
      const newAssignments = { ...prev };
      // Remove order from any other courier
      Object.keys(newAssignments).forEach(cId => {
        if (newAssignments[parseInt(cId)] === orderId) {
          delete newAssignments[parseInt(cId)];
        }
      });
      // Assign to selected courier
      newAssignments[selectedCourier] = orderId;
      gameStateRef.current.assignments = newAssignments;
      return newAssignments;
    });

    setShowCourierModal(false);
    setSelectedCourier(null);
  }, [selectedCourier]);

  // Close modal
  const closeModal = useCallback(() => {
    setShowCourierModal(false);
    setSelectedCourier(null);
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
  const handleCheckSolution = useCallback(async () => {
    if (Object.keys(assignments).length !== 4 || isAnimating) return;

    const sceneRefs = sceneRefsRef.current;
    if (!sceneRefs) return;

    setIsAnimating(true);
    gameStateRef.current.isAnimating = true;

    // Start riding sound
    startRidingSound();

    // Wait 800ms then animate
    await new Promise(resolve => setTimeout(resolve, 800));

    await animateCouriersDelivery(
      sceneRefs.scene,
      sceneRefs.courierMeshes,
      assignments,
      sceneRefs.assignmentLines
    );

    stopRidingSound();
    setIsAnimating(false);
    gameStateRef.current.isAnimating = false;
    gameStateRef.current.isComplete = true;

    // Calculate results
    const userTime = getTotalTime(assignments);
    const optimal = getOptimalSolution();
    const solved = Math.abs(userTime - optimal.total) < 0.1;

    setCelebrationData({ userTime, optimalTime: optimal.total, solved });
    setShowCelebration(true);
  }, [assignments, isAnimating, startRidingSound, stopRidingSound]);

  // Reset game
  const handleReset = useCallback(() => {
    const sceneRefs = sceneRefsRef.current;
    if (!sceneRefs) return;

    // Dispose lines
    Object.values(sceneRefs.assignmentLines).forEach(l => l.dispose());
    sceneRefs.assignmentLines = {};

    // Reset courier positions
    resetCourierPositions(sceneRefs.courierMeshes);

    // Reset state
    setAssignments({});
    setShowCelebration(false);
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

  const assignedCount = Object.keys(assignments).length;
  const totalTime = getTotalTime(assignments);

  return (
    <div className="hungarian-game-container">
      {/* Splash Screen */}
      {showSplash && (
        <div className="hungarian-splash">
          <div className="hungarian-splash-content">
            <div className="hungarian-splash-icon">🏍️</div>
            <h1 className="hungarian-splash-title">מאסטר המשלוחים</h1>
            <p className="hungarian-splash-subtitle">תתכנן, תשבץ, תנצח!</p>

            <div className="hungarian-splash-section">
              <h3>📦 על המשחק</h3>
              <p>
                יש <span className="highlight-text">4 שליחים</span> על אופנועים ו-<span className="highlight-text">4 משלוחים</span> שמחכים. כל שליח מתחיל באיסוף ההזמנה מהמסעדה, ולאחר מכן נוסע לבית שממנו בוצעה ההזמנה. השליחים פזורים במקומות שונים על המפה, ולכן לכל אחד ייקח זמן שונה להשלים כל משלוח.
              </p>
            </div>

            <div className="hungarian-splash-section">
              <h3>🎯 המטרה</h3>
              <p>
                יש לשבץ כל שליח למשלוח אחד, כך שסך כל הזמנים ביחד יהיה <span className="highlight-text">הנמוך ביותר</span>.
              </p>
              <p style={{ marginTop: 12 }}>
                <span className="highlight-text">💡 טיפ:</span> הטעות הנפוצה היא לתת לכל שליח את המשלוח הכי מהיר עבורו - אבל זה לא תמיד הפתרון הטוב ביותר! לפני השיבוץ, כדאי לבדוק את הזמנים של כל השליחים לכל משלוח ולחשוב על התמונה הכוללת.
              </p>
            </div>

            <div className="hungarian-splash-section">
              <h3>👆 איך משחקים?</h3>
              <ol>
                <li>מקישים על שליח (אופנוע) כדי לפתוח את רשימת ההזמנות.</li>
                <li>בוחרים הזמנה כדי לשבץ את השליח אליה.</li>
                <li>חוזרים על התהליך עד ששובצו כל 4 השליחים.</li>
                <li>מקישים על &quot;בדיקה&quot; כדי לגלות אם נמצא הפתרון הטוב ביותר!</li>
              </ol>
            </div>

            <button className="hungarian-start-btn" onClick={handleStartGame}>
              🚀 התחל משחק
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      {!showSplash && <canvas ref={canvasRef} className="hungarian-canvas" />}

      {/* Top Bar - visible after splash */}
      {!showSplash && (
        <div className="hungarian-top-bar">
          <div className="hungarian-side-buttons-left">
            <button className="hungarian-side-btn btn-green" onClick={() => { closeAllPanels(); setShowInfoPanel(true); }} title="מידע">🎓</button>
            <button className="hungarian-side-btn btn-light-blue" onClick={() => { closeAllPanels(); setShowHelpPanel(true); }} title="עזרה">?</button>
            <button className="hungarian-side-btn btn-yellow" onClick={handleShowHint} title="רמז">💡</button>
          </div>

          <div className="hungarian-center-panel">
            <div className="hungarian-stat-box">
              <span className="hungarian-stat-label">שובצו:</span>
              <span className="hungarian-stat-value">{assignedCount}/4</span>
            </div>
            <div className="hungarian-stat-box">
              <span className="hungarian-stat-label">זמן כולל:</span>
              <span className="hungarian-stat-value">{totalTime} דק&apos;</span>
            </div>
            <button
              className={`hungarian-check-btn ${assignedCount === 4 ? 'active' : ''}`}
              onClick={handleCheckSolution}
              disabled={assignedCount !== 4 || isAnimating}
            >
              ✓ בדיקה
            </button>
          </div>

          <div className="hungarian-side-buttons-right">
            <button className="hungarian-side-btn btn-red" onClick={handleReset} title="איפוס">🔄</button>
          </div>
        </div>
      )}

      {/* Overlay for panels */}
      <div
        className={`hungarian-overlay ${showHelpPanel || showInfoPanel ? 'visible' : ''}`}
        onClick={closeAllPanels}
      />

      {/* Hint Toast */}
      <div className={`hungarian-hint-toast ${showHint ? 'visible' : ''}`}>
        {hintText}
      </div>

      {/* Help Panel */}
      <div className={`hungarian-side-panel ${showHelpPanel ? 'open' : ''}`}>
        <button className="hungarian-panel-close" onClick={closeAllPanels}>✕</button>
        <div className="hungarian-panel-title">🎮 איך משחקים?</div>

        <div className="hungarian-panel-section">
          <h3>📦 על המשחק</h3>
          <p>במשחק זה יש לנהל מערכת משלוחים עם 4 שליחים ו-4 הזמנות. כל הזמנה כוללת מסעדה (משם השליח אוסף את האוכל) ומשפחה (לשם הוא מוסר). לכל שליח יש זמן הגעה שונה לכל הזמנה, בהתאם למיקום שלו על המפה.</p>
        </div>

        <div className="hungarian-panel-section">
          <h3>🎯 מה המטרה?</h3>
          <p>לשבץ כל שליח להזמנה אחת, כך שסכום הזמנים הכולל של כל השליחים יחד יהיה הנמוך ביותר האפשרי.</p>
          <p style={{ marginTop: 10, color: '#e65100', fontWeight: 600 }}>שימו לב: המטרה היא למצוא את הזמן הכולל הנמוך ביותר לכל המערכת, לא את הזמן הקצר ביותר לכל שליח בנפרד!</p>
        </div>

        <div className="hungarian-panel-section">
          <h3>👆 שלבי המשחק</h3>
          <p>ראשית, מקישים על אחד האופנועים במפה. זה יפתח חלון שמציג את כל ההזמנות, ולכל אחת מוצג כמה זמן ייקח לשליח להגיע.</p>
          <p style={{ marginTop: 8 }}>שנית, בחר הזמנה עבור השליח. תראה קו צבעוני שמראה את המסלול שלו.</p>
          <p style={{ marginTop: 8 }}>שלישית, חזור על התהליך עבור שאר השליחים עד ששיבצת את כולם.</p>
          <p style={{ marginTop: 8 }}>לבסוף, מקישים על כפתור הבדיקה כדי לגלות אם נמצא הפתרון הטוב ביותר!</p>
        </div>

        <div className="hungarian-tip-box">
          <h4>💡 איך לחשוב נכון?</h4>
          <p>הטעות הנפוצה היא לשבץ כל שליח להזמנה שהוא מגיע אליה הכי מהר. זה לא תמיד הפתרון הטוב ביותר!</p>
          <p style={{ marginTop: 8 }}>לפני שיבוץ שליח, כדאי לבדוק גם את הזמנים של השליחים האחרים לאותה הזמנה. השאלה היא: אם משבצים את השליח הזה כאן, מה יקרה לשאר?</p>
        </div>
      </div>

      {/* Info Panel */}
      <div className={`hungarian-info-panel ${showInfoPanel ? 'open' : ''}`}>
        <button className="hungarian-panel-close" onClick={closeAllPanels}>✕</button>
        <div className="hungarian-edu-icon">🛵</div>
        <div className="hungarian-edu-title">מה לומדים כאן?</div>

        <div className="hungarian-edu-section">
          <h3>🎮 על מה המשחק</h3>
          <p>המשחק מציג אתגר של שיבוץ: איך להתאים בין אנשים למשימות כך שהתוצאה הכוללת תהיה הטובה ביותר. זו בעיה קלאסית שמופיעה בתחומים רבים - מניהול משלוחים ועד תכנון משמרות.</p>
        </div>

        <div className="hungarian-edu-section">
          <h3>🔧 איפה זה בשימוש</h3>
          <div className="hungarian-uses-list">
            <span className="hungarian-use-tag">ניהול משלוחים</span>
            <span className="hungarian-use-tag">תזמון עובדים</span>
            <span className="hungarian-use-tag">חלוקת משימות</span>
            <span className="hungarian-use-tag">תכנון משמרות</span>
          </div>
        </div>

        <div className="hungarian-edu-section">
          <h3>🎓 למה הנדסת תעשייה וניהול</h3>
          <p>התואר בהנדסת תעשייה וניהול מלמד, בין היתר, <strong>לקבל החלטות חכמות שמביאות לתוצאה הטובה ביותר</strong>. שיבוץ נכון = חיסכון בזמן, במאמץ ובכסף!</p>
        </div>

        <div className="hungarian-edu-section">
          <div className="hungarian-benefit-box">
            <p>בהנדסת תעשייה וניהול מפתחים דרך חשיבה שעוזרת להתמודד עם אתגרים כאלה.</p>
          </div>
        </div>
      </div>

      {/* Courier Modal */}
      {showCourierModal && selectedCourier !== null && (
        <div className="hungarian-courier-modal">
          <div className="hungarian-modal-content">
            <div className="hungarian-modal-header">
              <div className="hungarian-modal-courier-info">
                <div
                  className="hungarian-modal-courier-avatar"
                  style={{ background: COURIERS.find(c => c.id === selectedCourier)?.color }}
                >
                  🏍️
                </div>
                <div>
                  <div className="hungarian-modal-courier-name">
                    {COURIERS.find(c => c.id === selectedCourier)?.name}
                  </div>
                  <div className="hungarian-modal-courier-status">
                    {assignments[selectedCourier]
                      ? 'משובץ ל' + ORDERS.find(o => o.id === assignments[selectedCourier])?.family
                      : 'בחר הזמנה לשליחות'}
                  </div>
                </div>
              </div>
              <button className="hungarian-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="hungarian-modal-body">
              <div className="hungarian-modal-section-title">⏱️ זמני הגעה להזמנות</div>
              <div className="hungarian-time-matrix">
                {ORDERS.map(order => {
                  const courier = COURIERS.find(c => c.id === selectedCourier)!;
                  const time = getTimeMinutes(courier, order);
                  const assignedTo = Object.entries(assignments).find(([_, oId]) => oId === order.id);
                  const isThis = assignedTo && parseInt(assignedTo[0]) === selectedCourier;
                  const isOther = assignedTo && parseInt(assignedTo[0]) !== selectedCourier;
                  const otherCourier = isOther ? COURIERS.find(c => c.id === parseInt(assignedTo[0])) : null;

                  return (
                    <div
                      key={order.id}
                      className={`hungarian-matrix-row ${isThis ? 'assigned' : ''} ${isOther ? 'assigned-other' : ''}`}
                      onClick={() => !isOther && handleAssignOrder(order.id)}
                    >
                      <div className="hungarian-matrix-row-info">
                        <div className="hungarian-matrix-family-dot" style={{ background: order.color }} />
                        <div>
                          <div className="hungarian-matrix-family-name">{order.family}</div>
                          <div className="hungarian-matrix-restaurant">דרך {order.restaurant}</div>
                        </div>
                      </div>
                      <div className="hungarian-matrix-time">
                        <span className="hungarian-matrix-time-value">{time} דק&apos;</span>
                        {isOther ? (
                          <span className="hungarian-assigned-badge">{otherCourier?.name}</span>
                        ) : (
                          <button className="hungarian-matrix-select-btn">
                            {isThis ? '✓' : 'בחר'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebration */}
      {showCelebration && (
        <div className="hungarian-celebration">
          <div className="hungarian-celeb-card">
            <div className="hungarian-celeb-icon">
              {celebrationData.solved ? '🏆' : celebrationData.userTime - celebrationData.optimalTime < 3 ? '🎉' : '💪'}
            </div>
            <h2 className="hungarian-celeb-title">
              {celebrationData.solved ? 'מושלם!' : celebrationData.userTime - celebrationData.optimalTime < 3 ? 'כמעט מושלם!' : 'סיימת!'}
            </h2>

            <div className="hungarian-results-grid">
              <div className="hungarian-result-box user">
                <div className="hungarian-result-label">הפתרון שלך</div>
                <div className="hungarian-result-value">{celebrationData.userTime} דק&apos;</div>
              </div>
              <div className="hungarian-result-box optimal">
                <div className="hungarian-result-label">הפתרון הטוב ביותר</div>
                <div className="hungarian-result-value">{celebrationData.optimalTime} דק&apos;</div>
              </div>
            </div>

            <div className="hungarian-optimal-list">
              <h4>🏆 השיבוץ הטוב ביותר:</h4>
              <div className="hungarian-optimal-list-content">
                {Object.entries(getOptimalSolution().assignments).map(([cId, oId]) => {
                  const c = COURIERS.find(x => x.id === parseInt(cId));
                  const o = ORDERS.find(x => x.id === oId);
                  if (!c || !o) return null;
                  const t = getTimeMinutes(c, o);
                  return (
                    <div key={cId} className="hungarian-optimal-item">
                      <span style={{ color: c.color }}>●</span> {c.name} → {o.family} ({t} דק&apos;)
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hungarian-celeb-buttons">
              <button className="hungarian-celeb-btn primary" onClick={handleContinue}>
                קדימה לחידה הבאה! 🚀
              </button>
              <button className="hungarian-celeb-btn secondary" onClick={handlePlayAgain}>
                🔄 שחק שוב
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
