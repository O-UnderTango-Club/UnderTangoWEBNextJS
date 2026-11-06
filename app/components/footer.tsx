"use client";

import "../styles/footer.css";
import { useHomeLanguage } from "./home-language";

export default function Footer() {
  const { t } = useHomeLanguage();
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
          <h3>{t("Contacto")}</h3>
          <p>
            Email:{" "}
            <a href="mailto:undertangoclub@gmail.com">
              undertangoclub@gmail.com
            </a>
          </p>
          <p>{t("Teléfono: +54 9 3757 61-8270")}</p>
        </div>

        <div className="footer-section">
          <h3>{t("Clases")}</h3>
          <ul>
            <li>
              <a href="/clasesGrupales">{t("Clases Grupales")}</a>
            </li>
            <li>
              <a href="/clasesPrivadas">{t("Clases Privadas")}</a>
            </li>
            <li>
              <a
                href="https://hotmart.com/es/marketplace/productos/20-lecciones-de-tango/F62016758K"
                target="_blank"
              >{t("Cursos Online")}</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{t("Shows")}</h3>
          <ul>
            <li>
              <a href="/mapa">{t("Mapa de proyectos")}</a>
            </li>
            <li>
              <a href="/galeria">{t("Galería de presentaciones")}</a>
            </li>
            <li>
              <a href="/usersCalendar">{t("Próximos Shows")}</a>
            </li>
            <li>
              <a href="/reservas">{t("Reservas")}</a>
            </li>
            <li>
              <a href="/central">{t("Equipo")}</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{t("Fondo de Inversión")}</h3>
          <ul>
            <li>
              <a href="/fdi/fondo-de-inversiones">{t("Página de Inversiones")}</a>
            </li>
            <li>
              <a href="/boletin-semanal">{t("Boletín Semanal")}</a>
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
              <a href="/ut-coin">{t("Red Cripto")}</a>
            </li>
            <li>
              <a href="/fdi/game77/portada-bizantina">{t("Juego Cripto")}</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{t("Ayuda")}</h3>
          <ul>
            <li>
              <a href="/faq">{t("Preguntas Frecuentes")}</a>
            </li>
            <li>
              <a href="/reservas">{t("Reservas")}</a>
            </li>
            <li>
              <a href="/reservas#reserva">{t("Contacto")}</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{t("Síguenos")}</h3>
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
        <p>&copy; 2025 Undertango. {t("Todos los derechos reservados.")}</p>
      </div>
    </footer>
  );
}
