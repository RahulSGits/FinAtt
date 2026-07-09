"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "./mock";

export interface Session {
  role: Role;
  email: string;
  name: string;
  companyName?: string;
  empId?: string;
  /** ISO timestamp of login — sessions older than 24 h are discarded. */
  loginAt?: string;
}

interface AuthCtx {
  session: Session | null;
  login: (s: Session) => void;
  logout: () => void;
  /** Update editable profile fields (company, email, empId). */
  updateProfile: (patch: Partial<Pick<Session, "companyName" | "email" | "empId" | "name">>) => void;
  ready: boolean;
}

// Dynamic session key support for demo
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function sanitise(raw: unknown): Session | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.role || !o.email || !o.name) return null;
  const validRoles: Role[] = ["admin", "hr", "employee"];
  if (!validRoles.includes(o.role as Role)) return null;

  // Expiry check
  if (o.loginAt) {
    const age = Date.now() - new Date(o.loginAt as string).getTime();
    if (age > MAX_AGE_MS) return null;
  }

  return {
    role: o.role as Role,
    email: String(o.email).slice(0, 100),
    name: String(o.name).slice(0, 80),
    companyName: o.companyName ? String(o.companyName).slice(0, 100) : undefined,
    empId: o.empId ? String(o.empId).slice(0, 30) : undefined,
    loginAt: o.loginAt ? String(o.loginAt) : undefined,
  };
}

const Ctx = createContext<AuthCtx>({
  session: null,
  login: () => {},
  logout: () => {},
  updateProfile: () => {},
  ready: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const [sessionKey, setSessionKey] = useState("gs_session");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mockRole = params.get("mock_role");
    const key = mockRole ? `gs_session_${mockRole}` : "gs_session";
    setSessionKey(key);

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = sanitise(JSON.parse(raw));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed) setSession(parsed);
        else localStorage.removeItem(key); // expired or tampered
      }
    } catch {
      localStorage.removeItem(key);
    }
    setReady(true);
  }, []);

  const login = (s: Session) => {
    const stamped = { ...s, loginAt: new Date().toISOString() };
    localStorage.setItem(sessionKey, JSON.stringify(stamped));
    setSession(stamped);
  };

  const logout = () => {
    localStorage.removeItem(sessionKey);
    setSession(null);
  };

  const updateProfile = (
    patch: Partial<Pick<Session, "companyName" | "email" | "empId" | "name">>,
  ) => {
    if (!session) return;
    const next = { ...session, ...patch };
    localStorage.setItem(sessionKey, JSON.stringify(next));
    setSession(next);
  };

  return (
    <Ctx.Provider value={{ session, login, logout, updateProfile, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
