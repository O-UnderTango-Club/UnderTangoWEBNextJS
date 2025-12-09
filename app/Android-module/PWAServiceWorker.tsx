"use client";

import { useEffect } from "react";
import FcmRegistration from "./FCM/FcmRegistration";

export default function PWAServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        // 1) Service Worker general (scope "/")
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("SW general registrado:", reg.scope);
          })
          .catch((err) => console.error("Error registrando sw.js:", err));

        // 2) Service Worker de Firebase (scope "/firebase/")
        navigator.serviceWorker
          .register("/firebase/firebase-messaging-sw.js", {
            scope: "/firebase/",
          })
          .then((reg) => {
            console.log("SW Firebase registrado:", reg.scope);
          })
          .catch((err) =>
            console.error("Error registrando firebase-messaging-sw.js:", err)
          );
      });
    }
  }, []);

  return (
    <>
      {/* 
        🚀 Renderizar FcmRegistration dispara su useEffect:
        1. Inicializa Firebase.
        2. Solicita permiso de notificación.
        3. Obtiene el token FCM.
        4. Lo envía al backend / Cloud Function.
      */}
      <FcmRegistration />

      {null}
    </>
  );
}
