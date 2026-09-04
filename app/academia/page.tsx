import { academyProjects } from "./projects";
import styles from "./academia.module.css";

export default function AcademyPage() {
  return (
    <main id="contenido" className={styles.main}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>DEPARTAMENTO 83 · EDUCACIÓN</p>
          <h1>Academia<br /><em>Under Tango.</em></h1>
          <p className={styles.intro}>Aprender con la mente, el cuerpo y la práctica.</p>
          <p className={styles.heroNote}>Nuestros proyectos de formación y herramientas para acompañar tu aprendizaje.</p>
        </div>
        <div className={styles.heroNumber} aria-hidden="true">83<span>EL APRENDIZAJE<br />NOS MUEVE.</span></div>
      </div>
      <section id="proyectos" className={styles.projects} aria-labelledby="projects-title">
        <div className={styles.sectionHeading}><h2 id="projects-title">Explorá la Academia</h2><span>Tres puntos de partida</span></div>
        <div className={styles.projectGrid}>
          {academyProjects.map((project) => (
            <article key={project.id} className={`${styles.projectCard} ${styles[project.id]}`}>
              <div className={styles.cardTop}><span>{project.number} / 83</span><span>{project.id === "contador" ? "GRATIS" : "FORMACIÓN"}</span></div>
              {project.image ? (
                <div className={styles.projectImage}><img src={project.image} alt="Una pareja baila tango con un libro y un maletín" width={582} height={632} /></div>
              ) : (
                <div className={styles.projectMark} aria-hidden="true">{project.id === "aprende" ? "Aa" : "Aa → 2"}<span>{project.id === "aprende" ? "APRENDER A APRENDER" : "PALABRAS QUE CUENTAN"}</span></div>
              )}
              <div className={styles.cardContent}>
                <p className={styles.category}>{project.category}</p>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <a href={project.href} className={styles.cardLink}>{project.action}<span aria-hidden="true">↗</span></a>
              </div>
            </article>
          ))}
        </div>
        <p className={styles.growing}>La Academia sigue creciendo. Acá vas a encontrar los próximos proyectos del Departamento 83.</p>
      </section>
    </main>
  );
}
