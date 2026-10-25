import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { UserDto } from "@keytrace/shared";

interface AuthContextType {
  user: UserDto | null;
  isLoading: boolean;
  login: (creds: { emailOrUsername: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setConsent: (hasConsent: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.auth.me();
      if (res.ok && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (creds: { emailOrUsername: string; password: string }) => {
    const res = await api.auth.login(creds);
    if (res.ok && res.user) {
      setUser(res.user);
    }
  };

  const register = async (data: { username: string; email: string; password: string }) => {
    const res = await api.auth.register(data);
    if (res.ok && res.user) {
      setUser(res.user);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
    }
  };

  const setConsent = (hasConsent: boolean) => {
    if (user) {
      setUser({ ...user, hasConsent });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser, setConsent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
