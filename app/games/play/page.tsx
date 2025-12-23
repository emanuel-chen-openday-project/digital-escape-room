'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function GamePlay() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { nickname, isGameActive, totalScore, completeGame, resetGame } = useGame();

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated or no active game
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else if (!isGameActive) {
        router.push('/games');
      }
    }
  }, [user, authLoading, isGameActive, router]);

  // Entry animations
  useEffect(() => {
    if (authLoading || !user || !isGameActive) return;

    const tl = gsap.timeline();

    tl.from(headerRef.current, {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    })
    .from(contentRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, '-=0.4');

    // Animate gears
    gsap.to('.gear-spin-slow', {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: 'none',
    });

    gsap.to('.gear-spin-fast', {
      rotation: -360,
      duration: 12,
      repeat: -1,
      ease: 'none',
    });
  }, [authLoading, user, isGameActive]);

  const handleCompleteGame = async () => {
    try {
      await completeGame();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing game:', error);
    }
  };

  const handleExitGame = async () => {
    resetGame();
    router.push('/dashboard');
  };

  // Generate stable random positions for particles
  const particles = useMemo(() =>
    [...Array(15)].map((_, i) => ({
      id: i,
      left: `${(i * 7 + 5) % 100}%`,
      top: `${(i * 9 + 3) % 100}%`,
      delay: `${(i * 0.2) % 3}s`,
      duration: `${2 + (i % 4)}s`,
    })),
  []);

  if (authLoading || !isGameActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden"
    >
      {/* Animated Background Gears */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="gear-spin-slow absolute -top-20 -right-20 w-64 h-64 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400 fill-current">
            <path d="M50 10 L54 10 L56 20 L60 21 L66 12 L70 14 L68 24 L72 27 L80 22 L82 26 L74 32 L76 36 L86 36 L86 40 L76 42 L74 46 L82 54 L78 58 L68 52 L64 56 L68 66 L64 68 L56 60 L52 62 L52 72 L48 72 L46 62 L42 60 L34 68 L30 64 L38 56 L34 52 L24 58 L20 54 L28 46 L26 42 L16 40 L16 36 L26 34 L28 30 L20 22 L24 18 L34 24 L38 20 L36 10 L40 10 L44 20 L48 20 Z M50 35 A15 15 0 0 0 50 65 A15 15 0 0 0 50 35" />
          </svg>
        </div>

        <div className="gear-spin-fast absolute bottom-20 -left-10 w-40 h-40 opacity-15">
          <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400 fill-current">
            <path d="M50 10 L54 10 L56 20 L60 21 L66 12 L70 14 L68 24 L72 27 L80 22 L82 26 L74 32 L76 36 L86 36 L86 40 L76 42 L74 46 L82 54 L78 58 L68 52 L64 56 L68 66 L64 68 L56 60 L52 62 L52 72 L48 72 L46 62 L42 60 L34 68 L30 64 L38 56 L34 52 L24 58 L20 54 L28 46 L26 42 L16 40 L16 36 L26 34 L28 30 L20 22 L24 18 L34 24 L38 20 L36 10 L40 10 L44 20 L48 20 Z M50 35 A15 15 0 0 0 50 65 A15 15 0 0 0 50 35" />
          </svg>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div
        ref={headerRef}
        className="relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4"
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{nickname}</p>
              <p className="text-blue-300 text-sm">ניקוד: {totalScore}</p>
            </div>
          </div>

          <button
            onClick={handleExitGame}
            className="text-slate-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={contentRef}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100vh-80px)]"
      >
        {/* Placeholder Content */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-blue-400/50">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            כאן יופיעו החידות
          </h2>

          <p className="text-blue-200 mb-8">
            הסיור במפעל עם שלוש החידות יתווסף בקרוב...
          </p>

          {/* Station Progress */}
          <div className="flex justify-center gap-2 mb-8">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i === 0
                    ? 'bg-gradient-to-br from-blue-400 to-cyan-400'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <p className="text-slate-400 text-sm mb-6">
            תחנה 1 מתוך 10
          </p>

          {/* Test Complete Button */}
          <button
            onClick={handleCompleteGame}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              סיים משחק (לבדיקה)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
