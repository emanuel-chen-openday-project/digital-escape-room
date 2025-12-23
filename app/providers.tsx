'use client';

import { ReactNode } from 'react';
import { GameProvider } from '@/lib/contexts/GameContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <GameProvider>{children}</GameProvider>;
}
