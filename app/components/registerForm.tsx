"use client";

import "../styles/login.css";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import PasswordStrengthBar from "../components/passwordStrengthBar";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from "../utils/validators";

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // VALIDACIONES
    const e1 = validateEmail(email);
    if (e1) {
      setErrorMsg(e1);
      setLoading(false);
      return;
    }

    const e2 = validatePassword(password);
    if (e2) {
      setErrorMsg(e2);
      setLoading(false);
      return;
    }

    const e3 = validatePasswordMatch(password, confirmPassword);
    if (e3) {
      setErrorMsg(e3);
      setLoading(false);
      return;
    }

    // REGISTRO
    const res = await register({
      email,
      password,
      first_name,
      last_name,
      username,
      phone: phone || undefined,
    });

    if (!res.success) {
      setErrorMsg(res.message ?? "Error al registrarse.");
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <form onSubmit={handleRegister}>
      {errorMsg && <div className="error-box">{errorMsg}</div>}

    {/* FIRST NAME */}
    <div className="form-group">
      <label>Nombre</label>
      <div className="input-wrap">
        <input
          type="text"
          value={first_name}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>
    </div>

    {/* LAST NAME */}
    <div className="form-group">
      <label>Apellido</label>
      <div className="input-wrap">
        <input
          type="text"
          value={last_name}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
    </div>

      {/* USERNAME */}
      <div className="form-group">
        <label>Usuario</label>
        <div className="input-wrap">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      </div>

      {/* PHONE (optional) */}
      <div className="form-group">
        <label>Teléfono (opcional)</label>
        <div className="input-wrap">
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: +54 9 1123456789"
          />
        </div>
      </div>

      {/* EMAIL */}
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

      {/* PASSWORD */}
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

        <PasswordStrengthBar password={password} />
      </div>

      {/* CONFIRM PASSWORD */}
      <div className="form-group">
        <label>Confirmar Contraseña</label>
        <div className="input-wrap">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword((s) => !s)}
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Cargando..." : "Registrarse"}
      </button>
      
    </form>
  );
}
