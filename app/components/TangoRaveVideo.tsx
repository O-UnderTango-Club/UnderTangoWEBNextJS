import styles from "./TangoRaveVideo.module.css";

export default function TangoRaveVideo() {
  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <iframe
          src="https://www.youtube.com/embed/7yVf96vjurQ?playsinline=1&rel=0"
          title="Ø Tango Rave — video de ejemplo del show en vivo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <figcaption>
        <a href="https://youtube.com/shorts/7yVf96vjurQ" target="_blank" rel="noopener noreferrer">
          Tango Rave en vivo · Ver en YouTube ↗
        </a>
      </figcaption>
    </figure>
  );
}
