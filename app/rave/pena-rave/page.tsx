import type { Metadata } from "next";
import styles from "../rave.module.css";

export const metadata: Metadata = { title: "Peña Rave — Estreno septiembre 2026 en Puerto Iguazú | Ø UnderTango", description: "Peña Rave está en preparación. Estreno en septiembre de 2026 en Puerto Iguazú. Música argentina y misionera con la banda de UnderTango.", alternates: { canonical: "https://rave.undertangoclub.com/pena-rave" }, openGraph: { title: "Peña Rave · Estreno septiembre 2026", description: "Puerto Iguazú. Una nueva propuesta de la banda de UnderTango, en preparación.", url: "https://rave.undertangoclub.com/pena-rave" } };
export default function PenaRavePage() {
  return <main id="contenido"><section className={`${styles.hero} ${styles.peñaHero}`}>
    <p className={styles.eyebrow}>02 / REPERTORIO ARGENTINO · BANDA EN VIVO</p><h1>Peña<br/><em>Rave.</em></h1>
    <p className={styles.intro}>La raíz se vuelve fiesta.</p><p className={styles.intro}>Música argentina y misionera, encuentro y banda en vivo. Estamos preparando una nueva experiencia de UnderTango.</p>
    <div className={styles.announcement}><span className={styles.eyebrow}>ESTRENO</span><h2>Septiembre 2026<br/>Puerto Iguazú</h2><p>En preparación.</p></div>
    <a className={styles.button} href="https://wa.me/5493757618270?text=Hola%2C%20quiero%20conocer%20m%C3%A1s%20sobre%20Pe%C3%B1a%20Rave%20y%20su%20estreno%20en%20septiembre%20en%20Puerto%20Iguaz%C3%BA." target="_blank" rel="noopener noreferrer">Consultar por Peña Rave ↗</a>
  </section></main>;
}
