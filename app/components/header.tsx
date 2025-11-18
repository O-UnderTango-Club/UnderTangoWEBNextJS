"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import "../styles/navbar.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado de login
  const pathname = usePathname();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Ejemplo simple: revisa localStorage si hay token
  useEffect(() => {
    const token = localStorage.getItem("token"); // o lo que uses para autenticar
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // limpiar token
    setIsLoggedIn(false);
    // Opcional: redirigir a home
    window.location.href = "/";
  };

  return (
    <nav id="navbar">
      <div className="logo">
        <Link href="/">
          <Image
            src="/assets/images/Under-logo-transparente.png"
            alt="Logotipo de UnderTango Club en Iguazú"
            width={160}
            height={60}
            priority
          />
        </Link>
      </div>

      <button
        id="menu-toggle"
        aria-label="Toggle menu"
        onClick={toggleMenu}
        className={menuOpen ? "active" : ""}
      >
        <i></i>
      </button>

      <ul id="navbar-menu" className={menuOpen ? "active" : ""}>
        <li>
          <Link href="/" className={pathname === "/" ? "active" : ""}>
            Inicio
          </Link>
        </li>
        <li>
          <Link href="/#historia">Historia</Link>
        </li>
        <li>
          <Link href="/#news">Noticias</Link>
        </li>
        <li>
          <Link href="/reservas" className={pathname === "/reservas" ? "active" : ""}>
            Contacto
          </Link>
        </li>
        <li>
          <Link href="/faq" className={pathname === "/faq" ? "active" : ""}>
            Preguntas Frecuentes
          </Link>
        </li>
        <li>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          ) : (
            <Link href="/login" className={pathname === "/login" ? "active" : ""}>
              Iniciá Sesión / Registrarte
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
