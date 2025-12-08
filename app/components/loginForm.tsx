"use client";

import "../styles/login.css"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await login(email, password);

    if (!res.success) {
      setErrorMsg(res.message ?? "Credenciales incorrectas");
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <form onSubmit={handleLogin}>
      {errorMsg && <div className="error-box">{errorMsg}</div>}

      <div className="form-group">
        <label>Correo Electrónico</label>
        <div className="input-wrap">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Contraseña</label>
        <div className="input-wrap">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Cargando..." : "Iniciar Sesión"}
      </button>

      <div className="forgot-password-link">
        <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
      </div>
    </form>
  );
}
