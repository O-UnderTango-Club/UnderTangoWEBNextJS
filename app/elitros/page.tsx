import "./elitros.css";
import "./elitros-polish.css";
import InvestorCase from "./InvestorCase";

const businessModelDoc =
  "https://docs.google.com/document/d/1s2bI10gDtYp8TjXPduSVDV6EFC-9sVfa724Ev0lvNdE/edit?usp=drivesdk";

const team = [
  {
    name: "Pablo Cieslik",
    role: "Producto, visión y validación en campo",
    skills: "Dirección · operación · producción · diseño de producto",
    focus: "Convierte problemas reales de la operación en hipótesis, servicios y producto.",
  },
  {
    name: "Alejandro Míguez",
    role: "Estrategia, negocio y articulación",
    skills: "Vinculación · comunicación · desarrollo institucional",
    focus: "Ayuda a transformar objetivos en hitos, alianzas, validación y relato de negocio.",
  },
  {
    name: "Maximiliano Xavier Rodríguez",
    role: "Desarrollo tecnológico",
    skills: "Front-end · mobile · prototipado de producto",
    focus: "Transforma procesos y aprendizajes en interfaces que puedan usarse y medirse.",
  },
] as const;

const radarDimensions = [
  {
    code: "TRL",
    title: "Tecnología",
    value: 5,
    summary: "Existe un sistema interno fuerte —web, Airtable, automatizaciones y prototipos— usado en la operación; todavía falta validarlo como producto externo.",
  },
  {
    code: "CRL",
    title: "Cliente",
    value: 7,
    summary: "Hay ventas y clientes reales, sobre todo en servicios artísticos; cada producto nuevo debe validar su propio cliente.",
  },
  {
    code: "BRL",
    title: "Negocio",
    value: 5,
    summary: "Existe operación y experiencia comercial, pero todavía hay que separar precios, costos, márgenes y metas por unidad.",
  },
  {
    code: "FRL",
    title: "Financiación",
    value: 3,
    summary: "La reserva operativa y los mecanismos de capital todavía están en una etapa temprana frente al crecimiento buscado.",
  },
  {
    code: "TMRL",
    title: "Equipo",
    value: 5,
    summary: "Hay capacidades complementarias y una red real; el siguiente salto es explicitar responsabilidades y procesos mínimos.",
  },
  {
    code: "IPRL",
    title: "Prop. intelectual",
    value: 6,
    summary: "Existen marca, contenidos, software y metodología en desarrollo; falta ordenar qué proteger, licenciar o formalizar.",
  },
] as const;

const roadmapMilestones = [
  {
    code: "TRL",
    title: "Tecnología",
    current: 5,
    next: 6,
    target: 8,
    nextMilestone:
      "El sistema integrado se usa de forma sostenida dentro de UnderTango y un primer cliente externo paga por una solución tecnológica entregada y documentada.",
    targetMilestone:
      "La arquitectura se prueba con organizaciones externas y produce métricas de uso, fallas, ahorro de tiempo o mejora operativa.",
  },
  {
    code: "CRL",
    title: "Cliente",
    current: 7,
    next: 8,
    target: 9,
    nextMilestone:
      "Al menos tres clientes B2B vuelven a contratar o compran más de una unidad, y UnderTango registra origen, propuesta, conversión y repetición.",
    targetMilestone:
      "Existe un flujo comercial regional predecible y cada producto nuevo valida por separado problema, disposición a pagar y recurrencia.",
  },
  {
    code: "BRL",
    title: "Negocio",
    current: 5,
    next: 6,
    target: 8,
    nextMilestone:
      "Las unidades prioritarias tienen precio, costo directo y margen documentados y ya existen ventas realizadas a esos criterios.",
    targetMilestone:
      "La facturación base anual de USD 25.000 se explica por unidad, con margen y recurrencia suficientes para sostener operación y desarrollo.",
  },
  {
    code: "FRL",
    title: "Financiación",
    current: 3,
    next: 5,
    target: 7,
    nextMilestone:
      "Existe flujo de caja semanal, calendario de obligaciones y una primera reserva operativa que reduce decisiones de emergencia.",
    targetMilestone:
      "La operación normal puede sostenerse sin deuda de emergencia y cualquier ingreso de capital se documenta con reglas comprensibles antes de recibirlo.",
  },
  {
    code: "TMRL",
    title: "Equipo",
    current: 5,
    next: 7,
    target: 8,
    nextMilestone:
      "Pablo, Ale y Maxi trabajan con responsabilidades explícitas, una rutina breve de coordinación y criterios compartidos para definir hitos y evidencia.",
    targetMilestone:
      "Las operaciones críticas pueden ejecutarse con procesos documentados, responsables claros y una red estable de especialistas y reemplazos.",
  },
  {
    code: "IPRL",
    title: "Prop. intelectual",
    current: 6,
    next: 7,
    target: 8,
    nextMilestone:
      "UnderTango inventaría marca, contenidos, software y método y separa qué es activo propio, qué es de terceros y qué estrategia necesita.",
    targetMilestone:
      "Los activos diferenciales cuentan con una estrategia de protección, uso y licenciamiento coherente con la expansión comercial y tecnológica.",
  },
] as const;

const conclusions = [
  {
    title: "Los servicios actuales son una ventaja, no una distracción.",
    text: "Shows, clases y producción pueden generar caja con baja inversión relativa y financiar gradualmente tecnología, red y metodología.",
  },
  {
    title: "Cliente alto no significa que todo producto esté validado.",
    text: "La operación artística tiene evidencia comercial; la Red UnderTango y las soluciones digitales deben conseguir su propia evidencia de uso y pago.",
  },
  {
    title: "Un hito es un resultado observable.",
    text: "No alcanza con hacer marketing o buscar alianzas: el hito es un cliente cerrado, una venta repetida, un margen conocido o una V1 efectivamente utilizada.",
  },
  {
    title: "Tecnología se mide por validación, no por cantidad de herramientas.",
    text: "El sistema interno ya es potente, pero lo ubicamos prudentemente en nivel 5 hasta demostrar valor sostenido como producto fuera de UnderTango.",
  },
  {
    title: "Documentar es construir un activo.",
    text: "Cada cliente, movimiento comercial, cobro vinculado, costo, registro audiovisual y resultado puede transformarse en evidencia y memoria operativa reutilizable.",
  },
] as const;

const chartCenterX = 300;
const chartCenterY = 260;
const chartRadius = 168;

function radarPoint(index: number, value: number) {
  const angle = -Math.PI / 2 + index * (Math.PI / 3);
  const radius = chartRadius * (value / 9);
  return {
    x: chartCenterX + Math.cos(angle) * radius,
    y: chartCenterY + Math.sin(angle) * radius,
  };
}

const polygonPoints = radarDimensions
  .map((dimension, index) => {
    const point = radarPoint(index, dimension.value);
    return `${point.x},${point.y}`;
  })
  .join(" ");

const axisLabels = [
  { x: 300, y: 30, anchor: "middle", line1: "TECNOLOGÍA", line2: "(TRL)" },
  { x: 505, y: 145, anchor: "middle", line1: "CLIENTE", line2: "(CRL)" },
  { x: 510, y: 382, anchor: "middle", line1: "NEGOCIO", line2: "(BRL)" },
  { x: 300, y: 505, anchor: "middle", line1: "FINANCIACIÓN", line2: "(FRL)" },
  { x: 90, y: 382, anchor: "middle", line1: "EQUIPO", line2: "(TMRL)" },
  { x: 88, y: 145, anchor: "middle", line1: "PROP. INTELECTUAL", line2: "(IPRL)" },
] as const;

export default function ElitrosPage() {
  return (
    <main className="elitros-page">
      <header className="elitros-hero">
        <div className="elitros-shell">
          <p className="elitros-kicker">Ø UNDERTANGO · ÉLITROS 2026 · APRENDIZAJE APLICADO</p>
          <h1>Lo que aprendemos tiene que cambiar lo que hacemos.</h1>
          <p className="elitros-lede">
            Este espacio documenta, clase por clase, cómo la formación de ÉLITROS se transforma en herramientas,
            decisiones, evidencia y un modelo vivo dentro de UnderTango.
          </p>
          <nav className="elitros-class-index" aria-label="Índice de contenidos de ÉLITROS">
            <a href="#clase-1"><small>Módulo 2</small> Clase 1 · Canvas</a>
            <a href="#clase-2"><small>Módulo 2</small> Clase 2 · Madurez</a>
            <a href="/proyeccion"><small>Experimento</small> Proyección Red ÉLITROS</a>
            <a href="#equipo"><small>Equipo</small> Pablo · Ale · Maxi</a>
            <a href="/operacion"><small>Sistema vivo</small> Operación 2026</a>
            <a href="#modelo-vivo"><small>Documento</small> Modelo vivo</a>
          </nav>
        </div>
      </header>

      <section id="clase-1" className="elitros-section elitros-shell elitros-anchor-section" aria-labelledby="clase-1-title">
        <div className="elitros-section-heading">
          <p>Módulo 2 · Clase 1 · Resultado visible</p>
          <h2 id="clase-1-title">Lienzo del Modelo de Negocios — Ø UnderTango</h2>
        </div>
        <div className="elitros-canvas-frame">
          <img
            src="/elitros/modelo-negocio-undertango.svg"
            alt="Lienzo del Modelo de Negocios de UnderTango desarrollado en la Clase 1 del Módulo 2 de ÉLITROS"
            width="1600"
            height="900"
            loading="eager"
          />
        </div>
        <p className="elitros-caption">
          Primera síntesis del negocio: qué valor ofrecemos, a quién, con qué recursos y cómo se conectan costos,
          actividades, clientes e ingresos. El Canvas se actualiza cuando aparece evidencia nueva.
        </p>
      </section>

      <section id="clase-2" className="elitros-section elitros-section-soft elitros-anchor-section" aria-labelledby="clase-2-title">
        <div className="elitros-shell">
          <div className="elitros-section-heading elitros-class-heading">
            <p>Módulo 2 · Clase 2 · 20 agosto 2026 · Madurez de la innovación</p>
            <h2 id="clase-2-title">De una foto del negocio a un camino de hitos verificables.</h2>
            <p className="elitros-lede">
              La herramienta KTH IRL obliga a pensar un objetivo, definir resultados intermedios y hacer crecer de forma
              coordinada seis perspectivas. Una puntuación sólo tiene sentido cuando existe evidencia que la justifica.
            </p>
          </div>

          <div className="elitros-method-strip" aria-label="Principios aplicados de la Clase 2">
            <article><span>01 · Objetivo</span><strong>Definir una magnitud concreta.</strong><p>Un horizonte obliga a ordenar decisiones y recursos.</p></article>
            <article><span>02 · Hitos</span><strong>Resultado, no tarea.</strong><p>“Cerrar un cliente piloto” es hito; “buscar clientes” es actividad.</p></article>
            <article><span>03 · Evidencia</span><strong>Validar antes de escalar.</strong><p>Ventas, recurrencia, métricas y casos pesan más que una promesa.</p></article>
            <article><span>04 · Simetría</span><strong>La brecha es una alerta.</strong><p>Si un eje queda demasiado atrás, merece foco antes de seguir estirando la araña.</p></article>
          </div>

          <div className="elitros-objective-card" aria-labelledby="objetivo-kth-title">
            <div className="elitros-goal-grid">
              <div>
                <div className="elitros-objective-label">Caso base de trabajo · 2027</div>
                <h3 id="objetivo-kth-title">Construir una operación modular que facture USD 25.000 en el año y deje evidencia por departamento.</h3>
                <p>
                  La referencia prudente de 2025 es de aproximadamente USD 13.000, concentrados principalmente en shows.
                  El objetivo 2027 no exige que una sola unidad duplique todo: reparte el crecimiento y obliga a que cada
                  módulo produzca evidencia propia.
                </p>
                <div className="elitros-objective-principle">
                  <strong>Regla de gestión:</strong> cada salto debe producir una evidencia y mirar qué necesita el resto del
                  sistema para acompañarlo.
                </div>
              </div>
              <div className="elitros-goal-number">
                <span>Facturación base 2027</span>
                <strong>USD 25K</strong>
                <small>≈ USD 2.083 mensuales promedio entre todas las unidades.</small>
              </div>
            </div>
          </div>

          <InvestorCase />

          <div className="elitros-maturity-board">
            <div className="elitros-radar-column">
              <div className="elitros-visual-label">Línea de base · estimación interna</div>
              <h3>Perfil actual de madurez</h3>
              <figure className="elitros-radar-figure" aria-labelledby="radar-caption">
                <svg viewBox="0 0 600 525" role="img" aria-label="Radar KTH IRL de UnderTango Club: Tecnología 5, Cliente 7, Negocio 5, Financiación 3, Equipo 5 y Propiedad Intelectual 6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                    <circle key={level} cx={chartCenterX} cy={chartCenterY} r={chartRadius * (level / 9)} className="elitros-radar-ring" />
                  ))}
                  {radarDimensions.map((dimension, index) => {
                    const edge = radarPoint(index, 9);
                    return <line key={dimension.code} x1={chartCenterX} y1={chartCenterY} x2={edge.x} y2={edge.y} className="elitros-radar-axis" />;
                  })}
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                    <text key={`scale-${level}`} x={chartCenterX + 7} y={chartCenterY - chartRadius * (level / 9) + 4} className="elitros-radar-scale">{level}</text>
                  ))}
                  <polygon points={polygonPoints} className="elitros-radar-polygon" />
                  {radarDimensions.map((dimension, index) => {
                    const point = radarPoint(index, dimension.value);
                    return (
                      <g key={`point-${dimension.code}`}>
                        <circle cx={point.x} cy={point.y} r="6" className="elitros-radar-dot" />
                        <text x={point.x + (index === 4 || index === 5 ? -17 : 13)} y={point.y - 10} className="elitros-radar-value">{dimension.value}</text>
                      </g>
                    );
                  })}
                  {axisLabels.map((label) => (
                    <text key={label.line2} x={label.x} y={label.y} textAnchor={label.anchor} className="elitros-radar-label">
                      <tspan x={label.x}>{label.line1}</tspan>
                      <tspan x={label.x} dy="20" className="elitros-radar-code">{label.line2}</tspan>
                    </text>
                  ))}
                </svg>
                <figcaption id="radar-caption">
                  La alerta más evidente sigue estando entre <strong>Cliente (7)</strong> y <strong>Financiación (3)</strong>.
                  Tecnología baja prudentemente a <strong>5</strong>: hay un sistema interno real y útil, pero todavía falta
                  demostrarlo como producto externo.
                </figcaption>
              </figure>
              <div className="elitros-gap-callout">
                <span>Foco</span>
                <strong>Financiación + Negocio + Equipo deben acercarse a Cliente antes de exigirle más escala al sistema.</strong>
              </div>
              <details className="elitros-radar-milestones">
                <summary>
                  <span className="elitros-show-label">Mostrar hitos de validación</span>
                  <span className="elitros-hide-label">Ocultar hitos de validación</span>
                  <b aria-hidden="true">＋</b>
                </summary>
                <div className="elitros-radar-milestone-list">
                  {roadmapMilestones.map((milestone) => (
                    <article key={`radar-${milestone.code}`}>
                      <span>{milestone.code} · {milestone.current} → {milestone.next}</span>
                      <strong>{milestone.title}</strong>
                      <p>{milestone.nextMilestone}</p>
                    </article>
                  ))}
                </div>
              </details>
            </div>

            <aside className="elitros-quick-read" aria-label="Lectura rápida del diagnóstico">
              <p className="elitros-quick-title">Lectura rápida</p>
              {radarDimensions.map((dimension) => (
                <div className="elitros-quick-row" key={`quick-${dimension.code}`}>
                  <div className="elitros-score">{dimension.value}</div>
                  <p><strong>{dimension.title}</strong><span>{dimension.summary}</span></p>
                </div>
              ))}
            </aside>
          </div>

          <div className="elitros-roadmap" aria-labelledby="hitos-title">
            <div className="elitros-roadmap-heading">
              <p>De diagnóstico a herramienta de gestión</p>
              <h3 id="hitos-title">El siguiente nivel sólo existe cuando podemos mostrar qué cambió.</h3>
              <p>
                Los niveles no son premios ni fechas rígidas. Son una manera de describir la evidencia que debería existir
                antes de considerar madura una dimensión. Estos hitos se revisarán con Ale y Maxi y pueden cambiar si la
                realidad muestra un camino mejor.
              </p>
            </div>

            <div className="elitros-roadmap-grid">
              {roadmapMilestones.map((milestone) => (
                <article className="elitros-milestone-card" key={milestone.code}>
                  <div className="elitros-milestone-top">
                    <div><span>{milestone.code}</span><h4>{milestone.title}</h4></div>
                    <div className="elitros-level-path" aria-label={`${milestone.title}: nivel actual ${milestone.current}, próximo nivel ${milestone.next}, consolidación ${milestone.target}`}>
                      <span><small>Hoy</small>{milestone.current}</span><b>→</b>
                      <span><small>Próx.</small>{milestone.next}</span><b>→</b>
                      <span><small>Cons.</small>{milestone.target}</span>
                    </div>
                  </div>
                  <div className="elitros-milestone-step">
                    <strong>Próximo hito verificable</strong>
                    <p>{milestone.nextMilestone}</p>
                  </div>
                  <div className="elitros-milestone-step elitros-milestone-target">
                    <strong>Qué significaría consolidarlo</strong>
                    <p>{milestone.targetMilestone}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="elitros-roadmap-legend">La pregunta para cada tarjeta es siempre la misma: “¿qué evidencia concreta mostraríamos para defender este nivel frente a una persona externa?”</p>
          </div>

          <div className="elitros-conclusions" aria-labelledby="conclusiones-title">
            <div className="elitros-conclusions-heading">
              <span aria-hidden="true">◎</span>
              <div><p>Lectura aplicada</p><h3 id="conclusiones-title">Qué cambia en UnderTango después de esta clase</h3></div>
            </div>
            <div className="elitros-conclusion-list">
              {conclusions.map((conclusion, index) => (
                <article key={conclusion.title}>
                  <div className="elitros-conclusion-number">{index + 1}</div>
                  <p><strong>{conclusion.title}</strong> {conclusion.text}</p>
                </article>
              ))}
            </div>
            <div className="elitros-synthesis">
              <strong>Síntesis:</strong> el radar deja de ser una foto y pasa a ser un tablero. El plan propone qué debería
              ocurrir; la operación agrega evidencia; la evidencia modifica el plan.
            </div>
          </div>
        </div>
      </section>

      <section id="equipo" className="elitros-section elitros-shell elitros-anchor-section" aria-labelledby="equipo-title">
        <div className="elitros-section-heading">
          <p>Equipo de Ø UnderTango en ÉLITROS</p>
          <h2 id="equipo-title">Tres perfiles para mantener visión, negocio y tecnología en la misma conversación.</h2>
        </div>
        <p className="elitros-team-intro">
          El equipo mínimo viable no se define por cantidad de personas, sino por complementariedad y alineación. Estos tres
          roles son el núcleo que hoy transforma aprendizaje en decisiones y prototipos.
        </p>
        <div className="elitros-team-grid">
          {team.map((member) => (
            <article className="elitros-profile" key={member.name}>
              <div className="elitros-avatar" aria-hidden="true">{member.name.charAt(0)}</div>
              <h3>{member.name}</h3>
              <p className="elitros-role">{member.role}</p>
              <p>{member.skills}</p>
              <em>{member.focus}</em>
              <span>Startup vinculada → Ø UnderTango</span>
            </article>
          ))}
        </div>
      </section>

      <section id="modelo-vivo" className="elitros-section elitros-shell elitros-document elitros-anchor-section" aria-labelledby="documento-title">
        <p className="elitros-eyebrow">Modelo de negocio vivo</p>
        <h2 id="documento-title">Ø UnderTango — Modelo de Negocio Vivo</h2>
        <p>
          Después de cada clase, los aprendizajes que cambian nuestra lectura del proyecto se incorporan acá. El documento
          conserva la versión actual del modelo, sus hipótesis, incógnitas críticas y próximas validaciones.
        </p>
        <a href={businessModelDoc} target="_blank" rel="noreferrer" className="elitros-doc-link">
          Abrir Google Doc del modelo de negocio ↗
        </a>
      </section>

      <footer className="elitros-footer">
        <div className="elitros-shell">
          <p>Ø UnderTango · Aprendizaje aplicado · ÉLITROS 2026</p>
          <p className="elitros-disclaimer">
            Los niveles KTH IRL, metas de facturación, hitos y escenarios de capital son hipótesis internas para orientar
            aprendizaje, validación y evidencia. No constituyen certificación, oferta pública de inversión ni promesa de
            rendimiento. La Red UnderTango y sus prototipos son experimentos propios y no productos oficiales de ÉLITROS.
          </p>
        </div>
      </footer>
    </main>
  );
}
