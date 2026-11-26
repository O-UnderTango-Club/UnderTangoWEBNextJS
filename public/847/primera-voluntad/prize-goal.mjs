// Intersect the lower face with the visible base and the two short posts.
export function touchesTray(board, goal) {
  const sin = Math.sin(board.angle), cos = Math.cos(board.angle);
  const footX = board.x - sin * board.height / 2, footY = board.y + cos * board.height / 2;
  const half = cos * board.width / 2;
  const left = goal.x - goal.width / 2, right = goal.x + goal.width / 2;
  const from = Math.max(footX - half, left), to = Math.min(footX + half, right);
  if (from > to) return false;
  const slope = sin / cos;
  const y1 = footY + (from - footX) * slope, y2 = footY + (to - footX) * slope;
  const rim = goal.bottom - goal.lipHeight - 0.5;
  return Math.max(y1, y2) >= goal.bottom - 0.5 ||
    (from === left && y1 >= rim) || (to === right && y2 >= rim);
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
