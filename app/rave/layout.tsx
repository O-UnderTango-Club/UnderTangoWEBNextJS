import type { Metadata } from "next";
import { LanguageProvider, LanguagePicker, EnglishShortcut, RaveLink, T, BandNavigation } from "./language";
import styles from "./rave.module.css";
import { ravePartyImages } from "./social";

const raveTitle = "La banda que hace tu fiesta | UnderTango Rave";
const raveDescription = "Una banda versátil, música en vivo y un repertorio pensado para tu evento. Vos disfrutá con tus invitados: nosotros hacemos la fiesta.";

export const metadata: Metadata = {
  metadataBase: new URL("https://rave.undertangoclub.com"),
  title: raveTitle,
  description: raveDescription,
  applicationName: "UnderTango Rave",
  alternates: { canonical: "https://rave.undertangoclub.com" },
  icons: {
    icon: [{ url: "/images/rave/icon-v1.svg", type: "image/svg+xml" }, { url: "/images/rave/icon-32-v1.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/images/rave/apple-icon-v1.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: raveTitle,
    description: raveDescription,
    url: "https://rave.undertangoclub.com",
    siteName: "UnderTango Rave",
    locale: "es_AR",
    type: "website",
    images: ravePartyImages,
  },
  twitter: { card: "summary_large_image", title: raveTitle, description: raveDescription, images: ravePartyImages },
};

export default function RaveLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider><div className={styles.site}>
    <a className={styles.skip} href="#contenido"><T>Saltar al contenido</T></a>
    <header className={styles.header}>
      <RaveLink href="/rave" className={styles.brand} aria-label="Ø Rave — Inicio">Ø <span>RAVE</span></RaveLink>
      <BandNavigation><RaveLink href="/rave/tango-rave">Tango Rave</RaveLink></BandNavigation><LanguagePicker />
    </header>
    {children}
    <footer className={styles.footer}><span>Ø UnderTango · Puerto Iguazú · Argentina</span><a href="https://www.undertangoclub.com">UnderTango Club ↗</a></footer>
    <EnglishShortcut />
  </div></LanguageProvider>;
}
