"use client";

import { useMemo, useRef, useState } from "react";
import { countText } from "./count-text";
import styles from "../academia.module.css";

const format = new Intl.NumberFormat("es-AR");

export default function WordCounter() {
  const [text, setText] = useState("");
  const [clearedText, setClearedText] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const counts = useMemo(() => countText(text), [text]);

  function clear() {
    setClearedText(text);
    setText("");
    inputRef.current?.focus();
  }

  return (
    <div className={styles.counter}>
      <div className={styles.editor}>
        <div className={styles.editorHeader}><label htmlFor="counter-text">Tu texto</label><span>Sin registro · Gratis</span></div>
        <textarea id="counter-text" ref={inputRef} value={text} onChange={(event) => { setText(event.target.value); setClearedText(null); }} placeholder="Escribí o pegá tu texto acá…" aria-describedby="counter-privacy counter-rules" spellCheck={false} />
        <div className={styles.editorActions}><p id="counter-privacy">Tu texto se queda en este navegador. No se guarda al salir.</p><div>{clearedText !== null && <button type="button" onClick={() => { setText(clearedText); setClearedText(null); inputRef.current?.focus(); }}>Deshacer</button>}<button type="button" disabled={!text} onClick={clear}>Limpiar texto</button></div></div>
      </div>
      <div className={styles.stats} role="status" aria-live="polite" aria-atomic="true">
        <div className={styles.mainStat}><strong>{format.format(counts.words)}</strong><span>{counts.words === 1 ? "palabra" : "palabras"}</span></div>
        <div><strong>{format.format(counts.characters)}</strong><span>Caracteres</span></div>
        <div><strong>{format.format(counts.withoutSpaces)}</strong><span>Sin espacios</span></div>
      </div>
      <p id="counter-rules" className={styles.countRules}>Contamos grupos de letras o números. Los signos y emojis sueltos no suman palabras. Los caracteres incluyen signos, emojis, espacios y saltos de línea; “sin espacios” excluye también tabulaciones y saltos de línea.</p>
    </div>
  );
}
