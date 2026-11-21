"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

const steps = [
  {
    id: "e1",
    code: "E1",
    name: "Página 860",
    place: "Punto de partida",
    description: "La página 860 de Multiversos es lo que nos permite salir adelante y lo que protegemos desde el inicio.",
    record: { title: "860 · Multiversos", href: "/860-multiversos" },
  },
  {
    id: "e2",
    code: "E2",
    name: "Primera ejecución en vivo",
    place: "Puerto Iguazú · 2 de diciembre de 2026",
  },
  {
    id: "e3",
    code: "E3",
    name: "Presentación en Posadas",
    place: "Posadas · 12 de diciembre de 2026",
  },
  {
    id: "e4",
    code: "E4",
    name: "Primera presentación independiente",
    place: "Sede por definir",
    description: "La primera presentación independiente de Multiversos podría realizarse en Foz de Iguazú o en Ciudad del Este.",
  },
  {
    id: "e5",
    code: "E5",
    name: "Buenos Aires",
    place: "Argentina",
  },
  {
    id: "e6",
    code: "E6",
    name: "Gran Bretaña",
    place: "Europa",
  },
  {
    id: "e7",
    code: "E7",
    name: "Polonia",
    place: "Europa",
  },
  {
    id: "e8",
    code: "E8",
    name: "Hacerse conocido",
    place: "Reconocimiento",
    description: "Que Multiversos empiece a ser conocido más allá de los lugares donde se presentó.",
  },
  {
    id: "e9",
    code: "E9",
    name: "Más allá del tablero",
    place: "Multiverso · Trascendencia",
    description: "El recorrido se abre a otras dimensiones, más allá del tablero.",
  },
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
        className={className + " is-stop" + (active ? " is-current" : "") + (step.id === "e1" ? " is-origin" : "")}
        href={"#" + step.id}
        aria-label={step.code + ": " + step.name + (step.id === "e1" ? ", conjunto vacío" : "")}
        aria-current={active ? "step" : undefined}
        onClick={(event) => selectStage(event, step.id)}
      >
        {axes}
        {step.id === "e1" ? <span className="peon867-empty" aria-hidden="true">∅</span> : active && <Pawn />}
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
          <p className="peon867-lead">El recorrido de Multiversos desde la página 860, con un registro de lo que pasó en cada etapa.</p>
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
          <div className="peon867-stage" role="region" aria-label="Etapa seleccionada">
            <div className="peon867-stage-copy" aria-live="polite" aria-atomic="true">
              <p className="peon867-coordinate">{stage.code}</p>
              <p className="peon867-meta">{stage.place}</p>
              <h2>{stage.name}</h2>
              {"description" in stage && <p>{stage.description}</p>}
              <div className="peon867-record">
                <h3>{"record" in stage ? "Primer registro" : "Registro de la etapa"}</h3>
                {"record" in stage
                  ? <Link href={stage.record.href}>{stage.record.title} <span aria-hidden="true">↗</span></Link>
                  : <p>Pendiente de registro.</p>}
              </div>
            </div>
            <nav className="peon867-stage-nav" aria-label="Recorrer las etapas">
              <div>{previous && <a href={"#" + previous.id} onClick={(event) => selectStage(event, previous.id)}><span aria-hidden="true">←</span> {previous.code}</a>}</div>
              <div>{next && <a href={"#" + next.id} onClick={(event) => selectStage(event, next.id)}>{next.code} <span aria-hidden="true">→</span></a>}</div>
            </nav>
          </div>
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
  .peon867-intro{max-width:940px;margin:20px auto 22px}
  .peon867-meta,.peon867-index,.peon867-coordinate{font-family:ui-monospace,monospace;letter-spacing:.12em}
  .peon867-index,.peon867-meta{font-size:.75rem}
  .peon867-beyond{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));margin:0 1px}
  .peon867-cell.is-beyond{
    grid-column:5;
    aspect-ratio:1;
    margin-bottom:5px;
    border:2px dashed #a6e5ff;
    background:linear-gradient(145deg,#5d91b0 1%,#2d5577 26%,#a0d2e7 46%,#5292b4 50%,#204267 74%,#426b89 100%) padding-box;
    color:#fff;
    box-shadow:inset 0 0 8px #b5ecff75;
  }
  .peon867-cell.is-beyond .peon867-square-label{background:#112c43;color:#f2fbff}
  .peon867-cell.is-beyond:hover,.peon867-cell.is-current.is-beyond{
    border-color:#e2f9ff;
    background:linear-gradient(145deg,#35688e 1%,#79adc6 28%,#def6ff 47%,#6eacce 51%,#2a547d 77%,#79a9c3 100%) padding-box;
    color:#102c47;
    box-shadow:0 0 12px #9bdfff8c,inset 0 0 8px #def6ff95;
  }
  .peon867-cell.is-current .peon867-square-label,.peon867-cell.is-origin .peon867-square-label{position:absolute;bottom:7%;right:4%}
  .peon867-empty{font-family:system-ui,sans-serif;font-size:clamp(.9rem,2.2vw,1.6rem);line-height:1;align-self:start;margin-top:10%}
  .peon867-stage{display:flex;flex-direction:column;justify-content:space-between;min-width:0;min-height:340px;padding:clamp(18px,3vw,34px);border:1px solid var(--line);background:linear-gradient(135deg,#352621,#211917 75%)}
  .peon867-stage-copy p{margin:0 0 14px;color:var(--muted)}
  .peon867-stage-copy .peon867-coordinate{font-size:clamp(1.8rem,4vw,3rem);line-height:1;color:var(--amber);margin-bottom:12px}
  .peon867-stage-copy .peon867-meta{color:var(--amber);font-weight:700;margin-bottom:6px}
  .peon867-stage h2{font-size:clamp(1.8rem,3.1vw,2.7rem);line-height:1.05;margin:0 0 12px}
  .peon867-record{border-top:1px solid var(--line);padding-top:12px;margin-top:16px}
  .peon867-record h3{font-family:inherit;font-size:.92rem;font-weight:700;margin:0 0 4px}
  .peon867-record a{color:var(--amber);text-underline-offset:4px}
  .peon867-record p{margin-bottom:0}
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
