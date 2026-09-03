'use client';

import Script from 'next/script';
import Header from './components/header';
import Footer from './components/footer';
import TangoRaveVideo from './components/TangoRaveVideo';
import { useHomeEffects } from './hooks/useHomeEffects';

const videoFrameStyle = {
  width: '100%',
  aspectRatio: '9 / 16',
  borderRadius: '16px',
  overflow: 'hidden',
  background: '#000000',
  boxShadow: '0 16px 38px rgba(0, 0, 0, 0.36)',
  margin: '4px 0 22px',
  position: 'relative' as const,
};

const verticalIframeStyle = {
  width: '100%',
  height: '100%',
  border: 0,
  display: 'block',
};

const croppedHorizontalIframeStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  height: '100%',
  width: '316%',
  border: 0,
  display: 'block',
  transform: 'translate(-50%, -50%)',
};

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
              Mirá cómo se vive cada experiencia y elegí la que mejor encaja con lo que necesitás.
            </p>

            <div className="intent-grid">
              <article className="intent-card">
                <span className="intent-number" style={{ marginBottom: '18px' }}>01</span>
                <h2>Así se vive un show de tango</h2>
                <p>Una pareja de tango en escena: un formato directo, elegante y adaptable a hoteles, eventos y gastronomía.</p>

                <div style={videoFrameStyle}>
                  <iframe
                    src="https://www.youtube.com/embed/samrNxK2nNw?rel=0&playsinline=1"
                    title="Así se vive un show de tango con UnderTango Club"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    style={verticalIframeStyle}
                  />
                </div>

                <a
                  href="/reservas#shows"
                  className="intent-card-cta"
                  data-undertango-event="intent_click"
                  data-undertango-intent="contratar_show"
                  data-undertango-subintent="show_danza_tango"
                  data-undertango-cta="Quiero este show de tango"
                >
                  Quiero este show →
                </a>
              </article>

              <article className="intent-card">
                <span className="intent-number" style={{ marginBottom: '18px' }}>02</span>
                <h2>Así se vive una clase de tango</h2>
                <p>Una experiencia simple, participativa y pensada para disfrutar el tango desde el primer momento.</p>

                <div style={videoFrameStyle}>
                  <iframe
                    src="https://www.youtube.com/embed/yJZnlJgrsGc?rel=0&playsinline=1"
                    title="Así se vive una clase de tango con UnderTango Club"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    style={verticalIframeStyle}
                  />
                </div>

                <a
                  href="#classes"
                  className="intent-card-cta"
                  data-undertango-event="intent_click"
                  data-undertango-intent="aprender_tango"
                  data-undertango-subintent="clase_experiencia"
                  data-undertango-cta="Quiero tomar una clase"
                >
                  Quiero tomar una clase →
                </a>
                <a
                  href="https://wa.me/5493757618270?text=Hola%2C%20llegu%C3%A9%20desde%20la%20web%20de%20UnderTango%20y%20quiero%20consultar%20por%20una%20clase%20de%20tango%20para%20incluir%20en%20un%20paquete%20tur%C3%ADstico."
                  className="intent-card-cta"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-undertango-event="intent_click"
                  data-undertango-intent="aprender_tango"
                  data-undertango-subintent="clase_paquete_turistico"
                  data-undertango-cta="Quiero una clase para un paquete turístico"
                  style={{ display: 'block', marginTop: '10px' }}
                >
                  Quiero una clase para un paquete turístico →
                </a>
              </article>

              <article className="intent-card">
                <span className="intent-number" style={{ marginBottom: '18px' }}>03</span>
                <h2>Así se vive una producción Triple Frontera</h2>
                <p>Música, danza y producción escénica integradas para experiencias de mayor escala y presencia.</p>

                <div style={videoFrameStyle}>
                  <iframe
                    src="https://www.youtube.com/embed/ONRopDSKkro?rel=0&playsinline=1"
                    title="Así se vive una producción Triple Frontera de UnderTango Club"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    style={croppedHorizontalIframeStyle}
                  />
                </div>

                <a
                  href="/reservas#shows"
                  className="intent-card-cta"
                  data-undertango-event="intent_click"
                  data-undertango-intent="contratar_show"
                  data-undertango-subintent="produccion_triple_frontera"
                  data-undertango-cta="Quiero una producción completa"
                >
                  Quiero una producción completa →
                </a>
              </article>
            </div>

            <article
              className="home-rave-feature"
              style={{
                margin: '24px auto 0',
                maxWidth: '1180px',
                textAlign: 'left',
                border: '1px solid rgba(226, 195, 125, 0.45)',
                borderRadius: '18px',
                padding: '30px',
                background: 'linear-gradient(145deg, rgba(226, 195, 125, 0.08), #090909)',
              }}
            >
              <div>
              <p className="intent-eyebrow" style={{ marginBottom: '10px' }}>04 · PRODUCTO DE AUTORÍA</p>
              <h2
                style={{
                  color: '#ffffff',
                  fontFamily: 'var(--font-undertango-editorial), Georgia, "Times New Roman", serif',
                  fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
                  margin: '0 0 12px',
                  textAlign: 'left',
                }}
              >
                UnderTango Rave
              </h2>
              <p
                style={{
                  color: '#d2d2d2',
                  fontFamily: 'var(--font-undertango-editorial), Georgia, "Times New Roman", serif',
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  margin: '0 0 12px',
                }}
              >
                Banda en vivo, bailarines y electrónica en un formato original de Ø UnderTango Club.
              </p>
              <a
                href="/shows#tango-rave"
                className="intent-card-cta"
                data-undertango-event="intent_click"
                data-undertango-intent="contratar_show"
                data-undertango-subintent="tango_rave"
                data-undertango-cta="Conocer Tango Rave"
              >
                Conocer Tango Rave →
              </a>
              </div>
              <TangoRaveVideo />
            </article>
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
              <p className="commercial-note">
                Trabajamos por contratación y adaptamos artistas, duración, sonido y despliegue técnico a las necesidades de cada producción.
              </p>
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
              <p>
                En UnderTango, vivimos y respiramos tango. Nuestra misión es compartir esta pasión con el mundo,
                creando experiencias únicas que trascienden el baile y conectan personas en la Triple Frontera.
              </p>
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
            <a href="https://www.google.com/maps/place/Undertango+Club/" target="_blank" rel="noopener noreferrer" className="map-link">
              <img src="/assets/images/mapsScreen3.png" alt="Ubicación de UnderTango Club en Puerto Iguazú" />
            </a>
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
