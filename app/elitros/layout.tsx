import type { Metadata } from "next";
import "./route-fix.css";

export const metadata: Metadata = {
  title: "UnderTango · Arte, eventos y comunicación | ÉLITROS 2026",
  description:
    "Coordinación humana, eventos, comunicación, imagen y diseño para concretar objetivos. El sistema de trabajo de UnderTango en Élitros.",
  alternates: {
    canonical: "https://elitros.undertangoclub.com",
  },
  openGraph: {
    title: "UnderTango · Arte, eventos y comunicación",
    description:
      "No existen sistemas sin humanos. Arte, eventos y comunicación para conectar proyectos con las personas.",
    url: "https://elitros.undertangoclub.com",
    siteName: "Ø UnderTango · ÉLITROS 2026",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/elitros/og.png", width: 1200, height: 630, alt: "UnderTango Business Model Canvas · ÉLITROS 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UnderTango · Arte, eventos y comunicación",
    description: "No existen sistemas sin humanos. Arte, eventos y comunicación para conectar proyectos con las personas.",
    images: ["/elitros/og.png"],
  },
};

export default function ElitrosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

