import React, { createContext, useContext, ReactNode } from 'react';
import { useProfile } from '@/hooks/useAuth';
import type { UserProfileDTO } from '@/types/auth.types';

interface AuthContextType {
  user: UserProfileDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Tự động gọi API /profile khi app khởi động để kiểm tra session
  const { data: user, isLoading, isError } = useProfile();

  const value = {
    user: user && !isError ? user : null,
    isAuthenticated: !!user && !isError,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
