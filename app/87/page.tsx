import type { Metadata } from "next";
import "./fdg.css";

const WHATSAPP_NUMBER = "5493757618270";

function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const metadata: Metadata = {
  title: "Funcionamiento del FDG | UnderTango",
  description:
    "Participación, valor de las acciones y responsabilidad compartida en el Fondo de Gobernanza de UnderTango.",
  alternates: { canonical: "https://www.undertangoclub.com/87" },
  openGraph: {
    title: "Fondo de Gobernanza | UnderTango",
    description: "Participación, valor de las acciones y responsabilidad compartida en UnderTango.",
    url: "https://www.undertangoclub.com/87",
  },
  robots: { index: false, follow: false },
};

export default function FondoPage() {
  return (
    <main
      className="fdg-page"
      aria-label="Funcionamiento del FDG"
      style={{ minHeight: "100vh", background: "#f2efe7", color: "#222820", padding: "clamp(24px, 6vw, 80px) 20px" }}
    >
      <article style={{ maxWidth: 760, margin: "0 auto", fontFamily: "Arial, sans-serif", lineHeight: 1.75, fontSize: 18 }}>
        <header style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}>UnderTango · FDG</p>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 52px)", lineHeight: 1.12, margin: "16px 0 24px" }}>Fondo de Gobernanza</h1>
          <p>El Fondo de Gobernanza permite a sus integrantes participar en las decisiones y modificaciones del sistema de UnderTango. El peso de cada participante en las votaciones es proporcional a la cantidad de acciones del fondo que posee.</p>
        </header>

        <section aria-labelledby="respaldo" style={{ marginBottom: 36 }}>
          <h2 id="respaldo" style={{ fontSize: 25, lineHeight: 1.3 }}>Respaldo y valor de las acciones</h2>
          <p>El modelo contempla un respaldo en una cuenta bancaria, con aportes preferentemente convertidos a pesos argentinos. El valor de cada acción se calcula dividiendo el saldo que respalda al fondo por el total de acciones existentes.</p>
          <p style={{ padding: 24, border: "1px solid #87907c", borderRadius: 8, fontWeight: 700 }}>Valor por acción = saldo del fondo ÷ cantidad total de acciones</p>
          <p>Si ingresa dinero y la cantidad de acciones permanece igual, aumenta el valor de cada acción. Si también se emiten acciones, el valor depende de la relación entre el saldo del fondo y la cantidad total de acciones.</p>
        </section>

        <section aria-labelledby="decisiones" style={{ marginBottom: 36 }}>
          <h2 id="decisiones" style={{ fontSize: 25, lineHeight: 1.3 }}>Participación en las decisiones</h2>
          <p>Estas acciones otorgan poder de decisión sobre asuntos importantes de la empresa, especialmente las cuestiones financieras y los cambios en las reglas del sistema.</p>
          <p>UnderTango incentiva la participación de los integrantes de todos sus departamentos en el fondo. La intención es que la discusión sea colectiva y que la capacidad de modificar el sistema esté acompañada por la responsabilidad sobre las decisiones y sus consecuencias.</p>
        </section>

        <section aria-labelledby="formacion" style={{ marginBottom: 36 }}>
          <h2 id="formacion" style={{ fontSize: 25, lineHeight: 1.3 }}>Formación y responsabilidad compartida</h2>
          <p>Para los artistas que se incorporan, esta participación requiere aprendizaje, formación y maduración en la toma de decisiones colectivas. Integrarse implica comprender el funcionamiento del conjunto y asumir responsabilidad por él.</p>
        </section>

        <section className="fdg-participation" aria-labelledby="fondos-distintos">
          <h2 id="fondos-distintos" style={{ fontSize: 25, lineHeight: 1.3 }}>Dos fondos, decisiones diferentes</h2>
          <p>El Fondo de Inversión es distinto del Fondo de Gobernanza. El Fondo de Inversión financia los proyectos de UnderTango y toma decisiones sobre qué proyectos apoyar y cómo asignar sus recursos.</p>
          <p>El Fondo de Gobernanza toma decisiones sobre la estructura de UnderTango y sobre las leyes del código y sus protocolos. Cada fondo decide sobre asuntos diferentes y aplica criterios propios de acuerdo con su función.</p>
          <div className="fdg-actions" aria-label="Opciones para participar">
            <a
              href={whatsappUrl("Hola, quiero formar parte del Fondo de Gobernanza de UnderTango.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Quiero formar parte del Fondo de Gobernanza
            </a>
            <a
              href={whatsappUrl("Hola, quiero formar parte del Fondo de Inversión de UnderTango.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Quiero formar parte del Fondo de Inversión
            </a>
          </div>
        </section>
      </article>
    </main>
  );
}
