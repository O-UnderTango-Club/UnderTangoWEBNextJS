import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { blockContent, getReviewDocument, plainText, reviewDocument, safeUrl, type NotionBlock, type RichText } from "@/src/lib/notion-document";
import styles from "./review.module.css";

export const dynamic = "force-dynamic";
const shareTitle = "UnderTango App | Red productiva";
const shareDescription = "Cinco diapositivas y un discurso sobre el desarrollo de una app para hacer visible, conectar y reactivar la cadena productiva cultural.";
const reviewPath = "/80/diapositivas-y-discurso";

export const metadata: Metadata = {
  title: shareTitle,
  description: shareDescription,
  alternates: { canonical: reviewPath },
  openGraph: {
    title: shareTitle,
    description: shareDescription,
    url: reviewPath,
    siteName: "Ø UnderTango Club",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: [`${reviewPath}/opengraph-image`],
  },
  robots: { index: false, follow: false },
};

function Text({ parts = [] }: { parts?: RichText[] }) {
  return parts.map((part, index) => {
    let content: ReactNode = plainText([part]);
    const a = part.annotations;
    if (a?.code) content = <code>{content}</code>;
    if (a?.bold) content = <strong>{content}</strong>;
    if (a?.italic) content = <em>{content}</em>;
    if (a?.strikethrough) content = <s>{content}</s>;
    if (a?.underline) content = <u>{content}</u>;
    const href = safeUrl(part.href || part.text?.link?.url);
    return <span key={index}>{href ? <a href={href} rel="noopener noreferrer">{content}</a> : content}</span>;
  });
}

function Blocks({ blocks }: { blocks: NotionBlock[] }) {
  const result: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const data = blockContent(block);
    const text = <Text parts={data.rich_text} />;
    const nested = block.children ? <Blocks blocks={block.children} /> : null;
    if (["bulleted_list_item", "numbered_list_item"].includes(block.type)) {
      const items: ReactNode[] = [];
      let j = i;
      while (j < blocks.length && blocks[j].type === block.type) {
        const item = blocks[j++];
        items.push(<li key={item.id}><Text parts={blockContent(item).rich_text} />{item.children && <Blocks blocks={item.children} />}</li>);
      }
      result.push(block.type === "numbered_list_item" ? <ol key={block.id}>{items}</ol> : <ul key={block.id}>{items}</ul>);
      i = j - 1;
      continue;
    }
    let element: ReactNode;
    switch (block.type) {
      case "paragraph": element = <><p>{text}</p>{nested}</>; break;
      case "heading_1":
      case "heading_2": element = <><h2 id={block.id}>{text}</h2>{nested}</>; break;
      case "heading_3": element = <><h3 id={block.id}>{text}</h3>{nested}</>; break;
      case "image": {
        const src = safeUrl(data.file?.url || data.external?.url, true);
        const caption = plainText(data.caption);
        element = src ? <figure>
          <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${caption || "imagen"} en tamaño completo`}>
            {/* Signed URLs are refreshed on each request, outside the image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={caption || "Imagen del documento"} />
          </a>
          {caption && <figcaption><Text parts={data.caption} /></figcaption>}
        </figure> : <p>Esta imagen no está disponible.</p>;
        break;
      }
      case "quote": element = <blockquote>{text}{nested}</blockquote>; break;
      case "callout": element = <aside>{text}{nested}</aside>; break;
      case "divider": element = <hr />; break;
      case "code": element = <pre><code>{plainText(data.rich_text)}</code></pre>; break;
      case "to_do": element = <div><span aria-label={data.checked ? "Completado" : "Pendiente"}>{data.checked ? "☑" : "☐"}</span> {text}{nested}</div>; break;
      case "toggle": element = <details><summary>{text}</summary>{nested}</details>; break;
      case "column_list":
      case "column": element = <div>{nested}</div>; break;
      case "table": element = <div className={styles.table}><table><tbody>{block.children?.map(row => <tr key={row.id}>{blockContent(row).cells?.map((cell, index) => <td key={index}><Text parts={cell} /></td>)}</tr>)}</tbody></table></div>; break;
      case "bookmark":
      case "link_preview": {
        const href = safeUrl(data.url);
        element = href ? <p><a href={href}>{plainText(data.caption) || href}</a></p> : <p>Enlace no disponible.</p>;
        break;
      }
      default: element = <p className={styles.notice}>Este bloque se puede consultar en <a href={reviewDocument.url}>el documento original de Notion</a>.</p>;
    }
    result.push(<div className={styles.block} key={block.id}>{element}</div>);
  }
  return result;
}

export default async function ReviewPage() {
  let document: Awaited<ReturnType<typeof getReviewDocument>> = null;
  try { document = await getReviewDocument(); } catch { /* No source/API details reach the fallback. */ }
  const headings = document?.blocks.filter(block => block.type === "heading_2") || [];
  return <main className={styles.page} id="inicio">
    <header className={styles.header}>
      <nav aria-label="Ruta de navegación"><Link href="/">UnderTango</Link><span>/</span><Link href="/80">80</Link><span>/</span><span>Diapositivas y discurso</span></nav>
    </header>
    <article className={styles.document}>
      <h1>{document?.title || reviewDocument.title}</h1>
      <p className={styles.source}><a href={reviewDocument.url} target="_blank" rel="noopener noreferrer">Abrir documento en Notion ↗</a></p>
      {document ? <>
        <nav className={styles.contents} aria-label="Índice de diapositivas">
          {headings.map(block => {
            const heading = plainText(blockContent(block).rich_text);
            const slide = heading.match(/^(?:\d{1,2}:\d{2}\s*·\s*)?(?:(?:CAMBIAR A )?DIAPOSITIVA\s*)?(\d+)\s*·\s*(.+)$/i);
            return <a key={block.id} href={`#${block.id}`}>
              {slide && <span className={styles.contentsNumber} aria-hidden="true">{slide[1].padStart(2, "0")}</span>}
              <span className={styles.contentsTitle}>{slide?.[2] || heading}</span>
            </a>;
          })}
        </nav>
        <Blocks blocks={document.blocks} />
      </> : <p role="status">El documento está disponible en Notion. En este momento no se puede mostrar aquí; podés abrir el original desde el enlace de arriba.</p>}
    </article>
    <footer className={styles.footer}><Link href="/80">Volver al departamento 80</Link><a href="#inicio">Volver arriba ↑</a></footer>
  </main>;
}
