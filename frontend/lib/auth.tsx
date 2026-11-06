"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokenStore, type Role, type User } from "./api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

// Public sign-up always creates a member; role is never sent.
export interface RegisterInput {
  name: string;
  email: string;
  tel: string;
  password: string;
}

// Landing page after login: admins go to All Bookings, members to Facilities.
export const homeFor = (role: Role) => (role === "admin" ? "/admin/bookings" : "/");

type AuthResponse = User & { token: string };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from the saved token.
  useEffect(() => {
    const restore = tokenStore.get()
      ? api<User>("/auth/me").then(setUser).catch(() => tokenStore.clear())
      : Promise.resolve();
    restore.finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback((data: AuthResponse) => {
    const { token, ...rest } = data;
    tokenStore.set(token);
    setUser(rest);
    return rest;
  }, []);

  const login = useCallback(
    async (email: string, password: string) =>
      handleAuth(await api<AuthResponse>("/auth/login", { method: "POST", body: { email, password } })),
    [handleAuth]
  );

  const register = useCallback(
    async (input: RegisterInput) =>
      handleAuth(await api<AuthResponse>("/auth/register", { method: "POST", body: input })),
    [handleAuth]
  );

  const logout = useCallback(async () => {
    // The backend only clears its cookie; the bearer token must be dropped here.
    await api("/auth/logout").catch(() => {});
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
