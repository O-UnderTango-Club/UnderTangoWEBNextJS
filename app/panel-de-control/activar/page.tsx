"use client";
import { useState, type FormEvent } from "react";
import css from "../panel.module.css";

export default function EnableDevice() {
  const [file, setFile] = useState<File>(), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [token, setToken] = useState("");
  async function enable(event: FormEvent) {
    event.preventDefault();
    if (token ? !/^[a-f0-9]{64}$/.test(token) : (!file || file.size > 1024)) { setError("Ingresá el código temporal o seleccioná un archivo de habilitación válido."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/panel/access", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(token ? {token} : JSON.parse(await file!.text())), cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.replace("/panel-de-control");
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo habilitar el navegador."); setBusy(false); }
  }
  return <main className={css.panel}><section className={`${css.card} ${css.login}`}><span className={css.brand}>Ø UnderTango · privado</span><h1>Habilitar este navegador</h1><p>Preparación inicial del acceso de Pablo. Usá un archivo de habilitación o un código temporal.</p><form onSubmit={enable}><label htmlFor="device-file">Archivo de habilitación</label><input id="device-file" type="file" accept="application/json,.json" onChange={event => setFile(event.target.files?.[0])} /><label htmlFor="device-token">Código temporal</label><input id="device-token" type="password" autoComplete="off" maxLength={64} value={token} onChange={event=>setToken(event.target.value.trim())}/><button className={css.primary} disabled={busy}>{busy ? "Habilitando…" : "Habilitar este navegador"}</button></form>{error && <p className={css.error} role="alert">{error}</p>}</section></main>;
}
