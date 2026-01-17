'use client';

import { useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { createOrUpdateUser } from '../gameService';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

interface UseAuthReturn extends AuthState {
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signInAsGuest: () => Promise<User>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          // Create or update user in Firestore
          try {
            await createOrUpdateUser(user.uid, user.email);
          } catch (error) {
            console.error('Error updating user profile:', error);
          }
        }

        setState({
          user,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState({
          user: null,
          loading: false,
          error,
        });
      }
    );

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async (): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error }));
      throw error;
    }
  };

  // Sign in with email/password (creates account if doesn't exist)
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<User> => {
    try {
      // Try to sign in first
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: unknown) {
      // If user doesn't exist, create account
      if ((error as { code?: string })?.code === 'auth/user-not-found') {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        return result.user;
      }
      setState((prev) => ({ ...prev, error: error as Error }));
      throw error;
    }
  };

  // Sign in anonymously
  const signInAsGuest = async (): Promise<User> => {
    try {
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error }));
      throw error;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error }));
      throw error;
    }
  };

  return {
    ...state,
    signInWithGoogle,
    signInWithEmail,
    signInAsGuest,
    signOut,
  };
}
