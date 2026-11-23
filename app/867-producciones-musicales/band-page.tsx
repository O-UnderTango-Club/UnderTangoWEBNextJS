import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";
import { FixedSiteLanguage, type SiteLanguage } from "../components/home-language";
import GalleryVideo from "../galeria/GalleryVideo";
import { showLanguages } from "../shows/shows-copy";
import { bandCopy, bandLanguages } from "./band-copy";
import styles from "./banda.module.css";

const brand = "Ø UnderTango Club";
const mainVideo = "jKjgHl4xL0A";
const languages = Object.keys(bandLanguages) as SiteLanguage[];

export function bandMetadata(language: SiteLanguage): Metadata {
  const copy = bandCopy[language];
  const current = bandLanguages[language];
  const title = `${copy.headline} | ${brand}`;
  const description = `${copy.lead}. ${copy.description}`;

  return {
    title,
    description,
    alternates: {
      canonical: current.path,
      languages: {
        "es-AR": bandLanguages.es.path,
        "pt-BR": bandLanguages.pt.path,
        en: bandLanguages.en.path,
        "x-default": bandLanguages.es.path,
      },
    },
    openGraph: {
      title,
      description,
      url: current.path,
      siteName: brand,
      locale: current.locale,
      alternateLocale: languages
        .filter((option) => option !== language)
        .map((option) => bandLanguages[option].locale),
      type: "website",
      images: [
        {
          url: `https://i.ytimg.com/vi/${mainVideo}/hqdefault.jpg`,
          alt: copy.mainVideoTitle,
        },
      ],
    },
  };
}

function BookingLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className={styles.bookingLink}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-undertango-event="intent_click"
      data-undertango-intent="contratar_show"
      data-undertango-subintent="banda_en_vivo"
      data-undertango-cta="Consultar por WhatsApp"
    >
      {label} <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function BandPage({ language }: { language: SiteLanguage }) {
  const copy = bandCopy[language];
  const current = bandLanguages[language];
  const bookingUrl = `https://wa.me/5493757618270?text=${encodeURIComponent(copy.bookingMessage)}`;

  return (
    <FixedSiteLanguage language={language}>
      <div lang={current.tag}>
        <Header showsHref={showLanguages[language].path} />
        <main className={styles.page}>
          <div className={styles.shell}>
            <nav className={styles.languageSwitch} aria-label={copy.languageLabel}>
              {languages.map((option) => {
                const { label, tag, path } = bandLanguages[option];
                return (
                  <Link key={option} href={path} hrefLang={tag} lang={tag} aria-current={option === language ? "page" : undefined}>
                    {label}
                  </Link>
                );
              })}
            </nav>

            <section className={styles.hero} aria-labelledby="band-title">
              <header className={styles.intro}>
                <p className={styles.label}>{copy.eyebrow}</p>
                <h1 id="band-title">{copy.headline}</h1>
                <p className={styles.lead}>{copy.lead}</p>
                <p>{copy.intro}</p>
                <BookingLink href={bookingUrl} label={copy.bookingLabel} />
              </header>
              <div className={styles.feature}>
                <GalleryVideo id={mainVideo} title={copy.mainVideoTitle} priority />
              </div>
            </section>

            <section className={styles.details} aria-labelledby="band-format">
              <div>
                <h2 id="band-format">{copy.formatTitle}</h2>
                <p>{copy.formatText}</p>
              </div>
              <dl className={styles.facts}>
                <div><dt>{copy.lineupLabel}</dt><dd>{copy.lineup}</dd></div>
                <div><dt>{copy.durationLabel}</dt><dd>{copy.duration}</dd></div>
              </dl>
            </section>

            <section className={styles.more} aria-labelledby="band-live">
              <h2 id="band-live">{copy.liveTitle}</h2>
              <div className={styles.videoGrid}>
                <div className={styles.videoCard}>
                  <GalleryVideo id="iQOyq6xWdcc" title={copy.bailongoVideoTitle} portrait />
                </div>
                <div className={styles.videoCard}>
                  <GalleryVideo id="7yVf96vjurQ" title={copy.raveVideoTitle} portrait />
                  <p>{copy.raveCaption}</p>
                </div>
              </div>
            </section>

            <section className={styles.contact} aria-labelledby="band-contact">
              <div>
                <h2 id="band-contact">{copy.contactTitle}</h2>
                <p>{copy.contactText}</p>
              </div>
              <BookingLink href={bookingUrl} label={copy.bookingLabel} />
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </FixedSiteLanguage>
  );
}
