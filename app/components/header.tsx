"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const { user, logout } = useAuth(); // 👈 ahora usamos tu contexto real

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = async () => {
    await logout();        // cierra sesión en supabase
    window.location.href = "/"; // recarga o redirige
  };

  return (
    <nav id="navbar">
      <div className="logo">
        <Link href="/">
          <Image
            src="/assets/images/Under-logo-transparente.png"
            alt="Logotipo UnderTango"
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

        {user ? (
          <>
            <li>
              <button
                onClick={handleLogout}
                className={pathname === "/logout" ? "active" : ""}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  fontSize: "16px",
                  cursor: "pointer",
                  padding: "10px 15px",
                }}
              >
                Cerrar Sesión
              </button>
            </li>
          </>
        ) : (
          <>
            <li style={{ marginRight: "10px" }}>
              <Link href="/login" className={pathname === "/login" ? "active" : ""}>
                Iniciar Sesión
              </Link>
            </li>
            <li style={{ marginLeft: "10px" }}>
              <Link href="/register" className={pathname === "/register" ? "active" : ""}>
                Registrarse
              </Link>
            </li>
          </>
        )}

      </ul>
    </nav>
  );
}
