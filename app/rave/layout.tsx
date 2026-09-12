import type { Metadata } from "next";
import Link from "next/link";
import styles from "./rave.module.css";
import { raveImages } from "./social";

export const metadata: Metadata = {
  metadataBase: new URL("https://rave.undertangoclub.com"),
  title: "Ø Rave — Tango Rave & Peña Rave | UnderTango",
  description: "La banda de UnderTango. Tango Rave: música en vivo, electrónica, danza y visuales. Peña Rave: estreno en septiembre de 2026 en Puerto Iguazú.",
  alternates: { canonical: "https://rave.undertangoclub.com" },
  icons: {
    icon: [{ url: "/images/rave/icon-v1.svg", type: "image/svg+xml" }, { url: "/images/rave/icon-32-v1.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/images/rave/apple-icon-v1.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: { title: "Ø Rave | UnderTango", description: "Dos universos. Una banda. Conocé Tango Rave y Peña Rave.", url: "https://rave.undertangoclub.com", type: "website", images: raveImages },
  twitter: { card: "summary_large_image", images: raveImages },
};

export default function RaveLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.site}>
    <a className={styles.skip} href="#contenido">Saltar al contenido</a>
    <header className={styles.header}>
      <Link href="/rave" className={styles.brand} aria-label="Ø Rave — Inicio">Ø <span>RAVE</span></Link>
      <nav aria-label="Productos de la banda"><Link href="/rave/tango-rave">Tango Rave</Link><Link href="/rave/pena-rave">Peña Rave</Link></nav>
    </header>
    {children}
    <footer className={styles.footer}><span>Ø UnderTango · Puerto Iguazú · Argentina</span><a href="https://www.undertangoclub.com">UnderTango Club ↗</a></footer>
  </div>;
}
