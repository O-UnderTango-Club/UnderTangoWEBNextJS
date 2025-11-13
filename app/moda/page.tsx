"use client";

import { useEffect } from "react";
import Header from "../components/header";
import Footer from "../components/footer";

import "../styles/navbar.css";
import "../styles/footer.css";
import "../styles/moda.css";
import "../styles/moda-fixes.css";

export default function ModaPage() {
  useEffect(() => {
    const modal = document.getElementById("imageModal") as HTMLElement;
    const modalImg = document.getElementById("modalImg") as HTMLImageElement;
    const closeBtn = modal?.querySelector(".close") as HTMLElement;

    const openModal = (src: string, alt?: string) => {
      if (!modal || !modalImg) return;
      modalImg.src = src;
      modalImg.alt = alt || "";
      modal.style.display = "flex";
      modal.setAttribute("aria-hidden", "false");
    };

    const closeModal = () => {
      if (!modal || !modalImg) return;
      modal.style.display = "none";
      modalImg.src = "";
      modal.setAttribute("aria-hidden", "true");
    };

    const clickHandler = (e: Event) => {
      const target = e.target as HTMLElement;

      const img = target.closest(".producto-img img") as HTMLImageElement;
      if (img) {
        openModal(img.src, img.alt);
        return;
      }

      if (target.matches("#imageModal") || target.closest("#imageModal .close")) {
        closeModal();
      }
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    document.addEventListener("click", clickHandler);
    document.addEventListener("keydown", keyHandler);

    return () => {
      document.removeEventListener("click", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  return (
    <>
      <Header />

      <div className="hero">
        <h1>Nuestro Taller de Costuras</h1>
        <p>Donde la magia de la moda tanguera cobra vida</p>
      </div>

      <section className="main-section">
        <h2 className="section-title">Nuestro Taller</h2>
        <p className="taller-description">
          En UnderTango, nos enorgullece contar con nuestro propio taller de costuras, donde
          la magia de la moda tanguera cobra vida.
          <br />
          Ubicado en el corazón del norte misionero, nuestro taller es el epicentro de la creatividad
          y la artesanía.
          <br />
          Trabajamos con un equipo talentoso de modistas, costureras y ayudantes provenientes del
          norte misionero. Su experiencia y dedicación se reflejan en cada prenda que creamos,
          fusionando la tradición del tango con la innovación en el diseño.
        </p>

        <div className="logo-container">
          <img
            src="/assets/images/moda-logo.png"
            alt="UnderTango Moda Logo"
            className="taller-logo"
          />
        </div>
      </section>

      <section className="productos-section">
        <div style={{ textAlign: "center" }}>
          <h2 className="productos-title">Descubre Nuestros Productos</h2>
        </div>

        <div className="productos-container">

          <div className="producto">
            <figure className="producto-img">
              <img src="/assets/images/EclipseDeMedianoche.png" alt="Vestido Eclipse de Medianoche" />
            </figure>
            <div className="producto-content">
              <h3>Eclipse de Medianoche</h3>
              <p>
                Una prenda de diseño sofisticado, ideal para eventos de gala u ocasiones especiales que
                exigen elegancia y distinción.
              </p>
            </div>
          </div>

          <div className="producto">
            <figure className="producto-img">
              <img src="/assets/images/BrumaDePlata.png" alt="Accesorios Bruma de Plata" />
            </figure>
            <div className="producto-content">
              <h3>Bruma de Plata</h3>
              <p>
                Evoca la delicadeza y el misterio del tango. Su diseño fluido y los detalles plateados
                capturan la luz y crean un efecto deslumbrante en cada movimiento.
              </p>
            </div>
          </div>

          <div className="producto">
            <figure className="producto-img">
              <img src="/assets/images/GalardonNocturno.png" alt="Remeras Galardón Nocturno" />
            </figure>
            <div className="producto-content">
              <h3>Galardón Nocturno</h3>
              <p>
                Expresa la pasión y la fuerza del tango. Su diseño audaz y los detalles cuidadosamente
                elaborados reflejan la intensidad de este baile.
              </p>
            </div>
          </div>

          <div className="producto">
            <figure className="producto-img">
              <img src="/assets/images/GalanArgentino.png" alt="Zapatos Galán Argentino" />
            </figure>
            <div className="producto-content">
              <h3>Galán Argentino</h3>
              <p>
                Inspirado en la elegancia atemporal del tango, el "Galán Argentino" es una prenda que
                irradia distinción. Confeccionado con materiales de primera calidad y un corte impecable,
                captura la esencia del caballero tanguero.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div id="imageModal" className="modal" role="dialog" aria-modal="true" aria-hidden="true">
        <button className="close" aria-label="Cerrar">
          &times;
        </button>
        <img id="modalImg" className="modal-content" alt="" />
      </div>

      <Footer />
    </>
  );
}
