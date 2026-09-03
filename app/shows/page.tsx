import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";
import TangoRaveVideo from "../components/TangoRaveVideo";
import styles from "./shows.module.css";

const WHATSAPP_NUMBER = "5493757618270";
const SHOWCASE_VIDEO = "https://www.youtube.com/embed/lrqyoXQiv_A?playsinline=1&rel=0";

function whatsappFor(subject: string) {
  const text = `Hola, vi los shows de Ø UnderTango y quisiera consultar una propuesta para ${subject}. El evento sería en [lugar], el [fecha], para [cantidad] personas.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const metadata: Metadata = {
  title: "Shows de tango y música en vivo | Ø UnderTango",
  description: "Shows de tango, música en vivo y formatos escénicos para hoteles, empresas y eventos en la Triple Frontera.",
  alternates: { canonical: "/shows" },
  openGraph: {
    title: "Shows de tango y música en vivo | Ø UnderTango",
    description: "Formatos escénicos elegantes y adaptables para eventos en la Triple Frontera.",
    url: "https://www.undertangoclub.com/shows",
    siteName: "Ø UnderTango Club",
    locale: "es_AR",
    type: "website",
  },
};

const products = [
  { number: "01", title: "Ø Tango Rave", label: "PRODUCTO INSIGNIA", description: "Banda en vivo, electrónica, danza y visuales reunidos en una experiencia escénica de alto impacto.", format: "Banda + electrónica + danza + visuales", ideal: "Escenarios, festivales y eventos de gran impacto", flagship: true },
  { number: "02", title: "Tango Show — formato pareja / compacto", label: "FORMATO COMPACTO", description: "Una propuesta directa y adaptable para espacios que necesitan una intervención de tango clara, elegante y de escala contenida.", format: "Pareja de tango", ideal: "Hoteles, restaurantes, cenas, recepciones y eventos chicos" },
  { number: "03", title: "Tango Show — formato ampliado", label: "FORMATO AMPLIADO", description: "Una pareja de tango integrada con músicos en vivo o una intervención escénica ajustada a las necesidades del evento.", format: "Pareja + músicos en vivo", ideal: "Eventos que requieren mayor presencia escénica" },
  { number: "04", title: "Experiencia Tango con el público", label: "FORMATO PARTICIPATIVO", description: "Show de tango con participación guiada, mini clase o interacción para incorporar al público a la experiencia.", format: "Show + participación guiada", ideal: "Grupos, turismo, celebraciones y experiencias privadas" },
  { number: "05", title: "Tango & Sax / formato lounge", label: "FORMATO LOUNGE", description: "Una propuesta elegante y liviana que combina tango y saxofón para acompañar el ritmo social del evento.", format: "Tango + saxofón", ideal: "Hoteles, cocktails, recepciones y cenas" },
  { number: "06", title: "Folklore / Peña Rave", label: "FOLKLORE EN VIVO", description: "Banda con repertorio argentino y misionero, con una versión descontracturada para peñas, fiestas y eventos.", format: "Banda en vivo", ideal: "Peñas, fiestas y eventos" },
  { number: "07", title: "Producción artística a medida", label: "PROYECTOS COMPLEJOS", description: "Una puerta a producciones que combinan tango, folklore, samba, fuego, zancos, músicos, danza y recursos especiales.", format: "Diseño y producción integral", ideal: "Proyectos complejos y combinaciones especiales", custom: true },
  { number: "08", title: "Formato corporativo / institucional Triple Frontera", label: "EMPRESAS E INSTITUCIONES", description: "Una propuesta pensada para representar el contexto regional y adaptarse a objetivos institucionales o de marca.", format: "Escala y puesta adaptables", ideal: "Inauguraciones, congresos, turismo, lanzamientos y eventos empresariales" },
];

const steps = [
  ["01", "Nos contás el contexto", "Fecha, ciudad, espacio, público y momento del evento."],
  ["02", "Recomendamos el formato", "Definimos elenco, duración y necesidades técnicas."],
  ["03", "Confirmamos la propuesta", "Coordinamos disponibilidad, producción y presupuesto."],
];

export default function ShowsPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Ø UNDERTANGO · SHOWS PARA EVENTOS</p>
            <h1>Tango en escena, con el formato justo para cada ocasión.</h1>
            <p className={styles.lead}>Propuestas de danza y música en vivo para hoteles, empresas, gastronomía y eventos privados en la Triple Frontera. Elegí un punto de partida; nosotros lo adaptamos al espacio y al público.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryCta} href={whatsappFor("mi evento")} target="_blank" rel="noopener noreferrer">Consultar disponibilidad</a>
              <Link className={styles.secondaryCta} href="/produccion-artistica">Necesito una producción a medida</Link>
            </div>
            <div className={styles.heroProof}>
              <span>Puerto Iguazú · Foz do Iguaçu · Ciudad del Este</span>
              <span>Elenco, duración y puesta adaptables</span>
            </div>
          </div>
          <div className={styles.showcase}>
            <div className={styles.videoFrame}>
              <iframe src={SHOWCASE_VIDEO} title="Aracely Maizares en un show de Ø UnderTango" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
            </div>
            <p>Aracely Maizares · registro audiovisual en YouTube</p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="formatos-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>FORMATOS</p>
            <h2 id="formatos-title">Una selección clara. Una puesta adaptable.</h2>
            <p>Cada formato funciona como base. Ajustamos repertorio, cantidad de intervenciones, duración y despliegue técnico según la producción.</p>
          </div>
          <div className={styles.grid}>
            {products.map((product) => (
              <article key={product.number} id={product.flagship ? "tango-rave" : undefined} className={`${styles.card} ${product.flagship ? styles.flagship : ""} ${product.custom ? styles.custom : ""}`}>
                <div className={styles.cardCopy}>
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
                </div>
                {product.flagship && <TangoRaveVideo />}
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.process}`} aria-labelledby="proceso-title">
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>CONTRATACIÓN</p><h2 id="proceso-title">Simple para decidir. Cuidado en la ejecución.</h2></div>
          <ol>{steps.map(([number, title, copy]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
        </section>

        <section className={styles.finalBlock}>
          <div><p className={styles.eyebrow}>PRODUCCIÓN ARTÍSTICA INTEGRAL</p><h2>¿El evento necesita algo más que un formato listo?</h2><p>Diseñamos conceptos, convocamos artistas y coordinamos una solución escénica completa alrededor de la experiencia que querés crear.</p></div>
          <div className={styles.finalActions}><Link className={styles.primaryCta} href="/produccion-artistica">Conocer la productora</Link><a className={styles.textCta} href={whatsappFor("una propuesta a medida")} target="_blank" rel="noopener noreferrer">Contarnos el evento →</a></div>
        </section>
      </main>
      <a className={styles.mobileWhatsapp} href={whatsappFor("mi evento")} target="_blank" rel="noopener noreferrer">Consultar disponibilidad</a>
      <Footer />
    </>
  );
}
