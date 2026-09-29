import Image from "next/image";
import Pitch from "./Pitch";
import OnePager from "./OnePager";
import ReadinessRadar from "./ReadinessRadar";
import { readiness } from "./readiness";
import "./elitros.css";

export const dynamic = "force-dynamic";

const canvas = [
  ["01", "Socios clave", "Artistas, diseñadores, comunicadores, proveedores técnicos, espacios y aliados territoriales. Especialistas del proyecto para acordar contenidos y responsabilidades."],
  ["02", "Actividades clave", "Comprender el objetivo y el público; diseñar eventos, experiencias y comunicación; conformar equipos, coordinar personas y herramientas, producir, ensayar y verificar entregas."],
  ["03", "Recursos clave", "Experiencia en eventos, capacidades artísticas y de diseño, equipos humanos, relaciones de confianza, memoria operativa y herramientas de coordinación."],
  ["04", "Propuesta de valor", "Coordinación humana, artística y comunicacional que cuida la experiencia emocional de una entrega acordada. Buscamos generar emociones positivas y fortalecer los vínculos entre las personas."],
  ["05", "Relación con clientes", "Escucha del objetivo, definición compartida del alcance, comunicación directa, puntos de revisión y evaluación de la entrega y de su llegada al público."],
  ["06", "Canales", "Relaciones directas, referencias de trabajos realizados, eventos, muestras de comunicación y diseño, vínculos con instituciones, equipos de Élitros y aliados."],
  ["07", "Segmentos", "Equipos, empresas e instituciones que necesitan realizar un evento, presentar una idea, comunicar su trabajo o coordinar personas y herramientas para una entrega artística o comunicacional."],
  ["08", "Estructura de costos", "Honorarios del equipo, diseño, ensayos, producción, recursos técnicos y logística según el alcance. Para shows, el modelo suma al caché de cada artista US$25 de producción y US$25 al Fondo de Gobernanza 87ø."],
  ["09", "Fuentes de ingreso", "Honorarios por producción y gerencia de eventos, coordinación humana, comunicación, imagen y diseño. Presupuesto por alcance y entregables, con recursos y plazos acordados."],
] as const;

export default function ElitrosPage() {
  return (
    <main className="elitros-page bmc-page">
      <header className="bmc-topbar">
        <a className="bmc-brand" href="#inicio" aria-label="UnderTango ÉLITROS — inicio"><span>Ø</span> UNDERTANGO</a>
        <nav aria-label="Navegación principal"><a href="#pitch">Pitch</a><a href="#onepager">One-pager</a><a href="#canvas">Canvas</a><a href="#actores">Actores</a><a href="#madurez">Madurez</a><a href="#marco">Marco</a></nav>
        <p>ÉLITROS · 2026</p>
      </header>

      <section className="bmc-hero" id="inicio">
        <div>
          <p className="bmc-eyebrow">ÉLITROS · MODELO VIVO · 23 SEPTIEMBRE 2026</p>
          <h1>Arte, eventos y comunicación <em>para concretar objetivos.</em></h1>
          <p className="bmc-lead">UnderTango organiza equipos humanos y sus herramientas para realizar eventos, comunicar ideas y construir experiencias. Cuidamos lo que el equipo transmite y lo que el público vive: ponemos el arte, la imagen y el diseño al servicio de emociones positivas, recuerdos compartidos y vínculos humanos.</p>
          <a className="bmc-cta" href="#pitch">Ver el pitch <span>↓</span></a>
          <a className="bmc-onepager-link" href="#onepager">Ver one-pager · Septiembre 2026 ↓</a>
          <a className="bmc-onepager-link" href="#canvas">Explorar el modelo ↓</a>
          <a className="bmc-onepager-link" href="/80/vigilancia-tecnologica">Trabajo de vigilancia tecnológica ↗</a>
        </div>
        <aside className="bmc-hero-note"><span>TESIS CENTRAL</span><strong>No existen sistemas sin humanos.</strong><p>La producción de shows es nuestro corazón. Un equipo de desarrollo organiza las herramientas y el sistema de trabajo que la sostienen. Nuestra contribución es humana, artística y comunicacional, en articulación con los especialistas de cada proyecto.</p></aside>
      </section>

      <Pitch />

      <OnePager />

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
        <div className="bmc-heading"><div><p className="bmc-eyebrow">RADAR DE MADUREZ · REFERENCIA KTH · 23/09/2026</p><h2>UnderTango hoy.<br/>Una organización en desarrollo.</h2></div><p>Seis dimensiones en escala 1–9. Autoevaluación interna provisional de nuestra propuesta y la red operativa en desarrollo. Reconoce la experiencia en shows y los pasos que todavía necesitamos validar.</p></div>
        <ReadinessRadar />
        <details className="bmc-radar-evidence"><summary>Evidencia y criterios para revisar los niveles</summary>
          <p><strong>Alcance y criterio.</strong> Los niveles se revisaron con dirección el 23/09/2026: Negocio 5, Cliente 5, Equipo 4, Tecnología 3, Propiedad intelectual 2 y Financiación 2. Son estimaciones internas; no acreditan el cumplimiento completo del modelo KTH. La experiencia de producción artística y las herramientas internas no equivalen a una red operativa terminada ni validada para otros usuarios.</p>
          {readiness.map(item => <div key={item.code}>
            <p><strong>{item.title} · {item.level}/9.</strong> {item.evidence}</p>
            <p><strong>Próximo hito propuesto: {item.next}.</strong> {item.proof}</p>
          </div>)}
          <p><strong>Lectura del gráfico.</strong> Los anillos indican niveles de 1 a 9, no porcentajes. El contorno permite comparar dimensiones; no representa tamaño de empresa, valor económico ni dinero disponible. Cada avance se revisa con evidencia.</p>
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

