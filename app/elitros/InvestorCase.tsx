import "./investor.css";

const revenueUnits = [
  {
    name: "Shows y experiencias",
    target: 12000,
    evidence: "Ticket, costo directo, margen y recurrencia documentados; clientes institucionales que vuelven a contratar.",
    role: "Motor de caja actual",
  },
  {
    name: "Clases y turismo",
    target: 3500,
    evidence: "Precio por persona/grupo, capacidad, canal de venta turístico y repetición medidos.",
    role: "Servicio de baja inversión",
  },
  {
    name: "Producción escénica + técnica",
    target: 2500,
    evidence: "Paquetes cotizados con proveedores tercerizados, margen conocido y al menos una venta integrada.",
    role: "Servicio modular",
  },
  {
    name: "Programación y tecnología",
    target: 2000,
    evidence: "Primer cliente externo pago y un caso documentado desde necesidad hasta entrega y resultado.",
    role: "Motor escalable en validación",
  },
  {
    name: "Marketing",
    target: 1500,
    evidence: "Servicio definido, precio verificable y casos donde pueda medirse alcance, conversión o resultado.",
    role: "Servicio modular",
  },
  {
    name: "Audiovisual",
    target: 1000,
    evidence: "Primera operación coordinada con tercero, precio final, costo y margen de facilitación registrados.",
    role: "Capacidad tercerizada",
  },
  {
    name: "Música y regalías",
    target: 1000,
    evidence: "Ingresos trazables por licencias, música original, grabaciones o regalías, separados del resto de la operación.",
    role: "Activo e IP",
  },
  {
    name: "Red UnderTango · facilitación",
    target: 750,
    evidence: "Primeras contrataciones donde UnderTango conecta cliente y artista validado y cobra una comisión o margen explícito.",
    role: "Motor escalable futuro",
  },
  {
    name: "Moda",
    target: 750,
    evidence: "Primer producto vendido con costo, precio y margen documentados.",
    role: "Producto complementario",
  },
] as const;

function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function InvestorCase() {
  const totalRevenue = revenueUnits.reduce((total, item) => total + item.target, 0);

  return (
    <section className="elitros-investor-case" aria-labelledby="investor-case-title">
      <div className="elitros-investor-heading">
        <p>Arquitectura económica · caso base 2027</p>
        <h3 id="investor-case-title">El objetivo no es que todas las unidades crezcan igual: es que juntas hagan sostenible el sistema.</h3>
        <p>
          UnderTango combina servicios que ya pueden generar caja con productos y capacidades que todavía deben probar
          su escalabilidad. La hipótesis base para 2027 es deliberadamente prudente: <strong>USD 25.000 de facturación anual</strong>,
          distribuida entre unidades con distinto grado de madurez. El número no es una promesa; es un tablero para decidir
          qué validar y qué evidencia necesitamos producir.
        </p>
      </div>

      <div className="elitros-baseline-grid">
        <article>
          <span>Evidencia histórica</span>
          <strong>2025 ya tuvo facturación real</strong>
          <p>
            La mayor parte provino de shows. El siguiente trabajo financiero es reconstruir esa facturación operación por
            operación y compararla en moneda dura, costos y margen para disponer de una línea de base consistente.
          </p>
        </article>
        <article>
          <span>Caso base 2027</span>
          <strong>{usd(totalRevenue)} anuales</strong>
          <p>
            Equivale a unos USD 2.083 mensuales promedio. Shows no necesita cargar solo con el crecimiento: las otras
            unidades empiezan a aportar ventas, margen, evidencia y aprendizaje comercial.
          </p>
        </article>
        <article>
          <span>Principio de escala</span>
          <strong>Servicios financian producto</strong>
          <p>
            Shows, clases y producción pueden sostener caja con menor inversión; tecnología, Red UnderTango, método e IP
            se desarrollan de forma gradual y sólo escalan cuando existe evidencia de uso y disposición a pagar.
          </p>
        </article>
      </div>

      <div className="elitros-revenue-block">
        <div className="elitros-investor-subheading">
          <p>Departamentos · metas y evidencia</p>
          <h4>Qué le corresponde demostrar a cada unidad</h4>
          <p>
            La meta anual sirve para ordenar magnitudes, pero el hito real es observable: una venta, una recurrencia, un
            margen conocido, un cliente externo, una comisión cobrada o un activo que efectivamente genera ingresos.
          </p>
        </div>

        <div className="elitros-revenue-grid">
          {revenueUnits.map((unit) => (
            <article key={unit.name}>
              <div>
                <strong>{unit.name}</strong>
                <span>{usd(unit.target)} / año</span>
              </div>
              <p><b>{unit.role}.</b> {unit.evidence}</p>
              <span className="elitros-evidence-tag">Hito = resultado verificable</span>
            </article>
          ))}
        </div>

        <div className="elitros-bundle-note">
          <strong>Clave comercial:</strong> las unidades pueden contratarse por separado o como sistema. Un hotel puede
          comprar show + clase + contenido; un evento puede sumar puesta, técnica y audiovisual; una empresa puede
          contratar una solución digital. UnderTango agrega valor cuando entiende el lenguaje del cliente, coordina a los
          especialistas adecuados y documenta el resultado.
        </div>
      </div>

      <div className="elitros-network-card">
        <div>
          <p>Red UnderTango · hipótesis de producto</p>
          <h4>Facilitar la relación entre cliente y artista sin convertir toda la red en costo fijo.</h4>
          <p>
            El artista define cuánto necesita cobrar. UnderTango agrega curaduría, reputación, coordinación, comunicación,
            seguimiento y una capa operativa común; cuando la contratación se concreta, puede capturar una comisión o
            margen de facilitación. La reputación y el registro histórico reducen el riesgo para ambas partes. Antes de
            escalar ciudad por ciudad, el hito es mucho más simple: demostrar las primeras operaciones reales.
          </p>
        </div>
        <div className="elitros-network-flow" aria-label="Flujo de la Red UnderTango">
          <span>Cliente</span><b>→</b><span>UnderTango facilita</span><b>→</b><span>Artista validado</span>
        </div>
      </div>

      <div className="elitros-live-system">
        <h3>La siguiente capa es que cada departamento tenga una página viva.</h3>
        <p>
          El plan no debería quedar congelado en una presentación. La arquitectura buscada es que cada unidad permita ver
          qué se hizo, para quién, cuándo, cuánto se cobró cuando corresponda, qué costo tuvo, cuál fue el resultado y qué
          evidencia quedó. Lo antiguo puede archivarse; lo útil permanece como memoria operativa y prueba de ejecución.
        </p>
        <div className="elitros-live-flow" aria-label="Ciclo de documentación viva">
          <div><b>01</b><span>Plan / hito</span></div>
          <div><b>02</b><span>Cliente</span></div>
          <div><b>03</b><span>Operación</span></div>
          <div><b>04</b><span>Cobro / costo</span></div>
          <div><b>05</b><span>Evidencia</span></div>
          <div><b>06</b><span>Resultado</span></div>
        </div>
      </div>

      <div className="elitros-capital-study">
        <span>Arquitectura de capital · en estudio</span>
        <h3>El antiguo FDI queda como antecedente experimental, no como unidad de facturación ni como oferta actual.</h3>
        <p>
          UnderTango ya probó de manera casera una lógica de participación, registro y transparencia con un grupo reducido
          de personas de confianza. Esa experiencia sirve como evidencia de interés y como material de diseño, pero la
          estructura futura todavía debe definirse con asesoramiento jurídico y contable antes de recibir capital bajo un
          mecanismo formal.
        </p>
        <p>
          El objetivo de noviembre no es prometer una rentabilidad ni fijar una suma a levantar. Es llegar con una empresa
          mejor documentada, una arquitectura de capital comprensible y criterios para reconocer capital inteligente y
          paciente: personas que, además de dinero, puedan aportar mercado, vínculos, conocimiento o capacidad de escala.
        </p>
      </div>

      <div className="elitros-investor-takeaway">
        <strong>Lectura para un potencial inversor:</strong> UnderTango no pide creer en una proyección abstracta. Muestra
        una operación existente, divide el crecimiento en unidades observables y propone que cada avance quede respaldado
        por clientes, movimientos, números, documentación y resultados verificables.
      </div>
    </section>
  );
}
