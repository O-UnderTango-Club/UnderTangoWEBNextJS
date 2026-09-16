export const dynamic = "force-static";

export function GET() {
  return new Response(null, {
    status: 308,
    headers: { Location: "/tropcalia-raizes-social-v3.jpg" },
  });
}
