import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, tokenStore } from "./api.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // bootstrap from stored token
  useEffect(() => {
    const t = tokenStore.get();
    if (!t) { setReady(true); return; }
    api.get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true));
  }, []);

  const finishAuth = useCallback((token, u) => {
    tokenStore.set(token);
    setUser(u);
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    finishAuth(r.data.token, r.data.user);
    return r.data.user;
  }, [finishAuth]);

  const register = useCallback(async (name, email, password) => {
    const r = await api.post("/auth/register", { name, email, password });
    finishAuth(r.data.token, r.data.user);
    return r.data.user;
  }, [finishAuth]);

  // used by the Google OAuth redirect callback page
  const setTokenAndLoad = useCallback(async (token) => {
    tokenStore.set(token);
    const r = await api.get("/auth/me");
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, ready, login, register, logout, setTokenAndLoad }}>
      {children}
    </AuthCtx.Provider>
  );
}
