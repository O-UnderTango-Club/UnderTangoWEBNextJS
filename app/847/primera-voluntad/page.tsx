import type { Metadata } from "next";
import Image from "next/image";
import styles from "../web847.module.css";

const flyer = "/847/primera-voluntad.svg";
const description = "Ø Primera voluntad. Performance audiovisual generativa de Pablo Cieslik en Multiversos, el miércoles 2 de diciembre de 2026 en La Cabaña de los Muñecos, Puerto Iguazú.";
export const metadata: Metadata = {
  title: "Ø Primera voluntad · Multiversos 2026 | UnderTango",
  description,
  alternates: { canonical: "/847/primera-voluntad" },
  openGraph: { title: "Ø Primera voluntad · 2 de diciembre en Puerto Iguazú", description, url: "/847/primera-voluntad", type: "website" },
};
export default function PrimeraVoluntad() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.campaign}>
          <header className={styles.hero}>
            <p className={styles.kicker}>Multiversos 2026 · Puerto Iguazú</p>
            <h1>Ø Primera voluntad</h1>
            <p>Una performance audiovisual en la que el piano, la electrónica y la imagen se transforman en vivo. Cuando cambia una frecuencia, también cambia lo que ves.</p>
            <p className={styles.date}><time dateTime="2026-12-02">Miércoles 2 de diciembre de 2026</time><br />La Cabaña de los Muñecos · Puerto Iguazú</p>
            <p>Pablo Cieslik · Ø UnderTango Club</p>
            <p><a className={styles.button} href="/847/primera-voluntad/experiencia.html">Vivir la experiencia «Un Ø aparece» →</a></p>
            <a className={styles.button} href="https://www.instagram.com/multiversos.festival/">Consultar las novedades del festival →</a>
          </header>
          <Image className={styles.flyer} src={flyer} width={720} height={900} unoptimized priority alt="Afiche de Ø Primera voluntad, Pablo Cieslik y Ø UnderTango Club, 2 de diciembre en La Cabaña de los Muñecos." />
        </div>
      </div>
    </main>
  );
}