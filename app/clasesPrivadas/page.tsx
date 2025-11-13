"use client";

import Image from "next/image";
import Link from "next/link";

import Header from "../components/header";
import Footer from "../components/footer";

import "../styles/clases-privadas.css";
import "../styles/navbar.css";
import "../styles/footer.css";

export default function ClasesPrivadasPage() {
  return (
    <>
      <Header />

      <section className="hero">
        <Image
          src="/assets/images/tango-hero.jpg"
          alt="Tango dancers silhouette"
          width={1600}
          height={900}
          className="hero-image"
        />

        <div className="hero-content">
          <h1 className="hero-title">Clases Privadas de Tango</h1>
          <p className="hero-subtitle">
            Disfruta de la atención personalizada en nuestras clases privadas de tango, disponibles todos los días en Puerto Iguazú, Misiones.
          </p>

          <a href="https://wa.me/+5493757618270" className="hero-button" target="_blank">
            <i className="fab fa-whatsapp"></i> Reserva tu Clase por WhatsApp
          </a>
        </div>
      </section>

      <section className="class-info" id="classes">
        <div className="container">
          <h2 className="class-info-title">Atención Personalizada</h2>

          <p className="class-info-text">
            Ajustamos las clases a tus necesidades y ritmo, para que puedas avanzar a tu propio paso y alcanzar tus objetivos.
            La dirección es Avenida 3 Fronteras 454, Cabaña de los Muñecos.
          </p>

          <div className="class-highlights">
            <div className="highlight-card">
              <i className="fas fa-user"></i>
              <h3>Enfoque Individual</h3>
              <p>Clases diseñadas exclusivamente para ti.</p>
            </div>

            <div className="highlight-card">
              <i className="fas fa-calendar-alt"></i>
              <h3>Horarios Flexibles</h3>
              <p>Elige el horario que mejor se adapte a tu agenda.</p>
            </div>

            <div className="highlight-card">
              <i className="fas fa-star"></i>
              <h3>Resultados Garantizados</h3>
              <p>Progreso rápido y efectivo.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits" id="benefits">
        <div className="container">
          <h2 className="benefits-title">Beneficios de las Clases Privadas</h2>

          <p className="benefits-text">
            Nuestras clases privadas ofrecen una experiencia única y personalizada. Aquí te contamos por qué son la mejor opción para aprender tango:
          </p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <i className="fas fa-chalkboard-teacher"></i>
              <h3>Aprendizaje Personalizado</h3>
              <p>El instructor se adapta a tu nivel y ritmo, asegurando que aprendas de manera efectiva.</p>
            </div>

            <div className="benefit-card">
              <i className="fas fa-clock"></i>
              <h3>Flexibilidad de Horarios</h3>
              <p>Elige el horario que mejor se ajuste a tu rutina, sin compromisos fijos.</p>
            </div>

            <div className="benefit-card">
              <i className="fas fa-trophy"></i>
              <h3>Resultados Rápidos</h3>
              <p>Con atención individualizada, verás progresos significativos en poco tiempo.</p>
            </div>

            <div className="benefit-card">
              <i className="fas fa-heart"></i>
              <h3>Ambiente Cálido</h3>
              <p>Disfruta de un ambiente relajado y enfocado en tu comodidad.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="other-disciplines">
        <div className="container">
          <h2 className="disciplines-title">Clases de Otras Disciplinas</h2>

          <p className="disciplines-intro">
            En UnderTango Club ofrecemos una variedad de disciplinas adicionales para complementar tu formación y desarrollo artístico.
            Descubre nuestras clases de piano, inglés, y formación profesional para artistas.
          </p>

          <div className="disciplines-grid">
            <div className="discipline-card">
              <i className="fas fa-music"></i>
              <h3>Clases de Piano</h3>
              <p>
                Aprende piano de la mano de profesores experimentados. Ya sea que quieras iniciarte en la música o perfeccionar tus habilidades.
              </p>
            </div>

            <div className="discipline-card">
              <i className="fas fa-language"></i>
              <h3>Clases de Inglés</h3>
              <p>
                Mejora tu inglés para comunicarte con el mundo. Nuestras clases están enfocadas en el aprendizaje práctico.
              </p>
            </div>

            <div className="discipline-card">
              <i className="fas fa-user-tie"></i>
              <h3>Formación Profesional para Artistas</h3>
              <p>
                Potencia tu carrera artística con nuestras clases de formación profesional, gestión de proyectos y marketing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="container">
          <h2 className="contact-title">Reserva tu Clase</h2>

          <a href="https://wa.me/+5493757618270" className="contact-button" target="_blank">
            <i className="fab fa-whatsapp"></i> Contáctanos por WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
