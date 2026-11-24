"use client";

import { useEffect, useState } from "react";
import styles from "./panel.module.css";

const destinations = [
  { name: "Instagram Reels", account: "@undertangoclub", url: "https://business.facebook.com/latest/home", publisher: "Abrir Meta para Instagram" },
  { name: "Facebook Reels", account: "Página UnderTango Club", url: "https://business.facebook.com/latest/home", publisher: "Abrir Meta para Facebook" },
  { name: "TikTok", account: "@undertangoclub", url: "https://www.tiktok.com/tiktokstudio/upload", publisher: "Abrir TikTok Studio" },
  { name: "YouTube Shorts", account: "@undertangoclub", url: "https://studio.youtube.com/", publisher: "Abrir YouTube Studio" },
  { name: "LinkedIn", account: "Página UnderTango Club", url: "https://www.linkedin.com/company/undertangoclub/", publisher: "Abrir página de LinkedIn" },
] as const;

type Destination = typeof destinations[number]["name"];

export default function PublicationPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [videoInfo, setVideoInfo] = useState("");
  const [reference, setReference] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<Destination[]>(() => destinations.map(({ name }) => name));
  const [overrides, setOverrides] = useState<Partial<Record<Destination, string>>>({});
  const [status, setStatus] = useState("");
  const [panelUrl, setPanelUrl] = useState("/84");

  useEffect(() => {
    setPanelUrl(window.location.origin + "/84");
  }, []);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const brief = [
    "UnderTango · Ficha de publicación 84",
    "Panel: " + panelUrl,
    "Video maestro: " + (reference.trim() || file?.name || "Adjuntar archivo o enlace al chat"),
    ...(file && reference.trim() ? ["Archivo previsualizado: " + file.name] : []),
    ...(title.trim() && selected.includes("YouTube Shorts") ? ["Título de YouTube: " + title.trim()] : []),
    "",
    ...destinations.filter(({ name }) => selected.includes(name)).map(({ name, account }) =>
      name + " · " + account + "\n" + (overrides[name]?.trim() || caption.trim() || "Texto por preparar"),
    ),
    "",
    "Seguí el protocolo del panel 84 y la orden de Pablo para preparar o publicar.",
  ].join("\n");

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      setStatus("Ficha copiada. Pegala en el chat con el archivo o su enlace.");
    } catch {
      setStatus("Seleccioná y copiá el texto de la ficha.");
    }
  }

  return (
    <main className={styles.panel}>
      <div className={styles.shell}>
        <nav className={styles.navigation} aria-label="Ubicación">
          <a href="/central-de-control">← Central de control</a>
          <a href="/847">847 · Web UnderTango →</a>
          <a href="/protocolo-84-publicaciones.md" target="_blank" rel="noopener noreferrer">Protocolo para Codex y Clo ↗</a>
        </nav>
        <header className={styles.heading}>
          <h1>84 · Marketing, Comunicación y Audiovisuales</h1>
          <p>Prepará un video maestro y distribuílo con la sesión activa de UnderTango en cada red.</p>
        </header>

        <div className={styles.workspace}>
          <section className={styles.editor} aria-labelledby="master-video">
            <h2 id="master-video">Video maestro</h2>
            <p className={styles.muted}>Formato prioritario · vertical 9:16, alrededor de 60 segundos.</p>
            <label>
              <span>Archivo para vista previa local</span>
              <input type="file" accept="video/*,.mp4,.mov" onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setPreview("");
                setVideoInfo("");
              }} />
            </label>
            {preview ? (
              <figure className={styles.preview}>
                <video
                  key={preview}
                  src={preview}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="Vista previa del video maestro"
                  onLoadedMetadata={({ currentTarget }) => {
                    const seconds = Math.round(currentTarget.duration);
                    const duration = Number.isFinite(seconds) ? seconds + " s · " : "";
                    setVideoInfo(duration + currentTarget.videoWidth + " × " + currentTarget.videoHeight);
                  }}
                  onError={() => setVideoInfo("El navegador no pudo reproducir el archivo.")}
                />
                {videoInfo ? <figcaption>{videoInfo}</figcaption> : null}
              </figure>
            ) : null}
            <label>
              <span>Enlace de Drive o referencia al archivo</span>
              <input value={reference} onChange={(event) => setReference(event.target.value)} />
            </label>
            <label>
              <span>Texto común</span>
              <textarea rows={4} value={caption} onChange={(event) => setCaption(event.target.value)} />
            </label>
            <label>
              <span>Título para YouTube</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
          </section>

          <section className={styles.destinations} aria-labelledby="destinations">
            <h2 id="destinations">Redes de publicación</h2>
            <p className={styles.muted}>Abrí cada publicador en el navegador donde ya iniciaste sesión y comprobá la cuenta activa.</p>
            <ul>
              {destinations.map(({ name, account, url, publisher }) => {
                const included = selected.includes(name);
                return (
                  <li key={name} className={styles.destination}>
                    <div className={styles.destinationTop}>
                      <label className={styles.checkbox}>
                        <input type="checkbox" checked={included} onChange={({ target }) => {
                          const checked = target.checked;
                          setSelected((current) => checked ? [...current, name] : current.filter((item) => item !== name));
                        }} />
                        <span><strong>{name}</strong><small>{account}</small></span>
                      </label>
                      <a href={url} target="_blank" rel="noopener noreferrer">{publisher} ↗</a>
                    </div>
                    {included ? (
                      <details>
                        <summary>Personalizar texto</summary>
                        <label>
                          <span>Texto para {name}</span>
                          <textarea rows={3} placeholder="Si queda vacío, se usa el texto común" value={overrides[name] ?? ""} onChange={({ target }) => {
                            const value = target.value;
                            setOverrides((current) => ({ ...current, [name]: value }));
                          }} />
                        </label>
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section className={styles.handoff} aria-labelledby="brief">
          <div className={styles.destinationTop}>
            <div>
              <h2 id="brief">Ficha para Codex o Clo</h2>
              <p className={styles.muted}>Compartí la ficha junto al video y la orden de preparar o publicar.</p>
            </div>
            <button type="button" disabled={selected.length === 0} onClick={copyBrief}>Copiar ficha</button>
          </div>
          <textarea rows={6} readOnly aria-labelledby="brief" value={brief} />
          <p role="status">{status}</p>
        </section>
      </div>
    </main>
  );
}
