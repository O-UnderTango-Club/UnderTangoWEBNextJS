"use client";
import { useState } from "react";
import Image from "next/image";
import { useHomeLanguage, type SiteLanguage } from "./home-language";
import styles from "./home-landing.module.css";

function Flag({code}:{code:SiteLanguage}) {
  if(code==="en") return <svg viewBox="0 0 30 20" width="24" height="16" aria-hidden="true"><path fill="#fff" d="M0 0h30v20H0z"/><path fill="#c8102e" d="M12.5 0h5v20h-5zM0 7.5h30v5H0z"/></svg>;
  if(code==="pt") return <svg viewBox="0 0 30 20" width="24" height="16" aria-hidden="true"><path fill="#009739" d="M0 0h30v20H0z"/><path fill="#ffdf00" d="m15 2 12 8-12 8L3 10z"/><circle cx="15" cy="10" r="4.5" fill="#002776"/><path d="M11 8.5q4-1 8 3" stroke="#fff" strokeWidth="1" fill="none"/></svg>;
  return <svg viewBox="0 0 30 20" width="24" height="16" aria-hidden="true"><path fill="#74acdf" d="M0 0h30v20H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><circle cx="15" cy="10" r="2" fill="#f6b40e"/></svg>;
}
export function LanguageButtons(){
  const {language,change,t}=useHomeLanguage();
  return <div className={styles.language} role="group" aria-label={t("Idiomas")}>{([["es","ES","Español"],["en","EN","English"],["pt","PT","Português"]] as const).map(([code,label,name])=><button key={code} type="button" onClick={()=>change(code)} aria-pressed={language===code} aria-label={name} lang={code}><Flag code={code}/><span>{label}</span></button>)}</div>;
}
export default function HomeLanding(){
  const {t}=useHomeLanguage();
  const [open,setOpen]=useState<"shows"|"classes"|null>(null);
  const toggle=(key:"shows"|"classes")=>setOpen(current=>current===key?null:key);
  return <section className={styles.landing} id="inicio" aria-label={t("Descubrí las experiencias")}>
    <a className={styles.skip} href="#intentions">{t("Descubrí las experiencias")} ↓</a>
    <header className={styles.header}>
      <a href="/" className={styles.brand} aria-label="UnderTango Club"><span aria-hidden="true">Ø</span><strong>UnderTango</strong></a>
      <LanguageButtons />
    </header>
    <div className={styles.panels} id="descubrir">
      <article className={styles.panel}>
        <Image className={styles.photo} src="/assets/images/portada-shows.png" alt="" fill priority sizes="(max-width: 700px) 100vw, 34vw" />
        <div className={styles.shade}/>
        <div className={styles.panelBody}>
          <p className={styles.eyebrow}>01 · UNDER TANGO</p>
          <button type="button" className={styles.panelToggle} onClick={()=>toggle("shows")} aria-expanded={open==="shows"} aria-controls="home-shows-options"><span>{t("Shows")}</span><span className={styles.plus} aria-hidden="true">{open==="shows"?"−":"+"}</span></button>
          {open!=="shows" && <p className={styles.hint}>{t("Elegí un país")}</p>}
          {open==="shows" && <div id="home-shows-options" className={styles.options}>
            <a href="/agenda" aria-label={t("Ver actividades en Argentina")}><span>🇦🇷 {t("Argentina · Puerto Iguazú")}<small>Restaurante A Piacere · {t("Sábados · 21:00")}</small></span><span aria-hidden="true">↗</span></a>
            <a href="/agenda" aria-label={t("Ver actividades en Brasil")}><span>🇧🇷 {t("Brasil · Foz do Iguaçu")}<small>Hotel Wish · {t("Viernes · 21:00")}</small></span><span aria-hidden="true">↗</span></a>
            <a href="/shows"><span>{t("Más información")}</span><span aria-hidden="true">↗</span></a>
          </div>}
        </div>
      </article>
      <article className={styles.panel}>
        <Image className={styles.photo} src="/assets/images/portada-clases.png" alt="" fill priority sizes="(max-width: 700px) 100vw, 34vw" />
        <div className={styles.shade}/>
        <div className={styles.panelBody}>
          <p className={styles.eyebrow}>02 · UNDER TANGO</p>
          <button type="button" className={styles.panelToggle} onClick={()=>toggle("classes")} aria-expanded={open==="classes"} aria-controls="home-classes-options"><span>{t("Clases")}</span><span className={styles.plus} aria-hidden="true">{open==="classes"?"−":"+"}</span></button>
          {open!=="classes" && <p className={styles.hint}>{t("Elegí un país")}</p>}
          {open==="classes" && <div id="home-classes-options" className={styles.options}>
            <a href="/clasesGrupales#argentina" aria-label={t("Ver actividades en Argentina")}><span>🇦🇷 {t("Argentina · Puerto Iguazú")}<small>La Estación · {t("Domingos · 20:00")}</small></span><span aria-hidden="true">↗</span></a>
            <a href="/clasesGrupales#brasil" aria-label={t("Ver actividades en Brasil")}><span>🇧🇷 {t("Brasil · Foz do Iguaçu")}<small>Gaia Apometria · {t("Domingos · 16:00–17:00")}</small></span><span aria-hidden="true">↗</span></a>
            <a href="https://83.undertangoclub.com/academia/tango"><span>{t("Más información")}</span><span aria-hidden="true">↗</span></a>
          </div>}
        </div>
      </article>
      <article className={styles.panel}>
        <Image className={styles.photo} src="/assets/images/portada-red.png" alt="" fill priority sizes="(max-width: 700px) 100vw, 34vw" />
        <div className={styles.shade}/>
        <div className={styles.panelBody}>
          <p className={styles.eyebrow}>03 · UNDER TANGO</p>
          <a href="https://red.undertangoclub.com/" className={styles.networkLink} aria-label={t("Ir a la Red UnderTango")}><span>{t("Todos los departamentos")}</span><span className={styles.plus} aria-hidden="true">↗</span></a>
          <p className={styles.hint}>{t("Explorá nuestras áreas y participá de la red.")}</p>
        </div>
      </article>
    </div>
  </section>;
}
