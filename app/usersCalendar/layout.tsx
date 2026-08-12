import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agenda pública | Ø UnderTango Club",
  description: "Calendario oficial de Ø UnderTango Club sincronizado con Google Calendar.",
};

export default function UsersCalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
