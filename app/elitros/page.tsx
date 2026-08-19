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

const lessons = [
  "Un modelo de negocio no es un documento fijo: es una herramienta de decisión que cambia cuando aparece evidencia.",
  "La propuesta de valor necesita un segmento concreto, un pagador identificable y una forma real de llegar a él.",
  "Las promesas deben convertirse en hipótesis que puedan probarse barato antes de invertir fuerte.",
  "La falta de competidores puede ser oportunidad, pero también una señal de mercado inmaduro o de un sustituto ya suficiente.",
  "Alianzas, geografía, timing, costos y adopción cultural pueden cambiar por completo el modelo.",
];

export default function ElitrosPage() {
  return (
    <main className="elitros-page">
      <header className="elitros-hero">
        <div className="elitros-shell">
          <p className="elitros-kicker">Ø UNDERTANGO · ÉLITROS 2026 · EXPERIMENTO ABIERTO</p>
          <h1>Lo que aprendemos tiene que cambiar lo que hacemos.</h1>
          <p className="elitros-lede">
            Este espacio documenta, clase por clase, cómo la formación de ÉLITROS se transforma en decisiones,
            hipótesis, prototipos y evidencia dentro de UnderTango.
          </p>
          <div className="elitros-status-row">
            <span>Módulo 2</span>
            <span>Clase 1</span>
            <span>18 agosto 2026</span>
            <span>Modelo de negocios</span>
          </div>
        </div>
      </header>

      <section className="elitros-section elitros-shell" aria-labelledby="resultado-title">
        <div className="elitros-section-heading">
          <p>Resultado visible</p>
          <h2 id="resultado-title">Lienzo del Modelo de Negocios — Ø UnderTango</h2>
        </div>
        <div className="elitros-canvas-frame">
          <img
            src="/elitros/modelo-negocio-undertango.svg"
            alt="Lienzo del Modelo de Negocios de UnderTango desarrollado a partir del Módulo 2 de ÉLITROS"
            width="1600"
            height="900"
            loading="eager"
          />
        </div>
        <p className="elitros-caption">
          Primera síntesis. No se considera una respuesta definitiva: funciona como mapa para detectar qué sabemos,
          qué suponemos y qué necesitamos validar.
        </p>
      </section>

      <section className="elitros-section elitros-section-soft">
        <div className="elitros-shell elitros-two-columns">
          <div>
            <p className="elitros-eyebrow">Qué se trabajó</p>
            <h2>El canvas fue el punto de partida, no el contenido completo de la clase.</h2>
          </div>
          <div className="elitros-lessons">
            {lessons.map((lesson) => (
              <p key={lesson}>{lesson}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="elitros-section elitros-shell elitros-manifesto" aria-labelledby="undertango-title">
        <p className="elitros-eyebrow">Base operativa de UnderTango</p>
        <h2 id="undertango-title">Partimos de operación real, no de una idea abstracta.</h2>
        <p>
          UnderTango nace de años de producir cultura, shows, clases, equipos y relaciones reales. Esa práctica genera
          repertorio, procesos, problemas, datos y conocimiento operativo. La apuesta de esta etapa es preguntar qué
          parte de ese conocimiento puede convertirse en producto, sistema y red sin perder su origen artístico.
        </p>
        <p>
          Por eso el negocio artístico y la capa tecnológica se alimentan mutuamente: la operación real produce casos
          y evidencia; la tecnología intenta volver esos aprendizajes más visibles, coordinables y replicables.
        </p>
      </section>

      <section className="elitros-section elitros-dark">
        <div className="elitros-shell">
          <p className="elitros-eyebrow">Hacia dónde estamos apuntando</p>
          <h2>La primera tecnologización es esta misma página.</h2>
          <p className="elitros-dark-lede">
            Este subdominio ya funciona como un primer gesto concreto de sistematización. No es solamente una página de
            resumen: es una interfaz mínima para convertir la formación en objetos visibles, compartibles y revisables.
          </p>
          <p className="elitros-dark-lede">
            La dirección que estamos explorando es un prototipo llamado <strong>Experimento de app para ÉLITROS</strong>.
            La hipótesis es sencilla: si estructuramos personas, startups, capacidades, necesidades y aprendizajes en una
            interfaz común, podrían aparecer nuevas formas de colaboración, seguimiento y validación.
          </p>

          <div className="elitros-flow" aria-label="Flujo del experimento">
            <div><b>01</b><span>Persona</span><small>Aptitudes, rol y participación.</small></div>
            <div><b>02</b><span>Startup</span><small>Qué hace, qué ofrece, qué necesita.</small></div>
            <div><b>03</b><span>Aprendizaje</span><small>Módulos, decisiones y evidencia.</small></div>
            <div><b>04</b><span>Red</span><small>Conexiones útiles entre personas y startups.</small></div>
          </div>

          <p className="elitros-note">
            La V1 empieza con tres usuarios internos. Solo después de probar utilidad y comprensión se invitarán otras
            startups del programa. La intención es validar una red antes de construir una red social completa.
          </p>
        </div>
      </section>

      <section className="elitros-section elitros-shell" aria-labelledby="equipo-title">
        <div className="elitros-section-heading">
          <p>Perfiles iniciales</p>
          <h2 id="equipo-title">Tres personas, una startup y una interfaz mínima para probar si esto sirve.</h2>
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

      <section className="elitros-section elitros-section-soft">
        <div className="elitros-shell elitros-next-test">
          <div>
            <p className="elitros-eyebrow">Próximo experimento de red</p>
            <h2>¿Qué ocurre cuando sumamos una segunda startup al sistema?</h2>
            <p>
              Una vez probada la V1 con el equipo de UnderTango, la propuesta es invitar a dos o tres startups de
              ÉLITROS a armar un perfil mínimo con el mismo formato. La pregunta no es cuántos perfiles podemos cargar,
              sino si ver capacidades, necesidades y aprendizaje compartido produce conexiones útiles.
            </p>
          </div>
          <div className="elitros-test-card">
            <span>Hipótesis</span>
            <strong>La información estructurada puede generar colaboración.</strong>
            <span>Señal a observar</span>
            <strong>Contactos, preguntas, coincidencias o ayuda concreta entre equipos.</strong>
          </div>
        </div>
      </section>

      <section className="elitros-section elitros-shell elitros-document" aria-labelledby="documento-title">
        <p className="elitros-eyebrow">Documento vivo</p>
        <h2 id="documento-title">Ø UnderTango — Modelo de Negocio Vivo</h2>
        <p>
          El canvas resume; el documento conserva la lógica que debe revisarse cuando cambien hipótesis, aparezcan
          datos reales o se tome una decisión. Incluye las dos unidades conectadas de UnderTango, el modelo actual,
          incógnitas críticas y la próxima validación.
        </p>
        <a href={businessModelDoc} target="_blank" rel="noreferrer" className="elitros-doc-link">
          Abrir Google Doc del modelo de negocio ↗
        </a>
      </section>

      <footer className="elitros-footer">
        <div className="elitros-shell">
          <p>Ø UnderTango · Experimento de aprendizaje aplicado · ÉLITROS 2026</p>
          <p className="elitros-disclaimer">
            “Experimento de app para ÉLITROS” es un prototipo de UnderTango para explorar colaboración y aprendizaje;
            no es un producto oficial del programa ÉLITROS.
          </p>
        </div>
      </footer>
    </main>
  );
}
