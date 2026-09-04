import type { Metadata } from "next";
import { academyOrigin } from "../projects";
import styles from "../academia.module.css";
import WordCounter from "./WordCounter";

export const metadata: Metadata = {
  title: "Contador de palabras gratis",
  description: "Contá palabras y caracteres al instante. Contador gratuito, sin registro: escribí o pegá tu texto. Se procesa en tu navegador.",
  alternates: { canonical: `${academyOrigin}/contador-de-palabras` },
  openGraph: { title: "Contador de palabras gratis | Academia Under Tango", url: `${academyOrigin}/contador-de-palabras`, description: "Palabras y caracteres al instante, sin registro." },
};

export default function CounterPage() {
  return (
    <main id="contenido" className={styles.main}>
      <a href="/academia" className={styles.back}>← Todos los proyectos</a>
      <div className={styles.toolHeading}><p className={styles.eyebrow}>83 / 03 · HERRAMIENTA GRATUITA</p><h1>Contador de <em>palabras.</em></h1><p>Escribí, pegá y contá. Así de simple.</p></div>
      <WordCounter />
    </main>
  );
}
