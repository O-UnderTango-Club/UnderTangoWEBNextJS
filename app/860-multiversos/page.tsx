"use client";

import dynamic from "next/dynamic";

const Partitura = dynamic(() => import("./partitura"), { ssr: false });

export default function Multiversos860Page() {
  return <Partitura />;
}
