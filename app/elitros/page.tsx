import "./elitros.css";

const businessModelDoc =
  "https://docs.google.com/document/d/1s2bI10gDtYp8TjXPduSVDV6EFC-9sVfa724Ev0lvNdE/edit?usp=drivesdk";

const team = [
  {
    name: "Pablo Cieslik",
    role: "Producto, visión y validación en campo",
    skills: "Dirección artística · producción · producto · operación",
  },
  {
    name: "Alejandro Míguez",
    role: "Representación y articulación estratégica",
    skills: "Vinculación · comunicación · desarrollo institucional",
  },
  {
    name: "Maximiliano Xavier Rodríguez",
    role: "Desarrollo tecnológico",
    skills: "Front-end · mobile · prototipado de producto",
  },
];

const radarDimensions = [
  {
    code: "TRL",
    title: "Tecnología",
    value: 6,
    summary: "Prototipos, web, automatizaciones y herramientas ya operativas.",
  },
  {
    code: "CRL",
    title: "Cliente",
    value: 7,
    summary: "Ventas, clientes reales y recurrencia en shows, clases y servicios.",
  },
  {
    code: "BRL",
    title: "Negocio",
    value: 5,
    summary: "Modelo probado en campo, todavía por sistematizar y estandarizar.",
  },
  {
    code: "FRL",
    title: "Financiación",
    value: 3,
    summary: "Caja y recursos frágiles frente a las necesidades de continuidad y expansión.",
  },
  {
    code: "TMRL",
    title: "Equipo",
    value: 5,
    summary: "Red activa y capacidades reales, con estructura y roles aún en consolidación.",
  },
  {
    code: "IPRL",
    title: "Prop. intelectual",
    value: 6,
    summary: "Marca registrada y activos de método, sistema y producto en desarrollo.",
  },
] as const;

const roadmapMilestones = [
  {
    code: "TRL",
    title: "Tecnología",
    current: 6,
    november: 7,
    target: 8,
    novemberMilestone:
      "Usar durante al menos ocho semanas una V1 integrada web/mobile con acceso, base operativa y calendario funcionando como herramienta interna real.",
    targetMilestone:
      "Validar la misma arquitectura con al menos tres organizaciones externas y documentar uso, fallas y mejoras.",
  },
  {
    code: "CRL",
    title: "Cliente",
    current: 7,
    november: 8,
    target: 9,
    novemberMilestone:
      "Consolidar al menos seis clientes institucionales recurrentes en dos países y medir conversión, repetición y origen de cada oportunidad.",
    targetMilestone:
      "Tener un flujo comercial predecible en Argentina, Brasil y Paraguay, con al menos 40% de los ingresos provenientes de recurrencia o acuerdos estables.",
  },
  {
    code: "BRL",
    title: "Negocio",
    current: 5,
    november: 7,
    target: 8,
    novemberMilestone:
      "Estandarizar tres ofertas vendibles con precio mínimo, costos, margen, alcance y variables claras; registrar el pipeline comercial en un único sistema.",
    targetMilestone:
      "Demostrar economía unitaria positiva y un mecanismo comercial replicable que no dependa exclusivamente de la venta personal del fundador.",
  },
  {
    code: "FRL",
    title: "Financiación",
    current: 3,
    november: 6,
    target: 8,
    novemberMilestone:
      "Operar con flujo de caja semanal, calendario completo de obligaciones y una reserva equivalente a un mes de costos operativos críticos.",
    targetMilestone:
      "Sostener tres meses de capital de trabajo y dejar de utilizar deuda de emergencia para financiar la operación cotidiana.",
  },
  {
    code: "TMRL",
    title: "Equipo",
    current: 5,
    november: 7,
    target: 8,
    novemberMilestone:
      "Definir roles, responsables y suplencias del núcleo Pablo–Ale–Maxi y de la producción artística, con una rutina de coordinación y reglas de remuneración documentadas.",
    targetMilestone:
      "Lograr que las operaciones críticas puedan ejecutarse con procesos documentados, responsables claros y una red estable de reemplazos sin depender de una sola persona.",
  },
  {
    code: "IPRL",
    title: "Prop. intelectual",
    current: 6,
    november: 7,
    target: 8,
    novemberMilestone:
      "Inventariar marca, contenidos, software y método; ordenar titularidad y licencias y realizar una revisión de antecedentes y estrategia de protección del Sistema UnderTango.",
    targetMilestone:
      "Aplicar una estrategia de protección y licenciamiento coherente en los mercados prioritarios y convertir los activos diferenciales en acuerdos utilizables comercialmente.",
  },
] as const;

const conclusions = [
  {
    title: "Existe validación real de mercado.",
    text: "UnderTango ya vende y opera: shows, clases y colaboraciones confirman interés, uso y tracción comercial.",
  },
  {
    title: "Cliente es la dimensión más madura.",
    text: "La validación comercial está por delante de la estructura que debería sostenerla; Tecnología y Propiedad Intelectual forman una base valiosa para crecer.",
  },
  {
    title: "Financiación es hoy la principal brecha.",
    text: "La falta de capital estable y la presión de caja pueden interrumpir continuidad, inversión y escalabilidad aunque exista demanda.",
  },
  {
    title: "Negocio y Equipo están en una zona media.",
    text: "Hay experiencia y capacidad, pero todavía hace falta formalizar procesos, roles, paquetes comerciales, criterios de precio y mecanismos de coordinación.",
  },
  {
    title: "La prioridad es reducir la asimetría.",
    text: "Fortalecer financiación, ordenar el modelo de negocio y consolidar el equipo permitiría convertir la tracción actual en crecimiento sostenible.",
  },
];

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
            decisiones y modelos vivos dentro de UnderTango.
          </p>
          <div className="elitros-status-row">
            <span>Módulo 2</span>
            <span>Clase 2</span>
            <span>20 agosto 2026</span>
            <span>Madurez de la innovación</span>
          </div>
        </div>
      </header>

      <section className="elitros-section elitros-shell" aria-labelledby="clase-1-title">
        <div className="elitros-section-heading">
          <p>Clase 1 · Resultado visible</p>
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
          Resultado visible de la Clase 1: una primera síntesis del negocio para ordenar lo que sabemos, lo que
          suponemos y lo que todavía necesitamos validar.
        </p>
      </section>

      <section className="elitros-section elitros-section-soft" aria-labelledby="clase-2-title">
        <div className="elitros-shell">
          <div className="elitros-section-heading elitros-class-heading">
            <p>Clase 2 · Madurez de la innovación</p>
            <h2 id="clase-2-title">De la idea al mercado: diagnóstico y hoja de ruta de Ø UnderTango Club</h2>
            <p className="elitros-lede">
              El modelo KTH IRL no se usa solamente para describir dónde estamos: parte de un objetivo y obliga a
              definir hitos verificables en seis dimensiones. La tela de araña muestra la madurez alcanzada respecto de
              esos hitos y permite detectar dónde una brecha mayor a tres niveles puede frenar el desarrollo completo.
            </p>
          </div>

          <div className="elitros-objective-card" aria-labelledby="objetivo-kth-title">
            <div className="elitros-objective-label">Objetivo de trabajo · hipótesis para alinear y validar</div>
            <h3 id="objetivo-kth-title">Ø UnderTango facturará USD 100.000 durante 2027 con una operación regional sostenible.</h3>
            <p>
              El objetivo combina shows, clases y servicios/productos operativos; busca que al menos 40% de los
              ingresos provenga de clientes recurrentes o acuerdos estables, que la operación funcione en Argentina,
              Brasil y Paraguay y que una V1 del Sistema UnderTango sea validada con al menos tres organizaciones
              externas. No es una promesa cerrada: es una meta cuantificable para ordenar decisiones, discutirla con el
              equipo y reemplazarla si aparece evidencia mejor.
            </p>
            <div className="elitros-objective-principle">
              <strong>Regla de uso:</strong> cada eje necesita hitos concretos que conduzcan al objetivo. El nivel 1–9
              describe cuánto se avanzó en esos hitos; si dos dimensiones quedan separadas por más de tres niveles,
              esa asimetría se convierte en prioridad.
            </div>
          </div>

          <div className="elitros-maturity-board">
            <div className="elitros-radar-column">
              <div className="elitros-visual-label">Línea de base · 20 agosto 2026</div>
              <h3>Perfil actual de madurez respecto del objetivo</h3>

              <figure className="elitros-radar-figure" aria-labelledby="radar-caption">
                <svg viewBox="0 0 600 525" role="img" aria-label="Radar KTH IRL de UnderTango Club: Tecnología 6, Cliente 7, Negocio 5, Financiación 3, Equipo 5 y Propiedad Intelectual 6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                    <circle
                      key={level}
                      cx={chartCenterX}
                      cy={chartCenterY}
                      r={chartRadius * (level / 9)}
                      className="elitros-radar-ring"
                    />
                  ))}

                  {radarDimensions.map((dimension, index) => {
                    const edge = radarPoint(index, 9);
                    return (
                      <line
                        key={dimension.code}
                        x1={chartCenterX}
                        y1={chartCenterY}
                        x2={edge.x}
                        y2={edge.y}
                        className="elitros-radar-axis"
                      />
                    );
                  })}

                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                    <text
                      key={`scale-${level}`}
                      x={chartCenterX + 7}
                      y={chartCenterY - chartRadius * (level / 9) + 4}
                      className="elitros-radar-scale"
                    >
                      {level}
                    </text>
                  ))}

                  <polygon points={polygonPoints} className="elitros-radar-polygon" />

                  {radarDimensions.map((dimension, index) => {
                    const point = radarPoint(index, dimension.value);
                    return (
                      <g key={`point-${dimension.code}`}>
                        <circle cx={point.x} cy={point.y} r="6" className="elitros-radar-dot" />
                        <text x={point.x + (index === 4 || index === 5 ? -17 : 13)} y={point.y - 10} className="elitros-radar-value">
                          {dimension.value}
                        </text>
                      </g>
                    );
                  })}

                  {axisLabels.map((label) => (
                    <text
                      key={label.line2}
                      x={label.x}
                      y={label.y}
                      textAnchor={label.anchor}
                      className="elitros-radar-label"
                    >
                      <tspan x={label.x}>{label.line1}</tspan>
                      <tspan x={label.x} dy="20" className="elitros-radar-code">{label.line2}</tspan>
                    </text>
                  ))}
                </svg>
                <figcaption id="radar-caption">
                  La mayor asimetría está entre <strong>Cliente (7)</strong> y <strong>Financiación (3)</strong>. La
                  diferencia de cuatro niveles señala un riesgo concreto: la demanda y la validación comercial pueden
                  avanzar más rápido que la capacidad financiera para sostenerlas.
                </figcaption>
              </figure>

              <div className="elitros-gap-callout">
                <span>Foco inmediato</span>
                <strong>Subir Financiación sin frenar Cliente, y acompañar ese movimiento con Negocio y Equipo.</strong>
              </div>
            </div>

            <aside className="elitros-quick-read" aria-label="Lectura rápida del diagnóstico">
              <p className="elitros-quick-title">Lectura rápida</p>
              {radarDimensions.map((dimension) => (
                <div className="elitros-quick-row" key={`quick-${dimension.code}`}>
                  <div className="elitros-score">{dimension.value}</div>
                  <p>
                    <strong>{dimension.title}</strong>
                    <span>{dimension.summary}</span>
                  </p>
                </div>
              ))}
            </aside>
          </div>

          <div className="elitros-roadmap" aria-labelledby="hitos-title">
            <div className="elitros-roadmap-heading">
              <p>De diagnóstico a herramienta de gestión</p>
              <h3 id="hitos-title">Hitos por eje para llegar al objetivo</h3>
              <p>
                La puntuación actual funciona como línea de base. Para noviembre buscamos una figura más equilibrada,
                aproximadamente 7–8–7–6–7–7; para 2027, 8–9–8–8–8–8. La intención no es “subir números”, sino producir
                evidencia verificable que justifique cada nivel.
              </p>
            </div>

            <div className="elitros-roadmap-grid">
              {roadmapMilestones.map((milestone) => (
                <article className="elitros-milestone-card" key={milestone.code}>
                  <div className="elitros-milestone-top">
                    <div>
                      <span>{milestone.code}</span>
                      <h4>{milestone.title}</h4>
                    </div>
                    <div className="elitros-level-path" aria-label={`${milestone.title}: nivel actual ${milestone.current}, objetivo noviembre ${milestone.november}, objetivo 2027 ${milestone.target}`}>
                      <span><small>Hoy</small>{milestone.current}</span>
                      <b>→</b>
                      <span><small>Nov.</small>{milestone.november}</span>
                      <b>→</b>
                      <span><small>2027</small>{milestone.target}</span>
                    </div>
                  </div>
                  <div className="elitros-milestone-step">
                    <strong>Hito hacia noviembre</strong>
                    <p>{milestone.novemberMilestone}</p>
                  </div>
                  <div className="elitros-milestone-step elitros-milestone-target">
                    <strong>Hito de consolidación 2027</strong>
                    <p>{milestone.targetMilestone}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="elitros-alignment-note">
              <strong>Trabajo de equipo:</strong> estos hitos quedan deliberadamente abiertos a revisión. Pablo, Ale y
              Maxi los irán contrastando con evidencia real y usándolos para alinear qué construir, qué vender, qué
              financiar y qué proteger rumbo a la presentación final de ÉLITROS en noviembre.
            </div>
          </div>

          <div className="elitros-conclusions" aria-labelledby="conclusiones-title">
            <div className="elitros-conclusions-heading">
              <span aria-hidden="true">◎</span>
              <div>
                <p>Lectura aplicada</p>
                <h3 id="conclusiones-title">Conclusiones del análisis para Ø UnderTango Club</h3>
              </div>
            </div>

            <div className="elitros-conclusion-list">
              {conclusions.map((conclusion, index) => (
                <article key={conclusion.title}>
                  <div className="elitros-conclusion-number">{index + 1}</div>
                  <p>
                    <strong>{conclusion.title}</strong> {conclusion.text}
                  </p>
                </article>
              ))}
            </div>

            <div className="elitros-synthesis">
              <strong>Síntesis:</strong> UnderTango ya demostró valor en el mercado. El trabajo de esta herramienta es
              convertir ese valor en una secuencia de hitos coordinados para que cliente, tecnología, negocio,
              financiación, equipo y propiedad intelectual maduren sin dejar brechas que bloqueen el crecimiento.
            </div>
          </div>
        </div>
      </section>

      <section className="elitros-section elitros-shell" aria-labelledby="equipo-title">
        <div className="elitros-section-heading">
          <p>Equipo de Ø UnderTango en ÉLITROS</p>
          <h2 id="equipo-title">Tres perfiles para convertir aprendizaje en operación.</h2>
        </div>
        <div className="elitros-team-grid">
          {team.map((member) => (
            <article className="elitros-profile" key={member.name}>
              <div className="elitros-avatar" aria-hidden="true">{member.name.charAt(0)}</div>
              <h3>{member.name}</h3>
              <p className="elitros-role">{member.role}</p>
              <p>{member.skills}</p>
              <span>Startup vinculada → Ø UnderTango</span>
            </article>
          ))}
        </div>
      </section>

      <section className="elitros-section elitros-dark" aria-labelledby="direccion-title">
        <div className="elitros-shell elitros-direction-grid">
          <div>
            <p className="elitros-eyebrow">Hacia dónde nos dirigimos</p>
            <h2 id="direccion-title">De una operación artística real a una red operativa que pueda probarse.</h2>
            <p className="elitros-dark-lede">
              UnderTango parte de años de producir shows, clases, equipos y relaciones reales. La hipótesis de esta
              etapa es convertir parte de ese conocimiento operativo en una interfaz común donde personas, proyectos,
              capacidades, necesidades y aprendizajes puedan verse y coordinarse mejor.
            </p>
            <p className="elitros-dark-lede">
              La primera prueba es interna: hacer que esta página y los prototipos web/mobile funcionen como una capa
              de sistematización. Después, sumar otras startups de ÉLITROS para observar si la información estructurada
              genera conexiones, colaboración y ayuda concreta antes de intentar construir una red mayor.
            </p>
          </div>

          <div className="elitros-flow elitros-flow-compact" aria-label="Dirección del experimento">
            <div><b>01</b><span>Persona</span><small>Aptitudes, rol y participación.</small></div>
            <div><b>02</b><span>Proyecto</span><small>Qué ofrece, qué necesita y qué valida.</small></div>
            <div><b>03</b><span>Aprendizaje</span><small>Decisiones, evidencia y cambios del modelo.</small></div>
            <div><b>04</b><span>Red</span><small>Conexiones útiles entre personas y proyectos.</small></div>
          </div>
        </div>
      </section>

      <section className="elitros-section elitros-shell elitros-document" aria-labelledby="documento-title">
        <p className="elitros-eyebrow">Modelo de negocio vivo</p>
        <h2 id="documento-title">Ø UnderTango — Modelo de Negocio Vivo</h2>
        <p>
          Después de cada clase, los aprendizajes que cambian nuestra lectura del proyecto se incorporan acá. El
          documento conserva la versión actual del modelo, sus hipótesis, incógnitas críticas y próximas validaciones.
        </p>
        <a href={businessModelDoc} target="_blank" rel="noreferrer" className="elitros-doc-link">
          Abrir Google Doc del modelo de negocio ↗
        </a>
      </section>

      <footer className="elitros-footer">
        <div className="elitros-shell">
          <p>Ø UnderTango · Aprendizaje aplicado · ÉLITROS 2026</p>
          <p className="elitros-disclaimer">
            Los niveles KTH IRL mostrados son una hipótesis de trabajo interna para orientar decisiones y evidencia; no
            constituyen una certificación oficial del modelo. El experimento de red y app es un prototipo de UnderTango
            para explorar colaboración y aprendizaje y no es un producto oficial del programa ÉLITROS.
          </p>
        </div>
      </footer>
    </main>
  );
}
