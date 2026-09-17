import Image from "next/image";
import Pitch from "./Pitch";
import "./elitros.css";

const canvas = [
  ["01", "Socios clave", "Artistas, diseñadores, comunicadores, proveedores técnicos, espacios y aliados territoriales. Especialistas del proyecto para acordar contenidos y responsabilidades."],
  ["02", "Actividades clave", "Comprender el objetivo y el público; diseñar eventos, experiencias y comunicación; conformar equipos, coordinar personas y herramientas, producir, ensayar y verificar entregas."],
  ["03", "Recursos clave", "Experiencia en eventos, capacidades artísticas y de diseño, equipos humanos, relaciones de confianza, memoria operativa y herramientas de coordinación."],
  ["04", "Propuesta de valor", "La coordinación humana, artística y comunicacional necesaria para una entrega acordada. Un sistema de trabajo usado en eventos, con responsables, ensayos, seguimiento y registro."],
  ["05", "Relación con clientes", "Escucha del objetivo, definición compartida del alcance, comunicación directa, puntos de revisión y evaluación de la entrega y de su llegada al público."],
  ["06", "Canales", "Relaciones directas, referencias de trabajos realizados, eventos, muestras de comunicación y diseño, vínculos con instituciones, equipos de Élitros y aliados."],
  ["07", "Segmentos", "Equipos, empresas e instituciones que necesitan realizar un evento, presentar una idea, comunicar su trabajo o coordinar personas y herramientas para una entrega artística o comunicacional."],
  ["08", "Estructura de costos", "Honorarios del equipo, diseño, ensayos, producción, recursos técnicos y logística según el alcance. Para shows, el modelo suma al caché de cada artista US$25 de producción y US$25 al Fondo de Gobernanza 87ø."],
  ["09", "Fuentes de ingreso", "Honorarios por producción y gerencia de eventos, coordinación humana, comunicación, imagen y diseño. Presupuesto por alcance y entregables, con recursos y plazos acordados."],
] as const;

const readiness = [
  ["BRL", "Negocio", "En operación", "Producción de shows vendida y sistema de coordinación en uso. El esquema caché + US$50 corresponde a shows; la oferta de comunicación y diseño se acuerda por alcance."],
  ["CRL", "Cliente", "Ventas y recompra", "10 operaciones realizadas y marcadas pagadas en 8 etiquetas de cliente/lugar: mínimo documentado, no cartera histórica total."],
  ["TMRL", "Equipo", "Equipo activo", "20 personas articuladas en 10 departamentos, según la actualización de dirección del 17/09/2026. Roles, dedicación y acuerdos de compromiso por documentar."],
  ["TRL", "Tecnología", "Sistema en uso", "Herramientas digitales al servicio de la coordinación humana en casos reales. Desempeño integral y transferencia a otros equipos por medir."],
  ["IPRL", "Propiedad intelectual", "Marca documentada", "Título INPI de marca clase 41 a nombre de Pablo Cieslik. Derechos sobre código, materiales e imagen en desarrollo."],
  ["FRL", "Financiación", "Antecedente documentado", "Registros de aportes y repartos del fondo anterior. FDG 0.2 en desarrollo; cierre histórico y recursos actuales por conciliar."],
] as const;

// Previous working estimates, not confirmed KTH levels. Null is never plotted as zero.
const radarLevels: Record<string, number | null> = { BRL: 5, CRL: 7, TMRL: 4, TRL: 6, IPRL: 4, FRL: 3 };
const radarPoint = (axis: number, level: number) => {
  const angle = (-90 + axis * 60) * Math.PI / 180;
  return [230 + Math.cos(angle) * level * 15, 225 + Math.sin(angle) * level * 15];
};

export default function ElitrosPage() {
  return (
    <main className="elitros-page bmc-page">
      <header className="bmc-topbar">
        <a className="bmc-brand" href="#inicio" aria-label="UnderTango ÉLITROS — inicio"><span>Ø</span> UNDERTANGO</a>
        <nav aria-label="Navegación principal"><a href="#pitch">Pitch</a><a href="#one-pager">One-pager</a><a href="#canvas">Canvas</a><a href="#actores">Actores</a><a href="#madurez">Madurez</a><a href="#marco">Marco</a></nav>
        <p>ÉLITROS · 2026</p>
      </header>

      <section className="bmc-hero" id="inicio">
        <div>
          <p className="bmc-eyebrow">ÉLITROS · MODELO VIVO · 17 SEPTIEMBRE 2026</p>
          <h1>Arte, eventos y comunicación <em>para concretar objetivos.</em></h1>
          <p className="bmc-lead">UnderTango organiza equipos humanos y sus herramientas para realizar eventos, comunicar ideas y construir experiencias. Ponemos el arte, la imagen y el diseño al servicio de una entrega concreta y de las personas a las que debe llegar.</p>
          <a className="bmc-cta" href="#pitch">Ver el pitch <span>↓</span></a>
          <a className="bmc-onepager-link" href="#one-pager">Ver one-pager · Septiembre 2026 ↓</a>
          <a className="bmc-onepager-link" href="#canvas">Explorar el modelo ↓</a>
        </div>
        <aside className="bmc-hero-note"><span>TESIS CENTRAL</span><strong>No existen sistemas sin humanos.</strong><p>El 81 es nuestro corazón: produce y coordina shows. El 80 organiza el sistema de trabajo. Nuestra contribución es humana, artística y comunicacional, en articulación con los especialistas de cada proyecto.</p></aside>
      </section>

      <Pitch />

      <section className="bmc-onepager" id="one-pager" aria-labelledby="onepager-title">
        <div className="bmc-onepager-sheet">
          <header className="bmc-onepager-header">
            <p className="bmc-onepager-kicker">ONE-PAGER · PROGRAMA ÉLITROS</p>
            <h2 id="onepager-title">UNDERTANGO</h2>
            <p className="bmc-onepager-summary">Coordinamos personas y herramientas para realizar eventos, comunicar ideas y dar forma a su imagen y diseño.</p>
            <p className="bmc-onepager-meta">Puerto Iguazú, Misiones, Argentina · PROGRAMA ÉLITROS · Septiembre de 2026</p>
          </header>
          <div className="bmc-onepager-grid">
            <article className="bmc-onepager-block">
              <h3>PROBLEMA</h3>
              <p>Una idea valiosa necesita un equipo que se entienda y una forma de encontrarse con su público. Acuerdos dispersos, responsabilidades poco claras o una comunicación que no conecta pueden dificultar ese encuentro. En eventos, presentaciones y acciones de comunicación, esa dimensión humana requiere tanto trabajo como la realización material.</p>
            </article>
            <article className="bmc-onepager-block">
              <h3>TESIS HUMANA Y TECNOLÓGICA</h3>
              <p>No existen sistemas sin humanos. Combinamos escucha, criterio artístico, diseño y producción con herramientas digitales que conservan acuerdos, responsables y avances. La automatización y la IA acompañan tareas de organización; el equipo define el sentido, toma decisiones y se hace cargo de la entrega.</p>
            </article>
            <article className="bmc-onepager-block">
              <h3>ESTADO ACTUAL Y TRACCIÓN (TRL/CRL)</h3>
              <p>Nuestro campo de mayor experiencia es la producción y gerencia de eventos. El sistema de coordinación se usa y se pone a prueba allí: equipos, recursos técnicos, cambios, ensayos y entregas frente a un público.</p>
              <p>Tracción documentada: Shopping China, shows del 15, 29 y 30/08/2026 realizados y pagados, por USD 600 en total; Wish, BRL 1.500; Festival La Frontera, BRL 2.300. Gran Meliá tiene requisiciones sucesivas en 2026: son evidencia de continuidad comercial, no de cobro por sí solas. El conteo operativo es un mínimo documentado, no toda la trayectoria.</p>
              <p>Estos casos sostienen nuestra experiencia de ejecución y coordinación. La eficacia de una nueva intervención de comunicación, diseño o trabajo con otro equipo debe evaluarse según su objetivo y su público. El ahorro de tiempo y el impacto no se presentan como porcentajes comprobados.</p>
            </article>
            <article className="bmc-onepager-block">
              <h3>PROPIEDAD INTELECTUAL</h3>
              <p>Marca Ø UnderTango Club registrada ante el INPI, clase 41. Nº 3.456.539</p>
              <p>Producción de shows, espectáculos y producciones artísticas.</p>
            </article>
            <article className="bmc-onepager-block">
              <h3>MERCADO Y MODELO DE NEGOCIO (BRL)</h3>
              <p>Base de actividad: producción de shows y eventos en la Triple Frontera. La oferta se dirige a equipos e instituciones que requieren coordinación humana, comunicación, imagen o diseño para una entrega concreta: un evento, una presentación, una experiencia de divulgación o materiales para llegar a un público.</p>
              <p>Ingresos por producción y gerencia de eventos y por servicios de comunicación, imagen, diseño y coordinación, con presupuesto según alcance, equipo, recursos y entregables. La dirección y validación científica o técnica permanecen en los especialistas del proyecto.</p>
              <p>La producción artística tiene ventas y recompra. La demanda y las condiciones de trabajo con otros equipos se validan caso a caso. El modelo económico de shows se detalla por separado; cada servicio necesita costos completos y criterios propios.</p>
            </article>
            <article className="bmc-onepager-block">
              <h3>EQUIPO</h3>
              <p>Pablo Cieslik, fundador y director: producción de espectáculos, gerencia de eventos y coordinación humana, artística y comunicacional.</p>
              <p>Alejandro Miguez, representación institucional: exdirector de Ingeniería en Informática y de la Licenciatura en Inteligencia Artificial y Ciencia de Datos de UADE. Trayectoria en tecnología, educación superior y liderazgo de proyectos de I+D.</p>
              <p>Maximiliano Rodríguez: programación y desarrollo de herramientas. El departamento 80 articula estas capacidades con la experiencia de producción del 81.</p>
            </article>
            <article className="bmc-onepager-block bmc-onepager-ask">
              <h3>PRÓXIMOS HITOS + ASK</h3>
              <p>1. Acordar una intervención: objetivo, público, entrega, responsables, recursos, plazos y criterios de aceptación. Puede ser un evento, una presentación o un trabajo de comunicación, imagen y diseño.</p>
              <p>2. Evaluar la ejecución y la comunicación: cumplimiento de lo acordado, incidencias, participación, comprensión del mensaje y devolución del público o del equipo, según lo que corresponda al caso.</p>
              <p>3. Sostener el modelo: contrastar costos y margen, documentar permisos y responsabilidades y acordar las condiciones con artistas, proveedores y aliados. Los aspectos legales, de cobertura y de representación internacional siguen en desarrollo.</p>
              <p>Línea económica posterior: evaluar mecanismos cripto para cobros, pagos y distribución, sujetos a utilidad demostrable y revisión legal, fiscal y de riesgos.</p>
              <p>Buscamos equipos con una necesidad concreta de coordinación humana, eventos o comunicación, y aliados que nos acerquen a ellos. En Élitros queremos conectar estos recursos artísticos con proyectos científicos y tecnológicos. Financiamiento y metas de expansión pendientes de definición.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="bmc-section" id="canvas">
        <div className="bmc-heading"><div><p className="bmc-eyebrow">BUSINESS MODEL CANVAS</p><h2>Nueve bloques, una sola lógica de valor</h2></div><p>Versión de trabajo: cada bloque expresa una hipótesis que debe ganar evidencia en operaciones reales.</p></div>
        <div className="bmc-grid">{canvas.map(([number, title, text], index) => <article key={number} className={`bmc-card bmc-card-${index + 1}`}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="bmc-actors" id="actores">
        <div className="bmc-heading bmc-inverted"><div><p className="bmc-eyebrow">RESPONSABILIDADES Y DESTINATARIOS</p><h2>Cada parte aporta su conocimiento.</h2></div><p>Acordamos cómo se relacionan quienes conocen el proyecto, quienes coordinan la entrega y las personas a las que debe llegar.</p></div>
        <div className="bmc-actor-flow">
          <article><b>◎</b><span>OBJETIVO Y CONOCIMIENTO</span><h3>Equipo impulsor</h3><p>Define el objetivo, aporta el conocimiento del proyecto y valida sus contenidos. Sus especialistas conservan las decisiones científicas y técnicas; su responsable acuerda alcance y recursos.</p></article><i>→</i>
          <article><b>Ø</b><span>COORDINACIÓN Y REALIZACIÓN</span><h3>UnderTango</h3><p>Diseña y coordina la dimensión humana, artística y comunicacional acordada: personas, herramientas, mensajes, imagen, ensayos y realización. Da seguimiento hasta verificar la entrega.</p></article><i>→</i>
          <article><b>↗</b><span>ENCUENTRO E IMPACTO</span><h3>Público y participantes</h3><p>Sus necesidades orientan el lenguaje, los formatos y la experiencia. Su participación y sus devoluciones ayudan a evaluar si lo realizado fue comprensible, útil y significativo.</p></article>
        </div>
      </section>

      <section className="bmc-economics bmc-fdg" id="fondo-de-gobernanza" aria-labelledby="fdg-title">
        <div className="bmc-fdg-intro">
          <div><p className="bmc-eyebrow">MODELO ECONÓMICO PARA SHOWS</p><h2 id="fdg-title">Remunerar al artista.<br/>Sostener el sistema.</h2></div>
          <div><p className="bmc-copy">En la producción de shows, cada artista del equipo UnderTango elige el caché que considere pertinente. A ese importe le sumamos US$50 por artista y por show. Para comunicación, diseño u otras entregas acordamos un presupuesto específico.</p><p className="bmc-fdg-total"><span>MODELO · POR ARTISTA / SHOW</span><strong>Caché + US$50</strong></p></div>
        </div>
        <div className="bmc-numbers">
          <div><small>01 · REMUNERACIÓN ARTÍSTICA</small><strong>Caché libre</strong><p>Lo define el artista del equipo UnderTango. Producción y margen se suman por encima: no se descuentan de su remuneración.</p></div>
          <div><small>02 · PRODUCCIÓN Y SISTEMA</small><strong>US$25</strong><p>Para gastos de producción y mantenimiento de todo el sistema de UnderTango.</p></div>
          <div className="bmc-fdg-margin"><small>03 · MARGEN DE LA EMPRESA</small><strong>US$25</strong><p>Destinados directamente al <b>Fondo de Gobernanza 87ø (FDG)</b>. Este margen se distingue de la remuneración del artista y de los gastos de producción.</p><a className="bmc-fdg-link" href="https://undertangoclub.com/87">Funcionamiento del FDG →</a></div>
        </div>
        <p className="bmc-fdg-note">Ejemplo: si el artista elige un caché de US$100, la base resulta US$100 + US$25 + US$25 = US$150. Los US$100 son un ejemplo, no un caché obligatorio. Los adicionales son importes fijos, no porcentajes. El modelo no representa cobros realizados ni saldo disponible en el FDG.</p>
      </section>

      <section className="bmc-section" id="madurez">
        <div className="bmc-heading"><div><p className="bmc-eyebrow">RADAR DE MADUREZ · REFERENCIA KTH · 12/09/2026</p><h2>UnderTango hoy.<br/>Operación real, evolución activa.</h2></div><p>Seis dimensiones en escala 1–9. Autoevaluación interna provisional, adaptada a nuestra operación actual; no acredita el cumplimiento completo de los hitos KTH. La evidencia y los próximos pasos se detallan abajo.</p></div>
        <div className="bmc-radar-layout"><figure className="bmc-current-radar">
          <svg viewBox="0 0 460 455" role="img" aria-labelledby="radar-title radar-desc">
            <title id="radar-title">Radar UnderTango: niveles provisionales en escala del 1 al 9</title>
            <desc id="radar-desc">Negocio 5, Cliente 7, Equipo 4, Tecnología 6, Propiedad intelectual 4 y Financiación 3. Seis estimaciones internas provisionales, no niveles KTH acreditados.</desc>
            <text x="230" y="25" textAnchor="middle" fontSize="17" fontWeight="700">UNDERTANGO · HOY</text>
            <text x="230" y="47" textAnchor="middle" fontSize="12">Escala 1–9 · niveles provisionales</text>
            {Array.from({length:9},(_,i)=>i+1).map(level => <g key={level}><polygon points={readiness.map((_,axis)=>radarPoint(axis,level).join(",")).join(" ")} fill="none" stroke="#d3d7cd" strokeWidth={level === 9 ? 1.5 : 0.8}/><text x="239" y={225-level*15+4} fontSize="10" fill="#626a61">{level}</text></g>)}
            <polygon points={readiness.flatMap(([code],axis)=>radarLevels[code] === null ? [] : [radarPoint(axis,radarLevels[code] as number).join(",")]).join(" ")} fill="#24566c" fillOpacity="0.12" stroke="#24566c" strokeWidth="2.5" strokeDasharray="5 3"/>
            {readiness.map(([code,title],axis) => {
              const [x,y] = radarPoint(axis,9);
              const [lx,ly] = radarPoint(axis,11);
              const level = radarLevels[code];
              const point = level === null ? null : radarPoint(axis,level);
              return <g key={code}><line x1="230" y1="225" x2={x} y2={y} stroke="#c2c9bd"/>{point && <circle cx={point[0]} cy={point[1]} r="6" fill="white" stroke="#24566c" strokeWidth="2.5"/>}<text x={lx} y={ly} textAnchor="middle" fontSize="12" fontWeight="700">{code} · {level ?? "S/P"}</text><text x={lx} y={ly+16} textAnchor="middle" fontSize="10">{title === "Propiedad intelectual" ? "Prop. intelectual" : title}</text></g>;
            })}
            <text x="230" y="442" textAnchor="middle" fontSize="11">○ Estimación interna provisional · no acreditada</text>
          </svg>
          <figcaption>Elaboración propia con referencia al <a href="https://kthinnovationreadinesslevel.com/wp-content/uploads/sites/9/2021/02/KTH-Innovation-Readiness-Level_Compiled.pdf" target="_blank" rel="noreferrer">modelo KTH</a>. No es una evaluación emitida por KTH.</figcaption>
        </figure><div className="bmc-readiness">{readiness.map(([code, title, status, text]) => <article key={code}><div aria-hidden="true">•</div><section><span>{code} · {status}</span><h3>{title}</h3><p>{text}</p>{code === "TRL" && <a className="bmc-tools-link" href="/elitros/sistema-de-herramientas">Ver el sistema de herramientas →</a>}{code === "TMRL" && <a className="bmc-tools-link" href="https://www.undertangoclub.com/central">Ver equipo y departamentos →</a>}{code === "FRL" && <a className="bmc-tools-link" href="/elitros/funcionamiento-del-fdg">Funcionamiento del FDG →</a>}</section></article>)}</div></div>
        <details className="bmc-radar-evidence"><summary>Evidencia revisada y próximos hitos por dimensión</summary>
          <p><strong>Alcance y criterio.</strong> Evaluamos la producción de eventos y el sistema interno de coordinación humana de UnderTango. Los resultados en ese campo no acreditan capacidad científica ni la eficacia de cualquier intervención externa. Usamos la edición pública KTH de 2021 como referencia. Recuperamos los niveles anteriores como estimaciones de trabajo (BRL 5, CRL 7, TMRL 4, TRL 6), no como resultados de una validación completa. Para confirmar un nivel deben comprobarse todos sus hitos. «En desarrollo» indica trabajo activo; «por verificar» indica una limitación de esta revisión, no ausencia de actividad.</p>
          <p><strong>Cliente · evidencia.</strong> En el corte de 24 operaciones, 10 figuran realizadas y pagadas en 8 etiquetas de cliente/lugar, no necesariamente 8 entidades jurídicas. Shopping China tiene tres fechas: 15, 29 y 30/08. Las requisiciones sucesivas de Gran Meliá respaldan continuidad comercial, no cobro por sí solas. <strong>Próximo hito:</strong> contrastar decisores, proceso comercial y beneficios observados; distinguir la demanda comprobada de shows de la demanda por nuevas intervenciones de comunicación, imagen y diseño.</p>
          <p><strong>Negocio · evidencia.</strong> Hay servicios vendidos y repartos históricos. La política actual suma US$25 de producción/mantenimiento y US$25 al FDG sobre el caché elegido por cada artista. <strong>Próximo hito:</strong> conciliar una liquidación del esquema actual con costos completos y respuesta del comprador. Los repartos antiguos no prueban la aplicación de esta política ni su margen efectivo.</p>
          <p><strong>Equipo · evidencia.</strong> La dirección informa 20 personas articuladas en 10 departamentos al 17/09/2026. Los compromisos comunes están en desarrollo. <strong>Próximo hito:</strong> actualizar el padrón y confirmar roles, dedicación y acuerdos del núcleo responsable, distinguiéndolo de la red convocable. Una nómina no equivale a contratos firmados.</p>
          <p><strong>Tecnología · evidencia.</strong> Panel y herramientas usados en casos reales. El flujo de actualización de Equipo tiene recibo auditado y pruebas de validación, duplicados, concurrencia e idempotencia. <strong>Próximo hito:</strong> comprobar el recorrido integral y sus requisitos de rendimiento, seguridad y continuidad. Las pruebas de un flujo no equivalen a una auditoría de todo el sistema ni a un ahorro de tiempo medido.</p>
          <p><strong>Propiedad intelectual · evidencia.</strong> Se revisó el título INPI de marca mixta, clase 41, registro 3.456.539, a favor de Pablo Guillermo Cieslik, concedido en 2023. No se consultó el estado registral actual. <strong>En desarrollo:</strong> derechos sobre código, método, materiales y uso de imagen. <strong>Próximo hito:</strong> vincular cada activo con titularidad y permisos; el título de marca no acredita el control del conjunto.</p>
          <p><strong>Financiación · evidencia.</strong> La planilla histórica del FDI contiene registros de aportes, reinversiones y cálculos de repartos. Dirección informa que el fondo anterior cerró con ganancias para sus inversores; esta revisión no concilió ese cierre individualmente. El estatuto de 2025 es provisional. <strong>En desarrollo:</strong> FDG 0.2. <strong>Próximo hito:</strong> verificar el cierre histórico y separar presupuesto, compromisos y recursos disponibles del nuevo ciclo. Aportes pendientes no son caja; un estatuto no demuestra ejecución de mecanismos financieros o constitución societaria.</p>
          <p><strong>IPRL · estimación interna 4/9.</strong> Existe un título de marca para el servicio artístico: protección materializada en un activo clave, no solamente una idea. Esto sustenta nuestra estimación, pero no demuestra una estrategia integral ni el control de código, método, materiales e imagen. Faltan el inventario por activo, acuerdos y contraste completo de hitos; no se afirma un IPRL 4 KTH validado.</p>
          <p><strong>FRL · estimación interna 3/9.</strong> El negocio está descrito y hay registros de financiación inicial utilizada, aportes y repartos del fondo anterior. Se reconoce esa experiencia de UnderTango, no una ronda nueva ya financiada. Esta adaptación no equipara los aportes con los importes o tipos de financiación del marco original. Para revisar el puntaje: conciliar el cierre anterior y documentar presupuesto, fuentes y calendario del FDG 0.2; para avanzar, un plan de financiación de 12–18 meses.</p>
          <p><strong>Lectura del gráfico.</strong> Los anillos indican una escala del 1 al 9, no porcentajes. Los seis puntos huecos y el contorno discontinuo representan estimaciones internas provisionales. El área permite comparar dimensiones, no acredita hitos ni representa dinero disponible. No se calcula un promedio. La validación completa permanece abierta.</p>
        </details>
      </section>

      <section className="bmc-diagnosis">
        <div><p className="bmc-eyebrow">PRÓXIMA VALIDACIÓN</p><h2>Medir lo que ya hacemos.</h2></div>
        <div className="bmc-diagnosis-copy"><p>Los eventos realizados y las nuevas contrataciones sostienen nuestra experiencia. El próximo paso es registrar también cómo funcionan la comunicación y el trabajo humano: si los acuerdos se entienden, la entrega se cumple y la experiencia llega a su público.</p><ul><li><b>✓</b> Acordar objetivo, público y entrega.</li><li><b>✓</b> Registrar plazos, costos, cambios y responsabilidades.</li><li><b>✓</b> Evaluar comprensión, participación y devolución.</li></ul></div>
        <div className="bmc-next"><span>PRUEBA PROPUESTA · MVT</span><div><strong>Una entrega concreta, un público definido.</strong><p>MVT significa <i>Minimum Viable Test</i>: una prueba mínima viable. Proponemos acordar un evento, una presentación o una acción de comunicación; documentar la organización y evaluar lo realizado con el equipo y su público. Se eligen los indicadores antes de empezar y se registra lo aprendido.</p></div></div>
      </section>
      <section className="bmc-framework" id="marco" aria-labelledby="framework-title">
        <div className="bmc-framework-intro"><p className="bmc-eyebrow">MARCO DE TRABAJO · VISIÓN → ESTRATEGIA → PRODUCTO</p><h2 id="framework-title">Aplicar, observar y ajustar.</h2><p>Nuestra propia participación en Élitros permite ensayar cómo nos organizamos, presentamos lo que hacemos y recogemos devoluciones. Esa experiencia orienta el trabajo; cada nueva colaboración necesita sus propios acuerdos y evaluación.</p></div>
        <figure className="bmc-framework-reference">
          <Image src="/elitros/vision-estrategia-producto-elitros.png" width={1052} height={566} sizes="(max-width: 560px) 100vw, 92vw" alt="Diapositiva ÉLITROS: Visión en la base de la pirámide, historia del modelo de negocio y modelo de tracción a 3 años; Estrategia, identificar lo más riesgoso y formular planes de validación a 3 meses; Producto, construir, medir y aprender en sprints Lean de 3 semanas. Fuente: Ash Maurya." />
          <figcaption>Guía de ÉLITROS · Fuente indicada en la diapositiva: Ash Maurya. Horizontes orientativos; se ajustan al aprendizaje del proyecto.</figcaption>
        </figure>
        <details className="bmc-framework-archive">
          <summary>Antecedente del proceso · plan anterior de la app de validación</summary>
          <p>Esta lámina conserva una etapa previa de trabajo. El enfoque actual se desarrolla en el pitch y en los horizontes que siguen: coordinación humana, eventos y comunicación, con herramientas al servicio de cada entrega.</p>
        <figure className="bmc-framework-reference" id="plan-undertango">
          <Image src="/elitros/plan-startup-undertango.png" width={1672} height={941} sizes="(max-width: 560px) 100vw, 92vw" alt="Plan de Startup Ø UnderTango. Producto, 3 semanas: construir una app mínima de hipótesis, experimentos, evidencia y decisiones; medir tiempo de registro, ciclos completados y decisiones con evidencia; aprender si mejora la validación. Estrategia, 3 meses: probar el propio proceso en Élitros, comparar con el registro actual y contrastar con otros participantes. Riesgos: confundir utilidad interna con demanda externa y construir funciones antes de probar su valor. Visión, 3 años: un estudio escalable que resuelve proyectos con arte, lógica y tecnología; validar casos resueltos, recurrencia y margen. Autorreferencialidad como guía y norte. Hipótesis y métricas propuestas, todavía sin resultados validados." />
          <figcaption>Aplicación a Startup Ø UnderTango · Plan de validación propuesto a partir del modelo y del experimento propio en Élitros. <a href="/elitros/plan-startup-undertango.png" target="_blank" rel="noopener noreferrer">Abrir lámina completa ↗</a></figcaption>
        </figure>
        </details>
        <aside className="bmc-framework-signal"><span>SEÑAL DE RUMBO</span><strong>Autorreferencialidad</strong><p>Aplicamos el sistema a nuestra propia organización: prepararnos, coordinarnos, comunicar y registrar lo aprendido. Las herramientas se ajustan a ese trabajo. Lo observado internamente sirve para mejorar y formular nuevas pruebas con otros equipos.</p></aside>
        <div className="bmc-horizons">
          <article><span>HORIZONTE ORIENTATIVO · 3 AÑOS</span><h3>Visión</h3><p>Consolidar una forma de coordinar personas y herramientas desde el arte, los eventos, la comunicación, la imagen y el diseño, para que más proyectos puedan encontrarse con las personas y realizar el aporte que buscan.</p></article>
          <article><span>HORIZONTE ORIENTATIVO · 3 MESES</span><h3>Estrategia</h3><p>Documentar el sistema probado en eventos y acordar intervenciones de comunicación o coordinación con otros equipos. Observar qué se puede transferir, qué debe adaptarse y cómo se verifica la entrega y su llegada al público.</p></article>
          <article><span>HORIZONTE ORIENTATIVO · 3 SEMANAS</span><h3>Producto</h3><p>Preparar y realizar una entrega acotada: un encuentro, una presentación o una pieza de comunicación. Definir objetivo, público, responsables y herramientas; ensayar, recoger devoluciones y dejar un registro para la próxima intervención.</p></article>
        </div>
      </section>
      <section className="bmc-team" aria-labelledby="team-title"><div><p className="bmc-eyebrow">EQUIPO</p><h2 id="team-title">Integrantes de Startup Ø UnderTango</h2></div><ul><li>Alejandro Míguez</li><li>Maxi Rodríguez</li><li>Pablo Cieslik</li></ul></section>
      <footer className="bmc-footer">
        <p><span>Ø</span> UnderTango Club · ÉLITROS 2026</p>
        <a href="/elitros/Undertango_Validation_Blueprint.pdf" download="Undertango_Validation_Blueprint.pdf">
          PDF histórico · radar anterior ↓
        </a>
        <p>Modelo vivo — se actualiza con evidencia.</p>
      </footer>
    </main>
  );
}

