'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  createGameSession,
  updateCurrentStation as updateStationInDB,
  saveStationScore,
  completeGame as completeGameInDB,
  abandonGame as abandonGameInDB,
} from '../gameService';
import { GameState, GameContextValue, TOTAL_STATIONS } from '../types';

// ============================================
// Initial State
// ============================================

const initialState: GameState = {
  sessionId: null,
  nickname: '',
  currentStation: 1,
  visitedStations: [],
  stationScores: {},
  totalScore: 0,
  isGameActive: false,
  isInMiniGame: false,
  currentMiniGame: null,
};

// ============================================
// Actions
// ============================================

type GameAction =
  | { type: 'START_GAME'; payload: { sessionId: string; nickname: string } }
  | { type: 'SET_CURRENT_STATION'; payload: number }
  | { type: 'START_MINI_GAME'; payload: string }
  | { type: 'COMPLETE_MINI_GAME'; payload: { stationId: string; score: number } }
  | { type: 'COMPLETE_GAME' }
  | { type: 'ABANDON_GAME' }
  | { type: 'RESET_GAME' };

// ============================================
// Reducer
// ============================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialState,
        sessionId: action.payload.sessionId,
        nickname: action.payload.nickname,
        isGameActive: true,
        currentStation: 1,
        visitedStations: [1],
      };

    case 'SET_CURRENT_STATION': {
      const station = action.payload;
      const visitedStations = state.visitedStations.includes(station)
        ? state.visitedStations
        : [...state.visitedStations, station];

      return {
        ...state,
        currentStation: station,
        visitedStations,
      };
    }

    case 'START_MINI_GAME':
      return {
        ...state,
        isInMiniGame: true,
        currentMiniGame: action.payload,
      };

    case 'COMPLETE_MINI_GAME': {
      const { stationId, score } = action.payload;
      const oldScore = state.stationScores[stationId] || 0;
      const newTotalScore = state.totalScore - oldScore + score;

      return {
        ...state,
        isInMiniGame: false,
        currentMiniGame: null,
        stationScores: {
          ...state.stationScores,
          [stationId]: score,
        },
        totalScore: newTotalScore,
      };
    }

    case 'COMPLETE_GAME':
      return {
        ...state,
        isGameActive: false,
        isInMiniGame: false,
        currentMiniGame: null,
      };

    case 'ABANDON_GAME':
      return {
        ...state,
        isGameActive: false,
        isInMiniGame: false,
        currentMiniGame: null,
      };

    case 'RESET_GAME':
      return initialState;

    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

const GameContext = createContext<GameContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { user } = useAuth();

  // Start a new game
  const startGame = useCallback(
    async (nickname: string): Promise<string> => {
      if (!user) {
        throw new Error('User must be authenticated to start a game');
      }

      const sessionId = await createGameSession(user.uid, nickname);

      dispatch({
        type: 'START_GAME',
        payload: { sessionId, nickname },
      });

      return sessionId;
    },
    [user]
  );

  // Set current station
  const setCurrentStation = useCallback(
    (station: number) => {
      if (station < 1 || station > TOTAL_STATIONS) {
        console.error(`Invalid station number: ${station}`);
        return;
      }

      dispatch({ type: 'SET_CURRENT_STATION', payload: station });

      // Update in database if session exists
      if (state.sessionId) {
        updateStationInDB(state.sessionId, station).catch(console.error);
      }
    },
    [state.sessionId]
  );

  // Start a mini-game
  const startMiniGame = useCallback((stationId: string) => {
    dispatch({ type: 'START_MINI_GAME', payload: stationId });
  }, []);

  // Complete a mini-game with score
  const completeMiniGame = useCallback(
    async (stationId: string, score: number): Promise<void> => {
      if (!state.sessionId) {
        throw new Error('No active game session');
      }

      // Save to database
      await saveStationScore(state.sessionId, stationId, score);

      // Update local state
      dispatch({
        type: 'COMPLETE_MINI_GAME',
        payload: { stationId, score },
      });
    },
    [state.sessionId]
  );

  // Complete the game
  const completeGame = useCallback(async (): Promise<number> => {
    if (!state.sessionId) {
      throw new Error('No active game session');
    }

    const finalScore = await completeGameInDB(state.sessionId);
    dispatch({ type: 'COMPLETE_GAME' });

    return finalScore;
  }, [state.sessionId]);

  // Abandon the game
  const abandonGame = useCallback(async (): Promise<void> => {
    if (state.sessionId) {
      await abandonGameInDB(state.sessionId);
    }
    dispatch({ type: 'ABANDON_GAME' });
  }, [state.sessionId]);

  // Reset game state
  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const value: GameContextValue = {
    ...state,
    startGame,
    setCurrentStation,
    startMiniGame,
    completeMiniGame,
    completeGame,
    abandonGame,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useGame(): GameContextValue {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }

  return context;
}
