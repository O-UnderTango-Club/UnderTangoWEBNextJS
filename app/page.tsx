'use client';

import Script from 'next/script';
import Header from './components/header';
import Footer from './components/footer';
import { useHomeEffects } from './hooks/useHomeEffects';

export default function HomePage() {
  useHomeEffects();

  return (
    <>
      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-MDX0M5KKDM" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag("js", new Date());
          gtag("config", "G-MDX0M5KKDM");
        `}
      </Script>

      <Script id="meta-pixel">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1353890722495845');
          fbq('track', 'PageView');
        `}
      </Script>

      <Header />

      <main>
        <header id="video-slider">
          <video autoPlay muted loop id="video-background" playsInline>
            <source src="https://under-tango-web.vercel.app/assets/images/welcome.mp4" type="video/mp4" />
            Tu navegador no soporta videos HTML5.
          </video>
        </header>

        <section id="intentions" className="intent-gateway section-animate" aria-labelledby="intentions-title">
          <div className="intent-shell">
            <p className="intent-eyebrow">Ø UNDERTANGO CLUB · PUERTO IGUAZÚ · TRIPLE FRONTERA</p>
            <h1 id="intentions-title">¿Qué estás buscando?</h1>
            <p className="intent-lede">
              Elegí el camino que mejor describe lo que necesitás y te llevamos directo a la información útil.
            </p>

            <div className="intent-grid">
              <a
                href="/usersCalendar"
                className="intent-card"
                data-undertango-event="intent_click"
                data-undertango-intent="ver_tango"
                data-undertango-subintent="agenda_publica"
                data-undertango-cta="Quiero ver tango"
              >
                <span className="intent-number">01</span>
                <h2>Quiero ver tango</h2>
                <p>Shows, milongas, clases abiertas y experiencias para disfrutar en la Triple Frontera.</p>
                <span className="intent-card-cta">Ver agenda pública →</span>
              </a>

              <a
                href="#classes"
                className="intent-card"
                data-undertango-event="intent_click"
                data-undertango-intent="aprender_tango"
                data-undertango-cta="Quiero aprender tango"
              >
                <span className="intent-number">02</span>
                <h2>Quiero aprender tango</h2>
                <p>Clases privadas o grupales para empezar, mejorar o vivir una experiencia durante tu viaje.</p>
                <span className="intent-card-cta">Ver opciones de clases →</span>
              </a>

              <a
                href="#shows"
                className="intent-card"
                data-undertango-event="intent_click"
                data-undertango-intent="contratar_show"
                data-undertango-cta="Quiero contratar un show"
              >
                <span className="intent-number">03</span>
                <h2>Quiero contratar un show</h2>
                <p>Producciones para hoteles, gastronomía, agencias, empresas, eventos y celebraciones privadas.</p>
                <span className="intent-card-cta">Conocer propuestas →</span>
              </a>
            </div>
          </div>
        </section>

        <section
          id="class-experience"
          className="section-animate"
          aria-labelledby="class-experience-title"
          style={{
            background: '#0a0a0a',
            color: '#ffffff',
            padding: '64px 20px 76px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <p className="commercial-eyebrow">VIVÍ LA EXPERIENCIA</p>
            <h2
              id="class-experience-title"
              style={{
                color: '#ffffff',
                fontFamily: 'var(--font-undertango-editorial), Georgia, "Times New Roman", serif',
                fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                lineHeight: 1.15,
                margin: '0 0 14px',
              }}
            >
              Así se vive una clase de tango
            </h2>
            <p
              style={{
                color: '#d3d3d3',
                fontFamily: 'var(--font-undertango-editorial), Georgia, "Times New Roman", serif',
                fontSize: '1.08rem',
                lineHeight: 1.7,
                margin: '0 auto 30px',
                maxWidth: '650px',
              }}
            >
              Una experiencia simple, participativa y pensada para disfrutar el tango desde el primer momento.
            </p>

            <div
              style={{
                width: 'min(100%, 390px)',
                aspectRatio: '9 / 16',
                margin: '0 auto',
                borderRadius: '18px',
                overflow: 'hidden',
                background: '#000000',
                boxShadow: '0 22px 55px rgba(0, 0, 0, 0.42)',
              }}
            >
              <iframe
                src="https://www.youtube.com/embed/yJZnlJgrsGc?rel=0"
                title="Experiencia de una clase de tango con UnderTango Club"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
              />
            </div>

            <a
              href="#classes"
              className="action-button"
              data-undertango-event="subintent_click"
              data-undertango-intent="aprender_tango"
              data-undertango-subintent="video_experiencia_clase"
              data-undertango-cta="Ver opciones de clases"
              style={{ marginTop: '30px' }}
            >
              Ver opciones de clases
            </a>
          </div>
        </section>

        <section id="shows" className="section-animate commercial-intro">
          <div className="content-wrapper">
            <div className="text-content">
              <p className="commercial-eyebrow">PRODUCCIÓN ARTÍSTICA A MEDIDA</p>
              <h2>Contratá un show en la Triple Frontera</h2>
              <p>Tango, música en vivo y experiencias escénicas diseñadas para cada espacio, público y ocasión.</p>
              <div className="button-group">
                <a
                  href="https://wa.me/5493757618270?text=Hola%2C%20llegu%C3%A9%20desde%20la%20web%20de%20UnderTango%20y%20quiero%20consultar%20por%20la%20contrataci%C3%B3n%20de%20un%20show."
                  className="action-button"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-undertango-intent="contratar_show"
                  data-undertango-subintent="consulta_comercial"
                  data-undertango-cta="Solicitar una propuesta"
                >
                  Solicitar una propuesta
                </a>
                <a
                  href="/reservas#shows"
                  className="catalog-button secondary-button"
                  data-undertango-event="subintent_click"
                  data-undertango-intent="contratar_show"
                  data-undertango-subintent="catalogo_shows"
                  data-undertango-cta="Conocer los espectáculos"
                >
                  Conocer los espectáculos
                </a>
              </div>
              <p className="commercial-note">Trabajamos por contratación y adaptamos artistas, duración, sonido y despliegue técnico a las necesidades de cada producción.</p>
              <a
                href="https://wa.me/5493757618270?text=Hola%2C%20llegu%C3%A9%20desde%20la%20web%20de%20UnderTango%20y%20quiero%20saber%20qu%C3%A9%20shows%20o%20actividades%20puedo%20ver."
                className="agenda-link"
                target="_blank"
                rel="noopener noreferrer"
                data-undertango-intent="ver_tango"
                data-undertango-subintent="cronograma_publico"
                data-undertango-cta="Consultar cronograma"
              >
                ¿Buscás actividades abiertas al público? Consultar cronograma
              </a>
            </div>
            <div className="image-content">
              <img src="/assets/images/showsImage1.png" alt="Producción artística de UnderTango Club en Puerto Iguazú" />
            </div>
          </div>
        </section>

        <section id="classes" className="section-animate">
          <div className="content-wrapper classes-wrapper">
            <div className="text-content">
              <p className="commercial-eyebrow">APRENDER TANGO</p>
              <h2>Clases de Tango en Iguazú</h2>
              <p>Elegí una experiencia privada o grupal y aprendé tango en la frontera con Brasil y Paraguay.</p>
              <div className="button-group">
                <a
                  href="/clasesPrivadas"
                  className="action-button"
                  data-undertango-event="subintent_click"
                  data-undertango-intent="aprender_tango"
                  data-undertango-subintent="clase_privada"
                  data-undertango-cta="Clases Privadas"
                >
                  Clases Privadas
                </a>
                <a
                  href="/clasesGrupales"
                  className="action-button"
                  data-undertango-event="subintent_click"
                  data-undertango-intent="aprender_tango"
                  data-undertango-subintent="clase_grupal"
                  data-undertango-cta="Clases Grupales"
                >
                  Clases Grupales
                </a>
              </div>
            </div>
            <div className="image-content">
              <img src="/assets/images/clasesImage1.png" alt="Clases de Tango para principiantes y avanzados en Iguazú" />
            </div>
          </div>
        </section>

        <section id="fashion" className="section-animate">
          <div className="content-wrapper">
            <div className="text-content">
              <h2>Moda de Tango en Misiones</h2>
              <p>Viste con elegancia y estilo para cada milonga y evento de tango en Iguazú.</p>
              <div className="button-group">
                <a href="/moda" className="catalog-button">Taller</a>
                <a href="/pages/otonio-invierno-2025.pdf" target="_blank" rel="noopener noreferrer" className="catalog-button">Ver Catálogo</a>
              </div>
            </div>
            <div className="image-content">
              <img src="/assets/images/modaImage1.png" alt="Vestidos de tango y trajes elegantes en Iguazú" />
            </div>
          </div>
        </section>

        <section id="description1" className="description section-animate">
          <div className="content-wrapper">
            <div className="text-content">
              <h2>Nuestra Pasión por el Tango en Iguazú</h2>
              <p>En UnderTango, vivimos y respiramos tango. Nuestra misión es compartir esta pasión con el mundo, creando experiencias únicas que trascienden el baile y conectan personas en la Triple Frontera.</p>
            </div>
            <div className="image-content">
              <img src="/assets/images/NuestraPasionIcon.png" alt="Pasión por el Tango en la Triple Frontera" />
            </div>
          </div>
        </section>

        <section id="historia" className="diagonal-section section-animate">
          <h2>Nuestra Historia</h2>
          <div className="timeline">
            <div className="timeline-item"><div className="timeline-content"><h3>2013</h3><p>Fundación de UnderTango como academia de tango moderno.</p></div></div>
            <div className="timeline-item"><div className="timeline-content"><h3>2015</h3><p>Comenzamos a realizar shows como compañía de tango.</p></div></div>
            <div className="timeline-item"><div className="timeline-content"><h3>2017</h3><p>Expandimos nuestros servicios como productora artística.</p></div></div>
            <div className="timeline-item"><div className="timeline-content"><h3>2023</h3><p>Registro de la marca en el Instituto de la Propiedad Industrial (INPI).</p></div></div>
            <div className="timeline-item"><div className="timeline-content"><h3>2025</h3><p>Lanzamiento de Moda UnderTango para expandir nuestra pasión.</p></div></div>
            <div className="timeline-item"><div className="timeline-content"><h3>2026</h3><p>Fundación de la startup tecnológica y la red social de UnderTango Club, aún en construcción.</p></div></div>
          </div>
        </section>

        <section id="map" className="section-animate">
          <h2>Encuéntranos</h2>
          <div className="map-container">
            <a href="https://www.google.com/maps/place/Undertango+Club/" target="_blank" rel="noopener noreferrer" className="map-link"><img src="/assets/images/mapsScreen3.png" alt="Ubicación de UnderTango Club en Puerto Iguazú" /></a>
            <div className="info-overlay">
              <div className="info-content">
                <h3>Información de Contacto</h3>
                <ul>
                  <li><i className="fas fa-map-marker-alt"></i> Dirección: 1 de Mayo 850, Puerto Iguazú, Misiones</li>
                  <li><i className="fas fa-phone"></i> Teléfono: +54 9 3757 61-8270</li>
                  <li><i className="fas fa-envelope"></i> Email: undertangoclub@gmail.com</li>
                </ul>
                <div className="social-links">
                  <a href="https://www.instagram.com/undertangoclub/" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
                  <a href="https://www.linkedin.com/company/undertangoclub/" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin"></i></a>
                  <a href="https://www.tiktok.com/@undertangoclub" target="_blank" rel="noopener noreferrer"><i className="fab fa-tiktok"></i></a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="clients" className="section-animate">
          <h2>Nuestros Clientes</h2>
          <div className="client-logos">
            <img src="/assets/images/casamalbec-Photoroom.jpg" alt="Casa Malbec" />
            <img src="/assets/images/crucerosIguazu.jpg" alt="Cruceros Iguazú" />
            <img src="/assets/images/granMelia.png" alt="Gran Meliá" />
            <img src="/assets/images/RestauranteDam.jpg" alt="Restaurante Dam" />
          </div>
        </section>
      </main>

      <Footer />
      <Script src="/assets/js/index.js" />
      <Script src="/assets/js/burguer.js" />
    </>
  );
}
