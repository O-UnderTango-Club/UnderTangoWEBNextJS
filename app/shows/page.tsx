import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./shows.module.css";

const whatsapp = "https://wa.me/5493757618270?text=Hola%2C%20quisiera%20consultar%20por%20un%20show%20de%20UnderTango.";

const reviewMedia = [
  { id: "1vQR_yq2jDhqC5PtGYNItnHYZq7B67qCy", label: "Material 01 · pareja de tango" },
  { id: "1dsEAdFaUAGmTdeMJD3ZMhe0b6xlGVM17", label: "Material 02 · pareja de tango" },
  { id: "1z1DFJjhvR95sKvF95I6MdR7JkoOB4WLU", label: "Material 03 · escena / baile" },
  { id: "157NYHPCWUTP9kUfw4EG1LQS8p3jst_yo", label: "Material 04 · producción" },
  { id: "15KPcYN6aY4RLmdymX5yH00_NRoovicO3", label: "Material 05 · ensayo / baile" },
  { id: "1IgwR_VhWZtnmNmRpkl1lLPkFx8KxwKng", label: "Material 06 · banda" },
  { id: "1FFqYZjspGzuKDmy-fBG0BLhDki-O7SU7", label: "Material 07 · escena / baile" },
  { id: "1vj62rxNNTtRJi0EDF-f8nWrfDwX_CFTr", label: "Material 08 · pareja de tango" },
  { id: "1wlzbwtVrmYx6kat0TTf5MnfHTpxtQp87", label: "Material 09 · banda / música en vivo" },
];

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

        <section style={{ maxWidth: 1180, margin: "0 auto 48px", padding: "0 20px" }} aria-label="Material audiovisual recibido">
          <div style={{ marginBottom: 18 }}>
            <p className={styles.eyebrow}>MATERIAL AUDIOVISUAL · VERSIÓN DE TRABAJO</p>
            <h2 style={{ margin: "6px 0 8px" }}>Videos recibidos para revisar</h2>
            <p style={{ margin: 0, opacity: 0.75 }}>
              Carga inicial para ordenar el catálogo. Hoy revisamos cuáles quedan como material definitivo de cada producto.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {reviewMedia.map((item) => (
              <article key={item.id} style={{ borderRadius: 14, overflow: "hidden", background: "#111", border: "1px solid rgba(255,255,255,.12)" }}>
                <div style={{ aspectRatio: "9 / 16", background: "#000" }}>
                  <iframe
                    src={`https://drive.google.com/file/d/${item.id}/preview`}
                    title={item.label}
                    allow="autoplay"
                    style={{ width: "100%", height: "100%", border: 0 }}
                  />
                </div>
                <div style={{ padding: 12, fontSize: 13, opacity: 0.78 }}>{item.label}</div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.grid} aria-label="Catálogo de shows">
          {products.map((product) => (
            <article key={product.slug} className={`${styles.card} ${product.featured ? styles.featured : ""}`}>
              <div className={styles.mediaPlaceholder}>
                <span>{product.featured ? "MATERIAL EN REVISIÓN" : "MATERIAL EN CARGA"}</span>
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
