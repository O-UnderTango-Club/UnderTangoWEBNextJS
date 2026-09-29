import type { ReactNode } from "react";
import { blockContent, plainText, safeUrl, type NotionBlock, type RichText } from "@/src/lib/notion-document";

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

export function NotionBlocks({ blocks, sourceUrl, classes = {} }: {
  blocks: NotionBlock[];
  sourceUrl: string;
  classes?: { block?: string; table?: string; notice?: string };
}) {
  const result: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const data = blockContent(block);
    const text = <Text parts={data.rich_text} />;
    const nested = block.children ? <NotionBlocks blocks={block.children} sourceUrl={sourceUrl} classes={classes} /> : null;
    if (["bulleted_list_item", "numbered_list_item"].includes(block.type)) {
      const items: ReactNode[] = [];
      let j = i;
      while (j < blocks.length && blocks[j].type === block.type) {
        const item = blocks[j++];
        items.push(<li key={item.id}><Text parts={blockContent(item).rich_text} />{item.children && <NotionBlocks blocks={item.children} sourceUrl={sourceUrl} classes={classes} />}</li>);
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
      case "table": element = <div className={classes.table}><table><tbody>{block.children?.map(row => <tr key={row.id}>{blockContent(row).cells?.map((cell, index) => <td key={index}><Text parts={cell} /></td>)}</tr>)}</tbody></table></div>; break;
      case "bookmark":
      case "link_preview": {
        const href = safeUrl(data.url);
        element = href ? <p><a href={href}>{plainText(data.caption) || href}</a></p> : <p>Enlace no disponible.</p>;
        break;
      }
      default: element = <p className={classes.notice}>Este bloque se puede consultar en <a href={sourceUrl}>el documento original de Notion</a>.</p>;
    }
    result.push(<div className={classes.block} key={block.id}>{element}</div>);
  }
  return result;
}

