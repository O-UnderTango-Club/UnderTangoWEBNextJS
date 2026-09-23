"use client";

import { useEffect, useRef, useState } from "react";
import { edges, groups, journey, nodes, type Group } from "./network";
import styles from "./network.module.css";

const initialView = { yaw: -0.2, pitch: 0.13, zoom: 1 };

export default function ToolNetwork({ compact = false }: { compact?: boolean }) {
  const Container = compact ? "div" : "main";
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const view = useRef({ ...initialView });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState("chatgpt");
  const [filter, setFilter] = useState<Group | "all">("all");
  const [motion, setMotion] = useState(false);
  const [supported, setSupported] = useState(true);
  const [step, setStep] = useState<number | null>(null);
  const renderState = useRef({ selected, filter, motion });
  const active = nodes.find(node => node.id === selected)!;
  const connections = edges.filter(edge => edge.from === selected || edge.to === selected);

  useEffect(() => { renderState.current = { selected, filter, motion }; }, [selected, filter, motion]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const gl = element.getContext("webgl", { alpha: true, antialias: true });
    let frame = 0;
    let dead = false;
    const program = gl?.createProgram();
    const buffer = gl?.createBuffer();
    const shaders: WebGLShader[] = [];
    let position = -1, color = -1;
    let pointMode: WebGLUniformLocation | null = null;
    let size: WebGLUniformLocation | null = null;
    const release = () => {
      if (!gl) return;
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      shaders.forEach(shader => gl.deleteShader(shader));
    };
    try {
      if (!gl || !program || !buffer) throw new Error("WebGL unavailable");
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Shader unavailable");
        shaders.push(shader);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Shader failed");
        gl.attachShader(program, shader);
      };
      compile(gl.VERTEX_SHADER, "attribute vec3 aPosition; attribute vec4 aColor; varying vec4 vColor; uniform float uSize; void main(){gl_Position=vec4(aPosition,1.0); gl_PointSize=uSize; vColor=aColor;}");
      compile(gl.FRAGMENT_SHADER, "precision mediump float; varying vec4 vColor; uniform bool uPoint; void main(){float alpha=1.0; if(uPoint){float d=length(gl_PointCoord-vec2(0.5)); if(d>0.5)discard; alpha=1.0-smoothstep(0.15,0.5,d);} gl_FragColor=vec4(vColor.rgb,vColor.a*alpha);}");
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program failed");
      gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      position = gl.getAttribLocation(program, "aPosition"); color = gl.getAttribLocation(program, "aColor");
      pointMode = gl.getUniformLocation(program, "uPoint"); size = gl.getUniformLocation(program, "uSize");
      gl.enableVertexAttribArray(position); gl.enableVertexAttribArray(color);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 28, 0);
      gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 28, 12);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } catch { setSupported(false); release(); return; }
    if (!gl) return;
    const contextLost = (event: Event) => { event.preventDefault(); dead = true; cancelAnimationFrame(frame); setSupported(false); };
    element.addEventListener("webglcontextlost", contextLost);
    let lastTime = 0;
    let lastDraw = "";
    const draw = (time: number) => {
      if (dead) return;
      const { selected: picked, filter: group, motion: animate } = renderState.current;
      const delta = lastTime ? Math.min(time - lastTime, 50) : 0; lastTime = time;
      if (animate && !drag.current) view.current.yaw += delta * 0.000045;
      const width = element.clientWidth, height = element.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const drawKey = `${width}:${height}:${ratio}:${view.current.yaw}:${view.current.pitch}:${view.current.zoom}:${picked}:${group}`;
      if (!animate && drawKey === lastDraw) { frame = requestAnimationFrame(draw); return; }
      lastDraw = drawKey;
      if (element.width !== Math.round(width * ratio) || element.height !== Math.round(height * ratio)) {
        element.width = Math.round(width * ratio); element.height = Math.round(height * ratio);
      }
      gl.viewport(0, 0, element.width, element.height); gl.clear(gl.COLOR_BUFFER_BIT);
      const { yaw, pitch, zoom } = view.current;
      const project = ([x, y, z]: number[]) => {
        const rx = x * Math.cos(yaw) + z * Math.sin(yaw);
        const rz = -x * Math.sin(yaw) + z * Math.cos(yaw);
        const ry = y * Math.cos(pitch) - rz * Math.sin(pitch);
        const depth = y * Math.sin(pitch) + rz * Math.cos(pitch);
        const scale = Math.min(width / 6.7, height / 5.8) * zoom * 6 / (6 + depth);
        return { x: rx * scale, y: -ry * scale, z: depth / 10 };
      };
      const projected = nodes.map(node => project(node.position));
      const index = (id: string) => nodes.findIndex(node => node.id === id);
      const related = new Set(edges.filter(e => e.from === picked || e.to === picked).flatMap(e => [e.from, e.to]));
      const visible = (i: number) => group === "all" || nodes[i].group === group;
      const vertex = (p: {x:number;y:number;z:number}, rgb: readonly number[], alpha: number) => [p.x / width * 2, -p.y / height * 2, p.z, ...rgb, alpha];
      const lines: number[] = [], points: number[] = [], pulses: number[] = [];
      edges.forEach((edge, n) => {
        const a = index(edge.from), b = index(edge.to);
        const highlighted = edge.from === picked || edge.to === picked;
        const alpha = (visible(a) && visible(b) ? 1 : 0.15) * (highlighted ? 0.65 : 0.12);
        const rgb = highlighted ? groups[nodes[index(picked)].group].rgb : [0.48, 0.65, 0.72];
        lines.push(...vertex(projected[a], rgb, alpha), ...vertex(projected[b], rgb, alpha));
        if (animate && highlighted) {
          const t = (time * 0.00018 + n * 0.17) % 1;
          const p = project(nodes[a].position.map((value, axis) => value + (nodes[b].position[axis] - value) * t));
          pulses.push(...vertex(p, rgb, alpha));
        }
      });
      projected.forEach((p, i) => {
        const alpha = visible(i) ? (related.has(nodes[i].id) ? 1 : 0.5) : 0.15;
        points.push(...vertex(p, groups[nodes[i].group].rgb, alpha));
        const label = labels.current[i];
        if (label) {
          label.style.left = `${width / 2 + p.x}px`; label.style.top = `${height / 2 + p.y}px`;
          label.style.opacity = `${visible(i) ? 1 : 0.25}`;
          label.style.zIndex = `${Math.round(20 - p.z * 10)}`;
        }
      });
      const paint = (data: number[], mode: number, pointSize: number) => {
        gl.uniform1i(pointMode, mode === gl.POINTS ? 1 : 0); gl.uniform1f(size, pointSize * ratio);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW); gl.drawArrays(mode, 0, data.length / 7);
      };
      paint(lines, gl.LINES, 1); paint(points, gl.POINTS, 28); paint(pulses, gl.POINTS, 9);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { dead = true; cancelAnimationFrame(frame); element.removeEventListener("webglcontextlost", contextLost); release(); };
  }, []);

  const choose = (id: string) => { setSelected(id); setStep(null); };
  const walk = (value: number) => { setStep(value); setSelected(journey[value].id); setFilter("all"); };

  return <Container className={`${styles.page} ${compact ? styles.compact : ""}`}>
    {!compact && <>
    <header className={styles.header}><a href="https://elitros.undertangoclub.com/">Ø UnderTango <span>/ ÉLITROS</span></a><a href="https://elitros.undertangoclub.com/#madurez">Volver al modelo ↗</a></header>
    <div className={styles.intro}><p className={styles.eyebrow}>DEPARTAMENTO 80 / ATLAS OPERATIVO</p><h1>Un sistema nervioso.<br /><span>Muchas herramientas.</span></h1><p>La dirección da sentido. Los protocolos conectan. La información se convierte en acciones, y cada resultado vuelve a la memoria del sistema.</p></div>
    </>}
    <div className={styles.workspace}>
      <div className={styles.mapColumn}>
        <div className={styles.toolbar}><span>EXPLORAR LA RED</span><button onClick={() => { view.current = { ...initialView }; }}>Centrar vista</button><button aria-label="Alejar mapa" onClick={() => { view.current.zoom = Math.max(0.6, view.current.zoom - 0.15); }}>−</button><button aria-label="Acercar mapa" onClick={() => { view.current.zoom = Math.min(1.6, view.current.zoom + 0.15); }}>+</button><button aria-pressed={motion} onClick={() => setMotion(!motion)}>{motion ? "Pausar movimiento" : "Activar movimiento"}</button></div>
        <div className={styles.scene} role="group" aria-label="Mapa tridimensional de herramientas. Arrastrá para girar; también podés usar las flechas del teclado." tabIndex={0}
          onKeyDown={e => { if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) || e.target !== e.currentTarget) return; e.preventDefault(); view.current.yaw += e.key === "ArrowLeft" ? -0.15 : e.key === "ArrowRight" ? 0.15 : 0; view.current.pitch = Math.max(-0.8, Math.min(0.8, view.current.pitch + (e.key === "ArrowUp" ? -0.1 : e.key === "ArrowDown" ? 0.1 : 0))); }}
          onPointerDown={e => { if ((e.target as HTMLElement).closest("button")) return; drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={e => { if (!drag.current) return; view.current.yaw += (e.clientX - drag.current.x) * 0.006; view.current.pitch = Math.max(-0.8, Math.min(0.8, view.current.pitch + (e.clientY - drag.current.y) * 0.006)); drag.current = { x: e.clientX, y: e.clientY }; }}
          onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
          <canvas ref={canvas} aria-hidden="true" />
          {supported ? nodes.map((node, i) => <button key={node.id} ref={element => { labels.current[i] = element; }} className={`${styles.node} ${selected === node.id ? styles.selected : ""}`} style={{ "--node-color": groups[node.group].color } as React.CSSProperties} aria-pressed={selected === node.id} onClick={() => choose(node.id)}><strong>{node.name}</strong><span>{node.short}</span></button>) : <p className={styles.fallback}>La vista 3D no está disponible en este navegador. {compact ? "Abrí el diagrama completo con el enlace de abajo para explorar las herramientas en lista." : "Podés explorar todas las herramientas y conexiones con la lista de abajo."}</p>}
          <span className={styles.sceneHint}>ARRASTRÁ PARA GIRAR · ELEGÍ UN NODO</span><span className={styles.dimension}>3D / WEBGL</span>
        </div>
        {!compact && <div className={styles.filters} aria-label="Capas del mapa"><button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas</button>{Object.entries(groups).map(([id, group]) => <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id as Group)}><i style={{ background: group.color }} />{group.name}</button>)}</div>}
        <p className={styles.caption}>Mapa conceptual del trabajo de UnderTango. Las líneas representan relaciones de trabajo; no todas son integraciones automáticas. El movimiento ilustra un intercambio, no actividad en tiempo real.</p>
      </div>
      {!compact && <aside className={styles.details} aria-label="Herramienta seleccionada" aria-live="polite"><p className={styles.eyebrow} style={{ color: groups[active.group].color }}>{groups[active.group].name}</p><h2>{active.name}</h2><p className={styles.role}>{active.role}</p><p>{active.detail}</p><h3>Cómo se entrelaza</h3><ul>{connections.map(edge => { const other = nodes.find(node => node.id === (edge.from === selected ? edge.to : edge.from))!; return <li key={`${edge.from}-${edge.to}`}><button onClick={() => choose(other.id)}>{other.name}<span>↗</span></button><p>{edge.label}</p></li>; })}</ul></aside>}
    </div>
    {compact && <p className={styles.selection} aria-live="polite"><strong>{active.name}</strong> · {active.role}</p>}
    {!compact && <section className={styles.journey} aria-labelledby="journey-title"><div><p className={styles.eyebrow}>UN RECORRIDO POSIBLE</p><h2 id="journey-title">De una solicitud<br />a un resultado comprobado.</h2><p>Un ejemplo de proyecto digital para recorrer la red paso a paso.</p></div><div className={styles.step}><p className={styles.eyebrow}>{step === null ? "EJEMPLO GUIADO" : `PASO ${step + 1} DE ${journey.length}`}</p><h3>{step === null ? "Seguí el hilo de la información." : journey[step].title}</h3><p>{step === null ? "Cada paso selecciona una herramienta en el mapa y explica su aporte al proyecto." : journey[step].text}</p><div><button disabled={step === null || step === 0} onClick={() => walk((step ?? 1) - 1)}>← Anterior</button><button onClick={() => walk(step === null || step === journey.length - 1 ? 0 : step + 1)}>{step === null ? "Comenzar recorrido" : step === journey.length - 1 ? "Volver a empezar" : "Siguiente paso"} →</button></div></div></section>}
    {!compact && <details className={styles.directory}><summary>Explorar herramientas en lista · {nodes.length} nodos</summary><div>{nodes.map(node => <button key={node.id} onClick={() => { choose(node.id); canvas.current?.scrollIntoView({ block: "center" }); }} aria-pressed={selected === node.id}><strong>{node.name}</strong><span>{node.role}</span></button>)}</div></details>}
    {!compact && <footer className={styles.footer}><span>Ø UnderTango · Tecnología, criterio y continuidad.</span><a href="https://www.undertangoclub.com/80-startup-undertango">Conocer la startup ↗</a></footer>}
  </Container>;
}
