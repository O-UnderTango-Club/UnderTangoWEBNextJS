import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./shows.module.css";

function whatsappFor(subject: string) {
  const text = `Hola, vi el catálogo de Ø UnderTango y quisiera consultar disponibilidad y precio para: ${subject}.`;
  return `https://wa.me/5493757618270?text=${encodeURIComponent(text)}`;
}

const reviewMedia = [
  { id: "1vQR_yq2jDhqC5PtGYNItnHYZq7B67qCy", label: "Video 01" },
  { id: "1dsEAdFaUAGmTdeMJD3ZMhe0b6xlGVM17", label: "Video 02" },
  { id: "1z1DFJjhvR95sKvF95I6MdR7JkoOB4WLU", label: "Video 03" },
  { id: "157NYHPCWUTP9kUfw4EG1LQS8p3jst_yo", label: "Video 04" },
  { id: "15KPcYN6aY4RLmdymX5yH00_NRoovicO3", label: "Video 05" },
  { id: "1IgwR_VhWZtnmNmRpkl1lLPkFx8KxwKng", label: "Video 06" },
  { id: "1FFqYZjspGzuKDmy-fBG0BLhDki-O7SU7", label: "Video 07" },
  { id: "1vj62rxNNTtRJi0EDF-f8nWrfDwX_CFTr", label: "Video 08" },
  { id: "1wlzbwtVrmYx6kat0TTf5MnfHTpxtQp87", label: "Video 09" },
];

const artistChoices = [
  {
    title: "Tango con Eva Janberg",
    kind: "DANZA",
    description: "Show de tango adaptable a hoteles, cenas, recepciones y eventos privados.",
    availability: "No disponible del 22 al 25 de agosto.",
    warning: true,
  },
  {
    title: "Tango con Luján Rojas",
    kind: "DANZA",
    description: "Danza de tango y opción de experiencia con componente didáctico o participativo.",
    availability: "No disponible del 17 al 31 de agosto.",
    warning: true,
  },
  {
    title: "Tango con Thays Andrade",
    kind: "DANZA",
    description: "Tango escenario para formatos visuales, eventos, hoteles y producciones especiales.",
    availability: "Consultar disponibilidad para la fecha del evento.",
  },
  {
    title: "Saxofonista en vivo",
    kind: "MÚSICA",
    description: "Intervención musical elegante para recepción, cena, ambientación o integración con danza.",
    availability: "Consultar disponibilidad y repertorio.",
  },
  {
    title: "Banda Ø UnderTango",
    kind: "BANDA · 5 MÚSICOS",
    description: "La banda se presenta como una unidad artística de cinco músicos. Puede funcionar sola o integrarse con bailarines.",
    availability: "Consultar fecha, repertorio y requerimientos técnicos.",
  },
];

const products = [
  {
    slug: "dupla-tango",
    title: "Pareja de Tango",
    status: "FORMATO BASE",
    description: "Una propuesta compacta, visual y adaptable para eventos que necesitan una intervención argentina clara y elegante.",
    format: "2 bailarines",
    duration: "Adaptable al evento",
  },
  {
    slug: "tango-saxo",
    title: "Pareja de Tango + Saxo",
    status: "PRODUCTO DESTACADO",
    description: "Danza y saxofón en vivo combinados como un único producto escénico: entradas de baile, intervención musical y transiciones pensadas para sostener la atención.",
    format: "2 bailarines + saxofonista",
    duration: "Base de 2 entradas · adaptable",
    featured: true,
  },
  {
    slug: "show-banda",
    title: "Banda Ø UnderTango",
    status: "5 MÚSICOS",
    description: "Música en vivo con identidad Ø UnderTango para escenarios, hoteles, festivales, peñas y eventos especiales.",
    format: "Banda de cinco músicos",
    duration: "Escalable según producción",
  },
  {
    slug: "banda-danza",
    title: "Banda + Tango",
    status: "FORMATO AMPLIADO",
    description: "La banda de cinco músicos integrada con danza para construir un show de mayor escala y presencia escénica.",
    format: "5 músicos + bailarines",
    duration: "A medida",
  },
];

export default function ShowsPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Ø UNDERTANGO · CATÁLOGO DE SHOWS</p>
          <h1>Elegí el formato.</h1>
          <p className={styles.lead}>
            Shows y artistas de la Triple Frontera para hoteles, empresas, recepciones y eventos. Elegí una opción y consultanos por WhatsApp para confirmar fecha, formación y presupuesto.
          </p>
          <a className={styles.heroCta} href={whatsappFor("un show de Ø UnderTango")} target="_blank" rel="noopener noreferrer">
            Consultar por WhatsApp
          </a>
        </section>

        <section className={`${styles.section} ${styles.reviewSection}`} aria-label="Material audiovisual para clasificar">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>MATERIAL PARA CLASIFICAR · TEMPORAL</p>
            <h2>Decime a qué corresponde cada video</h2>
            <p>
              Los dejo numerados del 01 al 09 para que podamos asignarlos a Eva, Luján, Thaís, saxofonista, banda o al producto que corresponda. Después cada video pasa a su ficha comercial definitiva.
            </p>
          </div>

          <div className={styles.videoGrid}>
            {reviewMedia.map((item) => (
              <article key={item.id} className={styles.videoCard}>
                <div className={styles.videoFrame}>
                  <iframe
                    src={`https://drive.google.com/file/d/${item.id}/preview`}
                    title={item.label}
                    allow="autoplay"
                    loading="lazy"
                  />
                </div>
                <div className={styles.videoLabel}>{item.label}</div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-label="Artistas y formaciones">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>ARTISTAS Y FORMACIONES</p>
            <h2>¿Qué querés sumar al evento?</h2>
            <p>Podés contratar una opción individual o combinarla con otro formato del catálogo.</p>
          </div>

          <div className={styles.choiceGrid}>
            {artistChoices.map((choice) => (
              <article key={choice.title} className={styles.choiceCard}>
                <span className={styles.kind}>{choice.kind}</span>
                <h3>{choice.title}</h3>
                <p>{choice.description}</p>
                <div className={`${styles.availability} ${choice.warning ? styles.availabilityWarning : ""}`}>
                  {choice.availability}
                </div>
                <a className={styles.smallCta} href={whatsappFor(choice.title)} target="_blank" rel="noopener noreferrer">
                  Consultar esta opción
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-label="Catálogo de formatos">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>COMBOS Y PRODUCTOS</p>
            <h2>Formatos listos para vender</h2>
            <p>Partimos de estos formatos y ajustamos duración, repertorio, cantidad de artistas y puesta según el evento.</p>
          </div>

          <div className={styles.grid}>
            {products.map((product) => (
              <article key={product.slug} className={`${styles.card} ${product.featured ? styles.featured : ""}`}>
                <div className={styles.mediaPlaceholder}>
                  <span>{product.featured ? "TANGO + SAXO" : product.status}</span>
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.status}>{product.status}</span>
                  <h2>{product.title}</h2>
                  <p>{product.description}</p>
                  <dl className={styles.details}>
                    <div><dt>Formato</dt><dd>{product.format}</dd></div>
                    <div><dt>Duración</dt><dd>{product.duration}</dd></div>
                  </dl>
                  <a className={styles.cta} href={whatsappFor(product.title)} target="_blank" rel="noopener noreferrer">
                    Consultar disponibilidad
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.finalBlock}>
          <p className={styles.eyebrow}>¿NO SABÉS QUÉ ELEGIR?</p>
          <h2>Contanos fecha, lugar y tipo de evento.</h2>
          <p>Te proponemos la formación más conveniente y combinamos danza, música en vivo y banda según el espacio y el presupuesto.</p>
          <a className={styles.heroCta} href={whatsappFor("una recomendación de formato para mi evento")} target="_blank" rel="noopener noreferrer">
            Pedir recomendación
          </a>
        </section>
      </main>

      <a className={styles.mobileWhatsapp} href={whatsappFor("un show de Ø UnderTango")} target="_blank" rel="noopener noreferrer">
        Consultar por WhatsApp
      </a>

      <Footer />
    </>
  );
}
