import { protocolMarkdown } from "../protocol";

export const dynamic = "force-static";

export function GET() {
  return new Response(protocolMarkdown(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
