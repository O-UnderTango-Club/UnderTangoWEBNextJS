// Work with the two visible lower corners, including the plate's rotation.
function bottomEdge(board) {
  const sin = Math.sin(board.angle), cos = Math.cos(board.angle);
  const cx = board.x - sin * board.height / 2, cy = board.y + cos * board.height / 2;
  const halfWidth = cos * board.width / 2, halfRise = Math.abs(sin) * board.width / 2;
  return { left: cx - halfWidth, right: cx + halfWidth, high: cy - halfRise, low: cy + halfRise };
}

function aligned(edge, goal) {
  // A few CSS pixels of clearance allow for sensor noise on a same-width tray.
  const clearance = Math.min(8, Math.max(5, goal.width * 0.02));
  return Math.abs(edge.left - (goal.x - goal.width / 2)) <= clearance &&
    Math.abs(edge.right - (goal.x + goal.width / 2)) <= clearance;
}

export function canSeatPrize(board, goal, edge = bottomEdge(board)) {
  return aligned(edge, goal) && Math.abs(goal.bottom - edge.low) <= 1 &&
    Math.abs(goal.bottom - edge.high) <= 4 && board.vy + board.panVy >= -2 &&
    Math.abs(board.vx + board.panVx) < 36;
}

export function landOnTray(board, goal, view) {
  const speed = Math.max(board.landingSpeed, board.vy + board.panVy);
  if (speed < 0.1) return null;
  const edge = bottomEdge(board);
  const rimY = goal.bottom - goal.lipHeight;
  if (edge.low < rimY) return null;
  const fits = aligned(edge, goal);
  const overlapsTray = edge.right >= goal.x - goal.width / 2 && edge.left <= goal.x + goal.width / 2;
  const contactY = !fits && overlapsTray ? rimY : goal.bottom;
  if (edge.low < contactY - 0.5) return null;
  const soft = Math.min(98, Math.max(63, view.height * 0.13));
  if (speed <= soft && canSeatPrize(board, goal, edge)) return 'seated';

  board.panY = board.panVy = 0;
  board.rebounding = true;
  board.vy = -Math.min(360, Math.max(Math.min(188, view.height * 0.38), speed * 1.4));
  board.y -= Math.max(0, edge.low - contactY) + 1.5;
  return 'rebound';
}

// Let the weight settle onto its base. The gift becomes available on the frame
// where the entire plate actually matches the outline, even if the phone moves.
export function settlePrize(board, goal, entry, dt) {
  entry.progress = Math.min(1, entry.progress + dt / 0.24);
  const remaining = (1 - entry.progress) ** 2;
  board.angle = entry.angle * remaining;
  board.x = goal.x + entry.offsetX * remaining;
  board.y = goal.bottom -
    (board.width * Math.abs(Math.sin(board.angle)) + board.height * Math.cos(board.angle)) / 2;
  board.spin = board.vx = board.vy = 0;
  board.panX = board.panY = board.panVx = board.panVy = 0;
  return entry.progress === 1;
}
