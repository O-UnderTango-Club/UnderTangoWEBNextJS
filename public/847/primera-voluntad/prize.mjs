import { savedId } from './saved-take.mjs?v=toma14';

const validRound = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function showPrize(round, clipTools) {
  const prize = document.createElement('main');
  prize.id = 'prize';
  if (!validRound.test(round)) {
    prize.innerHTML =
      '<section><h1>Ø Primera voluntad</h1><p>Esta historia empieza en la cámara.</p><a href="/847/primera-voluntad">Ir al juego →</a></section>';
    document.body.append(prize);
    return;
  }
  const hasTake = Boolean(clipTools || savedId());
  document.title = '¿Descubriste el premio secreto? · Ø Primera voluntad';
  prize.innerHTML = `<section aria-labelledby="won-title">
    <h1 id="won-title" tabindex="-1">¿Descubriste el premio secreto?</h1>
    <p>Si te animás a entrar en la madriguera del conejo, mandanos un solo signo por WhatsApp.</p>
    <p class="secret-sign" aria-label="Signo de conjunto vacío">Ø</p>
    <form novalidate>
      <label for="winner-ig">¿Nickname?</label>
      <div class="prize-input"><span aria-hidden="true">@</span><input id="winner-ig" name="instagram" maxlength="31" required aria-describedby="claim-status" autocapitalize="none" spellcheck="false" autocomplete="off" /></div>
      <p id="claim-status" role="status" aria-live="polite"></p>
      <button id="claim" type="submit">Mandar mensaje</button>
    </form>
    <div class="prize-extras"><a data-return href="${hasTake ? './experiencia.html?v=toma14#mi-video' : '/847/primera-voluntad'}">${hasTake ? 'Volver a mi video' : 'Volver a Primera voluntad'}</a></div>
  </section>`;
  document.body.append(prize);
  if (clipTools) prize.querySelector('.prize-extras').prepend(clipTools);
  window.scrollTo(0, 0);
  prize.querySelector('h1').focus({ preventScroll: true });
  const form = prize.querySelector('form');
  const ig = form.elements.instagram;
  const status = prize.querySelector('#claim-status'),
    button = prize.querySelector('#claim');
  form.addEventListener('input', () => {
    status.textContent = '';
    ig.removeAttribute('aria-invalid');
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    const instagram = ig.value.trim().replace(/^@/, '');
    if (!instagram) {
      status.textContent = 'Escribí tu usuario de Instagram para seguir.';
      ig.setAttribute('aria-invalid', 'true');
      ig.focus();
      return;
    }
    if (!/^[a-z0-9._]{1,30}$/i.test(instagram)) {
      ig.setAttribute('aria-invalid', 'true');
      status.textContent = 'Para Instagram usá hasta 30 letras, números, puntos o guiones bajos.';
      ig.focus();
      return;
    }
    button.disabled = true;
    ig.readOnly = true;
    status.textContent = 'Guardando tu registro…';
    try {
      const response = await fetch('/api/847-premio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ partida: round, instagram }),
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
      ig.readOnly = false;
    }
  });
}
