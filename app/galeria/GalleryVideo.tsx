"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./galeria.module.css";

type Props = { id: string; title: string; portrait?: boolean; priority?: boolean };

export default function GalleryVideo({ id, title, portrait = false, priority = false }: Props) {
  const [playing, setPlaying] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  return <figure className={styles.video}>
    <div className={`${styles.videoFrame} ${portrait ? styles.portrait : ""}`}>
      {playing ? <iframe src={`https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> :
        <button className={styles.playButton} type="button" onClick={() => setPlaying(true)} aria-label={`Reproducir ${title}`}>
          {!thumbnailFailed && <Image src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" fill unoptimized priority={priority} sizes={portrait ? "(max-width: 760px) 90vw, 360px" : "(max-width: 760px) 90vw, 400px"} onError={() => setThumbnailFailed(true)} />}
          <span className={styles.playIcon} aria-hidden="true">▶</span><span className={styles.playLabel}>{thumbnailFailed ? title : "Ver el registro"}</span>
        </button>}
    </div>
    <figcaption><a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">{title} <span>Ver en YouTube ↗</span></a></figcaption>
  </figure>;
}
