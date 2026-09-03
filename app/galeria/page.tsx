import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./galeria.module.css";

type ArchiveEntry = {
  archiveNumber: string;
  title: string;
  dateLabel: string;
  dateTime: string;
  location: string;
  status: string;
  description: string;
  image: string;
  width: number;
  height: number;
  alt: string;
};

const archive: ArchiveEntry[] = [
  {
    archiveNumber: "002",
    title: "Peña Rave",
    dateLabel: "Septiembre 2026",
    dateTime: "2026-09",
    location: "Puerto Iguazú · Misiones",
    status: "Próximamente",
    description:
      "Hits del folclore en versión Under Tango: banda en vivo, electrónica, danza y energía para una nueva noche en Puerto Iguazú.",
    image: "/galeria/2026-09-pena-rave-puerto-iguazu.webp",
    width: 1024,
    height: 1535,
    alt: "Flyer de Peña Rave, próximamente en Puerto Iguazú",
  },
  {
    archiveNumber: "001",
    title: "Ø Tango Rave · Festival La Frontera",
    dateLabel: "29 de agosto de 2026",
    dateTime: "2026-08-29",
    location: "Bernardo de Irigoyen · Misiones",
    status: "Presentación realizada",
    description:
      "Presentación especial de Ø Tango Rave en el 4.º Festival Internacional de Turismo La Frontera: cinco músicos en escena y pareja de tango.",
    image: "/galeria/2026-08-29-tango-rave-la-frontera.webp",
    width: 1055,
    height: 1491,
    alt: "Flyer de Ø Tango Rave en el Festival Internacional de Turismo La Frontera",
  },
];

export const metadata: Metadata = {
  title: "Galería de presentaciones | Ø UnderTango Club",
  description:
    "Archivo visual de shows, estrenos y presentaciones de Ø UnderTango Club en la Triple Frontera.",
  alternates: { canonical: "/galeria" },
  openGraph: {
    title: "Galería de presentaciones | Ø UnderTango Club",
    description:
      "Flyers y recuerdos de los escenarios que forman la historia de Ø UnderTango Club.",
    url: "https://www.undertangoclub.com/galeria",
    siteName: "Ø UnderTango Club",
    locale: "es_AR",
    type: "website",
  },
};

export default function GalleryPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>ARCHIVO VIVO · Ø UNDERTANGO CLUB</p>
            <h1>Galería de presentaciones</h1>
          </div>
          <div className={styles.intro}>
            <p>
              Cada flyer guarda un momento del camino. Reunimos aquí, del más
              reciente al más antiguo, los anuncios y escenarios que van
              formando nuestra historia.
            </p>
            <span>{archive.length} piezas en el archivo</span>
          </div>
        </header>

        <section className={styles.gallery} aria-label="Flyers de presentaciones">
          {archive.map((entry, index) => (
            <article className={styles.entry} key={entry.archiveNumber}>
              <div className={styles.posterColumn}>
                <a
                  className={styles.frame}
                  href={entry.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir el flyer completo de ${entry.title}`}
                >
                  <Image
                    src={entry.image}
                    alt={entry.alt}
                    width={entry.width}
                    height={entry.height}
                    sizes="(max-width: 760px) 92vw, (max-width: 1100px) 54vw, 570px"
                    priority={index === 0}
                  />
                </a>
                <a
                  className={styles.openHint}
                  href={entry.image}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir flyer completo ↗
                </a>
              </div>

              <div className={styles.caption}>
                <div className={styles.captionTopline}>
                  <span>ARCHIVO {entry.archiveNumber}</span>
                  <span>{entry.status}</span>
                </div>
                <h2>{entry.title}</h2>
                <p className={styles.description}>{entry.description}</p>
                <dl className={styles.details}>
                  <div>
                    <dt>Fecha</dt>
                    <dd>
                      <time dateTime={entry.dateTime}>{entry.dateLabel}</time>
                    </dd>
                  </div>
                  <div>
                    <dt>Lugar</dt>
                    <dd>{entry.location}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </section>

        <div className={styles.archiveFooter}>
          <p>El archivo seguirá creciendo con cada nueva presentación.</p>
          <Link href="/shows">Conocer los shows de Ø UnderTango →</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
