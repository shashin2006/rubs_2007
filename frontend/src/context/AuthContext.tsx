import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import {
  getStoredToken,
  getStoredUser,
  clearAuthStorage,
  loginUser,
  registerUser,
  isSimulationMode,
  setSimulationMode,
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiBaseUrl,
  checkBackendHealth,
} from '../api/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  simulationMode: boolean;
  apiUrl: string;
  backendOnline: boolean | null;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (payload: { name: string; email: string; password: string }) => Promise<User>;
  logout: () => void;
  toggleSimulationMode: (enabled?: boolean) => void;
  updateApiUrl: (newUrl: string) => void;
  resetApiUrlToDefault: () => void;
  checkHealth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simulationMode, setSimMode] = useState<boolean>(() => isSimulationMode());
  const [apiUrl, setApiUrlState] = useState<string>(() => getApiBaseUrl());
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    if (simulationMode) {
      setBackendOnline(true);
      return true;
    }
    try {
      await checkBackendHealth();
      setBackendOnline(true);
      return true;
    } catch {
      setBackendOnline(false);
      return false;
    }
  }, [simulationMode]);

  useEffect(() => {
    checkHealth();
    // Periodic light health ping every 25 seconds
    const interval = setInterval(checkHealth, 25000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  useEffect(() => {
    const handleSimChange = () => {
      setSimMode(isSimulationMode());
    };
    window.addEventListener('simulation_mode_changed', handleSimChange);
    return () => window.removeEventListener('simulation_mode_changed', handleSimChange);
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await loginUser(credentials);
      const authenticatedUser = res.user;
      const authToken = res.access_token || res.token || 'auth_token';
      setUser(authenticatedUser);
      setToken(authToken);
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: { name: string; email: string; password: string }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await registerUser(payload);
      const registeredUser = res.user;
      const authToken = res.access_token || res.token || 'auth_token';
      setUser(registeredUser);
      setToken(authToken);
      return registeredUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
    setToken(null);
  };

  const toggleSimulationMode = (enabled?: boolean) => {
    const nextVal = enabled !== undefined ? enabled : !simulationMode;
    setSimulationMode(nextVal);
    setSimMode(nextVal);
    if (nextVal) {
      setBackendOnline(true);
    } else {
      checkHealth();
    }
  };

  const updateApiUrl = (newUrl: string) => {
    setApiBaseUrl(newUrl);
    setApiUrlState(newUrl);
    checkHealth();
  };

  const resetApiUrlToDefault = () => {
    resetApiBaseUrl();
    setApiUrlState(getApiBaseUrl());
    checkHealth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? user.role : null,
        isAuthenticated: !!token && !!user,
        isLoading,
        simulationMode,
        apiUrl,
        backendOnline,
        login,
        register,
        logout,
        toggleSimulationMode,
        updateApiUrl,
        resetApiUrlToDefault,
        checkHealth,
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
