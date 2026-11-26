// Work with the two visible lower corners, including the plate's rotation.
function bottomEdge(board) {
  const sin = Math.sin(board.angle), cos = Math.cos(board.angle);
  const cx = board.x - sin * board.height / 2, cy = board.y + cos * board.height / 2;
  const halfWidth = cos * board.width / 2, halfRise = sin * board.width / 2;
  return { left: cx - halfWidth, right: cx + halfWidth, leftY: cy - halfRise, rightY: cy + halfRise };
}

function clearance(width) {
  // A few CSS pixels of clearance allow for sensor noise on a same-width tray.
  return Math.min(8, Math.max(5, width * 0.02));
}

export function canSeatPrize(board, goal, edge = bottomEdge(board)) {
  const room = clearance(goal.width);
  return Math.abs(edge.left - (goal.x - goal.width / 2)) <= room &&
    Math.abs(edge.right - (goal.x + goal.width / 2)) <= room &&
    Math.abs(goal.bottom - edge.leftY) <= 4 && Math.abs(goal.bottom - edge.rightY) <= 4 &&
    Math.abs(goal.bottom - Math.max(edge.leftY, edge.rightY)) <= 1 &&
    board.vy + board.panVy >= -2 && Math.abs(board.vx + board.panVx) < 36;
}

export function landOnTray(board, goal, view) {
  const speed = Math.max(board.landingSpeed, board.vy + board.panVy);
  if (speed < 0.1) return null;
  const edge = bottomEdge(board);
  const rimY = goal.bottom - goal.lipHeight;
  const low = Math.max(edge.leftY, edge.rightY);
  if (low < rimY - 0.5) return null;
  let overlap = low - goal.bottom;
  const left = goal.x - goal.width / 2, right = goal.x + goal.width / 2;
  const room = clearance(goal.width);
  // A tilted corner inside the opening can pass a post. Only the part of
  // the lower face directly over that post can hit its top.
  const slope = (edge.rightY - edge.leftY) / (edge.right - edge.left);
  if (edge.left < left - room && left <= edge.right)
    overlap = Math.max(overlap, edge.leftY + (left - edge.left) * slope - rimY);
  if (edge.right > right + room && right >= edge.left)
    overlap = Math.max(overlap, edge.rightY - (edge.right - right) * slope - rimY);
  if (overlap < -0.5) return null;
  const soft = Math.min(98, Math.max(63, view.height * 0.13));
  if (speed <= soft && canSeatPrize(board, goal, edge)) return 'seated';

  board.panY = board.panVy = 0;
  board.rebounding = true;
  board.vy = -Math.min(360, Math.max(Math.min(188, view.height * 0.38), speed * 1.4));
  board.y -= Math.max(0, overlap) + 1.5;
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
