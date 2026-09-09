import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Footer from "../components/footer";
import styles from "./la-cava.module.css";

const WHATSAPP_NUMBER = "5493757618270";

const packages = [
  {
    step: "01",
    minimum: "A partir de 10 pessoas",
    title: "Tango Essencial",
    description:
      "Uma dupla de tango conduz uma hora de descoberta, demonstração e aula participativa. Não é necessário saber dançar.",
    includes: ["2 bailarinos", "1 hora", "Aula + demonstração", "ES · PT · EN"],
    publicPrice: "R$ 100",
    underTango: "R$ 70",
    carimaMargin: "R$ 30",
    example: "10 pessoas · R$ 1.000",
  },
  {
    step: "02",
    minimum: "A partir de 15 pessoas",
    title: "Cava Tango",
    description:
      "A dupla recebe um saxofonista ao vivo. Dança, música, contexto cultural e participação se encontram em uma experiência de 1 hora e meia a 2 horas.",
    includes: ["Dupla + saxofone", "1h30–2h", "Música ao vivo", "Momento participativo"],
    publicPrice: "R$ 150",
    underTango: "R$ 100",
    carimaMargin: "R$ 50",
    example: "15 pessoas · R$ 2.250",
    featured: true,
  },
  {
    step: "03",
    minimum: "A partir de 25 pessoas · escala a validar",
    title: "Cava ao Vivo",
    description:
      "Para grupos maiores, o valor total permite ampliar a formação: músicos ao vivo, bailarinos e uma experiência mais profunda, desenhada para o perfil do grupo.",
    includes: ["Bailarinos", "Músicos ao vivo", "Interação ampliada", "Formação sob medida"],
    publicPrice: "Desde R$ 150",
    underTango: "Desde R$ 100",
    carimaMargin: "Desde R$ 50",
    example: "25 pessoas · desde R$ 3.750",
  },
] as const;

const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Olá! Vi a proposta da La Cava no Hotel Carimã e gostaria de consultar uma experiência de tango."
)}`;

export const metadata: Metadata = {
  title: "La Cava · Hotel Carimã | Experiências de tango",
  description:
    "Proposta de experiências de tango por pessoa para La Cava, no Hotel Carimã, com direção de Juan Pögler, da Not Only Wine.",
  alternates: {
    canonical: "/la-cava",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "La Cava · Tango no Hotel Carimã",
    description:
      "Experiências modulares: da dupla de tango a músicos ao vivo com bailarinos.",
    url: "https://www.undertangoclub.com/la-cava",
    siteName: "Ø UnderTango Club",
    locale: "pt_BR",
    type: "website",
  },
};

export default function LaCavaPage() {
  return (
    <>
      <nav id="navbar" aria-label="Cabeçalho da proposta" lang="pt-BR">
        <div className="logo">
          <Link href="/la-cava">
            <Image src="/assets/images/Under-logo-transparente.png" alt="Logotipo UnderTango" width={160} height={60} priority />
          </Link>
        </div>
        <span className={styles.proposalMark}>PROPOSTA PARA REVISÃO</span>
      </nav>
      <main className={styles.page} lang="pt-BR">
        <section className={styles.hero} aria-labelledby="la-cava-title">
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>HOTEL CARIMÃ · FOZ DO IGUAÇU</p>
            <h1 id="la-cava-title">La Cava</h1>
            <p className={styles.heroLine}>Tango, vinho e encontro no ritmo de cada grupo.</p>
            <p className={styles.heroIntro}>
              Experiências <strong>por pessoa</strong>. O tamanho do grupo define a formação artística: começamos com uma dupla de tango e ampliamos até músicos ao vivo, bailarinos e uma vivência integral.
            </p>

            <dl className={styles.heroFacts}>
              <div>
                <dt>Direção</dt>
                <dd>Juan Pögler · Not Only Wine</dd>
              </div>
              <div>
                <dt>Janela sugerida</dt>
                <dd>18h–22h · horário em validação</dd>
              </div>
              <div>
                <dt>Produção artística</dt>
                <dd>Ø UnderTango Club</dd>
              </div>
            </dl>
          </div>

          <figure className={styles.heroVisual}>
            <div className={styles.imageWrap}>
              <Image
                src="/assets/images/la-cava-experiencia.webp"
                alt="Registro de uma experiência grupal de tango de UnderTango"
                fill
                priority
                sizes="(max-width: 860px) 100vw, 42vw"
              />
            </div>
            <figcaption>Registro de experiência participativa · Ø UnderTango</figcaption>
          </figure>
        </section>

        <section className={styles.principle} aria-label="Como funciona a escala">
          <p className={styles.sectionLabel}>UMA REGRA SIMPLES</p>
          <div>
            <h2>Mais pessoas.<br />Mais experiência.</h2>
            <p>
              Cada formato tem um mínimo de ativação. A tarifa continua sendo individual; o total do grupo sustenta uma formação artística maior sem transformar cada consulta em um orçamento do zero.
            </p>
          </div>
        </section>

        <section className={styles.catalogue} aria-labelledby="experiencias-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionLabel}>EXPERIÊNCIA POR PESSOA</p>
              <h2 id="experiencias-title">Escolha pelo tamanho do grupo.</h2>
            </div>
            <p>
              Valores-base em reais para revisão conjunta com o Carimã. Vinhos, harmonização e gastronomia pertencem à operação do Hotel Carimã e são comercializados separadamente.
            </p>
          </div>

          <div className={styles.packageGrid}>
            {packages.map((item) => (
              <article
                key={item.title}
                className={`${styles.packageCard} ${"featured" in item && item.featured ? styles.featured : ""}`}
              >
                <div className={styles.cardTopline}>
                  <span>{item.step}</span>
                  <p>{item.minimum}</p>
                </div>
                <h3>{item.title}</h3>
                <p className={styles.cardDescription}>{item.description}</p>

                <ul className={styles.includes}>
                  {item.includes.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>

                <div className={styles.priceBlock}>
                  <p>Preço-base Carimã</p>
                  <strong>{item.publicPrice}</strong>
                  <span>por pessoa</span>
                </div>

                <dl className={styles.split}>
                  <div>
                    <dt>Neto Ø UnderTango</dt>
                    <dd>{item.underTango} / pessoa</dd>
                  </div>
                  <div>
                    <dt>Margem Carimã</dt>
                    <dd>{item.carimaMargin} / pessoa</dd>
                  </div>
                </dl>

                <p className={styles.example}>{item.example} no mínimo de ativação</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.marginSection} aria-labelledby="margens-title">
          <div className={styles.marginIntro}>
            <p className={styles.sectionLabel}>ARQUITETURA COMERCIAL</p>
            <h2 id="margens-title">Cada parte conserva seu valor.</h2>
            <p>
              O preço final pode crescer ao passar por uma agência, guia ou operador. O que não muda é a base que remunera a produção artística e o Carimã. A gestão financeira é realizada pelo Hotel Carimã, onde está localizada La Cava.
            </p>
          </div>

          <ol className={styles.marginFlow}>
            <li>
              <span>01</span>
              <div>
                <h3>Ø UnderTango</h3>
                <p>Recebe a tarifa líquida por pessoa correspondente ao formato contratado.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Hotel Carimã</h3>
                <p>Acrescenta e conserva sua margem por pessoa: R$30 ou R$50, conforme a experiência.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Agências e revendedores</h3>
                <p>Podem definir livremente sua margem ou incorporar a experiência a um pacote, preservando a base anterior.</p>
              </div>
            </li>
          </ol>

          <div className={styles.marginFormula} aria-label="Exemplo de formação do preço">
            <div>
              <span>R$ 100</span>
              <small>Ø UnderTango</small>
            </div>
            <b>+</b>
            <div>
              <span>R$ 50</span>
              <small>Carimã</small>
            </div>
            <b>+</b>
            <div className={styles.freeMargin}>
              <span>Livre</span>
              <small>Agência / operador</small>
            </div>
            <b>=</b>
            <div>
              <span>Preço final</span>
              <small>ao passageiro</small>
            </div>
          </div>
        </section>

        <section className={styles.privateLessons} aria-labelledby="particulares-title">
          <div>
            <p className={styles.sectionLabel}>TAMBÉM NA LA CAVA</p>
            <h2 id="particulares-title">Aulas particulares.</h2>
          </div>
          <div>
            <p>
              Encontros individuais, para casais ou pequenos grupos, com uma hora de duração e reserva prévia. O valor é definido por pessoa conforme a configuração da aula.
            </p>
            <p className={styles.privateNote}>Disponibilidade, valor e margem comercial desta modalidade ficam para validação específica.</p>
          </div>
        </section>

        <section className={styles.closing}>
          <div>
            <p className={styles.sectionLabel}>PRIMEIRA VERSÃO · PARA REVISÃO</p>
            <h2>Uma cava que muda de escala com cada grupo.</h2>
            <p>
              Confirmamos data, quantidade de pessoas, idioma e formato antes de reservar o elenco.
            </p>
          </div>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            Consultar uma experiência
            <span aria-hidden="true">↗</span>
          </a>
        </section>
        <section className={styles.experienceGallery} aria-labelledby="registros-title">
          <p className={styles.sectionLabel} id="registros-title">EXPERIÊNCIAS Ø UNDERTANGO</p>
          <div className={styles.galleryGrid}>
            <figure>
              <Image
                src="/assets/images/la-cava-registro-01.webp"
                alt="Abraço de tango durante uma experiência UnderTango"
                width={603}
                height={907}
                sizes="(max-width: 560px) 100vw, (max-width: 780px) 520px, (max-width: 1296px) 33vw, 400px"
              />
            </figure>
            <figure>
              <Image
                src="/assets/images/la-cava-registro-02.webp"
                alt="Casal compartilhando um momento de dança e alegria"
                width={581}
                height={863}
                sizes="(max-width: 560px) 100vw, (max-width: 780px) 520px, (max-width: 1296px) 33vw, 400px"
              />
            </figure>
            <figure>
              <Image
                src="/assets/images/la-cava-registro-03.webp"
                alt="Casal dançando tango em uma experiência UnderTango"
                width={669}
                height={890}
                sizes="(max-width: 560px) 100vw, (max-width: 780px) 520px, (max-width: 1296px) 33vw, 400px"
              />
            </figure>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
