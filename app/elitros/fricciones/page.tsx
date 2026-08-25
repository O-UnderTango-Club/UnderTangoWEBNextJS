import type { Metadata } from "next";
import "../elitros.css";
import "../elitros-polish.css";
import "./fricciones.css";

export const metadata: Metadata = {
  title: "Calibración de fricciones relacionales | Ø UnderTango · ÉLITROS",
  description:
    "Experimento de Ø UnderTango en ÉLITROS: perfiles mínimos, señales humanas y una expansión gradual basada en evidencia.",
  alternates: { canonical: "https://elitros.undertangoclub.com/fricciones" },
  openGraph: {
    title: "Calibración de fricciones relacionales | Ø UnderTango",
    description: "Un experimento pequeño para facilitar aproximaciones humanas sin exigir exposición innecesaria.",
    url: "https://elitros.undertangoclub.com/fricciones",
    siteName: "Ø UnderTango · ÉLITROS 2026",
    locale: "es_AR",
    type: "website",
  },
};

const profileFields = [
  { label: "Datos mínimos", text: "Nombre, startup y rol: sólo lo necesario para ubicar a la persona." },
  { label: "Una cara", text: "Una foto de perfil para que el registro no sea una ficha anónima." },
  { label: "Una señal actual", text: "Un enlace de YouTube con la música favorita del momento." },
] as const;

const roles = [
  {
    name: "Pablo Cieslik",
    role: "Base del experimento y full-stack web",
    text: "Arma el formulario, la base de datos y los tres perfiles iniciales. Puede asumir más desarrollo web para que Maxi concentre energía en la aplicación móvil.",
  },
  {
    name: "Alejandro Míguez",
    role: "Invitación y expansión cuidada",
    text: "Define la primera invitación externa de forma elegante, gradual y de bajo riesgo. Su conocimiento presencial del grupo ayuda a elegir a la persona adecuada.",
  },
  {
    name: "Maximiliano Rodríguez",
    role: "Aplicación móvil",
    text: "Cuando la base produzca sustancia, evalúa y pule una aplicación móvil que refleje la experiencia web, con una versión funcional para noviembre.",
  },
] as const;

const steps = [
  { n: "01", title: "Construir el núcleo", text: "Pablo prepara formulario, base de datos y perfiles diferenciados de Pablo, Ale y Maxi." },
  { n: "02", title: "Validar entre tres", text: "El equipo completa el formulario y comprueba que la carga, la visualización y cada perfil funcionen correctamente." },
  { n: "03", title: "Invitar con criterio", text: "Ale selecciona a un representante confiable de otra startup y realiza una invitación personal, clara y sin presión." },
  { n: "04", title: "Aprender antes de ampliar", text: "Se observa qué facilita la interacción, qué incomoda y qué debe ajustarse. Sólo después se incorporan nuevas personas." },
  { n: "05", title: "Preparar la experiencia móvil", text: "Con evidencia y contenido reales, Maxi desarrolla una versión móvil espejo de la web; Pablo sostiene el frente full-stack web." },
] as const;

const milestones = [
  { n: "H1", title: "Núcleo funcionando", metric: "3 de 3", text: "Pablo, Ale y Maxi tienen páginas diferenciadas, completas y operativas." },
  { n: "H2", title: "Primera validación externa", metric: "1 startup", text: "Un representante confiable de otra startup acepta participar y completa el recorrido sin fricciones críticas." },
  { n: "H3", title: "Crecimiento controlado", metric: "+3 personas", text: "Se incorporan al menos tres integrantes adicionales y la experiencia sigue funcionando de forma clara y cuidada." },
  { n: "H4", title: "Aplicación móvil funcional", metric: "1 descarga", text: "La app puede descargarse, abrirse y usarse prolijamente en un teléfono real." },
  { n: "H5", title: "Sistema abierto", metric: "Acceso ampliado", text: "El experimento queda disponible para otras startups de ÉLITROS con un mecanismo de ingreso comprensible." },
  { n: "H6", title: "Recorrido expuesto", metric: "Noviembre 2026", text: "El desarrollo, los aprendizajes y los resultados se presentan en la exposición final del proyecto." },
] as const;

export default function FriccionesPage() {
  return (
    <main className="elitros-page friction-page">
      <header className="elitros-hero friction-hero">
        <div className="elitros-shell">
          <a className="friction-back" href="/">← ÉLITROS · Aprendizaje aplicado</a>
          <p className="elitros-kicker">Ø UNDERTANGO · ÉLITROS 2026 · EXPERIMENTO 01</p>
          <h1>Calibración de fricciones relacionales</h1>
          <p className="elitros-lede">
            Un experimento pequeño para facilitar la aproximación entre personas sin pedir más exposición de la necesaria.
          </p>
          <nav className="elitros-class-index" aria-label="Índice del experimento">
            <a href="#concepto"><small>Por qué</small> Hipótesis</a>
            <a href="#perfil"><small>Qué probamos</small> Perfil mínimo</a>
            <a href="#secuencia"><small>Cómo</small> Secuencia</a>
            <a href="#metricas"><small>Qué cuenta</small> Hitos de éxito</a>
            <a href="#equipo"><small>Quién</small> Responsabilidades</a>
          </nav>
        </div>
      </header>

      <section id="concepto" className="elitros-section elitros-shell elitros-anchor-section" aria-labelledby="concepto-title">
        <div className="friction-concept-grid">
          <div className="elitros-section-heading">
            <p>Hipótesis de diseño</p>
            <h2 id="concepto-title">No toda fricción es mala. La clave es calibrarla.</h2>
          </div>
          <div className="friction-copy">
            <p>
              UnderTango puede entenderse como un sistema de <strong>calibración de fricciones relacionales</strong>:
              observa qué dificulta o facilita la aproximación entre personas y ensaya mediaciones simples para reducir
              el costo social, la exposición y el riesgo innecesario sobre la confianza.
            </p>
            <p>
              Calibrar no significa eliminar todos los límites. Algunas fricciones protegen. El experimento busca detectar
              cuándo una barrera evita una interacción que podría ser valiosa y probar una alternativa de bajo costo.
            </p>
          </div>
        </div>
        <div className="friction-principle">
          <span>Regla de diseño</span>
          <strong>No pedir información porque sí: cada señal debe ayudar a disminuir una fricción concreta.</strong>
        </div>
      </section>

      <section id="perfil" className="elitros-section elitros-section-soft elitros-anchor-section" aria-labelledby="perfil-title">
        <div className="elitros-shell">
          <div className="elitros-section-heading friction-heading-narrow">
            <p>Primer prototipo</p>
            <h2 id="perfil-title">Datos suficientes para ubicarse. Una señal humana para empezar.</h2>
            <p className="elitros-lede">
              Los datos funcionales explican quién es la persona dentro del programa. La música muestra algo de cómo está
              ahora, sin exigir una biografía, una confesión ni una lista de intereses.
            </p>
          </div>
          <div className="friction-profile-demo">
            <div className="friction-demo-card" aria-label="Esquema del perfil experimental">
              <div className="friction-demo-avatar">Ø</div>
              <div>
                <small>PERFIL EXPERIMENTAL</small>
                <h3>Nombre y startup</h3>
                <p>Rol dentro del programa</p>
              </div>
              <div className="friction-music">
                <span>Ahora estoy escuchando…</span>
                <strong>▶ Música favorita del momento</strong>
              </div>
            </div>
            <div className="friction-fields">
              {profileFields.map((field, index) => (
                <article key={field.label}>
                  <span>0{index + 1}</span>
                  <div><strong>{field.label}</strong><p>{field.text}</p></div>
                </article>
              ))}
            </div>
          </div>
          <p className="friction-note">
            La música funciona como señal humana de bajo costo y alta expresividad: puede abrir una conversación sin
            obligar a nadie a iniciarla. En esta etapa no se agregan hobbies, frases ni campos decorativos.
          </p>
        </div>
      </section>

      <section className="elitros-section elitros-shell" aria-labelledby="transversal-title">
        <div className="friction-transversal">
          <div className="elitros-section-heading">
            <p>Una posición transversal</p>
            <h2 id="transversal-title">Pensar fuera de la caja también es una función del sistema.</h2>
          </div>
          <div className="friction-transversal-copy">
            <p>
              Una organización necesita profundidad y continuidad: personas que sostengan cada especialidad, proceso y
              responsabilidad vertical. También necesita coordinación horizontal entre esas áreas.
            </p>
            <p>
              UnderTango propone sumar una tercera mirada: un agente transversal que observe lo implícito, conecte señales
              que suelen quedar separadas y formule hipótesis desde la experiencia. No pretende que todos piensen de ese
              modo; busca demostrar qué resultados concretos aparecen cuando alguien asume esa función.
            </p>
          </div>
          <div className="friction-axis" aria-label="Tres perspectivas complementarias">
            <span><b>Vertical</b>Profundidad y oficio</span><i>+</i><span><b>Horizontal</b>Coordinación entre áreas</span><i>+</i><span className="active"><b>Transversal</b>Lectura de lo implícito</span>
          </div>
        </div>
      </section>

      <section id="secuencia" className="elitros-section elitros-shell elitros-anchor-section" aria-labelledby="secuencia-title">
        <div className="elitros-section-heading friction-heading-narrow">
          <p>Secuencia operativa</p>
          <h2 id="secuencia-title">Primero tres. Después una persona. Recién entonces, ampliar.</h2>
          <p className="elitros-lede">La expansión no es una campaña: es una sucesión de validaciones pequeñas.</p>
        </div>
        <div className="friction-steps">
          {steps.map((step) => (
            <article key={step.n}>
              <span>{step.n}</span><div><h3>{step.title}</h3><p>{step.text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section id="metricas" className="elitros-section friction-dark elitros-anchor-section" aria-labelledby="metricas-title">
        <div className="elitros-shell">
          <div className="elitros-section-heading friction-heading-narrow">
            <p>Métricas de éxito</p>
            <h2 id="metricas-title">El experimento avanza cuando el resultado puede mostrarse.</h2>
            <p className="friction-dark-lede">Cada hito tiene una evidencia simple. Si no puede observarse, todavía es una tarea o una intención.</p>
          </div>
          <div className="friction-milestones">
            {milestones.map((milestone) => (
              <article key={milestone.n}>
                <div><span>{milestone.n}</span><strong>{milestone.metric}</strong></div>
                <h3>{milestone.title}</h3><p>{milestone.text}</p>
              </article>
            ))}
          </div>
          <div className="friction-final-line"><span>HORIZONTE</span><strong>Una aplicación móvil funcional y un recorrido completo para mostrar ante inversores y en la exposición final de noviembre.</strong></div>
        </div>
      </section>

      <section id="equipo" className="elitros-section elitros-shell elitros-anchor-section" aria-labelledby="equipo-title">
        <div className="elitros-section-heading friction-heading-narrow">
          <p>Responsabilidades</p>
          <h2 id="equipo-title">Un reparto que cuida la carga y mantiene el foco.</h2>
        </div>
        <div className="friction-roles">
          {roles.map((person) => (
            <article key={person.name}><span>{person.name.charAt(0)}</span><h3>{person.name}</h3><strong>{person.role}</strong><p>{person.text}</p></article>
          ))}
        </div>
        <div className="friction-next">
          <div><small>SIGUIENTE ACCIÓN</small><h3>Construir y validar los tres perfiles iniciales.</h3></div>
          <p>El primer avance no depende de sumar participantes: depende de que Pablo, Ale y Maxi puedan recorrer una versión completa, diferenciada y confiable.</p>
        </div>
        <div className="friction-future">
          <div>
            <small>LÍNEA FUTURA · SI LA EVIDENCIA ACOMPAÑA</small>
            <h3>Construir la madurez de cada startup de forma gradual.</h3>
          </div>
          <div className="friction-daily-flow" aria-label="Secuencia futura de preguntas diarias">
            <span><b>Días 1–6</b>Una dimensión del radar por día</span>
            <span><b>Días 7–12</b>Un hito de validación por dimensión</span>
            <span><b>Después</b>Canvas gradual, sólo si suma valor</span>
          </div>
          <p>
            Una pregunta breve por día reduce la carga: “¿Qué nivel tecnológico, del 1 al 9, considerás que tiene tu
            startup?”; luego Equipo, Cliente, Negocio, Financiación y Propiedad Intelectual. Al completar el radar, cada
            persona define la evidencia necesaria para alcanzar el nivel siguiente. Con dos casos prolijos —UnderTango y
            una startup invitada— ya existe una demostración concreta para invitar a una tercera.
          </p>
        </div>
      </section>

      <footer className="elitros-footer"><div className="elitros-shell"><p>Ø UnderTango · ÉLITROS 2026 · Calibración de fricciones relacionales</p><p className="elitros-disclaimer">Experimento propio de UnderTango dentro de su proceso de aprendizaje aplicado. No es un producto oficial de ÉLITROS.</p></div></footer>
    </main>
  );
}
