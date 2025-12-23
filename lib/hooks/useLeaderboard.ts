'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeToLeaderboard, getTopScores } from '../gameService';
import { LeaderboardEntry, LEADERBOARD_LIMIT } from '../types';

interface UseLeaderboardOptions {
  limit?: number;
  realtime?: boolean;
}

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for accessing leaderboard data with optional real-time updates
 */
export function useLeaderboard(
  options: UseLeaderboardOptions = {}
): UseLeaderboardReturn {
  const { limit = LEADERBOARD_LIMIT, realtime = true } = options;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Manual refresh function
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTopScores(limit);
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (realtime) {
      // Real-time subscription
      setLoading(true);

      const unsubscribe = subscribeToLeaderboard((data) => {
        setEntries(data);
        setLoading(false);
        setError(null);
      }, limit);

      return () => unsubscribe();
    } else {
      // One-time fetch
      refresh();
    }
  }, [limit, realtime, refresh]);

  return {
    entries,
    loading,
    error,
    refresh,
  };
}
