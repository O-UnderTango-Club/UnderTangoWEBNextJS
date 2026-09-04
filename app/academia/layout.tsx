import type { Metadata } from "next";
import { academyOrigin } from "./projects";
import styles from "./academia.module.css";

export const metadata: Metadata = {
  title: { default: "Academia Under Tango | Departamento 83", template: "%s | Academia Under Tango" },
  description: "El espacio de aprendizaje de Under Tango. Explorá APRENDE, la Academia de Tango online y presencial y herramientas gratuitas como el contador de palabras.",
  applicationName: "Academia Under Tango",
  alternates: { canonical: academyOrigin },
  openGraph: {
    title: "Academia Under Tango | Departamento 83",
    description: "Aprender con la mente, el cuerpo y la práctica. Los proyectos del Departamento 83.",
    url: academyOrigin,
    siteName: "Academia Under Tango",
    locale: "es_AR",
    type: "website",
  },
  icons: { icon: "/academia-icon.svg" },
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#contenido">Saltar al contenido</a>
      <header className={styles.header}>
        <a href="/academia" className={styles.brand} aria-label="Academia Under Tango, inicio">
          <span className={styles.brandNumber}>83</span>
          <span>Academia <strong>Under Tango</strong></span>
        </a>
        <nav aria-label="Navegación de Academia">
          <a href="/academia#proyectos">Proyectos</a>
          <a href="/academia/contador-de-palabras">Contador de palabras <span aria-hidden="true">↗</span></a>
        </nav>
      </header>
      {children}
      <footer className={styles.footer}>
        <span><strong>83</strong> · Academia Under Tango</span>
        <a href="https://undertangoclub.com">Conocé UnderTango Club <span aria-hidden="true">↗</span></a>
      </footer>
    </div>
  );
}
