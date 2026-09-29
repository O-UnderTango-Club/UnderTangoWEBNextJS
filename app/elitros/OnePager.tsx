import { NotionBlocks } from "@/src/components/NotionBlocks";
import { getOnePagerDocument, onePagerDocument, type NotionBlock } from "@/src/lib/notion-document";
import styles from "./onepager.module.css";

// Heading 3 starts a card; a divider after the cards starts the document footer.
// All content stays in source order, including new or unsupported blocks.
export function groupOnePager(blocks: NotionBlock[]) {
  const header: NotionBlock[] = [];
  const sections: NotionBlock[][] = [];
  const footer: NotionBlock[] = [];
  let inFooter = false;
  for (const block of blocks) {
    if (sections.length && block.type === "divider") inFooter = true;
    if (inFooter) footer.push(block);
    else if (block.type === "heading_3") sections.push([block]);
    else if (sections.length) sections[sections.length - 1].push(block);
    else header.push(block);
  }
  return { header, sections, footer };
}

export default async function OnePager() {
  let document: Awaited<ReturnType<typeof getOnePagerDocument>> = null;
  try { document = await getOnePagerDocument(); } catch { /* Keep API details server-side. */ }
  const content = document ? groupOnePager(document.blocks) : null;
  const render = (blocks: NotionBlock[]) => <NotionBlocks blocks={blocks} sourceUrl={onePagerDocument.url} classes={styles} />;
  return <section className={`bmc-onepager ${styles.section}`} id="onepager" aria-label="One-pager de UnderTango">
    <span id="one-pager" className="bmc-onepager-anchor" aria-hidden="true" />
    <article className={styles.sheet}>
      {content ? <>
        <header className={styles.header}>{render(content.header)}</header>
        <div className={styles.grid}>
          {content.sections.map((blocks) => <section className={styles.card} key={blocks[0].id}>{render(blocks)}</section>)}
        </div>
        {content.footer.length > 0 && <footer className={styles.footer}>{render(content.footer)}</footer>}
      </> : <div className={styles.unavailable}>
        <h2>One-pager de UnderTango</h2>
        <p role="status">En este momento no se puede mostrar el documento. Podés abrir el original en Notion desde el enlace de abajo.</p>
      </div>}
      <nav className={styles.links} aria-label="Documentos del one-pager">
        <a href={onePagerDocument.url} target="_blank" rel="noopener noreferrer">Abrir documento en Notion ↗</a>
        <a href="/elitros/UnderTango-One-Pager-2026-09-29.pdf" download>PDF · versión del 29/09/2026 ↓</a>
      </nav>
    </article>
  </section>;
}
