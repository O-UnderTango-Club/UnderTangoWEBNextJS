import Header from "../components/header";
import styles from "./central.module.css";

type Area = {
  number: string;
  name: string;
  function: string;
  lead: string;
  status: string;
  projects: string[];
  emphasis?: "digital" | "human";
};

const areas: Area[] = [
  { number: "82", name: "Moda", function: "Diseña identidad, vestuario y objetos que llevan el universo UnderTango al cuerpo y a la escena.", lead: "Responsable a definir", status: "En desarrollo", projects: ["Línea de indumentaria UnderTango", "Vestuario escénico"] },
  { number: "83", name: "Academia", function: "Convierte conocimiento y práctica en experiencias de formación presenciales y digitales.", lead: "Responsable a definir", status: "Activo", projects: ["Clases privadas", "Clases grupales", "Ø Aprende"] },
  { number: "84", name: "Marketing, audiovisual y medios", function: "Construye relato, audiencia y memoria visual para cada proyecto del sistema.", lead: "Responsable a definir", status: "Activo", projects: ["Comunicación UnderTango", "Producción audiovisual", "Canales y contenidos"] },
  { number: "88", name: "Equipo central", function: "Núcleo humano de dirección, gobernanza y coordinación. Define prioridades y arma los equipos para ejecutarlas.", lead: "Conducción central", status: "Operativo", projects: ["Gobernanza del sistema", "Coordinación interdepartamental", "Asignación de capacidades"], emphasis: "human" },
  { number: "80", name: "Tecnología y programación", function: "Sistema nervioso digital de UnderTango. Diseña productos, conecta información y transforma procesos en herramientas.", lead: "Pablo Cieslik · dirección tecnológica", status: "Activo · prioritario", projects: ["KinesioLabs", "ÉLITROS", "Infraestructura digital UnderTango"], emphasis: "digital" },
  { number: "81", name: "Shows", function: "Produce y opera propuestas escénicas de tango para espacios, marcas, eventos y audiencias.", lead: "Responsable a definir", status: "Activo", projects: ["Shows para hotelería", "Tango Rave", "Producciones a medida"] },
  { number: "85", name: "Taller y fábrica", function: "Materializa ideas en escenografía, objetos, dispositivos y soluciones de fabricación.", lead: "Responsable a definir", status: "En estructuración", projects: ["Prototipos y dispositivos", "Soporte de producción"] },
  { number: "86", name: "Música", function: "Desarrolla el repertorio, la interpretación y la identidad sonora que atraviesan los proyectos.", lead: "Responsable a definir", status: "Activo", projects: ["Repertorio UnderTango", "Producción musical", "Música para shows"] },
  { number: "87", name: "Finanzas", function: "Ordena recursos, obligaciones y decisiones económicas para sostener el crecimiento del sistema.", lead: "Responsable a definir", status: "Operativo", projects: ["Obligaciones y movimientos", "Presupuestos", "Control económico"] },
];

export default function CentralPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>UnderTango · sistema de capacidades</p>
          <h1><span>Ø</span> Central</h1>
          <p className={styles.subtitle}>La central de operaciones de UnderTango</p>
          <p className={styles.definition}>Gerencia integral de proyectos, equipos y capacidades.</p>
          <div className={styles.heroRule} aria-hidden="true"><span>80–89</span></div>
          <p className={styles.intro}>Convertimos necesidades en proyectos y proyectos en equipos capaces de resolverlos. Arte, tecnología, producción, comunicación, finanzas y gestión trabajando como un solo sistema.</p>
        </section>

        <section className={styles.map} aria-labelledby="map-title">
          <div className={styles.sectionHeading}>
            <p>Mapa operativo</p>
            <h2 id="map-title">Nueve capacidades. Una sola estructura.</h2>
          </div>
          <div className={styles.grid}>
            {areas.map((area) => (
              <article key={area.number} className={`${styles.card} ${area.emphasis ? styles[area.emphasis] : ""}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.number}>{area.number}</span>
                  <span className={styles.status}>{area.status}</span>
                </div>
                <h3>{area.name}</h3>
                {area.emphasis && <p className={styles.role}>{area.emphasis === "digital" ? "Sistema nervioso digital" : "Núcleo humano y gobernanza"}</p>}
                <p className={styles.function}>{area.function}</p>
                <div className={styles.owner}><span>Responsable</span><strong>{area.lead}</strong></div>
                <div className={styles.projects}>
                  <span>Proyectos actuales</span>
                  <ul>{area.projects.map((project) => <li key={project}>{project}</li>)}</ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.cases} aria-labelledby="cases-title">
          <div className={styles.sectionHeading}>
            <p>Casos Ø80</p>
            <h2 id="cases-title">Tecnología puesta a prueba en proyectos reales.</h2>
          </div>
          <div className={styles.caseGrid}>
            <article><span>Producto y salud</span><h3>KinesioLabs</h3><p><strong>Pablo Cieslik · CTO.</strong> Dirección tecnológica, producto, arquitectura, prototipado y validación.</p></article>
            <article><span>Conexiones del ecosistema</span><h3>ÉLITROS</h3><p>MVP de conexiones con bases compartidas para web y mobile. Diseño, construcción y validación de la infraestructura.</p></article>
          </div>
        </section>

        <section className={styles.extension} aria-labelledby="extension-title">
          <div className={styles.extensionNumber}>89</div>
          <div>
            <p className={styles.extensionLabel}>Capa transversal · proyectos externos</p>
            <h2 id="extension-title">Extensión, auditoría y acompañamiento de proyectos</h2>
            <p>La puerta de salida del sistema: activa las capacidades 80–88 para diagnosticar, diseñar, fortalecer y acompañar proyectos de otras organizaciones.</p>
          </div>
          <span className={styles.extensionStatus}>En desarrollo</span>
        </section>
      </main>
    </div>
  );
}
