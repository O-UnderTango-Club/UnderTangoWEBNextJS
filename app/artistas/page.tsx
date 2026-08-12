"use client";

import { useEffect, useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./artistas.module.css";

type Commitment = {
  id: string;
  name: string;
  date?: string;
  time?: string;
  place?: string;
  product?: string;
  status?: string;
};

type Artist = {
  id: string;
  name: string;
  role: string;
  locality?: string;
  skills: string[];
  availability?: string;
  commitments: Commitment[];
};

type Payload = {
  artists: Artist[];
  source: "airtable" | "snapshot";
  live: boolean;
  updatedAt: string;
};

function formatDate(value?: string) {
  if (!value) return "Fecha a confirmar";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function description(artist: Artist) {
  if (artist.name === "Pablo Cieslik") {
    return "Fundador y director de Ø UnderTango Club. Productor, pianista, performer y docente.";
  }
  if (artist.role === "Docente") return "Bailarina y docente vinculada al equipo artístico de Ø UnderTango.";
  return "Artista vinculada al equipo escénico de Ø UnderTango.";
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
            <p className={styles.eyebrow}>Ø UnderTango · panel operativo</p>
            <h1 className={styles.title}>Artistas</h1>
            <p className={styles.subtitle}>
              Fichas rápidas para saber quién está en el equipo, qué hace, qué fechas tiene comprometidas y qué bloqueos de disponibilidad hay que tener presentes.
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
                {artist.skills.map((skill) => <span key={skill} className={styles.skill}>{skill}</span>)}
              </div>

              <p className={styles.description}>{description(artist)}</p>

              <div className={styles.operationalBlock}>
                <p className={styles.blockLabel}>Disponibilidad</p>
                <p className={artist.availability ? styles.availabilityWarning : styles.availabilityOk}>
                  {artist.availability || "Sin bloqueos cargados · confirmar fecha antes de cerrar."}
                </p>
              </div>

              <div className={styles.operationalBlock}>
                <p className={styles.blockLabel}>Próximos compromisos</p>
                {artist.commitments.length ? (
                  <div className={styles.commitments}>
                    {artist.commitments.map((item) => (
                      <div key={item.id} className={styles.commitment}>
                        <strong>{formatDate(item.date)}{item.time ? ` · ${item.time}` : ""}</strong>
                        <span>{item.place || item.name}</span>
                        {item.product && <small>{item.product}</small>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noCommitments}>Sin compromisos futuros vinculados en Airtable.</p>
                )}
              </div>
            </article>
          ))}
        </div>

        <p className={styles.note}>
          Esta vista sólo expone información operativa segura. Evaluaciones personales, conversaciones internas y notas sensibles siguen dentro de Airtable.
        </p>
      </main>
      <Footer />
    </div>
  );
}
