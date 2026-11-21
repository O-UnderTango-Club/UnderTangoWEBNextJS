import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./log.module.css";

export const metadata: Metadata = {
  title: "Log de UnderTango · Revista y archivo",
  description: "Revista semanal y archivo de los diez departamentos de UnderTango.",
  alternates: { canonical: "/log-de-undertango" },
};

const departments = [
  { code: "80", name: "Programación", date: "21 nov", day: "2026-11-21", body: "Se ajustó la continuidad de las sesiones del panel operativo para el equipo.", href: "https://github.com/O-UnderTango-Club/UnderTangoWEBNextJS/commit/db1da386336be0314e094204a646cfa1a2d3ca6a" },
  { code: "81", name: "Shows", date: "18 nov", day: "2026-11-18", body: "Se publicó la página de producción artística en español, portugués e inglés, con propuestas de la Triple Frontera.", href: "/shows" },
  { code: "82", name: "Moda", date: "5 sep", day: "2026-09-05", body: "Se organizó un ciclo mensual de imágenes alegóricas. La primera revisión deja pendiente documentar qué piezas se publicaron." },
  { code: "83", name: "Academia", date: "4 sep", day: "2026-09-04", body: "Se abrió la página de Academia Under Tango con el método APRENDE y una herramienta gratuita de conteo de palabras.", href: "/aprende" },
  { code: "84", name: "Marketing y audiovisual", date: "27 sep", day: "2026-09-27", body: "Se incorporó a Ø Central el registro de la selección oficial del videoclip «Justicia de frente — Øid Mortales» en el Festival Multiversos.", href: "/central#84-multiversos" },
  { code: "85", name: "Taller y fábrica", date: "5 sep", day: "2026-09-05", body: "El mapa de Ø Central incorporó al responsable de diseño, construcción y carpintería. Queda por reunir registros de piezas del taller.", href: "/central" },
  { code: "86", name: "Música", date: "21 nov", day: "2026-11-21", body: "860 Multiversos integró la apertura con el conjunto vacío tridimensional y el paso de las frecuencias a una escena que trabaja con el tiempo.", href: "/860-multiversos" },
  { code: "87", name: "Finanzas", date: "18 nov", day: "2026-11-18", body: "El panel financiero incorporó la lectura de transferencias internas para facilitar la conciliación.", href: "https://github.com/O-UnderTango-Club/UnderTangoWEBNextJS/commit/338dc147d370a94e4429b711fc64d696f8ab9f3b" },
  { code: "88", name: "Equipo central", date: "17 nov", day: "2026-11-17", body: "Se incorporó Chloé como cuadro interno para consultar acciones, frentes y fechas del Club.", href: "https://github.com/O-UnderTango-Club/UnderTangoWEBNextJS/pull/76" },
  { code: "89", name: "Vinculación", date: "2 sep", day: "2026-09-02", body: "Sistema Bajo Fuego entró al radar de Vinculación como exploración de una red internacional de artistas. La colaboración sigue en evaluación." },
];

const editions = [
  { number: "01", range: "23–29 de noviembre", date: "2026-11-29" },
  { number: "02", range: "30 de noviembre–6 de diciembre", date: "2026-12-06" },
  { number: "03", range: "7–13 de diciembre", date: "2026-12-13" },
  { number: "04", range: "14–20 de diciembre", date: "2026-12-20" },
  { number: "05", range: "21–27 de diciembre", date: "2026-12-27" },
];

const periods = [
  {
    title: "Enero–abril",
    milestones: [
      { date: "14 ene", day: "2026-01-14", text: "Se presentó documentación para la producción teatral de «Conversación en el subsuelo»." },
      { date: "25 feb", day: "2026-02-25", text: "Se incorporó el logotipo del Club como icono del sitio." },
    ],
    note: "Cobertura parcial. Queda por reconstruir el período con el archivo de cada departamento.",
  },
  {
    title: "Mayo–agosto",
    milestones: [
      { date: "3 jun", day: "2026-06-03", text: "Se envió el video de ensayo al preselectivo de la Fiesta del Inmigrante." },
      { date: "15 ago", day: "2026-08-15", text: "Se realizó el show benéfico Festa das Nações en Foz do Iguaçu." },
      { date: "23 ago", day: "2026-08-23", text: "Se realizó el show en Hotel Wish, también en Foz do Iguaçu." },
      { date: "24 ago", day: "2026-08-24", text: "Se enviaron a distribución los álbumes «Pasando Revista» y «Nueva Inocencia»." },
      { date: "29 ago", day: "2026-08-29", text: "Se realizó Tango Rave en Bernardo de Irigoyen y quedó un registro audiovisual." },
    ],
  },
  {
    title: "Septiembre–diciembre",
    milestones: [
      { date: "2 sep", day: "2026-09-02", text: "Se publicó Ø Central como mapa de los departamentos del Club." },
      { date: "27 sep", day: "2026-09-27", text: "Se registró la selección de «Justicia de frente» en el Festival Multiversos." },
      { date: "18 nov", day: "2026-11-18", text: "Se publicó Shows en tres idiomas." },
      { date: "21 nov", day: "2026-11-21", text: "Se integraron las escenas de 860 Multiversos." },
    ],
    note: "Abierto hasta el 31 de diciembre. El anuario se prepara en enero de 2027.",
  },
];

export default function UnderTangoLog() {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <nav className={styles.masthead} aria-label="UnderTango Club">
          <Link href="/central">Ø Central</Link>
          <span>Archivo editorial · 2026</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroText}>
            <h1>Log de<br /><em>UnderTango</em></h1>
            <p>Qué está pasando en los diez departamentos del Club, con fechas y registros para seguir su evolución.</p>
          </div>
          <figure className={styles.heroImage}>
            <Image src="https://i.ytimg.com/vi/5x1oUmMOsaY/hqdefault.jpg" alt="Fotograma del show Raíces da Fronteira" fill unoptimized sizes="(max-width: 720px) 100vw, 43vw" priority />
            <figcaption><Link href="/shows">Raíces da Fronteira · Producción en la Triple Frontera ↗</Link></figcaption>
          </figure>
        </header>

        <nav className={styles.contents} aria-label="Contenido del log">
          <a href="#apertura">Edición de apertura</a>
          <a href="#semanales">Revistas semanales</a>
          <a href="#anuario">Anuario 2026</a>
        </nav>

        <article className={styles.block} id="apertura" aria-labelledby="apertura-titulo">
          <header className={styles.blockHeader}>
            <p className={styles.eyebrow}>Edición de apertura · Corte al <time dateTime="2026-11-21">21 de noviembre de 2026</time></p>
            <h2 id="apertura-titulo">Del escenario al archivo</h2>
            <p>Shows amplió su alcance con tres idiomas y Multiversos desarrolló su puesta audiovisual. El primer relevamiento reúne estos avances y recupera hitos anteriores de los otros departamentos.</p>
          </header>
          <div className={styles.opening}>
            <ol className={styles.departments}>
              {departments.map((department) => (
                <li key={department.code}>
                  <span className={styles.code}>{department.code}</span>
                  <div>
                    <div className={styles.entryHeader}>
                      <h3>{department.name}</h3>
                      <time dateTime={department.day}>{department.date}</time>
                    </div>
                    <p>{department.body}</p>
                    {department.href && <a href={department.href}>Ver registro <span aria-hidden="true">↗</span></a>}
                  </div>
                </li>
              ))}
            </ol>
            <figure className={styles.poster}>
              <Image src="/images/multiversos/justicia-de-frente.png" alt="Afiche de Justicia de frente, selección oficial del Festival Multiversos" width={1122} height={1402} sizes="(max-width: 720px) 100vw, 30vw" />
              <figcaption>Archivo audiovisual · <Link href="/central#84-multiversos">Justicia de frente ↗</Link></figcaption>
            </figure>
          </div>
        </article>

        <div className={styles.block} id="semanales" role="region" aria-labelledby="semanales-titulo">
          <header className={styles.blockHeader}>
            <h2 id="semanales-titulo">Revistas semanales</h2>
            <p>Cinco números previstos de acá al cierre de diciembre.</p>
          </header>
          <ol className={styles.editions}>
            {editions.map((edition) => (
              <li key={edition.date}>
                <span className={styles.code}>N.º {edition.number}</span>
                <h3>{edition.range}</h3>
                <p>Edición prevista</p>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.block} id="anuario" role="region" aria-labelledby="anuario-titulo">
          <header className={styles.blockHeader}>
            <p className={styles.eyebrow}>Archivo en preparación</p>
            <h2 id="anuario-titulo">Anuario 2026</h2>
            <p>Una sola revista de cierre, con los hitos de cada departamento en tres cuatrimestres.</p>
          </header>
          <div className={styles.periods}>
            {periods.map((period) => (
              <div key={period.title}>
                <h3>{period.title}</h3>
                <ul>
                  {period.milestones.map((milestone) => (
                    <li key={milestone.day}><time dateTime={milestone.day}>{milestone.date}</time><p>{milestone.text}</p></li>
                  ))}
                </ul>
                {period.note && <p className={styles.note}>{period.note}</p>}
              </div>
            ))}
          </div>
        </div>

        <footer className={styles.foot}><Link href="/central">Volver a Ø Central <span aria-hidden="true">↗</span></Link></footer>
      </div>
    </main>
  );
}
