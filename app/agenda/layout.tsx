import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agenda pública | Ø UnderTango Club",
  description: "Agenda oficial de Ø UnderTango Club sincronizada con Google Calendar.",
};

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
