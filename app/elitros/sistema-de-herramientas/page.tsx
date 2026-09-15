import type { Metadata } from "next";
import ToolNetwork from "./ToolNetwork";

export const metadata: Metadata = {
  title: "Sistema de herramientas | UnderTango",
  description: "Explorá en 3D cómo UnderTango conecta personas, protocolos, inteligencia artificial, datos y herramientas de trabajo.",
  alternates: { canonical: "https://elitros.undertangoclub.com/elitros/sistema-de-herramientas" },
};

export default function HerramientasPage() {
  return <ToolNetwork />;
}
