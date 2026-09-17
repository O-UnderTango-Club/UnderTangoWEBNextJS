import "./pitch.css";

export default function Pitch() {
  return (
    <section className="bmc-pitch" id="pitch" aria-labelledby="pitch-title">
      <header className="bmc-pitch-heading">
        <div><p className="bmc-eyebrow">COMUNICACIÓN EFECTIVA · PLAN DE PITCHEO</p><h2 id="pitch-title">UnderTango, en tres minutos.</h2></div>
        <p>Aplicación de la guía de ÉLITROS a nuestro proyecto: a quién hablamos, qué buscamos y cómo lo contamos.</p>
      </header>

      <dl className="bmc-pitch-meta">
        <div><dt>Emprendimiento</dt><dd>Startup Ø UnderTango</dd></div>
        <div><dt>Duración propuesta</dt><dd>3 minutos</dd></div>
        <div><dt>Versión del plan</dt><dd><time dateTime="2026-09-17">17 de septiembre de 2026</time></dd></div>
      </dl>

      <div className="bmc-pitch-plan">
        <article>
          <span className="bmc-pitch-label">01 · AUDIENCIA</span>
          <h3>Quienes nos escuchan</h3>
          <p>Mentores y evaluadores de ÉLITROS, junto con potenciales aliados de hoteles, productoras y espacios culturales. Necesitan comprender el problema, la evidencia disponible y el siguiente paso de validación.</p>
        </article>
        <article>
          <span className="bmc-pitch-label">02 · OBJETIVO</span>
          <h3>Qué buscamos lograr</h3>
          <p>Conseguir una reunión de trabajo con un hotel o una productora para acordar un piloto medible, y vincularnos con aliados que acompañen la validación técnica y del modelo de negocio.</p>
        </article>
        <article className="bmc-pitch-value">
          <span className="bmc-pitch-label">03 · PROPUESTA DE VALOR</span>
          <h3>Ayudamos a… para que… de esta forma…</h3>
          <p><strong>Ayudamos a hoteles, productoras y organizadores</strong> a realizar sus proyectos artísticos con un responsable de la coordinación, para que puedan concentrarse en la experiencia de su público. Comprendemos la necesidad, armamos el equipo y dirigimos la ejecución, apoyados en herramientas de gestión, IA y registro de evidencia.</p>
        </article>
      </div>

      <div className="bmc-pitch-body">
        <aside className="bmc-pitch-support" aria-label="Material que sostiene el pitch">
          <article>
            <h3>Nuestra identidad</h3>
            <p>Un estudio de arte, tecnología y gestión de proyectos. La producción artística es nuestro primer campo de evidencia; Élitros es el laboratorio donde hacemos explícito y probamos el método.</p>
          </article>
          <article>
            <h3>Evidencias técnicas y de demanda</h3>
            <p><strong>Operación:</strong> shows realizados y pagados en Shopping China, Wish y Festival La Frontera; requisiciones sucesivas de Gran Meliá como evidencia de continuidad comercial.</p>
            <p><strong>Tecnología:</strong> panel y herramientas conectadas usados en casos reales. El ahorro de tiempo y el desempeño integral siguen por medir.</p>
            <a href="#one-pager">Ver casos y cifras del one-pager ↗</a>
            <a href="/elitros/sistema-de-herramientas">Ver el sistema de herramientas ↗</a>
          </article>
          <article>
            <h3>La confianza</h3>
            <p>Pablo Cieslik en dirección y producción, Alejandro Miguez en representación institucional y Maximiliano Rodríguez en desarrollo tecnológico. Casos documentados y responsabilidades identificables.</p>
          </article>
          <article>
            <h3>La conexión emocional</h3>
            <p>Que el organizador pueda recibir a su público, que el artista pueda concentrarse en su trabajo y que la coordinación acompañe esa experiencia.</p>
          </article>
        </aside>

        <div className="bmc-pitch-script" aria-labelledby="pitch-script-title">
          <header>
            <p className="bmc-pitch-label">GUION · TIEMPOS ORIENTATIVOS</p>
            <h3 id="pitch-script-title">Coordinar la producción para que el arte suceda.</h3>
          </header>
          <article>
            <div className="bmc-pitch-step"><h4>Apertura</h4><span>0:00–0:35 · El problema</span></div>
            <p>Falta una hora para el show. El organizador busca una confirmación entre mensajes, el artista espera indicaciones y el equipo técnico necesita saber qué está acordado. El talento está; la información, dispersa. Cada duda puede convertirse en una demora o un costo imprevisto. Ese es el problema que abordamos desde UnderTango: coordinar personas, recursos y decisiones para que el espectáculo pueda suceder.</p>
          </article>
          <article>
            <div className="bmc-pitch-step"><h4>Desarrollo</h4><span>0:35–2:30 · Solución y evidencia</span></div>
            <p>Somos un estudio de arte, tecnología y gestión de proyectos. Ayudamos a hoteles, productoras y organizadores a llevar una necesidad a la ejecución: diseñamos la propuesta, conformamos el equipo y dirigimos el trabajo con un responsable frente al cliente.</p>
            <p>Combinamos experiencia de producción con un panel de gestión, herramientas conectadas y asistencia de IA. El sistema permite seguir tareas, acuerdos y evidencia. El coordinador conserva la dirección y las decisiones; la tecnología lo acompaña.</p>
            <p>Ya hay servicios realizados y pagados, como los shows de Shopping China, Wish y Festival La Frontera. Las requisiciones sucesivas de Gran Meliá muestran continuidad comercial. Estos antecedentes prueban actividad y demanda del servicio; todavía debemos medir cuánto tiempo ahorra el sistema y bajo qué condiciones se puede repetir.</p>
            <p>Ingresamos por producción, coordinación y gestión de proyectos. Nuestro mercado de entrada es la Triple Frontera. En Élitros usamos nuestra propia operación como laboratorio: registramos lo que hacemos, contrastamos resultados y convertimos ese aprendizaje en mejoras. Pablo Cieslik aporta dirección y producción; Alejandro Miguez, representación institucional; y Maximiliano Rodríguez, desarrollo tecnológico.</p>
          </article>
          <article className="bmc-pitch-close">
            <div className="bmc-pitch-step"><h4>Cierre</h4><span>2:30–3:00 · El siguiente paso</span></div>
            <p>Buscamos un hotel o una productora con quien acordar un piloto. Proponemos coordinar un show y medir tiempos, costos, incidencias y respuesta del cliente. La invitación es a una reunión para definir esa prueba y sus criterios de evaluación. Queremos que organizar un espectáculo deje más tiempo para el arte y para quienes vienen a vivirlo.</p>
          </article>
        </div>
      </div>
      <p className="bmc-pitch-note">Plan preparado para ensayo. La apertura describe una situación ilustrativa. Los tiempos son orientativos y el piloto es una propuesta; las estimaciones de ahorro se mantienen sujetas a medición.</p>
    </section>
  );
}
