'use client';

import Head from 'next/head';
import Script from 'next/script';
import Header from './components/header';
import Footer from './components/footer';
import { useHomeEffects } from './hooks/useHomeEffects';

import './styles/index.css';
import './styles/footer.css';
import './styles/navbar.css';
import './styles/timeline.css';
import './styles/pilars.css';
import './styles/burguer.css';

export default function HomePage() {
  useHomeEffects();

  return (
    <>
      <Head>
        <title>UnderTango Club | Milonga y Clases de Tango en Iguazú</title>
        <meta
          name="description"
          content="Descubre el auténtico tango en Iguazú con nuestras clases grupales y privadas, espectáculos de milonga y moda exclusiva. ¡Vive la pasión del tango en la triple frontera!"
        />
        <meta
          name="facebook-domain-verification"
          content="lx79g9tyq6nhj3ef5u8m8vpwp39r6h"
        />
        <link rel="icon" href="/assets/images/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
      </Head>

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

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1353890722495845&ev=PageView&noscript=1"
          alt="facebook pixel"
        />
      </noscript>

      <Header />

      <main>

        <header id="video-slider">
          <video autoPlay muted loop id="video-background" playsInline>
            <source src="/assets/images/welcome.mp4" type="video/mp4" />
            Tu navegador no soporta videos HTML5.
          </video>
          <div className="text-overlay">
            <h1 id="slider-text">Vive la Pasión del Tango en Iguazú</h1>
          </div>
        </header>

        <section id="shows" className="section-animate">
          <div className="content-wrapper">
            <div className="text-content">
              <h2>Shows de Tango en la Triple Frontera</h2>
              <p>Disfruta de espectáculos que te dejarán sin aliento en Puerto Iguazú.</p>
              <a href="/pages/reservas.html" className="action-button">Reservar Ahora</a>
            </div>
            <div className="image-content">
              <img src="/assets/images/showsImage1.png" alt="Espectáculos de Tango en Iguazú" />
            </div>
          </div>
        </section>


        <section id="classes" className="section-animate">
          <div className="content-wrapper classes-wrapper">
            <div className="text-content">
              <h2>Clases de Tango en Iguazú</h2>
              <p>Aprende de los mejores maestros y vive la esencia del tango en la frontera con Brasil y Paraguay.</p>
              <div className="button-group">
                <a href="/pages/clasesPrivadas.html" className="action-button">Clases Privadas</a>
                <a href="/pages/clasesGrupales.html" className="action-button">Clases Grupales</a>
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
                <a href="/pages/moda.html" className="catalog-button">Taller</a>
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
              <p>En Undertango, vivimos y respiramos tango. Nuestra misión es compartir esta pasión con el mundo, creando experiencias únicas que trascienden el baile y conectan culturas en la triple frontera.</p>
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
          </div>
        </section>

        <section id="news" className="section-animate">
          <h2>Últimas Noticias</h2>
          <div id="news-container" className="news-grid"></div>
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
