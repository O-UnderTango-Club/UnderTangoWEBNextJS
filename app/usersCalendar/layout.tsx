import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agenda pública | Ø UnderTango Club",
  description: "Fechas y flyers de las presentaciones abiertas al público de Ø UnderTango Club.",
};

export default function UsersCalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
