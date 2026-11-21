import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const maxPdf = 4 * 1024 * 1024;
const codePattern = /^8\.2\.(?:2\.[ac]|[34]\.[a-e])$/;
const scriptUrlPattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/;

function reply(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const { SESC_DRIVE_UPLOAD_URL: url, SESC_DRIVE_UPLOAD_SECRET: secret, SESC_DRIVE_INVITE_CODE: invite } = process.env;
  if (!url || !scriptUrlPattern.test(url) || !secret || !invite) {
    return reply({ error: "O envio de arquivos ainda não está disponível." }, 503);
  }

  const expected = Buffer.from("Bearer " + invite);
  const provided = Buffer.from(request.headers.get("authorization") || "");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return reply({ error: "Abra o link de envio que Pablo compartilhou com você." }, 401);
  }

  const code = request.headers.get("x-document-code");
  const payload = { token: secret, action: code ? "upload" : "status" };
  if (code) {
    if (!codePattern.test(code)) return reply({ error: "Item inválido." }, 400);
    if (Number(request.headers.get("content-length")) > maxPdf) {
      return reply({ error: "O arquivo deve ter até 4 MB." }, 413);
    }
    const pdf = Buffer.from(await request.arrayBuffer());
    if (pdf.length > maxPdf) return reply({ error: "O arquivo deve ter até 4 MB." }, 413);
    if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return reply({ error: "Selecione um arquivo PDF." }, 415);
    }
    payload.code = code;
    payload.pdf = pdf.toString("base64");
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(40000),
    });
    if (!response.ok) throw new Error("Drive connection failed");
    const result = await response.json();
    if (result.error === "limit") {
      return reply({ error: "O limite de versões deste item foi atingido. Fale com Pablo para enviar outra versão." }, 409);
    }
    if (!result.ok || !Array.isArray(result.received) || (code && !result.received.includes(code))) {
      throw new Error("Drive receipt missing");
    }
    return reply({ received: result.received.filter((item) => typeof item === "string" && codePattern.test(item)) });
  } catch {
    return reply({ error: code ? "Não foi possível confirmar o envio. Tente novamente ou envie por e-mail ou WhatsApp." : "Não foi possível consultar os arquivos recebidos. Atualize a página e tente novamente." }, 502);
  }
}
