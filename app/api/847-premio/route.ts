import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const whatsapp = '5493757618270';

function reply(body: { error: string } | { whatsapp: string }, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) return reply({ error: 'Origen inválido.' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return reply({ error: 'Se requiere JSON.' }, 415);
  if (Number(request.headers.get('content-length')) > 2048)
    return reply({ error: 'Solicitud demasiado grande.' }, 413);

  let data;
  try {
    const text = await request.text();
    if (text.length > 2048) return reply({ error: 'Solicitud demasiado grande.' }, 413);
    data = JSON.parse(text);
  } catch {
    return reply({ error: 'Solicitud inválida.' }, 400);
  }
  if (
    !data ||
    typeof data.partida !== 'string' ||
    !uuid.test(data.partida) ||
    (data.nombre !== undefined && typeof data.nombre !== 'string') ||
    typeof data.instagram !== 'string'
  )
    return reply({ error: 'Revisá los datos de la partida.' }, 400);
  const nombre = data.nombre?.trim() ?? '';
  const instagram = data.instagram.trim().replace(/^@/, '');
  if (
    nombre.length > 80 ||
    /[\u0000-\u001f\u007f]/.test(nombre) ||
    !/^[a-z\d._]{1,30}$/i.test(instagram)
  )
    return reply({ error: 'Escribí un usuario de Instagram válido para seguir.' }, 400);

  const api = process.env.ANALYTICS_SUPABASE_URL;
  const key = process.env.ANALYTICS_SUPABASE_SECRET_KEY;
  const unavailable = {
    error: 'No se pudo guardar el registro. Tus datos siguen acá para reintentar.',
  };
  if (!api || !key) return reply(unavailable, 503);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: key };
    if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;
    const saved = await fetch(new URL('/rest/v1/rpc/ut_847_reclamar', api), {
      method: 'POST',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(7000),
      body: JSON.stringify({
        p_partida: data.partida,
        p_nombre: nombre || null,
        p_instagram: instagram,
      }),
    });
    if (!saved.ok) return reply(unavailable, 503);
    const result = await saved.json();
    if (result === false)
      return reply(
        { error: 'Esta partida ya se registró con otros datos. Usá los que ingresaste antes.' },
        409
      );
    if (result !== true) return reply(unavailable, 503);
  } catch {
    return reply(unavailable, 503);
  }
  const link = new URL('https://wa.me/' + whatsapp);
  link.searchParams.set('text', 'Ø');
  return reply({ whatsapp: link.href });
}
