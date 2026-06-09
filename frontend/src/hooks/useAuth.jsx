import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, AUTH_EXPIRED_EVENT, getToken, setToken } from '../lib/api.js';

const AuthContext = createContext(null);

function getTokenExpiryMs(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const expiryTimerRef = useRef(null);

  const clearSession = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
    setToken(null);
    setUser(null);
  }, []);

  const scheduleSessionExpiry = useCallback((token) => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    const expiresAt = getTokenExpiryMs(token);
    if (!expiresAt) return;

    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      clearSession();
      return;
    }

    expiryTimerRef.current = setTimeout(clearSession, remainingMs);
  }, [clearSession]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    scheduleSessionExpiry(token);

    apiFetch('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {
        clearSession();
      })
      .finally(() => setLoading(false));
  }, [clearSession, scheduleSessionExpiry]);

  useEffect(() => {
    const onSessionExpired = () => {
      clearSession();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onSessionExpired);
  }, [clearSession]);

  const login = useCallback(async (username, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      auth: false,
      body: { username, password },
    });
    setToken(data.token);
    setUser(data.user);
    scheduleSessionExpiry(data.token);
  }, [scheduleSessionExpiry]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
