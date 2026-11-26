// Positions are in the same CSS pixels as the rotated plate, above the video controls.
export function prizeGoal(view, board) {
  const width = Math.min(360, view.width - view.left - view.right - 8);
  const bottom = view.height - view.bottom;
  const depth = Math.min(48, Math.max(24, (bottom - view.top - board.height) * 0.23));
  return { x: (view.width - width) / 2, y: bottom - depth, width, depth };
}

export function inPrizeGoal(board, goal) {
  // Use the midpoint of the physical lower edge. A tilted corner brushing the goal is insufficient.
  const x = board.x - (Math.sin(board.angle) * board.height) / 2;
  const y = board.y + (Math.cos(board.angle) * board.height) / 2;
  const margin = Math.min(28, goal.width * 0.1);
  return x >= goal.x + margin && x <= goal.x + goal.width - margin && y >= goal.y + goal.depth * 0.42;
}

export function paintPrizeGoal(ctx, goal, active) {
  const { x, y, width, depth } = goal;
  ctx.save();
  ctx.fillStyle = active ? 'rgba(26,79,69,.93)' : 'rgba(9,18,26,.86)';
  ctx.fillRect(x, y, width, depth);
  ctx.strokeStyle = active ? '#fff6ce' : '#99ecd3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 1);
  ctx.lineTo(x + 1, y + depth - 1);
  ctx.lineTo(x + width - 1, y + depth - 1);
  ctx.lineTo(x + width - 1, y + 1);
  ctx.stroke();
  ctx.fillStyle = '#f5fff8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '650 ' + Math.min(16, Math.max(12, width / 23)) + 'px system-ui, sans-serif';
  ctx.fillText('Bajá el cuadro acá para ganar tu premio', x + width / 2, y + depth / 2, width - 16);
  ctx.restore();
}
