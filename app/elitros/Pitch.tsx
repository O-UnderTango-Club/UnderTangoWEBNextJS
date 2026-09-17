import "./pitch.css";

export default function Pitch() {
  return (
    <section className="bmc-pitch" id="pitch" aria-labelledby="pitch-title">
      <header className="bmc-pitch-heading">
        <div>
          <p className="bmc-eyebrow">ÉLITROS · GERENCIA DE PROYECTOS · DEPARTAMENTO 80</p>
          <h2 id="pitch-title">No existen sistemas sin humanos.</h2>
        </div>
        <p>UnderTango es una forma de pensar y de abordar proyectos. Organizamos personas, decisiones y herramientas para llegar a un resultado concreto.</p>
      </header>

      <dl className="bmc-pitch-meta">
        <div><dt>Emprendimiento</dt><dd>Startup Ø UnderTango</dd></div>
        <div><dt>Duración propuesta</dt><dd>3 minutos · con pausas</dd></div>
        <div><dt>Versión del plan</dt><dd><time dateTime="2026-09-17">17 de septiembre de 2026</time></dd></div>
      </dl>

      <div className="bmc-pitch-plan">
        <article>
          <span className="bmc-pitch-label">01 · AUDIENCIA</span>
          <h3>Quienes nos escuchan</h3>
          <p>Equipos científicos y tecnológicos de Élitros, mentores, aceleradoras y fondos de inversión. Personas que desarrollan proyectos, los acompañan o invierten en ellos y necesitan llevar sus objetivos a la práctica.</p>
        </article>
        <article>
          <span className="bmc-pitch-label">02 · OBJETIVO</span>
          <h3>Qué buscamos lograr</h3>
          <p>Abrir una conversación con un equipo que necesite mejorar su gerencia o resolver una entrega específica. Acordar un objetivo, un alcance y una forma de trabajar; recibir presentaciones a proyectos donde podamos aportar y construir vínculos entre arte y tecnología.</p>
        </article>
        <article className="bmc-pitch-value">
          <span className="bmc-pitch-label">03 · PROPUESTA DE VALOR</span>
          <h3>Personas que se organizan. Proyectos que avanzan.</h3>
          <p><strong>Ayudamos a equipos a convertir un objetivo en un entregable concreto.</strong> Comprendemos el problema, articulamos las capacidades necesarias, definimos responsabilidades y dirigimos la ejecución. Aportamos experiencia artística, lógica humana y herramientas digitales para trabajar con claridad, cuidado y ritmo.</p>
          <p>El trabajo se acuerda por proyecto: alcance, entregables, plazos, criterios de aceptación y honorarios de gerencia.</p>
        </article>
      </div>

      <div className="bmc-pitch-organism" aria-label="La organización que sostiene la propuesta">
        <article><span>81</span><h3>El corazón</h3><p>Producción y coordinación de shows. Personas, recursos e imprevistos que hay que resolver para salir a escena.</p></article>
        <article><span>80</span><h3>La gerencia y el sistema</h3><p>Documentación, programación y seguimiento. La experiencia se convierte en acuerdos claros, herramientas y memoria de trabajo.</p></article>
        <article><span>10 / 20</span><h3>Departamentos / personas</h3><p>Una organización en actividad que conecta producción, música, formación, comunicación, finanzas y otras capacidades.</p><a href="https://www.undertangoclub.com/central">Conocer los departamentos ↗</a></article>
      </div>

      <div className="bmc-pitch-body">
        <div className="bmc-pitch-script" aria-labelledby="pitch-script-title">
          <header>
            <p className="bmc-pitch-label">GUION PARA PRESENTAR · TIEMPOS ORIENTATIVOS</p>
            <h3 id="pitch-script-title">UnderTango es una forma de pensar.</h3>
          </header>
          <article>
            <div className="bmc-pitch-step"><h4>Apertura</h4><span>0:00–0:25 · La premisa</span></div>
            <p>No existen sistemas sin humanos. Un proyecto puede tener talento, tecnología y recursos, y aun así trabarse: una decisión pendiente, una responsabilidad que nadie asumió, una conversación que no ocurrió. En UnderTango trabajamos ahí, donde las personas necesitan organizarse para que algo suceda.</p>
          </article>
          <article>
            <div className="bmc-pitch-step"><h4>Una organización viva</h4><span>0:25–1:25 · Identidad y evidencia</span></div>
            <p>Soy Pablo Cieslik. UnderTango es una forma de pensar y de abordar proyectos. Somos 20 personas articuladas en 10 departamentos. Hoy les hablamos desde el departamento 80, que reúne gerencia de proyectos, documentación y programación.</p>
            <p>Nuestro corazón es el 81: produce y coordina shows constantemente en la Triple Frontera. En un espectáculo hay una hora de salida a escena, personas que deben encontrarse y un resultado que tiene que suceder. En Wish resolvimos un cambio de elenco y la coordinación técnica y logística: el show se realizó. En Shopping China entregamos tres shows durante agosto y el cliente volvió a contratarnos. Sabemos coordinar porque lo hacemos.</p>
          </article>
          <article>
            <div className="bmc-pitch-step"><h4>El método y el aporte humano</h4><span>1:25–2:15 · Cómo trabajamos</span></div>
            <p>El 80 toma esa experiencia y la convierte en un método: entender el objetivo, definir un entregable, reunir al equipo, asignar responsables, seguir los avances y comprobar el resultado. Usamos herramientas digitales para que los acuerdos, las decisiones y lo aprendido queden disponibles y el equipo pueda avanzar.</p>
            <p>Desde el arte aportamos escucha, ensayo, presencia y capacidad de responder a lo inesperado. También humor, emociones, cariño y cuidado. Romper el hielo permite hablar; hablar con claridad permite decidir. Buscamos equipos que trabajen con confianza, lógica y ritmo, que resuelvan a tiempo y se cuiden mientras lo hacen.</p>
          </article>
          <article className="bmc-pitch-close">
            <div className="bmc-pitch-step"><h4>La propuesta y la invitación</h4><span>2:15–3:00 · Un siguiente paso concreto</span></div>
            <p>A los equipos científicos y tecnológicos de Élitros, y a quienes invierten en ellos, les proponemos trabajar sobre un objetivo concreto: ordenar la gerencia de un proyecto o acompañar una entrega. Acordamos alcance, responsables, plazo y una forma de verificar el resultado. Ofrecemos dirección y seguimiento, con honorarios por proyecto según el trabajo acordado.</p>
            <p>Si tienen un proyecto que necesita avanzar, o conocen un equipo que podría necesitar esta ayuda, conversemos. Y si quieren explorar el vínculo entre arte y tecnología, mantengamos el contacto. UnderTango está vivo. No existen sistemas sin humanos.</p>
          </article>
        </div>

        <aside className="bmc-pitch-support" aria-label="Material que sostiene el pitch">
          <article>
            <h3>Nuestra identidad</h3>
            <p>UnderTango está vivo: gerenciamos nuestros propios proyectos y aprendemos de lo que ocurre al realizarlos. Desde el departamento 80 ponemos esa experiencia al servicio de otros equipos.</p>
            <a href="https://www.undertangoclub.com/80-startup-undertango">Conocer el departamento 80 ↗</a>
          </article>
          <article>
            <h3>Hechos que sostienen el relato</h3>
            <p><strong>Resolver un imprevisto.</strong> Wish, 23/08/2026: cambio de elenco, coordinación técnica y logística; show realizado.</p>
            <p><strong>Sostener entregas.</strong> Shopping China, 15, 29 y 30/08/2026: tres shows realizados y pagados. Una relación que se sostiene con nuevas contrataciones.</p>
            <p><strong>Conservar acuerdos y decisiones.</strong> Panel operativo y herramientas conectadas en uso para organizar tareas, responsables, estados y evidencia.</p>
            <a href="/elitros/sistema-de-herramientas">Ver cómo se organiza el sistema ↗</a>
          </article>
          <article>
            <h3>La confianza</h3>
            <p>Pablo Cieslik en dirección y gerencia; Alejandro Miguez en representación institucional; Maximiliano Rodríguez en desarrollo tecnológico. Responsables identificables y trabajo documentado.</p>
            <p>Acordamos qué hay que entregar, quién se hace cargo, para cuándo y cómo se comprueba. Ante un cambio, comunicamos su efecto y decidimos con el equipo.</p>
          </article>
          <article>
            <h3>El arte en la forma de trabajar</h3>
            <p>Escuchar antes de resolver. Ensayar y ajustar. Romper el hielo con humor. Dar lugar a las emociones, al cariño y al cuidado. Conversar de forma clara y directa para decidir y avanzar.</p>
            <p>La lógica ordena el trabajo; la confianza permite que las personas participen, propongan y pidan ayuda a tiempo.</p>
          </article>
          <article>
            <h3>La conexión con tecnología</h3>
            <p>KinesioLabs es una primera vinculación tecnológica en desarrollo: necesidad relevada y presupuesto enviado. El alcance y las condiciones siguen por acordar.</p>
            <a href="https://www.undertangoclub.com/kinesiolabs">Ver el estado de KinesioLabs ↗</a>
          </article>
        </aside>
      </div>

      <footer className="bmc-pitch-footer">
        <p><strong>Para conversar:</strong> traé un objetivo, una entrega pendiente o un equipo al que podamos ayudar. Definimos juntos el primer paso.</p>
        <p className="bmc-pitch-note">Guion de 338 palabras para ensayar. Los tiempos son orientativos. Los casos del 81 muestran experiencia de ejecución; la aplicación del método a cada proyecto científico o tecnológico se acuerda y evalúa con ese equipo.</p>
        <a href="https://www.argentina.gob.ar/sites/default/files/elitros_2026_-_bases_y_condiciones.pdf" target="_blank" rel="noopener noreferrer">Contexto de la audiencia: bases oficiales de Élitros 2026 ↗</a>
      </footer>
    </section>
  );
}
