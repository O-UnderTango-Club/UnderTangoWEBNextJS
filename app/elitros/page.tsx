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
  ["BRL", "Negocio", "5", "Servicio vendido. Caché libre + US$25 de producción + US$25 al FDG: política definida; liquidaciones por contrastar."],
  ["CRL", "Cliente", "7", "Ventas y recompra comprobadas: 10 operaciones pagadas en 8 clientes/lugares, como mínimo documentado."],
  ["TMRL", "Equipo", "4", "17 personas, 21 participaciones departamentales y Secretaría General incorporada. Compromisos por formalizar."],
  ["TRL", "Tecnología", "6", "Sistema coordinado en uso: panel, Supabase y herramientas conectadas. Pruebas funcionales; desempeño integral por medir."],
  ["IPRL", "Propiedad intelectual", "—", "Marca, código y materiales identificados. Titularidad, licencias y permisos de imagen por verificar en conjunto."],
  ["FRL", "Financiación", "—", "FDG 0.2 en preparación. Antecedente del primer fondo informado por dirección; capital actual por verificar."],
] as const;

// One data source for both the graphic and its explanations. Unknowns are not zero.
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
              <p>Evaluamos UnderTango como sistema operativo actual en transición, no como una plataforma hipotética. Estimaciones de trabajo: TRL 6 / CRL 7; sujetas a contrastar todos los hitos KTH.</p>
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
              <p>BRL 5 estimado: el servicio ya se vende y el modelo evoluciona. La adopción del reparto caché + US$50, los costos completos y la sostenibilidad de la expansión aún deben comprobarse.</p>
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
        <div className="bmc-heading"><div><p className="bmc-eyebrow">RADAR KTH · REVISIÓN 12/09/2026</p><h2>UnderTango hoy.<br/>Un sistema en transición.</h2></div><p>Servicio, equipo y herramientas que ya operan. Cuatro estimaciones provisionales y dos ejes con evidencia pendiente. Falta documentar no significa que no exista; tampoco permite certificar un nivel.</p></div>
        <div className="bmc-radar-layout"><figure className="bmc-current-radar">
          <svg viewBox="0 0 460 440" role="img" aria-labelledby="radar-title radar-desc">
            <title id="radar-title">UnderTango actual: evaluación provisional de madurez</title>
            <desc id="radar-desc">Negocio 5, Cliente 7, Equipo 4 y Tecnología 6: estimaciones provisionales en escala de 1 a 9. Propiedad intelectual y Financiación revisadas sin puntaje suficiente. No se dibuja un polígono cerrado ni se convierten los datos faltantes en ceros.</desc>
            <text x="230" y="25" textAnchor="middle" fontSize="17" fontWeight="700">UNDERTANGO · HOY</text>
            <text x="230" y="47" textAnchor="middle" fontSize="12">Servicio y sistema operativo en transición</text>
            {[1,3,5,7,9].map(level => <g key={level}><polygon points={readiness.map((_, axis) => radarPoint(axis, level).join(",")).join(" ")} fill="none" stroke="#d3d7cd"/><text x="236" y={225-level*15+4} fontSize="10" fill="#626a61">{level}</text></g>)}
            {readiness.map(([code,title,value],axis) => {
              const [x,y] = radarPoint(axis,9);
              const [lx,ly] = radarPoint(axis,11);
              const scored = value !== "—";
              const [px,py] = radarPoint(axis,scored ? Number(value) : 9);
              return <g key={code}><line x1="230" y1="225" x2={x} y2={y} stroke="#c2c9bd" strokeDasharray={scored ? undefined : "3 4"}/>{scored && <><line x1="230" y1="225" x2={px} y2={py} stroke="#344b38" strokeWidth="3"/><circle cx={px} cy={py} r="7" fill="#344b38" stroke="white" strokeWidth="2"/></>}<text x={lx} y={ly} textAnchor="middle" fontSize="12" fontWeight="700">{code} · {scored ? value : "S/P"}</text><text x={lx} y={ly+16} textAnchor="middle" fontSize="10">{title === "Propiedad intelectual" ? "Prop. intelectual" : title}</text></g>;
            })}
            <text x="230" y="425" textAnchor="middle" fontSize="11">● Estimación provisional · S/P: sin puntaje</text>
          </svg>
          <figcaption>Elaboración propia con referencia al <a href="https://kthinnovationreadinesslevel.com/wp-content/uploads/sites/9/2021/02/KTH-Innovation-Readiness-Level_Compiled.pdf" target="_blank" rel="noreferrer">modelo KTH</a>. No es una evaluación emitida por KTH.</figcaption>
        </figure><div className="bmc-readiness">{readiness.map(([code, title, value, text]) => <article key={code}><div aria-label={value === "—" ? "Sin puntaje: evidencia pendiente" : `Nivel ${value} estimado`}>{value}</div><section><span>{code} · {value === "—" ? "EVIDENCIA PENDIENTE" : "ESTIMADO"}</span><h3>{title}</h3><p>{text}</p>{code === "TRL" && <a className="bmc-tools-link" href="/elitros/sistema-de-herramientas">Ver el sistema de herramientas →</a>}{code === "TMRL" && <a className="bmc-tools-link" href="https://www.undertangoclub.com/central">Ver equipo y departamentos →</a>}{code === "FRL" && <a className="bmc-tools-link" href="/elitros/funcionamiento-del-fdg">Funcionamiento del FDG →</a>}</section></article>)}</div></div>
        <details className="bmc-radar-evidence"><summary>Evidencia revisada y próximos hitos por dimensión</summary>
          <p><strong>Alcance.</strong> Servicio artístico gestionado y sistema interno de UnderTango al 12/09/2026. No calificamos como terminadas las futuras apps ni extrapolamos la tracción de shows a otros productos. Usamos la edición pública KTH de 2021 como referencia: los números son hipótesis de evaluación, no niveles certificados. Para confirmar un nivel hay que contrastar todos sus hitos.</p>
          <p><strong>Cliente · 7 provisional.</strong> 24 operaciones registradas: 10 realizadas y marcadas pagadas en 8 etiquetas de cliente/lugar. Shopping China contrató los shows del 15, 29 y 30/08. La Cabrera tiene un cobro registrado, pero su operación aún figura «Confirmada»: no se suma a los 10 realizados y pagados. El siguiente hito es contrastar el proceso comercial, los decisores y la repetibilidad; no equiparar ventas existentes con crecimiento escalable.</p>
          <p><strong>Negocio · 5 provisional.</strong> Hay precios cobrados y distribuciones reales. Pablo define para todos los shows un caché sugerido según mercado, modificable por el artista, más US$50 por artista: US$25 de producción y mantenimiento y US$25 al FDG. Los registros históricos revisados usan repartos distintos: no prueban la aplicación del nuevo esquema. Falta conciliar liquidaciones y costos completos antes de afirmar rentabilidad o subir el nivel.</p>
          <p><strong>Equipo · 4 provisional.</strong> Padrón conciliado en Supabase y Central: 17 personas y 21 participaciones. Dirección general, perfiles artísticos y técnicos y Secretaría General identificados; Marketing figura vacante. La formalización de compromisos está en preparación. Para sostener 5 hay que confirmar dedicación, roles y acuerdos de participación del núcleo, no sólo contar integrantes. Una nómina no equivale a contratos firmados.</p>
          <p><strong>Tecnología · 6 provisional.</strong> Herramientas utilizadas sobre casos reales. La actualización de Equipo dejó un recibo verificable y pasó pruebas de validación, duplicados, concurrencia e idempotencia. Es evidencia funcional acotada, no una auditoría de todo el sistema. Antes de sostener 7 faltan criterios de aceptación y mediciones integrales de carga, seguridad, interacción y continuidad; no damos por comprobado un ahorro porcentual de tiempo.</p>
          <p><strong>Propiedad intelectual · sin puntaje.</strong> Se reconocen marca, código, método y materiales. Falta reunir documentos de titularidad, licencias y permisos, incluyendo el uso de imagen previsto en el contrato. La existencia de una marca no acredita control de todos los activos. Esta revisión no determina su situación jurídica.</p>
          <p><strong>Financiación · sin puntaje.</strong> Pablo informa que el primer fondo cerró cumpliendo objetivos y con ganancias para sus inversores: antecedente declarado, no cierre documental verificado en esta revisión. FDG 0.2 es una etapa distinta. Los aportes planificados encontrados siguen pendientes; no se cuentan como capital recibido. Falta conciliar el cierre anterior y definir necesidades, plazos, fuentes y recursos efectivamente comprometidos del nuevo ciclo.</p>
          <p>Los dos ejes sin puntaje no valen cero y no se ubican en el nivel 9. Por eso el gráfico no dibuja un área cerrada ni calcula un promedio.</p>
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

