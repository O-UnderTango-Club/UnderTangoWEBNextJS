"use client";

import { useState } from "react";

interface ReservaFormData {
  name: string;
  email: string;
  date: string;
  showType: string;
  comments: string;
}

interface ReservaResponse {
  success: boolean;
  message: string;
}

export default function useReservaForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitBooking = async (formData: ReservaFormData) => {
    try {
      setLoading(true);
      setMessage(null);
      setError(null);

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error en la red");

      const result: ReservaResponse = await response.json();

      if (!result.success) throw new Error(result.message || "Error desconocido");

      setMessage(result.message);
      return result;
    } catch (err: any) {
      console.error("Error en reserva:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    message,
    error,
    submitBooking,
  };
}
