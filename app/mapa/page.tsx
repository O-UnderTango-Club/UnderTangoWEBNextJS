import type { Metadata } from "next";
import ProjectMap from "./ProjectMap";

const title = "Mapa de proyectos y equipo 80 | UnderTango";
const description = "Dónde estamos y qué estamos preparando. Proyectos y artistas en la Triple Frontera, y el equipo 80 en CABA, Córdoba y Posadas.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "https://www.undertangoclub.com/mapa" },
  openGraph: { title, description, url: "https://www.undertangoclub.com/mapa", siteName: "UnderTango", type: "website", locale: "es_AR" },
  twitter: { card: "summary", title, description },
};

export default function MapPage() { return <ProjectMap />; }
