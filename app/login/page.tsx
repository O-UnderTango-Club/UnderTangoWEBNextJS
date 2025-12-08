"use client";

import Header from "../components/header";
import LoginForm from "../components/loginForm";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) return <p>Cargando...</p>;

  return (
    <>
      <Header />
      <div className="login-container">
        <div className="register-wrapper">
        <h2>Iniciar Sesión</h2>
        <LoginForm />
        </div>
      </div>
    </>
  );
}
