"use client";

import { useState } from "react";
import { supabase } from "../../src/lib/supabase";
import "../styles/login.css";


export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim()) {
      setErrorMsg("Ingresá un email válido.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg(
        "Si el email existe, te enviamos un enlace para restablecer la contraseña."
      );
    }
  };

  return (
    <form onSubmit={handleReset} className="forgot-wrapper">
      <div>
        <label>Email</label>
        <input
          type="email"
          placeholder="tuemail@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {errorMsg && <p className="error-msg">{errorMsg}</p>}
      {successMsg && <p className="success-msg">{successMsg}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar enlace"}
      </button>
    </form>
  );
}
