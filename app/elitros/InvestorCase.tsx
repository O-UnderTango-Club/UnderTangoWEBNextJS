import "./investor.css";

const revenueEngines = [
  {
    name: "Shows y experiencias en vivo",
    target: 38000,
    note: "Hoteles, eventos, restaurantes, turismo y formatos propios. Sigue siendo el motor comercial principal.",
  },
  {
    name: "Clases y turismo",
    target: 14000,
    note: "Clases privadas, grupales y experiencias para visitantes, agencias y hoteles.",
  },
  {
    name: "Producción escénica, técnica y audiovisual",
    target: 14000,
    note: "Escenografía, puesta en escena, técnica y audiovisual coordinados por UnderTango con especialistas tercerizados cuando corresponda.",
  },
  {
    name: "Programación y soluciones digitales",
    target: 10000,
    note: "Desarrollo web/mobile, automatizaciones y herramientas surgidas del propio sistema operativo de UnderTango.",
  },
  {
    name: "Marketing y contenidos",
    target: 8000,
    note: "Producción de campañas, piezas, estrategia de comunicación y servicios combinables con otras unidades.",
  },
  {
    name: "Música y regalías",
    target: 5000,
    note: "Música original, licencias, repertorio, grabaciones y explotación gradual de activos musicales.",
  },
  {
    name: "Moda y productos",
    target: 4000,
    note: "Vestuario, diseño, productos y extensiones físicas de la marca, sin exigir que sean el motor central de 2027.",
  },
  {
    name: "Red UnderTango · facilitación",
    target: 7000,
    note: "Comisión por conectar clientes y artistas, curar la oferta, coordinar expectativas y reducir riesgo operativo para ambas partes.",
  },
] as const;

const fundingUses = [
  { label: "Capital de trabajo", amount: 7000, note: "Anticipos a artistas/proveedores, desfases de cobro y continuidad operativa." },
  { label: "Expansión comercial regional", amount: 6000, note: "Viajes, alianzas con hoteles, ventas B2B y desarrollo de nuevos mercados." },
  { label: "Producto y Red UnderTango", amount: 5000, note: "V1 web/mobile, registro, reputación, matching y operación medible." },
  { label: "Marketing y activos de venta", amount: 3000, note: "Audiovisual, dossiers, campañas, contenidos y materiales comerciales." },
  { label: "Legal, contable e IP", amount: 2000, note: "Contratos, estructura societaria/contable y estrategia de propiedad intelectual." },
  { label: "Reserva de contingencia", amount: 2000, note: "Margen para absorber variaciones sin volver a deuda de emergencia." },
] as const;

function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function InvestorCase() {
  const totalRevenue = revenueEngines.reduce((total, item) => total + item.target, 0);
  const totalFunding = fundingUses.reduce((total, item) => total + item.amount, 0);

  return (
    <section className="elitros-investor-case" aria-labelledby="investor-case-title">
      <div className="elitros-investor-heading">
        <p>Cómo se transforma la meta en un negocio invertible</p>
        <h3 id="investor-case-title">USD 100.000 no dependen de un solo show: dependen de una cartera modular de servicios.</h3>
        <p>
          UnderTango ya funciona como una productora que puede vender capacidades por separado o integrarlas en una
          propuesta completa. Un cliente puede contratar solamente un show, una clase, contenido, técnica, puesta en
          escena o programación; también puede contratar varias capas juntas. Esa modularidad es la base del crecimiento.
        </p>
      </div>

      <div className="elitros-baseline-grid">
        <article>
          <span>Punto de partida</span>
          <strong>ARS 20 millones facturados en 2025</strong>
          <p>
            Para presentar este antecedente a inversores, el próximo paso es reconstruir esa facturación en USD usando el
            tipo de cambio correspondiente a cada fecha de cobro/factura. En Argentina, comparar pesos nominales entre años
            no alcanza para medir crecimiento real.
          </p>
        </article>
        <article>
          <span>Meta 2027</span>
          <strong>{usd(totalRevenue)} anuales</strong>
          <p>
            Equivale a un promedio de aproximadamente USD 8.333 mensuales. La lógica no exige que todas las unidades rindan
            igual: shows y experiencias sostienen el núcleo y las otras unidades aumentan ticket, recurrencia y margen.
          </p>
        </article>
        <article>
          <span>2028</span>
          <strong>Piso: sostener USD 100.000</strong>
          <p>
            Para una tesis de crecimiento, el escenario a validar debería ser superior: aproximadamente USD 150.000 si la
            recurrencia y la Red UnderTango demuestran tracción. La red se trata como upside y no como una promesa necesaria
            para cumplir la meta base de 2027.
          </p>
        </article>
      </div>

      <div className="elitros-revenue-block">
        <div className="elitros-investor-subheading">
          <p>Arquitectura de ingresos 2027 · hipótesis de trabajo</p>
          <h4>Ocho motores que suman USD 100.000</h4>
        </div>
        <div className="elitros-revenue-grid">
          {revenueEngines.map((engine) => (
            <article key={engine.name}>
              <div>
                <strong>{engine.name}</strong>
                <span>{usd(engine.target)} / año</span>
              </div>
              <p>{engine.note}</p>
            </article>
          ))}
        </div>
        <div className="elitros-bundle-note">
          <strong>Clave comercial:</strong> los motores son modulares, pero el mayor valor aparece cuando se combinan. Un
          hotel puede contratar show + clase + contenido + puesta en escena; un evento puede sumar música, técnica y
          audiovisual; una organización puede contratar sólo una solución digital. UnderTango captura valor coordinando
          el sistema completo sin tener que internalizar todos los costos fijos.
        </div>
      </div>

      <div className="elitros-network-card">
        <div>
          <p>Red UnderTango · línea de crecimiento</p>
          <h4>Facilitadores entre quien necesita un artista y quien necesita trabajo.</h4>
          <p>
            El artista define cuánto necesita cobrar. UnderTango agrega curaduría, reputación, coordinación, contrato,
            comunicación con el cliente y seguimiento operativo, y cobra una comisión o margen por esa facilitación. El
            sistema de reputación reduce el riesgo de ofrecer un producto que no esté a la altura. La red puede desplegarse
            ciudad por ciudad sin que UnderTango tenga que emplear a todos los artistas.
          </p>
        </div>
        <div className="elitros-network-flow" aria-label="Flujo de la Red UnderTango">
          <span>Cliente</span><b>→</b><span>UnderTango facilita</span><b>→</b><span>Artista validado</span>
        </div>
      </div>

      <div className="elitros-fdi-note">
        <strong>FDI / UnderTango Coin:</strong> existe como línea estratégica, pero no se incluye dentro de los USD 100.000
        de facturación base. Antes necesita un modelo económico y legal claro. Para un inversor es más creíble mostrarlo
        como opcionalidad futura que inflar la proyección con un ingreso todavía no validado.
      </div>

      <div className="elitros-funding-section" aria-labelledby="funding-title">
        <div className="elitros-investor-subheading">
          <p>Financiación · hipótesis preliminar para enero de 2027</p>
          <h4 id="funding-title">Necesidad inicial estimada: {usd(totalFunding)}</h4>
          <p>
            No es todavía una ronda cerrada: es una primera estimación de capital para que la brecha financiera no frene
            ventas, equipo y producto. Debe recalcularse con costos reales, márgenes por unidad y contratos ya asegurados al
            cierre de 2026.
          </p>
        </div>

        <div className="elitros-funding-grid">
          {fundingUses.map((use) => (
            <article key={use.label}>
              <span>{usd(use.amount)}</span>
              <strong>{use.label}</strong>
              <p>{use.note}</p>
            </article>
          ))}
        </div>

        <div className="elitros-return-box">
          <h4>Qué ofrecer a un inversor</h4>
          <p>
            Prometer hoy “devolver 2x en dos años” sería prematuro. Sobre una inversión de USD 25.000, devolver USD 50.000
            consumiría el 25% de dos años con USD 100.000 de facturación anual, antes de pagar artistas, proveedores,
            impuestos y estructura. Además, recibir 2x el capital equivale a una ganancia del 100% sobre el principal; no a
            una ganancia del 200%.
          </p>
          <p>
            Una estructura más defendible para estudiar es <strong>revenue share</strong> o instrumento convertible: por
            ejemplo, participación limitada sobre ingresos hasta un múltiplo pactado, en vez de una deuda rígida que pueda
            ahogar la caja. El retorno definitivo debe modelarse recién cuando tengamos margen bruto, flujo de caja y
            escenario 2028 validados.
          </p>
        </div>
      </div>

      <div className="elitros-investor-takeaway">
        <strong>Lectura para un inversor:</strong> la tesis no es “apostar a una compañía de tango”. Es financiar una
        productora modular con demanda ya validada, capacidad de empaquetar múltiples servicios, una red regional de
        talento y una capa tecnológica destinada a convertir coordinación artesanal en una operación replicable.
      </div>
    </section>
  );
}
