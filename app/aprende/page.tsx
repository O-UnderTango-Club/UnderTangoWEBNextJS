const whatsappHref =
  "https://wa.me/5493757618270?text=Hola%2C%20quiero%20conocer%20APRENDE%20y%20recibir%20novedades%20del%20curso%20de%20memoria%20y%20aprendizaje%20acelerado.";

export default function AprendePage() {
  return (
    <main className="aprendePage">
      <div className="aprendeGlow aprendeGlowOne" aria-hidden="true" />
      <div className="aprendeGlow aprendeGlowTwo" aria-hidden="true" />

      <nav className="aprendeNav" aria-label="APRENDE">
        <a className="aprendeBrand" href="#inicio" aria-label="APRENDE - inicio">
          <span className="aprendeMark">A</span>
          <span>
            <strong>APRENDE</strong>
            <small>aprendizaje acelerado</small>
          </span>
        </a>
        <span className="aprendeBacked">Respaldado por Ø UnderTango</span>
      </nav>

      <section className="aprendeHero" id="inicio">
        <div className="aprendeHeroCopy">
          <p className="aprendeEyebrow">MEMORIA · MNEMOTECNIA · APRENDIZAJE</p>
          <h1>
            Recordá más.
            <br />
            <span>Estudiá con método.</span>
          </h1>
          <p className="aprendeLead">
            Un sistema práctico para transformar información difícil de retener en
            imágenes, recorridos, asociaciones y repasos que puedas recuperar cuando
            realmente los necesitás.
          </p>

          <div className="aprendeActions">
            <a className="aprendePrimary" href="/aprende/guia">
              Descargar guía gratis
              <span aria-hidden="true">↓</span>
            </a>
            <a
              className="aprendeSecondary"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Quiero aprender el método
            </a>
          </div>

          <p className="aprendeMicrocopy">
            Primera guía gratuita: <strong>7 técnicas de memoria que podés usar hoy.</strong>
          </p>
        </div>

        <div className="aprendeHeroCard" aria-label="Vista previa del método">
          <div className="aprendeCardTop">
            <span>PROTOCOLO 01</span>
            <span>15 MIN</span>
          </div>
          <div className="aprendeMemoryPath">
            <div><span>01</span><strong>Capturá</strong><small>qué vale recordar</small></div>
            <div><span>02</span><strong>Transformá</strong><small>texto en imágenes</small></div>
            <div><span>03</span><strong>Recuperá</strong><small>sin mirar la fuente</small></div>
            <div><span>04</span><strong>Espaciá</strong><small>los próximos repasos</small></div>
          </div>
          <p>
            La memoria no se mejora acumulando lectura. Se entrena intentando recordar.
          </p>
        </div>
      </section>

      <section className="aprendeStrip" aria-label="Principios del sistema">
        <span>Sin memoria fotográfica</span>
        <span>Sin releer diez veces</span>
        <span>Sin depender de talento especial</span>
        <span>Con práctica deliberada</span>
      </section>

      <section className="aprendeSection">
        <div className="aprendeSectionHeading">
          <p className="aprendeEyebrow">EL MÉTODO</p>
          <h2>No estudies más tiempo. Diseñá mejor el recuerdo.</h2>
          <p>
            APRENDE combina herramientas de mnemotecnia con recuperación activa y
            repetición espaciada para construir una rutina que puedas usar en estudio,
            trabajo y vida cotidiana.
          </p>
        </div>

        <div className="aprendeGrid">
          <article className="aprendeFeature">
            <span>01</span>
            <h3>Convertí</h3>
            <p>
              Pasá de palabras abstractas a imágenes, asociaciones y estructuras que tu
              mente pueda recorrer.
            </p>
          </article>
          <article className="aprendeFeature">
            <span>02</span>
            <h3>Recuperá</h3>
            <p>
              Cerrá el material y obligate a producir la información. Ahí aparece el
              aprendizaje real.
            </p>
          </article>
          <article className="aprendeFeature">
            <span>03</span>
            <h3>Espaciá</h3>
            <p>
              Revisitá lo importante en intervalos, en vez de concentrar todo el esfuerzo
              en una sola sesión.
            </p>
          </article>
        </div>
      </section>

      <section className="aprendeChallenge">
        <div>
          <p className="aprendeEyebrow">PROBALO ANTES DE COMPRAR NADA</p>
          <h2>Tu primer entrenamiento empieza con una guía de 6 páginas.</h2>
          <p>
            Asociación exagerada, chunking, palacio de la memoria, recuperación activa,
            repetición espaciada, doble codificación y explicación desde memoria.
          </p>
        </div>
        <a className="aprendeDownloadCard" href="/aprende/guia">
          <span className="aprendePdfBadge">PDF</span>
          <strong>7 técnicas de memoria que podés usar hoy</strong>
          <small>Guía gratuita · Edición 01</small>
          <span className="aprendeDownloadArrow" aria-hidden="true">↘</span>
        </a>
      </section>

      <section className="aprendeFinal">
        <p className="aprendeEyebrow">PRIMERA EDICIÓN EN CONSTRUCCIÓN</p>
        <h2>Estamos convirtiendo estas técnicas en un entrenamiento completo.</h2>
        <p>
          Si querés entrar desde el comienzo, escribinos <strong>APRENDE</strong> y te
          sumamos a las novedades de la primera edición.
        </p>
        <a
          className="aprendePrimary"
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Escribir APRENDE por WhatsApp
          <span aria-hidden="true">→</span>
        </a>
      </section>

      <footer className="aprendeFooter">
        <div>
          <strong>APRENDE</strong>
          <span>Memoria · Mnemotecnia · Aprendizaje acelerado</span>
        </div>
        <p>Una iniciativa respaldada por Ø UnderTango Club.</p>
      </footer>
    </main>
  );
}
