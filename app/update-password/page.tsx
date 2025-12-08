"use client";

import Header from "../components/header";
import UpdatePassword from "../components/UpdatePassword";

export default function UpdatePasswordPage() {
  return (
    <>
      <Header />
      <div className="login-container">
        <div className="register-wrapper">
          <h2>Actualizar Contraseña</h2>
          <UpdatePassword />
        </div>
      </div>
    </>
  );
}
