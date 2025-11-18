'use client';

import { useState } from 'react';
import Header from '../components/header';
import Footer from '../components/footer';
import '../styles/reservas.css';
import '../styles/navbar.css';
import '../styles/footer.css';

export default function ReservasPage() {
  const [showType, setShowType] = useState('');
  const [comments, setComments] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({
    text: '',
    type: null
  });

  const handleSelect = (value: string) => {
    setShowType(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = {
      name: (e.currentTarget.elements.namedItem('name') as HTMLInputElement)?.value.trim(),
      email: (e.currentTarget.elements.namedItem('email') as HTMLInputElement)?.value.trim(),
      date: (e.currentTarget.elements.namedItem('date') as HTMLInputElement)?.value,
      showType,
      comments,
    };

    try {
      const response = await fetch('/api/send_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error en la red');

      const result = await response.json();

      if (!result.success) throw new Error(result.message || 'Error desconocido');

      setMessage({ text: 'Solicitud enviada correctamente ', type: 'success' });
      e.currentTarget.reset();
      setShowType('');
      setComments('');
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al enviar la solicitud', type: 'error' });
    }
  };

  return (
    <>
      <Header />

      {/* ⬇ IMPORTANTE: TODO dentro del wrapper ⬇ */}
      <div className="reservas-wrapper">

        <section className="shows-section" id="shows">
          <div className="reservas-container">
            <h2 className="section-title">Nuestros Espectáculos</h2>
            <p className="section-text">
              Ofrecemos una amplia gama de espectáculos adaptados a las necesidades de nuestros clientes.
            </p>

            <div className="show-highlights">
              <div className="highlight-card">
                <i className="fas fa-music"></i>
                <h3>Shows de Danza</h3>
                <p>Espectáculos de tango tradicional y fusión.</p>
              </div>

              <div className="highlight-card">
                <i className="fas fa-guitar"></i>
                <h3>Shows de Música en Vivo</h3>
                <p>Bandas y solistas.</p>
              </div>

              <div className="highlight-card">
                <i className="fas fa-star"></i>
                <h3>Megaeventos</h3>
                <p>Producciones a gran escala.</p>
              </div>

              <div className="highlight-card">
                <i className="fas fa-globe-americas"></i>
                <h3>Show Triplefrontera</h3>
                <p>Una fusión de culturas.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="reserva-section" id="reserva">
          <div className="reservas-container">
            <h2 className="section-title">Reserva un Espectáculo</h2>

            <form onSubmit={handleSubmit} className="reserva-form">
              <div className="form-group">
                <label htmlFor="name">Nombre:</label>
                <input type="text" id="name" name="name" required />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" required />
              </div>

              <div className="form-group">
                <label htmlFor="date">Fecha Deseada:</label>
                <input type="date" id="date" name="date" required />
              </div>

              <div className="form-group">
                <label>Tipo de Espectáculo:</label>
                <div className="button-select">
                  {[
                    { label: 'Show de danza', value: 'show-danza' },
                    { label: 'Show de música', value: 'show-musica' },
                    { label: 'Show híbrido', value: 'show-hibrido' },
                    { label: 'Show triplefrontera', value: 'show-triplefrontera' },
                    { label: 'Megaevento', value: 'megaevento' },
                    { label: 'Otros', value: 'otros' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`select-button ${showType === option.value ? 'active' : ''}`}
                      onClick={() => handleSelect(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="comments">Comentarios:</label>
                <textarea
                  id="comments"
                  name="comments"
                  maxLength={300}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                ></textarea>
                <p id="char-count">{comments.length}/300 caracteres</p>
              </div>

              <button type="submit" className="submit-button">Enviar Solicitud</button>
            </form>

            {message.type && (
              <div id="message" className={message.type}>
                {message.text}
              </div>
            )}
          </div>
        </section>

        <section className="contact" id="contacto">
          <div className="reservas-container">
            <h2 className="section-title">Contáctanos</h2>
            <p className="section-text">¿Tienes preguntas? Escríbenos por WhatsApp</p>

            <div className="whatsapp-button-container">
              <a
                href="https://wa.me/+5493757618270"
                className="contact-button"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-whatsapp"></i>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </>
  );
}
