"use client";

import Image from "next/image";
import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";

import "../styles/clases-grupales.css";
import "../styles/navbar.css";
import "../styles/footer.css";

export default function ClasesGrupalesPage() {
  return (
    <>
      <Header />

      <section className="image-text-section">
        <div className="image-text-row">
          <div className="image-container">
            <Image
              src="/assets/images/grupal1.png"
              alt="Imagen 1"
              width={600}
              height={400}
              className="animated-image"
            />
          </div>

          <div className="text-container animated-text">
            <h2>El Tango: Una Pasión que Une</h2>
            <p>
              El tango es más que un baile; es una expresión de emociones, una
              conexión entre dos personas y una cultura que trasciende
              fronteras.
            </p>
          </div>
        </div>

        <div className="image-text-row align-right">
          <div className="image-container">
            <Image
              src="/assets/images/grupal2.png"
              alt="Imagen 2"
              width={600}
              height={400}
              className="animated-image"
            />
          </div>

          <div className="text-container animated-text">
            <h2>Aprende con Nosotros</h2>
            <p>
              En UnderTango, nuestras clases están diseñadas para todos los
              niveles. ¡Ven y descubre el placer de bailar tango!
            </p>
          </div>
        </div>

        <div className="image-text-row">
          <div className="image-container">
            <Image
              src="/assets/images/grupal3.png"
              alt="Imagen 3"
              width={600}
              height={400}
              className="animated-image"
            />
          </div>

          <div className="text-container animated-text">
            <h2>Eventos y Milongas</h2>
            <p>
              Organizamos milongas y eventos sociales para que practiques lo
              aprendido y disfrutes de la comunidad tanguera.
            </p>
          </div>
        </div>
      </section>

      <section className="class-info" id="classes">
        <div className="container">
          <h2 className="section-title">Clases para todos los niveles</h2>

          <p className="section-text">
            En UnderTango, ubicados en Puerto Iguazú, Misiones, ofrecemos
            clases adaptadas a todos los niveles, desde principiantes hasta
            avanzados. Nuestro enfoque es personalizado y divertido.
          </p>

          <div className="class-highlights">
            <Link href="/clases-grupales" className="highlight-card">
              <div>
                <i className="fas fa-users"></i>
                <h3>Clases Grupales</h3>
                <p>Aprende en un ambiente colaborativo y amigable.</p>
              </div>
            </Link>

            <Link href="/clases-privadas" className="highlight-card">
              <div>
                <i className="fas fa-user"></i>
                <h3>Clases Privadas</h3>
                <p>Recibe atención personalizada para mejorar tu técnica.</p>
              </div>
            </Link>

            <a
              href="https://hotmart.com/es/marketplace/productos/20-lecciones-de-tango/F62016758K"
              className="highlight-card"
              target="_blank"
            >
              <div>
                <i className="fas fa-globe"></i>
                <h3>Cursos Online</h3>
                <p>Aprende desde cualquier parte del mundo.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="location" id="location">
        <div className="container">
          <h2 className="section-title">Nuestra Ubicación</h2>

          <div className="location-content">
            <p className="location-address">
              Avenida 3 Fronteras 454, Cabaña de los Muñecos, Puerto Iguazú,
              Misiones
            </p>

            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3593.231144000000!2d-54.567890684977!3d-25.596083683635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDM1JzQ1LjkiUyA1NMKwMzQnMDMuOSJX!5e0!3m2!1ses!2sar!4v1633024000000!5m2!1ses!2sar"
                width="100%"
                height="400"
                style={{ border: 0 }}
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      <section className="gallery" id="gallery">
        <div className="container">
          <h2 className="section-title">Galería</h2>

          <div className="gallery-grid">
            {[
              "tango-class-1.jpg",
              "tango-class-2.jpg",
              "tango-class-3.jpg",
              "tango-class-4.jpg",
              "2024-7-13.jpg",
              "grupal6.png",
            ].map((img, idx) => (
              <div className="gallery-item" key={idx}>
                <Image
                  src={`/assets/images/${img}`}
                  alt={`Galería ${idx}`}
                  width={400}
                  height={300}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="container">
          <h2 className="section-title">Contáctanos</h2>
          <p className="section-text">
            ¿Tienes preguntas o quieres reservar tu lugar? ¡Escríbenos!
          </p>

          <div className="whatsapp-button-container">
            <a
              href="https://wa.me/+5493757618270"
              className="contact-button"
              target="_blank"
            >
              <i className="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
