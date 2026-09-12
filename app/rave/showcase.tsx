import styles from "./showcase.module.css";
import VideoPlayer from "./video-player";

export function ReviewNote() {
  return <aside className={styles.reviewNote}><span>VERSIÓN PARA REVISAR</span><p>Los espacios señalados muestran las fotos, videos y datos que falta completar.</p></aside>;
}

export function MissingMedia({ kind, label, detail }: { kind: "vertical" | "photo" | "landscape" | "clip"; label: string; detail: string }) {
  return <div className={`${styles.missingMedia} ${styles[kind]}`} role="group" aria-label={label}><span className={styles.pendingTag}>POR COMPLETAR</span><div><p className={styles.missingLabel}>{label}</p><p className={styles.missingDetail}>{detail}</p></div></div>;
}

export function VideoSample({ id, title, portrait = false }: { id: string; title: string; portrait?: boolean }) {
  return <figure className={styles.videoSample}><VideoPlayer id={id} title={title} portrait={portrait} /><figcaption><strong>{title}</strong><a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">Ver en YouTube ↗</a></figcaption></figure>;
}
