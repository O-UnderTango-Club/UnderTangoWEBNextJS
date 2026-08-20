import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ø UnderTango · Operación viva 2026",
  description: "Tablero público de módulos, operaciones, evidencia y resultados de Ø UnderTango durante 2026.",
  alternates: { canonical: "https://www.undertangoclub.com/operacion" },
  openGraph: {
    title: "Ø UnderTango · Operación viva 2026",
    description: "Qué está haciendo cada módulo de UnderTango: operaciones, clientes, evidencia y resultados.",
    url: "https://www.undertangoclub.com/operacion",
    siteName: "Ø UnderTango Club",
    locale: "es_AR",
    type: "website",
  },
};

export default function OperacionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
