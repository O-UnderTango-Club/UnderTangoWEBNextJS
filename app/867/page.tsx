import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "867 · El camino del peón",
  description: "De Iguazú a Europa: ocho casillas para llevar una performance de electrónica en vivo de UnderTango al otro lado del mapa.",
  alternates: { canonical: "/867" },
  openGraph: { title: "867 · El camino del peón", description: "Una ruta de ocho casillas para Multiversos, de Iguazú a Europa.", url: "/867", type: "website" },
};

const steps = [
  { id: "e1", code: "E1", name: "La llamada", place: "Iguazú · Punto de partida", description: "Encontrar el corazón de Multiversos: qué le pasa al público cuando la música electrónica en vivo, la imagen y la escena empiezan a hablar entre sí.", proof: "Una idea clara, un arco y una primera versión que se pueda ensayar." },
  { id: "e2", code: "E2", name: "El ensayo con cámara", place: "Iguazú · Ensayo con cámara", description: "Probar el comienzo, las transiciones y el final frente a una cámara. Ver qué se entiende y qué se pierde cuando la obra pasa a pantalla.", proof: "Una toma de prueba y una lista breve de ajustes para Posadas." },
  { id: "e3", code: "E3", name: "El registro principal", place: "Posadas · Registro principal", description: "Capturar un recorrido completo de la obra, con sonido e imagen que dejen sentir lo que pasa en escena.", proof: "Un registro legible y un fragmento que muestre por qué vale la pena verla en vivo." },
  { id: "e4", code: "E4", name: "La obra viaja en un enlace", place: "Video · Dossier", description: "Hacer que alguien que nunca vio Multiversos pueda entender la propuesta, imaginarla en su sala y saber qué hace falta para montarla.", proof: "Un video, una presentación breve y una ficha técnica." },
  { id: "e5", code: "E5", name: "Aliados en la frontera", place: "Triple Frontera · Primera prueba", description: "Llevar la pieza a otro espacio cercano. Probar cómo cambia cuando entran un público y una sala distintos.", proof: "Una función piloto, una devolución del espacio y aprendizajes de montaje." },
  { id: "e6", code: "E6", name: "El circuito regional", place: "Argentina · Brasil · Paraguay", description: "Encontrar un formato que se pueda montar en más de un lugar, sin perder la intensidad ni la identidad de la obra.", proof: "Una versión portátil que funcione en otra sala y deje referencias para la próxima." },
  { id: "e7", code: "E7", name: "El puente", place: "Europa · Ruta por construir", description: "Buscar salas y festivales afines, y unir fechas que tengan sentido artístico y logístico.", proof: "Interés concreto de un espacio y un itinerario viable." },
  { id: "e8", code: "E8", name: "La primera función", place: "Europa · Meta", description: "Llegar al otro lado con la obra completa: tocar, encontrarse con otro público y dejar material para el próximo movimiento.", proof: "Una primera función realizada y una referencia para seguir circulando." },
  { id: "h8", code: "H8", name: "Reina", place: "Expansión", description: "La obra gana direcciones. Puede entrar a una sala, un festival o un laboratorio con formas distintas y seguir siendo reconocible.", proof: "Más de una manera de montar la pieza y un segundo circuito que la quiera recibir." },
  { id: "h9", code: "H9", name: "Rey", place: "Epílogo · Fuera del tablero", description: "La última casilla la inventamos. Se trata de elegir dónde, con quién y en qué condiciones hacer la próxima obra.", proof: "Una red que abre oportunidades en los dos sentidos y deja espacio para decidir." },
] as const;

const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

function Piece({ type }: { type: "pawn" | "queen" | "king" }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" fill="none">
      {type === "pawn" ? <><circle cx="20" cy="11.5" r="5.3" fill="currentColor" /><path d="M17 17h6c0 5 1.8 8 5 11H12c3.2-3 5-6 5-11Zm-6 13h18l2 5H9l2-5Z" fill="currentColor" /></>
        : type === "queen" ? <><path d="m8 12 7 7 5-10 5 10 7-7-4 16H12L8 12Zm4 18h16l2 5H10l2-5Z" fill="currentColor" /><circle cx="7.5" cy="10" r="2.1" fill="currentColor" /><circle cx="20" cy="6" r="2.1" fill="currentColor" /><circle cx="32.5" cy="10" r="2.1" fill="currentColor" /></>
        : <><path d="M20 3v11m-5-6h10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /><path d="M12 14c4-1 5 1 8 3 3-2 4-4 8-3 6 2 5 8-1 14H13c-6-6-7-12-1-14Zm0 16h16l2 5H10l2-5Z" fill="currentColor" /></>}
    </svg>
  );
}

export default function ElCaminoDelPeon() {
  return (
    <div className="peon867" role="region" aria-labelledby="peon867-title">
      <style>{styles}</style>
      <div className="peon867-wrap">
        <div className="peon867-top"><Link href="/">Ø UNDERTANGO CLUB</Link><span>IGUAZÚ <span aria-hidden="true">↗</span> EUROPA</span></div>
        <div className="peon867-hero">
          <header className="peon867-intro">
            <p className="peon867-index"><span>867</span> <span>UNA RUTA PARA MULTIVERSOS</span></p>
            <h1 id="peon867-title">El camino<br />del <em>peón</em><span aria-hidden="true">.</span></h1>
            <p className="peon867-lead">Una performance de electrónica en vivo, visuales y escena. Empieza en Iguazú y se abre paso, casilla a casilla, hacia Europa.</p>
            <a className="peon867-jump" href="#e1">La primera jugada <span aria-hidden="true">↓</span></a>
          </header>
          <figure id="peon867-board" className="peon867-figure peon867-frame">
              <div className="peon867-frame-top"><span>FIG. 01 / EL TABLERO</span><a href="#h9">H9 · Epílogo <span aria-hidden="true">↗</span></a></div>
              <div className="peon867-grid" role="group" aria-label="Tablero de la ruta: elegí una casilla para leer su etapa">
                {ranks.flatMap((rank, row) => letters.map((letter, col) => {
                  const code = letter + rank;
                  const dark = (row + col) % 2 !== 0;
                  const step = steps.find((item) => item.code === code);
                  const className = ["peon867-cell", dark ? "is-dark" : "is-light", step ? "is-stop" : "", letter === "E" && rank > 1 && rank < 8 ? "is-trail" : "", rank === 8 && (letter === "F" || letter === "G") ? "is-cross" : "", code === "E1" ? "is-current" : "", code === "H8" ? "is-queen" : ""].filter(Boolean).join(" ");
                  const axes = <>{col === 0 && <span className="peon867-rank" aria-hidden="true">{rank}</span>}{rank === 1 && <span className="peon867-file" aria-hidden="true">{letter}</span>}</>;
                  if (!step) return <span key={code} className={className} aria-hidden="true">{axes}</span>;
                  return <a key={code} className={className} href={"#" + step.id} aria-label={code + ": " + step.name + (code === "E1" ? ", etapa actual" : "")} aria-current={code === "E1" ? "step" : undefined}>{axes}<span className="peon867-square-label" aria-hidden="true">{code}</span>{(code === "E1" || code === "H8") && <Piece type={code === "E1" ? "pawn" : "queen"} />}</a>;
                }))}
              </div>
              <figcaption><span><i aria-hidden="true" /> E1 · Estamos acá</span><span>Tocá una casilla para recorrerla</span></figcaption>
          </figure>
        </div>
        <div className="peon867-route" role="region" aria-labelledby="peon867-route-title">
          <p className="peon867-kicker">DE LA PRIMERA IDEA A LA PRIMERA FUNCIÓN</p>
          <h2 id="peon867-route-title">Casilla por casilla</h2>
          <ol className="peon867-steps">
            {steps.slice(0, 8).map((step) => <li id={step.id} tabIndex={-1} key={step.id} className={step.id === "e1" ? "peon867-stage is-now" : "peon867-stage"}>
              <span className="peon867-coordinate">{step.code}</span>
              <div><p className="peon867-meta">{step.place}{step.id === "e1" && <span className="peon867-now">Ahora</span>}</p><h3>{step.name}</h3><p>{step.description}</p><p className="peon867-proof"><b>La prueba:</b> {step.proof}</p></div>
            </li>)}
          </ol>
          <div className="peon867-epilogue" aria-label="Después de E8">
            {steps.slice(8).map((step) => <article id={step.id} tabIndex={-1} key={step.id}>
              <Piece type={step.id === "h8" ? "queen" : "king"} /><p className="peon867-meta">{step.code} · {step.place}</p><h3>{step.name}</h3><p>{step.description}</p><p className="peon867-proof"><b>La prueba:</b> {step.proof}</p>
            </article>)}
          </div>
          <a className="peon867-jump peon867-back" href="#peon867-board">Volver al tablero <span aria-hidden="true">↑</span></a>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .peon867{--ink:#181412;--paper:#f7ead5;--muted:#cfbfae;--amber:#f1b971;--line:#574438;--jewel:#ba9bc1;background:radial-gradient(ellipse at 70% 5%,#332321 0%,transparent 45%),#181412;color:var(--paper);font-family:var(--font-undertango-sans,system-ui),system-ui,sans-serif;line-height:1.55;width:100%}
  .peon867 *{box-sizing:border-box}
  .peon867-wrap{max-width:1240px;margin:auto;padding:clamp(20px,5vw,72px)}
  .peon867-top,.peon867-frame-top,.peon867-figure figcaption{display:flex;justify-content:space-between;gap:12px;align-items:center}
  .peon867-top,.peon867-frame-top,.peon867-kicker,.peon867-index,.peon867-meta,.peon867-coordinate{font-family:ui-monospace,monospace;font-size:.75rem;letter-spacing:.12em}
  .peon867-top{border-block:1px solid var(--line);padding:12px 0;color:var(--muted);font-weight:700}
  .peon867-top a{color:inherit;text-decoration:none}
  .peon867-top a:hover{text-decoration:underline;text-underline-offset:4px}
  .peon867-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(22px,6vw,90px);align-items:center;padding:clamp(34px,7vw,105px) 0}
  .peon867-index{display:flex;align-items:center;gap:14px;font-weight:700;margin:0 0 24px;color:var(--amber)}
  .peon867-index span:first-child{border:1px solid #8d674d;padding:5px 10px;font-size:1rem}
  .peon867 h1,.peon867 h2,.peon867 h3{color:var(--paper);font-family:var(--font-undertango-editorial,Georgia),Georgia,serif;font-weight:400}
  .peon867 h1{font-size:clamp(2.7rem,7vw,7rem);line-height:.9;letter-spacing:-.075em;margin:0}
  .peon867 h2:before,.peon867 h2:after{content:none;display:none}
  .peon867 h1 em{color:var(--amber);font-weight:400}
  .peon867 h1 span{color:var(--jewel)}
  .peon867-lead{font-size:clamp(1rem,1.65vw,1.33rem);color:var(--muted);max-width:35ch;margin:30px 0 22px}
  .peon867-jump{display:inline-flex;min-height:44px;align-items:center;gap:18px;color:var(--paper);text-decoration:none;border-bottom:1px solid var(--amber);font-weight:650}
  .peon867-jump span{color:var(--amber)}
  .peon867 a:focus-visible{outline:3px solid #fff4dc;outline-offset:4px}
  .peon867-figure{margin:0;min-width:0}
  .peon867-frame{padding:clamp(8px,1.45vw,17px);border:1px solid #9b6f4e;background:linear-gradient(130deg,#69452f,#2e2019 70%);box-shadow:0 22px 56px #0009;scroll-margin-top:96px}
  .peon867-frame-top{font-size:clamp(.56rem,1.14vw,.75rem);padding:0 2px 10px;color:#ffead0;font-weight:700}
  .peon867-frame-top a{color:#fff0d7;text-decoration:underline;text-underline-offset:3px;display:inline-flex;gap:6px;min-height:44px;align-items:center}
  .peon867-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));grid-template-rows:repeat(8,minmax(0,1fr));aspect-ratio:1;border:1px solid #ab7d5c}
  .peon867-cell{position:relative;display:grid;place-items:center;min-width:0;min-height:0;line-height:1}
  .peon867-cell.is-light{background:#9a6a4a;color:#211711}
  .peon867-cell.is-dark{background:#50372d;color:#fff2dd}
  .peon867-cell.is-cross{background:#725565}
  .peon867-cell.is-stop{isolation:isolate;background:#342623;color:#fff0d9;box-shadow:inset 0 0 0 1px #dda36c;text-decoration:none}
  .peon867-cell.is-trail:after,.peon867-cell.is-cross:after{content:"";z-index:-1;position:absolute;inset:0 auto;width:1px;height:100%;background:#dba66e;opacity:.5;pointer-events:none}
  .peon867-cell.is-cross:after{z-index:auto;inset:auto 0;width:100%;height:1px;background:#f1ccdf}
  .peon867-cell.is-stop:hover,.peon867-cell.is-stop:focus-visible{background:#794a35;z-index:2}
  .peon867-cell.is-current,.peon867-cell.is-current:hover{background:#f1b873;color:#261a13}
  .peon867-cell.is-queen{background:#5f405d;color:#ffecf6;box-shadow:inset 0 0 0 1px #dbb6dd}
  .peon867-cell svg{width:62%;height:62%;position:absolute;top:10%;left:19%}
  .peon867-square-label,.peon867-rank,.peon867-file{font-family:ui-monospace,monospace;font-size:clamp(.56rem,1.2vw,.84rem);font-weight:800}
  .peon867-square-label{background:inherit;padding:2px 3px}
  .peon867-cell.is-current .peon867-square-label,.peon867-cell.is-queen .peon867-square-label{position:absolute;bottom:7%;right:4%}
  .peon867-rank,.peon867-file{position:absolute;opacity:.88}
  .peon867-rank{top:4px;left:4px}
  .peon867-file{bottom:4px;left:4px}
  .peon867-cell.is-current .peon867-file{display:none}
  .peon867-figure figcaption{padding:10px 2px 0;color:#ffead0;font-size:clamp(.65rem,1.2vw,.8rem)}
  .peon867-figure figcaption i{display:inline-block;width:8px;height:8px;margin-right:4px;border-radius:50%;background:var(--amber)}
  .peon867-route{max-width:845px;margin:auto;border-top:1px solid var(--line);padding-top:clamp(24px,5vw,55px)}
  .peon867-kicker,.peon867-meta{color:var(--amber);margin:0 0 6px;font-weight:700}
  .peon867 h2{font-size:clamp(2.5rem,5vw,4.5rem);line-height:1.05;letter-spacing:-.045em;margin:0 0 24px}
  .peon867-steps{padding:0;margin:0;list-style:none}
  .peon867-stage{display:grid;grid-template-columns:minmax(52px,.17fr) minmax(0,1fr);column-gap:clamp(12px,4vw,40px);border-top:1px solid var(--line);padding:22px clamp(12px,3vw,30px);scroll-margin-top:92px}
  .peon867-stage.is-now{background:linear-gradient(100deg,#432d24,#211917)}
  .peon867-stage:target,.peon867-epilogue article:target{outline:2px solid var(--amber);outline-offset:-2px}
  .peon867-stage h3,.peon867-epilogue h3{font-size:clamp(1.45rem,3vw,2.3rem);line-height:1.1;margin:0 0 10px}
  .peon867-stage p:not(.peon867-meta),.peon867-epilogue p:not(.peon867-meta){color:var(--muted);margin:0 0 8px}
  .peon867 .peon867-proof b{color:var(--paper)}
  .peon867-coordinate{font-size:clamp(1.15rem,3vw,1.8rem);color:var(--amber);align-self:start}
  .peon867-now{display:inline-block;margin:0 0 0 .7em;padding:0 .35em;background:var(--amber);color:var(--ink);letter-spacing:0}
  .peon867-epilogue{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:22px}
  .peon867-epilogue article{border:1px solid #775c72;background:#30232e;padding:clamp(18px,3vw,28px);scroll-margin-top:92px}
  .peon867-epilogue svg{width:32px;height:32px;color:var(--jewel);margin-bottom:10px}
  .peon867-back{margin-top:24px}
  @media(max-width:720px){.peon867-hero{grid-template-columns:minmax(0,1fr);padding-top:34px}.peon867-figure{width:100%;max-width:520px;margin-inline:auto}.peon867-square-label,.peon867-rank,.peon867-file{font-size:clamp(.59rem,2vw,.8rem)}}
  @media(max-width:430px){.peon867-wrap{padding-inline:17px}.peon867-epilogue{grid-template-columns:minmax(0,1fr)}.peon867-top{font-size:.63rem}.peon867-index{gap:10px}.peon867-stage{grid-template-columns:40px minmax(0,1fr);padding-inline:10px}}
`;
