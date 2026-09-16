import type { Metadata } from "next";
import BudgetCalculator from "./BudgetCalculator";
import { artistFee, brl, calculateScenario, commissionRate, formats } from "./finance";
import styles from "./tropcalia.module.css";

const title = "Raízes da Tríplice Fronteira | UnderTango × TropCalia";
const description = "Proposta artística para a TropCalia: Paraguai, Argentina e Brasil em um espetáculo que termina com o público na dança. Elenco, roteiro e viabilidade para outubro e novembro de 2026.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: "/tropcalia" },
  openGraph: { title, description, url: "https://www.undertangoclub.com/tropcalia", locale: "pt_BR", type: "website",
    images: [{ url: "https://www.undertangoclub.com/tropcalia-raizes-social-v3.jpg", width: 1734, height: 907, type: "image/jpeg", alt: "Raízes da Tríplice Fronteira · Ilustração de tango, dança paraguaia e samba · UnderTango × TropCalia" }] },
  twitter: { card: "summary_large_image", title, description, images: ["https://www.undertangoclub.com/tropcalia-raizes-social-v3.jpg"] },
  robots: { index: false, follow: false },
};
const productionItems = [
  ["Figurino: conservação e renovação", 220, 250],
  ["Combustível, transporte e logística", 230, 500],
  ["Manutenção e operação técnica", 100, 300],
  ["Imprevistos de produção", 50, 150],
] as const;

export default function TropCaliaPage() {
  return <main className={styles.page} lang="pt-BR">
    <nav className={styles.nav} aria-label="Navegação da proposta">
      <a className={styles.brand} href="/">Ø UNDERTANGO</a>
      <div><a href="#roteiro">O show</a><a href="#elenco">Elenco</a><a href="#contas">As contas</a></div>
      <span>PROPOSTA · 16 SET 2026</span>
    </nav>

    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>UNDERTANGO × TROPCALIA · FOZ DO IGUAÇU</p>
        <h1>Raízes da<br/><em>Tríplice<br/>Fronteira.</em></h1>
        <p className={styles.lead}>Três culturas em cena.<br/>Uma noite que termina com todo mundo na dança.</p>
        <p className={styles.heroIntro}>Uma proposta para Carlos, a TropCalia e os artistas convidados. Um espetáculo para construir juntos, com espaço para cada talento e contas claras para todos.</p>
        <a className={`${styles.button} ${styles.nextDesktop}`} href="#visao-geral">Conheça a proposta <span aria-hidden="true">↓</span></a>
        <a className={`${styles.button} ${styles.nextMobile}`} href="#calendario-proposto">Conheça a proposta <span aria-hidden="true">↓</span></a>
      </div>
      <aside id="calendario-proposto" className={styles.seasonCard} aria-label="Calendário proposto">
        <span className={styles.seasonNumber} aria-hidden="true">03</span>
        <p className={styles.seasonCountries}>PARAGUAI<br/>ARGENTINA<br/>BRASIL</p>
        <div className={styles.seasonDates}>
          <p><span>AVANT-PREMIÈRE</span><strong>Última semana<br/>de outubro</strong><small>2026 · dia e horário a definir</small></p>
          <p><span>INÍCIO DA TEMPORADA</span><strong>Novembro de 2026</strong><small>Uma apresentação por semana, no mínimo.<br/>Outras sessões poderão ser ativadas.</small></p>
        </div>
        <p className={styles.seasonNote}>Calendário proposto, sujeito ao alinhamento com o espaço e o elenco.</p>
      </aside>
    </header>

    <div id="visao-geral" className={styles.facts}>
      <p><strong>50 / 150</strong><span>público esperado / capacidade máxima</span></p>
      <p><strong>R$50</strong><span>preço médio de ingresso nesta proposta</span></p>
      <p><strong>≈ 1 hora</strong><span>com interação e encerramento flexíveis</span></p>
    </div>

    <section className={styles.section} aria-labelledby="experience-title">
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>A EXPERIÊNCIA NA TROPCALIA</p><h2 id="experience-title">Do jantar<br/><em>ao encontro.</em></h2><p>O espetáculo começa depois da refeição. A transição entre os ambientes faz parte da noite e também permite receber quem vier apenas para o show.</p></div>
      <div className={styles.experienceGrid}>
        <article><span>01 / RECEBER</span><h3>Jantar na frente</h3><p>A proposta é servir a refeição nos setores da frente do local, antes da apresentação.</p></article>
        <article><span>02 / CONVIDAR</span><h3>A sobremesa abre a cena</h3><p>No momento da sobremesa, os clientes são convidados a entrar no espaço do espetáculo. O serviço e o fluxo serão combinados com a TropCalia.</p></article>
        <article><span>03 / COMPARTILHAR</span><h3>Show também sem jantar</h3><p>Quem não consumir a refeição poderá comprar o ingresso e vir diretamente ao show. Alimentação e bebidas não entram nas contas de bilheteria desta proposta.</p></article>
      </div>
      <p className={styles.note}>50 pessoas é uma expectativa habitual de público, não uma garantia de venda nem um mínimo financeiro já suficiente. A capacidade informada é de até 150 pessoas; a disposição final deve preservar palco, circulação e área de dança.</p>
    </section>

    <section id="roteiro" className={styles.section} aria-labelledby="show-title">
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>PARTITURA DA NOITE</p><h2 id="show-title">Primeiro, assistir.<br/><em>Depois, fazer parte.</em></h2></div>
      <div className={styles.act}>
        <div className={styles.actCountry}><span>ATO I</span><h3>Paraguai</h3><p>Harpa, equilíbrio<br/>e tradição.</p></div>
        <ol className={styles.score} start={1}>
          <li><h4>Harpa instrumental solo</h4><p>A harpa abre o espetáculo e prepara a entrada das bailarinas.</p></li>
          <li><h4>Dança dos cântaros</h4><p>Aracely Maizares e Camila Bazán, com acompanhamento de harpa ao vivo.</p></li>
          <li><h4>Dança das garrafas</h4><p>O equilíbrio das bailarinas conduz o terceiro número do quadro paraguaio.</p></li>
          <li><h4>Pájaro campana</h4><p>Pelo menos dois bailarinos homens entram em cena para este número, que encerra o quadro paraguaio.</p></li>
        </ol>
      </div>
      <div className={styles.act}>
        <div className={styles.actCountry}><span>ATO II</span><h3>Argentina</h3><p>O abraço encontra<br/>a plateia.</p></div>
        <ol className={styles.score} start={5}>
          <li><h4>Tango-cenário</h4><p>A dupla argentina abre a sequência com tango-cenário.</p></li>
          <li><h4>Milonga</h4><p>O casal apresenta a alegria dentro do tango.</p></li>
          <li><h4>Tango de salão</h4><p>O abraço e a conexão ganham o centro da cena.</p></li>
          <li><h4>Tango a quatro</h4><p>O casal brasileiro se junta ao casal argentino em um número com quatro bailarinos.</p></li>
          <li><h4>O primeiro convite ao público</h4><p>Tempo para interagir e dançar com quem desejar participar, sem pressa e sem obrigação.</p></li>
        </ol>
      </div>
      <div className={styles.act}>
        <div className={styles.actCountry}><span>ATO III</span><h3>Brasil</h3><p>A energia cresce.<br/>A pista é de todos.</p></div>
        <ol className={styles.score} start={10}>
          <li><h4>Samba no pé, em crescendo</h4><p>As bailarinas de todo o elenco entram progressivamente com o samba no pé.</p></li>
          <li><h4>Samba de gafieira</h4><p>Com Thaís e Renan ou Daiane e André, conforme a dupla preparada e escalada para a sessão.</p></li>
          <li><h4>Axé: a festa no auge</h4><p>Um encerramento coletivo e festivo, para gastar as últimas energias dançando.</p></li>
          <li><h4>Música para dançar a pedido</h4><p>De 5 a 15 minutos de música para dançar a pedido do público, conforme a dinâmica da noite. É também o momento de agradecer e se despedir.</p></li>
        </ol>
      </div>
      <div className={styles.pullQuote}><p>“Que todos sintam que viveram uma experiência completa: sem faltar e sem sobrar.”</p><span>A referência é cerca de uma hora no total. O roteiro, as participações e a despedida serão ajustados nos ensaios e ao ritmo do público, respeitando os horários combinados com o espaço.</span></div>
    </section>

    <section id="elenco" className={styles.section} aria-labelledby="cast-title">
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>PESSOAS ANTES DE FORMATOS</p><h2 id="cast-title">Sete artistas.<br/><em>Um núcleo completo.</em></h2><p>Seis bailarinos e uma pessoa na harpa formam o núcleo do espetáculo. A participação de cada pessoa será formalizada após conversa, disponibilidade e acordo.</p></div>
      <div className={styles.castGrid}>
        <article className={styles.castCard}><span className={styles.eyebrow}>PARAGUAI · 3 ARTISTAS</span><h3>Aracely Maizares</h3><p>Bailarina e subdiretora artística do projeto. Representante da UnderTango no Paraguai e diretora da Aracely Maizares Producciones.</p><h3>Camila Bazán</h3><p>Bailarina do quadro paraguaio.</p><h3>Harpista</h3><p>Nome a definir. A harpa ao vivo integra o núcleo mínimo do espetáculo.</p></article>
        <article className={styles.castCard}><span className={styles.eyebrow}>ARGENTINA · 2 ARTISTAS</span><h3>Bailarina de tango a definir</h3><p>Bailarina do casal que conduz o quadro argentino.</p><h3>Pablo Cieslik</h3><p>Bailarino, diretor da UnderTango e responsável pela direção geral desta proposta.</p><p className={styles.cardFootnote}>Os países identificam os quadros artísticos, não a nacionalidade de cada integrante.</p></article>
        <article className={styles.castCard}><span className={styles.eyebrow}>BRASIL · 2 ARTISTAS POR SESSÃO</span><h3>Thaís Andrade<br/>e Renan Araujo</h3><p>Tango a quatro, samba no pé e samba de gafieira, conforme a participação de cada integrante.</p><p>A escala será combinada conforme preparação, agenda e disponibilidade, com o apoio da dupla indicada abaixo.</p></article>
      </div>
      <div className={styles.supportRoster}>
        <h3>Substituições e artistas de apoio</h3>
        <div className={styles.supportGrid}>
          <article><p className={styles.eyebrow}>PARAGUAI</p><ul><li>Juan Acosta</li><li>Sielia Burgos</li><li>Gustavo Paez</li><li>Igor Lopez</li></ul></article>
          <article><p className={styles.eyebrow}>ARGENTINA</p><ul><li>Evayan Behr</li><li>Luján Rojas</li></ul></article>
          <article><p className={styles.eyebrow}>BRASIL</p><ul><li>Daiane Oliveira</li><li>André da Silva (MK)</li></ul></article>
        </div>
      </div>
      <div className={styles.castPolicy}><h3>Continuidade sem sobrecarregar ninguém.</h3><p>Cada bailarino poderá contar com substituições pertinentes. A direção artística organizará a ordem de convocação e a preparação de cada função, respeitando a disponibilidade dos artistas de apoio.</p><p>A lista de apoio organiza as substituições do elenco. Participações adicionais serão combinadas e incluídas nos cachês e na produção da sessão. No samba no pé, as bailarinas de todo o elenco se encontram.</p></div>
    </section>

    <section id="formatos" className={styles.section} aria-labelledby="formats-title">
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>CRESCER COM A DEMANDA</p><h2 id="formats-title">O mesmo espetáculo.<br/><em>Duas possibilidades.</em></h2><p>Pocket e Premium Deluxe mantêm o mesmo percurso artístico. A diferença está na presença de cinco músicos adicionais no Premium. Os integrantes e a instrumentação dessa formação ainda serão definidos.</p></div>
      <div className={styles.formatGrid}>{formats.map((format, index) => <article className={styles.formatCard} key={format.id}>
        <div className={styles.formatTop}><span>0{index + 1}</span><span>{format.artists} ARTISTAS</span></div>
        <h3>{format.name}</h3><p className={styles.addition}>{format.addition}</p><p>{format.description}</p>
        <dl className={styles.ledger}><div><dt>Cachês · {format.artists} × R$300</dt><dd>{brl(format.artists * artistFee)}</dd></div><div><dt>Produção estimada</dt><dd>{brl(format.production)}</dd></div><div><dt>Meta mínima UnderTango</dt><dd>{brl(format.companyFloor)}</dd></div></dl>
        <div className={styles.activation}><strong>{format.recommended}</strong><p>pagantes a R$50<br/><span>referência prática de ativação</span></p></div>
        <p className={styles.note}>Mínimo matemático: {calculateScenario(format.id, 50, 50).minimumTickets} ingressos. Referência arredondada para cima, com os custos estimados abaixo.</p>
      </article>)}</div>
    </section>

    <section id="contas" className={styles.section} aria-labelledby="budget-title">
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>VIABILIDADE POR APRESENTAÇÃO</p><h2 id="budget-title">Uma conta que<br/><em>cuida de todos.</em></h2><p>O piso de cada artista vem primeiro. Produção precisa ter recursos para trabalhar. Carlos recebe sua comissão, e a UnderTango preserva uma margem inicial para sustentar o projeto.</p></div>
      <div className={styles.moneyRules}><p><strong>R$300</strong><span>cachê mínimo por artista, por sessão.<br/>É um piso, não um teto.</span></p><p><strong>{commissionRate}%</strong><span>para Carlos, sobre a receita bruta dos ingressos.</span></p><p><strong>Separados</strong><span>produção e margem UnderTango.<br/>Uma não substitui a outra.</span></p></div>
      <div className={styles.realityCheck}><h3>Por que 80 ingressos ainda não ativam o Premium?</h3><p><strong>80 × R$50 = R$4.000.</strong> A comissão de Carlos é R$400 e sobram R$3.600, exatamente o valor dos doze cachês. Ainda é preciso cobrir produção, taxas e margem. <strong>40 ingressos a R$100 produzem exatamente a mesma receita</strong> e a mesma insuficiência.</p></div>
      <BudgetCalculator />
      <div className={styles.tableHeading}><h3>Referências de ativação a R$50</h3><p>Todos os valores abaixo são por apresentação, com ingressos pagos. Custos de produção e metas da empresa são propostas iniciais, ainda não orçamentos contratados.</p></div>
      <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Tabela de viabilidade por formato; deslize para ver todas as colunas">
        <table><caption>Distribuição da bilheteria nas referências práticas de ativação</caption><thead><tr><th scope="col">Formato</th><th scope="col">Pagantes</th><th scope="col">Bilheteria</th><th scope="col">Artistas</th><th scope="col">Carlos · {commissionRate}%</th><th scope="col">Produção</th><th scope="col">Reserva · 5%</th><th scope="col">Resultado líquido</th></tr></thead>
        <tbody>{formats.map(format => { const result = calculateScenario(format.id, format.recommended, 50); return <tr key={format.id}><th scope="row">{format.name}</th><td>{format.recommended}</td><td>{brl(result.gross)}</td><td>{brl(result.artists)}</td><td>{brl(result.commission)}</td><td>{brl(result.production)}</td><td>{brl(result.reserve)}</td><td>{brl(result.company)}</td></tr>; })}</tbody></table>
      </div>
      <p className={styles.note}>Reserva provisória de 5% para taxas de venda, meios de pagamento e tributos. Não é uma alíquota legal nem um custo confirmado. Deve ser substituída pela incidência real antes de fechar as condições. O resultado líquido estimado é o que resta após os custos e a reserva; o valor final será apurado na prestação de contas.</p>
      <div className={styles.pocketNote}><span className={styles.eyebrow}>E SE VIEREM AS 50 PESSOAS ESPERADAS?</span><h3>O Pocket precisa de apoio para começar nesse público.</h3><p>R$2.500 de bilheteria deixam R$150 depois de Carlos e dos sete cachês. Incluindo R$600 de produção e a reserva de R$125, o resultado fica em <strong>−R$575</strong>. Para preservar também a meta inicial de R$150 da UnderTango, faltam <strong>R$725 líquidos por sessão</strong>.</p><p>A estreia com 50 pagantes depende, portanto, de um apoio mínimo líquido de R$725, de mais vendas ou de uma redução real e validada de custos de produção. Apoio líquido significa o valor disponível após os custos que incidirem sobre ele. Não há apoio financeiro já confirmado, e o cachê dos artistas não deve financiar esse déficit.</p></div>
    </section>

    <section className={styles.section} aria-labelledby="production-title">
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>O QUE FAZ A RODA GIRAR</p><h2 id="production-title">Produção com<br/><em>recursos de verdade.</em></h2><p>Reservas por sessão para vestuário, manutenção e deslocamento. Quando entram músicos, transporte e operação crescem. Estes valores são uma proposta de planejamento para validar com quem executa cada tarefa.</p></div>
      <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Orçamento estimado de produção">
        <table><caption>Proposta de reserva de produção por apresentação</caption><thead><tr><th scope="col">Destino</th><th scope="col">Pocket</th><th scope="col">Premium Deluxe</th></tr></thead><tbody>{productionItems.map(([label, ...values]) => <tr key={label}><th scope="row">{label}</th>{values.map((value, index) => <td key={index}>{brl(value)}</td>)}</tr>)}<tr className={styles.tableTotal}><th scope="row">Total reservado</th><td>R$600,00</td><td>R$1.200,00</td></tr></tbody></table>
      </div>
      <p className={styles.note}>A reserva recorrente de figurino não substitui um orçamento inicial de confecção ou compra. Investimentos de estreia, ensaios remunerados, equipamentos e despesas extraordinárias precisam ser levantados e financiados separadamente, se necessários.</p>
      <div className={styles.agreements}>
        <article><h3>Estrutura da TropCalia e responsabilidades</h3><p>A TropCalia conta com técnico de iluminação e som e com uma tela gigante. A UnderTango fornecerá o material audiovisual complementar para exibição na tela. A operação e as transições serão alinhadas com a equipe técnica do espaço.</p><p>A simulação considera o espaço sem aluguel adicional nem outro percentual sobre a bilheteria; essas condições comerciais ainda precisam ser acordadas. Refeições e bebidas são tratadas separadamente. Definir também quem vende, recebe, emite os documentos necessários, presta contas e efetua os pagamentos.</p></article>
        <article><h3>Antes de confirmar cada sessão</h3><p>Combinar a escala, os cachês, transporte, horários, passagem de som e responsabilidade por cada custo. Estabelecer um prazo de confirmação das vendas e uma política de cancelamento e reembolso antes de abrir a bilheteria.</p><p>Contar ingressos efetivamente pagos e a receita correspondente. Se a meta não for atingida, garantir apoio líquido ou rever o formato antes de assumir compromissos. Nunca tratar expectativa de público como dinheiro disponível.</p></article>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="calendar-title">
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>DA PROPOSTA À TEMPORADA</p><h2 id="calendar-title">Ensaiar. Estrear.<br/><em>Aprender juntos.</em></h2></div>
      <div className={styles.experienceGrid}>
        <article><span>AGORA</span><h3>Alinhar e preparar</h3><p>Ouvir o elenco e a TropCalia; confirmar harpista, substituições, custos reais e condições de trabalho; ensaiar transições, repertório e participação do público.</p></article>
        <article><span>ÚLTIMA SEMANA · OUTUBRO 2026</span><h3>Avant-première</h3><p>Uma primeira apresentação para validar a experiência completa, o serviço, a duração, a resposta do público e a operação. Dia, horário, formato e apoio de estreia a definir.</p></article>
        <article><span>NOVEMBRO 2026</span><h3>Temporada semanal</h3><p>Início proposto com pelo menos uma sessão por semana e possibilidade de outras ativações. Os preços poderão evoluir quando a demanda se comprovar; as contas de hoje continuam baseadas em R$50.</p></article>
      </div>
    </section>

    <section className={styles.letter} aria-labelledby="letter-title">
      <p className={styles.eyebrow}>UMA MENSAGEM PARA QUEM FAZ PARTE</p>
      <h2 id="letter-title">Há lugar para<br/><em>o nosso talento.</em></h2>
      <div className={styles.letterBody}>
        <p>Este documento será compartilhado com todas as pessoas envolvidas e convidadas a construir este projeto. Vamos ajustá-lo e aperfeiçoá-lo à medida que cada um puder expressar suas necessidades, suas possibilidades e sua vontade de participar.</p>
        <p>Se você está aqui, lendo estas páginas, é porque tenho muita estima, muito carinho e uma confiança enorme em você. Obrigado por estar presente. Quero que este seja um espaço bonito, onde possamos ser felizes fazendo o que gostamos e onde cada um tenha a oportunidade de mostrar seu talento.</p>
        <p>Temos uma longa trajetória de trabalho em conjunto. Seguiremos buscando projetos nos quais possamos brilhar como artistas, cuidar uns dos outros e construir condições para continuar.</p>
        <p>Também quero dar as boas-vindas ao nosso braço mais novo no Brasil: Thaís, que já fez três shows conosco, e Renan, que já fez dois.</p>
        <p>Daiane Oliveira e André da Silva (MK), acredito que vocês receberiam esta proposta com entusiasmo. Sei também que têm muitas responsabilidades. Por isso, deixo aberta a possibilidade de alternarmos as duplas brasileiras e compartilharmos os compromissos, respeitando a disponibilidade de cada um.</p>
        <p>Na frente paraguaia, Aracely Maizares é nossa representante da UnderTango no Paraguai e diretora da Aracely Maizares Producciones. Ela conta com minha mais profunda confiança e assume, nesta proposta, a subdireção artística do projeto. Sua experiência e seu olhar são fundamentais para o que queremos construir.</p>
        <p>Que possamos fazer deste encontro um lugar de alegria, trabalho bem cuidado e possibilidades para todos.</p>
      </div>
      <p className={styles.signature}>Pablo Cieslik<span>Diretor · UnderTango Club</span></p>
    </section>

    <footer className={styles.footer}><a className={styles.brand} href="/">Ø UNDERTANGO</a><p>Raízes da Tríplice Fronteira · TropCalia<br/>Proposta de trabalho · 16 de setembro de 2026</p><p>Elenco, calendário e condições em construção.<br/>Este documento não confirma contratações, vendas ou aportes.</p><p className={styles.method}>Método das contas: receita menos custos e comissão, preservando cachês e meta da empresa. Referência: <a href="https://sebrae.com.br/Sebrae/Portal%20Sebrae/UFs/MS/Anexos/2024/como_calcular_o_ponto_de_equilibrio.pdf" target="_blank" rel="noreferrer">Sebrae · ponto de equilíbrio ↗</a>. Estimativas próprias desta proposta.</p></footer>
  </main>;
}


