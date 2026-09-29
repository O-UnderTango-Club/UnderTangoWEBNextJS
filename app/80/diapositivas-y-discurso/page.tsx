import type { Metadata } from "next";
import Link from "next/link";
import { blockContent, getReviewDocument, plainText, reviewDocument } from "@/src/lib/notion-document";
import { NotionBlocks } from "@/src/components/NotionBlocks";
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
        <NotionBlocks blocks={document.blocks} sourceUrl={reviewDocument.url} classes={styles} />
      </> : <p role="status">El documento está disponible en Notion. En este momento no se puede mostrar aquí; podés abrir el original desde el enlace de arriba.</p>}
    </article>
    <footer className={styles.footer}><Link href="/80">Volver al departamento 80</Link><a href="#inicio">Volver arriba ↑</a></footer>
  </main>;
}
