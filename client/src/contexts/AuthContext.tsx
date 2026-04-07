import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuthToken, clearAuthToken, getAuthToken } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  department: string | null;
  jobTitle: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requiresSetup?: boolean; userId?: string; email?: string; setupToken?: string }>;
  setPassword: (email: string, newPassword: string, setupToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    fetch("/api/auth/me", { credentials: "include", headers })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          clearAuthToken();
        }
      })
      .catch(() => { clearAuthToken(); })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }
    if (data.requiresSetup) {
      return { requiresSetup: true, userId: data.userId, email: data.email, setupToken: data.setupToken };
    }
    if (data.authToken) {
      setAuthToken(data.authToken);
    }
    setUser(data);
    return {};
  }, []);

  const setPasswordFn = useCallback(async (email: string, newPassword: string, setupToken: string) => {
    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword, setupToken }),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to set password");
    }
    if (data.authToken) {
      setAuthToken(data.authToken);
    }
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    await fetch("/api/auth/logout", { method: "POST", credentials: "include", headers });
    clearAuthToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, setPassword: setPasswordFn, logout }}>
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
