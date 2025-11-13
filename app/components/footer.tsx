"use client";

import "../styles/footer.css";

export default function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-logo">
          <img
            src="/assets/images/Under-logo-transparente.png"
            alt="UnderTango Logo"
          />
        </div>

        <div className="footer-section">
          <h3>Contacto</h3>
          <p>
            Email:{" "}
            <a href="mailto:undertangoclub@gmail.com">
              undertangoclub@gmail.com
            </a>
          </p>
          <p>Teléfono: +54 9 3757 61-8270</p>
        </div>

        <div className="footer-section">
          <h3>Clases</h3>
          <ul>
            <li>
              <a href="/clasesGrupales">Clases Grupales</a>
            </li>
            <li>
              <a href="/clasesPrivadas">Clases Privadas</a>
            </li>
            <li>
              <a
                href="https://hotmart.com/es/marketplace/productos/20-lecciones-de-tango/F62016758K"
                target="_blank"
              >
                Cursos Online
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Shows</h3>
          <ul>
            <li>
              <a href="/usersCalendar">Próximos Shows</a>
            </li>
            <li>
              <a href="/reservas">Reservas</a>
            </li>
            <li>
              <a href="/artistas">Artistas</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Fondo de Inversión</h3>
          <ul>
            <li>
              <a href="/fdi/fondo-de-inversiones">Página de Inversiones</a>
            </li>
            <li>
              <a href="/boletin-semanal">Boletín Semanal</a>
            </li>
            <li>
              <a
                href="https://docs.google.com/document/d/1-chA3vrOGWxO69qJzOj9P7g9RSxSyxY9Yu0DWcCjX4Y/edit?usp=sharing"
                target="_blank"
              >
                Whitepaper
              </a>
            </li>
            <li>
              <a href="/ut-coin">Red Cripto</a>
            </li>
            <li>
              <a href="/fdi/game77/portada-bizantina">Juego Cripto</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Ayuda</h3>
          <ul>
            <li>
              <a href="/faq">Preguntas Frecuentes</a>
            </li>
            <li>
              <a href="/reservas">Reservas</a>
            </li>
            <li>
              <a href="/reservas#reserva">Contacto</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Síguenos</h3>
          <div className="social-icons">
            <a
              href="https://wa.me/+5493757618270"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-whatsapp"></i>
            </a>
            <a
              href="https://www.instagram.com/undertangoclub/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-instagram"></i>
            </a>
            <a
              href="https://www.linkedin.com/company/undertangoclub/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 Undertango. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
