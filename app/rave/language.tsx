"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translate, type Language } from "./translations";
import styles from "./language.module.css";

const LanguageContext = createContext<{ language: Language; change: (language: Language) => void }>({ language: "es", change: () => {} });
const valid = (value: string | null): value is Language => value === "es" || value === "en" || value === "pt";
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("es");
  const pathname = usePathname();
  useEffect(() => {
    const restore = () => {
      const query = new URL(window.location.href).searchParams.get("lang");
      setLanguage(valid(query) ? query : "es");
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [pathname]);
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-AR";
    return () => { document.documentElement.lang = previous; };
  }, [language]);
  useEffect(() => {
    const previous = document.title;
    const name = pathname?.includes("pena-rave") ? (language === "en" ? "Folk Rave" : "Peña Rave") : pathname?.includes("tango-rave") ? "Tango Rave" : "UnderTango Rave";
    document.title = `${name} | ${language === "en" ? "Live band from Puerto Iguazú" : language === "pt" ? "Banda ao vivo de Puerto Iguazú" : "Banda en vivo desde Puerto Iguazú"}`;
    return () => { document.title = previous; };
  }, [language, pathname]);
  const change = (next: Language) => {
    setLanguage(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.pushState(null, "", url);
  };
  return <LanguageContext.Provider value={{ language, change }}><div lang={language}>{children}</div></LanguageContext.Provider>;
}
export function useTranslation() {
  const { language } = useContext(LanguageContext);
  return { language, t: (text: string) => translate(text, language) };
}
export function T({ children }: { children: string }) { const { t } = useTranslation(); return <>{t(children)}</>; }
export function BandNavigation({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return <nav aria-label={t("Productos de la banda")}>{children}</nav>;
}

export function Flag({ country }: { country: Language }) {
  return <svg viewBox="0 0 30 20" width="24" height="16" aria-hidden="true" focusable="false">
    {country === "es" ? <><path fill="#74acdf" d="M0 0h30v20H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><circle cx="15" cy="10" r="2" fill="#f6b40e"/></> : country === "pt" ? <><path fill="#009739" d="M0 0h30v20H0z"/><path fill="#ffdf00" d="m15 2 12 8-12 8L3 10z"/><circle cx="15" cy="10" r="4.5" fill="#002776"/><path d="M11 8.5q4-1 8 3" stroke="#fff" strokeWidth="1" fill="none"/></> : <><path fill="#fff" d="M0 0h30v20H0z"/>{Array.from({length:7}, (_, i) => <path key={i} fill="#b22234" d={`M0 ${i * 40 / 13}h30v${20 / 13}H0z`}/>)}<path fill="#3c3b6e" d="M0 0h13v10.8H0z"/>{Array.from({length:15}, (_, i) => <circle key={i} cx={1.7 + (i % 5) * 2.4} cy={2 + Math.floor(i / 5) * 3.2} r=".55" fill="#fff"/>)}</>}
  </svg>;
}
export function LanguagePicker() {
  const { language, change } = useContext(LanguageContext);
  return <div className={styles.picker} role="group" aria-label="Language / Idioma">{([['es', 'Español'], ['pt', 'Português'], ['en', 'English']] as const).map(([code, label]) => <button key={code} type="button" lang={code} aria-pressed={language === code} onClick={() => change(code)}><Flag country={code}/><span>{label}</span></button>)}</div>;
}
export function EnglishShortcut() {
  const { language, change } = useContext(LanguageContext);
  if (language === "en") return null;
  return <button className={styles.shortcut} type="button" lang="en" aria-label="Switch page to English" onClick={() => change("en")}><Flag country="en"/> English</button>;
}
export function RaveLink({ href, children, className, ...props }: { href: string; children: ReactNode; className?: string; "aria-label"?: string }) {
  const { language, t } = useTranslation();
  const [path, hash] = href.split("#");
  return <Link {...props} aria-label={props["aria-label"] ? t(props["aria-label"]) : undefined} className={className} href={`${path}${path.includes("?") ? "&" : "?"}lang=${language}${hash ? `#${hash}` : ""}`}>{children}</Link>;
}
export function WhatsAppLink({ message, className, children }: { message: string; className?: string; children: ReactNode }) {
  const { t } = useTranslation();
  return <a className={className} href={`https://wa.me/5493757618270?text=${encodeURIComponent(t(message))}`} target="_blank" rel="noopener noreferrer">{children}</a>;
}
