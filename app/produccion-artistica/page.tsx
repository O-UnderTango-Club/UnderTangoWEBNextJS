import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./produccion-artistica.module.css";

const WHATSAPP_NUMBER = "5493757618270";
const HERO_VIDEO = "https://www.youtube.com/embed/ONRopDSKkro?rel=0&playsinline=1";

function whatsappFor(subject: string) {
  const text = `Hola, vi la página de Producción Artística de Ø UnderTango. Estoy organizando ${subject} y quisiera que me ayuden a diseñar una propuesta para el evento.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const metadata: Metadata = {
  title: "Producción artística en la Triple Frontera | Ø UnderTango",
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
    canonical: "/produccion-artistica",
  },
  openGraph: {
    title: "Producción artística en la Triple Frontera | Ø UnderTango",
    description:
      "Contanos el evento. Diseñamos el espectáculo: artistas, música, danza, performers y producción escénica en Argentina, Brasil y Paraguay.",
    url: "https://www.undertangoclub.com/produccion-artistica",
    siteName: "Ø UnderTango Club",
    locale: "es_AR",
    type: "website",
  },
};

const capabilities = [
  {
    eyebrow: "ARGENTINA",
    title: "Tango",
    text: "Parejas de tango, músicos, saxofonistas, banda y formatos tradicionales, contemporáneos o creados especialmente para el evento.",
  },
  {
    eyebrow: "BRASIL",
    title: "Samba",
    text: "Passistas, bailarines, percusión y cuerpos de samba para recepciones, intervenciones y momentos de gran impacto escénico.",
  },
  {
    eyebrow: "PARAGUAY",
    title: "Danza + arpa",
    text: "Danzas paraguayas, arpistas, músicos y formaciones que pueden integrarse a una puesta regional o funcionar como espectáculo propio.",
  },
  {
    eyebrow: "MÚSICA",
    title: "Música en vivo",
    text: "Solistas, instrumentistas, bandas y formaciones diseñadas según el espacio, el público, el repertorio y el objetivo de la producción.",
  },
  {
    eyebrow: "PERFORMANCE",
    title: "Fuego + zancos",
    text: "Intervenciones visuales, manipulación de fuego, zancos, personajes y acciones especiales para recibir, sorprender o transformar un espacio.",
  },
  {
    eyebrow: "A MEDIDA",
    title: "Producciones híbridas",
    text: "Cuando un solo lenguaje no alcanza, combinamos música, danza, performers y recursos escénicos dentro de una misma narrativa.",
  },
];

const eventTypes = [
  "Hoteles",
  "Eventos corporativos",
  "Congresos",
  "Turismo",
  "Gastronomía",
  "Inauguraciones",
  "Bodas",
  "Festivales",
  "Activaciones de marca",
  "Eventos privados",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Ø UnderTango Club — Producción Artística",
  url: "https://www.undertangoclub.com/produccion-artistica",
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
              <Link className={styles.secondaryCta} href="/shows">
                Ver shows listos
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

        <section className={styles.statement}>
          <p className={styles.eyebrow}>NO NECESITÁS LLEGAR CON EL SHOW RESUELTO</p>
          <h2>Necesitamos entender qué querés provocar.</h2>
          <p>
            Elegancia. Impacto. Energía. Identidad regional. Fiesta. Sorpresa. Una apertura. Un momento central. Un cierre. A partir del evento, el espacio y el público, armamos la combinación artística que mejor funciona.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="capacidades-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>UN TERRITORIO · TRES PAÍSES · MUCHAS POSIBILIDADES</p>
            <h2 id="capacidades-title">La producción se diseña alrededor del evento.</h2>
            <p>
              Podemos trabajar con un lenguaje único o integrar distintas disciplinas. La selección de artistas, duración y escala se define según el contexto y el presupuesto.
            </p>
          </div>

          <div className={styles.capabilityGrid}>
            {capabilities.map((item) => (
              <article key={item.title} className={styles.capabilityCard}>
                <span>{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.processSection}`}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>PRODUCCIÓN A MEDIDA</p>
            <h2>De una necesidad abierta a una puesta que funciona.</h2>
          </div>

          <ol className={styles.processGrid}>
            <li>
              <span>01</span>
              <h3>Nos contás el evento</h3>
              <p>Fecha, ciudad, espacio, público, objetivo y presupuesto de referencia.</p>
            </li>
            <li>
              <span>02</span>
              <h3>Diseñamos la propuesta</h3>
              <p>Concepto, lenguajes, formación, cantidad de artistas, duración y dinámica.</p>
            </li>
            <li>
              <span>03</span>
              <h3>Armamos el equipo</h3>
              <p>Curaduría, convocatoria y coordinación de artistas de la red regional.</p>
            </li>
            <li>
              <span>04</span>
              <h3>Producimos</h3>
              <p>Dirección artística, ensayos, tiempos, logística y articulación con la producción técnica.</p>
            </li>
            <li>
              <span>05</span>
              <h3>Llegamos con una solución</h3>
              <p>Un espectáculo pensado para destacar, integrarse al evento y dejar una buena experiencia.</p>
            </li>
          </ol>
        </section>

        <section className={`${styles.section} ${styles.networkSection}`}>
          <div className={styles.networkCopy}>
            <p className={styles.eyebrow}>RED UNDERTANGO</p>
            <h2>La Triple Frontera no se resuelve desde un solo lado.</h2>
            <p>
              Trabajamos desde Puerto Iguazú con una red regional de artistas, productores, marcas, espacios y relaciones institucionales en Foz do Iguaçu y Ciudad del Este. Esa proximidad nos permite pensar el espectáculo desde el territorio y convocar el equipo adecuado para cada proyecto.
            </p>
            <p className={styles.networkNote}>
              Entre nuestras relaciones institucionales regionales se encuentra Not Only Wine, junto a otros aliados que forman parte del desarrollo de la Red UnderTango.
            </p>
          </div>

          <div className={styles.cities} aria-label="Cobertura regional">
            <div><strong>Argentina</strong><span>Puerto Iguazú</span></div>
            <div><strong>Brasil</strong><span>Foz do Iguaçu</span></div>
            <div><strong>Paraguay</strong><span>Ciudad del Este</span></div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>DÓNDE PUEDE FUNCIONAR</p>
            <h2>Producciones para contextos muy distintos.</h2>
          </div>
          <div className={styles.eventTags}>
            {eventTypes.map((eventType) => <span key={eventType}>{eventType}</span>)}
          </div>
        </section>

        <section className={styles.splitDecision}>
          <div>
            <p className={styles.eyebrow}>SI YA SABÉS QUÉ QUERÉS</p>
            <h2>Tenemos formatos más simples y rápidos.</h2>
            <p>Pareja de tango, tango + saxo, banda y otros productos modulares con una contratación más directa.</p>
            <Link className={styles.secondaryCta} href="/shows">Ver catálogo de shows</Link>
          </div>
          <div className={styles.splitPrimary}>
            <p className={styles.eyebrow}>SI TODAVÍA NO SABÉS QUÉ SHOW QUERÉS</p>
            <h2>Éste es el lugar correcto.</h2>
            <p>Contanos dónde es, cuándo es, cuánta gente habrá y qué querés que el público sienta. Nosotros empezamos desde ahí.</p>
            <a className={styles.primaryCta} href={whatsappFor("una producción artística")} target="_blank" rel="noopener noreferrer">
              Contarnos el evento
            </a>
          </div>
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
