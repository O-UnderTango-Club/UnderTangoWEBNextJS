import Link from "next/link";
import Image from "next/image";
import { VideoSample } from "./showcase";
import styles from "./rave.module.css";
import page from "./showcase.module.css";
import musicians from "./musicians.module.css";

const members = [
  { instrument: "Piano", name: "Pablo Cieslik", image: "piano", position: "56% center" },
  { instrument: "Saxofón", name: "Agustín Aguilar · Sirahsax", image: "saxofon", position: "center 30%" },
  { instrument: "Guitarra", name: "Pablo Tevez", image: "guitarra", position: "center 22%" },
  { instrument: "Bajo", name: "Iván Escobar", image: "bajo", position: "center 22%" },
  { instrument: "Batería", name: "Sergio Peralta", image: "bateria-horizonte", position: "center 30%" },
];

const formats = [
  { number: "01", title: "Tango Rave", root: "TANGO · ELECTRÓNICA · ROCK", text: "El tango entra en otra frecuencia. Instrumentos en vivo, bases electrónicas y energía de rock en un recorrido que va de la intensidad del tango a la fiesta.", href: "/rave/tango-rave", tone: "lime" },
  { number: "02", title: "Peña Rave", root: "RAÍZ ARGENTINA · SONIDO CONTEMPORÁNEO", text: "El repertorio argentino y misionero se transforma con arreglos propios, instrumentos en vivo y pulso electrónico. Una peña que invita a encontrarse y bailar.", href: "/rave/pena-rave", tone: "warm" },
  { number: "03", title: "Rave Triple Frontera", root: "ARGENTINA · BRASIL · PARAGUAY", text: "Músicas de los tres países se encuentran en un mismo lenguaje. La identidad de la frontera atraviesa el rock, el saxofón y la electrónica para construir una fiesta compartida.", href: "/rave/triple-frontera", tone: "blue" },
];

export default function RavePage() {
  return <main id="contenido" className={page.page}>
    <section className={page.hero} aria-labelledby="band-title">
      <div className={page.heroCopy}>
        <p className={page.eyebrow}>Ø UNDERTANGO · BANDA EN VIVO</p>
        <h1 id="band-title">La raíz.<br />El pulso.<br /><em>La fiesta.</em></h1>
        <p className={page.lead}>Cinco instrumentistas.<br />Tres universos. Un sonido propio.</p>
        <p>Desde Puerto Iguazú, llevamos la música de la Triple Frontera a una experiencia que mezcla rock, electrónica y saxofón. Creamos climas, atravesamos emociones y hacemos crecer cada encuentro hasta convertirlo en una verdadera fiesta.</p>
        <div className={page.actions}><a className={styles.button} href="#formatos">Conocé los tres formatos</a><a className={styles.textLink} href="#musicos">Los músicos ↓</a></div>
      </div>
      <div className={page.heroMedia}>
        <span className={page.mediaKicker}>LA BANDA, EN UN REEL</span>
        <VideoSample id="bwUnN7k22bE" title="Spot oficial · UnderTango Rave" portrait />
        <p className={page.caption}>Música en vivo · identidad de frontera · energía de fiesta</p>
      </div>
    </section>
    <div className={page.identityStrip} aria-label="Nuestra propuesta"><span>05 instrumentistas</span><span>03 formatos</span><span>Argentina · Brasil · Paraguay</span><span>Una identidad propia</span></div>
    <section className={`${page.section} ${page.liveSection}`} aria-labelledby="live-title">
      <div className={page.sectionHeading}><div><p className={page.eyebrow}>MATERIAL PARA CONOCERNOS</p><h2 id="live-title">Así suena el encuentro.</h2></div><p>Dos muestras de UnderTango Rave en vivo.</p></div>
      <div className={page.twoVideos}><VideoSample id="7yVf96vjurQ" title="Tango Rave en vivo" portrait /><VideoSample id="sdWzQDMeiYY" title="Un shock de energía · UnderTango Rave" portrait /></div>
    </section>
    <section id="musicos" className={page.section} aria-labelledby="musicians-title">
      <div className={page.sectionHeading}><div><p className={page.eyebrow}>LA BANDA</p><h2 id="musicians-title">Cinco músicos.<br /><em>Una conversación.</em></h2></div><p>Cada instrumento aporta su voz. Los arreglos, la escucha y el encuentro entre los músicos construyen el sonido de la banda.</p></div>
      <div className={musicians.grid}>{members.map(member => <article key={member.image} className={musicians.card}>
        <div className={musicians.portrait}>
          <Image src={`/images/band/${member.image}.jpg`} alt={member.name ? `${member.name} · ${member.instrument}` : `Integrante de la banda · ${member.instrument}`} fill sizes="(max-width: 600px) calc(100vw - 48px), (max-width: 1100px) 30vw, 220px" style={{ objectFit: "cover", objectPosition: member.position }} />
        </div>
        <div className={musicians.copy}>{member.name ? <><p className={page.eyebrow}>{member.instrument}</p><h3>{member.name}</h3></> : <h3>{member.instrument}</h3>}</div>
      </article>)}</div>
      <a className={styles.textLink} href="https://youtu.be/bwUnN7k22bE" target="_blank" rel="noopener noreferrer">Ver el spot oficial de la banda en YouTube ↗</a>
    </section>
    <section className={`${page.section} ${page.production}`} aria-labelledby="production-title">
      <div><p className={page.eyebrow}>PARA TU ESCENARIO</p><h2 id="production-title">Del clima íntimo<br />a la fiesta compartida.</h2><p>Una propuesta para teatros, festivales, hoteles y eventos institucionales o privados. Conversamos sobre el público, el espacio y el momento del evento para elegir el repertorio y el recorrido musical.</p><p>La formación musical es de cinco instrumentistas. La participación de bailarines y los recursos de puesta escénica se coordinan según la propuesta de cada evento.</p></div>
      <div className={page.productionNotes}><h3>Preparemos la fecha</h3><p>Contanos ciudad, espacio, fecha tentativa y tipo de público.</p><p>Consultanos por duración, formatos de set y requerimientos técnicos.</p><a className={styles.button} href={`https://wa.me/5493757618270?text=${encodeURIComponent("Hola, me interesa la banda de UnderTango para un evento. Ciudad, espacio y fecha tentativa: ")}`} target="_blank" rel="noopener noreferrer">Consultar por la banda ↗</a></div>
    </section>
    <section id="formatos" className={page.section} aria-labelledby="formats-title">
      <div className={page.sectionHeading}><div><p className={page.eyebrow}>EL MISMO ADN, DISTINTOS ENCUENTROS</p><h2 id="formats-title">Elegí cómo vivirlo.</h2></div><p>Una banda versátil con tres propuestas reconocibles, atravesadas por la música en vivo y el pulso electrónico.</p></div>
      <div className={page.formatGrid}>{formats.map(format => <article key={format.number} className={`${page.formatCard} ${page[format.tone] || ""}`}>
        <span className={page.number}>{format.number}</span><p className={page.eyebrow}>{format.root}</p><h3>{format.title}</h3><p>{format.text}</p>{format.number === "03" ? <a className={styles.textLink} href="https://wa.me/5493757618270?text=Hola%2C%20me%20interesa%20Rave%20Triple%20Frontera" target="_blank" rel="noopener noreferrer">Consultar por la propuesta ↗</a> : <Link className={styles.textLink} href={format.href}>Conocer la propuesta ↗</Link>}
      </article>)}</div>
    </section>
  </main>;
}
