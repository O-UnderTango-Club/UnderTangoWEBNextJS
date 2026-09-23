import type { Metadata } from "next";
import Header from "../components/header";
import CopyPrompt from "./CopyPrompt";
import ToolNetwork from "../elitros/sistema-de-herramientas/ToolNetwork";
import { accessNote, handoff, historicalDoc, introduction, maintenance, protocols, protocolTitle, resources, reviewedAt, rules, startPrompt, workingModes } from "./protocol";
import styles from "./protocol.module.css";

export const metadata: Metadata = {
  title: `${protocolTitle} | UnderTango`,
  description: introduction,
  alternates: { canonical: "/807" },
  robots: { index: false, follow: false },
};

export default function ProtocolPage() {
  return <>
    <Header />
    <main className={styles.main}>
      <div className={styles.document}>
        <nav className={styles.breadcrumb} aria-label="Ruta de navegación"><a href="/central">Ø Central</a><span>/</span><span>80 · Sistema operativo</span><span>/</span><strong>807</strong></nav>
        <header className={styles.hero}>
          <div className={styles.number} aria-hidden="true">807</div>
          <div><p className={styles.eyebrow}>Departamento 80 · UnderTango Club</p><h1>Protocolo maestro</h1><p className={styles.lead}>{introduction}</p><p className={styles.review}>Revisión documental · {reviewedAt}</p></div>
        </header>

        <section className={styles.start} aria-labelledby="empezar">
          <div><p className={styles.eyebrow}>Una tarea, el contexto necesario</p><h2 id="empezar">Empezar por acá</h2><p>Copiá estas instrucciones en Gemini o en el asistente que vayas a usar. Agregá el resultado que necesitás y los materiales de esa tarea.</p></div>
          <CopyPrompt text={startPrompt} />
          <details className={styles.prompt}><summary>Ver las instrucciones</summary><pre>{startPrompt}</pre></details>
          <a className={styles.textLink} href="/807/protocolo.md">Abrir el documento completo en texto ↗</a>
        </section>

        <nav className={styles.contents} aria-label="Contenido del protocolo"><a href="#fuentes">Fuentes</a><a href="#protocolos">Protocolos</a><a href="#reglas">Reglas</a><a href="#asistentes">Asistentes y traspaso</a></nav>

        <section className={styles.section} aria-labelledby="fuentes">
          <div className={styles.sectionHeading}><span>01</span><div><h2 id="fuentes">Dónde está cada cosa</h2><p>Ir a la fuente original. Consultar sólo lo que requiere la tarea.</p></div></div>
          <div className={styles.resources}>{resources.map(resource => <article className={styles.resource} key={resource.href}><p className={styles.badge}>{resource.access}</p><h3><a href={resource.href} target="_blank" rel="noopener noreferrer">{resource.name} <span aria-hidden="true">↗</span></a></h3><p>{resource.purpose}</p></article>)}</div>
          <p className={styles.access}>{accessNote}</p>
          <div className={styles.networkPreview}>
            <h3>Cómo se conectan las herramientas</h3>
            <ToolNetwork compact />
            <a className={styles.textLink} href="/elitros/sistema-de-herramientas">Abrir el diagrama 3D interactivo completo ↗</a>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="protocolos">
          <div className={styles.sectionHeading}><span>02</span><div><h2 id="protocolos">Protocolos de trabajo</h2><p>Las reglas duraderas están en el repositorio del sistema operativo.</p></div></div>
          <div className={styles.protocols}>{protocols.map(item => <a href={item.href} key={item.href} target="_blank" rel="noopener noreferrer"><div><h3>{item.name}</h3><p>{item.purpose}</p><small>{item.access}</small></div><span aria-hidden="true">↗</span></a>)}</div>
          <details className={styles.historical}><summary>Documento histórico en Google Docs</summary><p>{historicalDoc.purpose}</p><a href={historicalDoc.href} target="_blank" rel="noopener noreferrer">Abrir el documento histórico ↗</a><small>{historicalDoc.access}</small></details>
        </section>

        <section className={styles.section} aria-labelledby="reglas">
          <div className={styles.sectionHeading}><span>03</span><div><h2 id="reglas">Reglas para continuar bien</h2><p>Acuerdos operativos, incluidos los cambios del panel del 13/09/2026.</p></div></div>
          <div className={styles.rules}>{rules.map((rule, index) => <details key={rule.title} open={index === 0}><summary>{rule.title}</summary><p>{rule.text}</p></details>)}</div>
        </section>

        <section className={styles.section} aria-labelledby="asistentes">
          <div className={styles.sectionHeading}><span>04</span><div><h2 id="asistentes">Cuidar los recursos</h2><p>Un reparto práctico del trabajo, con continuidad entre asistentes.</p></div></div>
          <div className={styles.modes}>{workingModes.map(mode => <article key={mode.title}><h3>{mode.title}</h3><p>{mode.text}</p></article>)}</div>
          <div className={styles.handoff}><h3>Al pasar una tarea a otro asistente</h3><p>{handoff}</p></div>
        </section>

        <footer className={styles.footer}><h2>Mantener este maestro</h2><p>{maintenance}</p><div><a href="https://github.com/O-UnderTango-Club/UnderTangoWEBNextJS/tree/main/app/807">Fuente versionada en GitHub ↗</a><a href="/central">Volver a Central</a></div></footer>
      </div>
    </main>
  </>;
}
