"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./showcase.module.css";

export default function VideoPlayer({ id, title, portrait }: { id: string; title: string; portrait: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  return <div className={`${styles.videoFrame} ${portrait ? styles.vertical : styles.clip}`}>
    {playing ? <iframe src={`https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <button type="button" className={styles.playButton} onClick={() => setPlaying(true)} aria-label={`Reproducir ${title}`}>
      {!imageFailed && <Image src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" fill unoptimized sizes={portrait ? "(max-width: 700px) 85vw, 320px" : "(max-width: 700px) 90vw, 520px"} onError={() => setImageFailed(true)} />}
      <span className={styles.playIcon} aria-hidden="true">▶</span><span className={styles.playLabel}>{imageFailed ? title : "Ver el video"}</span>
    </button>}
  </div>;
}
