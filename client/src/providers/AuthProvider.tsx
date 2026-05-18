import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@/types";
import { authApi } from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "dms_auth_token";
const USER_KEY = "dms_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (token) {
          // Try to validate token with server
          try {
            const res = await authApi.getMe();
            if (res.success) {
              setState({ user: res.user, isAuthenticated: true, isLoading: false });
              return;
            }
          } catch (apiErr: any) {
            // API call failed - if 401, token is invalid, clear it
            if (apiErr.message?.includes("401") || apiErr.message?.includes("Not authorized")) {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
              setState({ user: null, isAuthenticated: false, isLoading: false });
              return;
            }
            // Other API error - try to use cached user anyway
            if (storedUser) {
              try {
                const user = JSON.parse(storedUser);
                setState({ user, isAuthenticated: true, isLoading: false });
                return;
              } catch {
                // Invalid JSON
              }
            }
          }
        }

        // No token but have stored user - still use it for smoother UX
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setState({ user, isAuthenticated: true, isLoading: false });
            return;
          } catch {
            // Invalid JSON
          }
        }

        // Nothing worked - clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch (err) {
        console.error("Auth init error:", err);
      }
      setState({ user: null, isAuthenticated: false, isLoading: false });
    };
    init();
  }, []);

  const login = (user: User, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}