import type { Metadata } from "next";
import Header from "../components/header";
import Footer from "../components/footer";
import GalleryVideo from "../galeria/GalleryVideo";
import styles from "./dosis-da-pista.module.css";

const path = "/dosis-da-pista";
const title = "Dosis da Pista | Banda en vivo de Ø UnderTango Club";
const description = "Quinteto de la Triple Frontera con música en vivo para bailar. Contrataciones para bares, salas y eventos, con shows de 90 minutos a 3 horas a convenir.";
const mainVideo = "jKjgHl4xL0A";
const bookingMessage = "Hola, me interesa contratar a Dosis da Pista de Ø UnderTango Club. Quisiera consultar disponibilidad y formato para mi espacio.";
const bookingUrl = `https://wa.me/5493757618270?text=${encodeURIComponent(bookingMessage)}`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    title,
    description,
    url: path,
    siteName: "Ø UnderTango Club",
    locale: "es_AR",
    type: "website",
    images: [{ url: `https://i.ytimg.com/vi/${mainVideo}/hqdefault.jpg`, alt: "Olhos Coloridos en vivo con João Aruk" }],
  },
};

function BookingLink() {
  return (
    <a
      className={styles.bookingLink}
      href={bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-undertango-event="intent_click"
      data-undertango-intent="contratar_show"
      data-undertango-subintent="dosis_da_pista"
      data-undertango-cta="Consultar por WhatsApp"
    >
      Consultar por WhatsApp <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function DosisDaPistaPage() {
  return (
    <>
      <Header />
      <main className={styles.page} lang="es-AR">
        <div className={styles.shell}>
          <section className={styles.hero} aria-labelledby="dosis-title">
            <header className={styles.intro}>
              <p className={styles.label}>Ø UnderTango Club · Triple Frontera</p>
              <h1 id="dosis-title">Dosis da Pista</h1>
              <p className={styles.lead}>Música en vivo para bailar.</p>
              <p>Un quinteto para bares, salas y eventos, con un show que se adapta a tu espacio y a tu público.</p>
              <BookingLink />
            </header>
            <div className={styles.feature}>
              <GalleryVideo id={mainVideo} title="Olhos Coloridos · en vivo con João Aruk" priority />
            </div>
          </section>

          <section className={styles.details} aria-labelledby="dosis-format">
            <div>
              <h2 id="dosis-format">Un show que se adapta a tu lugar</h2>
              <p>Podemos empezar con un set para escuchar y llevar la noche hacia la pista. Acordamos el repertorio, la cantidad de sets y las pausas según el espacio, el público y el horario.</p>
            </div>
            <dl className={styles.facts}>
              <div><dt>Formación</dt><dd>Quinteto de la Triple Frontera</dd></div>
              <div><dt>Duración</dt><dd>De 90 minutos a 3 horas, a convenir</dd></div>
            </dl>
          </section>

          <section className={styles.more} aria-labelledby="dosis-live">
            <div>
              <h2 id="dosis-live">El quinteto en escena</h2>
              <p>Un registro de la banda de Ø UnderTango Club en una presentación de otro formato.</p>
            </div>
            <div className={styles.secondVideo}>
              <GalleryVideo id="Rv-paFARbME" title="Banda Musical ø Undertango" portrait />
            </div>
          </section>

          <section className={styles.contact} aria-labelledby="dosis-contact">
            <div>
              <h2 id="dosis-contact">Coordinemos una fecha</h2>
              <p>Contanos la ciudad, el lugar y la fecha tentativa. Con esos datos, armamos la propuesta.</p>
            </div>
            <BookingLink />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
