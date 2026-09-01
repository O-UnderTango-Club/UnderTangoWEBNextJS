import Image from "next/image";
import "./elitros.css";

const canvas = [
  ["01", "Socios clave", "Artistas validados, proveedores técnicos, estudios contables y fiscales, espacios culturales y aliados territoriales."],
  ["02", "Actividades clave", "Curaduría, contratación, logística física, seguimiento del show, facturación y registro de evidencia operativa."],
  ["03", "Recursos clave", "Marca UnderTango, red artística, criterio de selección, memoria operativa y método de coordinación."],
  ["04", "Propuesta de valor", "Una operación artística resuelta de punta a punta: menos fricción, trazabilidad y un único responsable frente al cliente."],
  ["05", "Relación con clientes", "Acompañamiento consultivo, respuesta rápida, coordinación humana y seguimiento posterior para habilitar recurrencia."],
  ["06", "Canales", "Venta directa B2B, referencias, alianzas con hoteles y productoras, casos documentados y rutas de legitimación fiscal."],
  ["07", "Segmentos", "Productoras, hoteles, empresas, instituciones y coordinadores que necesitan tercerizar una operación artística confiable."],
  ["08", "Estructura de costos", "COGs objetivo de USD 150–160 por artista, coordinación variable, logística y una base tecnológica liviana."],
  ["09", "Fuentes de ingreso", "Fee transaccional o margen de facilitación por contratación, con posibilidad de sumar módulos de producción."],
] as const;

const readiness = [
  ["BRL", "Negocio", "4", "Costos, ingresos y equilibrio modelados en tres escenarios."],
  ["CRL", "Cliente", "3", "Primer feedback construido desde el coordinador y sus dolores."],
  ["TMRL", "Equipo", "4", "Champion comprometido y competencias iniciales mapeadas."],
  ["TRL", "Tecnología", "2", "Concepto formulado; falta evidencia experimental."],
  ["IPRL", "Propiedad intelectual", "2", "Activos y desafíos normativos iniciales identificados."],
  ["FRL", "Financiación", "2", "Hipótesis temprana de bajo CAPEX y bootstrap."],
] as const;

export default function ElitrosPage() {
  return (
    <main className="elitros-page bmc-page">
      <header className="bmc-topbar">
        <a className="bmc-brand" href="#inicio" aria-label="UnderTango ÉLITROS — inicio"><span>Ø</span> UNDERTANGO</a>
        <nav aria-label="Navegación principal"><a href="#canvas">Canvas</a><a href="#actores">Actores</a><a href="#madurez">Madurez</a></nav>
        <p>ÉLITROS · 2026</p>
      </header>

      <section className="bmc-hero" id="inicio">
        <div>
          <p className="bmc-eyebrow">MÓDULO 2 · MODELO VIVO · 28 AGOSTO 2026</p>
          <h1>Del parche operativo a una <em>plataforma de producción gestionada.</em></h1>
          <p className="bmc-lead">UnderTango reduce la fricción de contratar, coordinar y documentar talento artístico. El Canvas convierte esa visión en una hipótesis comercial medible.</p>
          <a className="bmc-cta" href="#canvas">Explorar el modelo <span>↓</span></a>
        </div>
        <aside className="bmc-hero-note"><span>TESIS CENTRAL</span><strong>Delegar la complejidad sin convertir la red en costo fijo.</strong><p>El cliente compra previsibilidad; el artista conserva autonomía; UnderTango captura valor por coordinar el sistema.</p></aside>
      </section>

      <section className="bmc-section" id="canvas">
        <div className="bmc-heading"><div><p className="bmc-eyebrow">BUSINESS MODEL CANVAS</p><h2>Nueve bloques, una sola lógica de valor</h2></div><p>Versión de trabajo: cada bloque expresa una hipótesis que debe ganar evidencia en operaciones reales.</p></div>
        <div className="bmc-grid">{canvas.map(([number, title, text], index) => <article key={number} className={`bmc-card bmc-card-${index + 1}`}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="bmc-actors" id="actores">
        <div className="bmc-heading bmc-inverted"><div><p className="bmc-eyebrow">UNIDAD DE TOMA DE DECISIONES</p><h2>El usuario no siempre es quien compra.</h2></div><p>La adopción depende de leer incentivos opuestos y convertir al coordinador en aliado del sistema.</p></div>
        <div className="bmc-actor-flow">
          <article><b>◎</b><span>USUARIO + POSIBLE SABOTAJE</span><h3>Coordinador operativo</h3><p>Sufre WhatsApp, Excel y la coordinación manual, pero puede temer que la solución reemplace su rol. La promesa debe aumentar su control y reconocimiento.</p></article><i>→</i>
          <article><b>$</b><span>AUTORIDAD ECONÓMICA</span><h3>Dueño de la productora</h3><p>Compra por racionalidad financiera: menor costo oculto, menos errores, trazabilidad y capacidad de repetir una operación confiable.</p></article><i>→</i>
          <article><b>↗</b><span>RUTA DE ADOPCIÓN</span><h3>Legitimación técnica y fiscal</h3><p>El canal no es sólo captación: referencias, procesos visibles y documentación convierten confianza en decisión.</p></article>
        </div>
      </section>

      <section className="bmc-economics">
        <div><p className="bmc-eyebrow">DISEÑO FINANCIERO REVERSO · DDP</p><h2>El precio posible define la arquitectura operativa.</h2><p className="bmc-copy">No se construye una plataforma costosa para luego buscar margen. Se parte del límite aceptable por show y se diseña una operación de bajo CAPEX.</p></div>
        <div className="bmc-numbers"><div><small>PARCHE ACTUAL</small><strong>US$ 110</strong><p>Costo operativo estimado por show con coordinación manual.</p></div><div><small>COGs PERMITIDOS</small><strong>US$ 150–160</strong><p>Techo objetivo por artista para preservar margen y competitividad.</p></div><div><small>INGRESO</small><strong>Fee</strong><p>Margen o comisión transaccional al concretar la contratación.</p></div></div>
      </section>

      <section className="bmc-section" id="madurez">
        <div className="bmc-heading"><div><p className="bmc-eyebrow">RADAR KTH · LÍNEA DE BASE</p><h2>Negocio y equipo avanzan. Tecnología y fondeo deben alcanzarlos.</h2></div><p>Una diferencia de más de 2–3 niveles puede inhibir el avance coordinado del proyecto.</p></div>
        <div className="bmc-radar-layout"><figure><Image src="/elitros/radar_undertango_v1.png" width={615} height={592} sizes="(max-width: 900px) 100vw, 50vw" alt="Radar KTH: BRL 4, CRL 3, TMRL 4, TRL 2, IPRL 2 y FRL 2" priority/><figcaption>Fuente: KTH Innovation Readiness Level Model Framework.</figcaption></figure><div className="bmc-readiness">{readiness.map(([code, title, value, text]) => <article key={code}><div>{value}</div><section><span>{code}</span><h3>{title}</h3><p>{text}</p></section></article>)}</div></div>
      </section>

      <section className="bmc-diagnosis">
        <div><p className="bmc-eyebrow">DIAGNÓSTICO CRÍTICO</p><h2>La próxima inversión no es software: es evidencia.</h2></div>
        <div className="bmc-diagnosis-copy"><p>La asimetría confirma una etapa inicial típica: <strong>BRL 4 y TMRL 4</strong> superan a <strong>TRL 2 y FRL 2</strong>. Avanzar directo a desarrollo técnico ampliaría la brecha y el costo fijo antes de validar el mecanismo.</p><ul><li><b>✓</b> Ejecutar contrataciones reales con operación manual.</li><li><b>✓</b> Medir tiempo ahorrado, errores, margen y repetición.</li><li><b>✓</b> Convertir esa evidencia en requisitos de producto.</li></ul></div>
        <div className="bmc-next"><span>PRÓXIMO HITO</span><strong>Diseñar y ejecutar un MVT manual de baja fidelidad con una productora real.</strong></div>
      </section>
      <footer className="bmc-footer">
        <p><span>Ø</span> UnderTango Club · ÉLITROS 2026</p>
        <a href="/elitros/Undertango_Validation_Blueprint.pdf" target="_blank" rel="noopener noreferrer">
          Descargar Validation Blueprint (PDF) ↗
        </a>
        <p>Modelo vivo — se actualiza con evidencia.</p>
      </footer>
    </main>
  );
}

