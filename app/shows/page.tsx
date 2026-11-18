import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "../produccion-artistica/produccion-artistica.module.css";

const WHATSAPP_NUMBER = "5493757618270";
const HERO_VIDEO = "https://www.youtube.com/embed/ONRopDSKkro?rel=0&playsinline=1";

function whatsappFor(subject: string) {
  const text = `Hola, vi la página de Producción Artística de Ø UnderTango. Estoy organizando ${subject} y quisiera que me ayuden a diseñar una propuesta para el evento.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const metadata: Metadata = {
  title: "Shows y producción artística en la Triple Frontera | Ø UnderTango",
  description:
    "Producción artística integral para eventos en Puerto Iguazú, Foz do Iguaçu y Ciudad del Este: tango, samba, danza paraguaya, música en vivo, performers, fuego, zancos y shows a medida.",
  keywords: [
    "producción artística Triple Frontera",
    "producción de shows Puerto Iguazú",
    "produção artística Foz do Iguaçu",
    "shows para eventos Foz do Iguaçu",
    "artistas para eventos Ciudad del Este",
    "show de samba",
    "danza paraguaya con arpa",
    "show de tango",
    "música en vivo para eventos",
    "performers fuego zancos",
  ],
  alternates: {
    canonical: "/shows",
  },
  openGraph: {
    title: "Producción artística en la Triple Frontera | Ø UnderTango",
    description:
      "Contanos el evento. Diseñamos el espectáculo: artistas, música, danza, performers y producción escénica en Argentina, Brasil y Paraguay.",
    url: "https://www.undertangoclub.com/shows",
    siteName: "Ø UnderTango Club",
    locale: "es_AR",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Ø UnderTango Club — Producción Artística",
  url: "https://www.undertangoclub.com/shows",
  telephone: "+54 9 3757 61-8270",
  description:
    "Producción artística integral para eventos en la Triple Frontera: tango, samba, danza paraguaya, música en vivo, performers y espectáculos a medida.",
  areaServed: [
    { "@type": "City", name: "Puerto Iguazú" },
    { "@type": "City", name: "Foz do Iguaçu" },
    { "@type": "City", name: "Ciudad del Este" },
  ],
  knowsAbout: [
    "Tango",
    "Samba",
    "Danza paraguaya",
    "Arpa paraguaya",
    "Música en vivo",
    "Producción de espectáculos",
    "Performers",
    "Manipulación de fuego",
    "Zancos",
  ],
};

export default function ProduccionArtisticaPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Ø UNDERTANGO · PRODUCCIÓN ARTÍSTICA · TRIPLE FRONTERA</p>
            <h1>
              <span>Tu evento.</span>
              <span>Lo convertimos en espectáculo.</span>
            </h1>
            <p className={styles.lead}>
              Diseñamos, coordinamos y producimos experiencias artísticas en Argentina, Brasil y Paraguay. Podés llegar con una idea definida o simplemente con una necesidad. <strong>Nosotros construimos la propuesta.</strong>
            </p>
            <div className={styles.heroActions}>
              <a
                className={styles.primaryCta}
                href={whatsappFor("un evento")}
                target="_blank"
                rel="noopener noreferrer"
                data-undertango-event="intent_click"
                data-undertango-intent="contratar_show"
                data-undertango-subintent="produccion_artistica_integral"
                data-undertango-cta="Diseñar mi espectáculo"
              >
                Diseñar mi espectáculo
              </a>
              <Link className={styles.secondaryCta} href="#catalogo">
                Ver propuestas
              </Link>
            </div>
            <div className={styles.heroProof} aria-label="Cobertura y alcance de producción">
              <span>Argentina · Brasil · Paraguay</span>
              <span>Dirección artística · artistas · ensayos · coordinación</span>
            </div>
          </div>

          <div className={styles.heroVideoWrap}>
            <div className={styles.videoTopline}>
              <span>Producción Triple Frontera</span>
              <span>01:00</span>
            </div>
            <div className={styles.videoFrame}>
              <iframe
                src={HERO_VIDEO}
                title="Producción artística Triple Frontera de Ø UnderTango"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <p className={styles.videoCaption}>
              Tango · samba · danza · música · fuego · zancos · producción escénica
            </p>
          </div>
        </section>

        <section id="catalogo" className={styles.section} aria-labelledby="videos-produccion-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>MÚSICA Y DANZA · TRIPLE FRONTERA</p>
            <h2 id="videos-produccion-title">Tres formas de vivir el espectáculo.</h2>
            <p>Conocé Raíces da Fronteira, la banda UnderTango con João Aruk y nuestro show de tango con saxofón.</p>
          </div>
          <div className={styles.showVideoGrid}>
            <article className={styles.showVideoCard}>
              <h3>Raíces da Fronteira</h3>
              <p>Show de música y danza de la Triple Frontera.</p>
              <div className={styles.portraitVideo}><iframe src="https://www.youtube.com/embed/5x1oUmMOsaY?rel=0&amp;playsinline=1" title="Raíces da Fronteira" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div>
              <a href="https://www.youtube.com/watch?v=5x1oUmMOsaY" target="_blank" rel="noopener noreferrer">Ver en YouTube ↗</a>
            </article>
            <article className={styles.showVideoCard}>
              <h3>Banda UnderTango con João Aruk</h3>
              <p>Cinco músicos y cantante en vivo.</p>
              <div className={styles.portraitVideo}><iframe src="https://www.youtube.com/embed/jKjgHl4xL0A?rel=0&amp;playsinline=1" title="Banda UnderTango con João Aruk" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div>
              <a href="https://www.youtube.com/watch?v=jKjgHl4xL0A" target="_blank" rel="noopener noreferrer">Ver en YouTube ↗</a>
            </article>
            <article className={styles.showVideoCard}>
              <h3>Dupla de tango + saxofón</h3>
              <p>Tango y saxofón en vivo.</p>
              <div className={styles.portraitVideo}><iframe src="https://www.youtube.com/embed/scBf8VkYdPQ?rel=0&amp;playsinline=1" title="Dupla de tango + saxofón" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div>
              <a href="https://www.youtube.com/watch?v=scBf8VkYdPQ" target="_blank" rel="noopener noreferrer">Ver en YouTube ↗</a>
            </article>
          </div>
        </section>

        <section id="produccion" className={styles.splitDecision}>
          <div>
            <p className={styles.eyebrow}>SHOWS PARA TU EVENTO</p>
            <h2>Desde un formato íntimo hasta un gran espectáculo.</h2>
            <p>Contamos con propuestas simples, como una pareja de tango o músicos en vivo, y shows completos que combinan música, danza y puesta escénica. Adaptamos la formación y la duración a tu evento.</p>
          </div>
          <div className={styles.splitPrimary}>
            <p className={styles.eyebrow}>PRODUCCIÓN A MEDIDA</p>
            <h2>¿Te imaginás algo y querés hacerlo realidad?</h2>
            <p>Contanos tu idea. Podemos crear una propuesta con artistas, música y danza de la Triple Frontera, pensada para tu espacio y tu público.</p>
            <a className={styles.primaryCta} href={whatsappFor("un evento")} target="_blank" rel="noopener noreferrer">Conversemos sobre tu idea</a>
          </div>
        </section>

        <section className={`${styles.section} ${styles.processSection}`} aria-labelledby="pasos-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>ASÍ EMPEZAMOS</p>
            <h2 id="pasos-title">Hagamos realidad tu idea.</h2>
          </div>
          <ol className={styles.processGrid}>
            <li><span>01</span><h3>Compartinos el contexto</h3><p>Ciudad, fecha, espacio, público y objetivo de la presentación.</p></li>
            <li><span>02</span><h3>Definimos el formato</h3><p>Conversamos sobre artistas, duración y puesta.</p></li>
            <li><span>03</span><h3>Armamos la propuesta</h3><p>Confirmamos disponibilidad y presupuesto.</p></li>
          </ol>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Footer />
    </>
  );
}
