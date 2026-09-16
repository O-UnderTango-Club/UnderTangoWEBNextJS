"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Leaflet, MapInstance, MarkerInstance } from "./ProjectMap";
import { team80, type TeamMember } from "./team-data";
import styles from "./mapa.module.css";

const teamBounds = team80.map(person => person.coordinates);
const overviewOptions = { padding: [65, 80], maxZoom: 6, animate: false };

export default function TeamMap({ ready, scriptError }: { ready: boolean; scriptError: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const library = useRef<Leaflet | null>(null);
  const markers = useRef<MarkerInstance[]>([]);
  const active = team80.find(person => person.id === selected);

  const selectPerson = useCallback((person: TeamMember) => {
    setSelected(person.id);
    mapRef.current?.setView(person.coordinates, 8, { animate: false });
    if (window.matchMedia("(max-width: 760px)").matches) mapNode.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!ready || !mapNode.current) return;
    const L = (window as Window & { L?: Leaflet }).L;
    if (!L) { setMapError(true); return; }
    library.current = L;
    const map = L.map(mapNode.current, { scrollWheelZoom: false, zoomControl: true, minZoom: 4, maxZoom: 12 });
    mapRef.current = map;
    map.fitBounds(teamBounds, overviewOptions);
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    });
    tiles.addTo(map);
    tiles.on("tileerror", () => setMapError(true));
    tiles.on("load", () => setMapError(false));
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(mapNode.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; markers.current = []; };
  }, [ready]);

  useEffect(() => {
    const L = library.current; const map = mapRef.current;
    if (!L || !map || !ready) return;
    markers.current.forEach(marker => marker.remove());
    markers.current = team80.map(person => {
      const icon = L.divIcon({
        className: styles.cityMarker,
        html: `<span class="${styles.cityDot} ${styles.teamDot} ${selected === person.id ? styles.selectedTeamDot : ""}">${person.initials}</span><span class="${styles.cityLabel} ${person.city === "Posadas" ? styles.labelLeft : ""}">${person.city}<small>${person.name}</small></span>`,
        iconSize: [44, 44], iconAnchor: [22, 22],
      });
      const marker = L.marker(person.coordinates, { icon, keyboard: true, title: `${person.name} · ${person.city} · ${person.role}`, alt: person.name }).addTo(map);
      marker.on("click", () => selectPerson(person));
      return marker;
    });
  }, [ready, selected, selectPerson]);

  const showTeam = () => { setSelected(null); mapRef.current?.fitBounds(teamBounds, overviewOptions); };

  return <section id="equipo-80" className={styles.teamSection} aria-labelledby="team-map-title">
    <div className={`${styles.intro} ${styles.teamIntro}`}>
      <div><p className={styles.eyebrow}>UNDERTANGO · EQUIPO 80</p><h2 id="team-map-title">Tres ciudades.<br /><em>Un equipo.</em></h2><p className={styles.subtitle}>CABA, Córdoba y Posadas. Las personas y sus roles en UnderTango.</p></div>
      <span className={styles.teamCount}>03 personas · 03 ciudades</span>
    </div>
    <div className={styles.workspace}>
      <aside className={`${styles.sidebar} ${styles.teamSidebar}`} aria-label="Integrantes del equipo 80">
        <p className={styles.eyebrow}>PERSONAS Y ROLES</p>
        {team80.map(person => <button key={person.id} type="button" className={`${styles.activityCard} ${styles.teamCard} ${selected === person.id ? styles.selectedCard : ""}`} aria-pressed={selected === person.id} onClick={() => selectPerson(person)}>
          <span className={styles.personInitials} aria-hidden="true">{person.initials}</span>
          <span className={styles.cardBody}><span className={styles.status}>{person.city}</span><strong>{person.name}</strong><span className={styles.personRole}>{person.role}</span></span>
          <span className={styles.cardArrow} aria-hidden="true">↗</span>
        </button>)}
        <p className={styles.teamNote}>Cada punto señala la ciudad de referencia de la persona.</p>
      </aside>
      <div className={styles.mapColumn}>
        <div className={`${styles.mapFrame} ${styles.teamMapFrame}`}>
          <div className={styles.mapCanvas} ref={mapNode} role="region" aria-label="Mapa interactivo del equipo 80" />
          <button type="button" className={styles.reset} onClick={showTeam}>↖ Ver todo el equipo</button>
          {!ready && !scriptError && <div className={styles.loading} role="status">Cargando el mapa…</div>}
          {(mapError || scriptError) && <p className={styles.mapWarning} role="status">El mapa no pudo cargar por completo. Los integrantes y sus roles siguen disponibles en la lista.</p>}
          {!active && <div className={styles.mapHint}>Elegí una persona para ver su rol y su ciudad.</div>}
          {active && <article className={`${styles.detail} ${styles.teamDetail}`} aria-label="Integrante seleccionado" aria-live="polite">
            <button className={styles.closeDetail} type="button" aria-label="Cerrar detalle del integrante" onClick={() => setSelected(null)}>×</button>
            <p className={styles.detailKicker}>EQUIPO 80 / {active.city}</p>
            <h3>{active.name}</h3><p className={styles.teamDetailRole}>{active.role}</p><p className={styles.location}>{active.location}</p>
          </article>}
        </div>
        <div className={styles.mapCaption}><span>Equipo 80 · UnderTango</span><span>Ubicaciones por ciudad.</span></div>
      </div>
    </div>
  </section>;
}
