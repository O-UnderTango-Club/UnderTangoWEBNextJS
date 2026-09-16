"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { activities, artistNames, cities, updatedLabel, type Activity, type CityId } from "./data";
import styles from "./mapa.module.css";
import "../../public/vendor/leaflet-1.9.4/leaflet.css";

type Point = [number, number];
type MapInstance = {
  fitBounds: (bounds: Point[], options?: Record<string, unknown>) => MapInstance;
  setView: (point: Point, zoom: number, options?: Record<string, unknown>) => MapInstance;
  getZoom: () => number; on: (event: string, callback: () => void) => MapInstance;
  remove: () => void; invalidateSize: () => void;
};
type MarkerInstance = {
  addTo: (map: MapInstance) => MarkerInstance; remove: () => void;
  on: (event: string, callback: () => void) => MarkerInstance;
};
type Leaflet = {
  map: (element: HTMLElement, options: Record<string, unknown>) => MapInstance;
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: MapInstance) => void; on: (event: string, cb: () => void) => void };
  divIcon: (options: Record<string, unknown>) => unknown;
  marker: (point: Point, options: Record<string, unknown>) => MarkerInstance;
};

const allBounds: Point[] = [[-25.632, -54.648], [-25.415, -54.366]];

export default function ProjectMap() {
  const [cityFilter, setCityFilter] = useState<CityId | "all">("all");
  const [artistFilter, setArtistFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [copied, setCopied] = useState(false);
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markers = useRef<MarkerInstance[]>([]);
  const library = useRef<Leaflet | null>(null);
  const [zoom, setZoom] = useState(11);
  const filtered = useMemo(() => activities.filter(a => (cityFilter === "all" || a.city === cityFilter) && (artistFilter === "all" || a.artists.includes(artistFilter))), [cityFilter, artistFilter]);
  const active = activities.find(a => a.id === selected);

  const selectActivity = useCallback((activity: Activity) => {
    setSelected(activity.id); setCopied(false);
    mapRef.current?.setView(activity.coordinates, activity.approximate ? 14 : 16, { animate: false });
    window.history.replaceState(null, "", `#${activity.id}`);
    if (window.matchMedia("(max-width: 760px)").matches) mapNode.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, []);

  const showRegion = useCallback(() => {
    setCityFilter("all"); setArtistFilter("all"); setSelected(null); setCopied(false);
    mapRef.current?.fitBounds(allBounds, { padding: [30, 35], animate: false });
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (!ready || !mapNode.current) return;
    const L = (window as Window & { L?: Leaflet }).L;
    if (!L) { setMapError(true); return; }
    library.current = L;
    const map = L.map(mapNode.current, { scrollWheelZoom: false, zoomControl: true, minZoom: 9, maxZoom: 18 });
    mapRef.current = map;
    map.fitBounds(allBounds, { padding: [30, 35] });
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    });
    tiles.addTo(map);
    tiles.on("tileerror", () => setMapError(true));
    tiles.on("load", () => setMapError(false));
    map.on("zoomend", () => setZoom(map.getZoom()));
    setZoom(map.getZoom());
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(mapNode.current);
    const linkedActivity = activities.find(a => `#${a.id}` === window.location.hash);
    if (linkedActivity) selectActivity(linkedActivity);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; markers.current = []; };
  }, [ready, selectActivity]);

  useEffect(() => {
    const L = library.current; const map = mapRef.current;
    if (!L || !map || !ready) return;
    markers.current.forEach(marker => marker.remove());
    const next: MarkerInstance[] = [];
    if (zoom < 13) {
      cities.forEach(city => {
        const group = filtered.filter(a => a.city === city.id);
        if (!group.length) return;
        const icon = L.divIcon({ className: styles.cityMarker, html: `<span class="${styles.cityDot}">${group.length}</span><span class="${styles.cityLabel} ${city.id === "santa-terezinha" ? styles.labelLeft : ""}">${city.name}<small>${city.country}</small></span>`, iconSize: [44, 44], iconAnchor: [22, 22] });
        const marker = L.marker(city.coordinates, { icon, keyboard: true, title: `${city.name}: ${group.length} actividades`, alt: city.name }).addTo(map);
        marker.on("click", () => {
          setCityFilter(city.id); setSelected(null);
          map.fitBounds(group.map(a => a.coordinates), { padding: [65, 65], maxZoom: group.length > 1 ? 14 : 13, animate: false });
        });
        next.push(marker);
      });
    } else {
      filtered.forEach(activity => {
        const icon = L.divIcon({ className: styles.activityMarker, html: `<span class="${styles.activityDot} ${selected === activity.id ? styles.chosenDot : ""}">${activity.number}</span>`, iconSize: [42, 42], iconAnchor: [21, 21] });
        const marker = L.marker(activity.coordinates, { icon, keyboard: true, title: activity.venue, alt: activity.venue }).addTo(map);
        marker.on("click", () => selectActivity(activity));
        next.push(marker);
      });
    }
    markers.current = next;
  }, [filtered, ready, zoom, selected, selectActivity]);

  const changeCity = (value: CityId | "all") => {
    setCityFilter(value); setSelected(null);
    const group = activities.filter(a => value === "all" || a.city === value);
    mapRef.current?.fitBounds(value === "all" ? allBounds : group.map(a => a.coordinates), { padding: [65, 65], maxZoom: value === "all" ? 11 : 14, animate: false });
  };

  const changeArtist = (value: string) => {
    setArtistFilter(value); setSelected(null); setCityFilter("all");
    const group = activities.filter(a => value === "all" || a.artists.includes(value));
    mapRef.current?.fitBounds(value === "all" ? allBounds : group.map(a => a.coordinates), { padding: [65, 65], maxZoom: 14, animate: false });
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); } catch { setCopied(false); }
  };

  return <main className={styles.page}>
    <Script src="/vendor/leaflet-1.9.4/leaflet.js" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setMapError(true)} />
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="UnderTango, inicio"><span>Ø</span> UNDERTANGO</Link>
      <span className={styles.headerCaption}>UN TERRITORIO. MUCHOS ENCUENTROS.</span>
      <button className={styles.share} type="button" onClick={copyLink}>{copied ? "Enlace copiado ✓" : "Compartir mapa ↗"}</button>
    </header>

    <div className={styles.intro}>
      <div><p className={styles.eyebrow}>ARGENTINA · BRASIL · PARAGUAY</p><h1>Estamos <em>acá.</em></h1><p className={styles.subtitle}>El mapa de nuestros proyectos en la Triple Frontera.</p></div>
      <div className={styles.edition}><span className={styles.editionDot} /> Lo que estamos construyendo<small>Actualizado el {updatedLabel}</small></div>
    </div>

    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="Explorar actividades">
        <div className={styles.filters}>
          <label htmlFor="map-city">Lugar<select id="map-city" value={cityFilter} onChange={e => changeCity(e.target.value as CityId | "all")}><option value="all">Toda la Triple Frontera</option>{cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label htmlFor="map-artist">Encontrá a tu artista<select id="map-artist" value={artistFilter} onChange={e => changeArtist(e.target.value)}><option value="all">Todos los artistas</option>{artistNames.map(name => <option key={name}>{name}</option>)}</select></label>
          <p className={styles.resultCount} role="status">{filtered.length} {filtered.length === 1 ? "actividad" : "actividades"}{artistFilter !== "all" ? ` con ${artistFilter}` : " en el mapa"}</p>
        </div>
        <div className={styles.activityList}>
          {cities.filter(c => filtered.some(a => a.city === c.id)).map(city => <div className={styles.cityGroup} key={city.id}>
            <h2><span>{city.code}</span>{city.name}</h2>
            {filtered.filter(a => a.city === city.id).map(activity => <button key={activity.id} type="button" className={`${styles.activityCard} ${selected === activity.id ? styles.selectedCard : ""}`} aria-pressed={selected === activity.id} onClick={() => selectActivity(activity)}>
              <span className={styles.cardNumber}>{activity.number}</span><span className={styles.cardBody}>
                <span className={styles.status} data-dated={Boolean(activity.date)}>{activity.dateLabel || activity.status}</span>
                <strong>{activity.title}</strong><span className={styles.venue}>{activity.venue}</span>
                <span className={styles.artistLine}>{activity.artists.length ? activity.artists.join(" · ") : activity.id === "la-cava" ? "Encuentro de la Triple Frontera" : "Plantel por definir"}</span>
                {activity.repertoires && <span className={styles.repertoireLine}>{activity.repertoires.join(" / ")}</span>}
              </span><span className={styles.cardArrow} aria-hidden="true">↗</span>
            </button>)}
          </div>)}
          {!filtered.length && <p className={styles.empty}>No hay actividades con esa combinación.</p>}
        </div>
      </aside>

      <div className={styles.mapColumn}>
        <div className={styles.mapFrame}>
          <div className={styles.mapCanvas} ref={mapNode} role="region" aria-label="Mapa interactivo de la Triple Frontera" />
          <button type="button" className={styles.reset} onClick={showRegion}>↖ Ver toda la región</button>
          {!ready && !mapError && <div className={styles.loading} role="status">Cargando el mapa…</div>}
          {mapError && <p className={styles.mapWarning} role="status">El mapa no pudo cargar por completo. Todas las actividades siguen disponibles en la lista.</p>}
          {!active && <div className={styles.mapHint}>Elegí una ciudad o una actividad para explorar.</div>}
          {active && <article className={styles.detail} aria-label="Actividad seleccionada" aria-live="polite">
            <button className={styles.closeDetail} type="button" aria-label="Cerrar detalle" onClick={() => setSelected(null)}>×</button>
            <p className={styles.detailKicker}>{active.number} / {cities.find(c => c.id === active.city)?.name}</p>
            <h2>{active.title}</h2>
            <span className={styles.detailStatus}>{active.dateLabel ? <time dateTime={active.date}>{active.dateLabel} de 2026</time> : active.status}</span>
            <p className={styles.description}>{active.description}</p>
            {active.repertoires && <div className={styles.repertoires}>{active.repertoires.map(r => <span key={r}>{r}</span>)}</div>}
            {active.artists.length > 0 && <div className={styles.people}><h3>Artistas</h3><ol>{active.artists.map(name => <li key={name}>{name}</li>)}</ol></div>}
            <p className={styles.location}>{active.location}</p>
            <div className={styles.detailLinks}>{active.link && <a href={active.link} target="_blank" rel="noreferrer">Conocer la banda ↗</a>}{!active.approximate && <a href={`https://www.openstreetmap.org/?mlat=${active.coordinates[0]}&mlon=${active.coordinates[1]}#map=18/${active.coordinates[0]}/${active.coordinates[1]}`} target="_blank" rel="noreferrer">Ver ubicación ↗</a>}</div>
          </article>}
        </div>
        <div className={styles.mapCaption}><span>4 ciudades · 3 países · 1 comunidad artística</span><span>Acercá el mapa para ver cada lugar.</span></div>
      </div>
    </div>

    <footer className={styles.footer}><span>Proyectos, fechas y equipos en construcción. Los horarios no informados están por definir.</span><Link href="/">UnderTango Club ↗</Link></footer>
  </main>;
}
