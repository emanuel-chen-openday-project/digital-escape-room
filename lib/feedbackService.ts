import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  doc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';

// ============================================
// Feedback Types
// ============================================

export type IntentValue = 'yes' | 'maybe' | 'no';

export interface FeedbackEntry {
  enjoyment: number;      // 1-5 stars
  clarity: number;        // 1-5 scale
  challenge: number;      // 1-5 scale
  understanding: number;  // 1-5 scale
  interest: IntentValue;  // yes/maybe/no
  registration: IntentValue; // yes/maybe/no
  comments: string;
  createdAt: Timestamp;
  userId: string | null;
}

export interface FeedbackEntryWithId extends FeedbackEntry {
  id: string;
}

// ============================================
// Submit Feedback
// ============================================

export async function submitFeedback(
  data: Omit<FeedbackEntry, 'createdAt'>,
): Promise<string> {
  const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);

  const entry = {
    ...data,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(feedbackRef, entry);
  return docRef.id;
}

// ============================================
// Get All Feedback (Admin)
// ============================================

export async function getAllFeedback(): Promise<FeedbackEntryWithId[]> {
  const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);
  const q = query(feedbackRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as FeedbackEntryWithId[];
}

// ============================================
// Subscribe to Feedback in Real-Time (Admin)
// ============================================

export function subscribeFeedback(
  onData: (data: FeedbackEntryWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);
  const q = query(feedbackRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as FeedbackEntryWithId[];
      onData(data);
    },
    (error) => {
      onError(error);
    },
  );
}

// ============================================
// Delete All Feedback (Admin)
// ============================================

export async function deleteAllFeedback(): Promise<number> {
  const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);
  const snapshot = await getDocs(feedbackRef);

  let deletedCount = 0;
  const deletePromises = snapshot.docs.map(async (docSnap) => {
    await deleteDoc(doc(db, COLLECTIONS.FEEDBACK, docSnap.id));
    deletedCount++;
  });

  await Promise.all(deletePromises);
  return deletedCount;
}
