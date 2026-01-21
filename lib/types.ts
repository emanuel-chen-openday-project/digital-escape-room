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
// Game Stage Types (for Leaderboard)
// ============================================

export type StageType = 'tsp' | 'hungarian' | 'knapsack';

export interface GameStageResult {
  completed: boolean;
  timeSeconds: number;
  hintsUsed: number;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

export interface RealtimeGameSession {
  odId: string;
  oduhod: string;
  nickname: string;
  status: 'active' | 'finished';
  currentStage: number; // 1 = TSP, 2 = Hungarian, 3 = Knapsack
  startTime: Timestamp;
  endTime: Timestamp | null;
  totalHints: number;
  stages: {
    tsp: GameStageResult;
    hungarian: GameStageResult;
    knapsack: GameStageResult;
  };
}

export interface LeaderboardPlayer {
  id: string;
  nickname: string;
  status: 'active' | 'finished';
  currentStage: number;
  startTime: number;
  endTime: number | null;
  hints: number;
  stageTimes: [number, number, number];
  stageSolved: [boolean | null, boolean | null, boolean | null]; // null = not done, true = solved, false = failed
}

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
  // Stage management for realtime leaderboard
  startStage: (stage: StageType) => Promise<void>;
  useHint: (stage: StageType) => Promise<void>;
  completeStage: (stage: StageType, timeSeconds: number, hintsUsed: number) => Promise<void>;
  finishGame: () => Promise<void>;
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

// ============================================
// Puzzle/Mini-Game Result Types
// ============================================

export type PuzzleType = 'TSP' | 'Hungarian' | 'Knapsack';

export interface MiniGameResult {
  solved: boolean | null;  // null = exited/abandoned, false = wrong answer, true = correct
  hintsUsed: number;
  timeSeconds: number;
  completedAt: Timestamp;
}

export interface PuzzleResults {
  TSP?: MiniGameResult;
  Hungarian?: MiniGameResult;
  Knapsack?: MiniGameResult;
}

// ============================================
// Enhanced Game Session with Puzzle Results
// ============================================

export interface EnhancedGameSession extends GameSession {
  puzzleResults: PuzzleResults;
  totalHintsUsed: number;
  puzzlesSolved: number;
  completedAllPuzzles: boolean;
}

export interface EnhancedGameSessionWithId extends EnhancedGameSession {
  id: string;
}

// ============================================
// Enhanced Leaderboard (sorted by puzzles, hints, time)
// ============================================

export interface EnhancedLeaderboardEntry {
  nickname: string;
  odId: string;
  sessionId: string;
  finishedAt: Timestamp;
  puzzlesSolved: number;
  completedAllPuzzles: boolean;
  totalHintsUsed: number;
  totalTimeSeconds: number;
  puzzleResults: PuzzleResults;
}

export const TOTAL_PUZZLES = 3;
