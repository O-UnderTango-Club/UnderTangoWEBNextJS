import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Funcionamiento del FDG | UnderTango",
  robots: { index: false, follow: false },
};

export default function FondoPage() {
  return <main aria-label="Funcionamiento del FDG" style={{ minHeight: "100vh", background: "#f2efe7" }} />;
}
