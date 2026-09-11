import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./shows.module.css";

const WHATSAPP_NUMBER = "5493757618270";
const TANGO_RAVE_VIDEO = "https://www.youtube.com/embed/bwUnN7k22bE?playsinline=1&rel=0";

function whatsappFor(subject: string) {
  const text = `Hola, vi la propuesta de Ø UnderTango y quisiera conversar sobre ${subject}. Mi nombre es [nombre] y represento a [organización / espacio].`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const metadata: Metadata = {
  title: "Ø Tango Rave | Presentación para representantes",
  description:
    "Tango Rave cruza banda en vivo, electrónica y danza en una propuesta escénica adaptable para festivales, escenarios y eventos.",
  alternates: { canonical: "/shows" },
  openGraph: {
    title: "Ø Tango Rave | UnderTango",
    description: "Banda en vivo, electrónica y danza. Una propuesta escénica nacida en la Triple Frontera.",
    url: "https://www.undertangoclub.com/shows",
    siteName: "Ø UnderTango Club",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/assets/images/tango-rave-elenco.jpg",
        width: 2048,
        height: 1365,
        alt: "Elenco de Ø Tango Rave",
      },
    ],
  },
};

const products = [
  { number: "01", title: "Ø Tango Rave", label: "PRODUCTO INSIGNIA", description: "Banda en vivo, electrónica y danza reunidas en una experiencia escénica de alto impacto.", format: "Banda + electrónica + danza", ideal: "Escenarios, festivales y eventos de gran impacto", flagship: true },
  { number: "02", title: "Tango Show — formato pareja / compacto", label: "FORMATO COMPACTO", description: "Una intervención de tango directa y adaptable para espacios de escala contenida.", format: "Pareja de tango", ideal: "Hoteles, restaurantes, cenas, recepciones y eventos chicos" },
  { number: "03", title: "Tango Show — formato ampliado", label: "FORMATO AMPLIADO", description: "Una pareja de tango integrada con músicos en vivo y una puesta ajustada al evento.", format: "Pareja + músicos en vivo", ideal: "Eventos que requieren mayor presencia escénica" },
  { number: "04", title: "Experiencia Tango con el público", label: "FORMATO PARTICIPATIVO", description: "Show con participación guiada, mini clase o interacción para incorporar al público.", format: "Show + participación guiada", ideal: "Grupos, turismo, celebraciones y experiencias privadas" },
  { number: "05", title: "Tango & Sax / formato lounge", label: "FORMATO LOUNGE", description: "Tango y saxofón para acompañar el ritmo social de un evento.", format: "Tango + saxofón", ideal: "Hoteles, cocktails, recepciones y cenas" },
  { number: "06", title: "Folklore / Peña Rave", label: "FOLKLORE EN VIVO", description: "Banda con repertorio argentino y misionero en una propuesta descontracturada.", format: "Banda en vivo", ideal: "Peñas, fiestas y eventos" },
  { number: "07", title: "Producción artística a medida", label: "PROYECTOS COMPLEJOS", description: "Producciones que combinan disciplinas, elencos y recursos de acuerdo con cada proyecto.", format: "Diseño y producción integral", ideal: "Proyectos complejos y combinaciones especiales", custom: true },
  { number: "08", title: "Formato corporativo / institucional Triple Frontera", label: "EMPRESAS E INSTITUCIONES", description: "Una propuesta vinculada con el contexto regional y adaptable a objetivos institucionales o de marca.", format: "Escala y puesta adaptables", ideal: "Inauguraciones, congresos, turismo, lanzamientos y eventos empresariales" },
];

const representationPoints = [
  ["01", "Una imagen reconocible", "Un lenguaje visual propio para comunicar el show antes de que empiece."],
  ["02", "Un cruce contemporáneo", "Tango, banda, electrónica y danza conviven dentro de una misma puesta."],
  ["03", "Una escala adaptable", "La formación, la duración y el despliegue se definen según el escenario y la producción."],
];

const steps = [
  ["01", "Compartimos el contexto", "Ciudad, fecha, espacio, público y objetivo de la presentación."],
  ["02", "Definimos el formato", "Acordamos elenco, duración, puesta y necesidades técnicas."],
  ["03", "Armamos la propuesta", "Confirmamos disponibilidad, producción y presupuesto."],
];

export default function ShowsPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Ø TANGO RAVE · PRESENTACIÓN PARA REPRESENTANTES</p>
            <h1>El tango también puede sonar a presente.</h1>
            <p className={styles.lead}>
              Una propuesta de UnderTango que cruza banda en vivo, electrónica y danza para escenarios, festivales y eventos.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryCta} href="#spot">Ver el spot</a>
              <a className={styles.secondaryCta} href={whatsappFor("la representación de Ø Tango Rave")} target="_blank" rel="noopener noreferrer">Conversar sobre representación</a>
            </div>
            <dl className={styles.heroFacts}>
              <div><dt>Origen</dt><dd>Triple Frontera</dd></div>
              <div><dt>Lenguaje</dt><dd>Música + danza</dd></div>
              <div><dt>Formato</dt><dd>Adaptable</dd></div>
            </dl>
          </div>

          <figure className={styles.heroVisual}>
            <Image src="/assets/images/tango-rave-elenco.jpg" alt="Elenco de Ø Tango Rave" width={2048} height={1365} priority sizes="(max-width: 900px) 100vw, 55vw" />
            <figcaption>Ø Tango Rave · elenco</figcaption>
          </figure>
        </section>

        <section className={`${styles.section} ${styles.spotSection}`} id="spot" aria-labelledby="spot-title">
          <div className={styles.spotCopy}>
            <p className={styles.eyebrow}>SPOT OFICIAL · 48 SEGUNDOS</p>
            <h2 id="spot-title">Una síntesis para verlo en acción.</h2>
            <p>El registro reúne el pulso musical, la escena y el vínculo con el público. Es el punto de partida para presentar la propuesta.</p>
            <a className={styles.textCta} href="https://youtu.be/bwUnN7k22bE" target="_blank" rel="noopener noreferrer">Abrir en YouTube <span aria-hidden="true">↗</span></a>
          </div>
          <div className={styles.videoShell}>
            <div className={styles.videoFrame}>
              <iframe src={TANGO_RAVE_VIDEO} title="Spot oficial de Ø Tango Rave" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.representation}`} aria-labelledby="representacion-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>LA PROPUESTA</p>
            <h2 id="representacion-title">Pensada para circular. Preparada para adaptarse.</h2>
          </div>
          <ol>{representationPoints.map(([number, title, copy]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol>
        </section>

        <section className={styles.section} aria-labelledby="formatos-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>CATÁLOGO UNDERTANGO</p>
            <h2 id="formatos-title">Tango Rave abre una familia de formatos.</h2>
            <p>Además del producto insignia, UnderTango trabaja con propuestas de distinta escala. Cada una funciona como base y se adapta al espacio, el público y la producción.</p>
          </div>
          <div className={styles.grid}>
            {products.map((product) => (
              <article key={product.number} className={`${styles.card} ${product.flagship ? styles.flagship : ""} ${product.custom ? styles.custom : ""}`}>
                <div className={styles.cardTopline}><span>{product.number}</span><span>{product.label}</span></div>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <dl className={styles.details}>
                  <div><dt>Formación</dt><dd>{product.format}</dd></div>
                  <div><dt>Ideal para</dt><dd>{product.ideal}</dd></div>
                </dl>
                {product.custom ? (
                  <Link className={styles.cardCta} href="/produccion-artistica">Diseñar una producción <span aria-hidden="true">→</span></Link>
                ) : (
                  <a className={styles.cardCta} href={whatsappFor(product.title)} target="_blank" rel="noopener noreferrer">Consultar este formato <span aria-hidden="true">→</span></a>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.process}`} aria-labelledby="proceso-title">
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>SIGUIENTE PASO</p><h2 id="proceso-title">Una conversación concreta para definir encaje.</h2></div>
          <ol>{steps.map(([number, title, copy]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
        </section>

        <section className={styles.finalBlock}>
          <div><p className={styles.eyebrow}>Ø UNDERTANGO · TRIPLE FRONTERA</p><h2>¿Ves un escenario para Tango Rave?</h2><p>Conversemos sobre territorio, públicos y oportunidades de representación.</p></div>
          <div className={styles.finalActions}><a className={styles.primaryCta} href={whatsappFor("una oportunidad para Ø Tango Rave")} target="_blank" rel="noopener noreferrer">Iniciar conversación</a><Link className={styles.textCta} href="/produccion-artistica">Conocer la productora →</Link></div>
        </section>
      </main>
      <a className={styles.mobileWhatsapp} href={whatsappFor("la representación de Ø Tango Rave")} target="_blank" rel="noopener noreferrer">Conversar sobre representación</a>
      <Footer />
    </>
  );
}
