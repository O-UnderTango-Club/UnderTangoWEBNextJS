"use client";

import { useState } from "react";
import { readiness } from "./readiness";
import "./readiness.css";

const radarPoint = (axis: number, level: number) => {
  const angle = (-90 + axis * 60) * Math.PI / 180;
  return [230 + Math.cos(angle) * level * 15, 225 + Math.sin(angle) * level * 15];
};

export default function ReadinessRadar() {
  const [selected, setSelected] = useState<string | null>(null);
  const current = readiness.find(item => item.code === selected);

  return (
    <div className="bmc-radar-interactive" onKeyDown={event => {
      if (event.key === "Escape") setSelected(null);
    }}>
      <p className="bmc-radar-help">Pasá el mouse, tocá un punto o elegí una dimensión de la lista para ver el próximo hito. También podés recorrerlos con el teclado.</p>
      <div className="bmc-radar-layout">
        <div className="bmc-radar-chart-column">
          <figure className="bmc-current-radar">
            <svg viewBox="0 0 460 455" role="group" aria-labelledby="radar-title radar-desc">
              <title id="radar-title">Radar de madurez de UnderTango: seleccioná una dimensión</title>
              <desc id="radar-desc">{readiness.map(item => `${item.title} ${item.level}`).join(", ")}. Estimaciones internas en escala de 1 a 9, no niveles KTH acreditados.</desc>
              <text x="230" y="25" textAnchor="middle" fontSize="17" fontWeight="700">UNDERTANGO · HOY</text>
              <text x="230" y="47" textAnchor="middle" fontSize="12">Escala 1–9 · niveles provisionales</text>
              {Array.from({length: 9}, (_, i) => i + 1).map(level => <g key={level} aria-hidden="true"><polygon points={readiness.map((_, axis) => radarPoint(axis, level).join(",")).join(" ")} fill="none" stroke="#d3d7cd" strokeWidth={level === 9 ? 1.5 : 0.8}/><text x="239" y={225-level*15+4} fontSize="10" fill="#626a61">{level}</text></g>)}
              {readiness.map((item, axis) => {
                const [x,y] = radarPoint(axis,9);
                return <line key={item.code} x1="230" y1="225" x2={x} y2={y} stroke="#c2c9bd" aria-hidden="true"/>;
              })}
              <polygon points={readiness.map((item, axis) => radarPoint(axis, item.level).join(",")).join(" ")} fill="#24566c" fillOpacity="0.12" stroke="#24566c" strokeWidth="2.5" strokeDasharray="5 3" aria-hidden="true"/>
              {readiness.map((item, axis) => {
                const [x,y] = radarPoint(axis,item.level);
                const [lx,ly] = radarPoint(axis,11);
                return <g key={item.code} className="bmc-radar-point" role="button" tabIndex={0}
                  aria-label={`${item.code} · ${item.title} · ${item.level} de 9. Ver próximo hito`}
                  aria-pressed={selected === item.code} aria-controls="radar-next-step"
                  onMouseEnter={() => setSelected(item.code)} onFocus={() => setSelected(item.code)} onClick={() => setSelected(item.code)}
                  onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(item.code); } }}>
                  <circle className="bmc-radar-hit" cx={x} cy={y} r="18" fill="transparent"/>
                  <circle className="bmc-radar-dot" cx={x} cy={y} r="6" fill={selected === item.code ? "#24566c" : "white"} stroke="#24566c" strokeWidth="2.5"/>
                  <text x={lx} y={ly} textAnchor="middle" fontSize="12" fontWeight="700">{item.code} · {item.level}</text>
                  <text x={lx} y={ly+16} textAnchor="middle" fontSize="10">{item.code === "IPRL" ? "Prop. intelectual" : item.title}</text>
                </g>;
              })}
              <text x="230" y="442" textAnchor="middle" fontSize="11">Estimación interna · revisión 23/09/2026</text>
            </svg>
            <figcaption>Referencia: <a href="https://kthinnovationreadinesslevel.com/wp-content/uploads/sites/9/2021/02/KTH-Innovation-Readiness-Level_Compiled.pdf" target="_blank" rel="noreferrer">modelo KTH</a>. Autoevaluación de UnderTango.</figcaption>
          </figure>
          <div id="radar-next-step" className="bmc-radar-next-step" data-active={Boolean(current)} aria-live="polite" aria-atomic="true">
            {current ? <>
              <button type="button" className="bmc-radar-close" onClick={() => setSelected(null)} aria-label="Cerrar hito">Cerrar ×</button>
              <p className="bmc-radar-step-label">{current.code} · {current.level} → {current.level + 1} · HITO PROPUESTO</p>
              <h3>{current.next}</h3>
              <ol>{current.steps.map(step => <li key={step}>{step}</li>)}</ol>
              <p><strong>Evidencia para revisar el avance:</strong> {current.proof}</p>
            </> : <p>Elegí un punto del radar o una dimensión de la lista. Aquí aparecerán el plan y la evidencia que necesitamos para revisar el siguiente nivel.</p>}
          </div>
        </div>
        <div className="bmc-readiness">
          {readiness.map(item => <article key={item.code} data-selected={selected === item.code} onMouseEnter={() => setSelected(item.code)}>
            <div aria-hidden="true">{item.level}</div>
            <section>
              <button type="button" className="bmc-readiness-select" aria-label={`${item.code} · ${item.title}. Ver próximo hito`}
                aria-pressed={selected === item.code} aria-controls="radar-next-step"
                onFocus={() => setSelected(item.code)} onClick={() => setSelected(item.code)}>
                <span>{item.code} · {item.level}/9 · {item.status}</span><strong>{item.title}</strong>
              </button>
              <p>{item.description}</p>
              {"link" in item && <a className="bmc-tools-link" href={item.link.href}>{item.link.label} →</a>}
            </section>
          </article>)}
        </div>
      </div>
      <p className="bmc-radar-method">Los hitos son metas de trabajo propuestas por UnderTango. Cumplirlos permite revisar el nivel con evidencia; no supone una acreditación ni un ascenso automático en el modelo KTH.</p>
    </div>
  );
}
