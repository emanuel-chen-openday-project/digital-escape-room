'use client';

import { useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'doors' | 'done'>('intro');

  const startSequence = useCallback(() => {
    // Phase 1: Show intro (1 second)
    setTimeout(() => {
      setPhase('countdown');
      setCountdown(3);
    }, 1000);
  }, []);

  useEffect(() => {
    startSequence();
  }, [startSequence]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      // Animate the countdown number
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished, open doors
      setPhase('doors');

      // Animate doors opening
      gsap.to('.game-intro-door-left', {
        x: '-100%',
        duration: 0.8,
        ease: 'power2.inOut'
      });
      gsap.to('.game-intro-door-right', {
        x: '100%',
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: () => {
          setPhase('done');
          setTimeout(onComplete, 200);
        }
      });
    }
  }, [countdown, onComplete]);

  return (
    <div className="game-intro-overlay">
      {/* Background */}
      <div className="game-intro-backdrop" />

      {/* Content - shown during intro and countdown */}
      {phase !== 'done' && (
        <div className={`game-intro-content ${phase === 'doors' ? 'fade-out' : ''}`}>
          {/* Puzzle indicator */}
          <div className="game-intro-puzzle-badge">
            🔧 חידה {puzzleNumber} מתוך {totalPuzzles}
          </div>

          {/* Game icon and name */}
          <div className="game-intro-icon">{gameIcon}</div>
          <h1 className="game-intro-title">{gameName}</h1>

          {/* Countdown */}
          {phase === 'countdown' && countdown !== null && countdown > 0 && (
            <div className="game-intro-countdown" key={countdown}>
              {countdown}
            </div>
          )}

          {/* Go text */}
          {countdown === 0 && phase === 'countdown' && (
            <div className="game-intro-go">!יאללה</div>
          )}
        </div>
      )}

      {/* Industrial Doors */}
      <div className="game-intro-doors">
        <div className="game-intro-door-left">
          <div className="door-texture">
            <div className="door-stripe" />
            <div className="door-stripe" />
            <div className="door-stripe" />
          </div>
          <div className="door-handle" />
        </div>
        <div className="game-intro-door-right">
          <div className="door-texture">
            <div className="door-stripe" />
            <div className="door-stripe" />
            <div className="door-stripe" />
          </div>
          <div className="door-handle" />
        </div>
      </div>
    </div>
  );
}
