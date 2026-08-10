"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./tango-rave.module.css";

type Section = {
  title: string;
  body: string;
};

type Slide = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  chords?: string[];
  sections?: Section[];
  transition?: string;
  status?: "listo" | "en-trabajo" | "por-definir";
};

const slides: Slide[] = [
  {
    eyebrow: "0 · CHECK-IN / ENTRADA",
    title: "LUV(SIC) PT. 3",
    subtitle: "Chequeo instrumental · entrar de a poco, sin que el público perciba un comienzo forzado.",
    status: "listo",
    chords: [
      "Fm7 → Fm9",
      "Bbm7 → Bbm9",
      "Eb7sus4 → Eb7",
      "Ab7sus4 → AbM → Gm7",
    ],
    sections: [
      { title: "Intro / check-in", body: "Instrumentos entrando gradualmente. Volúmenes bajos. Armar clima." },
      { title: "Desarrollo", body: "Sostener el loop y probar balance, coordinación y sonido general." },
      { title: "Chequeo completo", body: "Todos sonando. Ajuste fino de mezcla, energía y comunicación." },
      { title: "Transición", body: "Cuando todo está listo, pasar sin corte al siguiente bloque." },
    ],
    transition: "→ Iguazú Zona Cero",
  },
  {
    eyebrow: "1 · APERTURA",
    title: "Iguazú Zona Cero",
    subtitle: "Primer bloque formal del show. La apertura debe sentirse como continuación natural del check-in.",
    status: "en-trabajo",
    sections: [
      { title: "Función", body: "Abrir el universo Tango Rave y establecer la banda completa." },
      { title: "Clave", body: "Evitar sensación de 'ahora empieza el show': continuidad, escucha y crecimiento orgánico." },
    ],
    transition: "→ La Cumparsita",
  },
  {
    eyebrow: "2 · CORPUS DE TANGOS",
    title: "La Cumparsita",
    status: "en-trabajo",
    sections: [
      { title: "Función", body: "Entrada al cuerpo de tangos. Mantener claridad de pulso y lenguaje colectivo." },
      { title: "Arreglo", body: "Detalle armónico y cortes: a completar con la versión definitiva del ensayo." },
    ],
    transition: "→ Libertango",
  },
  {
    eyebrow: "3 · CORPUS DE TANGOS",
    title: "Libertango",
    status: "en-trabajo",
    sections: [
      { title: "Función", body: "Sostener el impulso del bloque y preparar la llegada a Por una cabeza." },
      { title: "Arreglo", body: "Detalle armónico, dinámica y señales: a completar." },
    ],
    transition: "→ Por una cabeza",
  },
  {
    eyebrow: "4 · CORPUS DE TANGOS",
    title: "Por una cabeza",
    status: "en-trabajo",
    sections: [
      { title: "Retomada", body: "Desde Por una cabeza retomamos Quinto Primero + La Cumparsita." },
      { title: "Cierre", body: "Cierre en La menor con Sol sostenido (7ª mayor), según el borrador comunicado." },
    ],
    transition: "→ Crescendo / conexión hacia El Choclo",
  },
  {
    eyebrow: "5 · CRESCENDO",
    title: "Crescendo → El Choclo",
    status: "en-trabajo",
    sections: [
      { title: "Objetivo", body: "Convertir el cierre del corpus de tangos en un crecimiento continuo." },
      { title: "Conexión", body: "El borrador marca una conexión intermedia ('Kilimino'?) antes de El Choclo. Confirmar nombre y material musical." },
    ],
    transition: "→ El Choclo / bloque electrónico",
  },
  {
    eyebrow: "6 · BLOQUE ELECTRÓNICO",
    title: "El Choclo",
    status: "en-trabajo",
    sections: [
      { title: "Función", body: "Bisagra: el tango empieza a convertirse definitivamente en electrónica." },
      { title: "Producción", body: "Cues, loops, efectos DJ y duración extendida: en preparación." },
    ],
    transition: "→ Children",
  },
  {
    eyebrow: "7 · BLOQUE ELECTRÓNICO",
    title: "Children",
    status: "en-trabajo",
    sections: [
      { title: "Función", body: "Abrir espacio electrónico reconocible y sostener crecimiento de energía." },
      { title: "Arreglo", body: "Entradas de banda, cortes y transición: a completar." },
    ],
    transition: "→ Tche Tcherere",
  },
  {
    eyebrow: "8 · BLOQUE ELECTRÓNICO",
    title: "Tche Tcherere",
    status: "en-trabajo",
    sections: [
      { title: "Función", body: "Subir accesibilidad y participación del público." },
      { title: "Arreglo", body: "Definir forma final y cue de salida." },
    ],
    transition: "→ Soda Stereo",
  },
  {
    eyebrow: "9 · BLOQUE ELECTRÓNICO",
    title: "Soda Stereo",
    status: "en-trabajo",
    sections: [
      { title: "Función", body: "Continuar el bloque popular/electrónico con identidad argentina." },
      { title: "Arreglo", body: "Tema exacto, armonía y forma definitiva: a completar." },
    ],
    transition: "→ Despacito",
  },
  {
    eyebrow: "10 · BLOQUE ELECTRÓNICO",
    title: "Despacito",
    status: "en-trabajo",
    sections: [
      { title: "Función", body: "Mantener al público adentro del show y preparar el tramo final." },
      { title: "Arreglo", body: "Forma, cortes y duración: a completar." },
    ],
    transition: "→ Prayer",
  },
  {
    eyebrow: "11 · BLOQUE ELECTRÓNICO",
    title: "Prayer",
    status: "por-definir",
    sections: [
      { title: "Función", body: "Parte del borrador de cierre electrónico compartido con músicos." },
      { title: "Final", body: "El tramo posterior está abierto: incorporar las decisiones nuevas del ensayo y la dramaturgia final de la rave." },
    ],
    transition: "→ Final Tango Rave · en construcción",
  },
];

export default function TangoRaveGuide() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const slide = slides[index];
  const progress = useMemo(() => ((index + 1) / slides.length) * 100, [index]);

  const previous = () => setIndex((current) => Math.max(0, current - 1));
  const next = () => setIndex((current) => Math.min(slides.length - 1, current + 1));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    const deltaY = event.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) next();
      if (deltaX > 0) previous();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <main className={styles.shell} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>Ø UNDERTANGO</div>
          <div className={styles.event}>TANGO RAVE · 29/08 · BERNARDO DE IRIGOYEN</div>
        </div>
        <div className={styles.counter}>{index + 1}/{slides.length}</div>
      </header>

      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>

      <article className={styles.card} key={index}>
        <div className={styles.eyebrow}>{slide.eyebrow}</div>
        <div className={styles.titleRow}>
          <h1>{slide.title}</h1>
          {slide.status && <span className={`${styles.status} ${styles[slide.status]}`}>{slide.status.replace("-", " ")}</span>}
        </div>

        {slide.subtitle && <p className={styles.subtitle}>{slide.subtitle}</p>}

        {slide.chords && (
          <section className={styles.block}>
            <h2>Progresión armónica</h2>
            <div className={styles.chordGrid}>
              {slide.chords.map((chord, i) => (
                <div className={styles.chord} key={chord}>
                  <span>Compás {i + 1}</span>
                  <strong>{chord}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {slide.sections?.map((section) => (
          <section className={styles.block} key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        {slide.transition && (
          <div className={styles.transition}>
            <span>TRANSICIÓN</span>
            <strong>{slide.transition}</strong>
          </div>
        )}
      </article>

      <nav className={styles.nav} aria-label="Navegación del repertorio">
        <button onClick={previous} disabled={index === 0} aria-label="Tema anterior">←</button>
        <div className={styles.swipeHint}>deslizá para pasar</div>
        <button onClick={next} disabled={index === slides.length - 1} aria-label="Tema siguiente">→</button>
      </nav>
    </main>
  );
}
