import type { Metadata } from "next";
import styles from "../80-startup-undertango/startup.module.css";
import progress from "./progress.module.css";

export const metadata: Metadata = {
  title: "KinesioLabs | Trayecto del proyecto · Ø UnderTango",
  description: "Nuestro primer cliente tecnológico. El alcance, el papel de UnderTango y las etapas del proyecto KinesioLabs.",
  alternates: { canonical: "/kinesiolabs" },
  openGraph: { title: "KinesioLabs | Trayecto del proyecto", description: "El primer caso tecnológico de UnderTango, documentado por etapas.", url: "https://www.undertangoclub.com/kinesiolabs", type: "website" },
};

const stages = [
  { number: "01", title: "Comprensión del proyecto", status: "Realizado", text: "Se recibió y revisó la documentación inicial y se identificó la necesidad de un prototipo de validación para tres kinesiólogos." },
  { number: "02", title: "Propuesta y presentación", status: "Etapa actual", text: "El presupuesto fue enviado. Estamos completando la presentación de la dirección tecnológica para acompañarlo y acordar los próximos pasos." },
  { number: "03", title: "Alcance y condiciones de inicio", status: "Por acordar", text: "Definir entregables, responsabilidades, calendario y condiciones de trabajo antes de iniciar la siguiente etapa." },
  { number: "04", title: "Desarrollo y validación", status: "Próxima etapa", text: "Construir y probar el alcance acordado con profesionales, registrar resultados y ajustar la solución a partir de esa experiencia." },
  { number: "05", title: "Evolución y mantenimiento", status: "Etapa posterior", text: "Planificar la continuidad del producto. La incorporación de inteligencia artificial forma parte de la evolución prevista y requiere su propia definición y validación." },
];

export default function KinesioLabsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}><a href="/80-startup-undertango">Ø UnderTango / 80</a><a href="/80-startup-undertango">Volver a la startup <span aria-hidden="true">↗</span></a></header>
      <section className={styles.hero} aria-labelledby="kinesio-title">
        <p className={styles.eyebrow}>PRIMER CLIENTE TECNOLÓGICO · CASO EN DESARROLLO</p>
        <h1 id="kinesio-title">KinesioLabs.</h1>
        <p className={styles.intro}>Un proyecto de salud digital.<br />Un recorrido que vamos documentando.</p>
        <p className={styles.lead}>KinesioLabs, impulsado por Vanesa Cabello, busca desarrollar herramientas digitales para el trabajo de profesionales de la kinesiología. UnderTango acompaña la dirección tecnológica y la coordinación del equipo de desarrollo.</p>
        <div className={progress.current}><span>EN QUÉ MOMENTO ESTAMOS</span><strong>Propuesta enviada · presentación en preparación</strong><p>Actualización: <time dateTime="2026-09-14">14 de septiembre de 2026</time></p></div>
      </section>
      <section className={styles.section} aria-labelledby="alcance"><div><p className={styles.eyebrow}>EL PUNTO DE PARTIDA</p><h2 id="alcance">Validar antes<br />de ampliar.</h2></div><div className={styles.copy}><p>La etapa inicial se concentra en un prototipo para validar con tres kinesiólogos cómo organizar la información y facilitar su consulta durante el trabajo profesional.</p><p>El proyecto distingue ese primer alcance de una futura plataforma más amplia, con nuevas funciones e inteligencia artificial. Cada etapa necesita objetivos, recursos y criterios de validación propios.</p></div></section>
      <section className={styles.work} aria-labelledby="etapas"><p className={styles.eyebrow}>TRAYECTO DEL PROYECTO</p><h2 id="etapas">Cada etapa tiene<br />su propio resultado.</h2><ol className={progress.stages}>{stages.map((stage,index)=><li key={stage.number} className={index===1?progress.active:undefined} aria-current={index===1?"step":undefined}><span className={progress.index}>{stage.number}</span><div><p className={progress.status}>{stage.status}</p><h3>{stage.title}</h3><p>{stage.text}</p></div></li>)}</ol></section>
      <section className={styles.section} aria-labelledby="rol"><div><p className={styles.eyebrow}>EL PAPEL DE UNDERTANGO</p><h2 id="rol">Conectar la necesidad<br />con el desarrollo.</h2></div><div className={styles.copy}><p>Pablo Cieslik coordina la dirección tecnológica: ordenar el alcance con Vanesa, articular a los programadores y dar seguimiento a las decisiones y entregables.</p><p>El trayecto de KinesioLabs será nuestro caso de referencia para mostrar en ÉLITROS cómo aplicamos la gerencia de proyectos y qué aprendemos al pasar de una propuesta a una solución en uso.</p></div></section>
      <section className={styles.more} aria-labelledby="elitros"><div><p className={styles.eyebrow}>PARA SEGUIR INVESTIGANDO</p><h2 id="elitros">El modelo detrás<br />del recorrido.</h2><p>En ÉLITROS presentamos la startup, su enfoque de trabajo y sus líneas de evolución. KinesioLabs aporta el caso concreto que iremos documentando a medida que avance.</p></div><a href="https://elitros.undertangoclub.com">Explorar ÉLITROS <span aria-hidden="true">↗</span></a></section>
      <footer className={styles.footer}><span>Ø UnderTango · Departamento 80</span><span>KinesioLabs · Seguimiento público del proyecto</span></footer>
    </main>
  );
}
