import Image from "next/image";
import "./elitros.css";

const canvas = [
  ["01", "Socios clave", "Artistas validados, proveedores técnicos, estudios contables y fiscales, espacios culturales y aliados territoriales."],
  ["02", "Actividades clave", "Comprensión del problema, diseño de la solución, dirección de proyectos, conformación de equipos, coordinación, ejecución y registro de evidencia."],
  ["03", "Recursos clave", "Marca UnderTango, red global de confianza, criterio de selección, capacidad de gerencia, memoria operativa y herramientas tecnológicas."],
  ["04", "Propuesta de valor", "Una solución gestionada de punta a punta: el equipo adecuado, menos fricción, trazabilidad y un único responsable frente al cliente."],
  ["05", "Relación con clientes", "Acompañamiento consultivo, respuesta rápida, coordinación humana y seguimiento posterior para habilitar recurrencia."],
  ["06", "Canales", "Venta directa B2B, referencias, alianzas con hoteles y productoras, casos documentados y rutas de legitimación fiscal."],
  ["07", "Segmentos", "Personas, empresas e instituciones que necesitan resolver proyectos vinculados con arte, lógica o tecnología. La producción artística es el primer campo de validación."],
  ["08", "Estructura de costos", "Cada artista del equipo UnderTango elige su caché. Por artista y por show sumamos US$50: US$25 para producción y mantenimiento del sistema y US$25 de margen para el Fondo de Gobernanza 87ø."],
  ["09", "Fuentes de ingreso", "Honorarios de dirección y gestión, diseño y ejecución de soluciones, producción artística, desarrollos tecnológicos, auditoría, acompañamiento, márgenes o fees según el proyecto."],
] as const;

const readiness = [
  ["BRL", "Negocio", "En operación", "Servicio vendido. Caché sugerido según mercado y modificable por el artista, más US$25 de producción y US$25 al FDG. Liquidaciones actuales por contrastar."],
  ["CRL", "Cliente", "Ventas y recompra", "10 operaciones realizadas y marcadas pagadas en 8 etiquetas de cliente/lugar: mínimo documentado, no cartera histórica total."],
  ["TMRL", "Equipo", "Equipo activo", "17 personas y 21 participaciones departamentales. Secretaría General incorporada; acuerdos de compromiso en desarrollo."],
  ["TRL", "Tecnología", "Sistema en uso", "Panel y herramientas conectadas usados sobre casos reales. Verificaciones funcionales concretas; desempeño integral por medir."],
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
        <nav aria-label="Navegación principal"><a href="#one-pager">One-pager</a><a href="#canvas">Canvas</a><a href="#actores">Actores</a><a href="#madurez">Madurez</a><a href="#marco">Marco</a></nav>
        <p>ÉLITROS · 2026</p>
      </header>

      <section className="bmc-hero" id="inicio">
        <div>
          <p className="bmc-eyebrow">MÓDULO 2 · MODELO VIVO · 28 AGOSTO 2026</p>
          <h1>Un estudio de <em>arte, tecnología y gestión de proyectos.</em></h1>
          <p className="bmc-lead">UnderTango comprende una necesidad, diseña la solución, conforma el equipo adecuado y dirige su ejecución combinando arte, lógica y tecnología. La producción artística aporta el primer campo de evidencia de este modelo.</p>
          <a className="bmc-cta" href="#canvas">Explorar el modelo <span>↓</span></a>
          <a className="bmc-onepager-link" href="#one-pager">Ver one-pager · Septiembre 2026 ↓</a>
        </div>
        <aside className="bmc-hero-note"><span>TESIS CENTRAL</span><strong>Delegar la complejidad sin convertir la red en costo fijo.</strong><p>El cliente compra una solución y un resultado; la red conserva autonomía; UnderTango captura valor por diseñar, dirigir y coordinar el sistema.</p></aside>
      </section>

      <section className="bmc-onepager" id="one-pager" aria-labelledby="onepager-title">
        <div className="bmc-onepager-sheet">
          <header className="bmc-onepager-header">
            <p className="bmc-onepager-kicker">ONE-PAGER · PROGRAMA ÉLITROS</p>
            <h2 id="onepager-title">UNDERTANGO</h2>
            <p className="bmc-onepager-summary">Gestionamos proyectos de arte y tecnología, coordinando equipos, recursos y entregas.</p>
            <p className="bmc-onepager-meta">Puerto Iguazú, Misiones, Argentina · PROGRAMA ÉLITROS · Septiembre de 2026</p>
          </header>
          <div className="bmc-onepager-grid">
            <article className="bmc-onepager-block">
              <h3>PROBLEMA</h3>
              <p>Según nuestra experiencia, el 70% del esfuerzo de organizar un evento se destina a coordinar personas y recursos técnicos. La falta de experiencia en producción de shows y las fallas de coordinación generan imprevistos y sobrecostos que encarecen el espectáculo y ponen en riesgo su realización. UnderTango combina experiencia de producción y tecnología para anticipar esas fallas y controlar la ejecución transformando los sobrecostos en incremento de calidad.</p>
            </article>
            <article className="bmc-onepager-block">
              <h3>TESIS TECNOLÓGICA Y POR QUÉ AHORA</h3>
              <p>El avance de la IA basada en agentes permite automatizar tareas que antes requerían tiempo y recursos, conectando las necesidades del cliente con las capacidades para resolverlas. UnderTango integra esta tecnología con su experiencia de producción para reducir tiempos de coordinación, anticipar imprevistos y disminuir costos.</p>
            </article>
            <article className="bmc-onepager-block">
              <h3>ESTADO ACTUAL Y TRACCIÓN (TRL/CRL)</h3>
              <p>Tecnología aplicada a la coordinación de shows, con una reducción estimada del 50% en fricción y tiempos, según nuestra experiencia.</p>
              <p>Tracción documentada: Shopping China, shows del 15, 29 y 30/08/2026 realizados y pagados, por USD 600 en total; Wish, BRL 1.500; Festival La Frontera, BRL 2.300. Gran Meliá tiene requisiciones sucesivas en 2026: son evidencia de continuidad comercial, no de cobro por sí solas. El conteo operativo es un mínimo documentado, no toda la trayectoria.</p>
              <p>Evaluamos UnderTango como sistema operativo actual en transición, no como una plataforma hipotética. Tecnología en uso y clientes con recompra: evidencia operativa real. La sección de madurez distingue estos avances de la puntuación KTH, aún pendiente de comprobar por hitos.</p>
            </article>
            <article className="bmc-onepager-block">
              <h3>PROPIEDAD INTELECTUAL</h3>
              <p>Marca Ø UnderTango Club registrada ante el INPI, clase 41. Nº 3.456.539</p>
              <p>Producción de Shows, espectáculos y producciones artística.</p>
            </article>
            <article className="bmc-onepager-block">
              <h3>MERCADO Y MODELO DE NEGOCIO (BRL)</h3>
              <p>Mercado de entrada: hoteles, espacios e instituciones turísticas de la Triple Frontera. Universo de referencia: aproximadamente 390 hoteles y otros alojamientos, pendiente de segmentar según contratación de shows y cuantificar su gasto anual.</p>
              <p>Ingresos por producción y coordinación de espectáculos, con precio por proyecto y contratación recurrente. Expansión prevista mediante equipos, proveedores y representantes en otros destinos.</p>
              <p>El servicio ya se vende y el modelo evoluciona. La adopción del reparto caché + US$50, los costos completos y la sostenibilidad de la expansión aún deben comprobarse antes de cerrar su nivel de madurez.</p>
            </article>
            <article className="bmc-onepager-block">
              <h3>EQUIPO</h3>
              <p>Pablo Cieslik, fundador y director: producción de espectáculos, gerencia de proyectos y desarrollo de herramientas de gestión.</p>
              <p>Alejandro Miguez, representación institucional: exdirector de Ingeniería en Informática y de la Licenciatura en Inteligencia Artificial y Ciencia de Datos de UADE. Trayectoria en tecnología, educación superior y liderazgo de proyectos de I+D.</p>
              <p>Maximiliano Rodríguez: programación y desarrollo tecnológico.</p>
            </article>
            <article className="bmc-onepager-block bmc-onepager-ask">
              <h3>PRÓXIMOS HITOS + ASK</h3>
              <p>Medición: documentar el uso de la tecnología en shows, contrastar la reducción estimada del 50% en tiempos y reevaluar TRL/CRL.</p>
              <p>1. Modelo de negocio: segmentar compradores, medir frecuencia de contratación, costos y margen por show, y probar la repetibilidad con un cliente aliado para revisar BRL.</p>
              <p>2. Marco legal y expansión: resolver titularidad y permisos, responsabilidades, coberturas y cláusulas de no repetición; definir contratos, comisiones y límites de actuación de representantes en otros países.</p>
              <p>3. Etapa posterior: evaluar mecanismos cripto para cobros, pagos y distribución entre participantes, sujetos a utilidad demostrable y revisión legal, fiscal y de riesgos.</p>
              <p>Buscamos hoteles, productoras y organizadores para pilotos; aliados para representación y asesoramiento legal, de seguros y financiero. Financiamiento requerido, costos, plazos y niveles objetivo del radar pendientes de definición.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="bmc-section" id="canvas">
        <div className="bmc-heading"><div><p className="bmc-eyebrow">BUSINESS MODEL CANVAS</p><h2>Nueve bloques, una sola lógica de valor</h2></div><p>Versión de trabajo: cada bloque expresa una hipótesis que debe ganar evidencia en operaciones reales.</p></div>
        <div className="bmc-grid">{canvas.map(([number, title, text], index) => <article key={number} className={`bmc-card bmc-card-${index + 1}`}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="bmc-actors" id="actores">
        <div className="bmc-heading bmc-inverted"><div><p className="bmc-eyebrow">UNIDAD DE TOMA DE DECISIONES</p><h2>El usuario no siempre es quien compra.</h2></div><p>La adopción depende de leer incentivos opuestos y convertir al coordinador en aliado del sistema.</p></div>
        <div className="bmc-actor-flow">
          <article><b>◎</b><span>USUARIO + POSIBLE SABOTAJE</span><h3>Coordinador operativo</h3><p>Sufre WhatsApp, Excel y la coordinación manual, pero puede temer que la solución reemplace su rol. La promesa debe aumentar su control y reconocimiento.</p></article><i>→</i>
          <article><b>$</b><span>AUTORIDAD ECONÓMICA</span><h3>Dueño de la productora</h3><p>Compra por racionalidad financiera: menor costo oculto, menos errores, trazabilidad y capacidad de repetir una operación confiable.</p></article><i>→</i>
          <article><b>↗</b><span>RUTA DE ADOPCIÓN</span><h3>Legitimación técnica y fiscal</h3><p>El canal no es sólo captación: referencias, procesos visibles y documentación convierten confianza en decisión.</p></article>
        </div>
      </section>

      <section className="bmc-economics bmc-fdg" id="fondo-de-gobernanza" aria-labelledby="fdg-title">
        <div className="bmc-fdg-intro">
          <div><p className="bmc-eyebrow">NUESTRO MODELO · UNDERTANGO</p><h2 id="fdg-title">Remunerar al artista.<br/>Sostener el sistema.</h2></div>
          <div><p className="bmc-copy">El artista pertenece al equipo UnderTango y tiene libertad para elegir el caché que considere pertinente. Primero le consultamos cuánto pretende cobrar; a ese importe le sumamos US$50 por artista y por show.</p><p className="bmc-fdg-total"><span>MODELO · POR ARTISTA / SHOW</span><strong>Caché + US$50</strong></p></div>
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
          <p><strong>Alcance y criterio.</strong> Evaluamos el servicio gestionado y el sistema interno de UnderTango, no una aplicación futura. Usamos la edición pública KTH de 2021 como referencia. Recuperamos los niveles anteriores como estimaciones de trabajo (BRL 5, CRL 7, TMRL 4, TRL 6), no como resultados de una validación completa. Para confirmar un nivel deben comprobarse todos sus hitos. «En desarrollo» indica trabajo activo; «por verificar» indica una limitación de esta revisión, no ausencia de actividad.</p>
          <p><strong>Cliente · evidencia.</strong> En el corte de 24 operaciones, 10 figuran realizadas y pagadas en 8 etiquetas de cliente/lugar, no necesariamente 8 entidades jurídicas. Shopping China tiene tres fechas: 15, 29 y 30/08. Las requisiciones sucesivas de Gran Meliá respaldan continuidad comercial, no cobro por sí solas. <strong>Próximo hito:</strong> contrastar decisores, proceso comercial y beneficios observados; no trasladar ventas de shows a demanda de software.</p>
          <p><strong>Negocio · evidencia.</strong> Hay servicios vendidos y repartos históricos. La política actual suma US$25 de producción/mantenimiento y US$25 al FDG sobre el caché elegido por cada artista. <strong>Próximo hito:</strong> conciliar una liquidación del esquema actual con costos completos y respuesta del comprador. Los repartos antiguos no prueban la aplicación de esta política ni su margen efectivo.</p>
          <p><strong>Equipo · evidencia.</strong> Padrón conciliado: 17 personas y 21 participaciones departamentales. Lucila Vizcarra se incorpora a Secretaría General; los compromisos comunes están en desarrollo. <strong>Próximo hito:</strong> confirmar roles, dedicación y acuerdos del núcleo responsable, distinguiéndolo de la red convocable. Una nómina no equivale a contratos firmados.</p>
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
        <div className="bmc-diagnosis-copy"><p>Ya hay servicios realizados, cobros y clientes que vuelven. Shopping China tiene shows pagados el 15, 29 y 30 de agosto; Gran Meliá tiene requisiciones sucesivas. Esa tracción no demuestra todavía la aplicación del nuevo reparto ni cuánto tiempo ahorra el sistema.</p><ul><li><b>✓</b> Separar contratación, facturación y cobro.</li><li><b>✓</b> Medir tiempos, costos y reparto por artista.</li><li><b>✓</b> Revisar cada nivel KTH con evidencia específica.</li></ul></div>
        <div className="bmc-next"><span>PRUEBA PROPUESTA · MVT</span><div><strong>Probar el servicio con un cliente real.</strong><p>MVT significa <i>Minimum Viable Test</i>: una prueba mínima viable. En nuestro caso, coordinar un show, registrar el caché elegido, los gastos, el margen y la respuesta del cliente. Sirve para contrastar el modelo sin construir primero una plataforma nueva.</p></div></div>
      </section>
      <section className="bmc-framework" id="marco" aria-labelledby="framework-title">
        <div className="bmc-framework-intro"><p className="bmc-eyebrow">MARCO DE TRABAJO · VISIÓN → ESTRATEGIA → PRODUCTO</p><h2 id="framework-title">Élitros se prueba a sí mismo.</h2><p>La dirección que UnderTango ya viene construyendo se hace transparente: Élitros no es sólo el caso inicial, sino el entorno donde se valida la primera versión del método.</p></div>
        <figure className="bmc-framework-reference">
          <Image src="/elitros/vision-estrategia-producto-elitros.png" width={1052} height={566} sizes="(max-width: 560px) 100vw, 92vw" alt="Diapositiva ÉLITROS: Visión en la base de la pirámide, historia del modelo de negocio y modelo de tracción a 3 años; Estrategia, identificar lo más riesgoso y formular planes de validación a 3 meses; Producto, construir, medir y aprender en sprints Lean de 3 semanas. Fuente: Ash Maurya." />
          <figcaption>Guía de ÉLITROS · Fuente indicada en la diapositiva: Ash Maurya. Horizontes orientativos; se ajustan al aprendizaje del proyecto.</figcaption>
        </figure>
        <figure className="bmc-framework-reference" id="plan-undertango">
          <Image src="/elitros/plan-startup-undertango.png" width={1672} height={941} sizes="(max-width: 560px) 100vw, 92vw" alt="Plan de Startup Ø UnderTango. Producto, 3 semanas: construir una app mínima de hipótesis, experimentos, evidencia y decisiones; medir tiempo de registro, ciclos completados y decisiones con evidencia; aprender si mejora la validación. Estrategia, 3 meses: probar el propio proceso en Élitros, comparar con el registro actual y contrastar con otros participantes. Riesgos: confundir utilidad interna con demanda externa y construir funciones antes de probar su valor. Visión, 3 años: un estudio escalable que resuelve proyectos con arte, lógica y tecnología; validar casos resueltos, recurrencia y margen. Autorreferencialidad como guía y norte. Hipótesis y métricas propuestas, todavía sin resultados validados." />
          <figcaption>Aplicación a Startup Ø UnderTango · Plan de validación propuesto a partir del modelo y del experimento propio en Élitros. <a href="/elitros/plan-startup-undertango.png" target="_blank" rel="noopener noreferrer">Abrir lámina completa ↗</a></figcaption>
        </figure>
        <aside className="bmc-framework-signal"><span>SEÑAL DE RUMBO</span><strong>Autorreferencialidad</strong><p>Startup Ø UnderTango usará su propio proceso en Élitros como primer experimento de la app de validación primaria que viene tomando forma. La evidencia de ese uso orientará las siguientes decisiones; la validación con otros usuarios seguirá siendo necesaria.</p></aside>
        <div className="bmc-horizons">
          <article><span>HORIZONTE ORIENTATIVO · 3 AÑOS</span><h3>Visión</h3><p>Convertir la experiencia operativa de UnderTango en una plataforma de producción gestionada que permita a redes culturales coordinar talento, operaciones y evidencia con autonomía, trazabilidad y menor fricción.</p></article>
          <article><span>HORIZONTE ORIENTATIVO · 3 MESES</span><h3>Estrategia</h3><p>Usar Élitros como laboratorio real: consolidar un flujo de validación primaria, observar dónde se pierde tiempo o control y convertir las decisiones repetidas en hipótesis medibles antes de escalar desarrollo.</p></article>
          <article><span>HORIZONTE ORIENTATIVO · 3 SEMANAS</span><h3>Producto</h3><p>Probar una app mínima de validación primaria dentro de Élitros. Debe registrar una operación, sus supuestos, la evidencia obtenida y el próximo experimento; el resultado buscado es aprendizaje verificable, no automatización completa.</p></article>
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

