import Link from "next/link";
import styles from "./rave.module.css";

export default function RavePage() {
  return <main id="contenido">
    <section className={styles.hero}>
      <p className={styles.eyebrow}>LA BANDA DE UNDERTANGO</p>
      <h1>La raíz.<br/>El pulso.<br/><em>El encuentro.</em></h1>
      <p className={styles.intro}>Dos universos para vivir la música en vivo. Desde Puerto Iguazú, una banda que conecta la identidad argentina con la energía de la fiesta.</p>
      <a className={styles.textLink} href="#propuestas">Elegí tu experiencia ↓</a>
      <div className={styles.orbit} aria-hidden="true">Ø</div>
    </section>
    <section id="propuestas" className={styles.products} aria-label="Dos propuestas de la banda">
      <Link href="/rave/tango-rave" className={styles.card}>
        <span className={styles.eyebrow}>01 / TANGO · ELECTRÓNICA</span><h2>Tango<br/><em>Rave</em></h2>
        <p>Banda en vivo, electrónica, danza y visuales en una misma experiencia escénica.</p>
        <span className={styles.textLink}>Ver el show en vivo ↗</span>
      </Link>
      <Link href="/rave/pena-rave" className={`${styles.card} ${styles.peña}`}>
        <span className={styles.eyebrow}>02 / REPERTORIO ARGENTINO · FIESTA</span><h2>Peña<br/><em>Rave</em></h2>
        <p>La música argentina y misionera se encuentra con la energía de una banda en vivo.</p>
        <span className={styles.badge}>ESTRENO · SEPTIEMBRE 2026 · PUERTO IGUAZÚ</span>
        <span className={styles.textLink}>Conocé lo que estamos preparando ↗</span>
      </Link>
    </section>
    <section className={styles.contact}><p className={styles.eyebrow}>PARA ESPACIOS Y PROGRAMADORES</p><h2>Hagamos lugar<br/>a la próxima fecha.</h2><p>Contanos dónde estás, qué tipo de evento organizás y qué propuesta te interesa.</p><a className={styles.button} href="https://wa.me/5493757618270?text=Hola%2C%20quiero%20conversar%20sobre%20una%20fecha%20para%20la%20banda%20de%20UnderTango.%20Mi%20ciudad%20y%20espacio%20son%3A%20" target="_blank" rel="noopener noreferrer">Proponer una fecha ↗</a></section>
    <section id="video" className={styles.contact} aria-labelledby="rave-video-title">
      <p className={styles.eyebrow}>Ø UNDERTANGO RAVE · VIDEO</p>
      <h2 id="rave-video-title">Un shock de energía.</h2>
      <figure style={{ margin: "32px auto 0", maxWidth: 360 }}>
        <div style={{ aspectRatio: "9 / 16", overflow: "hidden", borderRadius: 16, border: "1px solid #dce8793a", background: "#000" }}>
          <iframe
            src="https://www.youtube.com/embed/sdWzQDMeiYY?playsinline=1&rel=0"
            title="Un shock de energía — Ø UnderTango Rave"
            style={{ width: "100%", height: "100%", border: 0, display: "block" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <figcaption><a className={styles.textLink} href="https://youtube.com/shorts/sdWzQDMeiYY" target="_blank" rel="noopener noreferrer">Ver en YouTube ↗</a></figcaption>
      </figure>
    </section>
  </main>;
}
