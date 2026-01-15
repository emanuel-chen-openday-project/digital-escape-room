'use client';

import { useEffect, useState } from 'react';
import './GameIntro.css';

interface GameIntroProps {
  puzzleNumber: number;
  totalPuzzles: number;
  gameName: string;
  gameIcon: string;
  onComplete: () => void;
}

export default function GameIntro({
  puzzleNumber,
  totalPuzzles,
  gameName,
  gameIcon,
  onComplete
}: GameIntroProps) {
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'go' | 'done'>('intro');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Phase 1: Show intro for 1 second
    const timer = setTimeout(() => {
      setPhase('countdown');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Show "Go!" briefly
      setPhase('go');
      setTimeout(() => {
        setPhase('done');
        setTimeout(onComplete, 300);
      }, 400);
    }
  }, [phase, countdown, onComplete]);

  return (
    <div className={`game-intro-overlay ${phase === 'done' ? 'slide-out' : ''}`}>
      <div className="game-intro-backdrop" />

      <div className="game-intro-content">
        {/* Badge - always visible until done */}
        {phase !== 'done' && (
          <div className="game-intro-badge">
            🎯 חידה {puzzleNumber} מתוך {totalPuzzles}
          </div>
        )}

        {/* Intro content */}
        {phase === 'intro' && (
          <>
            <div className="game-intro-icon">{gameIcon}</div>
            <h1 className="game-intro-title">{gameName}</h1>
          </>
        )}

        {/* Countdown numbers */}
        {phase === 'countdown' && countdown > 0 && (
          <div className="game-intro-countdown" key={countdown}>
            {countdown}
          </div>
        )}

        {/* Go text */}
        {phase === 'go' && (
          <div className="game-intro-go">!יאללה</div>
        )}
      </div>
    </div>
  );
}
