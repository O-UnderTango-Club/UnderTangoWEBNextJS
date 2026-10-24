import type { Metadata } from "next";
import Link from "next/link";
import styles from "./guide.module.css";

const downloadUrl = "https://play.google.com/apps/internaltest/4701297954753792165";
const appUrl = "https://red.undertangoclub.com/";
const title = "Sumate a la Red UnderTango";
const description = "Descargá la app, ingresá con Google y coordiná ensayos con los músicos de UnderTango: disponibilidad, día, horario y lugar.";

export const metadata: Metadata = {
  title: "803 · Red UnderTango | Cómo ingresar",
  description,
  alternates: { canonical: "/80/803" },
  openGraph: {
    title,
    description,
    url: "https://www.undertangoclub.com/80/803",
    siteName: "UnderTango Club",
    locale: "es_AR",
    type: "website",
  },
};

export default function RedGuidePage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.navigation} aria-label="Volver a los departamentos">
          <Link href="/86">← 86 · Música</Link>
          <Link href="/80">80 · Tecnología</Link>
        </nav>
        <header className={styles.header}>
          <p className={styles.eyebrow}>80 / 803 · APP MÓVIL EN DESARROLLO</p>
          <h1>{title}</h1>
          <p className={styles.lead}>Más fácil encontrarnos. Más tiempo para hacer música.</p>
          <p>Estamos desarrollando una app móvil para resolver las necesidades de cada departamento de UnderTango. En Música, empezamos por algo fundamental: <strong>coordinar los ensayos entre todos.</strong></p>
          <p className={styles.note}><strong>Antes de descargar la versión Android:</strong> pasale a Pablo el correo de la cuenta de Google que usás en Google Play y esperá a que te confirme que ya te agregó como participante de la prueba. El enlace de descarga funciona con esa cuenta habilitada.</p>
          <a className={styles.primary} href={downloadUrl}>Descargar app de prueba para Android ↗</a>
          <p>¿Querés empezar ahora? <a className={styles.textLink} href={appUrl}>Usar la red desde el navegador ↗</a>. Ingresá con Google y elegí 86 · Música; para esta opción no necesitás estar en la lista de prueba de Google Play.</p>
          <p className={styles.caption}>Abrí este enlace desde tu celular. La app está en versión de prueba y seguimos mejorándola.</p>
        </header>

        <section aria-labelledby="como-ingresar">
          <p className={styles.eyebrow}>EMPEZÁ DESDE TU CELULAR</p>
          <h2 id="como-ingresar">Cómo ingresar a la red</h2>
          <ol className={styles.steps}>
            <li>
              <span className={styles.number} aria-hidden="true">1</span>
              <div><h3>Pedí acceso y descargá la aplicación</h3><p>Primero pasale a Pablo tu correo de Google Play. Cuando te confirme que tu cuenta está habilitada para la prueba, abrí el enlace de descarga desde tu celular Android. Si Google Play te pide elegir una cuenta, usá la cuenta de Google con la que vas a ingresar a la red. Si te lo pide, elegí participar de la prueba. Después tocá “Descargar app de prueba” (o “Download test app”) e instalala desde Google Play.</p><a className={styles.textLink} href={downloadUrl}>Abrir el enlace de descarga ↗</a></div>
            </li>
            <li>
              <span className={styles.number} aria-hidden="true">2</span>
              <div><h3>Ingresá con Google</h3><p>Abrí la app y tocá <strong>“Continuar en Google”</strong>. Elegí tu cuenta para ingresar.</p></div>
            </li>
            <li>
              <span className={styles.number} aria-hidden="true">3</span>
              <div><h3>Elegí tu departamento</h3><p>Completá tu nombre y seleccioná el departamento al que pertenecés. Si sos músico, marcá <strong>86 · Música</strong>. Si también participás en otras áreas, podés elegir más de una.</p><p className={styles.note}>Si tu cuenta queda pendiente de aprobación, avisale a Pablo para que habilite tu acceso.</p></div>
            </li>
            <li>
              <span className={styles.number} aria-hidden="true">4</span>
              <div><h3>Entrá a Música y organizá el ensayo</h3><p>En Inicio, tocá <strong>86 · Música → Organizar ensayo</strong>. Ahí podés consultar la disponibilidad del grupo o proponer un ensayo con día, lugar, horario e integrantes.</p></div>
            </li>
          </ol>
        </section>

        <section className={styles.rehearsals} aria-labelledby="coordinar-ensayos">
          <p className={styles.eyebrow}>86 · MÚSICA</p>
          <h2 id="coordinar-ensayos">¿Cuándo podemos ensayar?</h2>
          <p>La idea es resolverlo en la app y ver con claridad cuándo podemos coincidir.</p>
          <ul>
            <li><strong>Consultá al grupo.</strong> Convocá a todos los músicos o elegí a personas específicas.</li>
            <li><strong>Marcá cuándo podés.</strong> Elegí días y horarios en la grilla. Si podés desde las 08:30 o en otro horario, ingresá ese tramo exacto con “Puedo en otro horario”.</li>
            <li><strong>Encontrá la coincidencia.</strong> Cuando respondieron todos los convocados, aparecen los horarios disponibles para todos. Quien organizó el llamado puede definir el resultado.</li>
            <li><strong>Proponé el ensayo.</strong> Definí día, lugar y horario para que el grupo tenga la convocatoria en la app.</li>
          </ul>
          <p className={styles.note}>Cada consulta es un llamado nuevo: renueva la anterior y pide que todos indiquen su disponibilidad de nuevo.</p>
        </section>

        <section className={styles.access} aria-labelledby="ya-tengo-app">
          <h2 id="ya-tengo-app">¿Ya tenés la app?</h2>
          <p>Abrila e ingresá con Google. También podés usar la red desde el navegador del celular o la computadora.</p>
          <a className={styles.primary} href={appUrl}>Abrir Red UnderTango ↗</a>
          <p className={styles.caption}>¿Usás iPhone? Ingresá desde el navegador con este mismo botón.</p>
        </section>
        <footer className={styles.footer}><Link href="/86">Volver a Música →</Link><p>UnderTango Club · Una red que construimos entre todos.</p></footer>
      </div>
    </main>
  );
}
