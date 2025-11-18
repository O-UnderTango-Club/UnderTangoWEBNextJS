"use client";

import { useEffect, useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";

import "../styles/navbar.css";
import "../styles/footer.css";
import "../styles/faq.css";

export default function FAQPage() {
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const question = target.closest(".faq-question");
      if (question) {
        const item = question.parentElement as HTMLElement;
        item.classList.toggle("active");
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const applyFilter = (category: string) => {
    setFilter(category);
  };

  const faqItems = [
    {
      category: "clases",
      question: "¿Dónde están ubicados?",
      answer: (
        <>
          <p>En Puerto Iguazú, Misiones. Puedes encontrarnos en:</p>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.1023694772166!2d-54.57342492394826!3d-25.600040141962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94f6932c3aef0c97%3A0xd45b9e44e0110a6d!2sUndertango%20Club!5e0!3m2!1ses!2sar!4v1710805123456!5m2!1ses!2sar"
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
            ></iframe>
          </div>
        </>
      ),
    },
    {
      category: "clases",
      question: "¿Dan clases grupales?",
      answer: (
        <p>
          Sí, los sábados de 9 a 10hs principiantes, de 10 a 11 avanzados y de
          11 a 11:30 práctica danzante. Presencial en Iguazú, retransmitida por
          TikTok Live.
        </p>
      ),
    },
    {
      category: "clases",
      question: "¿Tienen otro horario además de los sábados?",
      answer: (
        <p>Estamos viendo de armar un nuevo grupo los lunes de 19 a 20hs.</p>
      ),
    },
    {
      category: "clases",
      question: "¿Dan clases particulares?",
      answer: (
        <p>
          Sí, con reserva previa al{" "}
          <a href="https://wa.me/+5493757618270" className="contact-link">
            +54 3757 618270
          </a>
          .
        </p>
      ),
    },
    {
      category: "clases",
      question: "¿Dan clases on-line?",
      answer: (
        <p>
          Sí, con reserva previa o a través de nuestro{" "}
          <a
            href="https://hotmart.com/es/marketplace/productos/20-lecciones-de-tango/F62016758K"
            target="_blank"
            className="contact-link"
          >
            curso online
          </a>
          .
        </p>
      ),
    },
    {
      category: "clases",
      question: "¿Hay milongas en Iguazú?",
      answer: (
        <p>
          Sí, todos los domingos de 22 a 00:00 hacemos una práctica danzante con
          reserva previa.
        </p>
      ),
    },
    {
      category: "moda",
      question: "¿Dónde puedo ver el catálogo de prendas?",
      answer: <p>Nuestro catálogo está en construcción. Pronto estará disponible.</p>,
    },
    {
      category: "shows",
      question: "¿Dónde puedo ver un show de tango en Puerto Iguazú?",
      answer: (
        <>
          <p>
            De martes a domingos de 17 a 19hs en Cruceros Iguazú, combinación de
            show de tango electrónico + música internacional en vivo.
          </p>
          <p>
            Para más información, contacta al{" "}
            <a href="https://wa.me/+5493757618270" className="contact-link">
              +54 3757 618270
            </a>
            .
          </p>
        </>
      ),
    },
    {
      category: "shows",
      question: "¿Cuánto cuesta un show de tango de ustedes?",
      answer: (
        <>
          <p>
            Disponemos de diversas formaciones de músicos, bailarines y show de
            luces y sonidos.
          </p>
          <p>
            Por favor, comuníquese al{" "}
            <a href="https://wa.me/+5493757618270" className="contact-link">
              +54 3757 618270
            </a>{" "}
            para más información.
          </p>
        </>
      ),
    },
  ];

  return (
    <>
      <Header />

      {/* ENVOLVEMOS TODO EL FAQ PARA AISLAR LOS ESTILOS */}
      <div className="faq-wrapper">

        <header className="faq-header">
          <div className="header-content">
            <h1>Preguntas Frecuentes</h1>
            <p>
              Encuentra respuestas a las dudas más comunes sobre nuestros
              servicios
            </p>
          </div>
        </header>

        <section className="faq-filter">
          <div className="faq-container-main">
            <h2>Preguntas frecuentes de</h2>

            <div className="filter-buttons">
              <button
                className={`filter-btn ${
                  filter === "all" ? "active" : ""
                }`}
                onClick={() => applyFilter("all")}
              >
                Todas
              </button>

              <button
                className={`filter-btn ${
                  filter === "shows" ? "active" : ""
                }`}
                onClick={() => applyFilter("shows")}
              >
                Shows
              </button>

              <button
                className={`filter-btn ${
                  filter === "clases" ? "active" : ""
                }`}
                onClick={() => applyFilter("clases")}
              >
                Clases
              </button>

              <button
                className={`filter-btn ${
                  filter === "moda" ? "active" : ""
                }`}
                onClick={() => applyFilter("moda")}
              >
                Moda
              </button>
            </div>
          </div>
        </section>

        <section className="faq-section">
          <div className="faq-container-main">
            <div className="faq-container">
              {faqItems
                .filter(
                  (faq) => filter === "all" || faq.category === filter
                )
                .map((faq, index) => (
                  <div key={index} className="faq-item">
                    <div className="faq-question">
                      <h3>{faq.question}</h3>
                      <span className="faq-icon">
                        <i className="fas fa-chevron-down"></i>
                      </span>
                    </div>

                    <div className="faq-answer">{faq.answer}</div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section className="contact-section">
          <div className="faq-container-main">
            <h2>¿No encontraste lo que buscabas?</h2>
            <p>Contáctanos directamente y responderemos todas tus dudas</p>

            <div className="contact-buttons">
              <a href="https://wa.me/+5493757618270" className="contact-button">
                <i className="fab fa-whatsapp"></i>
                <span>WhatsApp</span>
              </a>

              <a
                href="mailto:undertangoclub@gmail.com"
                className="contact-button email-button"
              >
                <i className="fas fa-envelope"></i>
                <span>Email</span>
              </a>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </>
  );
}
