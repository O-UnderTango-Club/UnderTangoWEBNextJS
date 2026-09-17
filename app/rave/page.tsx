"use client";

import { T, WhatsAppLink, RaveLink, useTranslation } from "./language";
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
  const { t } = useTranslation();
  return <main id="contenido" className={page.page}>
    <section className={page.hero} aria-labelledby="band-title">
      <div className={page.heroCopy}>
        <p className={page.eyebrow}><T>{"Ø UNDERTANGO · BANDA EN VIVO"}</T></p>
        <h1 id="band-title"><T>{"La raíz."}</T><br /><T>{"El pulso."}</T><br /><em><T>{"La fiesta."}</T></em></h1>
        <p className={page.lead}><T>{"Cinco instrumentistas."}</T><br /><T>{"Tres universos. Un sonido propio."}</T></p>
        <p><T>{"Desde Puerto Iguazú, llevamos la música de la Triple Frontera a una experiencia que mezcla rock, electrónica y saxofón. Creamos climas, atravesamos emociones y hacemos crecer cada encuentro hasta convertirlo en una verdadera fiesta."}</T></p>
        <div className={page.actions}><a className={styles.button} href="#formatos"><T>{"Conocé los tres formatos"}</T></a><a className={styles.textLink} href="#musicos"><T>{"Los músicos ↓"}</T></a></div>
      </div>
      <div className={page.heroMedia}>
        <span className={page.mediaKicker}><T>{"LA BANDA, EN UN REEL"}</T></span>
        <VideoSample id="bwUnN7k22bE" title="Spot oficial · UnderTango Rave" portrait poster="/images/band/rave-spot-cover-2026-09.png" />
        <p className={page.caption}><T>{"Música en vivo · identidad de frontera · energía de fiesta"}</T></p>
      </div>
    </section>
    <div className={page.identityStrip} aria-label={t("Nuestra propuesta")}><span><T>{"05 instrumentistas"}</T></span><span><T>{"03 formatos"}</T></span><span><T>{"Argentina · Brasil · Paraguay"}</T></span><span><T>{"Una identidad propia"}</T></span></div>
    <section id="musicos" className={page.section} aria-labelledby="musicians-title">
      <div className={page.sectionHeading}><div><p className={page.eyebrow}><T>{"LA BANDA"}</T></p><h2 id="musicians-title"><T>{"Cinco músicos."}</T><br /><em><T>{"Una conversación."}</T></em></h2></div><p><T>{"Cada instrumento aporta su voz. Los arreglos, la escucha y el encuentro entre los músicos construyen el sonido de la banda."}</T></p></div>
      <div className={musicians.grid}>{members.map(member => <article key={member.image} className={musicians.card}>
        <div className={musicians.portrait}>
          <Image src={`/images/band/${member.image}.jpg`} alt={member.name ? `${member.name} · ${t(member.instrument)}` : `Integrante de la banda · ${t(member.instrument)}`} fill sizes="(max-width: 600px) calc(100vw - 48px), (max-width: 1100px) 30vw, 220px" style={{ objectFit: "cover", objectPosition: member.position }} />
        </div>
        <div className={musicians.copy}>{member.name ? <><p className={page.eyebrow}>{t(member.instrument)}</p><h3>{member.name}</h3></> : <h3>{t(member.instrument)}</h3>}</div>
      </article>)}</div>
      <a className={styles.textLink} href="https://youtu.be/bwUnN7k22bE" target="_blank" rel="noopener noreferrer"><T>{"Ver el spot oficial de la banda en YouTube ↗"}</T></a>
    </section>
    <section className={`${page.section} ${page.liveSection}`} aria-labelledby="live-title">
      <div className={page.sectionHeading}><div><p className={page.eyebrow}><T>{"MATERIAL PARA CONOCERNOS"}</T></p><h2 id="live-title"><T>{"Así suena el encuentro."}</T></h2></div><p><T>{"Dos muestras de UnderTango Rave en vivo."}</T></p></div>
      <div className={page.twoVideos}><VideoSample id="Rv-paFARbME" title="Banda musical · UnderTango" portrait /><VideoSample id="sdWzQDMeiYY" title="Un shock de energía · UnderTango Rave" portrait /></div>
    </section>
    <section className={`${page.section} ${page.production}`} aria-labelledby="production-title">
      <div><p className={page.eyebrow}><T>{"PARA TU ESCENARIO"}</T></p><h2 id="production-title"><T>{"Del clima íntimo"}</T><br /><T>{"a la fiesta compartida."}</T></h2><p><T>{"Una propuesta para teatros, festivales, hoteles y eventos institucionales o privados. Conversamos sobre el público, el espacio y el momento del evento para elegir el repertorio y el recorrido musical."}</T></p><p><T>{"La formación musical es de cinco instrumentistas. La participación de bailarines y los recursos de puesta escénica se coordinan según la propuesta de cada evento."}</T></p></div>
      <div className={page.productionNotes}><h3><T>{"Preparemos la fecha"}</T></h3><p><T>{"Contanos ciudad, espacio, fecha tentativa y tipo de público."}</T></p><p><T>{"Consultanos por duración, formatos de set y requerimientos técnicos."}</T></p><a className={styles.button} href={`https://wa.me/5493757618270?text=${encodeURIComponent(t("Hola, me interesa la banda de UnderTango para un evento. Ciudad, espacio y fecha tentativa: "))}`} target="_blank" rel="noopener noreferrer"><T>{"Consultar por la banda ↗"}</T></a></div>
    </section>
    <section id="formatos" className={page.section} aria-labelledby="formats-title">
      <div className={page.sectionHeading}><div><p className={page.eyebrow}><T>{"EL MISMO ADN, DISTINTOS ENCUENTROS"}</T></p><h2 id="formats-title"><T>{"Elegí cómo vivirlo."}</T></h2></div><p><T>{"Una banda versátil con tres propuestas reconocibles, atravesadas por la música en vivo y el pulso electrónico."}</T></p></div>
      <div className={page.formatGrid}>{formats.map(format => <article key={format.number} className={`${page.formatCard} ${page[format.tone] || ""}`}>
        <span className={page.number}>{format.number}</span><p className={page.eyebrow}>{t(format.root)}</p><h3>{format.title}</h3><p>{t(format.text)}</p>{format.number === "03" ? <WhatsAppLink className={styles.textLink} message={"Hola, me interesa Rave Triple Frontera"}><T>{"Consultar por la propuesta ↗"}</T></WhatsAppLink> : <RaveLink className={styles.textLink} href={format.href}><T>{"Conocer la propuesta ↗"}</T></RaveLink>}
      </article>)}</div>
    </section>
  </main>;
}
