"use client";

import { useEffect, useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./artistas.module.css";

type Artist = {
  id: string;
  name: string;
  role: string;
  locality?: string;
  skills: string[];
};

type Payload = {
  artists: Artist[];
  source: "airtable" | "snapshot";
  live: boolean;
  updatedAt: string;
};

function publicDescription(artist: Artist) {
  if (artist.name === "Pablo Cieslik") {
    return "Fundador y director de Ø UnderTango Club. Productor, pianista, performer y docente, con trabajo en tango tradicional, tango electrónico y producción escénica.";
  }

  if (artist.role === "Docente") {
    return `Bailarina y docente vinculada al trabajo artístico de Ø UnderTango, con experiencia en ${artist.skills.filter((skill) => skill !== "Docencia").join(" y ").toLowerCase() || "tango"}.`;
  }

  const danceSkills = artist.skills.join(" y ").toLowerCase();
  return `Artista vinculada al equipo escénico de Ø UnderTango${danceSkills ? `, con trabajo en ${danceSkills}` : ""}.`;
}

export default function ArtistasPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/artistas", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setPayload)
      .catch(() => setError("No pude cargar el equipo artístico."));
  }, []);

  return (
    <div className={styles.shell}>
      <Header />

      <main className={styles.main}>
        <div className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Ø UnderTango · equipo actual</p>
            <h1 className={styles.title}>Artistas</h1>
            <p className={styles.subtitle}>
              Personas que hoy forman parte del mapa artístico y escénico de Ø UnderTango. Esta vista toma como referencia la tabla Equipo de Airtable y evita mostrar perfiles históricos que ya no representan la operación actual.
            </p>
          </div>

          <div className={styles.source}>
            <span className={payload?.live ? styles.dot : styles.snapshotDot} />
            {payload?.live ? "Airtable en vivo" : "Airtable · foto actual"}
          </div>
        </div>

        <div className={styles.grid}>
          {!payload && !error && <div className={styles.loading}>Cargando artistas…</div>}
          {error && <div className={styles.empty}>{error}</div>}

          {payload?.artists.map((artist) => (
            <article key={artist.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.name}>{artist.name}</h2>
                  {artist.locality && <p className={styles.locality}>{artist.locality}</p>}
                </div>
                <span className={styles.role}>{artist.role}</span>
              </div>

              <div className={styles.skills}>
                {artist.skills.map((skill) => (
                  <span key={skill} className={styles.skill}>{skill}</span>
                ))}
              </div>

              <p className={styles.description}>{publicDescription(artist)}</p>
            </article>
          ))}
        </div>

        <p className={styles.note}>
          La página pública sólo usa nombre, rol, localidad y habilidades. Las notas internas de disponibilidad, evaluaciones y coordinación permanecen dentro de Airtable y no se publican.
        </p>
      </main>

      <Footer />
    </div>
  );
}
