"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  login as loginApi,
  register as registerApi,
  refreshToken,
  verifyToken
} from "@/app/api/auth";

interface User {
  id?: number;
  name?: string;
  surname?: string;
  email?: string;
  role?: string;
  
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // -----------------------
  // Cargar token desde localStorage al iniciar 
  // -----------------------
  useEffect(() => {
    // 1. Next.js Guard: Si estamos en el servidor (build), salimos.
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    // Verificar token con backend
    verifyToken(storedToken).then((res) => {
      if (res.success) {
        setUser(res.user);
      } else {
        localStorage.removeItem("token");
      }
      setLoading(false);
    });
  }, []); 

  // -----------------------
  // Login
  // -----------------------
  const login = async (email: string, password: string) => {
    const res = await loginApi(email, password);

    if (res.success) {
      // Guard para localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("token", res.token);
      }
      setUser(res.user);
      setToken(res.token);
    }

    return res;
  };

  // -----------------------
  // Register
  // -----------------------
  const register = async (data: any) => {
    return await registerApi(data);
  };

  // -----------------------
  // Logout
  // -----------------------
  const logout = () => {
    // Guard para localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setUser(null);
    setToken(null);
  };

  // -----------------------
  // Auto Refresh Token (cada 14 minutos si el token dura 15)
  // -----------------------
  useEffect(() => {
    // Si no hay token o estamos en el servidor, no iniciamos el intervalo
    if (!token || typeof window === "undefined") return;

    const interval = setInterval(async () => {
      const res = await refreshToken(token);

      if (res.success) {
        // Guard para localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("token", res.newToken);
        }
        setToken(res.newToken);
      } else {
        logout();
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  // -----------------------
  // RETURN FINAL DEL COMPONENTE
  // -----------------------
  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};