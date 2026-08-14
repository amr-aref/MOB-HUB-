import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setAuthTokenGetter } from '@workspace/api-client-react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  nameAr: string;
  role: 'buyer' | 'merchant' | 'moderator' | 'admin';
  storeId?: string | null;
  isEmailVerified: boolean;
}

interface AuthState { user: AuthUser | null; isLoading: boolean; isAuthenticated: boolean; }
interface AuthContextValue extends AuthState {
  login: (email: string, password: string, deviceId?: string) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
  nameAr?: string;
  role?: 'buyer' | 'merchant';
  deviceId?: string;
}

const KEYS = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
  USER: 'auth.user',
} as const;

const BASE_URL = process.env['EXPO_PUBLIC_DOMAIN'] ? `https://${process.env['EXPO_PUBLIC_DOMAIN']}` : 'http://localhost:8080';

type TokensResponse = { accessToken: string; refreshToken: string; expiresIn: number; user: AuthUser };

type ApiError = Error & { code?: string; status?: number };

async function apiRequest<T>(path: string, method: 'GET' | 'POST', body?: unknown, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE_URL}/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as Record<string, string>).error ?? `HTTP ${res.status}`) as ApiError;
    err.code = (data as Record<string, string>).code;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshSession: async () => false,
});

export function useAuth(): AuthContextValue { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true, isAuthenticated: false });
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    setAuthTokenGetter(async () => SecureStore.getItemAsync(KEYS.ACCESS_TOKEN));
    return () => setAuthTokenGetter(null);
  }, []);

  const persist = useCallback(async (user: AuthUser, accessToken: string, refreshToken: string) => {
    accessTokenRef.current = accessToken;
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
      SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user)),
    ]);
  }, []);

  const clear = useCallback(async () => {
    accessTokenRef.current = null;
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER),
    ]);
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
      if (!refreshToken) return false;
      const data = await apiRequest<TokensResponse>('/auth/refresh', 'POST', { refreshToken });
      await persist(data.user, data.accessToken, data.refreshToken);
      setState({ user: data.user, isLoading: false, isAuthenticated: true });
      return true;
    } catch {
      await clear();
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return false;
    }
  }, [persist, clear]);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const accessToken = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
        if (!accessToken) {
          if (!cancelled) setState({ user: null, isLoading: false, isAuthenticated: false });
          return;
        }

        accessTokenRef.current = accessToken;
        const data = await apiRequest<{ user: AuthUser }>('/auth/me', 'GET', undefined, accessToken);
        const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
        if (!refreshToken) throw new Error('Missing refresh token');
        await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(data.user));
        if (!cancelled) setState({ user: data.user, isLoading: false, isAuthenticated: true });
      } catch {
        if (!cancelled) {
          const refreshed = await refreshSession();
          if (!refreshed) await clear();
        }
      }
    }
    void restore();
    return () => { cancelled = true; };
  }, [refreshSession, clear]);

  const login = useCallback(async (email: string, password: string, deviceId?: string) => {
    const data = await apiRequest<TokensResponse>('/auth/login', 'POST', { email, password, deviceId, platform: 'mobile' });
    await persist(data.user, data.accessToken, data.refreshToken);
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  }, [persist]);

  const register = useCallback(async (params: RegisterParams) => {
    const data = await apiRequest<TokensResponse>('/auth/register', 'POST', { ...params, platform: 'mobile' });
    await persist(data.user, data.accessToken, data.refreshToken);
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  }, [persist]);

  const logout = useCallback(async () => {
    try {
      const token = accessTokenRef.current ?? await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
      if (token) await apiRequest('/auth/logout', 'POST', {}, token).catch(() => {});
    } finally {
      await clear();
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, [clear]);

  return <AuthContext.Provider value={{ ...state, login, register, logout, refreshSession }}>{children}</AuthContext.Provider>;
}
