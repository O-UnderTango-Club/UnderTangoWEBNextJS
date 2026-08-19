import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ø UnderTango · ÉLITROS 2026 | Aprendizaje aplicado",
  description:
    "Seguimiento público del trabajo de Ø UnderTango dentro de ÉLITROS 2026: modelo de negocio, hipótesis, decisiones, prototipos y evidencia por módulo.",
  alternates: {
    canonical: "https://elitros.undertangoclub.com",
  },
  openGraph: {
    title: "Ø UnderTango · ÉLITROS 2026",
    description:
      "Cómo cada clase de ÉLITROS se convierte en decisiones, hipótesis, prototipos y evidencia dentro de UnderTango.",
    url: "https://elitros.undertangoclub.com",
    siteName: "Ø UnderTango · ÉLITROS 2026",
    locale: "es_AR",
    type: "website",
  },
};

export default function ElitrosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
