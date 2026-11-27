export const invitation = {
  city: 'Puerto Iguazú',
  text: 'El 2 de diciembre nos vemos en la Cabaña de los Muñecos, en Puerto Iguazú',
};

function wrap(ctx, text, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const withWord = line ? line + ' ' + word : word;
    if (line && ctx.measureText(withWord).width > width) {
      lines.push(line);
      line = word;
    } else line = withWord;
  }
  if (line) lines.push(line);
  return lines;
}

// The same lettered face appears on the live canvas and in the recorded video.
export function layoutBoard(ctx, view) {
  const w = view.width,
    h = view.height;
  const available = w - view.left - view.right;
  const width = Math.min(550, available * (w < h ? 0.922 : 0.70));
  const pad = Math.min(15, Math.max(9, width * 0.044));
  const artSize = Math.min(51, Math.max(28, width * 0.14));
  const column = Math.max(25, width - pad * 3 - artSize);
  const size = Math.max(14, Math.min(28, column * 0.09, h * 0.059));
  const font = '800 ' + size + 'px Uberlin, system-ui, sans-serif';
  const small = Math.max(10, Math.min(13, width * 0.039));
  const metaFont = '650 ' + small + 'px system-ui, sans-serif';
  const lineH = size * 1.09;
  ctx.font = font;
  const titles = wrap(ctx, invitation.text, column);
  ctx.font = metaFont;
  const labels = wrap(ctx, 'Show de arte generativo · ' + invitation.city, column);
  const height = Math.ceil(
    pad * 2 +
      labels.length * small * 1.22 +
      7 +
      titles.length * lineH
  );
  return { width, height, pad, artSize, font, small, metaFont, lineH, titles, labels };
}

export function paintBoard(ctx, board, layout, art, now) {
  const { width: w, height: h } = layout;
  const x = -w / 2,
    y = -h / 2;
  const artReady = art.complete && !!art.naturalWidth;
  if (!layout.face || layout.face.artReady !== artReady) {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.ceil((w + 12) * scale);
    canvas.height = Math.ceil((h + 12) * scale);
    const ink = canvas.getContext('2d');
    ink.scale(scale, scale);
    ink.translate(4 + w / 2, 3 + h / 2);
    letterFace(ink, layout, art);
    layout.face = { canvas, artReady };
  }
  ctx.save();
  ctx.translate(board.x, board.y);
  ctx.rotate(board.angle);
  ctx.drawImage(layout.face.canvas, x - 4, y - 3, w + 12, h + 12);
  const hit = Math.max(0, 1 - (now - board.lastHit) / 850);
  if (hit > 0) {
    ctx.strokeStyle = 'rgba(235,255,249,' + hit * 0.9 + ')';
    ctx.lineWidth = 1 + hit * 2.5;
    ctx.strokeRect(x, y, w, h);
  }
  ctx.restore();
}

function letterFace(ctx, layout, art) {
  const { width: w, height: h, pad, artSize } = layout;
  const x = -w / 2,
    y = -h / 2;
  const accent = '#89f2dc';
  ctx.save();
  ctx.fillStyle = '#343148';
  ctx.fillRect(x + 2, y + 4, w, h);
  ctx.shadowColor = 'transparent';
  const plate = ctx.createLinearGradient(x, y, x + w, y + h);
  plate.addColorStop(0, '#10101f');
  plate.addColorStop(1, '#27233d');
  ctx.fillStyle = plate;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#736d80';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, 3, h);
  const ay = -artSize * 0.57;
  if (art.complete && art.naturalWidth) {
    const iw = art.naturalWidth,
      ih = art.naturalHeight;
    ctx.drawImage(art, iw * 0.23, ih * 0.29, iw * 0.54, ih * 0.48, x + pad, ay, artSize, -2 * ay);
  }
  const tx = x + pad * 2 + artSize;
  const block =
    layout.labels.length * layout.small * 1.22 + 7 + layout.titles.length * layout.lineH;
  let ty = -block / 2;
  ctx.textBaseline = 'top';
  ctx.fillStyle = accent;
  ctx.font = layout.metaFont;
  for (const line of layout.labels) {
    ctx.fillText(line, tx, ty);
    ty += layout.small * 1.22;
  }
  ty += 7;
  ctx.fillStyle = '#fffaf6';
  ctx.font = layout.font;
  for (const line of layout.titles) {
    ctx.fillText(line, tx, ty);
    ty += layout.lineH;
  }
  ctx.restore();
}
