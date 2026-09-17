import { T, WhatsAppLink } from "../language";
import type { Metadata } from "next";
import { VideoSample } from "../showcase";
import styles from "../rave.module.css";
import { raveImages } from "../social";

export const metadata: Metadata = { title: "Tango Rave — Banda en vivo, electrónica y danza | Ø UnderTango", alternates: { canonical: "https://rave.undertangoclub.com/tango-rave" }, openGraph: { title: "Tango Rave | Ø UnderTango", description: "Banda en vivo, electrónica, danza y visuales. Mirá la muestra del show y proponé una fecha.", url: "https://rave.undertangoclub.com/tango-rave", images: raveImages } };
export default function TangoRavePage() {
  return <main id="contenido"><section className={styles.detail}>
    <div><p className={styles.eyebrow}><T>{"01 / MÚSICA EN VIVO · ELECTRÓNICA · DANZA"}</T></p><h1>Tango<br/><em>Rave.</em></h1><p className={styles.intro}><T>{"El tango entra en otra frecuencia."}</T></p><p><T>{"Banda en vivo, electrónica, danza y visuales reunidos en una experiencia escénica de alto impacto."}</T></p><p><T>{"Una propuesta de UnderTango para festivales, salas y eventos que buscan cruzar la música y el movimiento."}</T></p><WhatsAppLink className={styles.button} message={"Hola, me interesa Tango Rave para una fecha. Ciudad, espacio y fecha tentativa: "}><T>{"Consultar una fecha ↗"}</T></WhatsAppLink></div>
    <div className={styles.video}><VideoSample id="7yVf96vjurQ" title="Tango Rave" portrait /></div>
  </section><section className={styles.contact}><p className={styles.eyebrow}><T>{"PROGRAMÁ TANGO RAVE"}</T></p><h2><T>{"Una conversación."}</T><br/><T>{"Una próxima escena."}</T></h2><p><T>{"Compartinos ciudad, espacio, fecha tentativa y características del evento. Conversamos sobre la propuesta artística y las necesidades de producción."}</T></p></section></main>;
}
