import type { Metadata } from "next";
import styles from "./startup.module.css";

export const metadata: Metadata = {
  title: "Startup Ø UnderTango | Departamento 80",
  description: "El área de UnderTango dedicada a la dirección de proyectos tecnológicos, la programación y las herramientas de gestión.",
  alternates: { canonical: "/80-startup-undertango" },
  openGraph: {
    title: "Startup Ø UnderTango | Departamento 80",
    description: "Proyectos, equipos y tecnología a partir de necesidades reales.",
    url: "https://www.undertangoclub.com/80-startup-undertango",
    type: "website",
  },
};

export default function StartupUnderTango() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" aria-label="Inicio de UnderTango">Ø UnderTango</a>
        <a href="/central">Conocer el equipo <span aria-hidden="true">↗</span></a>
      </header>

      <section className={styles.hero} aria-labelledby="startup-title">
        <p className={styles.eyebrow}>DEPARTAMENTO 80 · PROYECTOS TECNOLÓGICOS</p>
        <h1 id="startup-title">Startup<br /><span>Ø UnderTango.</span></h1>
        <p className={styles.intro}>De una necesidad real a una herramienta que se usa.</p>
        <p className={styles.lead}>Dentro de UnderTango, el Departamento 80 reúne la dirección de proyectos tecnológicos, la programación y la documentación. Organiza el trabajo de los equipos y desarrolla herramientas para llevar los proyectos a la práctica.</p>
        <div className={styles.number} aria-hidden="true">80<span>IDEA → PROYECTO → USO</span></div>
      </section>

      <section className={styles.section} aria-labelledby="origen">
        <div><p className={styles.eyebrow}>01 / DE DÓNDE PARTIMOS</p><h2 id="origen">La experiencia<br />marca el punto de partida.</h2></div>
        <div className={styles.copy}>
          <p>UnderTango nace de la actividad artística y de la coordinación de personas, espacios y producciones. Ese trabajo requiere organizar información, tomar decisiones y dar seguimiento a lo acordado.</p>
          <p>La startup desarrolla la dimensión tecnológica de esa experiencia: convertir procesos de trabajo en herramientas digitales, probarlas en situaciones concretas y mejorarlas con su uso.</p>
        </div>
      </section>

      <section className={styles.work} aria-labelledby="trabajo">
        <p className={styles.eyebrow}>02 / QUÉ HACE EL DEPARTAMENTO 80</p>
        <h2 id="trabajo">Dirección, desarrollo<br />y continuidad.</h2>
        <div className={styles.columns}>
          <article><span>01</span><h3>Definir el proyecto</h3><p>Comprender el problema, identificar a sus usuarios y acordar el alcance, las prioridades y los criterios para evaluar el resultado.</p></article>
          <article><span>02</span><h3>Coordinar el desarrollo</h3><p>Articular el equipo de programación, organizar las etapas de trabajo y construir prototipos y herramientas digitales.</p></article>
          <article><span>03</span><h3>Sostener lo construido</h3><p>Documentar las decisiones, acompañar la validación y planificar el mantenimiento y la evolución de cada solución.</p></article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="forma">
        <div><p className={styles.eyebrow}>03 / CÓMO TRABAJAMOS</p><h2 id="forma">Primero entender.<br />Después construir.</h2></div>
        <div className={styles.copy}>
          <p>Partimos de un alcance concreto y avanzamos por etapas. La tecnología se elige según el problema, las personas que la van a usar y los recursos disponibles.</p>
          <p>El equipo se organiza en función de cada proyecto. La coordinación conecta las necesidades de quienes lo impulsan con el trabajo de desarrollo, para mantener claras las responsabilidades y los próximos pasos.</p>
          <p className={styles.signature}><strong>Pablo Cieslik</strong><br />Dirección de UnderTango y gerencia de proyectos.</p>
        </div>
      </section>

      <section className={styles.more} aria-labelledby="seguir">
        <div><p className={styles.eyebrow}>NUESTRO PRIMER CLIENTE TECNOLÓGICO</p><h2 id="seguir">KinesioLabs.<br />El recorrido, en la práctica.</h2><p>Es nuestro caso de referencia para documentar el trabajo del Departamento 80 y presentar en ÉLITROS el trayecto realizado. Conocé el proyecto y en qué etapa estamos.</p></div>
        <a href="/kinesiolabs">Conocer KinesioLabs <span aria-hidden="true">↗</span></a>
      </section>
      <footer className={styles.footer}><span>Ø UnderTango · Departamento 80</span><span>Puerto Iguazú · Triple Frontera</span></footer>
    </main>
  );
}
