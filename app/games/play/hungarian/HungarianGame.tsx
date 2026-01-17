'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
import './HungarianGame.css';

interface HungarianGameProps {
  onComplete: (result: GameResult) => void;
  onUseHint?: () => void;
}

export default function HungarianGame({ onComplete, onUseHint }: HungarianGameProps) {
  const gameStateRef = useRef<HungarianGameState>(createInitialGameState());

  const [showSplash, setShowSplash] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [assignments, setAssignments] = useState<Record<number, number>>({});
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState({ userTime: 0, optimalTime: 0, solved: false });
  const [hintText, setHintText] = useState('');
  const [showHint, setShowHint] = useState(false);

  // Start game
  const handleStartGame = useCallback(() => {
    setShowSplash(false);
    setGameStarted(true);
    gameStateRef.current.started = true;
    gameStateRef.current.startTime = Date.now();
  }, []);

  // Open courier modal
  const handleCourierClick = useCallback((courierId: number) => {
    if (gameStateRef.current.isComplete) return;
    setSelectedCourier(courierId);
    setShowModal(true);
  }, []);

  // Assign order to courier
  const handleAssignOrder = useCallback((orderId: number) => {
    if (selectedCourier === null) return;

    // Remove order from any other courier
    const newAssignments = { ...assignments };
    Object.keys(newAssignments).forEach(cId => {
      if (newAssignments[parseInt(cId)] === orderId) {
        delete newAssignments[parseInt(cId)];
      }
    });

    // Assign to selected courier
    newAssignments[selectedCourier] = orderId;
    setAssignments(newAssignments);
    gameStateRef.current.assignments = newAssignments;
    setShowModal(false);
    setSelectedCourier(null);
  }, [selectedCourier, assignments]);

  // Check solution
  const handleCheck = useCallback(() => {
    if (Object.keys(assignments).length !== 4) return;

    const userTime = getTotalTime(assignments);
    const optimal = getOptimalSolution();
    const solved = Math.abs(userTime - optimal.total) < 0.1;

    gameStateRef.current.isComplete = true;
    setResultData({ userTime, optimalTime: optimal.total, solved });
    setShowResult(true);
  }, [assignments]);

  // Show hint
  const handleHint = useCallback(() => {
    gameStateRef.current.hintsUsed++;
    const hint = getHint(gameStateRef.current);
    setHintText(hint);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3500);

    if (onUseHint) {
      onUseHint();
    }
  }, [onUseHint]);

  // Reset game
  const handleReset = useCallback(() => {
    setAssignments({});
    gameStateRef.current.assignments = {};
    gameStateRef.current.isComplete = false;
    setShowResult(false);
  }, []);

  // Exit game
  const handleExit = useCallback(() => {
    const timeSeconds = Math.floor((Date.now() - gameStateRef.current.startTime) / 1000);
    onComplete({
      solved: false,
      hintsUsed: gameStateRef.current.hintsUsed,
      timeSeconds
    });
  }, [onComplete]);

  // Finish and continue
  const handleFinish = useCallback(() => {
    const timeSeconds = Math.floor((Date.now() - gameStateRef.current.startTime) / 1000);
    onComplete({
      solved: resultData.solved,
      hintsUsed: gameStateRef.current.hintsUsed,
      timeSeconds
    });
  }, [onComplete, resultData.solved]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    handleReset();
  }, [handleReset]);

  const closeAllPanels = () => {
    setShowHelpPanel(false);
    setShowInfoPanel(false);
  };

  const totalTime = getTotalTime(assignments);
  const assignedCount = Object.keys(assignments).length;

  return (
    <div className="hungarian-container">
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
                יש <span className="hungarian-highlight">4 שליחים</span> על אופנועים ו-<span className="hungarian-highlight">4 משלוחים</span> שמחכים. כל שליח מתחיל באיסוף ההזמנה מהמסעדה, ולאחר מכן נוסע לבית שממנו בוצעה ההזמנה.
              </p>
            </div>

            <div className="hungarian-splash-section">
              <h3>🎯 המטרה</h3>
              <p>
                יש לשבץ כל שליח למשלוח אחד, כך שסך כל הזמנים ביחד יהיה <span className="hungarian-highlight">הנמוך ביותר</span>.
              </p>
              <p className="hungarian-tip">
                <strong>💡 טיפ:</strong> הטעות הנפוצה היא לתת לכל שליח את המשלוח הכי מהיר עבורו - אבל זה לא תמיד הפתרון הטוב ביותר!
              </p>
            </div>

            <div className="hungarian-splash-section">
              <h3>👆 איך משחקים?</h3>
              <ol>
                <li>מקישים על שליח כדי לפתוח את רשימת ההזמנות</li>
                <li>בוחרים הזמנה כדי לשבץ את השליח אליה</li>
                <li>חוזרים עד ששובצו כל 4 השליחים</li>
                <li>מקישים על &quot;בדיקה&quot; לגלות אם מצאתם את הפתרון הטוב ביותר!</li>
              </ol>
            </div>

            <button className="hungarian-start-btn" onClick={handleStartGame}>
              🚀 התחל משחק
            </button>
          </div>
        </div>
      )}

      {/* Game Board */}
      {gameStarted && (
        <>
          {/* Game Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            padding: '80px 16px 16px 16px',
            maxWidth: '600px',
            margin: '0 auto',
            height: 'calc(100vh - 100px)',
            alignContent: 'center'
          }}>
            {COURIERS.map(courier => {
              const assignedOrderId = assignments[courier.id];
              const assignedOrder = assignedOrderId ? ORDERS.find(o => o.id === assignedOrderId) : null;

              return (
                <div
                  key={courier.id}
                  onClick={() => handleCourierClick(courier.id)}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: assignedOrder ? `3px solid ${assignedOrder.color}` : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: courier.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '30px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    🏍️
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#333' }}>
                    {courier.name}
                  </div>
                  {assignedOrder ? (
                    <div style={{
                      background: `linear-gradient(135deg, ${assignedOrder.color}40, ${assignedOrder.color}20)`,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#333',
                      textAlign: 'center'
                    }}>
                      <div>📍 {assignedOrder.family}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>דרך {assignedOrder.restaurant}</div>
                      <div style={{ marginTop: '4px', fontWeight: 800, color: '#1565C0' }}>
                        {getTimeMinutes(courier, assignedOrder)} דק&apos;
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: '#f5f5f5',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      לחץ לשיבוץ
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* HUD */}
          <div className="hungarian-hud">
            <div className="hungarian-hud-stats">
              <div className="hungarian-stat">
                <span className="hungarian-stat-label">שובצו:</span>
                <span className="hungarian-stat-value">{assignedCount}/4</span>
              </div>
              <div className="hungarian-stat">
                <span className="hungarian-stat-label">זמן כולל:</span>
                <span className="hungarian-stat-value">{totalTime} דק&apos;</span>
              </div>
            </div>
            <button
              className={`hungarian-check-btn ${assignedCount === 4 ? 'active' : ''}`}
              onClick={handleCheck}
              disabled={assignedCount !== 4}
            >
              ✓ בדיקה
            </button>
          </div>

          {/* Top Buttons */}
          <div className="hungarian-top-buttons">
            <button className="hungarian-top-btn hungarian-info-btn" onClick={() => { closeAllPanels(); setShowInfoPanel(true); }}>
              🎓
            </button>
            <button className="hungarian-top-btn hungarian-help-btn" onClick={() => { closeAllPanels(); setShowHelpPanel(true); }}>
              ?
            </button>
            <button className="hungarian-top-btn hungarian-hint-btn" onClick={handleHint}>
              💡
            </button>
          </div>

          {/* Left Buttons */}
          <div className="hungarian-left-buttons">
            <button className="hungarian-left-btn hungarian-reset-btn" onClick={handleReset}>
              🔄
            </button>
            <button className="hungarian-left-btn hungarian-exit-btn" onClick={handleExit}>
              ✕
            </button>
          </div>

          {/* Overlay */}
          <div
            className={`hungarian-overlay ${showHelpPanel || showInfoPanel ? 'visible' : ''}`}
            onClick={closeAllPanels}
          />

          {/* Help Panel */}
          <div className={`hungarian-side-panel ${showHelpPanel ? 'open' : ''}`}>
            <div className="hungarian-panel-title">
              <span>🎮</span>
              <span>איך משחקים?</span>
            </div>

            <div className="hungarian-panel-section">
              <h3>📦 על המשחק</h3>
              <p>במשחק זה יש לנהל מערכת משלוחים עם 4 שליחים ו-4 הזמנות. לכל שליח יש זמן הגעה שונה לכל הזמנה.</p>
            </div>

            <div className="hungarian-panel-section">
              <h3>🎯 המטרה</h3>
              <p>לשבץ כל שליח להזמנה אחת, כך שסכום הזמנים הכולל יהיה הנמוך ביותר האפשרי.</p>
              <p style={{ marginTop: 10, color: '#e65100', fontWeight: 600 }}>שימו לב: המטרה היא למצוא את הזמן הכולל הנמוך ביותר לכל המערכת!</p>
            </div>

            <div className="hungarian-panel-section">
              <h3>👆 שלבי המשחק</h3>
              <ol>
                <li>מקישים על אחד השליחים</li>
                <li>בוחרים הזמנה מהרשימה</li>
                <li>חוזרים על התהליך עבור כל השליחים</li>
                <li>מקישים על בדיקה לסיום</li>
              </ol>
            </div>
          </div>
          <button
            className={`hungarian-panel-close ${showHelpPanel ? '' : 'hidden'}`}
            onClick={closeAllPanels}
          >
            ✕
          </button>

          {/* Info Panel */}
          <div className={`hungarian-info-panel ${showInfoPanel ? 'open' : ''}`}>
            <div className="hungarian-edu-icon">🛵</div>
            <div className="hungarian-edu-title">מה לומדים כאן?</div>

            <div className="hungarian-edu-section">
              <h3>🎮 על מה המשחק</h3>
              <p>המשחק מציג אתגר של שיבוץ: איך להתאים בין אנשים למשימות כך שהתוצאה הכוללת תהיה הטובה ביותר.</p>
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
              <p>התואר מלמד <strong>לקבל החלטות חכמות שמביאות לתוצאה הטובה ביותר</strong>. שיבוץ נכון = חיסכון בזמן, במאמץ ובכסף!</p>
            </div>

            <div className="hungarian-edu-section">
              <div className="hungarian-benefit-box">
                <p>בהנדסת תעשייה וניהול מפתחים דרך חשיבה שעוזרת להתמודד עם אתגרים כאלה.</p>
              </div>
            </div>
          </div>
          <button
            className={`hungarian-info-panel-close ${showInfoPanel ? '' : 'hidden'}`}
            onClick={closeAllPanels}
          >
            ✕
          </button>

          {/* Courier Modal */}
          {showModal && selectedCourier !== null && (
            <div className="hungarian-modal-overlay">
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
                          ? `משובץ ל${ORDERS.find(o => o.id === assignments[selectedCourier])?.family}`
                          : 'בחר הזמנה'}
                      </div>
                    </div>
                  </div>
                  <button className="hungarian-modal-close" onClick={() => setShowModal(false)}>
                    ✕
                  </button>
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

          {/* Hint Toast */}
          <div className={`hungarian-hint-toast ${showHint ? 'visible' : ''}`}>
            {hintText}
          </div>

          {/* Result Overlay */}
          <div className={`hungarian-result-overlay ${showResult ? 'show' : ''}`}>
            {resultData.solved && showResult && (
              <div className="hungarian-confetti">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="hungarian-confetti-piece"
                    style={{ '--delay': `${i * 0.1}s`, '--x': `${Math.random() * 100}%` } as React.CSSProperties}
                  />
                ))}
              </div>
            )}
            <div className={`hungarian-result-card ${resultData.solved ? 'success-card' : ''}`}>
              <div className="hungarian-result-icon">{resultData.solved ? '🏆' : '📊'}</div>
              <div className="hungarian-result-title">{resultData.solved ? 'מושלם!' : 'סיום'}</div>
              <div className="hungarian-result-subtitle">
                {resultData.solved ? 'מצאת את השיבוץ הטוב ביותר!' : 'תוצאות'}
              </div>

              <div className="hungarian-results-box">
                <div className="hungarian-results-row">
                  <span className="hungarian-results-label">הפתרון שלך:</span>
                  <span className="hungarian-results-value">{resultData.userTime} דק&apos;</span>
                </div>
                <div className="hungarian-results-row">
                  <span className="hungarian-results-label">הטוב ביותר:</span>
                  <span className="hungarian-results-value">{resultData.optimalTime} דק&apos;</span>
                </div>
                <div className={`hungarian-result-message ${resultData.solved ? 'success' : 'fail'}`}>
                  {resultData.solved
                    ? '⭐ השיבוץ האופטימלי!'
                    : `🤏 הפתרון ארוך ב-${(resultData.userTime - resultData.optimalTime).toFixed(1)} דק' מהטוב ביותר`}
                </div>
              </div>

              {!resultData.solved && (
                <div className="hungarian-optimal-list">
                  <h4>🏆 השיבוץ הטוב ביותר:</h4>
                  {Object.entries(getOptimalSolution().assignments).map(([cId, oId]) => {
                    const c = COURIERS.find(x => x.id === parseInt(cId));
                    const o = ORDERS.find(x => x.id === oId);
                    if (!c || !o) return null;
                    const t = getTimeMinutes(c, o);
                    return (
                      <div key={cId} className="hungarian-optimal-item">
                        <span style={{ color: c.color }}>●</span>
                        {c.name} → {o.family} ({t} דק&apos;)
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="hungarian-modal-buttons">
                <button className="hungarian-modal-btn main" onClick={handleFinish}>
                  קדימה לחידה הבאה! 🚀
                </button>
                <button className="hungarian-modal-btn ghost" onClick={handlePlayAgain}>
                  🔁 שחק שוב
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
