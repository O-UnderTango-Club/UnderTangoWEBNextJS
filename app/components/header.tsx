"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useHomeLanguage } from "./home-language";
import "../styles/navbar.css";

export default function Header({ showsHref }: { showsHref?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t: localize } = useHomeLanguage();
  const t = showsHref ? localize : (label: string) => label;
  const showsPath = showsHref ?? "/shows";

  const { user, logout } = useAuth();

  const toggleMenu = () => setMenuOpen((isOpen) => !isOpen);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <nav id="navbar">
      <div className="logo">
        <Link href="/">
          <Image
            src="/assets/images/Under-logo-transparente.png"
            alt={t("Logotipo UnderTango")}
            width={160}
            height={60}
            priority
          />
        </Link>
      </div>

      <button
        id="menu-toggle"
        aria-label={showsHref ? t("Abrir o cerrar el menú") : "Toggle menu"}
        aria-expanded={menuOpen}
        aria-controls="navbar-menu"
        onClick={toggleMenu}
        className={menuOpen ? "active" : ""}
      >
        <i></i>
      </button>

      <ul id="navbar-menu" className={menuOpen ? "active" : ""}>
        <li>
          <Link href="/" className={pathname === "/" ? "active" : ""}>
            {t("Inicio")}
          </Link>
        </li>
        <li>
          <Link href="/central" className={pathname === "/central" ? "active" : ""}>
            Ø Central
          </Link>
        </li>
        <li>
          <Link href={showsPath} className={pathname === showsPath ? "active" : ""}>
            Shows
          </Link>
        </li>
        <li>
          <Link href="/galeria" className={pathname === "/galeria" ? "active" : ""}>
            {t("Galería")}
          </Link>
        </li>
        <li>
          <Link href="/proyectos" className={pathname === "/proyectos" ? "active" : ""}>
            {t("Proyectos activos")}
          </Link>
        </li>
        <li>
          <Link href="/#historia">{t("Historia")}</Link>
        </li>
        <li>
          <Link href="/reservas" className={pathname === "/reservas" ? "active" : ""}>
            {t("Contacto")}
          </Link>
        </li>
        <li>
          <Link href="/faq" className={pathname === "/faq" ? "active" : ""}>
            {t("Preguntas Frecuentes")}
          </Link>
        </li>

        {user ? (
          <li>
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
                padding: "10px 15px",
              }}
            >
              {t("Cerrar Sesión")}
            </button>
          </li>
        ) : (
          <>
            <li style={{ marginRight: "10px" }}>
              <a
                href="https://sprightly-griffin-33f04f.netlify.app/login/login"
                className="login-link"
              >
                {t("Iniciar Sesión")}
              </a>
            </li>
            <li style={{ marginLeft: "10px" }}>
              <a
                href="https://sprightly-griffin-33f04f.netlify.app/"
                className="register-link"
              >
                {t("Registrarse")}
              </a>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
