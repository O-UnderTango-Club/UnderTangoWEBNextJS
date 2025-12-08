"use client";

import "../styles/login.css";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function UpdatePassword() {
  const router = useRouter();
  const { updatePassword } = useAuth(); // Asegurate de tener este método en AuthContext

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== password2) {
      setErrorMsg("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const res = await updatePassword(password);

    if (!res.success) {
      setErrorMsg(res.message ?? "No se pudo actualizar la contraseña");
      setLoading(false);
      return;
    }

    setSuccessMsg("Contraseña actualizada correctamente ♥");
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit}>
      {errorMsg && <div className="error-box">{errorMsg}</div>}
      {successMsg && (
        <div className="success-box">
          {successMsg}
        </div>
      )}

      <div className="form-group">
        <label>Nueva Contraseña</label>
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

      <div className="form-group">
        <label>Repetir Contraseña</label>
        <div className="input-wrap">
          <input
            type={showPassword ? "text" : "password"}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </div>
      </div>

      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Actualizando..." : "Actualizar Contraseña"}
      </button>
    </form>
  );
}
