import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { connectSocket, disconnectSocket } from '../lib/socket.js';
import { IUser, RegisterInput, LoginInput } from '@jobconnect/shared';

interface AuthContextType {
  user: IUser | null;
  profile: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<any>;
  register: (data: RegisterInput) => Promise<any>;
  verifyOtp: (identifier: string, otp: string, purpose: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Security rule: Auth tokens are managed strictly via HttpOnly secure cookies.
// localStorage must only ever store user preferences like 'theme'.
const purgeLegacyStorageTokens = () => {
  try {
    localStorage.removeItem('jobconnect_at');
    localStorage.removeItem('jobconnect_rt');
  } catch {}
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data.user);
        setProfile(response.data.data.profile);
        connectSocket();
      } else {
        setUser(null);
        setProfile(null);
        disconnectSocket();
      }
    } catch {
      setUser(null);
      setProfile(null);
      disconnectSocket();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    purgeLegacyStorageTokens();
    refreshUser();
  }, []);

  const login = async (credentials: LoginInput) => {
    purgeLegacyStorageTokens();
    const res = await api.post('/auth/login', credentials);
    if (res.data.success && !res.data.data.pendingVerification) {
      setUser(res.data.data.user);
      connectSocket();
      await refreshUser();
    }
    return res.data;
  };

  const register = async (data: RegisterInput) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  };

  const verifyOtp = async (identifier: string, otp: string, purpose: string) => {
    purgeLegacyStorageTokens();
    const res = await api.post('/auth/verify-otp', { identifier, otp, purpose });
    if (res.data.success) {
      setUser(res.data.data.user);
      connectSocket();
      await refreshUser();
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      purgeLegacyStorageTokens();
      setUser(null);
      setProfile(null);
      disconnectSocket();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        verifyOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
