
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { apiRequest } from "@/lib/api";

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt?: string;
}

interface ProfileResponse {
  message: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      // First, try the existing access token.
      const profile = await apiRequest<ProfileResponse>(
        "/auth/me",
      );

      setUser(profile.user);
      return profile.user;
    } catch {
      try {
        // If the access token expired, use the refresh token.
        await apiRequest<{ message: string }>("/auth/refresh", {
          method: "POST",
        });

        // Retry profile request with the new access token.
        const profile = await apiRequest<ProfileResponse>(
          "/auth/me",
        );

        setUser(profile.user);
        return profile.user;
      } catch {
        setUser(null);
        return null;
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest<{ message: string }>("/auth/logout", {
        method: "POST",
      });
    } finally {
      // Clear frontend authentication state even if the API fails.
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      setIsLoading(true);

      try {
        const restoredUser = await refreshUser();

        if (!active) return;

        setUser(restoredUser);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}
