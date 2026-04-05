// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuth } from '@/lib/hooks/useAuth';

const FactoryTour = dynamic(() => import('./FactoryTour'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">טוען את הסיור במפעל...</p>
      </div>
    </div>
  )
});

export default function GamePlay() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { nickname, sessionId, isGameActive, finishGame, startStage, completeStage, useHint } = useGame();
  const isFinishingRef = useRef(false);
  const [showFsBtn, setShowFsBtn] = useState(false);

  // Ensure fullscreen is active (may be lost during SPA navigation on iPad/iOS)
  useEffect(() => {
    const fsElement = document.fullscreenElement || (document as any).webkitFullscreenElement;
    if (!fsElement) {
      const el = document.documentElement;
      const requestFs = el.requestFullscreen?.bind(el) || (el as any).webkitRequestFullscreen?.bind(el);
      if (requestFs) requestFs().catch(() => {});
    }

    // Show fullscreen button if fullscreen didn't engage after a short delay
    const timer = setTimeout(() => {
      const el = document.documentElement;
      const hasApi = !!(el.requestFullscreen || (el as any).webkitRequestFullscreen);
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!fsEl && hasApi) setShowFsBtn(true);
    }, 1200);

    const handleFsChange = () => {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      setShowFsBtn(!fsEl);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Redirect if not authenticated or no active game
  useEffect(() => {
    if (!authLoading && !isFinishingRef.current) {
      if (!user) {
        router.push('/');
      } else if (!isGameActive) {
        router.push('/games');
      }
    }
  }, [user, authLoading, isGameActive, router]);

  const handleTourComplete = async () => {
    try {
      isFinishingRef.current = true;
      // Exit fullscreen BEFORE navigating to prevent viewport distortion (with webkit fallback for iOS)
      const fsElement = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (fsElement) {
        const exitFs = document.exitFullscreen?.bind(document) || (document as any).webkitExitFullscreen?.bind(document);
        if (exitFs) await exitFs();
      }
      router.push('/dashboard');
      await finishGame();
    } catch (error) {
      console.error('Error completing game:', error);
      router.push('/dashboard');
    }
  };

  if (authLoading || !isGameActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleRequestFullscreen = () => {
    const el = document.documentElement;
    const requestFs = el.requestFullscreen?.bind(el) || (el as any).webkitRequestFullscreen?.bind(el);
    if (requestFs) requestFs().catch(() => {});
  };

  return (
    <>
      <FactoryTour
        nickname={nickname || 'אורח'}
        sessionId={sessionId || undefined}
        onTourComplete={handleTourComplete}
        startStage={startStage}
        completeStage={completeStage}
        useHint={useHint}
      />
      {showFsBtn && (
        <button
          onClick={handleRequestFullscreen}
          aria-label="מסך מלא"
          style={{
            position: 'fixed',
            top: 'calc(12px + env(safe-area-inset-top))',
            left: 'calc(12px + env(safe-area-inset-left))',
            zIndex: 9998,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.9)',
            borderRadius: '12px',
            padding: '10px',
            color: '#667eea',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      )}
    </>
  );
}
