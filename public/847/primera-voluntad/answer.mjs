const question = '¿Cuál fue tu primera voluntad antes de nacer?';

function lines(ctx, text, width) {
  const result = [];
  let line = '';
  for (const word of text.trim().split(/\s+/u)) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width <= width) { line = next; continue; }
    if (line) result.push(line);
    line = '';
    for (const char of word) {
      if (line && ctx.measureText(line + char).width > width) { result.push(line); line = ''; }
      line += char;
    }
  }
  if (line) result.push(line);
  return result;
}

export function paintAnswer(ctx, w, h, board, answer, elapsed) {
  const extent = (Math.abs(Math.cos(board.angle)) * board.height + Math.abs(Math.sin(board.angle)) * board.width) / 2;
  const above = board.y - extent, below = h - board.y - extent;
  const available = Math.max(above, below) - 12;
  let size = Math.min(28, Math.max(17, Math.round(w / 19))), q, a, height;
  ctx.save();
  do {
    ctx.font = '600 ' + size + 'px system-ui';
    q = lines(ctx, question, w - 48);
    ctx.font = size + 'px system-ui';
    a = lines(ctx, answer, w - 48);
    height = (q.length + a.length) * size * 1.23 + 24;
    if (height <= available || size <= 14) break;
    size--;
  } while (true);
  let y = above >= below ? above - height - 6 : board.y + extent + 6;
  if (height > available) {
    // On shallow landscape screens reserve a caption band below the entire live scene.
    const scale = Math.max(0, (h - height - 6) / h);
    ctx.drawImage(ctx.canvas, (w - w * scale) / 2, 0, w * scale, h * scale);
    ctx.fillStyle = '#111820';
    ctx.fillRect(0, 0, (w - w * scale) / 2, h);
    ctx.fillRect((w + w * scale) / 2, 0, w, h);
    y = h - height;
  }
  const fade = t => Math.max(0, Math.min(1, t / 950));
  ctx.globalAlpha = fade(elapsed);
  ctx.fillStyle = '#0b111be6';
  ctx.fillRect(8, y, w - 16, height);
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';
  let row = y + 8;
  ctx.font = '600 ' + size + 'px system-ui';
  for (const line of q) { ctx.fillText(line, 24, row); row += size * 1.23; }
  ctx.globalAlpha = fade(elapsed - 1000);
  ctx.fillStyle = '#bcffdf';
  ctx.font = size + 'px system-ui';
  for (const line of a) { ctx.fillText(line, 24, row + 6); row += size * 1.23; }
  ctx.restore();
}
