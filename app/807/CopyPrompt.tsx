"use client";

import { useState } from "react";
import styles from "./protocol.module.css";

export default function CopyPrompt({ text }: { text: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Instrucciones copiadas. Agregá tu tarea antes de enviarlas.");
    } catch {
      setStatus("No se pudo copiar automáticamente. Abrí el texto de abajo y copialo manualmente.");
    }
  }
  return <div className={styles.copyControl}>
    <button type="button" onClick={copy}>Copiar instrucciones para una IA</button>
    <span role="status">{status}</span>
  </div>;
}
