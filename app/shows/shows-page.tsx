import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";
import { FixedSiteLanguage, type SiteLanguage } from "../components/home-language";
import styles from "../produccion-artistica/produccion-artistica.module.css";
import local from "./shows.module.css";
import { showLanguages, showsCopy } from "./shows-copy";

const site = "https://www.undertangoclub.com";
const brand = "Ø UnderTango Club";
const iframePermissions = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
const languages = Object.keys(showLanguages) as SiteLanguage[];

export function showsMetadata(language: SiteLanguage): Metadata {
  const copy = showsCopy[language];
  const current = showLanguages[language];
  const title = `${copy.title} | ${brand}`;

  return {
    title,
    description: copy.description,
    keywords: language === "es" ? [
      "producción artística Triple Frontera",
      "producción de shows Puerto Iguazú",
      "produção artística Foz do Iguaçu",
      "shows para eventos Foz do Iguaçu",
      "artistas para eventos Ciudad del Este",
      "show de samba",
      "danza paraguaya con arpa",
      "show de tango",
      "música en vivo para eventos",
      "performers fuego zancos",
    ] : undefined,
    alternates: {
      canonical: current.path,
      languages: {
        "es-AR": showLanguages.es.path,
        "pt-BR": showLanguages.pt.path,
        en: showLanguages.en.path,
        "x-default": showLanguages.es.path,
      },
    },
    openGraph: {
      title,
      description: copy.shareDescription,
      url: current.path,
      siteName: brand,
      locale: current.locale,
      alternateLocale: languages.filter((option) => option !== language).map((option) => showLanguages[option].locale),
      type: "website",
      images: [{ url: "/shows/opengraph-image", width: 1200, height: 630, alt: copy.videoTitle }],
    },
  };
}

export default function ShowsPage({ language }: { language: SiteLanguage }) {
  const copy = showsCopy[language];
  const current = showLanguages[language];
  const whatsapp = `https://wa.me/5493757618270?text=${encodeURIComponent(copy.whatsapp)}`;
  const catalog = [
    { id: "5x1oUmMOsaY", title: "Raíces da Fronteira", description: copy.roots },
    { id: "jKjgHl4xL0A", title: copy.band, description: copy.bandDetail },
    { id: "scBf8VkYdPQ", title: copy.duo, description: copy.duoDetail },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: brand,
    url: `${site}${current.path}`,
    telephone: "+54 9 3757 61-8270",
    description: copy.description,
    areaServed: ["Puerto Iguazú", "Foz do Iguaçu", "Ciudad del Este"].map((name) => ({ "@type": "City", name })),
    knowsAbout: ["Tango", "Samba", "Danza paraguaya", "Arpa paraguaya", "Música en vivo", "Producción de espectáculos", "Performers", "Manipulación de fuego", "Zancos"],
  };

  return (
    <FixedSiteLanguage language={language}>
      <div lang={current.tag}>
        <Header showsHref={current.path} />
        <main className={styles.page}>
          <nav className={local.languageSwitch} aria-label={copy.languageLabel}>
            {languages.map((option) => {
              const { label, tag, path } = showLanguages[option];
              return (
                <Link key={option} href={path} hrefLang={tag} lang={tag} aria-current={option === language ? "page" : undefined}>
                  {label}
                </Link>
              );
            })}
          </nav>

          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{copy.eyebrow}</p>
              <h1><span>{copy.headline[0]}</span>{" "}<span>{copy.headline[1]}</span></h1>
              <p className={styles.lead}>{copy.intro} <strong>{copy.promise}</strong></p>
              <div className={styles.heroActions}>
                <a
                  className={styles.primaryCta}
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-undertango-event="intent_click"
                  data-undertango-intent="contratar_show"
                  data-undertango-subintent="produccion_artistica_integral"
                  data-undertango-cta="Diseñar mi espectáculo"
                >
                  {copy.contact}
                </a>
                <Link className={styles.secondaryCta} href="#catalogo">{copy.explore}</Link>
              </div>
              <div className={styles.heroProof} aria-label={copy.proofLabel}>
                <span>{copy.countries}</span>
                <span>{copy.expertise}</span>
              </div>
            </div>

            <div className={styles.heroVideoWrap}>
              <div className={styles.videoTopline}><span>{copy.videoLabel}</span><span>01:00</span></div>
              <div className={styles.videoFrame}>
                <iframe
                  src="https://www.youtube.com/embed/ONRopDSKkro?rel=0&playsinline=1"
                  title={copy.videoTitle}
                  allow={iframePermissions}
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <p className={styles.videoCaption}>{copy.videoCaption}</p>
            </div>
          </section>

          <section id="catalogo" className={styles.section} aria-labelledby="videos-produccion-title">
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>{copy.catalogLabel}</p>
              <h2 id="videos-produccion-title">{copy.catalogTitle}</h2>
              <p>{copy.catalogIntro}</p>
            </div>
            <div className={styles.showVideoGrid}>
              {catalog.map(({ id, title, description }) => (
                <article className={styles.showVideoCard} key={id}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <div className={styles.portraitVideo}>
                    <iframe
                      src={`https://www.youtube.com/embed/${id}?rel=0&playsinline=1`}
                      title={title}
                      allow={iframePermissions}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                  <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">
                    {copy.youtube} ↗
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section id="produccion" className={styles.splitDecision}>
            <div>
              <p className={styles.eyebrow}>{copy.formatsLabel}</p>
              <h2>{copy.formatsTitle}</h2>
              <p>{copy.formatsText}</p>
            </div>
            <div className={styles.splitPrimary}>
              <p className={styles.eyebrow}>{copy.customLabel}</p>
              <h2>{copy.customTitle}</h2>
              <p>{copy.customText}</p>
              <a className={styles.primaryCta} href={whatsapp} target="_blank" rel="noopener noreferrer">{copy.customContact}</a>
            </div>
          </section>

          <section className={`${styles.section} ${styles.processSection}`} aria-labelledby="pasos-title">
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>{copy.processLabel}</p>
              <h2 id="pasos-title">{copy.processTitle}</h2>
            </div>
            <ol className={styles.processGrid}>
              {copy.steps.map(({ title, text }, index) => (
                <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></li>
              ))}
            </ol>
          </section>
        </main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Footer />
      </div>
    </FixedSiteLanguage>
  );
}
