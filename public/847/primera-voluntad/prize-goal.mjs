// Only the lower edge of the drawn silhouette acts as a support. A plate may
// come in on one corner after a collision, provided its face is lined up.
export function canSeatPrize(board, goal) {
  const bottom = board.y +
    (board.width * Math.abs(Math.sin(board.angle)) + board.height * Math.abs(Math.cos(board.angle))) / 2;
  const centerMargin = Math.min(24, Math.max(15, board.width * 0.075));
  return Math.abs(goal.bottom - bottom) <= 3 &&
    Math.abs(board.x - goal.x) <= centerMargin &&
    Math.abs(board.angle) <= 0.28 && Math.abs(board.y - goal.y) <= board.height * 0.32;
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
