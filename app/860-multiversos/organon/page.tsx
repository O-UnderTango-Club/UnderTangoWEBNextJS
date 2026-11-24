"use client";

import { useEffect, useState } from "react";
import {
  archiveControls, changes, CONTROL_FILE, describeControls, FIXED_CONTROLS, isControlSetting, JOURNAL_KEY,
  parseControlFile, restoreControls, SETTINGS_PREFIX, TRANSPORT_NAMES, type Archive,
} from "../control-map";
import styles from "./page.module.css";

const date = (value: string) => new Date(value).toLocaleString("es-AR", {timeZone:"America/Argentina/Cordoba"});
function Table({ rows, label }: {rows: Record<string,string>; label: string}) {
  return <table aria-label={label}><tbody>{Object.entries(rows).map(([action, control]) =>
    <tr key={action}><th scope="row">{action}</th><td>{control}</td></tr>)}</tbody></table>;
}

export default function Organon() {
  const [archive, setArchive] = useState<Archive>();
  const [message, setMessage] = useState("");
  const [candidate, setCandidate] = useState<ReturnType<typeof parseControlFile>>();
  const [reviewedAt, setReviewedAt] = useState("");
  const [restoring, setRestoring] = useState(false);
  useEffect(() => {
    let live = true;
    const refresh = () => {
      archiveControls().then(result => { if (live) setArchive(result); }).catch(error => {
        if (live) setMessage(error instanceof Error ? error.message : "No se pudo leer el archivo de controles.");
      });
    };
    const changed = (e: StorageEvent) => {
      if (!e.key || e.key === JOURNAL_KEY || (e.key.startsWith(SETTINGS_PREFIX) && isControlSetting(e.key.slice(SETTINGS_PREFIX.length)))) refresh();
    };
    refresh();
    window.addEventListener("storage", changed);
    return () => { live = false; window.removeEventListener("storage", changed); };
  }, []);

  async function download() {
    try {
      const next = await archiveControls();
      setArchive(next);
      const blob = new Blob([JSON.stringify(next.map, null, 2)], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = CONTROL_FILE;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { setMessage("No se pudo exportar el mapa."); }
  }
  async function inspect(file?: File) {
    setCandidate(undefined);
    setMessage("");
    if (!file) return;
    try {
      if (file.size > 524288) throw Error("El archivo supera los 512 KB.");
      const settings = parseControlFile(await file.text());
      const current = await archiveControls();
      setArchive(current);
      setReviewedAt(current.map.fecha);
      setCandidate(settings);
    } catch (error) { setMessage(error instanceof Error ? error.message : "El archivo no se pudo leer."); }
  }
  async function restore() {
    if (!candidate) return;
    setRestoring(true);
    try {
      setArchive(await restoreControls(candidate, reviewedAt));
      setCandidate(undefined);
      setMessage("Mapa restaurado en este navegador.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo restaurar el mapa."); }
    finally { setRestoring(false); }
  }
  const map = archive?.map;
  const edits = candidate && map ? changes(map.asignaciones, describeControls(candidate.settings)) : [];
  return <main className={styles.page} lang="es">
    <a href="/860-multiversos">← Volver a 860 Multiversos</a>
    <h1>Órganon de 860</h1>
    <h2>Mapa de controles</h2>
    {map && <>
      <p>Última revisión de este navegador · <time dateTime={map.fecha}>{date(map.fecha)}</time></p>
      <p>{archive.fileSaved ? "Cada reasignación actualiza Controles-860.json en el almacenamiento privado de este navegador." : "El mapa está en este perfil. Descargá una copia para conservar el archivo."}</p>
      <Table rows={{
        [TRANSPORT_NAMES.stopScene]: "Sin asignar",
        [TRANSPORT_NAMES.playAll]: "Sin asignar",
        [TRANSPORT_NAMES.clear]: "Sin asignar",
        ...map.asignaciones,
      }} label="Asignaciones del operador"/>
      {map.coincidencias?.map(line => <p key={line}>{line}</p>)}
      <div className={styles.actions}>
        <button onClick={() => void download()}>Descargar {CONTROL_FILE}</button>
        <label>Importar una copia <input type="file" accept=".json,application/json" onChange={e => {const file = e.target.files?.[0]; e.target.value = ""; void inspect(file);}} /></label>
      </div>
    </>}
    {candidate && <div className={styles.review}>
      <h3>Revisar la restauración</h3>
      {edits.length ? <ul>{edits.map(line => <li key={line}>{line}</li>)}</ul> : <p>Las asignaciones visibles coinciden. Podés recuperar los identificadores de la copia.</p>}
      <button disabled={restoring} onClick={() => void restore()}>Aplicar este mapa</button>
      <button disabled={restoring} onClick={() => setCandidate(undefined)}>Cancelar</button>
    </div>}
    {message && <p role="status">{message}</p>}
    <details><summary>Teclado y Hercules</summary><Table rows={FIXED_CONTROLS} label="Controles incorporados"/></details>
    {map && <details><summary>Historial de asignaciones</summary><ol>{[...map.historial].reverse().map((rev, i) =>
      <li key={i}><time dateTime={rev.fecha}>{date(rev.fecha)}</time><ul>{rev.cambios.map((change, j) => <li key={j}>{change}</li>)}</ul></li>)}</ol></details>}
    {map && <details><summary>Ver archivo JSON</summary><pre>{JSON.stringify(map, null, 2)}</pre></details>}
    <p><a href="https://github.com/O-UnderTango-Club/UnderTangoWEBNextJS/blob/main/app/860-multiversos/AGENTS.md">Protocolo de trabajo de 860</a></p>
  </main>;
}
