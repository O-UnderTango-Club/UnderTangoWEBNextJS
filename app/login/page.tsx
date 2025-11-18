"use client";

import { useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import "../styles/login.css";
import { authService } from "../api/auth/authService";

export default function LoginRegister() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // toggles para ver/ocultar contraseña
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const email = (document.getElementById("login-email") as HTMLInputElement)
      .value;
    const password = (
      document.getElementById("login-password") as HTMLInputElement
    ).value;

    try {
      const data = await authService.login(email, password);
      console.log("Login OK =>", data);

      alert("Login exitoso!");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const fullName = (document.getElementById(
      "register-name"
    ) as HTMLInputElement).value;
    const email = (document.getElementById(
      "register-email"
    ) as HTMLInputElement).value;
    const password = (document.getElementById(
      "register-password"
    ) as HTMLInputElement).value;
    const confirm = (document.getElementById(
      "register-confirm"
    ) as HTMLInputElement).value;
    const phone = (document.getElementById(
      "register-phone"
    ) as HTMLInputElement | null)?.value;

    if (password !== confirm) {
      setErrorMsg("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const [first_name, ...rest] = fullName.split(" ");
    const last_name = rest.join(" ") || "";

    const username = email.split("@")[0];

    try {
      const result = await authService.register({
        first_name,
        last_name,
        email,
        username,
        password,
        phone: phone || "000000",
        user_type: 1,
      });

      console.log("Registro OK =>", result);
      alert("Cuenta creada correctamente!");
      // opcional: cambiar a pestaña login o limpiar form
      setActiveTab("login");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

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
      passwordStrength < 2 ? "#ff4444" : passwordStrength < 3 ? "#ffaa00" : "#3bd46a",
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
                      <input type="email" id="login-email" required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Contraseña</label>
                    <div className="input-wrap">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        id="login-password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        aria-label="Mostrar contraseña"
                        onClick={() => setShowLoginPassword((s) => !s)}
                      >
                        {showLoginPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10 10 0 0 1 12 20c-5 0-9.27-3.11-11-8a20.42 20.42 0 0 1 4.48-6.35"/><path d="M1 1l22 22"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
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
                    <label>Nombre Completo</label>
                    <div className="input-wrap">
                      <input type="text" id="register-name" required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <div className="input-wrap">
                      <input type="email" id="register-email" required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Contraseña</label>
                    <div className="input-wrap">
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        id="register-password"
                        onChange={(e) => checkPasswordStrength(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        aria-label="Mostrar contraseña"
                        onClick={() => setShowRegisterPassword((s) => !s)}
                      >
                        {showRegisterPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10 10 0 0 1 12 20c-5 0-9.27-3.11-11-8a20.42 20.42 0 0 1 4.48-6.35"/><path d="M1 1l22 22"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>

                    <div className="password-strength" style={{ marginTop: 10 }}>
                      <div className="password-strength-bar" style={strengthBarStyle}></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirmar Contraseña</label>
                    <div className="input-wrap">
                      <input
                        type={showRegisterConfirm ? "text" : "password"}
                        id="register-confirm"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        aria-label="Mostrar contraseña de confirmación"
                        onClick={() => setShowRegisterConfirm((s) => !s)}
                      >
                        {showRegisterConfirm ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10 10 0 0 1 12 20c-5 0-9.27-3.11-11-8a20.42 20.42 0 0 1 4.48-6.35"/><path d="M1 1l22 22"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Teléfono (opcional)</label>
                    <div className="input-wrap">
                      <input type="text" id="register-phone" placeholder="(opcional)" />
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
