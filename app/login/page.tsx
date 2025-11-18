"use client";

import { useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import "../styles/login.css";
import { useAuth } from "../context/AuthContext";

export default function LoginRegister() {
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // -----------------------------
  // LOGIN
  // -----------------------------
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // -----------------------------
  // REGISTER
  // -----------------------------
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

  // -----------------------------
  // LOGIN HANDLER
  // -----------------------------
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMsg(res.message || "Credenciales incorrectas");
      } else {
        alert("Login exitoso!");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // REGISTER HANDLER
  // -----------------------------
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (registerPassword !== registerConfirm) {
      setErrorMsg("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const username = registerEmail.split("@")[0];

    try {
      const res = await register({
        first_name: firstName,
        last_name: lastName,
        email: registerEmail,
        username,
        password: registerPassword,
        phone: registerPhone || "000000",
        user_type: 1,
      });

      if (!res.success) {
        setErrorMsg(res.message || "Error al registrar");
      } else {
        alert("Cuenta creada correctamente!");
        setActiveTab("login");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // PASSWORD STRENGTH
  // -----------------------------
  const checkPasswordStrength = (value: string) => {
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^A-Za-z0-9]/.test(value)) strength++;
    setPasswordStrength(strength);
  };

  const strengthBarStyle = {
    width: `${(passwordStrength / 4) * 100}%`,
    background:
      passwordStrength < 2
        ? "#ff4444"
        : passwordStrength < 3
        ? "#ffaa00"
        : "#3bd46a",
  };

  return (
    <div className="login-page">
      <Header />

      <main className="content-wrapper">
        <div className="container">
          <div className="tabs">
            <div
              className={`tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              Iniciar Sesión
            </div>
            <div
              className={`tab ${activeTab === "register" ? "active" : ""}`}
              onClick={() => setActiveTab("register")}
            >
              Registrarse
            </div>
          </div>

          {errorMsg && <div className="error-box">{errorMsg}</div>}

          <div className="form-container">
            {/* LOGIN */}
            {activeTab === "login" && (
              <div className="form-content active">
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <div className="input-wrap">
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Contraseña</label>
                    <div className="input-wrap">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowLoginPassword((s) => !s)}
                      >
                        {showLoginPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? "Cargando..." : "Iniciar Sesión"}
                  </button>
                </form>
              </div>
            )}

            {/* REGISTER */}
            {activeTab === "register" && (
              <div className="form-content active">
                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label>Nombre</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Apellido</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <div className="input-wrap">
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Contraseña</label>
                    <div className="input-wrap">
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        value={registerPassword}
                        onChange={(e) => {
                          setRegisterPassword(e.target.value);
                          checkPasswordStrength(e.target.value);
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowRegisterPassword((s) => !s)}
                      >
                        {showRegisterPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    <div className="password-strength" style={{ marginTop: 10 }}>
                      <div
                        className="password-strength-bar"
                        style={strengthBarStyle}
                      ></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirmar Contraseña</label>
                    <div className="input-wrap">
                      <input
                        type={showRegisterConfirm ? "text" : "password"}
                        value={registerConfirm}
                        onChange={(e) => setRegisterConfirm(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowRegisterConfirm((s) => !s)}
                      >
                        {showRegisterConfirm ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Teléfono (opcional)</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="(opcional)"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? "Procesando..." : "Crear Cuenta"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
