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
  } = {
    odId,
    nickname,
    status: 'in_progress',
    startedAt: serverTimestamp(),
    finishedAt: null,
    currentStation: 1,
    stationScores: {},
    totalScore: 0,
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
