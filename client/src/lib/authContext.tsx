import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@shared/schema";

type SafeUser = Omit<User, "password"> & { token?: string; stripeCustomerId?: string | null };

interface AuthContextType {
  user: SafeUser | null;
  token: string | null;
  login: (user: SafeUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(() => {
    try {
      const stored = localStorage.getItem("corplease_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("corplease_token");
    } catch {
      return null;
    }
  });

  const login = (u: SafeUser) => {
    const { token: userToken, ...userData } = u;
    setUser(userData as SafeUser);
    localStorage.setItem("corplease_user", JSON.stringify(userData));
    if (userToken) {
      setToken(userToken);
      localStorage.setItem("corplease_token", userToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("corplease_user");
    localStorage.removeItem("corplease_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("corplease_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("corplease_user");
    localStorage.removeItem("corplease_token");
    window.location.href = "/";
  }
  return res;
}
