import type { Metadata } from "next";
import Header from "../components/header";
import Footer from "../components/footer";
import GalleryVideo from "../galeria/GalleryVideo";
import styles from "./banda.module.css";

const path = "/banda";
const headline = "Música en vivo para sentir";
const lead = "Un recorrido que culmina en baile";
const title = `${headline} | Ø UnderTango Club`;
const description = `${lead}. El quinteto de Ø UnderTango Club cruza soul, funk, samba y clásicos latinos. De 90 minutos a 3 horas, a convenir.`;
const mainVideo = "jKjgHl4xL0A";
const bookingMessage = "Hola, me interesa contratar a la banda de Ø UnderTango Club. Quisiera consultar disponibilidad y formato para mi espacio.";
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
      data-undertango-subintent="banda_en_vivo"
      data-undertango-cta="Consultar por WhatsApp"
    >
      Consultar por WhatsApp <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function BandaPage() {
  return (
    <>
      <Header />
      <main className={styles.page} lang="es-AR">
        <div className={styles.shell}>
          <section className={styles.hero} aria-labelledby="band-title">
            <header className={styles.intro}>
              <p className={styles.label}>Ø UnderTango Club · Triple Frontera</p>
              <h1 id="band-title">{headline}</h1>
              <p className={styles.lead}>{lead}</p>
              <p>El quinteto de Ø UnderTango Club cruza soul, funk, samba y clásicos latinos en un show que empieza para escuchar y va ganando ritmo hasta abrir la pista. Armamos la presentación de principio a fin: adaptamos el repertorio y la duración a tu público y coordinamos la puesta con el espacio para darle a la noche el clima que buscás.</p>
              <BookingLink />
            </header>
            <div className={styles.feature}>
              <GalleryVideo id={mainVideo} title="Olhos Coloridos · en vivo con João Aruk" priority />
            </div>
          </section>

          <section className={styles.details} aria-labelledby="band-format">
            <div>
              <h2 id="band-format">Un show que se adapta a tu lugar</h2>
              <p>Podemos empezar con un set para escuchar y llevar la noche hacia la pista. Acordamos el repertorio, la cantidad de sets y las pausas según el espacio, el público y el horario.</p>
            </div>
            <dl className={styles.facts}>
              <div><dt>Formación</dt><dd>Quinteto de la Triple Frontera</dd></div>
              <div><dt>Duración</dt><dd>De 90 minutos a 3 horas, a convenir</dd></div>
            </dl>
          </section>

          <section className={styles.more} aria-labelledby="band-live">
            <h2 id="band-live">El quinteto en escena</h2>
            <div className={styles.videoGrid}>
              <div className={styles.videoCard}>
                <GalleryVideo id="iQOyq6xWdcc" title="Fragmento Bailongo en Foz do Iguaçú" portrait />
              </div>
              <div className={styles.videoCard}>
                <GalleryVideo id="Rv-paFARbME" title="Banda Musical ø Undertango" portrait />
                <p>Registro de la banda en otro formato de Ø UnderTango Club.</p>
              </div>
            </div>
          </section>

          <section className={styles.contact} aria-labelledby="band-contact">
            <div>
              <h2 id="band-contact">Coordinemos una fecha</h2>
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
