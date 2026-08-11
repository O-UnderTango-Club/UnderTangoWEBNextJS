import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./shows.module.css";

const whatsapp = "https://wa.me/5493757618270?text=Hola%2C%20quisiera%20consultar%20por%20un%20show%20de%20UnderTango.";

const products = [
  {
    slug: "tango-saxo",
    title: "Pareja de Tango + Saxo",
    status: "ACTIVO · EN EXPANSIÓN",
    description:
      "Formato íntimo y elegante para hoteles, cenas y eventos: pareja de tango con saxofón en vivo, interludio de saxo solo y nueva entrada de baile.",
    format: "Pareja de baile + saxofonista",
    duration: "Formato adaptable · base de 2 entradas",
    featured: true,
  },
  {
    slug: "buchanan-rojas",
    title: "Buchanan Rojas",
    status: "MATERIAL EN ORGANIZACIÓN",
    description:
      "Propuesta escénica de Ø UnderTango en proceso de consolidación audiovisual para el catálogo comercial.",
    format: "Formato artístico",
    duration: "Adaptable según evento",
  },
  {
    slug: "bayon-verde",
    title: "Bayón Verde",
    status: "EN DESARROLLO ESCÉNICO",
    description:
      "Producto escénico con identidad propia, actualmente en desarrollo y documentación de su versión comercial.",
    format: "Formato artístico",
    duration: "Adaptable según evento",
  },
  {
    slug: "show-banda",
    title: "Show con Banda",
    status: "EN PREPARACIÓN",
    description:
      "Formato ampliado de música en vivo con identidad Ø UnderTango, adaptable a escenarios, hoteles, festivales y eventos especiales.",
    format: "Banda en vivo · opción con bailarines",
    duration: "Escalable según producción",
  },
];

export default function ShowsPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Ø UNDERTANGO · CATÁLOGO VIVO</p>
          <h1>Shows</h1>
          <p className={styles.lead}>
            Formatos reales que ya estamos produciendo en la Triple Frontera. El catálogo se actualiza a medida que cada producto suma repertorio, video y nuevas versiones.
          </p>
        </section>

        <section className={styles.grid} aria-label="Catálogo de shows">
          {products.map((product) => (
            <article key={product.slug} className={`${styles.card} ${product.featured ? styles.featured : ""}`}>
              <div className={styles.mediaPlaceholder}>
                <span>{product.featured ? "VIDEO EN CARGA" : "MATERIAL EN CARGA"}</span>
              </div>
              <div className={styles.cardBody}>
                <span className={styles.status}>{product.status}</span>
                <h2>{product.title}</h2>
                <p>{product.description}</p>
                <dl className={styles.details}>
                  <div><dt>Formato</dt><dd>{product.format}</dd></div>
                  <div><dt>Duración</dt><dd>{product.duration}</dd></div>
                </dl>
                <a className={styles.cta} href={whatsapp} target="_blank" rel="noopener noreferrer">
                  Consultar disponibilidad
                </a>
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
