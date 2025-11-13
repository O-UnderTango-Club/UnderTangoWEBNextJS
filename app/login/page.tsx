"use client";

import { useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import "../styles/login.css";

export default function LoginRegister() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Login enviado");
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Registro enviado");
  };

  const checkPasswordStrength = (value: string) => {
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^A-Za-z0-9]/.test(value)) strength++;
    setPasswordStrength(strength);
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

          <div className="form-container">
            {activeTab === "login" && (
              <div className="form-content active">
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="login-email">Correo Electrónico</label>
                    <input
                      type="email"
                      id="login-email"
                      placeholder="usuario@ejemplo.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="login-password">Contraseña</label>
                    <input
                      type="password"
                      id="login-password"
                      placeholder="Ingresa tu contraseña"
                      required
                    />
                  </div>

                  <div className="remember-forgot">
                    <label className="remember">
                      <input type="checkbox" id="remember-me" />
                      <span>Recordarme</span>
                    </label>
                    <a href="#" className="forgot-link">
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>

                  <button type="submit" className="btn">
                    Iniciar Sesión
                  </button>
                </form>
              </div>
            )}

            {activeTab === "register" && (
              <div className="form-content active">
                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label htmlFor="register-name">Nombre Completo</label>
                    <input
                      type="text"
                      id="register-name"
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-email">Correo Electrónico</label>
                    <input
                      type="email"
                      id="register-email"
                      placeholder="usuario@ejemplo.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-password">Contraseña</label>
                    <input
                      type="password"
                      id="register-password"
                      placeholder="Mínimo 8 caracteres"
                      required
                      onChange={(e) => checkPasswordStrength(e.target.value)}
                    />
                    <div className="password-strength">
                      <div
                        className="password-strength-bar"
                        style={{
                          width: `${(passwordStrength / 4) * 100}%`,
                          background:
                            passwordStrength < 2
                              ? "red"
                              : passwordStrength < 3
                              ? "orange"
                              : "green",
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-confirm">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      id="register-confirm"
                      placeholder="Repite tu contraseña"
                      required
                    />
                  </div>

                  <button type="submit" className="btn">
                    Crear Cuenta
                  </button>

                  <div className="footer-text">
                    Al registrarte, aceptas nuestros términos y condiciones.
                  </div>
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
