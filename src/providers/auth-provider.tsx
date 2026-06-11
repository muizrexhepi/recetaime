import { useMutation, useQuery } from "convex/react";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../../convex/_generated/api";

const TOKEN_KEY = "recetaime_auth_token";

export type User = {
  _id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;

  onboardingCompleted: boolean;

  subscriptionStatus: "inactive" | "trial" | "active" | "expired";
  hasActiveSubscription: boolean;

  selectedSources?: string[];
  selectedGoals?: string[];
  selectedReminderMoments?: string[];
  heardFrom?: string;
  ageRange?: string;
  expoPushToken?: string;
  notificationsEnabled?: boolean;

  createdAt: number;
  updatedAt: number;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;

  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isPro: boolean;

  setSession: (token: string) => Promise<void>;
  createDevUser: () => Promise<void>;
  registerWithEmailPassword: (args: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<string>;
  signInWithEmailPassword: (args: {
    email: string;
    password: string;
  }) => Promise<string>;
  signInWithOAuthProfile: (args: {
    provider: "apple" | "google";
    providerId: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  }) => Promise<string>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);

  const user = useQuery(api.auth.getMe, token ? { token } : "skip") as
    | User
    | null
    | undefined;

  const createDevUserMutation = useMutation(api.auth.createDevUser);
  const registerWithEmailPasswordMutation = useMutation(
    api.auth.registerWithEmailPassword,
  );
  const signInWithEmailPasswordMutation = useMutation(
    api.auth.signInWithEmailPassword,
  );
  const signInWithOAuthProfileMutation = useMutation(
    api.auth.signInWithOAuthProfile,
  );
  const signOutMutation = useMutation(api.auth.signOut);

  useEffect(() => {
    async function loadToken() {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) setToken(stored);
      } finally {
        setTokenLoaded(true);
      }
    }

    loadToken();
  }, []);

  const setSession = useCallback(async (nextToken: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    setToken(nextToken);
  }, []);

  const createDevUser = useCallback(async () => {
    const result = await createDevUserMutation();
    await setSession(result.token);
  }, [createDevUserMutation, setSession]);

  const registerWithEmailPassword = useCallback(
    async (args: { email: string; password: string; name?: string }) => {
      const result = await registerWithEmailPasswordMutation(args);
      await setSession(result.token);
      return result.token;
    },
    [registerWithEmailPasswordMutation, setSession],
  );

  const signInWithEmailPassword = useCallback(
    async (args: { email: string; password: string }) => {
      const result = await signInWithEmailPasswordMutation(args);
      await setSession(result.token);
      return result.token;
    },
    [signInWithEmailPasswordMutation, setSession],
  );

  const signInWithOAuthProfile = useCallback(
    async (args: {
      provider: "apple" | "google";
      providerId: string;
      email?: string;
      name?: string;
      avatarUrl?: string;
    }) => {
      const result = await signInWithOAuthProfileMutation(args);
      await setSession(result.token);
      return result.token;
    },
    [signInWithOAuthProfileMutation, setSession],
  );

  const signOut = useCallback(async () => {
    const currentToken = token;

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);

    if (currentToken) {
      try {
        await signOutMutation({ token: currentToken });
      } catch {
        // Ignore backend signout failure.
      }
    }
  }, [signOutMutation, token]);

  const isLoading = !tokenLoaded || (!!token && user === undefined);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      token,

      isLoading,
      isAuthenticated: !!user,
      isGuest: !user,
      isPro:
        user?.hasActiveSubscription === true ||
        user?.subscriptionStatus === "active",

      setSession,
      createDevUser,
      registerWithEmailPassword,
      signInWithEmailPassword,
      signInWithOAuthProfile,
      signOut,
    }),
    [
      createDevUser,
      isLoading,
      registerWithEmailPassword,
      setSession,
      signInWithEmailPassword,
      signInWithOAuthProfile,
      signOut,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
