'use client';

import { useAuth } from './useAuth';
import { isAdmin } from '../admin';

export function useAdmin() {
  const { user, loading } = useAuth();
  return {
    isAdmin: !loading && !!user && isAdmin(user.email),
    loading,
  };
}
