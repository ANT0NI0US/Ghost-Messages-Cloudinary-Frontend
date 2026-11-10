import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getTokens, saveTokens, setSessionEndHandler } from "../api/client.js";
import { auth, users } from "../api/endpoints.js";
import { LogoutEnum, RoleEnum } from "../lib/enums.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const refreshUser = useCallback(async () => {
    const { data } = await users.me();
    setUser(data);
    return data;
  }, []);

  useEffect(() => {
    setSessionEndHandler(() => {
      setUser(null);
      setSessionEnded(true);
    });
    if (!getTokens()) {
      setReady(true);
      return;
    }
    refreshUser()
      .catch(() => saveTokens(null))
      .finally(() => setReady(true));
  }, [refreshUser]);

  // every successful login / confirm / google sign in ends here
  const startSession = useCallback(
    async (tokens) => {
      saveTokens(tokens);
      setSessionEnded(false);
      return refreshUser();
    },
    [refreshUser],
  );

  const logout = useCallback(async (action = LogoutEnum.DEVICE) => {
    try {
      await auth.logout(action);
    } finally {
      saveTokens(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAdmin: user?.role === RoleEnum.ADMIN,
      sessionEnded,
      clearSessionEnded: () => setSessionEnded(false),
      startSession,
      refreshUser,
      setUser,
      logout,
    }),
    [user, ready, sessionEnded, startSession, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
