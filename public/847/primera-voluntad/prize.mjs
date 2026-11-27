const validRound = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function showPrize(round) {
  const prize = document.createElement('main');
  prize.id = 'prize';
  if (!validRound.test(round)) {
    prize.innerHTML =
      '<section><h1>Ø Primera voluntad</h1><p>Esta historia empieza en la cámara.</p><a href="/847/primera-voluntad">Ir al juego →</a></section>';
    document.body.append(prize);
    return;
  }
  document.title = 'Ø · Primera voluntad';
  const link = document.createElement('a');
  link.className = 'secret-sign';
  link.href = 'https://wa.me/5493757618270?text=' + encodeURIComponent('Ø');
  link.setAttribute('aria-label', 'Abrir WhatsApp con el signo Ø');
  link.textContent = 'Ø';
  prize.append(link);
  document.body.append(prize);
  window.scrollTo(0, 0);
  link.focus({ preventScroll: true });
}
