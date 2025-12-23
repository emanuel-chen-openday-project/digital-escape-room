import { Timestamp } from 'firebase/firestore';

// ============================================
// User Types
// ============================================

export interface UserProfile {
  odId: string;
  email: string | null;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  gamesPlayed: number;
}

export type CreateUserData = Omit<UserProfile, 'createdAt' | 'lastLoginAt' | 'gamesPlayed'>;

// ============================================
// Game Session Types
// ============================================

export type GameStatus = 'in_progress' | 'completed' | 'abandoned';

export interface StationScore {
  score: number;
  completedAt: Timestamp;
}

export interface GameSession {
  odId: string;
  nickname: string;
  status: GameStatus;
  startedAt: Timestamp;
  finishedAt: Timestamp | null;
  currentStation: number;
  stationScores: Record<string, StationScore>;
  totalScore: number;
}

export interface GameSessionWithId extends GameSession {
  id: string;
}

export type CreateGameSessionData = Pick<GameSession, 'odId' | 'nickname'>;

// ============================================
// Leaderboard Types
// ============================================

export interface LeaderboardEntry {
  nickname: string;
  totalScore: number;
  odId: string;
  sessionId: string;
  finishedAt: Timestamp;
}

// ============================================
// Game Context Types
// ============================================

export interface GameState {
  // Session info
  sessionId: string | null;
  nickname: string;

  // Tour progress
  currentStation: number;
  visitedStations: number[];

  // Scores
  stationScores: Record<string, number>;
  totalScore: number;

  // Status
  isGameActive: boolean;
  isInMiniGame: boolean;
  currentMiniGame: string | null;
}

export interface GameContextValue extends GameState {
  // Actions
  startGame: (nickname: string) => Promise<string>;
  setCurrentStation: (station: number) => void;
  startMiniGame: (stationId: string) => void;
  completeMiniGame: (stationId: string, score: number) => Promise<void>;
  completeGame: () => Promise<number>;
  abandonGame: () => Promise<void>;
  resetGame: () => void;
}

// ============================================
// Mini-Game Configuration
// ============================================

export interface MiniGameConfig {
  stationId: string;
  stationNumber: number;
  name: string;
  description: string;
  maxScore: number;
}

// Stations that have mini-games (will be configured later)
export const MINI_GAME_STATIONS: string[] = [];
// Example when configured: ['station_3', 'station_5', 'station_8']

export const TOTAL_STATIONS = 10;
export const LEADERBOARD_LIMIT = 10;
