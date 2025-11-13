"use client"

import Link from "next/link"

import Header from "../components/header"
import Footer from "../components/footer"

import "../styles/artistas.css"
import "../styles/moda-fixes.css"
import "../styles/navbar.css"
import "../styles/footer-fix.css"

export default function ArtistasPage() {

  return (
    <>
      <Header />

      <main className="artistas-page">
        <header className="artist-header">
          <div className="container">
            <h1>NUESTROS ARTISTAS</h1>
            <p>Talento y pasión por el tango argentino</p>
          </div>
        </header>

        <div className="container">
          <h2>Bailarines</h2>
          <div className="artist-container">
            <div className="artist-card">
              <div className="artist-info">
                <h3 className="artist-name">Bianca Wagner</h3>
                <div className="artist-style">
                  Estilo: Tango Tradicional y Escenario
                </div>
                <div className="artist-description">
                  <strong>Trayectoria:</strong> Con más de 10 años en el mundo
                  del tango, Bianca es una artista multifacética, destacándose
                  tanto en la danza como en la gestión cultural.
                </div>
                <div className="artist-services">
                  <strong>Servicios:</strong> Clases de tango, performances,
                  dirección artística y organización de eventos culturales.
                </div>
                <Link
                  href="https://www.linkedin.com/in/bianca-wagner-/"
                  className="social-link"
                >
                  LinkedIn: Bianca Wagner
                </Link>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-info">
                <h3 className="artist-name">Pablo Cieslik</h3>
                <div className="artist-style">
                  Estilo: Tango Electrónico y Tradicional
                </div>
                <div className="artist-description">
                  <strong>Trayectoria:</strong> Fundador de UnderTango, Pablo ha
                  sido una figura clave en la promoción del tango moderno,
                  combinando elementos electrónicos con el tango clásico.
                </div>
                <div className="artist-services">
                  <strong>Servicios:</strong> Clases de tango, producción de
                  espectáculos, desarrollo de proyectos culturales, y consultoría
                  artística.
                </div>
                <Link
                  href="https://www.linkedin.com/in/pablo-cieslik/"
                  className="social-link"
                >
                  LinkedIn: Pablo Cieslik
                </Link>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-info">
                <h3 className="artist-name">Melina Botana</h3>
                <div className="artist-style">
                  Estilo: Tango Tradicional y Fusión Contemporánea
                </div>
                <div className="artist-description">
                  <strong>Trayectoria:</strong> Melina es una reconocida
                  bailarina y coreógrafa con más de 12 años de experiencia en la
                  enseñanza y performance de tango.
                </div>
                <div className="artist-services">
                  <strong>Servicios:</strong> Clases de tango, coreografía de
                  espectáculos, workshops y asesoría para eventos artísticos.
                </div>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-info">
                <h3 className="artist-name">Cristian Galarza</h3>
                <div className="artist-style">
                  Estilo: Tango Escenario y Tradicional
                </div>
                <div className="artist-description">
                  <strong>Trayectoria:</strong> Con una carrera que abarca más de
                  una década, Cristian es un destacado bailarín que ha
                  participado en numerosas competiciones y festivales de tango a
                  nivel mundial.
                </div>
                <div className="artist-services">
                  <strong>Servicios:</strong> Clases de tango, presentaciones en
                  vivo, y asesoramiento coreográfico.
                </div>
              </div>
            </div>
          </div>

          <h2>Músicos</h2>
          <div className="artist-container">
            <div className="artist-card">
              <div className="artist-info">
                <h3 className="artist-name">Gladys Fattore</h3>
                <div className="artist-role">Rol: Cantante</div>
                <div className="artist-description">
                  <strong>Trayectoria:</strong> Gladys es una talentosa cantante
                  de tango con una voz cautivadora y una presencia escénica
                  impactante.
                </div>
                <div className="artist-services">
                  <strong>Servicios:</strong> Actuaciones en vivo, colaboraciones
                  musicales, y clases de canto tanguero.
                </div>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-info">
                <h3 className="artist-name">Diego Navarrete</h3>
                <div className="artist-role">Rol: Guitarrista</div>
                <div className="artist-description">
                  <strong>Trayectoria:</strong> Diego es un virtuoso guitarrista
                  que fusiona el tango tradicional con influencias
                  contemporáneas.
                </div>
                <div className="artist-services">
                  <strong>Servicios:</strong> Actuaciones en vivo, composición
                  musical, y clases de guitarra tanguera.
                </div>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-info">
                <h3 className="artist-name">Coly Bareyro</h3>
                <div className="artist-role">Rol: Bajista</div>
                <div className="artist-description">
                  <strong>Trayectoria:</strong> Coly aporta la base rítmica y
                  armónica con su bajo, dando profundidad y groove a las
                  interpretaciones de tango.
                </div>
                <div className="artist-services">
                  <strong>Servicios:</strong> Actuaciones en vivo, sesiones de
                  grabación, y clases de bajo para tango.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
