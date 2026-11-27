import type { Metadata } from "next";

const title = "Pablo Guillermo Cieslik | Editorial & Creative Portfolio";
const description =
  "Selected writing, copy editing and cultural production by Pablo Guillermo Cieslik, based in Puerto Iguazú, Argentina.";
const canonical = "https://www.undertangoclub.com/pablocieslik";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: "profile",
    firstName: "Pablo Guillermo",
    lastName: "Cieslik",
    siteName: "Ø UnderTango Club",
    locale: "en_US",
    images: [{ url: "/marca/esmeralda-social.jpg", width: 600, height: 600, alt: "Ø UnderTango Club" }],
  },
};

const work = [
  {
    category: "01 / Editing & publishing",
    title: "El Nuevo Iguazú",
    detail: "I worked as a literary proofreader and published short fiction in the newspaper. The publisher’s author profile documents both roles.",
    url: "https://tintalibre.com.ar/author/19/Pablo_Guillermo_Cieslik",
    link: "Read the Tinta Libre author profile",
  },
  {
    category: "02 / English writing",
    title: "10 Hot Questions About Tango",
    detail: "An English-language article written for readers new to tango, structured around ten questions.",
    url: "https://pablocieslik.wixsite.com/undertango/post/10-hot-questions-about-tango-answered-by-a-professional-tango-dancer",
    link: "Read the article in English",
  },
  {
    category: "03 / Spanish-language writing",
    title: "Volviendo a casa",
    detail: "My first novel, published by Tinta Libre. It draws on the stories and cultural memory of Misiones.",
    url: "https://www.elterritorio.com.ar/noticias/2012/07/06/309020-volviendo-a-casa-el-primer-libro-de-pablo-cieslik",
    link: "Read the El Territorio feature",
  },
  {
    category: "04 / Creative direction",
    title: "Ø UnderTango Club",
    detail: "I direct an arts production company in the Triple Frontier, bringing together tango, music and technology for live audiences.",
    url: "https://cancilleria.gob.ar/en/argentina-creativa-directories/performing-arts-production-companies/o-undertango-club",
    link: "See the Argentina Creativa directory",
  },
];

const styles = `
.pcfolio {
  --pc-paper: #f3f2eb; --pc-ink: #172622; --pc-muted: #475b54; --pc-green: #145b47;
  --pc-line: #b8c8be; --pc-dark: #142c24; --pc-light: #f4f4ed; --pc-mint: #c2e8d5;
  background: var(--pc-paper); color: var(--pc-ink); min-height: 100vh;
  padding: 0 clamp(1rem, 5vw, 5rem) 4.5rem;
  font-family: var(--font-undertango-sans), system-ui, sans-serif;
  line-height: 1.6; color-scheme: light;
}
.pcfolio *, .pcfolio *::before, .pcfolio *::after { box-sizing: border-box; }
.pcfolio h1, .pcfolio h2, .pcfolio h3, .pcfolio p { margin: 0; }
.pcfolio p, .pcfolio h3 { font-family: inherit; }
/* This standalone route is visible without the home page’s reveal script. */
.pcfolio section { padding: 0; opacity: 1; transform: none; transition: none; }
.pcfolio section h2 { display: block; text-align: start; }
.pcfolio section h2::after { content: none; }
.pcfolio a { color: inherit; text-underline-offset: .26em; }
.pcfolio a:focus-visible, .pcfolio summary:focus-visible {
  outline: 3px solid #007571; outline-offset: 5px; border-radius: 2px;
}
.pcfolio .pc-wrap { width: min(100%, 69rem); margin: auto; }
.pcfolio .pc-bar {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
  gap: .35rem 1rem; padding: 1.15rem 0;
}
.pcfolio .pc-bar a { font-weight: 700; }
.pcfolio section.pc-hero {
  position: relative; overflow: hidden; isolation: isolate;
  border: 1px solid var(--pc-dark); border-radius: 1.1rem;
  padding: clamp(1.4rem, 5vw, 4.5rem);
  color: var(--pc-light); background: var(--pc-dark);
}
.pcfolio .pc-hero::after {
  content: "Ø"; position: absolute; right: .04em; bottom: -.36em;
  color: #28463b; font-size: clamp(12rem, 34vw, 25rem); line-height: 1;
  font-family: Georgia, serif; z-index: -1; pointer-events: none;
}
.pcfolio .pc-kicker {
  font-size: .76rem; letter-spacing: .11em; font-weight: 700; text-transform: uppercase;
}
.pcfolio .pc-hero .pc-kicker { color: var(--pc-mint); margin-bottom: .85rem; }
.pcfolio .pc-hero h1 {
  color: var(--pc-light); max-width: 14ch; overflow-wrap: normal;
  font: 400 clamp(2.18rem, 7vw, 5.15rem)/1.12 var(--font-undertango-editorial), Georgia, serif;
  letter-spacing: -.065em;
}
.pcfolio .pc-role { font-size: clamp(1.03rem, 2.2vw, 1.36rem); font-weight: 650; margin-top: 1.15rem; }
.pcfolio .pc-lede { margin-top: .65rem; max-width: 47ch; color: #dee8e2; }
.pcfolio .pc-meta { color: var(--pc-mint); margin-top: 1.4rem; font-size: .88rem; }
.pcfolio section.pc-section { padding-top: clamp(2rem, 5vw, 3.6rem); }
.pcfolio h2 {
  font: 400 clamp(1.5rem, 3vw, 2.4rem)/1.3 var(--font-undertango-editorial), Georgia, serif;
  letter-spacing: -.04em; color: var(--pc-ink);
}
.pcfolio .pc-deck { color: var(--pc-muted); margin-top: .45rem; }
.pcfolio .pc-grid {
  list-style: none; padding: 0; margin: 1.25rem 0 0;
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem;
}
.pcfolio .pc-card {
  display: flex; flex-direction: column; align-items: start; gap: .46rem; 
  padding: clamp(1rem, 2.3vw, 1.55rem); background: #faf9f4;
  border: 1px solid var(--pc-line); border-radius: .85rem; min-width: 0;
}
.pcfolio .pc-card .pc-kicker { color: var(--pc-green); }
.pcfolio .pc-card h3 { color: var(--pc-ink); font-size: clamp(1.16rem, 2.4vw, 1.38rem); line-height: 1.3; }
.pcfolio .pc-card p { color: var(--pc-muted); }
.pcfolio .pc-card a { margin-top: auto; padding-top: .55rem; color: var(--pc-green); text-decoration: underline; font-weight: 700; }
.pcfolio .pc-footer {
  background: transparent;
  margin-top: 2.8rem; padding-top: 1rem; border-top: 1px solid var(--pc-line);
  color: var(--pc-muted); font-size: .89rem;
}
.pcfolio .pc-footer::before { content: none; }
@media (max-width: 42rem) {
  .pcfolio .pc-grid { grid-template-columns: minmax(0, 1fr); }
  .pcfolio .pc-hero::after { right: -.11em; opacity: .72; }
}
`;

export default function PabloCieslikPortfolio() {
  return (
    <main className="pcfolio" lang="en">
      <style>{styles}</style>
      <div className="pc-wrap">
        <header className="pc-bar">
          <a href="/">Ø UnderTango Club</a>
          <span className="pc-kicker">Selected work</span>
        </header>

        <section className="pc-hero" aria-labelledby="pc-name">
          <p className="pc-kicker">Puerto Iguazú, Argentina</p>
          <h1 id="pc-name">Pablo Guillermo Cieslik</h1>
          <p className="pc-role">Writer, literary proofreader &amp; creative producer</p>
          <p className="pc-lede">
            I work with words and live performance. My editorial background is in
            Argentine Spanish, and I also publish in English.
          </p>
        </section>

        <section className="pc-section" aria-labelledby="pc-work">
          <h2 id="pc-work">Writing, editing &amp; production</h2>
          <p className="pc-deck">Four public references to my work.</p>
          <ol className="pc-grid">
            {work.map((item) => (
              <li className="pc-card" key={item.title}>
                <p className="pc-kicker">{item.category}</p>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <a href={item.url}>{item.link}</a>
              </li>
            ))}
          </ol>
        </section>

        <footer className="pc-footer">
          Professional portfolio · Pablo Guillermo Cieslik
        </footer>
      </div>
    </main>
  );
}
