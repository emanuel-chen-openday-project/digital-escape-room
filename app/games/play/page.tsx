// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuth } from '@/lib/hooks/useAuth';
import TourIntro from './TourIntro';

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
  const { nickname, isGameActive, completeGame, resetGame } = useGame();
  const [showIntro, setShowIntro] = useState(true);

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

  const handleTourComplete = async () => {
    try {
      await completeGame();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing game:', error);
      router.push('/dashboard');
    }
  };

  const handleIntroStart = () => {
    setShowIntro(false);
  };

  if (authLoading || !isGameActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showIntro) {
    return <TourIntro onStart={handleIntroStart} />;
  }

  return (
    <FactoryTour
      nickname={nickname || 'אורח'}
      onTourComplete={handleTourComplete}
    />
  );
}
