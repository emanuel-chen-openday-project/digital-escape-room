'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function GamesIntro() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { startGame } = useGame();

  const [showModal, setShowModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gearsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Entry animations
  useEffect(() => {
    if (authLoading || !user) return;

    const tl = gsap.timeline();

    // Animate gears first
    tl.from('.gear', {
      scale: 0,
      rotation: -180,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'back.out(1.7)',
    })
    .from(titleRef.current, {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.5')
    .from(subtitleRef.current, {
      y: -30,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, '-=0.4')
    .from(textRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
    }, '-=0.3')
    .from(buttonRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    }, '-=0.2');

    // Continuous gear rotation
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

    gsap.to('.gear-spin-medium', {
      rotation: 360,
      duration: 15,
      repeat: -1,
      ease: 'none',
    });
  }, [authLoading, user]);

  // Modal animation
  useEffect(() => {
    if (showModal && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    }
  }, [showModal]);

  const handleStartClick = () => {
    gsap.to(buttonRef.current, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
      onComplete: () => setShowModal(true),
    });
  };

  const validateNickname = (value: string): string => {
    if (value.length < 2) {
      return 'הכינוי חייב להכיל לפחות 2 תווים';
    }
    if (value.length > 15) {
      return 'הכינוי יכול להכיל עד 15 תווים';
    }
    return '';
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    if (error) {
      setError(validateNickname(value));
    }
  };

  const handleSubmitNickname = async () => {
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsStarting(true);
    try {
      await startGame(nickname.trim());
      router.push('/games/play');
    } catch (err) {
      console.error('Error starting game:', err);
      setError('שגיאה בהתחלת המשחק. נסו שוב.');
      setIsStarting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitNickname();
    }
  };

  // Generate stable random positions for particles
  const particles = useMemo(() =>
    [...Array(20)].map((_, i) => ({
      id: i,
      left: `${(i * 5 + 2) % 100}%`,
      top: `${(i * 7 + 3) % 100}%`,
      delay: `${(i * 0.15) % 3}s`,
      duration: `${2 + (i % 4)}s`,
    })),
  []);

  if (authLoading) {
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
      <div ref={gearsRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gear top-left */}
        <div className="gear gear-spin-slow absolute -top-20 -right-20 w-64 h-64 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400 fill-current">
            <path d="M50 10 L54 10 L56 20 L60 21 L66 12 L70 14 L68 24 L72 27 L80 22 L82 26 L74 32 L76 36 L86 36 L86 40 L76 42 L74 46 L82 54 L78 58 L68 52 L64 56 L68 66 L64 68 L56 60 L52 62 L52 72 L48 72 L46 62 L42 60 L34 68 L30 64 L38 56 L34 52 L24 58 L20 54 L28 46 L26 42 L16 40 L16 36 L26 34 L28 30 L20 22 L24 18 L34 24 L38 20 L36 10 L40 10 L44 20 L48 20 Z M50 35 A15 15 0 0 0 50 65 A15 15 0 0 0 50 35" />
          </svg>
        </div>

        {/* Medium gear top-right */}
        <div className="gear gear-spin-fast absolute top-20 -left-10 w-40 h-40 opacity-15">
          <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400 fill-current">
            <path d="M50 10 L54 10 L56 20 L60 21 L66 12 L70 14 L68 24 L72 27 L80 22 L82 26 L74 32 L76 36 L86 36 L86 40 L76 42 L74 46 L82 54 L78 58 L68 52 L64 56 L68 66 L64 68 L56 60 L52 62 L52 72 L48 72 L46 62 L42 60 L34 68 L30 64 L38 56 L34 52 L24 58 L20 54 L28 46 L26 42 L16 40 L16 36 L26 34 L28 30 L20 22 L24 18 L34 24 L38 20 L36 10 L40 10 L44 20 L48 20 Z M50 35 A15 15 0 0 0 50 65 A15 15 0 0 0 50 35" />
          </svg>
        </div>

        {/* Small gear bottom-right */}
        <div className="gear gear-spin-medium absolute bottom-32 -right-5 w-32 h-32 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-300 fill-current">
            <path d="M50 10 L54 10 L56 20 L60 21 L66 12 L70 14 L68 24 L72 27 L80 22 L82 26 L74 32 L76 36 L86 36 L86 40 L76 42 L74 46 L82 54 L78 58 L68 52 L64 56 L68 66 L64 68 L56 60 L52 62 L52 72 L48 72 L46 62 L42 60 L34 68 L30 64 L38 56 L34 52 L24 58 L20 54 L28 46 L26 42 L16 40 L16 36 L26 34 L28 30 L20 22 L24 18 L34 24 L38 20 L36 10 L40 10 L44 20 L48 20 Z M50 35 A15 15 0 0 0 50 65 A15 15 0 0 0 50 35" />
          </svg>
        </div>

        {/* Large gear bottom-left */}
        <div className="gear gear-spin-slow absolute -bottom-32 -left-20 w-72 h-72 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-sky-400 fill-current">
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

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Factory Icon */}
        <div ref={subtitleRef} className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="text-4xl md:text-5xl font-black text-white mb-4 text-center leading-tight"
        >
          חדר הבריחה הדיגיטלי
        </h1>

        {/* Explanation Card */}
        <div
          ref={textRef}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md mx-auto border border-white/20 shadow-2xl mb-8"
        >
          <div className="text-center space-y-4">
            <p className="text-2xl font-bold text-white">
              ברוכים הבאים למפעל!
            </p>
            <div className="text-lg text-blue-100 leading-relaxed space-y-3">
              <p>
                נתקעתם בפנים ויש רק דרך אחת לצאת -
                <span className="text-cyan-300 font-semibold"> לפתור שלוש חידות</span>.
              </p>
              <p>
                בכל חידה תקבלו הוראות.
                <br />
                קראו, חשבו, פתרו.
              </p>
              <p className="text-white font-semibold">
                רק מי שיפצח את כולן יצליח לברוח.
              </p>
            </div>
            <div className="pt-4">
              <p className="text-xl text-cyan-300 font-bold animate-pulse">
                מוכנים?
              </p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          ref={buttonRef}
          onClick={handleStartClick}
          className="group relative px-12 py-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl text-white text-xl font-bold shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span className="relative z-10 flex items-center gap-3">
            יאללה, בואו נתחיל!
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        {/* Back to dashboard link */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 text-blue-300 hover:text-white transition-colors text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          חזרה לדף הבית
        </button>
      </div>

      {/* Nickname Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 w-full max-w-sm border border-white/20 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                איך קוראים לך?
              </h2>
              <p className="text-blue-200 text-sm">
                הכינוי שלך יופיע על המסך הגדול
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={nickname}
                  onChange={handleNicknameChange}
                  onKeyPress={handleKeyPress}
                  placeholder="הכינוי שלי..."
                  maxLength={15}
                  className={`w-full px-5 py-4 bg-white/10 border-2 ${
                    error ? 'border-red-400' : 'border-white/20 focus:border-cyan-400'
                  } rounded-xl text-white placeholder-slate-400 text-lg text-center outline-none transition-colors`}
                  autoFocus
                />
                {error && (
                  <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
                )}
                <p className="text-slate-400 text-xs mt-2 text-center">
                  {nickname.length}/15 תווים
                </p>
              </div>

              <button
                onClick={handleSubmitNickname}
                disabled={isStarting || nickname.length < 2}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isStarting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    מתחיל...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    קדימה!
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
