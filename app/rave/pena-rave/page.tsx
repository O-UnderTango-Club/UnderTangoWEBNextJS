import { T, WhatsAppLink } from "../language";
import type { Metadata } from "next";
import styles from "../rave.module.css";
import { raveImages } from "../social";

export const metadata: Metadata = { title: "Peña Rave — Estreno septiembre 2026 en Puerto Iguazú | Ø UnderTango", description: "Peña Rave está en preparación. Estreno en septiembre de 2026 en Puerto Iguazú. Música argentina y misionera con la banda de UnderTango.", alternates: { canonical: "https://rave.undertangoclub.com/pena-rave" }, openGraph: { title: "Peña Rave · Estreno septiembre 2026", description: "Puerto Iguazú. Una nueva propuesta de la banda de UnderTango, en preparación.", url: "https://rave.undertangoclub.com/pena-rave", images: raveImages } };
export default function PenaRavePage() {
  return <main id="contenido"><section className={`${styles.hero} ${styles.peñaHero}`}>
    <p className={styles.eyebrow}><T>{"02 / REPERTORIO ARGENTINO · BANDA EN VIVO"}</T></p><h1>Peña<br/><em>Rave.</em></h1>
    <p className={styles.intro}><T>{"La raíz se vuelve fiesta."}</T></p><p className={styles.intro}><T>{"Música argentina y misionera, encuentro y banda en vivo. Estamos preparando una nueva experiencia de UnderTango."}</T></p>
    <div className={styles.announcement}><span className={styles.eyebrow}><T>{"ESTRENO"}</T></span><h2><T>{"Septiembre 2026"}</T><br/>Puerto Iguazú</h2><p><T>{"En preparación."}</T></p></div>
    <WhatsAppLink className={styles.button} message={"Hola, quiero conocer más sobre Peña Rave y su estreno en septiembre en Puerto Iguazú."}><T>{"Consultar por Peña Rave ↗"}</T></WhatsAppLink>
  </section></main>;
}
