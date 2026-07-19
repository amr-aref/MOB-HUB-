import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { setAuthTokenGetter } from '@workspace/api-client-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  nameAr: string;
  role: 'buyer' | 'merchant' | 'moderator' | 'admin';
  storeId?: string | null;
  isEmailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

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
  storeId?: string;
  deviceId?: string;
}

// ─── SecureStore keys ─────────────────────────────────────────────────────────

const KEYS = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
  USER: 'auth.user',
} as const;

// ─── API helpers ──────────────────────────────────────────────────────────────

const _apiDomain = process.env['EXPO_PUBLIC_DOMAIN'];
const BASE_URL = _apiDomain ? `https://${_apiDomain}` : 'http://localhost:8080';

async function apiPost<T>(
  path: string,
  body: unknown,
  accessToken?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as Record<string, string>).error ?? `HTTP ${res.status}`;
    const code = (data as Record<string, string>).code;
    const err = new Error(message) as Error & { code?: string; status?: number };
    err.code = code;
    err.status = res.status;
    throw err;
  }

  return data as T;
}

interface TokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshSession: async () => false,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Ref so the token getter closure always has the latest value without
  // causing unnecessary re-renders or stale captures.
  const accessTokenRef = useRef<string | null>(null);

  // Register the token getter once — customFetch will call this before every
  // authenticated request.
  useEffect(() => {
    setAuthTokenGetter(async () => {
      const stored = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
      return stored;
    });
    return () => {
      setAuthTokenGetter(null);
    };
  }, []);

  // ── Restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const [storedUser, storedAccess] = await Promise.all([
          SecureStore.getItemAsync(KEYS.USER),
          SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
        ]);

        if (!storedUser || !storedAccess) {
          if (!cancelled) {
            setState({ user: null, isLoading: false, isAuthenticated: false });
          }
          return;
        }

        const user = JSON.parse(storedUser) as AuthUser;
        accessTokenRef.current = storedAccess;

        if (!cancelled) {
          setState({ user, isLoading: false, isAuthenticated: true });
        }
      } catch {
        if (!cancelled) {
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Persist helpers ─────────────────────────────────────────────────────────

  const _persist = useCallback(
    async (user: AuthUser, accessToken: string, refreshToken: string) => {
      accessTokenRef.current = accessToken;
      await Promise.all([
        SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
        SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user)),
      ]);
    },
    [],
  );

  const _clear = useCallback(async () => {
    accessTokenRef.current = null;
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER),
    ]);
  }, []);

  // ── refreshSession ──────────────────────────────────────────────────────────

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const storedRefresh = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
      if (!storedRefresh) return false;

      const data = await apiPost<TokensResponse>('/auth/refresh', {
        refreshToken: storedRefresh,
      });

      await _persist(data.user, data.accessToken, data.refreshToken);
      setState({ user: data.user, isLoading: false, isAuthenticated: true });
      return true;
    } catch {
      await _clear();
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return false;
    }
  }, [_persist, _clear]);

  // ── login ───────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string, deviceId?: string) => {
      const data = await apiPost<TokensResponse>('/auth/login', {
        email,
        password,
        deviceId,
        platform: 'mobile',
      });

      await _persist(data.user, data.accessToken, data.refreshToken);
      setState({ user: data.user, isLoading: false, isAuthenticated: true });
    },
    [_persist],
  );

  // ── register ────────────────────────────────────────────────────────────────

  const register = useCallback(
    async (params: RegisterParams) => {
      const data = await apiPost<TokensResponse>('/auth/register', {
        ...params,
        platform: 'mobile',
      });

      await _persist(data.user, data.accessToken, data.refreshToken);
      setState({ user: data.user, isLoading: false, isAuthenticated: true });
    },
    [_persist],
  );

  // ── logout ──────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      const token = accessTokenRef.current ?? (await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN));
      if (token) {
        await apiPost('/auth/logout', {}, token).catch(() => {});
      }
    } finally {
      await _clear();
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, [_clear]);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}
