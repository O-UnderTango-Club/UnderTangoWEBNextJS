"use client";

import Header from "../components/header";
import ForgotPasswordForm from "../components/forgotPassword";
import "../styles/forgotPassword.css";

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <div className="login-container">
        <div className="register-wrapper">
          <h2>Recuperar Contraseña</h2>
          <ForgotPasswordForm />
        </div>
      </div>
    </>
  );
}
