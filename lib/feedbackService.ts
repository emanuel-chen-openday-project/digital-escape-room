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
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';

// ============================================
// Feedback Types
// ============================================

export interface FeedbackEntry {
  rating: number; // 1-5
  categories: string[]; // selected categories
  comment: string;
  createdAt: Timestamp;
  userId: string | null;
}

export interface FeedbackEntryWithId extends FeedbackEntry {
  id: string;
}

export const FEEDBACK_CATEGORIES = [
  'חווית משחק',
  'עיצוב וממשק',
  'תוכן לימודי',
  'רמת קושי',
  'ביצועים טכניים',
] as const;

// ============================================
// Submit Feedback
// ============================================

export async function submitFeedback(
  rating: number,
  categories: string[],
  comment: string,
  userId: string | null
): Promise<string> {
  const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);

  const entry = {
    rating,
    categories,
    comment,
    userId,
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
// Delete Feedback (Admin)
// ============================================

export async function deleteFeedback(feedbackId: string): Promise<void> {
  const feedbackRef = doc(db, COLLECTIONS.FEEDBACK, feedbackId);
  await deleteDoc(feedbackRef);
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
