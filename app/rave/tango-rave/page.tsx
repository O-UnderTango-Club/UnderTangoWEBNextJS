import type { Metadata } from "next";
import TangoRaveVideo from "../../components/TangoRaveVideo";
import styles from "../rave.module.css";

export const metadata: Metadata = { title: "Tango Rave — Banda en vivo, electrónica y danza | Ø UnderTango", alternates: { canonical: "https://rave.undertangoclub.com/tango-rave" }, openGraph: { title: "Tango Rave | Ø UnderTango", description: "Banda en vivo, electrónica, danza y visuales. Mirá la muestra del show y proponé una fecha.", url: "https://rave.undertangoclub.com/tango-rave" } };
export default function TangoRavePage() {
  return <main id="contenido"><section className={styles.detail}>
    <div><p className={styles.eyebrow}>01 / MÚSICA EN VIVO · ELECTRÓNICA · DANZA</p><h1>Tango<br/><em>Rave.</em></h1><p className={styles.intro}>El tango entra en otra frecuencia.</p><p>Banda en vivo, electrónica, danza y visuales reunidos en una experiencia escénica de alto impacto.</p><p>Una propuesta de UnderTango para festivales, salas y eventos que buscan cruzar la música y el movimiento.</p><a className={styles.button} href="https://wa.me/5493757618270?text=Hola%2C%20me%20interesa%20Tango%20Rave%20para%20una%20fecha.%20Ciudad%2C%20espacio%20y%20fecha%20tentativa%3A%20" target="_blank" rel="noopener noreferrer">Consultar una fecha ↗</a></div>
    <div className={styles.video}><TangoRaveVideo /></div>
  </section><section className={styles.contact}><p className={styles.eyebrow}>PROGRAMÁ TANGO RAVE</p><h2>Una conversación.<br/>Una próxima escena.</h2><p>Compartinos ciudad, espacio, fecha tentativa y características del evento. Conversamos sobre la propuesta artística y las necesidades de producción.</p></section></main>;
}
