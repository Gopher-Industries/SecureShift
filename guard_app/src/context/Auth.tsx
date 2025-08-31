import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

type Ctx = {
  token: string | null;
  login: (t: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<Ctx>({ token: null, login: async () => {}, logout: async () => {} });

const KEY = 'JWT_TOKEN';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  // load token once
  useEffect(() => { SecureStore.getItemAsync(KEY).then(setToken); }, []);

  const login = async (t: string) => {            // save token that is submitted
    await SecureStore.setItemAsync(KEY, t);
    setToken(t);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(KEY);
    setToken(null);
  };

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
