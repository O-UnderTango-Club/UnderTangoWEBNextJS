import type { Metadata } from "next";
import { academyOrigin, tangoContact } from "../projects";
import styles from "../academia.module.css";

export const metadata: Metadata = {
  title: "Academia de Tango — online y presencial",
  description: "Descubrí las modalidades de Academia de Tango Under Tango. Clases presenciales en Puerto Iguazú y consultas para aprender online.",
  alternates: { canonical: `${academyOrigin}/tango` },
  openGraph: { title: "Academia de Tango — online y presencial", url: `${academyOrigin}/tango`, description: "Encontrá tu forma de aprender tango con Under Tango." },
};

export default function TangoPage() {
  return (
    <main id="contenido" className={styles.main}>
      <a href="/academia" className={styles.back}>← Todos los proyectos</a>
      <div className={styles.tangoHero}>
        <div><p className={styles.eyebrow}>83 / 02 · FORMACIÓN</p><h1>El tango<br />se <em>aprende.</em></h1><p className={styles.intro}>Un encuentro con la música, el movimiento y otra persona.</p><p>Para dar tus primeros pasos o seguir explorando tu baile. Elegí la modalidad y conversemos sobre tu experiencia y lo que querés aprender.</p></div>
        <img src="/assets/images/clasesImage1.png" alt="Pareja de tango de Under Tango" width={582} height={632} />
      </div>
      <section className={styles.modalities} aria-label="Modalidades de la Academia de Tango">
        <article><p className={styles.eyebrow}>EN PUERTO IGUAZÚ</p><h2>Presencial</h2><p>Clases privadas y grupales. Un espacio compartido para trabajar el abrazo, la escucha y el movimiento.</p><a className={styles.primaryButton} href={tangoContact("presenciales")}>Consultar clases presenciales ↗</a><div className={styles.relatedLinks}><a href="https://undertangoclub.com/clasesPrivadas">Clases privadas</a><a href="https://undertangoclub.com/clasesGrupales">Clases grupales</a></div></article>
        <article><p className={styles.eyebrow}>DESDE DONDE ESTÉS</p><h2>Online</h2><p>Consultá las opciones de acompañamiento a distancia. Contanos tu nivel, dónde estás y qué te gustaría trabajar.</p><a className={styles.secondaryButton} href={tangoContact("online")}>Consultar modalidad online ↗</a><p className={styles.small}>Coordinamos disponibilidad, formato y horarios por consulta.</p></article>
      </section>
    </main>
  );
}
