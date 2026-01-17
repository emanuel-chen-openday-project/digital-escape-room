import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  increment,
  addDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import {
  UserProfile,
  GameSession,
  GameSessionWithId,
  LeaderboardEntry,
  StationScore,
  LEADERBOARD_LIMIT,
  PuzzleType,
  MiniGameResult,
  EnhancedGameSession,
  EnhancedLeaderboardEntry,
  StageType,
  RealtimeGameSession,
  LeaderboardPlayer,
  GameStageResult,
} from './types';

// ============================================
// User Management
// ============================================

/**
 * Creates a new user or updates existing user's lastLoginAt
 */
export async function createOrUpdateUser(
  odId: string,
  email: string | null
): Promise<UserProfile> {
  const userRef = doc(db, COLLECTIONS.USERS, odId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Update last login
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
    return userSnap.data() as UserProfile;
  }

  // Create new user
  const newUser: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    lastLoginAt: ReturnType<typeof serverTimestamp>;
  } = {
    odId,
    email,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    gamesPlayed: 0,
  };

  await setDoc(userRef, newUser);

  // Fetch and return the created document
  const createdSnap = await getDoc(userRef);
  return createdSnap.data() as UserProfile;
}

/**
 * Gets user profile by UID
 */
export async function getUserProfile(odId: string): Promise<UserProfile | null> {
  const userRef = doc(db, COLLECTIONS.USERS, odId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data() as UserProfile;
}

// ============================================
// Game Session Management
// ============================================

/**
 * Creates a new game session and returns its ID
 */
export async function createGameSession(
  odId: string,
  nickname: string
): Promise<string> {
  const sessionsRef = collection(db, COLLECTIONS.GAME_SESSIONS);

  const newSession: Omit<GameSession, 'startedAt'> & {
    startedAt: ReturnType<typeof serverTimestamp>;
    puzzleResults: Record<string, never>;
    totalHintsUsed: number;
    puzzlesSolved: number;
    completedAllPuzzles: boolean;
  } = {
    odId,
    nickname,
    status: 'in_progress',
    startedAt: serverTimestamp(),
    finishedAt: null,
    currentStation: 1,
    stationScores: {},
    totalScore: 0,
    // Initialize puzzle tracking fields
    puzzleResults: {},
    totalHintsUsed: 0,
    puzzlesSolved: 0,
    completedAllPuzzles: false,
  };

  const docRef = await addDoc(sessionsRef, newSession);

  // Increment user's games played count
  const userRef = doc(db, COLLECTIONS.USERS, odId);
  await updateDoc(userRef, {
    gamesPlayed: increment(1),
  });

  return docRef.id;
}

/**
 * Gets a game session by ID
 */
export async function getGameSession(
  sessionId: string
): Promise<GameSessionWithId | null> {
  const sessionRef = doc(db, COLLECTIONS.GAME_SESSIONS, sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    return null;
  }

  return {
    id: sessionSnap.id,
    ...sessionSnap.data(),
  } as GameSessionWithId;
}

/**
 * Updates the current station in a game session
 */
export async function updateCurrentStation(
  sessionId: string,
  station: number
): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.GAME_SESSIONS, sessionId);
  await updateDoc(sessionRef, {
    currentStation: station,
  });
}

/**
 * Saves score for a specific station
 */
export async function saveStationScore(
  sessionId: string,
  stationId: string,
  score: number
): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.GAME_SESSIONS, sessionId);

  const stationScore: StationScore = {
    score,
    completedAt: Timestamp.now(),
  };

  // Get current session to calculate new total
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const currentSession = sessionSnap.data() as GameSession;
  const currentStationScores = currentSession.stationScores || {};

  // Calculate new total (replace old score if exists)
  const oldScore = currentStationScores[stationId]?.score || 0;
  const newTotalScore = currentSession.totalScore - oldScore + score;

  await updateDoc(sessionRef, {
    [`stationScores.${stationId}`]: stationScore,
    totalScore: newTotalScore,
  });
}

/**
 * Marks game as completed and returns final score
 */
export async function completeGame(sessionId: string): Promise<number> {
  const sessionRef = doc(db, COLLECTIONS.GAME_SESSIONS, sessionId);

  // Get current session for total score
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const session = sessionSnap.data() as GameSession;

  await updateDoc(sessionRef, {
    status: 'completed',
    finishedAt: serverTimestamp(),
  });

  return session.totalScore;
}

/**
 * Marks game as abandoned
 */
export async function abandonGame(sessionId: string): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.GAME_SESSIONS, sessionId);
  await updateDoc(sessionRef, {
    status: 'abandoned',
    finishedAt: serverTimestamp(),
  });
}

// ============================================
// Leaderboard
// ============================================

/**
 * Gets top scores (only highest score per nickname)
 */
export async function getTopScores(
  limitCount: number = LEADERBOARD_LIMIT
): Promise<LeaderboardEntry[]> {
  const sessionsRef = collection(db, COLLECTIONS.GAME_SESSIONS);

  // Query completed games ordered by score
  const q = query(
    sessionsRef,
    where('status', '==', 'completed'),
    orderBy('totalScore', 'desc'),
    limit(limitCount * 3) // Fetch more to filter duplicates
  );

  const querySnapshot = await getDocs(q);

  // Filter to keep only highest score per nickname
  const nicknameScores = new Map<string, LeaderboardEntry>();

  querySnapshot.forEach((docSnap) => {
    const session = docSnap.data() as GameSession;
    const existing = nicknameScores.get(session.nickname);

    if (!existing || session.totalScore > existing.totalScore) {
      nicknameScores.set(session.nickname, {
        nickname: session.nickname,
        totalScore: session.totalScore,
        odId: session.odId,
        sessionId: docSnap.id,
        finishedAt: session.finishedAt as Timestamp,
      });
    }
  });

  // Sort by score and limit
  return Array.from(nicknameScores.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limitCount);
}

/**
 * Subscribes to real-time leaderboard updates
 * Returns unsubscribe function
 */
export function subscribeToLeaderboard(
  callback: (entries: LeaderboardEntry[]) => void,
  limitCount: number = LEADERBOARD_LIMIT
): Unsubscribe {
  const sessionsRef = collection(db, COLLECTIONS.GAME_SESSIONS);

  const q = query(
    sessionsRef,
    where('status', '==', 'completed'),
    orderBy('totalScore', 'desc'),
    limit(limitCount * 3)
  );

  return onSnapshot(q, (snapshot) => {
    // Filter to keep only highest score per nickname
    const nicknameScores = new Map<string, LeaderboardEntry>();

    snapshot.forEach((docSnap) => {
      const session = docSnap.data() as GameSession;
      const existing = nicknameScores.get(session.nickname);

      if (!existing || session.totalScore > existing.totalScore) {
        nicknameScores.set(session.nickname, {
          nickname: session.nickname,
          totalScore: session.totalScore,
          odId: session.odId,
          sessionId: docSnap.id,
          finishedAt: session.finishedAt as Timestamp,
        });
      }
    });

    // Sort by score and limit
    const entries = Array.from(nicknameScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limitCount);

    callback(entries);
  });
}

/**
 * Gets all sessions for a specific user
 */
export async function getUserSessions(odId: string): Promise<GameSessionWithId[]> {
  const sessionsRef = collection(db, COLLECTIONS.GAME_SESSIONS);

  const q = query(
    sessionsRef,
    where('odId', '==', odId),
    orderBy('startedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as GameSessionWithId[];
}

// ============================================
// Puzzle Results Management
// ============================================

/**
 * Saves a puzzle result for a specific game session
 */
export async function savePuzzleResult(
  sessionId: string,
  puzzleType: PuzzleType,
  result: { solved: boolean; hintsUsed: number; timeSeconds: number }
): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.GAME_SESSIONS, sessionId);

  // Get current session to calculate totals
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const session = sessionSnap.data() as EnhancedGameSession;
  const currentTotalHints = session.totalHintsUsed || 0;
  const currentPuzzlesSolved = session.puzzlesSolved || 0;

  // Create the puzzle result
  const puzzleResult: MiniGameResult = {
    solved: result.solved,
    hintsUsed: result.hintsUsed,
    timeSeconds: result.timeSeconds,
    completedAt: Timestamp.now(),
  };

  // Calculate new totals
  const newTotalHints = currentTotalHints + result.hintsUsed;
  const newPuzzlesSolved = currentPuzzlesSolved + (result.solved ? 1 : 0);
  const completedAllPuzzles = newPuzzlesSolved === 3;

  // Map puzzle type to stage key (TSP -> tsp, Hungarian -> hungarian, Knapsack -> knapsack)
  const stageKey = puzzleType.toLowerCase() as StageType;

  // Calculate next stage number
  const nextStage = stageKey === 'tsp' ? 2 : stageKey === 'hungarian' ? 3 : 3;

  await updateDoc(sessionRef, {
    // Save to puzzleResults (for backward compatibility)
    [`puzzleResults.${puzzleType}`]: puzzleResult,
    totalHintsUsed: newTotalHints,
    puzzlesSolved: newPuzzlesSolved,
    completedAllPuzzles,
    // Also update stages (for realtime leaderboard)
    [`stages.${stageKey}.completed`]: true,
    [`stages.${stageKey}.timeSeconds`]: result.timeSeconds,
    [`stages.${stageKey}.hintsUsed`]: result.hintsUsed,
    [`stages.${stageKey}.completedAt`]: Timestamp.now(),
    currentStage: nextStage,
  });
}

/**
 * Gets enhanced leaderboard sorted by:
 * 1. Completed all 3 puzzles (first)
 * 2. Fewer hints used
 * 3. Less total time
 */
export async function getEnhancedLeaderboard(
  limitCount: number = LEADERBOARD_LIMIT
): Promise<EnhancedLeaderboardEntry[]> {
  const sessionsRef = collection(db, COLLECTIONS.GAME_SESSIONS);

  // Query completed games
  const q = query(
    sessionsRef,
    where('status', '==', 'completed'),
    limit(limitCount * 3) // Fetch more to filter duplicates
  );

  const querySnapshot = await getDocs(q);

  // Filter to keep only best result per nickname
  const nicknameScores = new Map<string, EnhancedLeaderboardEntry>();

  querySnapshot.forEach((docSnap) => {
    const session = docSnap.data() as EnhancedGameSession;
    const existing = nicknameScores.get(session.nickname);

    // Calculate total time from puzzle results
    const puzzleResults = session.puzzleResults || {};
    const totalTimeSeconds =
      (puzzleResults.TSP?.timeSeconds || 0) +
      (puzzleResults.Hungarian?.timeSeconds || 0) +
      (puzzleResults.Knapsack?.timeSeconds || 0);

    const entry: EnhancedLeaderboardEntry = {
      nickname: session.nickname,
      odId: session.odId,
      sessionId: docSnap.id,
      finishedAt: session.finishedAt as Timestamp,
      puzzlesSolved: session.puzzlesSolved || 0,
      completedAllPuzzles: session.completedAllPuzzles || false,
      totalHintsUsed: session.totalHintsUsed || 0,
      totalTimeSeconds,
      puzzleResults,
    };

    // Compare with existing entry for same nickname
    if (!existing || isBetterScore(entry, existing)) {
      nicknameScores.set(session.nickname, entry);
    }
  });

  // Sort by: completedAllPuzzles > fewer hints > less time
  return Array.from(nicknameScores.values())
    .sort((a, b) => {
      // First: completed all puzzles
      if (a.completedAllPuzzles !== b.completedAllPuzzles) {
        return a.completedAllPuzzles ? -1 : 1;
      }
      // Second: more puzzles solved
      if (a.puzzlesSolved !== b.puzzlesSolved) {
        return b.puzzlesSolved - a.puzzlesSolved;
      }
      // Third: fewer hints
      if (a.totalHintsUsed !== b.totalHintsUsed) {
        return a.totalHintsUsed - b.totalHintsUsed;
      }
      // Fourth: less time
      return a.totalTimeSeconds - b.totalTimeSeconds;
    })
    .slice(0, limitCount);
}

/**
 * Helper function to determine if a new entry is better than an existing one
 */
function isBetterScore(
  newEntry: EnhancedLeaderboardEntry,
  existing: EnhancedLeaderboardEntry
): boolean {
  // First: completed all puzzles wins
  if (newEntry.completedAllPuzzles !== existing.completedAllPuzzles) {
    return newEntry.completedAllPuzzles;
  }
  // Second: more puzzles solved wins
  if (newEntry.puzzlesSolved !== existing.puzzlesSolved) {
    return newEntry.puzzlesSolved > existing.puzzlesSolved;
  }
  // Third: fewer hints wins
  if (newEntry.totalHintsUsed !== existing.totalHintsUsed) {
    return newEntry.totalHintsUsed < existing.totalHintsUsed;
  }
  // Fourth: less time wins
  return newEntry.totalTimeSeconds < existing.totalTimeSeconds;
}

/**
 * Subscribes to real-time enhanced leaderboard updates
 */
export function subscribeToEnhancedLeaderboard(
  callback: (entries: EnhancedLeaderboardEntry[]) => void,
  limitCount: number = LEADERBOARD_LIMIT
): Unsubscribe {
  const sessionsRef = collection(db, COLLECTIONS.GAME_SESSIONS);

  const q = query(
    sessionsRef,
    where('status', '==', 'completed'),
    limit(limitCount * 3)
  );

  return onSnapshot(q, (snapshot) => {
    const nicknameScores = new Map<string, EnhancedLeaderboardEntry>();

    snapshot.forEach((docSnap) => {
      const session = docSnap.data() as EnhancedGameSession;
      const existing = nicknameScores.get(session.nickname);

      const puzzleResults = session.puzzleResults || {};
      const totalTimeSeconds =
        (puzzleResults.TSP?.timeSeconds || 0) +
        (puzzleResults.Hungarian?.timeSeconds || 0) +
        (puzzleResults.Knapsack?.timeSeconds || 0);

      const entry: EnhancedLeaderboardEntry = {
        nickname: session.nickname,
        odId: session.odId,
        sessionId: docSnap.id,
        finishedAt: session.finishedAt as Timestamp,
        puzzlesSolved: session.puzzlesSolved || 0,
        completedAllPuzzles: session.completedAllPuzzles || false,
        totalHintsUsed: session.totalHintsUsed || 0,
        totalTimeSeconds,
        puzzleResults,
      };

      if (!existing || isBetterScore(entry, existing)) {
        nicknameScores.set(session.nickname, entry);
      }
    });

    const entries = Array.from(nicknameScores.values())
      .sort((a, b) => {
        if (a.completedAllPuzzles !== b.completedAllPuzzles) {
          return a.completedAllPuzzles ? -1 : 1;
        }
        if (a.puzzlesSolved !== b.puzzlesSolved) {
          return b.puzzlesSolved - a.puzzlesSolved;
        }
        if (a.totalHintsUsed !== b.totalHintsUsed) {
          return a.totalHintsUsed - b.totalHintsUsed;
        }
        return a.totalTimeSeconds - b.totalTimeSeconds;
      })
      .slice(0, limitCount);

    callback(entries);
  });
}

// ============================================
// Stage Management (for Realtime Leaderboard)
// ============================================

const DEFAULT_STAGE_RESULT: GameStageResult = {
  completed: false,
  timeSeconds: 0,
  hintsUsed: 0,
  startedAt: null,
  completedAt: null,
};

/**
 * Creates a new realtime game session with stage tracking
 */
export async function createRealtimeGameSession(
  odId: string,
  nickname: string
): Promise<string> {
  const sessionsRef = collection(db, COLLECTIONS.GAME_SESSIONS);

  const newSession = {
    odId,
    oduhod: odId,
    nickname,
    status: 'active' as const,
    currentStage: 1,
    startTime: serverTimestamp(),
    endTime: null,
    totalHints: 0,
    stages: {
      tsp: DEFAULT_STAGE_RESULT,
      hungarian: DEFAULT_STAGE_RESULT,
      knapsack: DEFAULT_STAGE_RESULT,
    },
    // Keep legacy fields for backwards compatibility
    startedAt: serverTimestamp(),
    finishedAt: null,
    currentStation: 1,
    stationScores: {},
    totalScore: 0,
    puzzleResults: {},
    totalHintsUsed: 0,
    puzzlesSolved: 0,
    completedAllPuzzles: false,
  };

  const docRef = await addDoc(sessionsRef, newSession);

  // Increment user's games played count
  try {
    const userRef = doc(db, COLLECTIONS.USERS, odId);
    await updateDoc(userRef, {
      gamesPlayed: increment(1),
    });
  } catch (e) {
    console.log('User doc not found, skipping increment');
  }

  return docRef.id;
}

/**
 * Marks the start of a specific stage
 */
export async function startStage(
  sessionId: string,
  stage: StageType
): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.GAME_SESSIONS, sessionId);

  await updateDoc(sessionRef, {
    [`stages.${stage}.startedAt`]: serverTimestamp(),
    currentStage: stage === 'tsp' ? 1 : stage === 'hungarian' ? 2 : 3,
  });
}

/**
 * Records a hint used in a specific stage
 */
export async function useHint(
  sessionId: string,
  stage: StageType
): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.GAME_SESSIONS, sessionId);

  await updateDoc(sessionRef, {
    [`stages.${stage}.hintsUsed`]: increment(1),
    totalHints: increment(1),
    totalHintsUsed: increment(1),
  });
}

/**
 * Completes a specific stage with time and hints
 */
export async function completeStage(
  sessionId: string,
  stage: StageType,
  timeSeconds: number,
  hintsUsed: number
): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.GAME_SESSIONS, sessionId);

  // Calculate next stage
  const nextStage = stage === 'tsp' ? 2 : stage === 'hungarian' ? 3 : 3;

  await updateDoc(sessionRef, {
    [`stages.${stage}.completed`]: true,
    [`stages.${stage}.timeSeconds`]: timeSeconds,
    [`stages.${stage}.hintsUsed`]: hintsUsed,
    [`stages.${stage}.completedAt`]: serverTimestamp(),
    currentStage: nextStage,
    // Legacy puzzle results
    [`puzzleResults.${stage.toUpperCase()}`]: {
      solved: true,
      hintsUsed,
      timeSeconds,
      completedAt: Timestamp.now(),
    },
    puzzlesSolved: increment(1),
  });
}

/**
 * Marks the entire game as finished
 */
export async function finishRealtimeGame(sessionId: string): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.GAME_SESSIONS, sessionId);

  await updateDoc(sessionRef, {
    status: 'finished',
    endTime: serverTimestamp(),
    finishedAt: serverTimestamp(),
    completedAllPuzzles: true,
  });
}

/**
 * Subscribes to all game sessions for realtime leaderboard
 */
export function subscribeToRealtimeLeaderboard(
  callback: (players: LeaderboardPlayer[]) => void
): Unsubscribe {
  const sessionsRef = collection(db, COLLECTIONS.GAME_SESSIONS);

  const q = query(
    sessionsRef,
    orderBy('startTime', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const players: LeaderboardPlayer[] = [];
    const now = Date.now();
    const MAX_ACTIVE_TIME = 30 * 60 * 1000; // 30 minutes timeout for active players

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Skip sessions without stages (old format)
      if (!data.stages) return;

      const stages = data.stages as RealtimeGameSession['stages'];
      const startTime = data.startTime?.toMillis?.() || Date.now();

      // Skip active players who have been playing for more than 30 minutes (timed out)
      if (data.status === 'active' && (now - startTime) > MAX_ACTIVE_TIME) {
        return;
      }

      // Get solved status from puzzleResults
      const puzzleResults = data.puzzleResults || {};
      const stageSolved: [boolean | null, boolean | null, boolean | null] = [
        puzzleResults.TSP?.solved ?? null,
        puzzleResults.Hungarian?.solved ?? null,
        puzzleResults.Knapsack?.solved ?? null,
      ];

      players.push({
        id: docSnap.id,
        nickname: data.nickname || 'אורח',
        status: data.status || 'active',
        currentStage: data.currentStage || 1,
        startTime: startTime,
        endTime: data.endTime?.toMillis?.() || null,
        hints: data.totalHintsUsed || data.totalHints || 0,
        stageTimes: [
          stages.tsp?.timeSeconds || 0,
          stages.hungarian?.timeSeconds || 0,
          stages.knapsack?.timeSeconds || 0,
        ],
        stageSolved,
      });
    });

    // Sort: finished first (by total time), then active
    players.sort((a, b) => {
      if (a.status === 'finished' && b.status !== 'finished') return -1;
      if (a.status !== 'finished' && b.status === 'finished') return 1;

      const aTime = a.endTime ? a.endTime - a.startTime : Date.now() - a.startTime;
      const bTime = b.endTime ? b.endTime - b.startTime : Date.now() - b.startTime;

      return aTime - bTime;
    });

    callback(players);
  });
}

/**
 * Resets/clears the leaderboard by deleting all game sessions
 */
export async function resetLeaderboard(): Promise<number> {
  const sessionsRef = collection(db, COLLECTIONS.GAME_SESSIONS);
  const q = query(sessionsRef);
  const snapshot = await getDocs(q);

  let deletedCount = 0;
  const { deleteDoc } = await import('firebase/firestore');

  const deletePromises = snapshot.docs.map(async (docSnap) => {
    await deleteDoc(doc(db, COLLECTIONS.GAME_SESSIONS, docSnap.id));
    deletedCount++;
  });

  await Promise.all(deletePromises);
  return deletedCount;
}
