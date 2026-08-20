import "./elitros.css";

const businessModelDoc =
  "https://docs.google.com/document/d/1s2bI10gDtYp8TjXPduSVDV6EFC-9sVfa724Ev0lvNdE/edit?usp=drivesdk";

const maturityDimensions = [
  {
    code: "TRL",
    title: "Tecnología",
    description: "Madurez técnica de la solución: desde la idea inicial hasta su prueba en operaciones reales.",
  },
  {
    code: "CRL",
    title: "Cliente",
    description: "Comprensión de necesidades, interés real, relaciones establecidas y capacidad de adopción.",
  },
  {
    code: "BRL",
    title: "Modelo de negocio",
    description: "Cómo se captura valor: hipótesis, disposición a pagar, escalabilidad y sostenibilidad.",
  },
  {
    code: "IPRL",
    title: "Propiedad intelectual",
    description: "Identificación, protección y mantenimiento de los activos diferenciales del proyecto.",
  },
  {
    code: "TMRL",
    title: "Equipo",
    description: "Capacidades, roles y organización necesarias para llevar la innovación al mercado.",
  },
  {
    code: "FRL",
    title: "Financiación",
    description: "Recursos y estrategia financiera para sostener las distintas etapas de desarrollo.",
  },
];

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
        <div className="elitros-shell elitros-two-columns">
          <div>
            <p className="elitros-eyebrow">Clase 2 · Madurez de la innovación</p>
            <h2 id="clase-2-title">De la ciencia al mercado: el modelo KTH IRL.</h2>
            <p className="elitros-lede">
              La segunda clase amplía la mirada: la madurez de una innovación no depende solamente de la tecnología.
              El proyecto tiene que evolucionar en seis dimensiones que se condicionan entre sí.
            </p>
            <div className="elitros-test-card">
              <span>Idea central</span>
              <strong>La tecnología es solo una de las seis áreas que deben evolucionar en paralelo.</strong>
              <span>Riesgo a observar</span>
              <strong>Una brecha mayor a tres niveles entre dimensiones puede inhibir el desarrollo.</strong>
            </div>
          </div>

          <div className="elitros-lessons" aria-label="Seis dimensiones del modelo KTH IRL">
            {maturityDimensions.map((dimension) => (
              <p key={dimension.code}>
                <strong>{dimension.code} · {dimension.title}</strong>
                <br />
                {dimension.description}
              </p>
            ))}
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
        </div>
      </footer>
    </main>
  );
}
