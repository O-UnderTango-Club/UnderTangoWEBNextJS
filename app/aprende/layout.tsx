import type { Metadata } from "next";
import "./aprende.css";
import "./isolation.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aprende.undertangoclub.com"),
  title: "APRENDE | Memoria y aprendizaje acelerado",
  description:
    "Entrenamiento práctico de memoria, mnemotecnia y aprendizaje acelerado. Descargá gratis la primera guía de APRENDE, respaldado por Ø UnderTango.",
  applicationName: "APRENDE",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      {
        url: "/aprende/icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "APRENDE | Memoria y aprendizaje acelerado",
    description:
      "Técnicas prácticas de memoria, mnemotecnia, recuperación activa y repetición espaciada.",
    url: "https://aprende.undertangoclub.com/",
    siteName: "APRENDE",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "APRENDE | Memoria y aprendizaje acelerado",
    description:
      "Recordá más. Estudiá con método. Guía gratuita de memoria, mnemotecnia y aprendizaje.",
  },
};

export default function AprendeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
