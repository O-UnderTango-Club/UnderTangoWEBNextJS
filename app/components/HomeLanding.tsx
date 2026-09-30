'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import styles from './home-landing.module.css';

type IconName = 'calendar' | 'learn' | 'music' | 'compass' | 'business' | 'search' | 'arrow' | 'home' | 'contact';

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    calendar: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 11h16m-11 4h1m4 0h1m-6 3h1" /></>,
    learn: <><path d="m2 9 10-5 10 5-10 5-10-5Zm4 2v6c4 3 8 3 12 0v-6m4-2v8" /></>,
    music: <><path d="M9 18V5l11-2v13M9 9l11-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="17" cy="16" rx="3" ry="3" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2 6-6 2 2-6 6-2Z" /></>,
    business: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12c5 3 13 3 18 0m-9 0v4" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    home: <><path d="m3 10 9-7 9 7v11h-6v-7H9v7H3V10Z" /></>,
    contact: <><path d="M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.8L3 21l1.3-5A9 9 0 1 1 21 11.5Z" /><path d="M8 11h8m-8 4h5" /></>,
  };
  return <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const categories: { title: string; description: string; href: string; icon: IconName; image: string; position?: string; keywords: string; mobileOnly?: boolean }[] = [
  { title: 'Eventos', description: 'Milongas, shows y encuentros', href: '/agenda', icon: 'calendar', image: '/assets/images/grupal1.png', position: 'center 20%', keywords: 'agenda calendario milonga show festival rave bailar' },
  { title: 'Clases', description: 'Aprendé y compartí el tango', href: '#classes', icon: 'learn', image: '/assets/images/la-cava-registro-01.webp', position: 'center 14%', keywords: 'aprender escuela curso baile grupales privadas academia' },
  { title: 'Artistas', description: 'Conocé a nuestro equipo', href: '/artistas', icon: 'music', image: '/assets/images/tango-rave-elenco.jpg', keywords: 'personas profesionales musicos bailarines equipo', mobileOnly: true },
  { title: 'Experiencias', description: 'Viví el tango en Iguazú', href: '/la-cava', icon: 'compass', image: '/images/home/cultura-conecta-iguazu.webp', position: '70% 45%', keywords: 'turismo cultura cataratas iguazu cena la cava' },
  { title: 'Negocios', description: 'Llevá cultura a tu proyecto', href: '/produccion-artistica', icon: 'business', image: '/assets/images/tango-rave-elenco.jpg', position: 'center 15%', keywords: 'contratar produccion empresas hoteles eventos corporativos oportunidades' },
];

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function HomeLanding() {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matches = categories.filter(category => terms.every(term => normalize(`${category.title} ${category.description} ${category.keywords}`).includes(term)));

  function openSearch() {
    setSearchOpen(true);
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  return (
    <div className={styles.landing} id="inicio">
      <a className={styles.skipLink} href="#descubrir">Ir a las categorías</a>
      <header className={styles.header}>
        <a className={styles.brand} href="#inicio" aria-label="UnderTango, inicio"><span className={styles.symbol} aria-hidden="true">Ø</span><span>UnderTango</span></a>
        <nav className={styles.desktopNav} aria-label="Navegación principal">
          <a href="#descubrir">Descubrir</a><a href="/agenda">Eventos</a><a href="/artistas">Artistas</a><a href="/produccion-artistica">Negocios</a><a href="/la-cava">Experiencias</a>
        </nav>
        <button className={styles.searchToggle} type="button" onClick={openSearch} aria-label="Buscar en UnderTango" aria-controls="home-search"><Icon name="search" /></button>
        <a className={styles.contactLink} href="/reservas">Conectemos <Icon name="arrow" /></a>
      </header>

      <div className={styles.hero}>
        <Image className={styles.heroImage} src="/images/home/cultura-conecta-iguazu.webp" alt="Una pareja baila tango frente a las Cataratas del Iguazú al atardecer. Ilustración de UnderTango." fill priority sizes="100vw" quality={85} />
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>DESDE IGUAZÚ, AL MUNDO</p>
          <h1 className={styles.title}><span className={styles.desktopTitle}>Más tango.<br />Más oportunidades.</span><span className={styles.mobileTitle}>Cultura<br />que conecta.</span></h1>
          <p className={styles.lede}>Personas, experiencias y oportunidades.<br />La cultura argentina en movimiento.</p>
          <form id="home-search" className={`${styles.search} ${searchOpen ? styles.searchExpanded : ''}`} role="search" onSubmit={event => { event.preventDefault(); document.getElementById('descubrir')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }}>
            <Icon name="search" />
            <label className={styles.srOnly} htmlFor="home-query">Buscar secciones de UnderTango</label>
            <input ref={searchRef} id="home-query" type="search" placeholder="Buscá eventos, clases, artistas…" value={query} onChange={event => setQuery(event.target.value)} aria-controls="home-categories" />
            <button type="submit" aria-label="Ver resultados"><Icon name="arrow" /></button>
          </form>
        </div>
        <p className={styles.imageCaption}>Tango. Naturaleza. Encuentro.</p>
      </div>

      <div id="descubrir" className={styles.discovery}>
        <div className={styles.discoveryHeading}><p>ENCONTRÁ TU PRÓXIMA EXPERIENCIA</p><span>Una cultura. Muchas formas de vivirla.</span></div>
        <div id="home-categories" className={styles.categories}>
          {matches.map(category => <a key={category.title} href={category.href} className={`${styles.card} ${category.mobileOnly && !terms.length ? styles.mobileOnly : ''}`} data-undertango-event="intent_click" data-undertango-intent={category.title.toLowerCase()} data-undertango-cta={`Portada: ${category.title}`}>
            <div className={styles.cardImage}><Image src={category.image} alt="" fill sizes="(max-width: 700px) 1px, (max-width: 1200px) 25vw, 280px" style={{ objectPosition: category.position }} /></div>
            <Icon name={category.icon} className={styles.categoryIcon} />
            <div className={styles.cardCopy}><strong>{category.title}</strong><span>{category.description}</span></div>
            <Icon name="arrow" className={styles.cardArrow} />
          </a>)}
        </div>
        {terms.length > 0 && <p className={styles.searchStatus} role="status">{matches.length ? `${matches.length} ${matches.length === 1 ? 'sección encontrada' : 'secciones encontradas'}` : 'No encontramos una sección con ese nombre. Probá con tango, clases o shows.'} <button type="button" onClick={() => { setQuery(''); searchRef.current?.focus(); }}>Ver todas</button></p>}
        <div className={styles.discoveryFooter}><span>PUERTO IGUAZÚ <i /> TRIPLE FRONTERA</span><div className={styles.footerLinks}><a href="/central">Ø Central</a><a href="#intentions">Conocé UnderTango <span aria-hidden="true">↓</span></a></div></div>
      </div>

      <nav className={styles.mobileNav} aria-label="Accesos rápidos">
        <a href="#inicio" aria-label="Ir al inicio"><Icon name="home" /><span>Inicio</span></a>
        <a href="#descubrir"><Icon name="compass" /><span>Explorar</span></a>
        <a href="/central"><Icon name="business" /><span>Ø Central</span></a>
        <a href="/reservas"><Icon name="contact" /><span>Contacto</span></a>
      </nav>
    </div>
  );
}
