import type { Metadata } from "next";
import PawnRoute from "./PawnRoute";

export const metadata: Metadata = {
  title: "867 · El camino del peón",
  description: "De Iguazú a Europa: el camino del peón para llevar una performance de electrónica en vivo de UnderTango al otro lado del mapa.",
  alternates: { canonical: "/867" },
  openGraph: { title: "867 · El camino del peón", description: "El camino de Multiversos, de Iguazú a Europa y más allá del tablero.", url: "/867", type: "website" },
};

export default function ElCaminoDelPeon() {
  return <PawnRoute />;
}
