const clamp = (value, low, high) => Math.max(low, Math.min(value, high));

// Place the touch target inside the free toolbar space, within reach of the wide plate.
export function prizeGoal(view, board, slot) {
  const reachLeft = view.left + board.width / 2 + 2;
  const reachRight = view.width - view.right - board.width / 2 - 2;
  const preferred = view.width / 2 + Math.min(64, view.width * 0.068);
  const x = clamp(clamp(preferred, reachLeft, reachRight), slot.left + 22, slot.right - 22);
  return {
    x,
    floor: view.height - view.bottom,
    tolerance: clamp(view.width * 0.03, 9, 17) + Math.max(0, x - reachRight, reachLeft - x),
  };
}

export class SecretDock {
  constructor() {
    this.since = null;
    this.ready = false;
  }

  update(board, goal, now, hasLine, steered) {
    if (this.ready) return 'ready';
    const sin = Math.sin(board.angle), cos = Math.cos(board.angle);
    const edgeX = board.x - sin * board.height / 2;
    const lowest = board.y + (Math.abs(sin) * board.width + Math.abs(cos) * board.height) / 2;
    const gap = goal.floor - lowest;
    if (!hasLine || gap > 20) {
      this.since = null;
      return 'hidden';
    }
    const centered = Math.abs(edgeX - goal.x) <= goal.tolerance;
    const settled = Math.abs(board.vx + board.panVx) < 55 && now - board.lastContact > 220;
    if (gap > 7 || !centered || !settled || (this.since === null && !steered)) {
      this.since = null;
      return 'near';
    }
    this.since ??= now;
    if (now - this.since < 700) return 'holding';
    this.ready = true;
    return 'ready';
  }
}
