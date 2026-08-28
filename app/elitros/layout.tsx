import type { Metadata } from "next";
import "./route-fix.css";

export const metadata: Metadata = {
  title: "UnderTango · Business Model Canvas | ÉLITROS 2026",
  description:
    "El modelo de negocio, la arquitectura económica y el diagnóstico de madurez KTH de UnderTango.",
  alternates: {
    canonical: "https://elitros.undertangoclub.com",
  },
  openGraph: {
    title: "UnderTango · Business Model Canvas",
    description:
      "ÉLITROS 2026 · Modelo vivo de negocio y madurez KTH.",
    url: "https://elitros.undertangoclub.com",
    siteName: "Ø UnderTango · ÉLITROS 2026",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/elitros/og.png", width: 1200, height: 630, alt: "UnderTango Business Model Canvas · ÉLITROS 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UnderTango · Business Model Canvas",
    description: "ÉLITROS 2026 · Modelo vivo de negocio y madurez KTH.",
    images: ["/elitros/og.png"],
  },
};

export default function ElitrosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

