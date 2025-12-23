// @ts-nocheck
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuth } from '@/lib/hooks/useAuth';

// Dynamically import FactoryTour to avoid SSR issues with Babylon.js
const FactoryTour = dynamic(() => import('./FactoryTour'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-lg">טוען את הסיור במפעל...</p>
      </div>
    </div>
  ),
});

export default function GamePlay() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { nickname, isGameActive, totalScore, completeGame } = useGame();
  const [mounted, setMounted] = useState(false);

  // Ensure client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated or no active game
  useEffect(() => {
    if (!authLoading && mounted) {
      if (!user) {
        router.push('/');
      } else if (!isGameActive) {
        router.push('/games');
      }
    }
  }, [user, authLoading, isGameActive, router, mounted]);

  // Handle tour completion
  const handleTourComplete = useCallback(async () => {
    try {
      await completeGame();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing game:', error);
      router.push('/dashboard');
    }
  }, [completeGame, router]);

  // Handle score updates from the tour
  const handleScoreUpdate = useCallback((newScore: number) => {
    // The score is managed within FactoryTour, but we can sync it here if needed
    // This is called when the player completes a game station
  }, []);

  // Loading state
  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated or no active game
  if (!user || !isGameActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">מעביר...</p>
        </div>
      </div>
    );
  }

  return (
    <FactoryTour
      nickname={nickname}
      onTourComplete={handleTourComplete}
      onScoreUpdate={handleScoreUpdate}
      initialScore={totalScore}
    />
  );
}
