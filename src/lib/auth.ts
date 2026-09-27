import { useState, useEffect, useCallback } from 'react';

export const ADMIN_EMAIL = 'professionnal.a@gmail.com';
export const ADMIN_PASSWORD = 'alaa.JABIR06';

const AUTH_STORAGE_KEY = 'mimouzza_admin_auth_v1';
const AUTH_EVENT_NAME = 'mimouzza_auth_change';

export interface AdminSession {
  email: string;
  role: 'admin';
  loggedInAt: number;
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (parsed && parsed.role === 'admin' && parsed.email) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}

export function loginAdmin(
  emailInput: string,
  passwordInput: string
): { success: boolean; error?: string } {
  const normalizedEmail = emailInput.trim().toLowerCase();
  const rawPassword = passwordInput;
  const trimmedPassword = passwordInput.trim();

  const validEmail =
    normalizedEmail === ADMIN_EMAIL.toLowerCase() ||
    normalizedEmail === 'professional.a@gmail.com';

  const validPassword =
    rawPassword === ADMIN_PASSWORD || trimmedPassword === ADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return {
      success: false,
      error: 'Invalid administrator email or password. Please verify your credentials.',
    };
  }

  const session: AdminSession = {
    email: ADMIN_EMAIL,
    role: 'admin',
    loggedInAt: Date.now(),
  };

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  } catch {
    // ignore storage errors
  }

  return { success: true };
}

export function logoutAdmin(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  } catch {
    // ignore storage errors
  }
}

export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession());

  useEffect(() => {
    const handleChange = () => {
      setSession(getAdminSession());
    };
    window.addEventListener(AUTH_EVENT_NAME, handleChange);
    window.addEventListener('storage', handleChange);
    return () => {
      window.removeEventListener(AUTH_EVENT_NAME, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  const login = useCallback((email: string, password: string) => {
    return loginAdmin(email, password);
  }, []);

  const logout = useCallback(() => {
    logoutAdmin();
  }, []);

  return {
    isAuthenticated: session !== null,
    adminSession: session,
    login,
    logout,
  };
}
