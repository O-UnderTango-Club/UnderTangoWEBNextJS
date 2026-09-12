import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema de herramientas | UnderTango",
  robots: { index: false, follow: false },
};

export default function HerramientasPage() {
  return <main aria-label="Sistema de herramientas" style={{ minHeight: "100vh", background: "#f2efe7" }} />;
}
