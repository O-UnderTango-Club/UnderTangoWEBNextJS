import type { Metadata } from "next";
import type { ReactNode } from "react";

const description =
  "Un instrumento web de UnderTango Club: nueve faders, s�ntesis en tiempo real, secuencias y visuales generativos para 860 Multiversos.";

export const metadata: Metadata = {
  title: "860 Multiversos | UnderTango Club",
  description,
  alternates: {
    canonical: "/860-multiversos",
  },
  openGraph: {
    title: "860 Multiversos | UnderTango Club",
    description,
    url: "https://www.undertangoclub.com/860-multiversos",
    siteName: "� UnderTango Club",
    locale: "es_AR",
    type: "website",
  },
};

export default function MultiversosLayout({ children }: { children: ReactNode }) {
  return children;
}
