import type { Metadata } from "next";
import Link from "next/link";
import styles from "./web847.module.css";

export const metadata: Metadata = {
  title: "847 · Web UnderTango",
  description: "Marketing (84): estrategia web, recorrido de Shows y protocolo editorial.",
  alternates: { canonical: "/847" },
  robots: { index: false, follow: false },
};
const priorities = [
  ["Ahora", "Primera voluntad: una invitación que se entienda al instante", "Poner primero qué va a vivir el público, cuándo y dónde. Usar el flyer elegido para Iguazú y dirigir toda la difusión a la ficha de la función."],
  ["Por confirmar", "Hora, ingreso y punto de llegada", "Verificar los datos con producción antes de agregarlos a la ficha o cambiar el llamado a la acción. Hasta entonces, ofrecer el enlace del festival para consultar novedades."],
  ["Próximo", "Probar el recorrido comercial en un teléfono", "Desde Shows, reproducir un video y llegar a la consulta sin enviar nada. Comparar el camino directo a WhatsApp con Reservas. Registrar el primer punto de fricción antes de modificar el sitio."],
  ["Después del 2/12", "Archivar la primera fecha y documentar qué funcionó", "Separar el registro de Iguazú de cualquier pieza posterior. Anotar el canal, enlace, fecha y aprendizajes para la próxima campaña."],
] as const;
export default function WebUndertango() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav aria-label="Ubicación" className={styles.nav}><Link href="/84">84 · Marketing, Comunicación y Audiovisuales</Link><span aria-hidden="true">/</span><span aria-current="page">847</span></nav>
        <header className={styles.hero}>
          <p className={styles.kicker}>84 / 847 · Mesa de trabajo</p>
          <h1>847 · Web UnderTango</h1>
          <p>Decidir qué queremos que le llegue a la gente y comprobar que la web lo transmita. De cada página tiene que quedar claro qué ofrece, para quién es y qué puede hacer después quien la visita.</p>
          <Link className={styles.button} href="/847/primera-voluntad">Abrir la ficha pública de Primera voluntad →</Link>
        </header>
        <section aria-labelledby="campana">
          <p className={styles.kicker}>Campaña prioritaria</p><h2 id="campana">Ø Primera voluntad</h2>
          <p>Miércoles 2 de diciembre de 2026 · La Cabaña de los Muñecos · Puerto Iguazú.</p>
          <p><strong>Mensaje:</strong> Una performance donde la música y la imagen se transforman en vivo. Cada cambio en el sonido puede cambiar también lo que ves.</p>
        </section>
        <section aria-labelledby="pulso">
          <p className={styles.kicker}>84 / 847 · Un gesto creativo por día</p><h2 id="pulso">Dejá que la obra se presente sola</h2>
          <p>Para el 2/12, buscá a quienes disfrutan descubrir música electrónica en vivo, arte audiovisual y experimentación en Iguazú y Foz. Hacé que primero sientan algo de la obra. El título, la fecha, la Cabaña y el enlace aparecen al final o en el pie, siempre legibles.</p>
          <div className={styles.grid}>
            <article><h3>01 · Del ruido a la nota</h3><p>Microclip real del 860: oscuro, textura, una nota. Texto de trabajo: «Primero fue ruido. Después, algo quiso sonar».</p></article>
            <article><h3>02 · Una nota mueve una imagen</h3><p>Mostrá la mano y la proyección en la misma toma: una variación audible, un cambio visible. Que el video sea la explicación.</p></article>
            <article><h3>03 · El momento en que aparece el pulso</h3><p>Compartí el instante de transición y cortá antes de mostrar el desarrollo. Reservá la invitación concreta para el final.</p></article>
            <article><h3>04 · Después del registro de Posadas</h3><p>Armá un minuto con el intérprete y la imagen en el mismo plano. Para programadores importa entender qué pasa en escena y qué necesita la sala, no repetir la invitación del 2/12.</p></article>
          </div>
          <p><strong>Regla de preparación:</strong> una pieza por día puede ser un recorte, una frase o un ensayo. Usá material real, revisá que se entienda aun sin sonido y guardá los borradores hasta que toque publicar.</p>
        </section>
        <section aria-labelledby="recorrido">
          <p className={styles.kicker}>Auditoría inicial · 24/11/2026</p><h2 id="recorrido">De ver un show a pedir presupuesto</h2>
          <p>En producción, <Link href="/produccion-artistica">Producción artística</Link> redirige a <Link href="/shows">Shows</Link>. Ahí conviven un video principal, un catálogo y dos accesos a WhatsApp: «Diseñar mi espectáculo» arriba y «Conversemos sobre tu idea» en producción a medida. Los dos abren el mismo mensaje inicial. También hay un camino por <Link href="/reservas">Reservas</Link> desde el menú.</p>
          <p><strong>Qué mejorar:</strong> dar una salida clara después del catálogo y distinguir «quiero un formato» de «quiero un show a medida» en el texto de consulta. Primero medí el recorrido real en celular, incluidos el regreso desde el video y la claridad del contacto.</p>
        </section>
        <section aria-labelledby="protocolo">
          <p className={styles.kicker}>Cómo trabajamos</p><h2 id="protocolo">Protocolo editorial y de verificación</h2>
          <ol className={styles.steps}>
            <li><strong>Una intención por página.</strong> Definí público, mensaje principal, una imagen o video y un próximo paso. Separá difusión de eventos de consultas comerciales.</li>
            <li><strong>Una ficha que se pueda compartir.</strong> Corroborá título, fecha, lugar y material aprobado. Solo agregá horario, entrada o reservas cuando estén confirmados.</li>
            <li><strong>Probá de punta a punta.</strong> En escritorio y celular: sin desbordes, fecha y lugar legibles, video que cargue, enlace que abra el destino esperado y tarjeta legible al pegar el enlace. No envíes consultas de prueba a terceros.</li>
            <li><strong>Dejá evidencia.</strong> Guardá fecha, URL, dispositivo, problema observado, mejora y cómo se verificó. Dejá conversaciones, precios internos y datos privados fuera de la web.</li>
          </ol>
          <Link className={styles.textLink} href="/84">Volver al panel de publicaciones del 84 →</Link>
        </section>
        <section aria-labelledby="tareas">
          <p className={styles.kicker}>Desde acá seguimos</p><h2 id="tareas">Próximas acciones</h2>
          <div className={styles.grid}>{priorities.map(([status,title,body])=><article key={title}><p className={styles.kicker}>{status}</p><h3>{title}</h3><p>{body}</p></article>)}</div>
        </section>
      </div>
    </main>
  );
}