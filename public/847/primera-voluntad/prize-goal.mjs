// A touch on the base or either post catches the plate, including edge-on.
export function touchesTray(board, goal) {
  const sin = Math.sin(board.angle), cos = Math.cos(board.angle);
  const hw = board.width / 2 + 0.5, hh = board.height / 2 + 0.5;
  const rim = goal.bottom - goal.lipHeight;
  if (board.y + hw * Math.abs(sin) + hh * Math.abs(cos) < rim) return false;

  // Project a tray segment onto the two plate axes and the segment normal.
  // Its centre and half-vector are expressed in the plate's local coordinates.
  function intersects(x, y, hx, hy) {
    const dx = x - board.x, dy = y - board.y;
    const u = dx * cos + dy * sin, v = dy * cos - dx * sin;
    const a = hx * cos + hy * sin, b = hy * cos - hx * sin;
    return Math.abs(u) <= hw + Math.abs(a) && Math.abs(v) <= hh + Math.abs(b) &&
      Math.abs(u * b - v * a) <= hw * Math.abs(b) + hh * Math.abs(a);
  }
  const half = goal.width / 2, post = goal.lipHeight / 2;
  return intersects(goal.x, goal.bottom, half, 0) ||
    intersects(goal.x - half, rim + post, 0, post) ||
    intersects(goal.x + half, rim + post, 0, post);
}

// Catch at the first contact and slide continuously from that pose to the seat.
export function settlePrize(board, goal, entry, dt) {
  entry.progress = Math.min(1, entry.progress + dt / 0.24);
  const remaining = (1 - entry.progress) ** 2;
  board.angle = entry.angle * remaining;
  board.x = goal.x + entry.offsetX * remaining;
  board.y = goal.bottom - board.height / 2 + entry.offsetY * remaining;
  board.spin = board.vx = board.vy = 0;
  board.panX = board.panY = board.panVx = board.panVy = 0;
  board.rebounding = false;
  return entry.progress === 1;
}
