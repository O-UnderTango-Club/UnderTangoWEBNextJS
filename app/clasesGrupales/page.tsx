"use client";

import Image from "next/image";
import Header from "../components/header";
import Footer from "../components/footer";
import "../styles/navbar.css";
import "../styles/footer.css";

const whatsapp = "https://wa.me/5493757618270";

export default function ClasesGrupalesPage() {
  return (
    <>
      <Header />
      <main className="classes-page">
        <section className="hero" aria-labelledby="classes-title">
          <div className="hero-copy">
            <p className="eyebrow">Ø UNDERTANGO CLUB · TRIPLE FRONTERA</p>
            <h1 id="classes-title">Un lugar para encontrarnos en el tango.</h1>
            <p className="intro">Clases grupales en Puerto Iguazú y Foz do Iguaçu. Dos ciudades, un mismo abrazo.</p>
            <div className="actions">
              <a className="button primary" href="#horarios">Ver días y lugares <span aria-hidden="true">↓</span></a>
              <a className="button secondary" href={whatsapp} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className="hero-image">
            <Image src="/assets/images/grupal1.png" alt="Encuentro de tango de UnderTango Club" width={900} height={700} priority />
            <p>El tango se aprende compartiéndolo.</p>
          </div>
        </section>

        <section className="schedule" id="horarios" aria-labelledby="schedule-title">
          <div className="section-heading">
            <div><p className="eyebrow">ENCUENTROS SEMANALES</p><h2 id="schedule-title">Elegí dónde bailar</h2></div>
            <p>Todos los domingos, en dos espacios de la Triple Frontera.</p>
          </div>
          <div className="cards">
            <article className="card">
              <p className="card-city">BRASIL · FOZ DO IGUAÇU</p>
              <h3>Espacio Gaia Apometria</h3>
              <p className="card-kind">Clase grupal de tango para principiantes</p>
              <p className="card-time">Domingos <strong>16:00–17:00</strong></p>
              <p>Espacio Gaia Apometria, Foz do Iguaçu.</p>
              <a className="card-link" href="https://wa.me/5493757618270?text=Hola%2C%20quiero%20consultar%20por%20la%20clase%20grupal%20de%20tango%20en%20Espacio%20Gaia%20Apometria%20en%20Foz." target="_blank" rel="noopener noreferrer">Consultar por esta clase <span aria-hidden="true">↗</span></a>
            </article>
            <article className="card">
              <p className="card-city">ARGENTINA · PUERTO IGUAZÚ</p>
              <h3>Espacio La Estación</h3>
              <p className="card-kind">Clase grupal de tango</p>
              <p className="card-time">Domingos <strong>20:00</strong></p>
              <p>1 de Mayo 815, Puerto Iguazú, Misiones.</p>
              <a className="card-link" href="https://wa.me/5493757618270?text=Hola%2C%20quiero%20consultar%20por%20la%20clase%20grupal%20de%20tango%20en%20La%20Estaci%C3%B3n%20en%20Puerto%20Iguaz%C3%BA." target="_blank" rel="noopener noreferrer">Consultar por esta clase <span aria-hidden="true">↗</span></a>
            </article>
          </div>
          <p className="schedule-note">Consultanos para conocer los detalles y confirmar la actividad.</p>
        </section>

        <section className="shows" aria-labelledby="shows-title">
          <div className="section-heading">
            <div><p className="eyebrow">TAMBIÉN PODÉS VERNOS BAILAR</p><h2 id="shows-title">Tango en vivo</h2></div>
            <p>Dos encuentros semanales para disfrutar de nuestros shows.</p>
          </div>
          <div className="show-list">
            <div><p className="show-day">VIERNES · 21:00</p><h3>Hotel Wish</h3><p>Foz do Iguaçu, Brasil</p></div>
            <div><p className="show-day">SÁBADOS · 21:00</p><h3>Restaurante A Piacere</h3><p>Puerto Iguazú, Argentina</p></div>
          </div>
          <a className="button light" href="/agenda">Ver agenda completa <span aria-hidden="true">↗</span></a>
        </section>

        <section className="invitation">
          <p className="eyebrow">NOS GUSTARÍA CONOCERTE</p>
          <h2>¿Tenés ganas de bailar?</h2>
          <p>Escribinos y te contamos más sobre las clases y las próximas actividades.</p>
          <a className="button primary" href={whatsapp} target="_blank" rel="noopener noreferrer">Hablar con UnderTango <span aria-hidden="true">↗</span></a>
        </section>
      </main>
      <Footer />
      <style jsx>{`
        .classes-page { background:#f7f3ed; color:#251d1e; }
        .classes-page * { box-sizing:border-box; }
        .hero { max-width:1280px; margin:auto; padding:clamp(48px,7vw,100px) 6% 72px; display:grid; grid-template-columns:1fr 1fr; gap:clamp(32px,5vw,72px); align-items:center; }
        .eyebrow { margin:0 0 18px; color:#8e303b; font-size:.72rem; font-weight:700; letter-spacing:.16em; line-height:1.5; }
        h1,h2,h3,p { margin-top:0; }
        h1,h2 { font-family:Georgia,serif; font-weight:400; letter-spacing:-.035em; }
        h1 { font-size:clamp(2.7rem,5.5vw,5.4rem); line-height:1.04; margin-bottom:24px; }
        h2 { font-size:clamp(2.2rem,4vw,3.5rem); line-height:1.08; margin-bottom:0; }
        .intro { max-width:34rem; font-size:clamp(1.08rem,1.5vw,1.25rem); line-height:1.7; color:#5b4c4a; }
        .actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:30px; }
        .button { display:inline-flex; align-items:center; justify-content:center; gap:18px; min-height:50px; padding:14px 20px; border-radius:4px; text-decoration:none; font-weight:700; font-size:.9rem; transition:background .2s,color .2s; }
        .button:focus-visible,.card-link:focus-visible { outline:3px solid #b76738; outline-offset:4px; }
        .primary { background:#772735; color:#fff; }
        .primary:hover { background:#531a24; }
        .secondary { color:#772735; border:1px solid #ad7d7e; }
        .secondary:hover { background:#f0e5e2; }
        .hero-image { position:relative; min-width:0; }
        .hero-image :global(img) { display:block; width:100%; height:clamp(300px,40vw,510px); object-fit:cover; border-radius:4px; }
        .hero-image p { margin:12px 0 0; color:#776460; font-family:Georgia,serif; font-style:italic; font-size:.95rem; }
        .schedule,.shows { padding:clamp(58px,7vw,100px) 6%; }
        .schedule { background:#eee6dc; }
        .schedule > *, .shows > * { max-width:1120px; margin-left:auto; margin-right:auto; }
        .section-heading { display:flex; align-items:end; justify-content:space-between; gap:24px; margin-bottom:32px; }
        .section-heading > p { max-width:310px; margin:0; color:#6a5955; line-height:1.6; }
        .cards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
        .card { background:#fffdfa; border:1px solid #e1d3c8; border-radius:5px; padding:clamp(25px,4vw,42px); }
        .card-city,.show-day { color:#8e303b; font-size:.72rem; font-weight:700; letter-spacing:.13em; }
        .card h3,.show-list h3 { font-family:Georgia,serif; font-size:clamp(1.5rem,2.5vw,2rem); font-weight:400; margin:18px 0 10px; }
        .card p:not(.card-city),.show-list p { color:#665653; line-height:1.6; }
        .card .card-kind { min-height:2.8em; }
        .card .card-time { padding-top:18px; margin:25px 0 8px; border-top:1px solid #eadfd6; font-size:1.03rem; }
        .card-time strong { color:#772735; margin-left:6px; font-size:1.22rem; }
        .card-link { display:inline-block; margin-top:16px; color:#772735; font-weight:700; text-decoration:none; border-bottom:1px solid #b68083; padding-bottom:4px; }
        .schedule-note { margin-top:22px; margin-bottom:0; color:#6a5955; font-size:.9rem; }
        .shows { background:#241b1e; color:#fff9f0; }
        .shows .eyebrow,.shows .show-day { color:#dfa991; }
        .shows .section-heading > p,.shows .show-list p { color:#d0bdb8; }
        .show-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:28px; border-top:1px solid #5c4849; border-bottom:1px solid #5c4849; padding:30px 0; margin-bottom:26px; }
        .show-list h3 { margin:9px 0; }
        .show-list p { margin-bottom:0; }
        .show-list .show-day { color:#dfa991; }
        .light { background:#f4e8db; color:#41242a; }
        .light:hover { background:#fff; }
        .invitation { text-align:center; padding:clamp(65px,8vw,110px) 6%; }
        .invitation h2 { margin-bottom:20px; }
        .invitation > p:not(.eyebrow) { color:#655653; line-height:1.6; }
        .invitation .button { margin-top:12px; }
        @media (max-width:760px) {
          .hero { grid-template-columns:1fr; padding-top:45px; gap:32px; }
          .hero-image :global(img) { height:300px; }
          .section-heading { display:block; }
          .section-heading > p { margin-top:16px; }
          .cards,.show-list { grid-template-columns:1fr; }
          .card .card-kind { min-height:0; }
        }
        @media (prefers-reduced-motion:reduce) { .button { transition:none; } }
      `}</style>
    </>
  );
}
