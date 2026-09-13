import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservas | Ø UnderTango Club",
  alternates: { canonical: "https://www.undertangoclub.com/reservas" },
};

export default function ReservasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
