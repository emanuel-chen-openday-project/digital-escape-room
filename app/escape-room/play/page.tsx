// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuth } from '@/lib/hooks/useAuth';

const FactoryTour = dynamic(() => import('@/app/games/play/FactoryTour'), {
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

export default function EscapeRoomPlay() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { nickname, sessionId, isGameActive, finishGame, startStage, completeStage, useHint } = useGame();

  // Redirect if not authenticated or no active game
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else if (!isGameActive) {
        router.push('/escape-room');
      }
    }
  }, [user, authLoading, isGameActive, router]);

  const handleTourComplete = async () => {
    try {
      await finishGame();
      router.push('/dashboard');
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

  return (
    <FactoryTour
      nickname={nickname || 'אורח'}
      sessionId={sessionId || undefined}
      onTourComplete={handleTourComplete}
      startStage={startStage}
      completeStage={completeStage}
      useHint={useHint}
    />
  );
}
