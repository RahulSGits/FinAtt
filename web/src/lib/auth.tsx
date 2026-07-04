"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "./mock";

interface Session {
  role: Role;
  email: string;
  name: string;
}

interface AuthCtx {
  session: Session | null;
  login: (s: Session) => void;
  logout: () => void;
  ready: boolean;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  login: () => {},
  logout: () => {},
  ready: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("gs_session");
    if (raw) setSession(JSON.parse(raw));
    setReady(true);
  }, []);

  const login = (s: Session) => {
    localStorage.setItem("gs_session", JSON.stringify(s));
    setSession(s);
  };
  const logout = () => {
    localStorage.removeItem("gs_session");
    setSession(null);
  };

  return <Ctx.Provider value={{ session, login, logout, ready }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
