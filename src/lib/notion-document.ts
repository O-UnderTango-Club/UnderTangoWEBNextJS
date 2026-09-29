import "server-only";

export const reviewDocument = {
  pageId: "3eae2fde-62f8-81c0-9602-e7e2b7c2636a",
  url: "https://app.notion.com/p/3eae2fde62f881c09602e7e2b7c2636a",
  title: "UnderTango · Revisión de diapositivas y discurso",
};
export type RichText = {
  plain_text?: string;
  text?: { content: string; link?: { url: string } | null };
  href?: string | null;
  annotations?: { bold?: boolean; italic?: boolean; strikethrough?: boolean; underline?: boolean; code?: boolean };
};
export type BlockContent = {
  rich_text?: RichText[]; caption?: RichText[];
  file?: { url: string }; external?: { url: string }; url?: string;
  checked?: boolean; cells?: RichText[][];
};
export type NotionBlock = {
  id: string; type: string; has_children?: boolean; children?: NotionBlock[];
  [key: string]: unknown;
};
type Page = { archived?: boolean; in_trash?: boolean; properties?: Record<string, { type: string; title?: RichText[] }> };
type BlockList = { results: NotionBlock[]; has_more: boolean; next_cursor?: string | null };

export function blockContent(block: NotionBlock): BlockContent {
  return (block[block.type] as BlockContent) || {};
}
export function plainText(text: RichText[] = []): string {
  return text.map(part => part.plain_text ?? part.text?.content ?? "").join("");
}
export function safeUrl(value: string | undefined | null, image = false): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return (image ? ["https:"] : ["https:", "http:", "mailto:"]).includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

// Only this explicitly published page is exposed. No user-supplied page IDs.
export async function getReviewDocument() {
  const token = process.env.NOTION_API_KEY;
  if (!token) return null;
  const headers = { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28" };
  async function request<T>(path: string): Promise<T> {
    const response = await fetch(`https://api.notion.com/v1/${path}`, {
      headers, cache: "no-store", signal: AbortSignal.timeout(12000),
    });
    // Never return API bodies, request headers or credentials to the browser/logs.
    if (!response.ok) throw new Error(`Notion document unavailable (${response.status})`);
    return response.json() as Promise<T>;
  }
  const page = await request<Page>(`pages/${reviewDocument.pageId}`);
  if (page.archived || page.in_trash) throw new Error("Notion document unavailable");
  let count = 0;
  const nestedTypes = new Set(["paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item", "numbered_list_item", "to_do", "toggle", "quote", "callout", "column_list", "column", "table"]);
  async function children(id: string, depth = 0): Promise<NotionBlock[]> {
    if (depth > 8) throw new Error("Notion document exceeds supported nesting");
    const blocks: NotionBlock[] = [];
    let cursor: string | undefined;
    const cursors = new Set<string>();
    do {
      const query = cursor ? `&start_cursor=${encodeURIComponent(cursor)}` : "";
      const result = await request<BlockList>(`blocks/${id}/children?page_size=100${query}`);
      if (!Array.isArray(result.results)) throw new Error("Invalid Notion document");
      for (const block of result.results) {
        if (++count > 1000) throw new Error("Notion document exceeds supported length");
        if (block.has_children && nestedTypes.has(block.type)) block.children = await children(block.id, depth + 1);
        blocks.push(block);
      }
      cursor = result.has_more ? result.next_cursor ?? undefined : undefined;
      if (result.has_more && (!cursor || cursors.has(cursor))) throw new Error("Invalid Notion pagination");
      if (cursor) cursors.add(cursor);
    } while (cursor);
    return blocks;
  }
  const title = Object.values(page.properties || {}).find(property => property.type === "title");
  return { title: plainText(title?.title) || reviewDocument.title, blocks: await children(reviewDocument.pageId) };
}
