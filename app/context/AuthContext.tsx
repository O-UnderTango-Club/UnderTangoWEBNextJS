"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../src/lib/supabase";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";

interface AuthContextProps {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: RegisterPayload) => Promise<any>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<any>; // ← agregado
}

interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión al iniciar
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Escuchar cambios en la sesión
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // LOGIN
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, user: data.user };
  };

  // REGISTER
  const register = async ({
    email,
    password,
    first_name,
    last_name,
    username,
    phone,
  }: RegisterPayload) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          phone: phone || undefined,
        },
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, user: data.user };
  };

  // UPDATE PASSWORD
  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, user: data.user };
  };

  // LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        updatePassword, // ← agregado al contexto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
