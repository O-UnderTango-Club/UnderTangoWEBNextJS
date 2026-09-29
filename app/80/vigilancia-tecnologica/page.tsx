import type { Metadata } from "next";
import Link from "next/link";
import { blockContent, getVigilanceDocument, plainText, vigilanceDocument } from "@/src/lib/notion-document";
import { NotionBlocks } from "@/src/components/NotionBlocks";
import styles from "./document.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vigilancia tecnológica · UnderTango",
  description: "Documento de trabajo de ÉLITROS: UnderTango App, digitalización de la cadena productiva, fuentes y decisiones para el prototipo.",
  alternates: { canonical: "/80/vigilancia-tecnologica" },
  robots: { index: false, follow: false },
};

export default async function VigilancePage() {
  let document: Awaited<ReturnType<typeof getVigilanceDocument>> = null;
  try { document = await getVigilanceDocument(); } catch { /* Keep source/API details out of the public fallback. */ }
  const headings = document?.blocks.filter(block => block.type === "heading_2") || [];

  return <main className={styles.page} id="inicio">
    <header className={styles.header}>
      <nav aria-label="Ruta de navegación">
        <Link href="/">Ø UnderTango</Link><span>/</span><Link href="/80">80</Link><span>/</span><Link href="/elitros">ÉLITROS</Link>
      </nav>
    </header>
    <article className={styles.document}>
      <p className={styles.eyebrow}>DOCUMENTO DE TRABAJO · ÉLITROS</p>
      <h1>{document?.title || vigilanceDocument.title}</h1>
      <p className={styles.source}><a href={vigilanceDocument.url} target="_blank" rel="noopener noreferrer">Editar o comentar en Notion ↗</a></p>
      <p className={styles.hint}>El texto se edita en Notion. Recargá esta página para consultar los cambios.</p>
      {document ? <>
        <nav className={styles.contents} aria-label="Índice del documento">
          {headings.map(block => <a key={block.id} href={`#${block.id}`}>{plainText(blockContent(block).rich_text)}</a>)}
        </nav>
        <NotionBlocks blocks={document.blocks} sourceUrl={vigilanceDocument.url} classes={styles} />
      </> : <p className={styles.notice} role="status">En este momento no se puede mostrar el documento aquí. Podés abrir el original en Notion desde el enlace de arriba.</p>}
    </article>
    <footer className={styles.footer}><Link href="/elitros">Volver a ÉLITROS</Link><a href="#inicio">Volver arriba ↑</a></footer>
  </main>;
}
