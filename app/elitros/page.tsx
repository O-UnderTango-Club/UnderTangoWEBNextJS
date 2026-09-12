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
  ["08", "Estructura de costos", "Modelo objetivo por artista y por show: US$100 para el artista y US$25 para producción y mantenimiento del sistema. Los US$25 restantes de la base de US$150 son margen, no costo."],
  ["09", "Fuentes de ingreso", "Honorarios de dirección y gestión, diseño y ejecución de soluciones, producción artística, desarrollos tecnológicos, auditoría, acompañamiento, márgenes o fees según el proyecto."],
] as const;

const readiness = [
  ["BRL", "Negocio", "4", "Costos, ingresos y equilibrio modelados en tres escenarios."],
  ["CRL", "Cliente", "3", "Primer feedback construido desde el coordinador y sus dolores."],
  ["TMRL", "Equipo", "4", "Champion comprometido y competencias iniciales mapeadas."],
  ["TRL", "Tecnología", "2", "Concepto formulado; falta evidencia experimental."],
  ["IPRL", "Propiedad intelectual", "2", "Activos y desafíos normativos iniciales identificados."],
  ["FRL", "Financiación", "2", "Hipótesis temprana de bajo CAPEX y bootstrap."],
] as const;

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
          <h1>De capacidades dispersas a un <em>estudio escalable de resolución y gestión de proyectos.</em></h1>
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
              <p>Tracción: Shopping China, tres shows realizados y cobrados por USD 1.200; Wish, BRL 1.500; Festival La Frontera, BRL 2.300; Gran Meliá Iguazú, shows recurrentes y ARS 9,47 millones facturados entre enero y junio de 2026; Ofi/Vitento, shows y registro audiovisual durante tres días por USD 3.600.</p>
              <p>Radar de partida: TRL 2 / CRL 3, pendiente de reevaluación con evidencia de uso y contrataciones.</p>
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
              <p>Radar de partida: BRL 4. Ejes de avance: validar frecuencia de compra, costos y margen por show, repetibilidad del servicio y condiciones de contratación y representación en cada país.</p>
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
          <div><p className="bmc-copy">Nuestro modelo objetivo parte de una distribución por artista y por show: remuneración artística, gastos de producción y mantenimiento del sistema, y margen de la empresa destinado al Fondo de Gobernanza 87ø (FDG).</p><p className="bmc-fdg-total"><span>BASE DEL MODELO · POR ARTISTA / SHOW</span><strong>US$150</strong></p></div>
        </div>
        <div className="bmc-numbers">
          <div><small>01 · REMUNERACIÓN ARTÍSTICA</small><strong>US$100</strong><p>Para el artista por su participación en el show. Producción y margen se suman por encima: no se descuentan de estos US$100.</p></div>
          <div><small>02 · PRODUCCIÓN Y SISTEMA</small><strong>US$25</strong><p>Para gastos de producción y mantenimiento de todo el sistema de UnderTango.</p></div>
          <div className="bmc-fdg-margin"><small>03 · MARGEN DE LA EMPRESA</small><strong>US$25</strong><p>Destinados directamente al <b>Fondo de Gobernanza 87ø (FDG)</b>. Este margen se distingue de la remuneración del artista y de los gastos de producción.</p></div>
        </div>
        <p className="bmc-fdg-note">US$100 + US$25 + US$25 = US$150 por artista y por show. Son importes, no porcentajes sobre el total. Es nuestro modelo objetivo; no representa cobros realizados ni saldo disponible en el FDG.</p>
      </section>

      <section className="bmc-section" id="madurez">
        <div className="bmc-heading"><div><p className="bmc-eyebrow">RADAR KTH · LÍNEA DE BASE</p><h2>Negocio y equipo avanzan. Tecnología y fondeo deben alcanzarlos.</h2></div><p>Una diferencia de más de 2–3 niveles puede inhibir el avance coordinado del proyecto.</p></div>
        <div className="bmc-radar-layout"><figure><Image src="/elitros/radar_undertango_v1.png" width={615} height={592} sizes="(max-width: 900px) 100vw, 50vw" alt="Radar KTH: BRL 4, CRL 3, TMRL 4, TRL 2, IPRL 2 y FRL 2" priority/><figcaption>Fuente: KTH Innovation Readiness Level Model Framework.</figcaption></figure><div className="bmc-readiness">{readiness.map(([code, title, value, text]) => <article key={code}><div>{value}</div><section><span>{code}</span><h3>{title}</h3><p>{text}</p></section></article>)}</div></div>
      </section>

      <section className="bmc-diagnosis">
        <div><p className="bmc-eyebrow">DIAGNÓSTICO CRÍTICO</p><h2>La próxima inversión no es software: es evidencia.</h2></div>
        <div className="bmc-diagnosis-copy"><p>La asimetría confirma una etapa inicial típica: <strong>BRL 4 y TMRL 4</strong> superan a <strong>TRL 2 y FRL 2</strong>. Avanzar directo a desarrollo técnico ampliaría la brecha y el costo fijo antes de validar el mecanismo.</p><ul><li><b>✓</b> Ejecutar contrataciones reales con operación manual.</li><li><b>✓</b> Medir tiempo ahorrado, errores, margen y repetición.</li><li><b>✓</b> Convertir esa evidencia en requisitos de producto.</li></ul></div>
        <div className="bmc-next"><span>PRÓXIMO HITO</span><strong>Diseñar y ejecutar un MVT manual de baja fidelidad con una productora real.</strong></div>
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
          Descargar el PDF ↓
        </a>
        <p>Modelo vivo — se actualiza con evidencia.</p>
      </footer>
    </main>
  );
}

