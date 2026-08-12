import type { Metadata } from "next";
import "./aprende.css";

export const metadata: Metadata = {
  title: "APRENDE | Memoria y aprendizaje acelerado",
  description:
    "Entrenamiento práctico de memoria, mnemotecnia y aprendizaje acelerado. Descargá gratis la primera guía de APRENDE, respaldado por Ø UnderTango.",
  alternates: {
    canonical: "/aprende",
  },
  openGraph: {
    title: "APRENDE | Memoria y aprendizaje acelerado",
    description:
      "Técnicas prácticas de memoria, mnemotecnia, recuperación activa y repetición espaciada.",
    url: "https://www.undertangoclub.com/aprende",
    siteName: "APRENDE",
    locale: "es_AR",
    type: "website",
  },
};

export default function AprendeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
