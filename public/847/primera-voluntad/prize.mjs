const validRound = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function showPrize(round, clipTools) {
  const prize = document.createElement('main');
  prize.id = 'prize';
  document.title = 'Te ganaste un premio · Ø Primera voluntad';
  if (!validRound.test(round)) {
    prize.innerHTML =
      '<section><h1>Ø Primera voluntad</h1><p>Llevá el cuadro hasta la meta para reclamar tu premio.</p><a href="/847/primera-voluntad">Ir al juego →</a></section>';
    document.body.append(prize);
    return;
  }
  prize.innerHTML = `<section aria-labelledby="won-title">
    <h1 id="won-title" tabindex="-1">Te ganaste<br>un premio</h1>
    <p>Muchas gracias por jugar. Dejanos tu nombre o tu Instagram y mandanos un mensajito por WhatsApp para reclamar tu premio.</p>
    <form>
      <label for="winner-name">Nombre</label>
      <div class="prize-input"><input id="winner-name" name="nombre" maxlength="80" autocomplete="given-name" /></div>
      <label for="winner-ig">Instagram</label>
      <div class="prize-input"><span aria-hidden="true">@</span><input id="winner-ig" name="instagram" maxlength="31" autocapitalize="none" spellcheck="false" autocomplete="off" /></div>
      <small>Con uno de los dos alcanza. Al tocar el botón guardamos tu registro y abrimos el chat con Pablo.</small>
      <p id="claim-status" role="status" aria-live="polite"></p>
      <button id="claim" type="submit">Reclamar por WhatsApp</button>
    </form>
    <div class="prize-extras"><a href="/847/primera-voluntad">Volver a Primera voluntad</a></div>
  </section>`;
  document.body.append(prize);
  if (clipTools) prize.querySelector('.prize-extras').prepend(clipTools);
  window.scrollTo(0, 0);
  prize.querySelector('h1').focus({ preventScroll: true });
  const form = prize.querySelector('form');
  const name = form.elements.nombre,
    ig = form.elements.instagram;
  const status = prize.querySelector('#claim-status'),
    button = prize.querySelector('#claim');
  form.addEventListener('input', () => {
    status.textContent = '';
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    const nombre = name.value.trim(),
      instagram = ig.value.trim().replace(/^@/, '');
    if (!nombre && !instagram) {
      status.textContent = 'Escribí tu nombre o tu usuario de Instagram.';
      name.focus();
      return;
    }
    if (instagram && !/^[a-z0-9._]{1,30}$/i.test(instagram)) {
      status.textContent = 'Para Instagram usá hasta 30 letras, números, puntos o guiones bajos.';
      ig.focus();
      return;
    }
    button.disabled = true;
    name.readOnly = ig.readOnly = true;
    status.textContent = 'Guardando tu registro…';
    try {
      const response = await fetch('/api/847-premio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ partida: round, nombre, instagram }),
      });
      const result = await response.json();
      if (!response.ok) {
        status.textContent = result.error || 'No se pudo guardar. Volvé a intentarlo.';
        return;
      }
      const destination = new URL(result.whatsapp);
      if (destination.origin !== 'https://wa.me') throw Error('Destino inválido');
      status.textContent = 'Registro guardado. Abriendo WhatsApp…';
      location.assign(destination.href);
    } catch {
      status.textContent = 'No pudimos confirmar el registro. Tus datos siguen acá para reintentar.';
    } finally {
      button.disabled = false;
      name.readOnly = ig.readOnly = false;
    }
  });
}
