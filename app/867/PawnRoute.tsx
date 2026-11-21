"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

const steps = [
  { id: "e1", code: "E1", name: "La llamada", place: "Iguazú · Punto de partida", description: "Encontrar el corazón de Multiversos: qué le pasa al público cuando la música electrónica en vivo, la imagen y la escena empiezan a hablar entre sí.", proof: "Una idea clara, un arco y una primera versión que se pueda ensayar." },
  { id: "e2", code: "E2", name: "El ensayo con cámara", place: "Iguazú · Ensayo con cámara", description: "Probar el comienzo, las transiciones y el final frente a una cámara. Ver qué se entiende y qué se pierde cuando la obra pasa a pantalla.", proof: "Una toma de prueba y una lista breve de ajustes para Posadas." },
  { id: "e3", code: "E3", name: "El registro principal", place: "Posadas · Registro principal", description: "Capturar un recorrido completo de la obra, con sonido e imagen que dejen sentir lo que pasa en escena.", proof: "Un registro legible y un fragmento que muestre por qué vale la pena verla en vivo." },
  { id: "e4", code: "E4", name: "La obra viaja en un enlace", place: "Video · Dossier", description: "Hacer que alguien que nunca vio Multiversos pueda entender la propuesta, imaginarla en su sala y saber qué hace falta para montarla.", proof: "Un video, una presentación breve y una ficha técnica." },
  { id: "e5", code: "E5", name: "Aliados en la frontera", place: "Triple Frontera · Primera prueba", description: "Llevar la pieza a otro espacio cercano. Probar cómo cambia cuando entran un público y una sala distintos.", proof: "Una función piloto, una devolución del espacio y aprendizajes de montaje." },
  { id: "e6", code: "E6", name: "El circuito regional", place: "Argentina · Brasil · Paraguay", description: "Encontrar un formato que se pueda montar en más de un lugar, sin perder la intensidad ni la identidad de la obra.", proof: "Una versión portátil que funcione en otra sala y deje referencias para la próxima." },
  { id: "e7", code: "E7", name: "El puente", place: "Europa · Ruta por construir", description: "Buscar salas y festivales afines, y unir fechas que tengan sentido artístico y logístico.", proof: "Interés concreto de un espacio y un itinerario viable." },
  { id: "e8", code: "E8", name: "La primera función", place: "Europa · Meta", description: "Llegar al otro lado con la obra completa: tocar, encontrarse con otro público y dejar material para el próximo movimiento.", proof: "Una primera función realizada y una referencia para seguir circulando." },
  { id: "e9", code: "E9", name: "Más allá del tablero", place: "Multiverso · Trascendencia", description: "El peón cruza el borde del tablero. Multiversos se abre a otras dimensiones: el sonido, la imagen y la escena pueden volver a encontrarse en formas que este recorrido todavía no alcanza a dibujar." },
] as const;

const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const beyond = steps[steps.length - 1];

type Step = (typeof steps)[number];
type StepId = Step["id"];

function Pawn() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" fill="currentColor">
      <circle cx="20" cy="11.5" r="5.3" />
      <path d="M17 17h6c0 5 1.8 8 5 11H12c3.2-3 5-6 5-11Zm-6 13h18l2 5H9l2-5Z" />
    </svg>
  );
}

export default function PawnRoute() {
  const [selectedId, setSelectedId] = useState<StepId>("e1");

  useEffect(() => {
    function syncSelection() {
      const hash = window.location.hash.slice(1).toLowerCase();
      setSelectedId(steps.find((step) => step.id === hash)?.id ?? "e1");
    }

    syncSelection();
    window.addEventListener("hashchange", syncSelection);
    window.addEventListener("popstate", syncSelection);
    return () => {
      window.removeEventListener("hashchange", syncSelection);
      window.removeEventListener("popstate", syncSelection);
    };
  }, []);

  function selectStage(event: MouseEvent<HTMLAnchorElement>, id: StepId) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    const hash = "#" + id;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setSelectedId(id);
  }

  const stageIndex = steps.findIndex((step) => step.id === selectedId);
  const stage = steps[stageIndex];
  const previous = steps[stageIndex - 1];
  const next = steps[stageIndex + 1];

  function squareLink(step: Step, className: string, axes?: ReactNode) {
    const active = step.id === selectedId;
    return (
      <a
        key={step.code}
        className={className + " is-stop" + (active ? " is-current" : "")}
        href={"#" + step.id}
        aria-label={step.code + ": " + step.name}
        aria-current={active ? "step" : undefined}
        onClick={(event) => selectStage(event, step.id)}
      >
        {axes}
        {active && <Pawn />}
        <span className="peon867-square-label" aria-hidden="true">{step.code}</span>
      </a>
    );
  }

  return (
    <div className="peon867" role="region" aria-labelledby="peon867-title">
      <style>{styles}</style>
      <div className="peon867-wrap">
        <div className="peon867-top"><Link href="/">Ø UNDERTANGO CLUB</Link><span>IGUAZÚ <span aria-hidden="true">↗</span> EUROPA</span></div>
        <header className="peon867-intro">
          <p className="peon867-index"><span>867</span> <span>UNA RUTA PARA MULTIVERSOS</span></p>
          <h1 id="peon867-title">El camino del <em>peón</em><span aria-hidden="true">.</span></h1>
          <p className="peon867-lead">Una performance de electrónica en vivo, visuales y escena. Empieza en Iguazú y se abre paso, casilla a casilla, hacia Europa.</p>
        </header>
        <div className="peon867-hero">
          <figure className="peon867-figure peon867-frame">
            <div className="peon867-frame-top">FIG. 01 / EL TABLERO</div>
            <div role="group" aria-label="Tablero de la ruta. Elegí una casilla para leer su etapa.">
              <div className="peon867-beyond">
                {squareLink(beyond, "peon867-cell is-beyond")}
              </div>
              <div className="peon867-grid">
                {ranks.flatMap((rank, row) => letters.map((letter, col) => {
                  const code = letter + rank;
                  const dark = (row + col) % 2 !== 0;
                  const step = steps.find((item) => item.code === code);
                  const className = "peon867-cell " + (dark ? "is-dark" : "is-light");
                  const axes = <>
                    {col === 0 && <span className="peon867-rank" aria-hidden="true">{rank}</span>}
                    {rank === 1 && <span className="peon867-file" aria-hidden="true">{letter}</span>}
                  </>;
                  return step
                    ? squareLink(step, className, axes)
                    : <span key={code} className={className} aria-hidden="true">{axes}</span>;
                }))}
              </div>
            </div>
            <figcaption><span><i aria-hidden="true" /> E1 · Punto de partida</span><span>Elegí una casilla</span></figcaption>
          </figure>
          <section className="peon867-stage" aria-label="Etapa seleccionada">
            <div className="peon867-stage-copy" aria-live="polite" aria-atomic="true">
              <p className="peon867-coordinate">{stage.code}</p>
              <p className="peon867-meta">{stage.place}</p>
              <h2>{stage.name}</h2>
              <p>{stage.description}</p>
              {"proof" in stage && <p className="peon867-proof"><b>La prueba:</b> {stage.proof}</p>}
            </div>
            <nav className="peon867-stage-nav" aria-label="Recorrer las etapas">
              <div>{previous && <a href={"#" + previous.id} onClick={(event) => selectStage(event, previous.id)}><span aria-hidden="true">←</span> {previous.code}</a>}</div>
              <div>{next && <a href={"#" + next.id} onClick={(event) => selectStage(event, next.id)}>{next.code} <span aria-hidden="true">→</span></a>}</div>
            </nav>
          </section>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .peon867{--ink:#181412;--paper:#f7ead5;--muted:#cfbfae;--amber:#f1b971;--line:#574438;--jewel:#ba9bc1;background:radial-gradient(ellipse at 70% 5%,#332321 0%,transparent 45%),#181412;color:var(--paper);font-family:var(--font-undertango-sans,system-ui),system-ui,sans-serif;line-height:1.55;width:100%}
  .peon867 *{box-sizing:border-box}
  .peon867-wrap{max-width:1240px;margin:auto;padding:clamp(16px,3vw,40px)}
  .peon867-top,.peon867-frame-top,.peon867-figure figcaption{display:flex;justify-content:space-between;gap:12px;align-items:center}
  .peon867-top{border-block:1px solid var(--line);padding:12px 0;color:var(--muted);font-weight:700}
  .peon867-top a{color:inherit;text-decoration:none}
  .peon867-top a:hover{text-decoration:underline;text-underline-offset:4px}
  .peon867-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(20px,4vw,56px);align-items:start;max-width:940px;margin:auto}
  .peon867-index{display:flex;align-items:center;gap:14px;font-weight:700;margin:0 0 10px;color:var(--amber)}
  .peon867-index span:first-child{border:1px solid #8d674d;padding:5px 10px;font-size:1rem}
  .peon867 h1,.peon867 h2,.peon867 h3{color:var(--paper);font-family:var(--font-undertango-editorial,Georgia),Georgia,serif;font-weight:400}
  .peon867 h1{font-size:clamp(2.4rem,5.6vw,4.8rem);line-height:.9;letter-spacing:-.075em;margin:0}
  .peon867 h2:before,.peon867 h2:after{content:none;display:none}
  .peon867 h1 em{color:var(--amber);font-weight:400}
  .peon867 h1 span{color:var(--jewel)}
  .peon867-lead{font-size:clamp(1rem,1.65vw,1.33rem);color:var(--muted);max-width:62ch;margin:12px 0 0}
  .peon867 a:focus-visible{outline:3px solid #fff4dc;outline-offset:4px}
  .peon867-figure{margin:0;min-width:0}
  .peon867-frame{padding:clamp(8px,1.45vw,17px);border:1px solid #9b6f4e;background:linear-gradient(130deg,#69452f,#2e2019 70%);box-shadow:0 22px 56px #0009;scroll-margin-top:96px}
  .peon867-frame-top{font-size:clamp(.56rem,1.14vw,.75rem);padding:0 2px 6px;color:#ffead0;font-weight:700}
  .peon867-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));grid-template-rows:repeat(8,minmax(0,1fr));aspect-ratio:1;border:1px solid #ab7d5c}
  .peon867-cell{position:relative;display:grid;place-items:center;min-width:0;min-height:0;line-height:1}
  .peon867-cell.is-light{background:#9a6a4a;color:#211711}
  .peon867-cell.is-dark{background:#50372d;color:#fff2dd}
  .peon867-cell.is-stop{isolation:isolate;background:#342623;color:#fff0d9;box-shadow:inset 0 0 0 1px #dda36c;text-decoration:none}
  .peon867-cell.is-stop:hover,.peon867-cell.is-stop:focus-visible{background:#794a35;z-index:2}
  .peon867-cell.is-current,.peon867-cell.is-current:hover{background:#f1b873;color:#261a13}
  .peon867-cell svg{width:62%;height:62%;position:absolute;top:10%;left:19%}
  .peon867-square-label,.peon867-rank,.peon867-file{font-family:ui-monospace,monospace;font-size:clamp(.56rem,1.2vw,.84rem);font-weight:800}
  .peon867-square-label{background:inherit;padding:2px 3px}
  .peon867-rank,.peon867-file{position:absolute;opacity:.88}
  .peon867-rank{top:4px;left:4px}
  .peon867-file{bottom:4px;left:4px}
  .peon867-cell.is-current .peon867-file{display:none}
  .peon867-figure figcaption{padding:10px 2px 0;color:#ffead0;font-size:clamp(.65rem,1.2vw,.8rem)}
  .peon867-figure figcaption i{display:inline-block;width:8px;height:8px;margin-right:4px;border-radius:50%;background:var(--amber)}
  .peon867 h2{font-size:clamp(2.5rem,5vw,4.5rem);line-height:1.05;letter-spacing:-.045em;margin:0 0 24px}
  .peon867 .peon867-proof b{color:var(--paper)}
  .peon867-intro{max-width:940px;margin:20px auto 22px}
  .peon867-meta,.peon867-index,.peon867-coordinate{font-family:ui-monospace,monospace;letter-spacing:.12em}
  .peon867-index,.peon867-meta{font-size:.75rem}
  .peon867-beyond{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));margin:0 1px}
  .peon867-cell.is-beyond{grid-column:5;aspect-ratio:1.6;background:#5f405d;color:#ffecf6;box-shadow:inset 0 0 0 1px #dbb6dd}
  .peon867-cell.is-current.is-beyond{background:#e1bee5;color:#2c1632}
  .peon867-cell.is-current .peon867-square-label{position:absolute;bottom:7%;right:4%}
  .peon867-stage{display:flex;flex-direction:column;justify-content:space-between;min-width:0;min-height:340px;padding:clamp(18px,3vw,34px);border:1px solid var(--line);background:linear-gradient(135deg,#352621,#211917 75%)}
  .peon867-stage-copy p{margin:0 0 14px;color:var(--muted)}
  .peon867-stage-copy .peon867-coordinate{font-size:clamp(1.8rem,4vw,3rem);line-height:1;color:var(--amber);margin-bottom:12px}
  .peon867-stage-copy .peon867-meta{color:var(--amber);font-weight:700;margin-bottom:6px}
  .peon867-stage h2{font-size:clamp(1.8rem,3.1vw,2.7rem);line-height:1.05;margin:0 0 12px}
  .peon867-stage-nav{display:flex;justify-content:space-between;border-top:1px solid var(--line);margin-top:14px}
  .peon867-stage-nav a{display:inline-flex;gap:.6rem;align-items:center;min-height:44px;color:var(--paper);text-underline-offset:4px}
  @media(max-width:720px){
    .peon867-hero{grid-template-columns:minmax(0,1fr);max-width:520px}
    .peon867-intro{max-width:520px}
    .peon867-stage{min-height:0}
    .peon867-square-label,.peon867-rank,.peon867-file{font-size:clamp(.59rem,2vw,.8rem)}
  }
  @media(max-width:430px){.peon867-top{font-size:.63rem}.peon867-index{gap:10px}}
`;
