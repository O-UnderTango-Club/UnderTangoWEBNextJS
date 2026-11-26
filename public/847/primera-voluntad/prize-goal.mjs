// A landing is supported when the centre of mass is over the flat part of
// the tray and the lower edge reaches both ends of that short support.
export function canSeatPrize(board, goal) {
  const sin = Math.sin(board.angle), cos = Math.cos(board.angle);
  if (cos < 0.97 || board.vy + board.panVy < -2) return false;
  const footX = board.x - sin * board.height / 2;
  const footY = board.y + cos * board.height / 2;
  const halfSupport = goal.width * 0.37;
  const centerGap = goal.bottom - (footY + (goal.x - footX) * sin / cos);
  return Math.abs(board.x - goal.x) <= goal.width * 0.22 &&
    Math.abs(centerGap) + Math.abs(halfSupport * sin / cos) <= 5 &&
    Math.abs(board.vx + board.panVx) < 62;
}

export function landOnTray(board, goal, view) {
  const approach = board.landingSpeed;
  const lowest = board.y + (Math.abs(Math.sin(board.angle)) * board.width + Math.abs(Math.cos(board.angle)) * board.height) / 2;
  if (goal.bottom - lowest > 3) return null;
  const soft = Math.min(145, Math.max(86, view.height * 0.185));
  if (Math.max(approach, board.vy + board.panVy) <= soft && canSeatPrize(board, goal)) return 'seated';
  if (approach < 24) return null;
  // A hard or unbalanced landing springs back up. Distance and speed depend on
  // the actual approach; easing the phone before contact makes a clean landing.
  board.panY = board.panVy = 0;
  board.rebounding = true;
  board.vy = -Math.min(370, Math.max(170, approach * 1.4));
  board.y -= 3;
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
