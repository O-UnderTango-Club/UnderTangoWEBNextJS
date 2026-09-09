import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";
import GalleryVideo from "./GalleryVideo";
import styles from "./galeria.module.css";

// Records already published on / and /shows. Do not assign venues or dates
// to videos without verified provenance.
const selection = [
  { id: "samrNxK2nNw", number: "02", category: "DANZA · TANGO SHOW", title: "El diálogo de dos cuerpos.", description: "Una pareja, un abrazo y la intensidad del tango en escena. Un encuentro cercano entre los bailarines y quienes miran.", label: "Show de tango en pareja" },
  { id: "ONRopDSKkro", number: "03", category: "MÚSICA · DANZA · PRODUCCIÓN", title: "Una escena, muchos lenguajes.", description: "Música, danza y puesta escénica se encuentran en una producción de UnderTango en la Triple Frontera.", label: "Producción Triple Frontera" },
  { id: "yJZnlJgrsGc", number: "04", category: "EXPERIENCIA · PARTICIPACIÓN", title: "La pista es de todos.", description: "El público da el siguiente paso: una experiencia guiada para entrar en el tango, compartir y animarse a bailar.", label: "Experiencia participativa de tango" },
];
const contactUrl = `https://wa.me/5493757618270?text=${encodeURIComponent("Hola, vi la galería de presentaciones de UnderTango y me gustaría conversar sobre una propuesta para mi evento.")}`;

export const metadata: Metadata = {
  title: "Galería de presentaciones | Ø UnderTango Club",
  description: "UnderTango en escena: una selección de Tango Rave, shows de tango, producciones y experiencias con el público. Mirá los registros en video.",
  alternates: { canonical: "/galeria" },
  openGraph: { title: "UnderTango en escena | Galería de presentaciones", description: "Música en vivo, danza y encuentros. Una selección para conocer lo que hacemos.", url: "https://www.undertangoclub.com/galeria", siteName: "Ø UnderTango Club", locale: "es_AR", type: "website" },
};

export default function GalleryPage() {
  return <>
    <Header />
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div><p className={styles.eyebrow}>GALERÍA DE PRESENTACIONES</p><h1>UnderTango,<br /><em>en escena.</em></h1></div>
          <div className={styles.intro}><p>La música, el abrazo, la energía del encuentro. Una selección de momentos para conocer lo que hacemos y cómo se vive.</p><a className={styles.textLink} href="#seleccion">Explorar los registros <span aria-hidden="true">↓</span></a></div>
        </header>

        <section id="seleccion" className={styles.feature} aria-labelledby="rave-title">
          <div className={styles.featureCopy}>
            <p className={styles.eyebrow}>01 / NUESTRA IDENTIDAD EN VIVO</p>
            <h2 id="rave-title">Ø Tango Rave</h2>
            <p className={styles.featureLine}>La raíz del tango.<br />El pulso de una nueva noche.</p>
            <p>Banda en vivo, electrónica y danza en una misma escena. Nuestra propuesta de autor reúne la fuerza de los músicos y el movimiento de los bailarines.</p>
            <ul className={styles.tags} aria-label="Elementos de Tango Rave"><li>Música en vivo</li><li>Electrónica</li><li>Danza</li></ul>
            <Link className={styles.textLink} href="/shows#tango-rave">Conocer Tango Rave <span aria-hidden="true">↗</span></Link>
          </div>
          <GalleryVideo id="7yVf96vjurQ" title="Ø Tango Rave en vivo" portrait priority />
        </section>

        <section className={styles.selection} aria-labelledby="selection-title">
          <div className={styles.sectionHeading}><h2 id="selection-title">Otras formas de encontrarnos.</h2><p>Del show al primer paso en la pista.</p></div>
          <div className={styles.grid}>{selection.map(entry => <article key={entry.id} className={styles.card}>
            <GalleryVideo id={entry.id} title={entry.label} />
            <div className={styles.cardCopy}><p className={styles.category}>{entry.number} / {entry.category}</p><h3>{entry.title}</h3><p>{entry.description}</p></div>
          </article>)}</div>
        </section>

        <aside className={styles.archive} aria-labelledby="archive-title">
          <a className={styles.poster} href="/galeria/2026-08-29-tango-rave-la-frontera.webp" target="_blank" rel="noopener noreferrer" aria-label="Abrir el afiche del Festival La Frontera"><Image src="/galeria/2026-08-29-tango-rave-la-frontera.webp" alt="Afiche de Ø Tango Rave en el Festival Internacional de Turismo La Frontera" width={1055} height={1491} sizes="(max-width: 600px) 96px, 140px" /></a>
          <div><p className={styles.eyebrow}>DEL ARCHIVO · PRESENTACIÓN REALIZADA</p><h2 id="archive-title">Festival La Frontera</h2><p>Ø Tango Rave · <time dateTime="2026-08-29">29 de agosto de 2026</time><br />Bernardo de Irigoyen, Misiones.</p><a className={styles.textLink} href="/galeria/2026-08-29-tango-rave-la-frontera.webp" target="_blank" rel="noopener noreferrer">Ver el afiche <span aria-hidden="true">↗</span></a></div>
        </aside>

        <section className={styles.contact} aria-labelledby="contact-title">
          <p className={styles.eyebrow}>EL PRÓXIMO ENCUENTRO</p><h2 id="contact-title">¿Lo imaginamos en tu espacio?</h2><p>Contanos dónde, cuándo y para quiénes. Encontramos juntos el formato.</p>
          <div className={styles.actions}><a className={styles.primaryCta} href={contactUrl} target="_blank" rel="noopener noreferrer">Conversemos sobre tu evento <span aria-hidden="true">↗</span></a><Link className={styles.textLink} href="/shows">Ver los formatos de show <span aria-hidden="true">→</span></Link></div>
        </section>
      </div>
    </main>
    <Footer />
  </>;
}
